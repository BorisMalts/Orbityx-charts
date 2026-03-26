import { sma, ema, wma, dema, tema, hma, vwma } from '../../../utils/math.js';
import type { StdlibFn } from './helpers.js';
import { asInt, resolveSeriesArray, cached, currentVal, seriesFingerprint } from './helpers.js';

export const entries: Array<[string, StdlibFn]> = [
    ['sma',  (args, env, line, col) => { const src = resolveSeriesArray(args[0], 0, env, line, col); const len = asInt(args[1], 'sma:length', line, col); return currentVal(cached(env, `sma:${seriesFingerprint(src)}:${len}`, () => sma(src, len)), env); }],
    ['ema',  (args, env, line, col) => { const src = resolveSeriesArray(args[0], 0, env, line, col); const len = asInt(args[1], 'ema:length', line, col); return currentVal(cached(env, `ema:${seriesFingerprint(src)}:${len}`, () => ema(src, len)), env); }],
    ['wma',  (args, env, line, col) => { const src = resolveSeriesArray(args[0], 0, env, line, col); const len = asInt(args[1], 'wma:length', line, col); return currentVal(cached(env, `wma:${seriesFingerprint(src)}:${len}`, () => wma(src, len)), env); }],
    ['dema', (args, env, line, col) => { const src = resolveSeriesArray(args[0], 0, env, line, col); const len = asInt(args[1], 'dema:length', line, col); return currentVal(cached(env, `dema:${seriesFingerprint(src)}:${len}`, () => dema(src, len)), env); }],
    ['tema', (args, env, line, col) => { const src = resolveSeriesArray(args[0], 0, env, line, col); const len = asInt(args[1], 'tema:length', line, col); return currentVal(cached(env, `tema:${seriesFingerprint(src)}:${len}`, () => tema(src, len)), env); }],
    ['hma',  (args, env, line, col) => { const src = resolveSeriesArray(args[0], 0, env, line, col); const len = asInt(args[1], 'hma:length', line, col); return currentVal(cached(env, `hma:${seriesFingerprint(src)}:${len}`, () => hma(src, len)), env); }],
    ['vwma', (args, env, line, col) => { const src = resolveSeriesArray(args[0], 0, env, line, col); const vol = resolveSeriesArray(args[1], 1, env, line, col); const len = asInt(args[2], 'vwma:length', line, col); return currentVal(cached(env, `vwma:${seriesFingerprint(src)}:${seriesFingerprint(vol)}:${len}`, () => vwma(src, vol, len)), env); }],
];
