import 'dotenv/config';
import express from 'express'
import { ToolName, ToolConfig, toolHandler } from './scanner'

// ---------------------------------------------------------------------------
// Guard-rails: make sure API keys exist at startup.
// ---------------------------------------------------------------------------
if (!process.env.TAAPI_KEY) {
  console.warn('TAAPI_KEY missing; expect 429s')
}
if (!process.env.CMC_KEY) {
  console.warn('CMC_KEY missing; price fetch will fail')
}
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY missing; LLM classification will fail')
}

// 1. Create simple MCP-style tool registry
const mcpTools = [{
  name: ToolName,
  description: ToolConfig.description,
  inputSchema: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'Crypto symbol (e.g., BTC, ETH)'
      }
    },
    required: ['symbol']
  }
}]

// 2. MCP-style tool call handler
async function callMcpTool(name: string, args: Record<string, unknown>) {
  if (name === ToolName) {
    return await toolHandler(args as { symbol: string })
  } else {
    throw new Error(`Unknown tool: ${name}`)
  }
}

// 2. Wire it to an HTTP transport (stateless mode for simplicity)
const app = express()
app.use(express.json())

app.post('/mcp', async (req, res) => {
  try {
    const { method, params, id } = req.body
    
    if (method === 'tools/list') {
      res.json({
        jsonrpc: '2.0',
        id,
        result: { tools: mcpTools }
      })
    } else if (method === 'tools/call') {
      const { name, arguments: args } = params
      const result = await callMcpTool(name, args)
      res.json({
        jsonrpc: '2.0',
        id,
        result
      })
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        id,
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

// /scan endpoint for simple cURL tests
app.post('/scan', async (req, res) => {
  try {
    const result = await toolHandler(req.body)
    // Extract the JSON content from MCP format
    if (result.content && result.content[0] && result.content[0].type === 'json') {
      res.json(result.content[0].json)
    } else {
      res.json(result)
    }
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const PORT = Number(process.env.PORT) || 8787;

app.listen(PORT, () =>
  console.log(`MCP HTTP server listening on :${PORT}`)
)
