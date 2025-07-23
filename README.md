# Coding Challenge – Crypto Scanner

This repository implements a minimal micro‑service that classifies a crypto asset as **trending** or **ranging** using simple technical indicators. The service is designed to be compatible with the Model‑Context‑Protocol (MCP) so it can be orchestrated by other agentic systems.

## Features

- **One‑hour regime detection** – given a symbol like `BTC` or `ETH`, the service fetches the latest closing price along with a 20‑period Exponential Moving Average (EMA20) and the Average Directional Index (ADX) on a one‑hour timeframe.
- **Simple rules** – an asset is considered **trending** when the current close is above its EMA20 *and* the ADX is greater than 25. Otherwise, it is labeled **ranging**.
- **Confidence score** – derived from the magnitude of ADX to indicate how strong the trend is. Values are capped at 1.0.
- **MCP tool wrapper** – exposes the classifier via `model-context-protocol` so other services can call it as a tool.

## Prerequisites

- **Node.js 20** or higher
- **Package manager**: Either `npm` (included with Node.js) or `pnpm` (recommended)
- **Docker** and **Docker Compose** (optional, for containerized deployment)

### Installing pnpm (recommended)
```bash
npm install -g pnpm
```

## Quick Start

### Local Development

1. **Clone and navigate to the repository**
   ```bash
   git clone <repository-url>
   cd crypto-scanner
   ```

2. **Install dependencies**
   ```bash
   # Using pnpm (recommended)
   pnpm install
   
   # Or using npm
   npm install
   ```

3. **Configure API keys**

   Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your favorite editor and add your API keys:
   ```env
   TAAPI_KEY=your_taapi_key_here
   CMC_KEY=your_coinmarketcap_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Build the project**
   ```bash
   # Using pnpm
   pnpm run build
   
   # Or using npm
   npm run build
   ```

5. **Run the service**
   ```bash
   # Using pnpm
   pnpm mcp
   
   # Or using npm
   npm run mcp
   ```

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker compose up --build
   ```

2. **Or build and run manually**
   ```bash
   # Build the image
   docker build -t crypto-scanner .
   
   # Run the container
   docker run --env-file .env crypto-scanner
   ```

## Testing the Service

### Method 1: Simple Tool Testing (Recommended)

Test the service by sending simple JSON messages via stdin:

```bash
# List available tools
echo '{"type":"list_tools"}' | node dist/mcp-server.js

# Call the classify tool
echo '{"type":"call_tool","name":"classify","arguments":{"symbol":"BTC"}}' | node dist/mcp-server.js
```

### Method 2: MCP Protocol Testing

For full MCP protocol testing, you can send JSON-RPC messages:

```bash
# Initialize session
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"roots":{"listChanged":false},"sampling":{}},"clientInfo":{"name":"test-client","version":"1.0.0"}}}' | node dist/mcp-server.js

# List tools
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node dist/mcp-server.js

# Call tool
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"classify","arguments":{"symbol":"BTC"}}}' | node dist/mcp-server.js
```

### Expected Response

You should receive a JSON response similar to:

```json
{
  "symbol": "BTC",
  "regime": "trending",
  "confidence": 0.83,
  "lastPrice": 67725.42,
  "indicators": {
    "ema20": 66000.12,
    "adx": 31.4
  }
}
```

## API Keys Setup

You'll need API keys from the following services:

### TAAPI (Technical Analysis API)
1. Sign up at [https://taapi.io](https://taapi.io)
2. Get your free or paid API key
3. Add it to your `.env` file as `TAAPI_KEY`

### CoinMarketCap
1. Sign up at [https://coinmarketcap.com/api/](https://coinmarketcap.com/api/)
2. Get your free or paid API key
3. Add it to your `.env` file as `CMC_KEY`

### OpenAI (Optional)
1. Sign up at [https://platform.openai.com](https://platform.openai.com)
2. Get your API key
3. Add it to your `.env` file as `OPENAI_API_KEY`

## Development Scripts

```bash
# Build the project
pnpm run build

# Run in development mode with hot reload
pnpm run dev

# Run tests
pnpm test

# Lint the code
pnpm run lint

# Test MCP endpoints (requires service to be running)
pnpm run mcp:test
```

## Classification Logic

The classification is as follows:

- **Trending:**
  - Current close price > EMA20
  - ADX > 25

- **Ranging:**
  - Otherwise

The confidence score scales with ADX and is capped at 1.0.

## Docker Usage

### Using Docker Compose (Recommended)

The included `docker-compose.yml` file provides the easiest way to run the service:

```bash
# Build and run in the background
docker compose up --build -d

# View logs
docker compose logs -f

# Stop the service
docker compose down
```

### Using Docker Directly

```bash
# Build the image
docker build -t crypto-scanner .

# Run with environment file
docker run --env-file .env crypto-scanner

# Run with inline environment variables
docker run -e TAAPI_KEY=your_key -e CMC_KEY=your_key crypto-scanner
```

## Troubleshooting

### Common Issues

1. **"No inputs were found in config file"**
   - This usually indicates a build issue. Make sure you're in the correct directory and run `pnpm run build`

2. **API Key Errors**
   - Verify your `.env` file exists and contains valid API keys
   - Check that the `.env` file is in the root directory of the project

3. **Network Issues in Docker**
   - If Docker build fails with network issues, try running with npm instead of pnpm
   - Check your internet connection and Docker daemon status

4. **Permission Issues**
   - On Linux/Mac, you may need to run Docker commands with `sudo`
   - Make sure your user is in the `docker` group

### Debug Mode

To run with more verbose logging:

```bash
DEBUG=crypto-scanner* node dist/mcp-server.js
```

### Testing without API Keys

For basic functionality testing, you can use placeholder values in your `.env`:

```env
TAAPI_KEY=test_key_placeholder
CMC_KEY=test_key_placeholder
OPENAI_API_KEY=test_key_placeholder
```

Note: The service will return mock data or errors with placeholder keys.
