export interface Agent {
  agent_name: string;
  base_token_symbol: string;
  quote_token_symbol: string;
  dex_id?: string;
  base_token_address?: string;
  quote_token_address?: string;
  base_chain: string;
}
export interface OHLCVData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
