import "dotenv/config";
import { serve } from "vercel-ai/sdk";
import { cryptoScannerTool } from "./agents/cryptoScanner";

serve({
  "/scan": cryptoScannerTool.httpHandler()
});
