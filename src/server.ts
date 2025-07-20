import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import express from 'express'
import { ToolName, ToolConfig, toolHandler } from './agents/cryptoScanner'

// ---------------------------------------------------------------------------
// Guard-rails: make sure API keys exist at startup.
// ---------------------------------------------------------------------------
if (!process.env.TAAPI_KEY || !process.env.CMC_KEY) {
  throw new Error(
    'Environment variables TAAPI_KEY and CMC_KEY must be set before starting the server.'
  );
}

// 1. Build the MCP server
const server = new McpServer({ name: 'crypto-scanner', version: '0.1.0' })

server.registerTool(ToolName, ToolConfig, toolHandler)

// 2. Wire it to an HTTP transport (stateless mode for simplicity)
const app = express()
app.use(express.json())

app.post('/mcp', async (req, res) => {
  try {
    const { method, params } = req.body
    
    if (method === 'call_tool') {
      const { name, arguments: args } = params
      
      if (name === ToolName) {
        const result = await toolHandler(args)
        res.json({
          jsonrpc: '2.0',
          id: req.body.id,
          result
        })
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          id: req.body.id,
          error: { code: -32601, message: 'Method not found' }
        })
      }
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        id: req.body.id,
        error: { code: -32601, message: 'Method not found' }
      })
    }
  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: { code: -32603, message: error instanceof Error ? error.message : 'Unknown error' }
    })
  }
})

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const PORT = Number(process.env.PORT) || 8787;

app.listen(PORT, () =>
  console.log(`MCP HTTP server listening on :${PORT}/mcp`)
)
