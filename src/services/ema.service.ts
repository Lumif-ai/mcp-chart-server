import { EMAIndicator, dropna } from "../utils/indicator.js";
import { MongoDB } from "./mongodb.service.js";
import { fetchBinanceOHLCVData } from "../utils/binance.utils.js";

export interface EMAResult {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: string;
  trend_ema_fast: number;
  trend_ema_slow: number;
}

export async function calculateEMAs(
  agentName: string,
  timeAgo: string,
  interval: number,
  intervalFrequency: string,
): Promise<EMAResult[]> {
  const startTime = Date.now();
  console.error(`Starting EMA calculation for ${agentName}`);

  try {
    // Fetch agents
    const agentsFetched = await MongoDB.fetchAgentsLikeName(agentName);

    if (agentsFetched.length === 0) {
      throw new Error(`No agents found with the name ${agentName}`);
    }

    // Use the first agent retrieved
    const agent = agentsFetched[0];
    const data = await fetchBinanceOHLCVData(
      agent,
      timeAgo,
      interval,
      intervalFrequency,
    );

    // Process the data
    const closes = data.map((d) => d.close);

    // Calculate EMAs
    const emaFast = new EMAIndicator(closes, 12, true).calculateEMA();
    const emaSlow = new EMAIndicator(closes, 26, true).calculateEMA();

    // Combine data
    const results = data.map((d, i) => ({
      ...d,
      volume: d.volume.toFixed(10),
      trend_ema_fast: emaFast[i],
      trend_ema_slow: emaSlow[i],
    }));

    // Drop NA values
    const cleanResults = dropna(results) as EMAResult[];

    const executionTime = (Date.now() - startTime) / 1000;
    console.error(
      `EMA calculation completed in ${executionTime.toFixed(2)} seconds`,
    );

    return cleanResults;
  } catch (error) {
    const executionTime = (Date.now() - startTime) / 1000;
    console.error(
      `Error in EMA calculation after ${executionTime.toFixed(2)} seconds: ${error}`,
    );
    throw error;
  }
}
