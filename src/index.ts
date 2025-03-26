import "dotenv/config";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import express, { Request, Response } from "express";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { MongoDB } from "./services/mongodb.service.js";
import { calculateEMAs } from "./services/ema.service.js";
import { getOHLCVData } from "./services/ohlcv.service.js";
import { fetchBinanceOHLCVData } from "./utils/binance.utils.js";
import { generateCandlestickChart } from "./utils/chart.utils.js";
import path from "path";
import fs from "fs/promises";

const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";

// Create server instance
const server = new McpServer({
  name: "mcp-chart",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

const transports: { [sessionId: string]: SSEServerTransport } = {};

function setupExpressServer() {
  const app = express();
  app.get("/sse", async (_: Request, res: Response) => {
    const transport = new SSEServerTransport("/messages", res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
      delete transports[transport.sessionId];
    });
    await server.connect(transport);
  });

  app.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).send("No transport found for sessionId");
    }
  });

  app.get("/candlestick", async (req: Request, res: Response) => {
    try {
      // Get query parameters
      const { token_name, time_ago, interval, interval_frequency } = req.query;

      // Validate input parameters
      if (!token_name || !time_ago || !interval || !interval_frequency) {
        return res.status(400).json({
          error:
            "Missing required parameters: token_name, time_ago, interval, interval_frequency",
        });
      }

      // Validate interval_frequency
      const validFrequencies = ["minutes", "hours", "days", "weeks", "months"];
      if (!validFrequencies.includes(interval_frequency as string)) {
        return res.status(400).json({
          error:
            "Invalid interval_frequency. Must be one of: minutes, hours, days, weeks, months",
        });
      }

      const chart = await getCandlestickChart({
        token_name: token_name as string,
        time_ago: time_ago as string,
        interval: Number(interval),
        interval_frequency: interval_frequency as string,
      });

      res.setHeader("Content-Type", "image/svg+xml");
      res.send(Buffer.from(chart.data.chart, "base64"));
    } catch (error) {
      console.error("Error generating candlestick chart:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  app.listen(3001);
}

async function getCandlestickChart({
  token_name,
  time_ago,
  interval,
  interval_frequency,
}: {
  token_name: string;
  time_ago: string;
  interval: number;
  interval_frequency: string;
}) {
  try {
    // Use the new getOHLCVData service instead of direct Binance fetch
    const data = await getOHLCVData(
      token_name,
      time_ago,
      interval,
      interval_frequency,
    );

    // Generate chart
    const chartBase64 = await generateCandlestickChart(data, token_name);

    return {
      success: true,
      data: {
        token_name,
        chart: chartBase64,
      },
    };
  } catch (error) {
    throw error;
  }
}

// Register tool
server.tool(
  "get_alerts",
  "Get weather alerts for a state",
  {
    state: z.string().length(2).describe("Two-letter state code (e.g. CA, NY)"),
  },
  async ({ state }) => {
    return {
      content: [
        {
          type: "text",
          text: "Hurricane warning in your area!",
        },
      ],
    };
  },
);

server.tool(
  "get_emas",
  "Calculate EMAs for a given token's price data",
  {
    token_name: z
      .string()
      .describe("Simple name of the token like ETH, BNB, BTC etc."),
    time_ago: z
      .string()
      .describe("ISO date string (e.g., '2023-01-01T00:00:00Z')"),
    interval: z.number().positive().describe("Interval value"),
    interval_frequency: z
      .enum(["minutes", "hours", "days", "weeks", "months"])
      .describe("Interval frequency"),
  },
  async ({ token_name, time_ago, interval, interval_frequency }) => {
    try {
      const emaData = await calculateEMAs(
        token_name,
        time_ago,
        interval,
        interval_frequency,
      );

      return {
        content: [
          {
            type: "text",
            text: `EMA calculation completed for ${token_name}-
            ${JSON.stringify(emaData)}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error in get-emas tool:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error calculating EMAs: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "get_candlestick",
  "Generate a candlestick chart for a given token",
  {
    token_name: z
      .string()
      .describe("Simple name of the token like ETH, BNB, BTC etc."),
    time_ago: z
      .string()
      .describe("ISO date string (e.g., '2023-01-01T00:00:00Z')"),
    interval: z.number().positive().describe("Interval value"),
    interval_frequency: z
      .enum(["minutes", "hours", "days", "weeks", "months"])
      .describe("Interval frequency"),
  },
  async ({ token_name, time_ago, interval, interval_frequency }) => {
    try {
      // Use the new getOHLCVData service
      const data = await getOHLCVData(
        token_name,
        time_ago,
        interval,
        interval_frequency,
      );

      // Generate chart
      const chartBase64 = await generateCandlestickChart(data, token_name);

      console.error("Chart generated", chartBase64);
      return {
        content: [
          {
            type: "text",
            text: `Generated candlestick chart for ${token_name}. Below is the base64 encoded SVG data:\n\n${chartBase64}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error in get-candlestick tool:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error generating candlestick chart: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
      };
    }
  },
);

server.resource(
  "candlestick_chart",
  new ResourceTemplate("file://candlestick/{tokenName}", { list: undefined }),
  async (uri, { tokenName }) => {
    const files = await fs.readdir("dist/charts");
    const chartFile = files.find(
      (f) =>
        typeof tokenName === "string" &&
        f.startsWith(tokenName.toLowerCase()) &&
        f.includes("candlestick") &&
        f.endsWith(".svg"),
    );

    if (!chartFile) {
      throw new Error(`Chart not found for token ${tokenName}`);
    }

    const chartPath = path.join("dist/charts", chartFile);
    const chartData = await fs.readFile(chartPath);
    const base64Data = chartData.toString("base64");

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "image/svg+xml",
          blob: base64Data,
        },
      ],
    };
  },
);
// async function main() {
//   const transport = new StdioServerTransport();
//   await server.connect(transport);
//   console.error("Weather MCP Server running on stdio");
// }

async function main() {
  try {
    // Initialize MongoDB connection
    await MongoDB.initClient();

    setupExpressServer();

    // const transport = new SSEServerTransport();
    // await server.connect(transport);
    console.error("TA Charts MCP Server running on SSE");
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

// Cleanup function
async function cleanup() {
  await MongoDB.closeClient();
  process.exit(0);
}

// Handle process termination
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

main().catch((error) => {
  console.error("Fatal error in main(): ", error);
  process.exit(1);
});
