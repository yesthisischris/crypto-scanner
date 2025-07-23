# Crypto Scanner

This repository implements a minimal micro‑service that classifies a crypto asset as **trending** or **ranging** using simple technical indicators. The service is designed to be compatible with the Model‑Context‑Protocol (MCP) so it can be orchestrated by other agentic systems.

## Features

- **One‑hour regime detection** – given a symbol like `BTC` or `ETH`, the service fetches the latest closing price along with a 20‑period Exponential Moving Average (EMA20) and the Average Directional Index (ADX) on a one‑hour timeframe.
- **Simple rules** – an asset is considered **trending** when the current close is above its EMA20 _and_ the ADX is greater than 25. Otherwise, it is labeled **ranging**.
- **Confidence score** – derived from the magnitude of ADX to indicate how strong the trend is. Values are capped at 1.0.
- **MCP tool wrapper** – exposes the classifier via `model-context-protocol` so other services can call it as a tool.

## Quick Start

1. **Configure API keys**

   Copy `.env.example` to `.env` and fill in your API keys:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:

   ```env
   TAAPI_KEY=your_taapi_key_here
   CMC_KEY=your_coinmarketcap_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. **Build the project**

   ```bash
   pnpm run build
   ```

3. **Run the service**
   ```bash
   pnpm mcp
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

Test the service by sending simple JSON messages via stdin:

```bash
# List available tools
echo '{"type":"list_tools"}' | node dist/mcp-server.js

# Call the classify tool
echo '{"type":"call_tool","name":"classify","arguments":{"symbol":"BTC"}}' | node dist/mcp-server.js
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

## Classification Logic

The classification is as follows:

- **Trending:**
  - Current close price > EMA20
  - ADX > 25

- **Ranging:**
  - Otherwise

The confidence score scales with ADX and is capped at 1.0.

## Using Docker Compose

The included `docker-compose.yml` file provides the easiest way to run the service:

```bash
# Build and run in the background
docker compose up --build -d

# View logs
docker compose logs -f

# Stop the service
docker compose down
```
