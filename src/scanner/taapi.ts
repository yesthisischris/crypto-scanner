import axios from "axios";

export interface TAData {
  ema20: number;
  adx: number;
}

const base = "https://api.taapi.io";

// Cache for 65s to stay under free-tier limit
const cache = new Map<string, { t: number, val: TAData }>()

export async function fetchTA(symbol: string): Promise<TAData> {
  const key = symbol.toUpperCase()
  const hit = cache.get(key)
  if (hit && Date.now() - hit.t < 65_000) return hit.val

  const [ema20, adx] = await Promise.all([
    axios
      .get(`${base}/ema`, {
        params: { 
          secret: process.env.TAAPI_KEY, 
          exchange: "binance", 
          symbol: `${symbol}/USDT`,
          interval: "1h", 
          period: 20 
        }
      })
      .then(r => r.data.value),
    axios
      .get(`${base}/adx`, {
        params: { 
          secret: process.env.TAAPI_KEY, 
          exchange: "binance", 
          symbol: `${symbol}/USDT`,
          interval: "1h" 
        }
      })
      .then(r => r.data.value)
  ]);

  const data = { ema20, adx };
  cache.set(key, { t: Date.now(), val: data })
  return data;
}
