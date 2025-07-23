#!/usr/bin/env node
/************************************************************************
 * MCP server for crypto-scanner                       *
 ***********************************************************************/
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema, CallToolRequestSchema,
  type ListToolsRequest, type CallToolRequest
} from '@modelcontextprotocol/sdk/types.js';

// -- Import tool code -----------------------------------
import { toolHandler as classifyAsset } from './scanner/index.js';

/* ── 1. Instantiate -------------------------------------------------- */
const server = new Server({ name: 'crypto-scanner', version: '1.0.0' });
server.registerCapabilities({ tools: {} });

/* ── 2. Register ListTools handler --------------- */
server.setRequestHandler(
  ListToolsRequestSchema,
  async (_: ListToolsRequest) => ({
    tools: [{
      name: 'classify',
      description: 'Return "trending" or "ranging" for the given symbol',
      inputSchema: {
        type: 'object',
        required: ['symbol'],
        properties: {
          symbol: { type: 'string', description: 'Crypto symbol, e.g. BTC' }
        }
      }
    }]
  })
);

/* ── 3. Register CallTool handler ------------------------------------ */
server.setRequestHandler(
  CallToolRequestSchema,
  async (req: CallToolRequest) => {
    if (req.params.name !== 'classify') {
      return {
        content: [{ type: 'text', text: `Unknown tool ${req.params.name}` }],
        isError: true
      };
    }

    const { symbol } = (req.params.arguments ?? {}) as { symbol: string };
    const result = await classifyAsset({ symbol });

    return result;
  }
);

/* ── 4. Boot & connect ----------- */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Crypto-scanner MCP running on stdio');
  
  // Keep the process alive for Docker containers
  const keepAlive = () => {
    setTimeout(keepAlive, 1000 * 60 * 60); // Check every hour
  };
  keepAlive();
}
main().catch(e => { console.error(e); process.exit(1); });
