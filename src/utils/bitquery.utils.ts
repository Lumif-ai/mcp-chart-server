import axios from "axios";
import { Agent, OHLCVData } from "../models/agent.model";

const BITQUERY_API_KEY = process.env.BITQUERY_API_KEY;
const BITQUERY_URL = "https://streaming.bitquery.io/graphql";

interface BitquerySuccessResponse {
  data: {
    EVM: {
      DEXTradeByTokens: Array<{
        Block: {
          Time: string;
        };
        min: number;
        max: number;
        volume: string;
        Trade: {
          open: number;
          close: number;
        };
      }>;
    };
  };
}

interface BitqueryErrorResponse {
  data: {
    errors: Array<{
      message: string;
      locations?: Array<{
        line: number;
        column: number;
      }>;
      path?: string[];
      extensions?: {
        code?: string;
        [key: string]: unknown;
      };
    }>;
  };
}

// Combined type for all possible response types
type BitqueryResponse = BitquerySuccessResponse | BitqueryErrorResponse;

export async function fetchBitqueryOHLCVData(
  agent: Agent,
  timeAgo: string,
  interval: number,
  intervalFrequency: string,
): Promise<OHLCVData[]> {
  try {
    const query = `
      query tradingViewPairs(
        $network: evm_network,
        $dataset: dataset_arg_enum,
        $interval: Int,
        $token: String,
        $base: String,
        $time_ago: DateTime,
        $interval_frequency: OLAP_DateTimeIntervalUnits
      ) {
        EVM(network: $network, dataset: $dataset) {
          DEXTradeByTokens(
            where: {
              Trade: {
                Side: {
                  Amount: {gt: "0"},
                  Currency: {SmartContract: {is: $token}}
                },
                Currency: {SmartContract: {is: $base}}
              },
              Block: {Time: {since: $time_ago}}
            }
            orderBy: {ascendingByField: "Block_Time"}
          ) {
            Block {
              Time(interval: {count: $interval, in: $interval_frequency})
            }
            min: quantile(of: Trade_PriceInUSD, level: 0.1)
            max: quantile(of: Trade_PriceInUSD, level: 0.9)
            volume: sum(of: Trade_Side_AmountInUSD)
            Trade {
              open: PriceInUSD(minimum: Block_Time)
              close: PriceInUSD(maximum: Block_Time)
            }
          }
        }
      }
    `;

    const variables = {
      network: mapChainName(agent.base_chain),
      base: agent.base_token_address,
      token: agent.quote_token_address,
      time_ago: timeAgo,
      interval: interval,
      dataset: "archive",
      interval_frequency: intervalFrequency,
    };

    const response = await axios.post<BitqueryResponse>(
      BITQUERY_URL,
      {
        query,
        variables,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BITQUERY_API_KEY}`,
        },
      },
    );

    // Check for errors in the response
    if ("errors" in response.data.data) {
      throw new Error(
        `Bitquery error: ${(response.data.data as BitqueryErrorResponse["data"]).errors[0].message}`,
      );
    }

    const successData = response.data as BitquerySuccessResponse;

    if (!successData.data) {
      throw new Error("No data received from Bitquery.");
    }

    if (successData.data.EVM?.DEXTradeByTokens) {
      return successData.data.EVM.DEXTradeByTokens.map(
        (
          trade: BitquerySuccessResponse["data"]["EVM"]["DEXTradeByTokens"][0],
        ) => ({
          time: Math.floor(new Date(trade.Block.Time).getTime() / 1000),
          open: trade.Trade.open,
          high: trade.max,
          low: trade.min,
          close: trade.Trade.close,
          volume: parseFloat(trade.volume),
        }),
      );
    }

    throw new Error("No trades found for the given token and quote currency.");
  } catch (error) {
    console.error("Error fetching Bitquery OHLCV data:", error);
    throw error;
  }
}

function mapChainName(chainName: string): string {
  // Implement chain name mapping logic here
  const chainMap: { [key: string]: string } = {
    ethereum: "eth",
    arbitrum: "arbitrum",
    "binance smart chain": "bsc",
    bsc: "bsc",
    base: "base",
    polygon: "matic",
    optimism: "optimism",
    opbnb: "opbnb",
  };
  return chainMap[chainName.toLowerCase()] || chainName.toLowerCase();
}
