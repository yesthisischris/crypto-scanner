import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListToolsResult,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { ToolName, ToolConfig, toolHandler } from './scanner/index.js';

// ---------------------------------------------------------------------------
// Guard-rails: make sure API keys exist at startup.
// ---------------------------------------------------------------------------
if (!process.env.TAAPI_KEY) {
  process.stderr.write('TAAPI_KEY missing; expect 429s\n')
}
if (!process.env.CMC_KEY) {
  process.stderr.write('CMC_KEY missing; price fetch will fail\n')
}
if (!process.env.OPENAI_API_KEY) {
  process.stderr.write('OPENAI_API_KEY missing; LLM classification will fail\n')
}

const app = express();
app.use(express.json());                     // <‑‑ 1. make req.body available

/** ----------------------------------------------------------------
 * 1 – MCP SERVER + TRANSPORT
 * -------------------------------------------------------------- */
const mcpServer = new McpServer(
  { name: 'crypto-scanner', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } },
);

// Register the two request types you need
mcpServer.setRequestHandler(ListToolsRequestSchema, async (): Promise<ListToolsResult> => ({
  tools: [
    {
      name: ToolName,
      description: ToolConfig.description,
      inputSchema: {
        type: 'object',
        properties: { symbol: { type: 'string', description: 'Crypto (BTC, ETH …)' } },
        required: ['symbol'],
      },
    },
  ],
}));

mcpServer.setRequestHandler(CallToolRequestSchema, async (req): Promise<CallToolResult> => {
  const { name, arguments: args } = req.params;
  if (name !== ToolName) throw new Error(`Unknown tool ${name}`);
  if (!args?.symbol || typeof args.symbol !== 'string') throw new Error('symbol must be string');
  return toolHandler({ symbol: args.symbol });
});

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => crypto.randomUUID(),
  enableJsonResponse: true,                          // ← Return plain JSON instead of SSE framing
});

/** ----------------------------------------------------------------
 * 2 – ROUTES
 * -------------------------------------------------------------- */
// POST – JSON‑RPC requests (initialize, tools/…)
app.post('/mcp', async (req, res) => {
  await transport.handleRequest(req, res, req.body);            // pass parsed body
});

// GET – SSE stream for server‑>client notifications
app.get('/mcp', async (req, res) => {
  await transport.handleRequest(req, res);
});

// DELETE – client explicitly ends the session
app.delete('/mcp', async (req, res) => {
  await transport.handleRequest(req, res);
});

// one‑time binding of server to transport
await mcpServer.connect(transport);

/** ---------------------------------------------------------------- */
const PORT = Number(process.env.PORT) || 8787;
app.listen(PORT, () => process.stderr.write(`MCP ready on http://localhost:${PORT}/mcp\n`));
