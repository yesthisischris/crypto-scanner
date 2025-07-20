import axios from "axios";

export async function lastClose(symbol: string) {
  const res = await axios.get(
    "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest",
    {
      headers: { "X-CMC_PRO_API_KEY": process.env.CMC_KEY || "" },
      params: { symbol }
    }
  );
  // CMC returns nested JSON; extract last price
  return res.data.data[symbol][0].quote.USD.price as number;
}
