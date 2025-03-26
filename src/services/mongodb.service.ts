import { MongoClient, Db } from "mongodb";
import { MONGODB_CONFIG } from "../config/mongodb.config.js";
import { Agent } from "../models/agent.model.js";

export class MongoDB {
  private static client: MongoClient | null = null;
  private static db: Db | null = null;

  static async initClient(): Promise<void> {
    if (!this.client) {
      this.client = await MongoClient.connect(MONGODB_CONFIG.uri);
      this.db = this.client.db(MONGODB_CONFIG.dbName);
    }
  }

  static async getDb(): Promise<Db> {
    if (!this.client || !this.db) {
      await this.initClient();
    }
    return this.db!;
  }

  static async closeClient(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  static async fetchAgentsLikeName(partialName: string): Promise<Agent[]> {
    const db = await this.getDb();
    const collection = db.collection("ai_agents");

    const pipeline = [
      {
        $search: {
          index: "default_text_index",
          phrase: {
            query: partialName,
            path: ["agent_name", "base_token_symbol"],
          },
        },
      },
    ];

    const results = await collection.aggregate(pipeline).toArray();
    return results.map((doc) => ({
      agent_name: doc.agent_name,
      base_token_symbol: doc.base_token_symbol,
      quote_token_symbol: doc.quote_token_symbol,
      dex_id: doc.dex_id,
      base_token_address: doc.base_token_address,
      quote_token_address: doc.quote_token_address,
      base_chain: doc.base_chain,
    })) as Agent[];
  }
}
