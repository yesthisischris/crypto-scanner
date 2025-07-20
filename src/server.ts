import "dotenv/config";
import { serve } from "ai/server";
import { cryptoScannerTool } from "./agents/cryptoScanner";

if (!process.env.TAAPI_KEY || !process.env.CMC_KEY) {
  throw new Error("TAAPI_KEY and CMC_KEY must be set in the environment");
}

serve({
  "/scan": cryptoScannerTool.httpHandler()
});
