import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

export type Regime = "trending" | "ranging";

const schema = z.object({
  regime: z.enum(["trending", "ranging"]),
  confidence: z.number().min(0).max(1),
});

export async function classifyWithLLM(params: {
  symbol: string;
  ema20: number;
  ema200?: number;
  adx: number;
  pctChange1h?: number;
}) {
  const { object } = await generateObject({
    model: openai("gpt-4o"),           // works equally with gpt‑4o‑mini etc.
    schema,
    prompt: `
You are a professional crypto analyst.
Given the 1‑hour data for ${params.symbol}:
  • EMA‑20:  ${params.ema20}
  • EMA‑200: ${params.ema200 ?? 'N/A'}
  • ADX:     ${params.adx}
  • Δ% 1h:   ${params.pctChange1h ?? 'N/A'}

If price shows directional momentum (ADX > 25 **or** |Δ%| > 1 %) return "trending",
otherwise return "ranging".

Respond **only** with JSON that matches the schema.
`,
  });

  return object; // { regime: 'trending', confidence: 0.82 }
}
