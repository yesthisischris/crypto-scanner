import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport }
        from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { toolHandler } from './scanner/index.js';

/* ── 0. Env guard‑rails ──────────────────────────────────────────────────── */
(['TAAPI_KEY', 'CMC_KEY', 'OPENAI_API_KEY'] as const).forEach(k => {
  if (!process.env[k]) console.error(`${k} missing – see README`);
});

/* 1 ─ MCP server ---------------------------------------------------------- */
const mcp = new McpServer(
  { name: 'crypto-scanner', version: '1.1.0' },
  { allowDuplicateInitialize: true } as any    // keep this line too
);

// ─── make initialize idempotent on SDK 1.16 ───────────────────────────────
const initCache = new Map<string, any>();

(mcp as any).setInitializeHandler(async (ctx: any) => {
  const sid = ctx.sessionId!;
  if (initCache.has(sid)) return initCache.get(sid);

  const result = {
    capabilities: {},
    protocolVersion: ctx.params.protocolVersion
  };
  initCache.set(sid, result);
  return result;
});

/* 1 a. Register tool ------------------------------------------------------- */
mcp.registerTool(
  'classify_asset',
  {
    title: 'Classify a crypto asset',
    description: 'Return “trending” or “ranging” for the given symbol',
    inputSchema: { symbol: z.string().describe('Crypto symbol (e.g. BTC, ETH)') }
  },
  async ({ symbol }) => toolHandler({ symbol })
);

/* ── 2. Transport ---------------------------------------------------------- */
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  enableJsonResponse: true,
  enableDnsRebindingProtection: true,
  allowedHosts: ['localhost', 'localhost:8787', '127.0.0.1', '127.0.0.1:8787']
});

/* ── 3. Express app -------------------------------------------------------- */
const app = express();

// CORS so Claude Desktop can read `Mcp-Session-Id`
app.use(cors({ origin: '*', exposedHeaders: ['mcp-session-id'] }));

// Don't use express.json(); the transport reads the raw body itself
app.post('/mcp',  (req, res) => transport.handleRequest(req, res));
app.get ('/mcp',  (req, res) => transport.handleRequest(req, res));
app.delete('/mcp', (req, res) => transport.handleRequest(req, res));

// health‑check for Docker
app.get('/health', (_req, res) => res.sendStatus(204));

/* ── 4. Bootstrap ---------------------------------------------------------- */
(async () => {
  await mcp.connect(transport);
  const PORT = Number(process.env.PORT) || 8787;
  app.listen(PORT, () =>
    console.error(`MCP HTTP server ready at http://localhost:${PORT}/mcp`)
  );
})().catch(err => { console.error(err); process.exit(1); });

export {};
