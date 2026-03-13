# Orbityx Chart Pro

<div align="center">

![Orbityx Chart Pro Banner](https://img.shields.io/badge/Orbityx-Chart_Pro-0f141b?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyAxOEw5IDEyTDEzIDE2TDIxIDYiIHN0cm9rZT0iIzIyYzU1ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=&labelColor=1a2332)

**A professional, provider-agnostic, canvas-based OHLCV charting library for the web.**

[![License](https://img.shields.io/badge/License-Apache_2.0-22c55e.svg?style=flat-square)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3b82f6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-22c55e.svg?style=flat-square)](https://github.com/BorisMalts/Orbityx-charts/blob/main/package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-8b5cf6.svg?style=flat-square)](https://github.com/BorisMalts/Orbityx-charts/pulls)
[![GitHub Stars](https://img.shields.io/github/stars/BorisMalts/Orbityx-charts?style=flat-square&color=f59e0b)](https://github.com/BorisMalts/Orbityx-charts/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/BorisMalts/Orbityx-charts?style=flat-square&color=ef4444)](https://github.com/BorisMalts/Orbityx-charts/issues)

[**Live Demo**](https://github.com/BorisMalts/Orbityx-charts) · [**Documentation**](#-documentation) · [**Quick Start**](#-quick-start) · [**API Reference**](#-api-reference) · [**Contributing**](#-contributing)

</div>

---

## Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [Core Concepts](#-core-concepts)
    - [DataProvider Interface](#dataprovider-interface)
    - [Instrument Registration](#instrument-registration)
    - [Timeframes](#timeframes)
    - [WebSocket Streaming](#websocket-streaming)
- [Built-in Providers](#-built-in-providers)
    - [Binance Provider](#binance-provider)
    - [CoinGecko Provider](#coingecko-provider)
    - [Generic REST Provider](#generic-rest-provider)
    - [Alpha Vantage Provider](#alpha-vantage-provider)
    - [Mock Provider](#mock-provider)
- [Chart Engine](#-chart-engine)
    - [Chart Types](#chart-types)
    - [Technical Indicators](#technical-indicators)
    - [Drawing Tools](#drawing-tools)
    - [Viewport & Navigation](#viewport--navigation)
- [UI Components](#-ui-components)
    - [Toolbar](#toolbar)
    - [Tooltip](#tooltip)
    - [Legend Panel](#legend-panel)
    - [Theme System](#theme-system)
- [API Reference](#-api-reference)
    - [OrbityxChart](#orbityxchart-class)
    - [ChartEngine](#chartengine-class)
    - [DataManager](#datamanager-class)
    - [ProviderRegistry](#providerregistry-class)
    - [WebSocketService](#websocketservice-class)
- [Types Reference](#-types-reference)
- [Utility Functions](#-utility-functions)
    - [Math Utilities](#math-utilities)
    - [Format Utilities](#format-utilities)
- [Configuration](#-configuration)
    - [ChartConfig](#chartconfig)
    - [Theme Colors](#theme-colors)
- [Advanced Usage](#-advanced-usage)
    - [Custom Provider](#custom-provider)
    - [Multiple Charts on One Page](#multiple-charts-on-one-page)
    - [Direct DataManager Usage](#direct-datamanager-usage)
    - [Infinite Backwards Scroll](#infinite-backwards-scroll)
    - [Custom WebSocket Integration](#custom-websocket-integration)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Browser Support](#-browser-support)
- [Performance Notes](#-performance-notes)
- [Contributing](#-contributing)
- [Changelog](#-changelog)
- [License](#-license)
- [Authors](#-authors)

---

## 🔭 Overview

**Orbityx Chart Pro** is a fully featured, zero-dependency, TypeScript-first charting library built on top of the native HTML5 Canvas API. It is designed to be completely **provider-agnostic** — there are no hard-coded references to any exchange, broker, or data vendor anywhere in the core library. You plug in your own data source, register your instruments, and the library takes care of everything else.

Whether you're building a crypto trading terminal, a stock market dashboard, a forex analytics tool, or a financial data visualization platform for any asset class, Orbityx Chart Pro gives you a professional-grade rendering engine with the flexibility to connect to any backend.

```
╔═══════════════════════════════════════════════════════════════╗
║                    Orbityx Chart Pro                          ║
║                                                               ║
║   Your App                                                    ║
║   ─────────────────────────────────────────────────────────  ║
║   chart.setProvider(new BinanceProvider())                    ║
║         .registerInstruments([...])                           ║
║         .setWebSocketUrl('wss://...')                         ║
║         .setDefaultTimeframe('1h')                            ║
║   await chart.init()                                          ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## ✨ Features

### 📊 Charting
- **Five chart types**: Candlestick, Heikin Ashi, Line, Area, OHLC Bars
- **High-DPI canvas rendering** with `window.devicePixelRatio` support
- **requestAnimationFrame**-based render loop with dirty-flag optimization
- **Volume panel** with proportional up/down bars
- **Current price line** with animated floating label
- **Crosshair** with price and timestamp axis labels

### 📈 Technical Indicators
- **Moving Averages**: SMA 20, SMA 50, SMA 200, EMA 12, EMA 26
- **Volatility**: Bollinger Bands (20-period, 2σ) with gradient fill
- **Momentum sub-panels**: RSI (14-period) with overbought/oversold levels, MACD (12/26/9) with histogram and signal line
- **Volume panel** as toggleable overlay indicator
- All indicators computed with pure stateless functions over the full candle dataset

### 🖊️ Drawing Tools
- **Trendline** — two-point line projected across the price area
- **Horizontal Line** — single-click fixed price level
- **Fibonacci Retracement** — 7-level auto-colored (0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%)
- **Rectangle** — area selection with semi-transparent fill
- **Clear All** — one-click wipe of all drawing annotations

### 🔄 Data & Streaming
- **Provider-agnostic**: any REST API, WebSocket, local database, or mock data
- **Lazy infinite backwards scroll**: automatic history fetch when the user pans to the left edge
- **Live tick streaming** via built-in WebSocket client
- **Candle merging**: live ticks update the current candle in-place
- **Pub/sub DataManager**: any number of UI modules can subscribe to candle updates
- **Raw candle normalisation**: accepts arrays `[ts, o, h, l, c, v]`, objects with any alias (`time/t`, `open/o`, etc.), or ISO strings

### 🌗 Theming
- **Dark and light themes** with full color token control
- **OS preference detection** via `prefers-color-scheme`
- **localStorage persistence** of the last chosen theme
- `themeChanged` custom DOM event for third-party module sync

### 🖥️ UI
- **Responsive toolbar**: timeframe switcher, chart type selector, drawing tool palette, indicator picker, zoom/reset controls
- **Floating OHLCV tooltip**: follows the cursor, updates only when the hovered candle changes
- **Market legend panel**: live price, delta %, 24h high/low/volume/market cap
- **Symbol selector**: auto-populated from registered instruments
- **FPS monitor** for performance profiling
- **WebSocket connection indicator** (Live / Offline dot)
- **Fullscreen mode** toggle
- **Settings modal** scaffold

### ⌨️ Interaction
- **Mouse wheel zoom** centered on cursor position
- **Click-and-drag pan** with momentum-style smooth cursor
- **Keyboard navigation**: arrow keys, +/-, Home, Escape
- **Touch-friendly** architecture (extensible)

---

## 🏗️ Architecture

Orbityx Chart Pro follows a clean **layered architecture** with strict separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                        │
│                         main.ts / OrbityxChart                  │
│   Orchestrates init, data loading, WS setup, UI wiring         │
├─────────────────────────────────────────────────────────────────┤
│                          UI Layer                               │
│   toolbar.ts │ tooltip.ts │ legend.ts │ theme.ts               │
│   Pure DOM manipulation — no data fetching                      │
├────────────────────┬────────────────────────────────────────────┤
│    Core Layer      │           Services Layer                   │
│  chart-engine.ts   │   api.ts (ProviderRegistry)                │
│  data-manager.ts   │   ws.ts  (WebSocketService)                │
│  indicators.ts     │                                            │
├────────────────────┴────────────────────────────────────────────┤
│                         Utils Layer                             │
│             math.ts │ format.ts │ date.ts                       │
│             Pure, stateless helper functions                    │
├─────────────────────────────────────────────────────────────────┤
│                         Types Layer                             │
│                       types/index.ts                            │
│         Central type registry — no runtime code                 │
├─────────────────────────────────────────────────────────────────┤
│               Providers Layer (optional, user-supplied)         │
│  binance.ts │ coingecko.ts │ generic_rest.ts │ mock.ts          │
│  Implement DataProvider — library core never imports these      │
└─────────────────────────────────────────────────────────────────┘
```

**Key design principles:**
1. **The library core never fetches data on its own.** All network activity is delegated to the user's `DataProvider`.
2. **DataManager is a pure cache.** It normalises, validates, sorts, and broadcasts candle data; it never decides what to fetch.
3. **ChartEngine is a pure renderer.** It reads from state and calls `requestDraw()` — it never triggers data loads directly (it fires `onNeedMoreData` as a callback hook).
4. **ProviderRegistry is the sole IoC boundary.** All library modules that need data go through `registry.fetchCandles()`.

---

## 🚀 Quick Start

### 1. With Binance (crypto)

```typescript
import OrbityxChart from './main.js';
import { BinanceProvider } from './providers/examples/binance.js';

const chart = new OrbityxChart({ canvasId: 'chartCanvas' });

chart
  .setProvider(new BinanceProvider())
  .registerInstruments([
    { id: 'BTCUSDT', symbol: 'BTC/USDT', name: 'Bitcoin',  icon: '₿', iconColor: '#f7931a' },
    { id: 'ETHUSDT', symbol: 'ETH/USDT', name: 'Ethereum', icon: 'Ξ', iconColor: '#627eea' },
    { id: 'SOLUSDT', symbol: 'SOL/USDT', name: 'Solana',   icon: '◎', iconColor: '#9945ff' },
  ])
  .setDefaultTimeframe('4h')
  .setDefaultInstrument('BTCUSDT');

await chart.init();
```

### 2. With CoinGecko (crypto, free API)

```typescript
import OrbityxChart from './main.js';
import { CoinGeckoProvider } from './providers/examples/coingecko.js';

const chart = new OrbityxChart();

chart
  .setProvider(new CoinGeckoProvider({ apiKey: 'CG-yourkey' })) // key optional
  .registerInstruments([
    { id: 'bitcoin',  symbol: 'BTC/USD', name: 'Bitcoin',  icon: '₿', iconColor: '#f7931a' },
    { id: 'ethereum', symbol: 'ETH/USD', name: 'Ethereum', icon: 'Ξ', iconColor: '#627eea' },
    { id: 'solana',   symbol: 'SOL/USD', name: 'Solana',   icon: '◎', iconColor: '#9945ff' },
  ]);

await chart.init();
```

### 3. With Mock data (offline / demos)

```typescript
import OrbityxChart from './main.js';
import { MockProvider } from './providers/examples/mock.js';

const chart = new OrbityxChart();

chart
  .setProvider(new MockProvider({ delayMs: 300 })) // simulates network latency
  .registerInstruments([
    { id: 'DEMO_BTC', symbol: 'BTC/USDT', name: 'Demo Bitcoin',  icon: '₿', iconColor: '#f7931a' },
    { id: 'DEMO_ETH', symbol: 'ETH/USDT', name: 'Demo Ethereum', icon: 'Ξ', iconColor: '#627eea' },
  ]);

await chart.init();
```

### 4. Minimal custom provider

```typescript
import OrbityxChart from './main.js';
import type { DataProvider } from './main.js';

const myProvider: DataProvider = {
  async fetchCandles({ instrumentId, timeframe, to }) {
    const url = new URL(`https://api.myapp.com/ohlcv/${instrumentId}`);
    url.searchParams.set('tf', timeframe);
    url.searchParams.set('limit', '500');
    if (to !== undefined) url.searchParams.set('endTime', String(to));

    const rows = await fetch(url).then(r => r.json());

    return rows.map((r: any) => ({
      timestamp: r.time * 1000,   // seconds → ms
      open:      r.o,
      high:      r.h,
      low:       r.l,
      close:     r.c,
      volume:    r.v,
    }));
  },
};

const chart = new OrbityxChart();
chart
  .setProvider(myProvider)
  .registerInstruments([
    { id: 'AAPL', symbol: 'AAPL', name: 'Apple Inc.', icon: '', iconColor: '#555' },
  ]);

await chart.init();
```

---

## 📦 Installation

### From source (recommended)

```bash
git clone https://github.com/BorisMalts/Orbityx-charts.git
cd Orbityx-charts
npm install
npm run build
```

### Required HTML structure

The chart requires a canvas element and several UI hooks in your HTML. The minimum scaffold:

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <title>Orbityx Chart Pro</title>
  <link rel="stylesheet" href="styles/main.css" />
</head>
<body>

  <!-- Toolbar mount point -->
  <div id="toolbar"></div>

  <!-- Symbol selector -->
  <select id="symbol-select"></select>

  <!-- Chart container -->
  <div class="chart-container">
    <canvas id="chartCanvas"></canvas>
  </div>

  <!-- Legend panel -->
  <div class="legend-panel">
    <span class="symbol-icon"></span>
    <span class="symbol-name"></span>
    <span class="symbol-price"></span>
    <span class="price-change"></span>
    <span id="stat-high"></span>
    <span id="stat-low"></span>
    <span id="stat-volume"></span>
    <span id="stat-marketcap"></span>
    <span id="stat-change" class="stat-badge"></span>
  </div>

  <!-- Status / meta -->
  <div id="connection-status"></div>
  <div id="frame-rate"></div>
  <div id="last-update"></div>
  <div id="loading-indicator" style="display:none;">Loading…</div>

  <!-- Error notification -->
  <div id="error-notification" style="display:none;">
    <span class="error-title"></span>
    <span class="error-message"></span>
    <button class="error-dismiss">✕</button>
  </div>

  <!-- Theme toggle -->
  <button id="theme-toggle"><span class="theme-icon">☀️</span></button>

  <!-- Fullscreen / settings -->
  <button id="fullscreen-btn">⛶</button>
  <button id="settings-btn">⚙</button>

  <!-- Settings modal -->
  <div id="settings-modal" style="display:none;">
    <button class="modal-close">✕</button>
  </div>

  <script type="module" src="main.js"></script>
</body>
</html>
```

---

## 📁 Project Structure

```
orbityx-charts/
│
├── main.ts                          # Application bootstrap & OrbityxChart class
│
├── core/
│   ├── chart-engine.ts              # Canvas renderer, viewport math, event handling
│   ├── data-manager.ts              # In-memory OHLCV cache, pub/sub, live ticks
│   └── indicators.ts                # Technical indicator computation engine
│
├── services/
│   ├── api.ts                       # ProviderRegistry — IoC boundary for data
│   └── ws.ts                        # Resilient WebSocket client with auto-reconnect
│
├── ui/
│   ├── toolbar.ts                   # Timeframes, chart types, drawings, indicator picker
│   ├── tooltip.ts                   # Floating OHLCV crosshair tooltip
│   ├── legend.ts                    # Market legend panel (price, stats, instrument info)
│   └── theme.ts                     # Dark/light theme manager with localStorage
│
├── types/
│   └── index.ts                     # Central type registry (no runtime code)
│
├── utils/
│   ├── math.ts                      # Pure numeric helpers (SMA, EMA, RSI, MACD, BB…)
│   ├── format.ts                    # Currency, number, percent, compact formatters
│   └── date.ts                      # Timestamp parsing, axis labels, date formatting
│
└── providers/
    └── examples/
        ├── binance.ts               # Binance Spot adapter with pagination
        ├── coingecko.ts             # CoinGecko v3 REST adapter
        ├── generic_rest.ts          # Generic REST template + Alpha Vantage example
        └── mock.ts                  # In-memory mock for testing and demos
```

---

## 🧠 Core Concepts

### DataProvider Interface

The `DataProvider` interface is the **only contract** Orbityx Chart Pro imposes on the user. Implement it to connect the library to any data source.

```typescript
export interface DataProvider {
  /**
   * REQUIRED — fetch OHLCV candles.
   * Return RawCandle[] or Candle[] — the library normalises either.
   * Throw to surface the error in the UI.
   */
  fetchCandles(request: CandleRequest): Promise<RawCandle[] | Candle[]>;

  /**
   * OPTIONAL — fetch 24-hour market statistics.
   * When omitted, the library computes approximate stats from loaded candles.
   */
  fetchMarketStats?(instrumentId: string): Promise<Partial<MarketStats>>;

  /**
   * OPTIONAL — called once during chart.init().
   * Use for auth, opening connections, or fetching a dynamic instrument list.
   */
  init?(): Promise<void>;

  /**
   * OPTIONAL — called when the user changes the active instrument or timeframe.
   * Use to update live subscriptions.
   */
  onInstrumentChange?(instrumentId: string, timeframe: string): void;

  /**
   * OPTIONAL — called on chart.destroy().
   * Close connections, clear timers.
   */
  destroy?(): void;
}
```

#### CandleRequest

When `fetchCandles` is called, it receives a `CandleRequest` object:

| Field          | Type                | Description                                                      |
|----------------|---------------------|------------------------------------------------------------------|
| `instrumentId` | `string`            | The instrument id as registered (e.g. `'BTCUSDT'`, `'AAPL'`)   |
| `timeframe`    | `string`            | Active timeframe key (e.g. `'1h'`, `'1d'`)                      |
| `from`         | `number?`           | Optional start epoch-ms for the window                           |
| `to`           | `number?`           | Optional end epoch-ms. When set: fetch one backwards page only   |
| `limit`        | `number?`           | Optional maximum number of candles to return                     |

> **Important:** The `to` field is the signal for **lazy history loading**. When the user scrolls to the left edge of the chart, `DataManager.prependCandles()` calls `fetchCandles` with `req.to = oldest_timestamp - 1`. Your provider must handle this by fetching one page of candles strictly older than `to`. If you are paginating backwards, use `to` as your `endTime` parameter.

---

### Instrument Registration

Every tradable instrument shown in the UI must be explicitly registered before calling `init()`. The library never hard-codes any symbol list.

```typescript
chart.registerInstruments([
  {
    id:             'BTCUSDT',    // Unique key — passed verbatim to DataProvider
    symbol:         'BTC/USDT',  // Short label shown in the UI
    name:           'Bitcoin',   // Full name shown in the legend
    icon:           '₿',         // Icon badge character or emoji
    iconColor:      '#f7931a',   // CSS color for the icon badge
    pricePrecision: 2,           // Decimal places for price formatting
    meta:           { category: 'crypto' }, // Arbitrary user data (never read by library)
  },
  {
    id:             'ETHUSDT',
    symbol:         'ETH/USDT',
    name:           'Ethereum',
    icon:           'Ξ',
    iconColor:      '#627eea',
  },
]);
```

**`id`** is used as the key everywhere: it is passed to `DataProvider.fetchCandles()`, `fetchMarketStats()`, and `onInstrumentChange()`. It can be anything — `'BTCUSDT'`, `'bitcoin'`, `'AAPL'`, `'EUR/USD'`, `'my-custom-index'`.

---

### Timeframes

The following timeframe keys are supported by the built-in toolbar. They are passed verbatim to the provider:

| Key        | Label      | Notes                                    |
|------------|------------|------------------------------------------|
| `1m`       | 1 Minute   | Highest resolution                       |
| `5m`       | 5 Minutes  |                                          |
| `15m`      | 15 Minutes |                                          |
| `30m`      | 30 Minutes |                                          |
| `1h`       | 1 Hour     |                                          |
| `4h`       | 4 Hours    |                                          |
| `12h`      | 12 Hours   |                                          |
| `1d`       | 1 Day      | **Default**                              |
| `3d`       | 3 Days     |                                          |
| `1w`       | 1 Week     |                                          |
| `2w`       | 2 Weeks    |                                          |
| `1month`   | 1 Month    |                                          |
| `3month`   | 3 Months   |                                          |
| `6month`   | 6 Months   |                                          |
| `1y`       | 1 Year     |                                          |

You can also pass any custom string — the toolbar label will fall back to the raw key.

---

### WebSocket Streaming

The built-in `WebSocketService` (`ws.ts`) handles live data streaming with exponential back-off reconnect, heartbeat pings, and pub/sub message routing.

```typescript
// Set the WS endpoint before init
chart.setWebSocketUrl('wss://stream.binance.com:9443/ws/btcusdt@kline_1m');

// The OrbityxChart class handles message routing automatically:
// - type 'candle'    → DataManager.processLiveTick()
// - type 'trade'     → engine.state.currentPrice update
// - type 'heartbeat' → responds with 'pong'
```

The expected `WSMessage` envelope:

```typescript
interface WSMessage {
  type:       'candle' | 'trade' | 'heartbeat' | 'pong' | 'subscribe' | 'error';
  payload?:   RawCandle;   // For 'candle' messages
  price?:     number;      // For 'trade' messages
  symbol?:    string;
  timeframe?: string;
  stats?:     Partial<MarketStats>;
  [key: string]: unknown;  // Any additional fields
}
```

If your server sends a different format, bypass `ws.ts` entirely and call `dataManager.processLiveTick()` directly:

```typescript
import dataManager from './core/data-manager.js';
import { registry } from './services/api.js';

// Pipe your own WebSocket into the DataManager
const socket = new WebSocket('wss://yourserver.com/stream');
const detach = dataManager.attachSocket(socket);

// Later, to detach:
detach();
```

---

## 🔌 Built-in Providers

### Binance Provider

Full-featured Binance Spot adapter. Fetches up to 3,000 candles on the initial load via backwards pagination. Supports all standard Binance kline intervals.

```typescript
import { BinanceProvider } from './providers/examples/binance.js';

const provider = new BinanceProvider({
  baseUrl: 'https://api.binance.com/api/v3',  // default; use Binance US: 'https://api.binance.us/api/v3'
  limit: 500,                                  // candles per HTTP request (max 1000)
});
```

**Timeframe mapping:**

| Library key | Binance interval |
|-------------|-----------------|
| `1m`        | `1m`            |
| `5m`        | `5m`            |
| `15m`       | `15m`           |
| `30m`       | `30m`           |
| `1h`        | `1h`            |
| `4h`        | `4h`            |
| `12h`       | `12h`           |
| `1d`        | `1d`            |
| `3d`        | `3d`            |
| `1w`        | `1w`            |
| `1month`    | `1M`            |

**Pagination:** On the initial load, `BinanceProvider` paginates backwards up to `INITIAL_PAGES` (default: 3) requests. With a limit of 1000, that is 3,000 candles of initial history. On lazy-load requests (when `req.to` is set), it fetches exactly one page.

**Market stats:** The provider implements `fetchMarketStats()` using Binance's `/ticker/24hr` endpoint, returning high24h, low24h, volume (quote), price change and percent change.

---

### CoinGecko Provider

Connects to the free CoinGecko v3 public API. No API key required for basic use; pass a Pro key via options to raise rate limits.

```typescript
import { CoinGeckoProvider } from './providers/examples/coingecko.js';

const provider = new CoinGeckoProvider({
  apiKey:     'CG-yourProKey',  // optional
  vsCurrency: 'usd',            // default: 'usd'
});
```

> **Note:** CoinGecko instruments use the **CoinGecko coin id** as the instrument `id` (e.g. `'bitcoin'`, `'ethereum'`, `'the-graph'`). Browse the full list at `https://api.coingecko.com/api/v3/coins/list`.

**Timeframe → days mapping** (CoinGecko OHLC endpoint uses a `days` parameter):

| Library key | Days fetched |
|-------------|-------------|
| `1m`–`30m`  | 1           |
| `1h`        | 7           |
| `4h`        | 30          |
| `12h`       | 90          |
| `1d`, `3d`  | 365         |
| `1w`, `2w`  | 730         |
| `1month`    | 365         |
| `6month`    | 1825        |
| `1y`        | 3650        |

---

### Generic REST Provider

A configurable template for connecting any REST/JSON API. Subclass `GenericRestProvider` or use it directly with a configuration object.

```typescript
import { GenericRestProvider } from './providers/examples/generic_rest.js';

const provider = new GenericRestProvider({
  // Build the candle-fetch URL
  candlesUrl: (id, tf) =>
    `https://api.mybroker.com/ohlcv?symbol=${id}&interval=${tf}&limit=500`,

  // Build the stats URL (optional)
  statsUrl: (id) =>
    `https://api.mybroker.com/stats/${id}`,

  // Map one row from your API to a RawCandle
  mapCandle: (row: any) => ({
    timestamp: row.openTime,
    open:      row.open,
    high:      row.high,
    low:       row.low,
    close:     row.close,
    volume:    row.volume,
  }),

  // Map your stats response
  mapStats: (s: any) => ({
    high24h:           s.highPrice,
    low24h:            s.lowPrice,
    volume24h:         s.volume,
    marketCap:         null,
    priceChange24h:    s.priceChange,
    priceChangePct24h: s.priceChangePercent,
  }),

  // Optional authentication headers
  headers: {
    'Authorization': `Bearer ${MY_API_KEY}`,
    'X-Client-ID':   'orbityx',
  },

  // Unwrap nested response envelopes
  // e.g. if response is { data: { candles: [...] } } → ['data', 'candles']
  candlesPath: ['data', 'candles'],
});
```

---

### Alpha Vantage Provider

A ready-to-use subclass of `GenericRestProvider` that handles Alpha Vantage's unusual envelope format for US equities and FX pairs.

```typescript
import { AlphaVantageProvider } from './providers/examples/generic_rest.js';

const provider = new AlphaVantageProvider('YOUR_API_KEY', {
  outputSize: 'full',   // 'compact' = last 100 candles, 'full' = up to 20 years
});

chart
  .setProvider(provider)
  .registerInstruments([
    { id: 'AAPL',    symbol: 'AAPL',    name: 'Apple Inc.',     icon: '', iconColor: '#555' },
    { id: 'MSFT',    symbol: 'MSFT',    name: 'Microsoft',      icon: 'M', iconColor: '#00a4ef' },
    { id: 'EUR/USD', symbol: 'EUR/USD', name: 'Euro/US Dollar', icon: '€', iconColor: '#003399' },
  ]);
```

Alpha Vantage uses the symbol directly as the instrument `id`. Forex pairs should be formatted as `'FROM/TO'` (e.g. `'EUR/USD'`).

---

### Mock Provider

An in-memory, zero-network provider that generates realistic OHLCV data using a random walk algorithm. Perfect for:
- Offline development
- Unit and integration testing
- Demo environments
- Storybook / visual regression testing

```typescript
import { MockProvider } from './providers/examples/mock.js';

const provider = new MockProvider({
  delayMs: 500,   // Simulate network latency (default: 0)
});
```

**Built-in seed prices:**

| Instrument id | Seed price |
|---------------|-----------|
| `DEMO_BTC`    | $65,000   |
| `DEMO_ETH`    | $3,400    |
| `DEMO_SOL`    | $145      |
| *(any other)* | $1,000    |

The random walk produces realistic candle shapes with volatility proportional to the seed price (1.2% per candle by default). Volume is also randomly generated.

---

## ⚙️ Chart Engine

The `ChartEngine` class is the heart of the library. It manages the canvas, processes all user interactions, maintains the viewport state, and drives the render loop.

### Chart Types

Switch between chart types via the toolbar or programmatically:

```typescript
engine.setChartType('candlestick');  // default
engine.setChartType('heikin_ashi');
engine.setChartType('line');
engine.setChartType('area');
engine.setChartType('bars');
```

| Type           | Description                                                                           |
|----------------|---------------------------------------------------------------------------------------|
| `candlestick`  | Classic OHLC candlestick chart with colored body and wicks                           |
| `heikin_ashi`  | Smoothed candlesticks computed from the Heikin-Ashi formula                          |
| `line`         | Simple line chart connecting close prices                                             |
| `area`         | Filled area chart with gradient below the line                                        |
| `bars`         | OHLC bar (American) chart with left/right tick marks                                  |

---

### Technical Indicators

Toggle indicators via the toolbar or programmatically:

```typescript
engine.toggleIndicator('sma_20');    // toggle SMA 20
engine.toggleIndicator('bb_20');     // toggle Bollinger Bands
engine.toggleIndicator('rsi_14');    // toggle RSI sub-panel
engine.toggleIndicator('macd');      // toggle MACD sub-panel
engine.toggleIndicator('volume');    // toggle volume panel
```

**Full indicator list:**

| ID        | Name               | Type     | Group           | Default Color |
|-----------|--------------------|----------|-----------------|---------------|
| `sma_20`  | SMA 20             | Overlay  | Moving Averages | `#f59e0b`     |
| `sma_50`  | SMA 50             | Overlay  | Moving Averages | `#3b82f6`     |
| `sma_200` | SMA 200            | Overlay  | Moving Averages | `#ef4444`     |
| `ema_12`  | EMA 12             | Overlay  | Moving Averages | `#a855f7`     |
| `ema_26`  | EMA 26             | Overlay  | Moving Averages | `#ec4899`     |
| `bb_20`   | Bollinger Bands    | Overlay  | Volatility      | `#06b6d4`     |
| `rsi_14`  | RSI 14             | Sub-panel| Momentum        | `#8b5cf6`     |
| `macd`    | MACD               | Sub-panel| Momentum        | `#22c55e`     |
| `volume`  | Volume             | Sub-panel| Volume          | `#64748b`     |

**Computation details:**

- **SMA**: Simple moving average over close prices.
- **EMA**: Exponential moving average seeded with SMA of the first `period` elements; α = 2/(period+1).
- **Bollinger Bands**: 20-period SMA as midline; upper/lower = midline ± 2×std dev. Filled with a semi-transparent band.
- **RSI**: 14-period RSI using Wilder's smoothing (equivalent to EMA with α = 1/14). Horizontal reference lines at 30, 50, 70.
- **MACD**: MACD line = EMA(12) − EMA(26); Signal = EMA(9) of MACD; Histogram = MACD − Signal. Histogram bars colored by positive/negative; MACD line in green, signal in amber.
- **Volume**: Proportional bars colored by candle direction (green/red).

---

### Drawing Tools

```typescript
engine.setDrawingMode('trendline');    // Two-click trendline
engine.setDrawingMode('horizontal');   // One-click horizontal level
engine.setDrawingMode('fibonacci');    // Two-click Fibonacci retracement
engine.setDrawingMode('rectangle');    // Two-click area rectangle
engine.setDrawingMode('none');         // Disable drawing mode

engine.clearDrawings();               // Remove all annotations
```

**Drawing workflow:**
1. Select a drawing tool from the toolbar.
2. Click on the chart to place the first point.
3. For two-point tools (trendline, fibonacci, rectangle), click again to finalize.
4. For horizontal lines, the first click completes the drawing.
5. Press `Escape` to cancel a draft drawing without saving.

Each drawing is stored internally as a `Drawing` object:

```typescript
interface Drawing {
  id:        string;      // Unique identifier
  type:      DrawingMode; // Drawing type
  points:    PricePoint[]; // [{timestamp, price}] — anchored to candle timestamps
  color:     string;      // CSS color string
  lineWidth: number;      // Stroke width in logical pixels
  label?:    string;      // Optional text label
  isDraft:   boolean;     // True while being drawn
}
```

---

### Viewport & Navigation

The viewport is controlled by two state variables:

| Variable         | Type     | Description                                                     |
|------------------|----------|-----------------------------------------------------------------|
| `offsetCandles`  | `number` | Number of candles offset from the right edge (0 = latest)      |
| `scaleX`         | `number` | Horizontal zoom multiplier (range: 0.2–20, default: 1)         |

These map to the visible window as:

```
visibleEnd   = data.length - offsetCandles
visibleStart = visibleEnd - maxVisibleCandles
```

Where `maxVisibleCandles = plotWidth / ((candleWidth + candleSpacing) × scaleX)`.

**Programmatic viewport control:**

```typescript
engine.resetView();           // scaleX → 1, offsetCandles → 0 (jump to latest)
engine.zoomIn();              // scaleX × 1.25
engine.zoomOut();             // scaleX / 1.25

// Direct state manipulation:
engine.state.offsetCandles += 50;  // pan 50 candles to the left
engine.state.scaleX = 2;           // 2× zoom
engine.updateVisibleData();        // recalculate visible window
engine.requestDraw();              // schedule a redraw
```

---

## 🖥️ UI Components

### Toolbar

The toolbar is built entirely in HTML + SVG via `buildHTML()` and mounted inside `#toolbar`. It creates:

- **Timeframe buttons**: `1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `12h`, `1d`, `1w`
- **Chart type buttons**: Candlestick, Heikin Ashi, Line, Area, Bars (with SVG icons)
- **Drawing tools**: Trendline, Horizontal, Fibonacci, Rectangle, Clear All
- **Indicator picker**: Grouped dropdown with checkboxes and color dots
- **Zoom / Reset**: +, −, Home buttons

All events are wired via `wireEvents()` using `data-tf`, `data-ct`, and `data-draw` attributes — no IDs needed on the individual buttons.

---

### Tooltip

The floating OHLCV tooltip creates a `<div class="chart-tooltip">` element, appends it to `<body>`, and positions it near the cursor.

**Contents:**
- Date in `DD Mon YYYY  HH:mm UTC` format
- Open, High (green), Low (red), Close (colored by direction)
- Change in absolute and percent form
- Volume with proportional fill bar

**Optimization:** The tooltip DOM is only updated when the hovered candle index changes, preventing redundant writes on every `mousemove` event.

---

### Legend Panel

The legend panel displays:
- **Instrument icon badge** (character + color)
- **Instrument name and symbol**
- **Live close price** (updates on every candle tick)
- **Price delta** and **delta %** vs previous candle
- **24h stats**: high, low, volume, market cap, change %

Stats are sourced from:
1. The provider's `fetchMarketStats()` call (refreshed every 60 seconds)
2. Fallback: computed from the cached candles via `dataManager.computeStats()`

---

### Theme System

```typescript
import { getStoredTheme, applyTheme, toggleTheme, initThemeToggle } from './ui/theme.js';

// Get current theme (reads localStorage, falls back to OS preference)
const theme = getStoredTheme(); // 'dark' | 'light'

// Apply a theme
applyTheme('dark');    // sets data-theme, CSS classes, updates toggle icon, persists

// Toggle dark ↔ light
const newTheme = toggleTheme();

// Wire up the toggle button (called by OrbityxChart.init())
initThemeToggle(engine); // also calls engine.applyTheme() on toggle
```

Theme changes dispatch a `'themeChanged'` custom DOM event with `detail: ThemeName`. The tooltip listens to this event to update its `data-theme` attribute.

---

## 📖 API Reference

### `OrbityxChart` Class

The main entry point. Constructed with an optional `canvasId`.

```typescript
const chart = new OrbityxChart({ canvasId: 'chartCanvas' });
```

#### Configuration methods (chainable)

| Method                                      | Returns | Description                                           |
|---------------------------------------------|---------|-------------------------------------------------------|
| `setProvider(provider: DataProvider)`       | `this`  | Register the data provider (required before init)     |
| `registerInstrument(instrument: Instrument)` | `this`  | Register a single instrument                          |
| `registerInstruments(instruments: Instrument[])` | `this` | Register multiple instruments at once              |
| `setWebSocketUrl(url: string)`              | `this`  | Set the WebSocket endpoint (optional)                 |
| `setDefaultInstrument(id: string)`          | `this`  | Override the initial instrument (default: first registered) |
| `setDefaultTimeframe(tf: string)`           | `this`  | Override the initial timeframe (default: `'1d'`)     |

#### Lifecycle methods

| Method            | Returns         | Description                                              |
|-------------------|-----------------|----------------------------------------------------------|
| `init()`          | `Promise<void>` | Initialize the chart (call after all configuration)      |
| `destroy()`       | `void`          | Clean up all subscriptions, timers, and event listeners  |

---

### `ChartEngine` Class

The canvas rendering engine. Accessible via `chart.engine` (though you typically interact with it through the `OrbityxChart` API).

#### Properties

| Property                  | Type                    | Description                                      |
|---------------------------|-------------------------|--------------------------------------------------|
| `canvas`                  | `HTMLCanvasElement`     | The canvas element                               |
| `config`                  | `ChartConfig`           | Full configuration object (mutable)              |
| `state`                   | `ChartState`            | Full runtime state (mutable)                     |
| `onNeedMoreData`          | `(() => void) \| null`  | Hook fired when the viewport nears the left edge |
| `fetchingMoreHistory`     | `boolean`               | Guard flag for concurrent history requests       |

#### Methods

| Method                              | Description                                               |
|-------------------------------------|-----------------------------------------------------------|
| `init(dataManager)`                 | Initialize canvas sizing, set data, wire events           |
| `setData(candles: Candle[])`        | Replace all data and redraw                               |
| `setTimeframe(tf: string)`          | Update the active timeframe (affects axis labels)         |
| `resetView()`                       | Reset zoom and offset to show the latest candles          |
| `zoomIn()`                          | Increase horizontal zoom by 25%                           |
| `zoomOut()`                         | Decrease horizontal zoom by 25%                           |
| `setChartType(type: ChartType)`     | Switch the chart rendering style                          |
| `setDrawingMode(mode: DrawingMode)` | Activate a drawing tool                                   |
| `clearDrawings()`                   | Remove all annotations                                    |
| `toggleIndicator(id: IndicatorId)`  | Enable or disable a technical indicator                   |
| `applyTheme(theme: ThemeName)`      | Switch the color scheme                                   |
| `getColors()`                       | Get the active `ThemeColors` object                       |
| `resizeCanvas()`                    | Re-measure the container and resize the canvas            |
| `requestDraw()`                     | Schedule a redraw via `requestAnimationFrame`             |
| `draw()`                            | Execute the full render pipeline synchronously            |
| `priceToY(price: number)`           | Convert a price value to a canvas Y coordinate            |
| `yToPrice(y: number)`               | Convert a canvas Y coordinate to a price value            |
| `indexToX(index: number)`           | Convert a visible candle index to a canvas X coordinate   |
| `xToIndex(x: number)`               | Convert a canvas X coordinate to a visible candle index   |
| `timestampToX(ts: number)`          | Convert an epoch-ms timestamp to a canvas X coordinate    |
| `getCandleAtCursor()`               | Return the candle under `state.mouseX`, or null           |
| `updateVisibleData()`               | Recalculate the visible window and trigger lazy-load check|
| `destroy()`                         | Remove all event listeners                                |

---

### `DataManager` Class

The in-memory OHLCV cache. Exported as a singleton `dataManager`.

```typescript
import dataManager from './core/data-manager.js';
```

| Method / Property                                        | Description                                                          |
|----------------------------------------------------------|----------------------------------------------------------------------|
| `loadCandles(id, tf): Promise<Candle[]>`                 | Full load — replaces the cache from the provider                     |
| `prependCandles(id, tf, endTime): Promise<number>`       | Lazy load — fetches older candles and prepends; returns count added  |
| `getData(): Candle[]`                                    | Returns a copy of the full cache                                     |
| `getSlice(start, n): Candle[]`                           | Returns a slice of the cache                                         |
| `processLiveTick(raw: unknown): void`                    | Push a live tick (updates existing or appends new candle)            |
| `attachSocket(socket: WebSocket): () => void`            | Pipe a WebSocket into `processLiveTick`; returns detach function     |
| `subscribe(callback): () => void`                        | Subscribe to cache changes; returns unsubscribe function             |
| `computeStats(): MarketStats`                            | Compute approximate 24h stats from cached candles                    |
| `currentInstrumentId`                                    | Active instrument id (informational)                                 |
| `currentTimeframe`                                       | Active timeframe (informational)                                     |
| `length`                                                 | Number of candles in the cache                                       |

---

### `ProviderRegistry` Class

The IoC boundary for all data access. Exported as the `registry` singleton.

```typescript
import { registry } from './services/api.js';
```

| Method                                             | Description                                                    |
|----------------------------------------------------|----------------------------------------------------------------|
| `setProvider(provider: DataProvider)`              | Register (or replace) the active data provider                 |
| `ensureInitialized()`                              | Call `provider.init()` once; no-op on subsequent calls         |
| `registerInstrument(instrument: Instrument)`       | Add an instrument to the registry                              |
| `registerInstruments(instruments: Instrument[])`   | Add multiple instruments                                       |
| `unregisterInstrument(id: string)`                 | Remove an instrument by id                                     |
| `getInstrument(id: string)`                        | Look up a registered instrument by id                          |
| `getAllInstruments(): Instrument[]`                 | All registered instruments in insertion order                  |
| `fetchCandles(request: CandleRequest)`             | Delegate to the provider (validates instrument id first)       |
| `fetchMarketStats(instrumentId: string)`           | Delegate to the provider (returns null if not implemented)     |
| `notifyInstrumentChange(id, tf)`                   | Call `provider.onInstrumentChange()` if implemented            |
| `destroy()`                                        | Tear down the provider and clear all state                     |
| `instrumentCount`                                  | Number of registered instruments                               |
| `provider`                                         | Direct access to the active `DataProvider` instance            |

---

### `WebSocketService` Class

Exported as the `wsService` singleton.

```typescript
import wsService from './services/ws.js';
```

| Method / Property                          | Description                                                      |
|--------------------------------------------|------------------------------------------------------------------|
| `setUrl(url: string)`                      | Override the WebSocket endpoint                                  |
| `connect()`                                | Open the connection                                              |
| `disconnect()`                             | Gracefully close; disables auto-reconnect                        |
| `subscribe(callback): () => void`          | Subscribe to messages; auto-connects; returns unsubscribe        |
| `send(message: WSMessage)`                 | Send a JSON message (silently drops if not OPEN)                 |
| `onStatus(callback): () => void`           | Listen for connection status changes                             |
| `isConnected`                              | `true` if the socket is OPEN                                     |

**Reconnect behavior:** Uses exponential back-off starting at 1 s, doubling on each attempt, capped at 30 s, with ±500 ms random jitter. Maximum 10 reconnect attempts.

---

## 📐 Types Reference

All types are in `types/index.ts`. The main interfaces:

```typescript
// The normalised candle used everywhere in the rendering layer.
interface Candle {
  timestamp: number; // Unix epoch milliseconds
  open:      number;
  high:      number;
  low:       number;
  close:     number;
  volume:    number; // 0 when source omits it
}

// Loose input — the library normalises this to Candle.
interface RawCandle {
  timestamp: number | string | Date;
  open:      number | string;
  high:      number | string;
  low:       number | string;
  close:     number | string;
  volume?:   number | string;
}

// Instrument descriptor — user-defined, never hard-coded.
interface Instrument {
  id:             string;
  symbol:         string;
  name:           string;
  icon?:          string;
  iconColor?:     string;
  pricePrecision?: number;
  meta?:          Record<string, unknown>;
}

// Optional provider-supplied 24h market statistics.
interface MarketStats {
  high24h:           number;
  low24h:            number;
  volume24h:         number;
  marketCap:         number | null;
  priceChange24h:    number;
  priceChangePct24h: number;
}
```

**Chart type unions:**

```typescript
type ChartType   = 'candlestick' | 'line' | 'area' | 'bars' | 'heikin_ashi';
type DrawingMode = 'none' | 'trendline' | 'horizontal' | 'vertical' | 'fibonacci' | 'rectangle';
type ThemeName   = 'dark' | 'light';
type IndicatorId = 'sma_20' | 'sma_50' | 'sma_200' | 'ema_12' | 'ema_26'
                 | 'bb_20' | 'rsi_14' | 'macd' | 'volume';
type Timeframe   = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '12h'
                 | '1d' | '3d' | '1w' | '2w' | '1month' | '3month' | '6month' | '1y';
```

---

## 🔧 Utility Functions

### Math Utilities

All functions in `utils/math.ts` are pure and stateless. They handle non-finite inputs gracefully.

```typescript
import {
  toFixedTrim, parseNumber, isFiniteNumber,
  clamp, round, sum, avg,
  sma, ema, rsi, macd, bollingerBands,
  stdDev, lerp, mapRange, niceAxisTicks,
} from './utils/math.js';
```

| Function                                              | Description                                                       |
|-------------------------------------------------------|-------------------------------------------------------------------|
| `toFixedTrim(value, digits?)`                         | Format to fixed decimals, trim trailing zeros → `"12.34"`        |
| `parseNumber(str)`                                    | Lenient number parser, strips `$`, `,`, etc.                     |
| `isFiniteNumber(n)`                                   | Type guard: `typeof n === 'number' && isFinite(n)`               |
| `clamp(val, min, max)`                                | Constrain to inclusive range                                      |
| `round(n, precision?)`                                | Round to N decimal places                                         |
| `sum(arr)`                                            | Sum finite values, skips NaN/Infinity                             |
| `avg(arr)`                                            | Arithmetic mean of finite values                                  |
| `sma(values, period)`                                 | Simple moving average — returns same-length array (NaN for early)|
| `ema(values, period)`                                 | Exponential moving average seeded with SMA                        |
| `rsi(closes, period?)`                                | RSI using Wilder's smoothing (default period: 14)                |
| `macd(closes, fast?, slow?, signal?)`                 | Returns `{ macdLine, signalLine, histogram }` arrays             |
| `bollingerBands(closes, period?, multiplier?)`        | Returns `{ upper, middle, lower }` arrays                        |
| `stdDev(values)`                                      | Population standard deviation                                     |
| `lerp(a, b, t)`                                       | Linear interpolation                                              |
| `mapRange(value, inMin, inMax, outMin, outMax)`        | Map value from one range to another                               |
| `niceAxisTicks(min, max, targetCount?)`               | Generate "nice" human-readable axis tick values                   |

---

### Format Utilities

```typescript
import {
  formatCurrency, formatPrice, formatNumber,
  formatPercent, formatPct, formatVolume, formatCompact,
} from './utils/format.js';
```

| Function                                              | Description                                                       |
|-------------------------------------------------------|-------------------------------------------------------------------|
| `formatCurrency(value, currency?, minFrac?, maxFrac?)` | Format as currency: `"$1,234.56"`                                |
| `formatPrice(value, currency?, precision?)`           | Auto-precision: <$0.01 → 6dp, <$1 → 4dp, else 2–4dp             |
| `formatNumber(value, minFrac?, maxFrac?)`             | Format plain number with Intl                                     |
| `formatPercent(value)`                                | 0–1 range → `"12.34%"` via Intl                                  |
| `formatPct(value, decimals?)`                         | 0–100 range → `"+12.34%"` with sign                              |
| `formatVolume(value)`                                 | K/M/B suffix: `"1.23M"`, `"456.78K"`                            |
| `formatCompact(value, maxFrac?)`                      | Intl compact notation: `"1.2M"`, `"3.4B"`                       |

All functions accept `unknown` and return `''` for invalid input.

`formatPrice` auto-precision logic:

| Absolute value | Min decimals | Max decimals |
|---------------|-------------|-------------|
| < $0.01        | 6           | 8           |
| < $1.00        | 4           | 6           |
| < $100.00      | 2           | 4           |
| ≥ $100.00      | 2           | 2           |

---

## ⚙️ Configuration

### ChartConfig

Modify `engine.config` directly after `init()` and call `engine.requestDraw()`:

```typescript
interface ChartConfig {
  theme:            ThemeName;     // 'dark' | 'light'
  darkTheme:        ThemeColors;
  lightTheme:       ThemeColors;
  candleWidth:      number;        // Logical pixels per candle body (default: 8)
  candleSpacing:    number;        // Gap between candles (default: 2)
  margin: {
    top:    number;                // Space above the price area (default: 40)
    right:  number;                // Space for the price axis (default: 80)
    bottom: number;                // Space for the time axis (default: 32)
    left:   number;                // Left margin (default: 10)
  };
  volumePanelRatio: number;        // Volume panel height as fraction of total (default: 0.18)
  volumePanelGap:   number;        // Gap between price and volume panels (default: 4)
}
```

### Theme Colors

Each theme has a full set of color tokens:

```typescript
interface ThemeColors {
  upColor:        string;   // Bullish candle body    default dark: rgba(34,197,94,0.85)
  downColor:      string;   // Bearish candle body    default dark: rgba(239,68,68,0.85)
  upWick:         string;   // Bullish wick           default dark: rgba(34,197,94,0.7)
  downWick:       string;   // Bearish wick           default dark: rgba(239,68,68,0.7)
  bgColor:        string;   // Canvas background      default dark: '#0f141b'
  panelBg:        string;   // Price area background  default dark: '#0b0f14'
  gridColor:      string;   // Grid lines             default dark: rgba(42,58,72,0.7)
  axisColor:      string;   // Axis ticks/lines       default dark: rgba(55,75,90,0.9)
  textColor:      string;   // Axis labels            default dark: rgba(200,210,220,0.9)
  mutedText:      string;   // Secondary labels       default dark: rgba(120,140,160,0.7)
  priceLineColor: string;   // Current price line     default dark: rgba(96,195,255,0.8)
  crosshairColor: string;   // Crosshair lines        default dark: rgba(120,160,200,0.6)
  selectionColor: string;   // Drag selection overlay default dark: rgba(96,195,255,0.12)
  volumeUp:       string;   // Volume bar (bull)      default dark: rgba(34,197,94,0.35)
  volumeDown:     string;   // Volume bar (bear)      default dark: rgba(239,68,68,0.35)
}
```

**Example: Custom theme**

```typescript
engine.config.darkTheme.upColor   = 'rgba(0, 200, 150, 0.9)';
engine.config.darkTheme.downColor = 'rgba(255, 80, 80, 0.9)';
engine.config.darkTheme.bgColor   = '#0a0a0f';
engine.requestDraw();
```

---

## 🔬 Advanced Usage

### Custom Provider

A complete custom provider with all optional methods:

```typescript
import type { DataProvider, CandleRequest, RawCandle, MarketStats } from './types/index.js';

export class MyExchangeProvider implements DataProvider {
  private token: string;
  private socket: WebSocket | null = null;

  constructor(token: string) {
    this.token = token;
  }

  // Called once by registry.ensureInitialized()
  async init(): Promise<void> {
    // Authenticate, warm up connection pools, etc.
    const auth = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
    });
    if (!auth.ok) throw new Error('Authentication failed');
  }

  async fetchCandles(req: CandleRequest): Promise<RawCandle[]> {
    const params = new URLSearchParams({
      symbol:    req.instrumentId,
      interval:  req.timeframe,
      limit:     '500',
    });

    // Honor the lazy-load signal: req.to means "fetch one page ending before this"
    if (req.to !== undefined) {
      params.set('endTime', String(req.to));
    }

    const res = await fetch(
      `https://api.myexchange.com/klines?${params}`,
      { headers: { 'X-API-KEY': this.token } },
    );

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    return data.map((row: any) => ({
      timestamp: row[0],
      open:      row[1],
      high:      row[2],
      low:       row[3],
      close:     row[4],
      volume:    row[5],
    }));
  }

  async fetchMarketStats(instrumentId: string): Promise<Partial<MarketStats>> {
    const res = await fetch(`https://api.myexchange.com/stats/${instrumentId}`);
    const s = await res.json();
    return {
      high24h:           s.high,
      low24h:            s.low,
      volume24h:         s.volume,
      marketCap:         s.marketCap ?? null,
      priceChange24h:    s.change,
      priceChangePct24h: s.changePct,
    };
  }

  onInstrumentChange(instrumentId: string, timeframe: string): void {
    // Update WebSocket subscriptions here
    this.socket?.send(JSON.stringify({
      method: 'SUBSCRIBE',
      params: [`${instrumentId.toLowerCase()}@kline_${timeframe}`],
    }));
  }

  destroy(): void {
    this.socket?.close();
    this.socket = null;
  }
}
```

---

### Multiple Charts on One Page

Each chart instance needs a separate canvas element. Use the exported `ProviderRegistry` class (not the singleton) to create isolated registry instances:

```typescript
import OrbityxChart from './main.js';
import { ProviderRegistry } from './services/api.js';
import { BinanceProvider } from './providers/examples/binance.js';

// Chart 1 — BTC/USDT
const chart1 = new OrbityxChart({ canvasId: 'canvas1' });
chart1
  .setProvider(new BinanceProvider())
  .registerInstruments([{ id: 'BTCUSDT', symbol: 'BTC/USDT', name: 'Bitcoin', icon: '₿', iconColor: '#f7931a' }]);
await chart1.init();

// Chart 2 — ETH/USDT (independent instance)
const chart2 = new OrbityxChart({ canvasId: 'canvas2' });
chart2
  .setProvider(new BinanceProvider())
  .registerInstruments([{ id: 'ETHUSDT', symbol: 'ETH/USDT', name: 'Ethereum', icon: 'Ξ', iconColor: '#627eea' }]);
await chart2.init();
```

> **Note:** The `registry` singleton and `dataManager` singleton are shared between all instances on the same page. For true isolation, you would need to fork those singletons. The `ProviderRegistry` class is exported specifically to support this use case in future versions.

---

### Direct DataManager Usage

You can use `DataManager` independently of the chart, for example in a Node.js data pipeline or a headless testing environment:

```typescript
import dataManager from './core/data-manager.js';
import { registry } from './services/api.js';
import { MockProvider } from './providers/examples/mock.js';

// Set up registry
registry.setProvider(new MockProvider());
registry.registerInstrument({ id: 'TEST', symbol: 'TEST/USD', name: 'Test' });

// Subscribe to data updates
const unsub = dataManager.subscribe(candles => {
  console.log(`Received ${candles.length} candles`);
  console.log('Latest close:', candles[candles.length - 1]?.close);
});

// Load data
await dataManager.loadCandles('TEST', '1d');

// Push a live tick
dataManager.processLiveTick({
  timestamp: Date.now(),
  open: 100, high: 105, low: 98, close: 103, volume: 1234,
});

// Clean up
unsub();
```

---

### Infinite Backwards Scroll

The lazy history loading system works automatically when you wire up the provider to handle `req.to`. Here is how the flow works end-to-end:

```
User pans left  →  ChartEngine.updateVisibleData()
                     detects: viewportStart < LAZY_LOAD_THRESHOLD (80 candles)
                       sets: engine.fetchingMoreHistory = true
                       calls: engine.onNeedMoreData()
                                ↓
                         OrbityxChart.loadMoreHistory()
                           sets: _loadingMore = true
                           calls: dataManager.prependCandles(id, tf, oldest.timestamp - 1)
                                    ↓
                              registry.fetchCandles({ instrumentId, timeframe, to: endTime })
                                    ↓
                              YourProvider.fetchCandles(req)  ← req.to is set here
                                    ↓
                              Returns one page of older candles
                                    ↓
                           DataManager prepends and re-sorts
                           Returns added count
                             ↓
                           engine.state.offsetCandles += added   (viewport stays still)
                           engine.setData(dataManager.getData())
                           engine.fetchingMoreHistory = false
                           _loadingMore = false
```

To implement this in your provider, simply check `req.to`:

```typescript
async fetchCandles(req: CandleRequest): Promise<RawCandle[]> {
  const params: Record<string, string> = {
    symbol:   req.instrumentId,
    interval: req.timeframe,
    limit:    '500',
  };

  if (req.to !== undefined) {
    // Single backwards page for lazy history loading
    params.endTime = String(req.to);
  }

  // ... fetch and return
}
```

---

### Custom WebSocket Integration

If your server sends messages in a non-standard format, bypass the built-in `ws.ts` and push ticks directly:

```typescript
import dataManager from './core/data-manager.js';

const socket = new WebSocket('wss://myserver.com/stream');

socket.onmessage = (ev) => {
  const raw = JSON.parse(ev.data);

  // Convert your format to something DataManager can normalise
  if (raw.type === 'tick') {
    dataManager.processLiveTick({
      timestamp: raw.closeTime,
      open:      raw.openPrice,
      high:      raw.highPrice,
      low:       raw.lowPrice,
      close:     raw.closePrice,
      volume:    raw.baseVolume,
    });

    // Notify the engine to redraw
    engine.setData(dataManager.getData());
  }
};
```

---

## ⌨️ Keyboard Shortcuts

| Key            | Action                            |
|----------------|-----------------------------------|
| `+` / `=`      | Zoom in                           |
| `-` / `_`      | Zoom out                          |
| `←` Arrow      | Pan left (older candles)          |
| `→` Arrow      | Pan right (newer candles)         |
| `Home` / `0`   | Reset view (jump to latest)       |
| `Escape`       | Cancel drawing / deselect tool    |

---

## 🌐 Browser Support

| Browser          | Minimum Version | Notes                                 |
|------------------|-----------------|---------------------------------------|
| Chrome / Edge    | 80+             | Full support                          |
| Firefox          | 75+             | Full support                          |
| Safari           | 14+             | Full support (requires `ctx.roundRect` polyfill for < 15.4) |
| Opera            | 67+             | Full support                          |

**Required browser APIs:**
- `HTMLCanvasElement` + Canvas 2D Context
- `requestAnimationFrame`
- `WebSocket`
- `ResizeObserver` (via `window.resize` event fallback)
- `CustomEvent`
- `Intl.NumberFormat`
- `localStorage`
- `window.matchMedia`

**Not required:**
- Any framework (React, Vue, Angular, etc.)
- Any build tool (works with native ES modules in modern browsers)
- Any CSS framework

---

## 📊 Performance Notes

- **Dirty-flag rendering**: `requestDraw()` uses a `rafPending` flag to avoid queuing multiple animation frames. Only one draw per frame, regardless of how many state changes happen.
- **Viewport culling**: Only the visible window of candles is iterated during rendering — the full dataset is never traversed per frame.
- **Indicator memoization**: `indicatorCache` is invalidated only when `setData()` is called. Viewport changes (pan/zoom) do not recompute indicators.
- **Tooltip optimization**: The tooltip DOM is only mutated when the hovered candle index changes (`lastIndex` guard in `tooltip.ts`).
- **Subscriber snapshot**: `DataManager.notify()` sends a `[...this.cache]` copy to each subscriber, preventing accidental mutation from callbacks.
- **Concurrent fetch guard**: `_loadingMore` and `fetchingMoreHistory` flags prevent duplicate history requests from the same scroll event stream.

**FPS target:** The chart is designed to maintain 60 FPS during pan/zoom interactions on datasets of up to ~10,000 candles on a modern machine. For larger datasets, increase `candleSpacing` to reduce the maximum visible candle count.

---

## 🤝 Contributing

We welcome contributions of all kinds — bug reports, feature requests, documentation improvements, and pull requests.

### Getting started

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/Orbityx-charts.git
cd Orbityx-charts
npm install
npm run dev        # Start dev server with hot reload
npm run build      # Production build
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint
npm test           # Run tests
```

### Branch conventions

| Branch            | Purpose                                         |
|-------------------|-------------------------------------------------|
| `main`            | Stable releases                                 |
| `develop`         | Integration branch for in-progress features     |
| `feature/xyz`     | New features                                    |
| `fix/xyz`         | Bug fixes                                       |
| `docs/xyz`        | Documentation updates                           |
| `refactor/xyz`    | Refactoring without functional changes          |

### Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(providers): add Polygon.io provider
fix(engine): correct priceToY calculation near viewport edge
docs(readme): add advanced WebSocket integration example
refactor(math): extract EMA seed calculation to helper
chore(build): upgrade TypeScript to 5.4
```

### Pull Request checklist

- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] No new ESLint warnings (`npm run lint`)
- [ ] All existing tests pass (`npm test`)
- [ ] New functionality is covered by tests
- [ ] README or JSDoc updated if public API changed
- [ ] Commit messages follow Conventional Commits
- [ ] PR description explains the change and links any related issues

### Reporting bugs

Please open a [GitHub issue](https://github.com/BorisMalts/Orbityx-charts/issues) with:
- Browser and OS
- Steps to reproduce
- Expected vs actual behavior
- A minimal code snippet or CodeSandbox link if possible

---

## 📋 Changelog

### v2.0.0 (latest)

- **Added** `loadMoreHistory()` — seamless infinite backwards scroll via lazy history fetching
- **Added** `engine.onNeedMoreData` hook — the engine triggers history fetches automatically as the user pans left
- **Added** `DataManager.prependCandles()` — fetch and merge one page of older candles without viewport jump
- **Added** `_loadingMore` flag — prevents concurrent backward history requests
- **Fixed** History loader state now resets on `switchInstrument()` and `handleTimeframeChange()` so changing symbol/timeframe never leaves the loader stuck
- **Added** `BinanceProvider` multi-page initial load (3 pages × 1000 candles = 3,000 candle initial history)
- **Added** `BinanceProvider` `INITIAL_PAGES` configurable constant
- **Changed** `TF_LIMIT` raised to 1000 (Binance REST maximum) for all timeframes
- **Added** `AlphaVantageProvider` for US equities and FX pairs
- **Fixed** `GenericRestProvider` — `TS2769` exactOptionalPropertyTypes compliance for `headers` and `candlesPath`
- **Fixed** `tooltip.ts` — replaced `Record<string, HTMLElement>` with named `TooltipRefs` interface to eliminate TS18048 errors
- **Fixed** `tooltip.ts` — duplicate `formatDate` declaration removed; replaced with local `formatTimestamp`
- **Improved** Chart engine: `LAZY_LOAD_THRESHOLD` = 80 candles (was 20)
- **Improved** WebSocket: exponential back-off with ±500ms jitter, MAX_RECONNECT = 10

### v1.0.0

- Initial release with full canvas-based rendering engine
- Five chart types: candlestick, heikin ashi, line, area, bars
- Nine technical indicators: SMA 20/50/200, EMA 12/26, Bollinger Bands, RSI, MACD, Volume
- Drawing tools: trendline, horizontal, fibonacci, rectangle
- Dark/light themes with OS preference detection
- BinanceProvider and CoinGeckoProvider examples
- MockProvider for offline development
- Fully typed with TypeScript strict mode

---

## 📄 License

```
Copyright 2025 Boris Maltsev, Andrey Karavaev

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

See the full [LICENSE](./LICENSE) file for details.

---

## 👨‍💻 Authors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/BorisMalts">
        <img src="https://github.com/BorisMalts.png" width="100px;" alt="Boris Maltsev" style="border-radius: 50%;"/>
        <br />
        <b>Boris Maltsev</b>
      </a>
      <br />
      <sub>Developer</sub>
      <br />
      <a href="https://github.com/BorisMalts">@BorisMalts</a>
    </td>
    <td align="center">
      <a href="https://github.com/Andre-wb">
        <img src="https://github.com/Andre-wb.png" width="100px;" alt="Andrey Karavaev" style="border-radius: 50%;"/>
        <br />
        <b>Andrey Karavaev</b>
      </a>
      <br />
      <sub>Developer</sub>
      <br />
      <a href="https://github.com/Andre-wb">@Andre-wb</a>
    </td>
  </tr>
</table>

---

<div align="center">

**[⬆ Back to top](#orbityx-chart-pro)**

Made by [Boris Maltsev](https://github.com/BorisMalts) and [Andrey Karavaev](https://github.com/Andre-wb)

[![GitHub](https://img.shields.io/badge/GitHub-Orbityx--charts-181717?style=for-the-badge&logo=github)](https://github.com/BorisMalts/Orbityx-charts)

</div>
