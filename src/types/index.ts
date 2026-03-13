/**
 * @file types/index.ts
 * @description Central type registry for Orbityx Chart Pro.
 *
 * The library is completely provider-agnostic. There are no references to
 * CoinGecko, Binance, or any specific data source anywhere in the core.
 * All data flows through the DataProvider interface that the user implements.
 */

// ─────────────────────────────────────────────────────────────────────────────
// OHLCV Data
// ─────────────────────────────────────────────────────────────────────────────

/** Raw candle accepted from any external source before normalisation. */
export interface RawCandle {
    timestamp: number | string | Date;
    open:      number | string;
    high:      number | string;
    low:       number | string;
    close:     number | string;
    volume?:   number | string;
}

/** Normalised, validated candle used by the rendering engine. */
export interface Candle {
    /** Unix epoch milliseconds (UTC). */
    timestamp: number;
    open:      number;
    high:      number;
    low:       number;
    close:     number;
    /** Volume in base-currency units; 0 when source omits it. */
    volume:    number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Instrument
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Describes a single tradable instrument shown in the symbol selector.
 * Created and registered by the user — the library never hard-codes any list.
 *
 * @example
 * chart.registerInstrument({
 *   id:             'btc_usdt',
 *   symbol:         'BTC/USDT',
 *   name:           'Bitcoin',
 *   icon:           '₿',
 *   iconColor:      '#f7931a',
 *   pricePrecision: 2,
 * });
 */
export interface Instrument {
    /**
     * Unique key used throughout the library.
     * Passed verbatim to DataProvider.fetchCandles() and fetchMarketStats().
     * Can be anything: 'btc_usdt', 'AAPL', 'EUR/USD', 'my-custom-index', etc.
     */
    id: string;

    /**
     * Short label shown in the UI (e.g. 'BTC/USDT', 'AAPL', 'EUR/USD').
     */
    symbol: string;

    /** Full name shown in the legend panel (e.g. 'Bitcoin', 'Apple Inc.'). */
    name: string;

    /**
     * Single character or emoji for the icon badge.
     * Defaults to the first character of `symbol`.
     */
    icon?: string;

    /** CSS colour for the icon badge background/text. */
    iconColor?: string;

    /**
     * Decimal places used to format prices.
     * Default: 2. Increase for low-priced assets (e.g. 6 for SHIB/USDT).
     */
    pricePrecision?: number;

    /**
     * Arbitrary user metadata — never read by the library.
     */
    meta?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeframe
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Well-known timeframe keys used by the toolbar.
 * Passed verbatim to DataProvider.fetchCandles() so the provider can
 * map them to its own exchange API parameters.
 */
export type Timeframe =
    | '1m' | '5m' | '15m' | '30m'
    | '1h' | '4h' | '12h'
    | '1d' | '3d' | '1w' | '2w'
    | '1month' | '3month' | '6month'
    | '1y';

// ─────────────────────────────────────────────────────────────────────────────
// DataProvider  ← the only contract the library imposes on the user
// ─────────────────────────────────────────────────────────────────────────────

/** Arguments passed to DataProvider.fetchCandles(). */
export interface CandleRequest {
    /** Instrument id as registered with chart.registerInstrument(). */
    instrumentId: string;
    /** Timeframe key selected in the toolbar (e.g. '1h', '1d'). */
    timeframe: Timeframe | string;
    /** Optional: fetch candles starting from this epoch-ms. */
    from?: number;
    /** Optional: fetch candles up to this epoch-ms. */
    to?: number;
    /** Optional: maximum number of candles to return. */
    limit?: number;
}

/** Optional 24-hour market statistics shown in the legend panel. */
export interface MarketStats {
    high24h:           number;
    low24h:            number;
    volume24h:         number;
    /** Market cap in quote-currency units; null when not available. */
    marketCap:         number | null;
    priceChange24h:    number;
    priceChangePct24h: number;
}

/**
 * The sole interface users must implement to connect Orbityx to any
 * data source: REST API, WebSocket, local DB, CSV files, mock data, etc.
 *
 * Only `fetchCandles` is required. All other methods progressively
 * enhance the UI when present.
 *
 * @example — minimal provider
 * ```ts
 * const myProvider: DataProvider = {
 *   async fetchCandles({ instrumentId, timeframe }) {
 *     const rows = await myApi.getOHLCV(instrumentId, timeframe);
 *     return rows.map(r => ({
 *       timestamp: r.time * 1000,
 *       open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v,
 *     }));
 *   },
 * };
 * chart.setProvider(myProvider);
 * ```
 */
export interface DataProvider {
    /**
     * Fetch OHLCV candles for the given request.
     * Return an array of RawCandle or Candle objects — the library normalises either.
     * Throw (or return a rejected Promise) to surface the error in the UI.
     */
    fetchCandles(request: CandleRequest): Promise<RawCandle[] | Candle[]>;

