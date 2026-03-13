# Changelog

All notable changes to **Orbityx Chart Pro** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Touch / mobile gesture support (pinch-to-zoom, swipe pan)
- `ProviderRegistry` isolation per chart instance (full multi-chart support without shared singletons)
- Additional drawing tools: vertical line, extended trendline, pitchfork
- Alert / price level notifications API
- CSV and JSON file import provider
- Polygon.io ready-made adapter
- OANDA / FX adapter
- Stochastic Oscillator, ATR, Williams %R indicators
- Annotations API (text labels on price points)
- Snapshot / export canvas as PNG
- ResizeObserver-based canvas sizing (replaces `window.resize` listener)
- `destroy()` cleanup audit — full AbortController integration for in-flight fetches

---

## [2.0.0] — 2024-06-01

### Summary

Version 2.0 is a major feature release focused on **infinite backwards history scrolling**, a reworked data loading pipeline, a significantly more capable Binance adapter, and multiple TypeScript strict-mode fixes across the UI layer.

---

### Added

#### Core — Infinite Backwards History Scroll
- **`OrbityxChart.loadMoreHistory()`** — new private method that fetches one page of candles strictly older than the current oldest cached candle and prepends them to the `DataManager` cache. The viewport is shifted by the exact number of prepended candles so the visible window does not jump.
- **`engine.onNeedMoreData`** hook (`(() => void) | null`) — the `ChartEngine` now exposes a callback that fires automatically when the visible viewport comes within `LAZY_LOAD_THRESHOLD` candles of the left edge. Wired to `loadMoreHistory()` in `OrbityxChart.init()`.
- **`engine.fetchingMoreHistory`** flag (`boolean`) — guards the `onNeedMoreData` hook against firing multiple times from the same scroll event stream. Reset by `loadMoreHistory()` in its `finally` block.
- **`OrbityxChart._loadingMore`** flag (`boolean`) — second guard layer that prevents concurrent backwards fetch requests at the application level. Reset in both `switchInstrument()` and `handleTimeframeChange()` so changing symbol or timeframe can never leave the loader stuck.
- **`LAZY_LOAD_THRESHOLD = 80`** — the number of candles from the left edge that triggers a history fetch. Raised from the previous value of 20 to give the fetch enough lead time on fast pans.

#### Core — DataManager
- **`DataManager.prependCandles(instrumentId, timeframe, endTime)`** — new public method. Fetches one backwards page from the provider (passing `req.to = endTime`), normalises and deduplicates against the existing cache, merges and re-sorts, notifies subscribers, and returns the count of newly added candles. Returns `0` when the provider returns nothing (signals end of available history).

#### Providers — BinanceProvider
- **Multi-page initial load** — `fetchCandles()` now paginates backwards up to `INITIAL_PAGES` (default `3`) requests on the first load, delivering up to 3,000 candles of initial history instead of a single page.
- **`INITIAL_PAGES`** constant (`3`) — configurable via subclassing.
- **`TF_LIMIT` raised to 1000** — matches the Binance REST API maximum, maximising candles per request and reducing round trips.
- **Single-page lazy-load path** — when `req.to` is present, `BinanceProvider.fetchCandles()` fetches exactly one page ending before that timestamp. No further pagination is performed, keeping lazy loads fast and predictable.
- **`BinanceOptions.limit`** field — hard cap on candles per HTTP request (max 1000). Useful for rate-limited environments.

#### Providers — AlphaVantageProvider
- **New `AlphaVantageProvider`** class (in `providers/examples/generic_rest.ts`) — a ready-to-use subclass of `GenericRestProvider` for US equities (`TIME_SERIES_DAILY`) and FX pairs (`FX_DAILY`). Handles Alpha Vantage's nested `"Time Series (Daily)"` response envelope via a full `fetchCandles()` override. Supports `outputSize: 'compact' | 'full'`.

