# Code Update Recommendations

## Current Status

✅ **tsx migration completed successfully** - The TypeScript extension error is resolved.

## Remaining Issues

The application now fails with import errors that were previously masked by the ts-node configuration issue.

### Primary Issue: Incorrect Import in `src/server.ts`

**Problem:**

```typescript
import { serve } from 'ai/server';
```

**Error:**

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './server' is not defined by "exports" in /workspaces/simple-trader/node_modules/ai/package.json
```

**Root Cause:**
The `ai` package (v4.3.19) doesn't export a `/server` subpath. Available exports are:

- `.` (main)
- `./test`
- `./rsc`
- `./react`
- `./mcp-stdio`

## Recommended Fixes

### Option 1: Use Express.js for HTTP Server (Recommended)

Since the current `model-context-protocol` package appears to be a specific MCP server for dad jokes rather than a general library, and the `cryptoScannerTool.httpHandler()` suggests an HTTP-based approach:

1. **Add Express.js dependency:**

   ```bash
   pnpm add express
   pnpm add -D @types/express
   ```

2. **Update `src/server.ts`:**

   ```typescript
   import 'dotenv/config';
   import express from 'express';
   import { cryptoScannerTool } from './agents/cryptoScanner';

   if (!process.env.TAAPI_KEY || !process.env.CMC_KEY) {
     throw new Error('TAAPI_KEY and CMC_KEY must be set in the environment');
   }

   const app = express();
   app.use(express.json());

   app.use('/scan', cryptoScannerTool.httpHandler());

   const port = process.env.PORT || 3000;
   app.listen(port, () => {
     console.log(`Server running on port ${port}`);
   });
   ```

### Option 2: Use Model Context Protocol SDK

If this is meant to be a proper MCP server:

1. **Replace the current MCP package:**

   ```bash
   pnpm remove model-context-protocol
   pnpm add @modelcontextprotocol/sdk
   ```

2. **Update imports and server setup** to use the official MCP SDK.

### Option 3: Use Built-in Node.js HTTP

Minimal approach using Node.js built-in HTTP module:

```typescript
import 'dotenv/config';
import { createServer } from 'http';
import { cryptoScannerTool } from './agents/cryptoScanner';

if (!process.env.TAAPI_KEY || !process.env.CMC_KEY) {
  throw new Error('TAAPI_KEY and CMC_KEY must be set in the environment');
}

const server = createServer((req, res) => {
  if (req.url?.startsWith('/scan')) {
    // Handle with cryptoScannerTool.httpHandler()
    // Implementation depends on how httpHandler() works
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

## Investigation Needed

To determine the correct approach, we need to understand:

1. **What does `cryptoScannerTool.httpHandler()` return?**
   - Check if it returns an Express middleware
   - Check if it returns a request handler function
   - Check its expected interface

2. **What is the intended architecture?**
   - HTTP REST API server?
   - MCP (Model Context Protocol) server?
   - Some other protocol?

3. **Verify the `model-context-protocol` package**
   - Check if this is the correct package or if it should be replaced
   - The current package appears to be a dad jokes MCP server, not a general library

## Next Steps

1. **Immediate fix**: Implement Option 1 (Express.js) as it's the most straightforward
2. **Investigate**: Check the `cryptoScannerTool.httpHandler()` implementation
3. **Verify**: Test that the crypto scanner functionality works as expected
4. **Clean up**: Remove unused dependencies if any

## Additional Notes

- The tsx migration was successful and should not be reverted
- The `ts-node` dependency can potentially be removed from `devDependencies` since it's no longer used
- Consider adding proper error handling and logging to the server
