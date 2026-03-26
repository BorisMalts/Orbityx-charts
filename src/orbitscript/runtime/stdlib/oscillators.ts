import {
    rsi as rsiCalc,
    macd as macdCalc,
    stochastic as stochasticCalc,
    stochasticRSI as stochRSICalc,
    williamsR as williamsRCalc,
    cci as cciCalc,
    mfi as mfiCalc,
    roc as rocCalc,
    momentum as momentumCalc,
    awesomeOscillator as aoCalc,
} from '../../../utils/math.js';
import type { OSStruct } from '../../lang/types.js';
import type { StdlibFn } from './helpers.js';
import { asInt, resolveSeriesArray, cached, currentVal, seriesFingerprint } from './helpers.js';

export const entries: Array<[string, StdlibFn]> = [
    ['rsi', (args, env, line, col) => {
        const src = resolveSeriesArray(args[0], 0, env, line, col);
        const len = asInt(args[1] ?? 14, 'rsi:length', line, col);
        return currentVal(cached(env, `rsi:${seriesFingerprint(src)}:${len}`, () => rsiCalc(src, len)), env);
    }],
    ['macd', (args, env, line, col) => {
        const src  = resolveSeriesArray(args[0], 0, env, line, col);
        const fast = asInt(args[1] ?? 12, 'macd:fast', line, col);
        const slow = asInt(args[2] ?? 26, 'macd:slow', line, col);
        const sig  = asInt(args[3] ?? 9,  'macd:signal', line, col);
        const key  = `macd:${seriesFingerprint(src)}:${fast}:${slow}:${sig}`;
        const result = cached(env, key + ':obj', () => {
            const r = macdCalc(src, fast, slow, sig);
            env.seriesCache.set(key + ':macd',   r.macdLine);
            env.seriesCache.set(key + ':signal', r.signalLine);
            env.seriesCache.set(key + ':hist',   r.histogram);
            return r.macdLine;
        });
        void result;
        const i = env.barIndex;
        return { __type: 'struct', __name: 'MACDResult', fields: { macd_line: (env.seriesCache.get(key + ':macd') ?? [])[i] ?? NaN, signal_line: (env.seriesCache.get(key + ':signal') ?? [])[i] ?? NaN, histogram: (env.seriesCache.get(key + ':hist') ?? [])[i] ?? NaN } } as OSStruct;
    }],
    ['stoch', (args, env, line, col) => {
        const h = resolveSeriesArray(args[0], 0, env, line, col);
        const l = resolveSeriesArray(args[1], 1, env, line, col);
        const c = resolveSeriesArray(args[2], 2, env, line, col);
        const kP = asInt(args[3] ?? 14, 'stoch:k', line, col);
        const dP = asInt(args[4] ?? 3,  'stoch:d', line, col);
        const fp  = `${seriesFingerprint(h)}:${seriesFingerprint(l)}:${seriesFingerprint(c)}`;
        const key = `stoch:${fp}:${kP}:${dP}`;
        cached(env, key + ':k', () => { const r = stochasticCalc(h, l, c, kP, dP); env.seriesCache.set(key + ':k', r.k); env.seriesCache.set(key + ':d', r.d); return r.k; });
        const i = env.barIndex;
        return { __type: 'struct', __name: 'StochResult', fields: { k: (env.seriesCache.get(key + ':k') ?? [])[i] ?? NaN, d: (env.seriesCache.get(key + ':d') ?? [])[i] ?? NaN } } as OSStruct;
    }],
    ['stoch_rsi', (args, env, line, col) => {
        const src  = resolveSeriesArray(args[0], 0, env, line, col);
        const rLen = asInt(args[1] ?? 14, 'stoch_rsi:rsi_len', line, col);
        const sLen = asInt(args[2] ?? 14, 'stoch_rsi:stoch_len', line, col);
        const kS   = asInt(args[3] ?? 3,  'stoch_rsi:k_smooth', line, col);
        const dS   = asInt(args[4] ?? 3,  'stoch_rsi:d_smooth', line, col);
        const key  = `stochrsi:${seriesFingerprint(src)}:${rLen}:${sLen}:${kS}:${dS}`;
        cached(env, key + ':k', () => { const r = stochRSICalc(src, rLen, sLen, kS, dS); env.seriesCache.set(key + ':k', r.k); env.seriesCache.set(key + ':d', r.d); return r.k; });
        const i = env.barIndex;
        return { __type: 'struct', __name: 'StochResult', fields: { k: (env.seriesCache.get(key + ':k') ?? [])[i] ?? NaN, d: (env.seriesCache.get(key + ':d') ?? [])[i] ?? NaN } } as OSStruct;
    }],
    ['williams_r', (args, env, line, col) => {
        const h = resolveSeriesArray(args[0], 0, env, line, col);
        const l = resolveSeriesArray(args[1], 1, env, line, col);
        const c = resolveSeriesArray(args[2], 2, env, line, col);
        const p = asInt(args[3] ?? 14, 'williams_r:length', line, col);
        const fp2 = `${seriesFingerprint(h)}:${seriesFingerprint(l)}:${seriesFingerprint(c)}`;
        return currentVal(cached(env, `willr:${fp2}:${p}`, () => williamsRCalc(h, l, c, p)), env);
    }],
    ['cci', (args, env, line, col) => {
        const h = resolveSeriesArray(args[0], 0, env, line, col);
        const l = resolveSeriesArray(args[1], 1, env, line, col);
        const c = resolveSeriesArray(args[2], 2, env, line, col);
        const p = asInt(args[3] ?? 20, 'cci:length', line, col);
        const fp3 = `${seriesFingerprint(h)}:${seriesFingerprint(l)}:${seriesFingerprint(c)}`;
        return currentVal(cached(env, `cci:${fp3}:${p}`, () => cciCalc(h, l, c, p)), env);
    }],
    ['mfi', (args, env, line, col) => {
        const h = resolveSeriesArray(args[0], 0, env, line, col);
        const l = resolveSeriesArray(args[1], 1, env, line, col);
        const c = resolveSeriesArray(args[2], 2, env, line, col);
        const v = resolveSeriesArray(args[3], 3, env, line, col);
        const p = asInt(args[4] ?? 14, 'mfi:length', line, col);
        const fp4 = `${seriesFingerprint(h)}:${seriesFingerprint(l)}:${seriesFingerprint(c)}:${seriesFingerprint(v)}`;
        return currentVal(cached(env, `mfi:${fp4}:${p}`, () => mfiCalc(h, l, c, v, p)), env);
    }],
    ['roc',      (args, env, line, col) => { const src = resolveSeriesArray(args[0], 0, env, line, col); const len = asInt(args[1] ?? 12, 'roc:length', line, col); return currentVal(cached(env, `roc:${seriesFingerprint(src)}:${len}`, () => rocCalc(src, len)), env); }],
    ['momentum', (args, env, line, col) => { const src = resolveSeriesArray(args[0], 0, env, line, col); const len = asInt(args[1] ?? 10, 'momentum:length', line, col); return currentVal(cached(env, `momentum:${seriesFingerprint(src)}:${len}`, () => momentumCalc(src, len)), env); }],
    ['awesome_oscillator', (args, env, line, col) => {
        const h = resolveSeriesArray(args[0], 0, env, line, col);
        const l = resolveSeriesArray(args[1], 1, env, line, col);
        return currentVal(cached(env, `ao:${seriesFingerprint(h)}:${seriesFingerprint(l)}`, () => aoCalc(h, l)), env);
    }],
];