    /**
     * Optionally fetch 24-hour market statistics shown in the legend.
     * When omitted, the library approximates stats from the loaded candles.
     */
    fetchMarketStats?(instrumentId: string): Promise<Partial<MarketStats>>;

    /**
     * Called once during chart.init(). Use it to authenticate, open connections,
     * or fetch a dynamic instrument list.
     */
    init?(): Promise<void>;

    /**
     * Called when the user changes the active instrument or timeframe so the
     * provider can update live subscriptions.
     */
    onInstrumentChange?(instrumentId: string, timeframe: string): void;

    /** Called when the chart is destroyed — close connections, clear timers. */
    destroy?(): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket envelope
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Message shape expected by the built-in ws.ts service.
 * You can bypass ws.ts entirely and push ticks directly via
 * DataManager.processLiveTick() if your streaming format differs.
 */
export interface WSMessage {
    type:       'candle' | 'trade' | 'heartbeat' | 'pong' | 'subscribe' | 'error';
    payload?:   RawCandle;
    price?:     number;
    symbol?:    string;
    timeframe?: string;
    stats?:     Partial<MarketStats>;
    [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart config & state
// ─────────────────────────────────────────────────────────────────────────────

export type ChartType   = 'candlestick' | 'line' | 'area' | 'bars' | 'heikin_ashi';
export type DrawingMode = 'none' | 'trendline' | 'horizontal' | 'vertical' | 'fibonacci' | 'rectangle';
export type ThemeName   = 'dark' | 'light';
export type IndicatorId = 'sma_20' | 'sma_50' | 'sma_200' | 'ema_12' | 'ema_26' | 'bb_20' | 'rsi_14' | 'macd' | 'volume';

export interface Margin {
    top: number; right: number; bottom: number; left: number;
}

export interface ThemeColors {
    upColor: string; downColor: string; upWick: string; downWick: string;
    bgColor: string; panelBg: string; gridColor: string; axisColor: string;
    textColor: string; mutedText: string; priceLineColor: string;
    crosshairColor: string; selectionColor: string; volumeUp: string; volumeDown: string;
}

export interface ChartConfig {
    theme:            ThemeName;
    darkTheme:        ThemeColors;
    lightTheme:       ThemeColors;
    candleWidth:      number;
    candleSpacing:    number;
    margin:           Margin;
    volumePanelRatio: number;
    volumePanelGap:   number;
}

export interface ChartState {
    data:             Candle[];
    visibleData:      Candle[];
    viewportStart:    number;
    scaleX:           number;
    offsetCandles:    number;
    minPrice:         number;
    maxPrice:         number;
    width:            number;
    height:           number;
    currentPrice:     number;
    isDragging:       boolean;
    dragStartX:       number;
    mouseX:           number;
    mouseY:           number;
    mouseInside:      boolean;
    drawingMode:      DrawingMode;
    chartType:        ChartType;
    activeIndicators: Set<IndicatorId>;
    rafPending:       boolean;
}

export interface IndicatorPoint   { timestamp: number; value: number; }
export interface BollingerPoint   { timestamp: number; upper: number; middle: number; lower: number; }
export interface MACDPoint        { timestamp: number; macd: number; signal: number; histogram: number; }

export interface IndicatorSeries {
    id:               IndicatorId;
    label:            string;
    color:            string;
    points?:          IndicatorPoint[];
    bollingerPoints?: BollingerPoint[];
    macdPoints?:      MACDPoint[];
    isSubPanel:       boolean;
    subPanelRange?:   [number, number];
}

export interface PricePoint { timestamp: number; price: number; }

export interface Drawing {
    id:        string;
    type:      DrawingMode;
    points:    PricePoint[];
    color:     string;
    lineWidth: number;
    label?:    string;
    isDraft:   boolean;
}

export interface AppEvents {
    themeChanged:       ThemeName;
    symbolChanged:      string;
    timeframeChanged:   Timeframe;
    chartTypeChanged:   ChartType;
    indicatorToggled:   IndicatorId;
    drawingModeChanged: DrawingMode;
    dataLoaded:         Candle[];
    priceUpdated:       number;
}