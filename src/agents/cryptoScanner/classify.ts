import { fetchTA } from "./taapi";
import { lastClose } from "../../utils/candles";

export async function classify(symbol: string) {
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
