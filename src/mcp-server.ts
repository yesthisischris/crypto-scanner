#!/usr/bin/env node
/************************************************************************
 * MCP server for crypto-scanner                       *
 ***********************************************************************/
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema, CallToolRequestSchema,
  type ListToolsRequest, type CallToolRequest
} from '@modelcontextprotocol/sdk/types.js';
import { setTimeout, clearTimeout } from 'timers';

// -- Import YOUR existing tool code -----------------------------------
import { toolHandler as classifyAsset } from './scanner/index.js';

/* ── 1. Instantiate -------------------------------------------------- */
const server = new Server({ name: 'crypto-scanner', version: '1.0.0' });
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

/* ── 4. Boot & connect ----------- */
async function main() {
  // Check if stdin has immediate data available
  if (!process.stdin.isTTY) {
    // We're being piped to, so check for simplified format first
    let inputBuffer = '';
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    
    const dataPromise = new Promise<void>((resolve) => {
      const onData = (chunk: Buffer) => {
        inputBuffer += chunk.toString();
      };
      
      const onEnd = () => {
        process.stdin.removeListener('data', onData);
        process.stdin.removeListener('end', onEnd);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve();
      };
      
      process.stdin.on('data', onData);
      process.stdin.on('end', onEnd);
      
      // Small timeout to collect all data
      timeoutId = setTimeout(() => {
        onEnd();
      }, 50);
    });
    
    await dataPromise;
    
    if (inputBuffer.trim()) {
      try {
        const message = JSON.parse(inputBuffer.trim());
        
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
        
        // If it has jsonrpc field, it's a JSON-RPC message, fall through
      } catch {
        // JSON parsing failed, fall through to normal MCP mode
      }
    }
  }
  
  // Normal MCP mode for interactive use or JSON-RPC
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Crypto-scanner MCP running on stdio');
}
main().catch(e => { console.error(e); process.exit(1); });