#### package.json
- Added `exports` map for all public subpath imports (`./providers/binance`, `./providers/mock`, `./utils/math`, etc.)
- Added `files` field listing what ships in the npm package
- Added `contributors` array with both authors
- Added `repository`, `homepage`, `bugs` fields
- Added `sideEffects: false` for tree-shaking support
- Added `engines` field (`node >= 18`, `npm >= 9`)
- Extended `keywords` from 6 to 26 entries
- Added `devDependencies`: `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `prettier`
- Added scripts: `build:watch`, `clean`, `lint:fix`, `format`, `format:check`, `prebuild`, `prepublishOnly`
- Corrected `license` field from `"MIT"` to `"Apache-2.0"`

---

### Changed

#### Core — ChartEngine
- `LAZY_LOAD_THRESHOLD` raised from `20` to `80` candles. This gives the asynchronous history fetch more lead time when the user pans quickly to the left.
- `updateVisibleData()` now sets `fetchingMoreHistory = true` before calling `onNeedMoreData()`, ensuring the engine gate is always held before the async fetch starts.

#### Providers — BinanceProvider
- `TF_LIMIT` entries for all minute and hour timeframes raised to `1000` (was `200`–`500`).
- `fetchPage()` signature extended to accept optional `startTime` parameter alongside the existing `endTime`, enabling future range-based fetches.

#### UI — Toolbar (`toolbar.ts`)
- Timeframe button list now starts at `1m` with the first button marked `active` by default (index `0`).
- `timeframeLabel()` helper is now exported from `toolbar.ts` for use in other UI modules.

#### Configuration
- `DEFAULT_CONFIG.candleWidth` documentation updated to clarify it is in logical (CSS) pixels, not physical pixels.
- `ChartConfig.volumePanelGap` default confirmed as `4` logical pixels.

---

### Fixed

#### TypeScript strict-mode fixes
- **`tooltip.ts` — TS18048** (`Object is possibly 'undefined'`): replaced the `Record<string, HTMLElement>` DOM reference bag with a named `TooltipRefs` interface where every field is a non-optional `HTMLElement`. Eliminates all "possibly undefined" errors on field access without requiring non-null assertions.
- **`tooltip.ts` — TS2307** (`Cannot find module '../utils/format'`): changed import to point directly to `'../utils/format.js'` instead of the barrel index, resolving the missing-module error.
- **`tooltip.ts` — duplicate identifier**: removed the duplicate `formatDate` declaration; replaced with a private local `formatTimestamp()` function that formats epoch-ms as `"DD Mon YYYY  HH:mm UTC"`.
- **`generic_rest.ts` — TS2769** (`exactOptionalPropertyTypes`): `RequestInit` objects are now built conditionally — the `headers` property is only included when `this.config.headers` is defined, so the key is absent (not `undefined`) when omitted.
- **`generic_rest.ts` — TS2379** (`exactOptionalPropertyTypes`): `AlphaVantageProvider`'s super-call config object no longer includes `candlesPath: undefined`; the key is simply omitted from the object literal.
- **`data-manager.ts`**: `prependCandles()` correctly filters out any timestamps already present in the cache before merging, preventing duplicates at page seams.

#### Rendering
- `drawCurrentPriceLine()`: the price tag badge now uses `ctx.roundRect()` which was already called in v1 but could throw on Safari < 15.4. No polyfill is included yet (tracked in Unreleased).
- `drawSubPanel()` for MACD: `rangeMin`/`rangeMax` auto-calculation now correctly takes the absolute max of both positive and negative values, preventing asymmetric sub-panel scaling when the histogram is heavily one-sided.

#### WebSocket
- `WebSocketService.scheduleReconnect()`: jitter is now `Math.random() * 500` ms (was `Math.random() * 1000`), reducing the reconnect storm window on mass-reconnect events.

---

### Removed
- Nothing removed in this release. All v1 public API is fully backwards-compatible.

---

## [1.0.0] — 2024-03-15

### Summary

Initial public release of Orbityx Chart Pro. A full-featured, zero-dependency, TypeScript-first canvas charting library with a provider-agnostic data layer.

---

### Added

#### Core
- **`ChartEngine`** — canvas-based OHLCV renderer with full high-DPI support (`window.devicePixelRatio`), `requestAnimationFrame` render loop with dirty-flag optimization, and complete viewport math (price↔Y, index↔X, timestamp→X).
- **`DataManager`** — in-memory OHLCV cache with normalisation (arrays, objects, ISO strings, field aliases), validation, ascending sort, pub/sub subscriptions, live tick merging, and approximate 24h stats computation.
- **`ProviderRegistry`** (`services/api.ts`) — IoC boundary for all data access. Holds the active `DataProvider`, validates instrument registration before every fetch, and delegates all calls. Exported as the `registry` singleton and as the `ProviderRegistry` class for multi-instance use.
- **`WebSocketService`** (`services/ws.ts`) — resilient WebSocket client with exponential back-off reconnect (base 1 s, cap 30 s), heartbeat ping (20 s interval), pub/sub message routing, and connection status callbacks. Exported as the `wsService` singleton.
- **`computeAllIndicators()`** / **`computeIndicator()`** (`core/indicators.ts`) — pure stateless indicator computation engine for SMA, EMA, Bollinger Bands, RSI (Wilder's smoothing), and MACD.

#### Chart Types
- `candlestick` — classic OHLC with colored body and wicks, border stroke at bodyW > 3 px
- `heikin_ashi` — Heikin-Ashi smoothed candles computed on the fly from visible data
- `line` — close-price polyline
- `area` — filled area with linear gradient (rgba(34,197,94,…))
- `bars` — OHLC American-style bar chart with left/right tick marks

#### Technical Indicators
- `sma_20` — Simple Moving Average, 20-period, amber `#f59e0b`
- `sma_50` — Simple Moving Average, 50-period, blue `#3b82f6`
- `sma_200` — Simple Moving Average, 200-period, red `#ef4444`
- `ema_12` — Exponential Moving Average, 12-period, purple `#a855f7`
- `ema_26` — Exponential Moving Average, 26-period, pink `#ec4899`
- `bb_20` — Bollinger Bands (20-period SMA, 2σ) with filled band, cyan `#06b6d4`
- `rsi_14` — RSI sub-panel (14-period, Wilder), reference lines at 30/50/70, violet `#8b5cf6`
- `macd` — MACD sub-panel (12/26/9): histogram bars, MACD line (green), signal line (amber)
- `volume` — Volume panel with proportional up/down bars (18% of chart height)

