import { fetchTA, TAData } from "./taapi";
import { lastClose } from "../../utils/candles";

export interface ClassificationResult {
  symbol: string;
  regime: "trending" | "ranging";
  confidence: number;
  lastPrice: number;
  indicators: TAData;
}

export async function classify(symbol: string): Promise<ClassificationResult> {
  const [price, ta] = await Promise.all([lastClose(symbol), fetchTA(symbol)]);
  const trending = price > ta.ema20 && ta.adx > 25;
  return {
    symbol,
    regime: trending ? "trending" : "ranging",
    confidence: trending ? Math.min(ta.adx / 50, 1) : 0.5,
    lastPrice: price,
    indicators: ta
  };
}
