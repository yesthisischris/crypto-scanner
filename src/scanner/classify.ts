import { fetchTA, TAData } from "./taapi.js";
import axios from "axios";
import { classifyWithLLM } from "../llm/classifyWithLLM.js";

async function lastClose(symbol: string) {
  const res = await axios.get(
    "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest",
    {
      headers: { "X-CMC_PRO_API_KEY": process.env.CMC_KEY || "" },
      params: { symbol },
      timeout: 5000
    }
  );
  return res.data.data[symbol][0].quote.USD.price as number;
}

export interface ClassificationResult {
  symbol: string;
  regime: "trending" | "ranging" | "unknown";
  confidence: number;
  lastPrice: number;
  indicators: TAData | Record<string, never>;
  model?: string;
}

export async function classify(symbol: string): Promise<ClassificationResult> {
  try {
    const [price, ta] = await Promise.all([lastClose(symbol), fetchTA(symbol)]);
    
    const llmResult = await classifyWithLLM({
      symbol,
      ema20: ta.ema20,
      adx: ta.adx,
    });

    return {
      symbol,
      regime: llmResult.regime,
      confidence: llmResult.confidence,
      lastPrice: price,
      indicators: ta,
      model: "gpt-4o"
    };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { status?: number } }
    console.error('[classify] external API failed:', error.message)
    return {
      symbol,
      regime: 'unknown',
      confidence: 0,
      lastPrice: NaN,
      indicators: {},
      model: 'error_'+(error.response?.status ?? 'n/a')
    }
  }
}
