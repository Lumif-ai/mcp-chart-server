import { Agent, OHLCVData } from "../models/agent.model.js";
import { MongoDB } from "../services/mongodb.service.js";
// import { Logger } from "./logger";

interface IntervalMap {
  [key: string]: string;
}

const INTERVAL_MAP: IntervalMap = {
  minutes: "m",
  hours: "h",
  days: "d",
  weeks: "w",
  months: "M",
};

export async function fetchBinanceOHLCVData(
  agent: Agent,
  timeAgo: string,
  interval: number,
  intervalFrequency: string,
): Promise<OHLCVData[]> {
  try {
    const db = await MongoDB.getDb();
    const collection = db.collection("ohlcv_data");

    const sinceTime = new Date(timeAgo);
    const symbol = `${agent.base_token_symbol}${agent.quote_token_symbol}`;
    const binanceInterval = `${interval}${INTERVAL_MAP[intervalFrequency] || "m"}`;

    const pipeline = [
      {
        $match: {
          "metadata.symbol": symbol,
          "metadata.interval": binanceInterval,
          t: { $gte: sinceTime },
        },
      },
      {
        $project: {
          time: { $toLong: "$t" },
          open: "$o",
          high: "$h",
          low: "$l",
          close: "$c",
          volume: "$v",
        },
      },
      {
        $sort: { time: 1 },
      },
    ];

    const results = await collection.aggregate(pipeline).toArray();

    if (!results.length) {
      throw new Error(
        `No data found for symbol ${symbol} with interval ${binanceInterval}`,
      );
    }

    // Convert timestamps from milliseconds to seconds and ensure all required fields
    return results.map((result) => ({
      time: Math.floor(result.time / 1000),
      open: result.open,
      high: result.high,
      low: result.low,
      close: result.close,
      volume: result.volume,
    })) as OHLCVData[];
  } catch (error) {
    console.error(`Error fetching Binance OHLCV data: ${error}`);
    throw error;
  } finally {
    console.error(
      `Completed Binance OHLCV data fetch attempt for symbol ${agent.base_token_symbol}`,
    );
  }
}
