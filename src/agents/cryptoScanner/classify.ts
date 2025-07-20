import { fetchTA, TAData } from "./taapi";
import { lastClose } from "../../utils/candles";

export interface ClassificationResult {
  symbol: string;
  regime: "trending" | "ranging" | "unknown";
  confidence: number;
  lastPrice: number;
  indicators: TAData | {};
  model?: string;
}

export async function classify(symbol: string): Promise<ClassificationResult> {
  try {
    const [price, ta] = await Promise.all([lastClose(symbol), fetchTA(symbol)]);
    const trending = price > ta.ema20 && ta.adx > 25;
    return {
      symbol,
      regime: trending ? "trending" : "ranging",
      confidence: trending ? Math.min(ta.adx / 50, 1) : 0.5,
      lastPrice: price,
      indicators: ta
    };
  } catch (err: any) {
    console.error('[classify] external API failed:', err.message)
    return {
      symbol,
      regime: 'unknown',
      confidence: 0,
      lastPrice: NaN,
      indicators: {},
      model: 'error_'+(err.response?.status ?? 'n/a')
    }
  }
}
