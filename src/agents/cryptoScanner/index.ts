import { createMCPHandler } from "model-context-protocol";
import { InputSchema, OutputSchema } from "./schema";
import { classify } from "./classify";

export const cryptoScannerTool = createMCPHandler({
  name: "crypto_scanner_1h_regime",
  description: "Returns trending vs ranging for a crypto symbol.",
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  execute: async ({ symbol }) => classify(symbol)
});
