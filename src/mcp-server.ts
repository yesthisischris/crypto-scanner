#!/usr/bin/env node
/************************************************************************
 * MCP server (Hyperion-style) for crypto-scanner                       *
 ***********************************************************************/
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema, CallToolRequestSchema,
  type ListToolsRequest, type CallToolRequest
} from '@modelcontextprotocol/sdk/types.js';

// -- Import YOUR existing tool code -----------------------------------
import { toolHandler as classifyAsset } from './scanner/index.js';

/* ── 1. Instantiate -------------------------------------------------- */
const server = new Server({ name: 'crypto-scanner', version: '1.0.0' } as any);
server.registerCapabilities({ tools: {} });

/* ── 2. Register ListTools handler (one line per tool) --------------- */
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

    return {
      content: [{ type: 'json', json: result }],
      isError: false
    };
  }
);

/* ── 4. Boot & connect via the same transport Hyperion uses ----------- */
async function main() {
  // Check if stdin has data immediately available (pipe/redirect case)
  const hasImmedateStdin = !process.stdin.isTTY;
  
  if (hasImmedateStdin) {
    // Read stdin data for pipe/redirect scenarios
    let stdinData = '';
    
    // Set a timeout to detect if we're getting immediate data
    const timeout = new Promise(resolve => setTimeout(resolve, 100));
    const dataPromise = new Promise<string>((resolve) => {
      let data = '';
      process.stdin.on('data', (chunk) => {
        data += chunk.toString();
      });
      process.stdin.on('end', () => {
        resolve(data);
      });
    });
    
    const result = await Promise.race([dataPromise, timeout]);
    
    if (typeof result === 'string' && result.trim()) {
      stdinData = result.trim();
      
      try {
        const message = JSON.parse(stdinData);
        
        // Handle simplified format
        if (message.type === 'call_tool' && message.name && message.arguments) {
          if (message.name === 'classify') {
            const { symbol } = message.arguments;
            const result = await classifyAsset({ symbol });
            console.log(result.content[0].text);
            return;
          } else {
            console.log(JSON.stringify({ error: `Unknown tool ${message.name}` }, null, 2));
            return;
          }
        }
        
        if (message.type === 'list_tools') {
          const tools = [{
            name: 'classify',
            description: 'Return "trending" or "ranging" for the given symbol',
            inputSchema: {
              type: 'object',
              required: ['symbol'],
              properties: {
                symbol: { type: 'string', description: 'Crypto symbol, e.g. BTC' }
              }
            }
          }];
          console.log(JSON.stringify({ tools }, null, 2));
          return;
        }
      } catch (e) {
        // JSON parsing failed, fall through to normal MCP mode
      }
    }
  }
  
  // Normal MCP mode for interactive use or JSON-RPC
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Crypto-scanner MCP (Hyperion mode) running on stdio');
}
main().catch(e => { console.error(e); process.exit(1); });