#### Drawing Tools
- `trendline` — two-click line anchored to candle timestamps and price levels
- `horizontal` — one-click fixed price level extending full width
- `fibonacci` — two-click Fibonacci retracement with 7 levels (0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%) in distinct colors
- `rectangle` — two-click area box with semi-transparent fill
- `clearDrawings()` — removes all annotations in one call
- Draft drawing system — in-progress drawings shown with dashed crosshair color, cancelled with Escape

#### UI Components
- **Toolbar** (`ui/toolbar.ts`) — fully HTML/SVG generated; mounts into `#toolbar`. Groups: Timeframe, Chart Type, Drawing, Indicators, Zoom/Reset.
- **Tooltip** (`ui/tooltip.ts`) — floating OHLCV card: date, O/H/L/C, change %, volume with fill bar. Updates only on candle index change.
- **Legend** (`ui/legend.ts`) — instrument icon badge, name, live price, delta, 24h high/low/volume/market cap/change. Provider stats with candle-based fallback.
- **Theme** (`ui/theme.ts`) — dark/light themes; OS preference detection via `prefers-color-scheme`; localStorage persistence; `themeChanged` custom DOM event; toggle button wiring.
- **`populateSymbolSelector()`** — auto-populates `<select id="symbol-select">` from the registry.

#### Providers (examples)
- **`BinanceProvider`** — Binance Spot klines with 24h ticker stats.
- **`CoinGeckoProvider`** — CoinGecko v3 OHLC + `/coins/markets` stats; optional Pro API key.
- **`GenericRestProvider`** — configurable template: `candlesUrl`, `statsUrl`, `mapCandle`, `mapStats`, `headers`, `candlesPath` envelope unwrapping.
- **`MockProvider`** — random walk generator; seed prices for `DEMO_BTC`, `DEMO_ETH`, `DEMO_SOL`; configurable `delayMs`.

#### Utilities
- **`utils/math.ts`**: `toFixedTrim`, `parseNumber`, `isFiniteNumber`, `clamp`, `round`, `sum`, `avg`, `sma`, `ema`, `rsi`, `macd`, `bollingerBands`, `stdDev`, `lerp`, `mapRange`, `niceAxisTicks`
- **`utils/format.ts`**: `formatCurrency`, `formatPrice` (auto-precision), `formatNumber`, `formatPercent`, `formatPct`, `formatVolume`, `formatCompact`
- **`utils/date.ts`**: `parseISO`, `axisLabel`, `formatDate`

#### Interaction
- Mouse wheel zoom (centered, smooth, range 0.2×–20×)
- Click-and-drag pan
- Keyboard: `+`/`=` zoom in, `-`/`_` zoom out, `←`/`→` pan, `Home`/`0` reset view, `Escape` cancel drawing
- FPS monitor (`#frame-rate`)
- Connection status dot (`#connection-status`)
- Fullscreen toggle (`#fullscreen-btn`)
- Settings modal scaffold (`#settings-modal`)
- Loading indicator (`#loading-indicator`)
- Error notification with 8 s auto-dismiss (`#error-notification`)

#### Configuration
- `DEFAULT_CONFIG` — full `ChartConfig` with dark and light `ThemeColors` token sets, candleWidth 8, candleSpacing 2, margin (top 40, right 80, bottom 32, left 10), volumePanelRatio 0.18, volumePanelGap 4.
- `STATS_REFRESH_MS = 60_000` — 24h stats polling interval.

---

## Legend

| Symbol | Meaning                        |
|--------|--------------------------------|
| ✨     | New feature                    |
| 🔧     | Bug fix                        |
| 💥     | Breaking change                |
| ⚡     | Performance improvement        |
| 📝     | Documentation update           |
| 🔒     | Security fix                   |
| 🗑️     | Deprecated / removed           |

---

[Unreleased]: https://github.com/BorisMalts/Orbityx-charts/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/BorisMalts/Orbityx-charts/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/BorisMalts/Orbityx-charts/releases/tag/v1.0.0