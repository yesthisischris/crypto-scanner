import axios from "axios";

export interface TAData {
  ema20: number;
  adx: number;
}

const base = "https://api.taapi.io";

export async function fetchTA(symbol: string): Promise<TAData> {
  const [ema20, adx] = await Promise.all([
    axios
      .get(`${base}/ema`, {
        params: { secret: process.env.TAAPI_KEY, exchange: "binance", symbol: `${symbol}/USDT`, interval: "1h", optInTimePeriod: 20 }
      })
      .then(r => r.data.value),
    axios
      .get(`${base}/adx`, {
        params: { secret: process.env.TAAPI_KEY, exchange: "binance", symbol: `${symbol}/USDT`, interval: "1h" }
      })
      .then(r => r.data.value)
  ]);

  return { ema20, adx };
}
