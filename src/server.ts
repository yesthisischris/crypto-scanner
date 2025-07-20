import 'dotenv/config';
import express from 'express';

import { cryptoScannerTool } from './agents/cryptoScanner/index.js';

// ---------------------------------------------------------------------------
// Guard-rails: make sure API keys exist at startup.
// ---------------------------------------------------------------------------
if (!process.env.TAAPI_KEY || !process.env.CMC_KEY) {
  throw new Error(
    'Environment variables TAAPI_KEY and CMC_KEY must be set before starting the server.'
  );
}

// ---------------------------------------------------------------------------
// Express bootstrap
// ---------------------------------------------------------------------------
const app = express();

// Express parses JSON bodies by default from v4.19 when content-type is
// application/json. If you use an older minor, keep explicit middleware:
app.use(express.json());

// `cryptoScannerTool.httpHandler()` in MCP SDK returns an Express-style
// `(req,res,next)` function, so we can mount it directly.
app.use('/scan', cryptoScannerTool.httpHandler());

const PORT = Number(process.env.PORT) || 8787;

app.listen(PORT, () => {
  console.log(`🚀 simple-trader server running at http://localhost:${PORT}/scan`);
});
