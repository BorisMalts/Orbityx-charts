/**
 * @file core/indicators.ts
 * @description Technical indicator computation engine.
 *
 * Computes price-overlay and sub-panel indicators from Candle arrays.
 * All functions are pure and stateless; results are memoized by the engine
 * when data hasn't changed.
 */
import type { Candle, IndicatorSeries, IndicatorId, IndicatorPoint, BollingerPoint, MACDPoint } from '../types/index.js';
import { sma, ema, rsi as rsiCalc, macd as macdCalc, bollingerBands } from '../utils/math.js';

// ─────────────────────────────────────────────────────────────────────────────
// Indicator Metadata Registry
// ─────────────────────────────────────────────────────────────────────────────

/** Human-readable metadata for the indicator picker UI. */
export const INDICATOR_META: Record<IndicatorId, { label: string; color: string; isSubPanel: boolean; group: string }> = {
    sma_20:  { label: 'SMA 20',          color: '#f59e0b', isSubPanel: false, group: 'Moving Averages' },
    sma_50:  { label: 'SMA 50',          color: '#3b82f6', isSubPanel: false, group: 'Moving Averages' },
    sma_200: { label: 'SMA 200',         color: '#ef4444', isSubPanel: false, group: 'Moving Averages' },
    ema_12:  { label: 'EMA 12',          color: '#a855f7', isSubPanel: false, group: 'Moving Averages' },
    ema_26:  { label: 'EMA 26',          color: '#ec4899', isSubPanel: false, group: 'Moving Averages' },
    bb_20:   { label: 'Bollinger Bands', color: '#06b6d4', isSubPanel: false, group: 'Volatility' },
    rsi_14:  { label: 'RSI 14',          color: '#8b5cf6', isSubPanel: true,  group: 'Momentum' },
    macd:    { label: 'MACD',            color: '#22c55e', isSubPanel: true,  group: 'Momentum' },
    volume:  { label: 'Volume',          color: '#64748b', isSubPanel: false, group: 'Volume' }, // handled inline
};

// ─────────────────────────────────────────────────────────────────────────────
// Computation Functions
// ─────────────────────────────────────────────────────────────────────────────

function toPoints(timestamps: number[], values: number[]): IndicatorPoint[] {
    return timestamps.map((t, i) => ({ timestamp: t, value: values[i] }));
}

/** Compute a simple series indicator for the given candles. */
function computeSeries(
    candles: Candle[],
    id: IndicatorId,
    values: number[],
): IndicatorSeries {
    const meta = INDICATOR_META[id];
    const points = toPoints(candles.map((c) => c.timestamp), values);
    return {
        id,
        label: meta.label,
        color: meta.color,
        points,
        isSubPanel: false,
    };
}

/** SMA indicators for periods 20, 50, 200. */
function computeSMA(candles: Candle[], period: number, id: IndicatorId): IndicatorSeries {
    const closes = candles.map((c) => c.close);
    return computeSeries(candles, id, sma(closes, period));
}

/** EMA indicators for periods 12, 26. */
function computeEMA(candles: Candle[], period: number, id: IndicatorId): IndicatorSeries {
    const closes = candles.map((c) => c.close);
    return computeSeries(candles, id, ema(closes, period));
}

/** Bollinger Bands (20-period, 2σ). */
function computeBB(candles: Candle[]): IndicatorSeries {
    const closes = candles.map((c) => c.close);
    const { upper, middle, lower } = bollingerBands(closes, 20, 2);
    const meta = INDICATOR_META.bb_20;
    const bollingerPoints: BollingerPoint[] = candles.map((c, i) => ({
        timestamp: c.timestamp,
        upper: upper[i],
        middle: middle[i],
        lower: lower[i],
    }));
    return {
        id: 'bb_20',
        label: meta.label,
        color: meta.color,
        bollingerPoints,
        isSubPanel: false,
    };
}

/** RSI (14-period) sub-panel indicator. */
function computeRSI(candles: Candle[]): IndicatorSeries {
    const closes = candles.map((c) => c.close);
    const values = rsiCalc(closes, 14);
    const meta = INDICATOR_META.rsi_14;
    const points = toPoints(candles.map((c) => c.timestamp), values);
    return {
        id: 'rsi_14',
        label: meta.label,
        color: meta.color,
        points,
        isSubPanel: true,
        subPanelRange: [0, 100],
    };
}

/** MACD (12, 26, 9) sub-panel indicator. */
function computeMACD(candles: Candle[]): IndicatorSeries {
    const closes = candles.map((c) => c.close);
    const { macdLine, signalLine, histogram } = macdCalc(closes, 12, 26, 9);
    const meta = INDICATOR_META.macd;
    const macdPoints: MACDPoint[] = candles.map((c, i) => ({
        timestamp: c.timestamp,
        macd:      macdLine[i],
        signal:    signalLine[i],
        histogram: histogram[i],
    }));
    return {
        id: 'macd',
        label: meta.label,
        color: meta.color,
        macdPoints,
        isSubPanel: true,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Dispatcher
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the requested indicator for a candle dataset.
 * Returns null when `id` is 'volume' (handled inline by ChartEngine).
 */
export function computeIndicator(candles: Candle[], id: IndicatorId): IndicatorSeries | null {
    if (candles.length === 0) return null;

    switch (id) {
        case 'sma_20':  return computeSMA(candles, 20,  id);
        case 'sma_50':  return computeSMA(candles, 50,  id);
        case 'sma_200': return computeSMA(candles, 200, id);
        case 'ema_12':  return computeEMA(candles, 12,  id);
        case 'ema_26':  return computeEMA(candles, 26,  id);
        case 'bb_20':   return computeBB(candles);
        case 'rsi_14':  return computeRSI(candles);
        case 'macd':    return computeMACD(candles);
        case 'volume':  return null; // rendered directly by the volume panel
        default:        return null;
    }
}

/**
 * Compute all active indicators and return as a map keyed by id.
 * Sub-panel indicators are separated from overlay indicators.
 */
export function computeAllIndicators(
    candles: Candle[],
    activeIds: Set<IndicatorId>,
): Map<IndicatorId, IndicatorSeries> {
    const result = new Map<IndicatorId, IndicatorSeries>();
    for (const id of activeIds) {
        const series = computeIndicator(candles, id);
        if (series) result.set(id, series);
    }
    return result;
}