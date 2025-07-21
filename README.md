# Coding Challenge – Crypto Scanner

This repository implements a minimal micro‑service that classifies a crypto asset as **trending** or **ranging** using simple technical indicators.  The service is designed to be compatible with the Model‑Context‑Protocol (MCP) so it can be orchestrated by other agentic systems.

## Features

- **One‑hour regime detection** – given a symbol like `BTC` or `ETH`, the service fetches the latest closing price along with a 20‑period Exponential Moving Average (EMA20) and the Average Directional Index (ADX) on a one‑hour timeframe.
- **Simple rules** – an asset is considered **trending** when the current close is above its EMA20 *and* the ADX is greater than 25.  Otherwise, it is labeled **ranging**.
- **Confidence score** – derived from the magnitude of ADX to indicate how strong the trend is.  Values are capped at 1.0.
- **MCP tool wrapper** – exposes the classifier via `model-context-protocol` so other services can call it as a tool.

## Quick Start

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure API keys**

   Copy `.env.example` to `.env` and fill in your TAAPI and CoinMarketCap API keys:

   ```bash
   cp .env.example .env
   # then edit .env in your editor
   ```

3. **Run the service**

   ```bash
   pnpm dev
   # In another terminal:
   curl -X POST http://localhost:8787/scan -d '{"symbol":"BTC"}'
   ```

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

## Docker Compose Instructions
```
    docker compose up --build        # http://localhost:8787
```
