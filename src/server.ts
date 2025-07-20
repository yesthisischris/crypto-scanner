import 'dotenv/config';
import express from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { ToolName, ToolConfig, toolHandler } from './scanner/index.js'

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

// Create MCP server with proper SDK
const getServer = () => {
  const server = new McpServer({
    name: 'simple-trader',
    version: '1.0.0'
  }, { 
    capabilities: { 
      tools: {} 
    } 
  })

  // Register the crypto scanner tool using MCP SDK
  server.registerTool(ToolName, {
    title: 'Crypto Scanner 1H Regime',
    description: ToolConfig.description,
    inputSchema: {
      symbol: z.string().describe('Crypto symbol (e.g., BTC, ETH)')
    }
  }, async (args: { symbol: string }) => {
    console.log('Tool called with args:', args)
    return await toolHandler({ symbol: args.symbol })
  })

  return server
}

// Map to store transports by session ID
const transports: Record<string, StreamableHTTPServerTransport> = {}

// Wire it to an HTTP transport using MCP SDK
const app = express()
app.use(express.json())

// MCP POST endpoint using SDK transport
const mcpPostHandler = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string
  
  try {
    let transport: StreamableHTTPServerTransport
    
    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId]
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId: string) => {
          console.log(`Session initialized with ID: ${sessionId}`)
          transports[sessionId] = transport
        }
      })
      
      // Set up onclose handler to clean up transport when closed
      transport.onclose = () => {
        const sid = transport.sessionId
        if (sid && transports[sid]) {
          console.log(`Transport closed for session ${sid}, removing from transports map`)
          delete transports[sid]
        }
      }
      
      // Connect the MCP server to the transport
      const server = getServer()
      await server.connect(transport)
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        id: req.body.id,
        error: { code: -32600, message: 'Invalid request: missing session ID or not an initialize request' }
      })
      return
    }
    
    await transport.handleRequest(req, res, req.body)
  } catch (error) {
    console.error('MCP handler error:', error)
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body.id,
        error: { code: -32603, message: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
  }
}

app.post('/mcp', mcpPostHandler)

// /scan endpoint for simple cURL tests
app.post('/scan', async (req, res) => {
  try {
    const result = await toolHandler(req.body)
    // Extract the JSON content from text format
    if (result.content && result.content[0] && result.content[0].type === 'text') {
      const jsonContent = JSON.parse(result.content[0].text)
      res.json(jsonContent)
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
