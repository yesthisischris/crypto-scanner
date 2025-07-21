// src/server.ts --------------------------------------------------------------
import 'dotenv/config';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport }
        from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { toolHandler } from './scanner/index.js';

/* ── 0. Basic env‑guardrails ─────────────────────────────────────────────── */
['TAAPI_KEY', 'CMC_KEY', 'OPENAI_API_KEY'].forEach(key => {
  if (!process.env[key]) process.stderr.write(`${key} missing – see README\n`);
});

/* ── 1. Create & configure the MCP server ────────────────────────────────── */
const mcp = new McpServer({
  name:  'crypto-scanner',
  version: '1.1.0'
});

/* ----- Register the single tool ------------------------------------------ */
mcp.registerTool(
  'classify_asset',
  {
    title: 'Classify a crypto asset',
    description: 'Return "trending" or "ranging" for the given symbol',
    inputSchema: {
      symbol: z.string().describe('Crypto symbol (e.g. BTC, ETH)')
    }
  },
  async ({ symbol }) => toolHandler({ symbol }) 
);

/* ── 2. HTTP transport with session management ───────────────────────────── */
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  enableJsonResponse: true,
  enableDnsRebindingProtection: true,
  allowedHosts: [
    'localhost',
    'localhost:8787',
    '127.0.0.1',
    '127.0.0.1:8787'
  ]
});

/* ── 3. Express wiring ----------------------------------------------------- */
const app = express();
app.use(express.json());
app.post   ('/mcp', (req, res) => transport.handleRequest(req, res, req.body));
app.get    ('/mcp', (req, res) => transport.handleRequest(req, res));
app.delete ('/mcp', (req, res) => transport.handleRequest(req, res));

/* >>> lightweight ping endpoint for Docker health‑check */
app.get('/health', (_req, res) => res.sendStatus(204));

/* ── 4. Bootstrap – keep top‑level‑await out of the emitted JS ------------- */
(async () => {
  await mcp.connect(transport);
  const PORT = Number(process.env.PORT) || 8787;
  app.listen(PORT, () =>
    console.error(`MCP HTTP server ready at http://localhost:${PORT}/mcp`)
  );
})().catch(err => {
  console.error('Fatal server start‑up error:', err);
  process.exit(1);
});

export {};            // keeps TypeScript in module mode
