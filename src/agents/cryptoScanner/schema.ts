import { z } from "zod";

export const InputSchema = z.object({
  symbol: z.string().min(1).describe("e.g., BTC or ETH")
});

export const OutputSchema = z.object({
  symbol: z.string(),
  regime: z.enum(["trending", "ranging"]),
  confidence: z.number().min(0).max(1),
  lastPrice: z.number(),
  indicators: z
    .object({
      ema20: z.number(),
      adx: z.number()
    })
    .optional()
});
