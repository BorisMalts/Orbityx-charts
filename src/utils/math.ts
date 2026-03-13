/**
 * @file utils/math.ts
 * @description Pure, side-effect-free numeric helpers used across the platform.
 *
 * All functions handle non-finite inputs gracefully, returning NaN or safe
 * fallbacks rather than throwing exceptions.
 */

/**
 * Format a number to fixed decimal places and trim trailing zeros.
 *
 * @example toFixedTrim(12.3400, 4) → "12.34"
 * @example toFixedTrim(5, 2)       → "5"
 */
export function toFixedTrim(value: number, digits = 2): string {
    if (!Number.isFinite(value)) return '';
    return value.toFixed(digits).replace(/\.?0+$/, '');
}

/**
 * Lenient parser: extracts a number from messy strings like "$1,234.56".
 * Returns NaN for truly invalid input.
 */
export function parseNumber(str: unknown): number {
    if (typeof str === 'number') return Number.isFinite(str) ? str : NaN;
    if (str == null) return NaN;
    if (typeof str !== 'string') return NaN;
    const cleaned = String(str).replace(/[^0-9.+\-Ee]/g, '');
    if (!cleaned || cleaned === '+' || cleaned === '-' || cleaned === '.') return NaN;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
}

/** Type guard: checks that a value is a finite number. */
export function isFiniteNumber(n: unknown): n is number {
    return typeof n === 'number' && Number.isFinite(n);
}

/** Constrain a number to the inclusive range [min, max]. */
export function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

/** Round to a given number of decimal places. Returns NaN on bad input. */
export function round(n: number, precision = 2): number {
    if (!isFiniteNumber(n)) return NaN;
    const factor = 10 ** precision;
    return Math.round(n * factor) / factor;
}

/** Sum finite values in an array; skips NaN/Infinity. */
export function sum(arr: readonly number[]): number {
    return arr.reduce((acc, n) => acc + (isFiniteNumber(n) ? n : 0), 0);
}

/** Arithmetic mean of finite values; returns 0 for empty arrays. */
export function avg(arr: readonly number[]): number {
    const nums = arr.filter(isFiniteNumber);
    return nums.length ? sum(nums) / nums.length : 0;
}

/** Simple Moving Average over an array, returns array of same length (NaN for early values). */
export function sma(values: readonly number[], period: number): number[] {
    const result: number[] = new Array(values.length).fill(NaN);
    for (let i = period - 1; i < values.length; i++) {
        let s = 0;
        for (let j = 0; j < period; j++) s += values[i - j]!;
        result[i] = s / period;
    }
    return result;
}

/** Exponential Moving Average. Seed value is the SMA of the first `period` elements. */
export function ema(values: readonly number[], period: number): number[] {
    const result: number[] = new Array(values.length).fill(NaN);
    if (values.length < period) return result;
    const k = 2 / (period + 1);
    // Seed with simple average.
    let prev = 0;
    for (let i = 0; i < period; i++) prev += values[i]!;
    prev /= period;
    result[period - 1] = prev;
    for (let i = period; i < values.length; i++) {
        prev = values[i]! * k + prev * (1 - k);
        result[i] = prev;
    }
    return result;
}

/** Standard deviation of an array of numbers. */
export function stdDev(values: readonly number[]): number {
    if (!values.length) return 0;
    const mean = avg(values as number[]);
    const variance = avg(values.map((v) => (v - mean) ** 2) as number[]);
    return Math.sqrt(variance);
}

/**
 * Compute RSI (Relative Strength Index) for a close-price array.
 * Uses Wilder's smoothing (equivalent to EMA with alpha = 1/period).
 */
export function rsi(closes: readonly number[], period = 14): number[] {
    const result: number[] = new Array(closes.length).fill(NaN);
    if (closes.length <= period) return result;

    let avgGain = 0;
    let avgLoss = 0;

    // Initial average gain/loss over the first period.
    for (let i = 1; i <= period; i++) {
        const diff = closes[i]! - closes[i - 1]!;
        if (diff > 0) avgGain += diff;
        else avgLoss += Math.abs(diff);
    }
    avgGain /= period;
    avgLoss /= period;

    result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

    // Wilder's smoothing for subsequent values.
    for (let i = period + 1; i < closes.length; i++) {
        const diff = closes[i]! - closes[i - 1]!;
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? Math.abs(diff) : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }
    return result;
}

/**
 * MACD: returns { macd, signal, histogram } arrays of the same length as closes.
 */
export function macd(
    closes: readonly number[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9,
): { macdLine: number[]; signalLine: number[]; histogram: number[] } {
    const fastEma = ema(closes, fastPeriod);
    const slowEma = ema(closes, slowPeriod);
    const macdLine = closes.map((_, i) =>
        isFiniteNumber(fastEma[i]) && isFiniteNumber(slowEma[i])
            ? fastEma[i] - slowEma[i]
            : NaN,
    );
    // Compute signal EMA only over non-NaN MACD values.
    const signalLine = ema(macdLine, signalPeriod);
    const histogram = macdLine.map((m, i) =>
        isFiniteNumber(m) && isFiniteNumber(signalLine[i]) ? m - signalLine[i] : NaN,
    );
    return { macdLine, signalLine, histogram };
}

/**
 * Bollinger Bands: returns { upper, middle, lower } arrays.
 * @param multiplier Standard deviation multiplier (default 2).
 */
export function bollingerBands(
    closes: readonly number[],
    period = 20,
    multiplier = 2,
): { upper: number[]; middle: number[]; lower: number[] } {
    const middle = sma(closes, period);
    const upper: number[] = new Array(closes.length).fill(NaN);
    const lower: number[] = new Array(closes.length).fill(NaN);

    for (let i = period - 1; i < closes.length; i++) {
        const slice = closes.slice(i - period + 1, i + 1) as number[];
        const sd = stdDev(slice);
        upper[i] = middle[i]! + multiplier * sd;
        lower[i] = middle[i]! - multiplier * sd;
    }
    return { upper, middle, lower };
}

/** Linear interpolation between two values. */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/** Map a value from [inMin, inMax] to [outMin, outMax]. */
export function mapRange(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
): number {
    if (inMax === inMin) return outMin;
    return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
}

/** Generate "nice" tick values for an axis between min and max. */
export function niceAxisTicks(min: number, max: number, targetCount = 8): number[] {
    const range = max - min;
    if (range <= 0) return [min];
    const rawStep = range / targetCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalised = rawStep / magnitude;
    let step: number;
    if (normalised <= 1.5) step = magnitude;
    else if (normalised <= 3) step = 2 * magnitude;
    else if (normalised <= 7) step = 5 * magnitude;
    else step = 10 * magnitude;
    const start = Math.ceil(min / step) * step;
    const ticks: number[] = [];
    for (let v = start; v <= max + step * 0.01; v += step) {
        ticks.push(round(v, 10));
    }
    return ticks;
}