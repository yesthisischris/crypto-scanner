import { z } from 'zod'
import { classify } from './classify'

export const ToolName = 'crypto_scanner_1h_regime'

export const ToolConfig = {
  title: 'Crypto Scanner (1‑h)',
  description: 'Returns trending / ranging regime for a crypto asset',
  inputSchema: {
    symbol: z.string()
  },
  outputSchema: {
    symbol: z.string(),
    regime: z.enum(['trending', 'ranging']),
    confidence: z.number(),
    lastPrice: z.number(),
    indicators: z.record(z.string(), z.number()).optional(),
    reasoning: z.string().optional(),
    model: z.string().optional()
  }
}

export async function toolHandler({ symbol }: { symbol: string }) {
  const result = await classify(symbol)
  return {
    content: [{ type: 'json', json: result }]
  }
}
