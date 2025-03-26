import { Agent, OHLCVData } from "../models/agent.model";
import { fetchBinanceOHLCVData } from "../utils/binance.utils";
import { fetchBitqueryOHLCVData } from "../utils/bitquery.utils";
import { MongoDB } from "./mongodb.service";

export async function getOHLCVData(
  agentName: string,
  timeAgo: string,
  interval: number,
  intervalFrequency: string,
): Promise<OHLCVData[]> {
  const startTime = Date.now();
  console.error(`Starting OHLCV data fetch for agent: ${agentName}`);

  try {
    // Fetch agents
    const agentsFetched = await MongoDB.fetchAgentsLikeName(agentName);

    if (agentsFetched.length === 0) {
      throw new Error(`No agents found with the name ${agentName}`);
    }

    // Use the first agent retrieved
    const agent = agentsFetched[0];
    const dexId = agent.dex_id?.toLowerCase();

    console.error(`Agent fetched: ${JSON.stringify(agent)}`);
    console.error(`DEX ID: ${dexId}`);

    // Handle Binance data
    if (dexId === "binance") {
      return fetchBinanceOHLCVData(agent, timeAgo, interval, intervalFrequency);
    }

    // For all other DEXes, use Bitquery
    return fetchBitqueryOHLCVData(agent, timeAgo, interval, intervalFrequency);
  } catch (error) {
    const executionTime = (Date.now() - startTime) / 1000;
    console.error(
      `Error in OHLCV data fetch after ${executionTime.toFixed(2)} seconds: ${error}`,
    );
    throw error;
  }
}
