import {
    obv as obvCalc,
    vwap as vwapCalc,
    adLine as adLineCalc,
    cmf as cmfCalc,
} from '../../../utils/math.js';
import type { StdlibFn } from './helpers.js';
import { asInt, resolveSeriesArray, cached, currentVal } from './helpers.js';

export const entries: Array<[string, StdlibFn]> = [
    ['obv',     (args, env, line, col) => { const c = resolveSeriesArray(args[0], 0, env, line, col); const v = resolveSeriesArray(args[1], 1, env, line, col); return currentVal(cached(env, 'obv', () => obvCalc(c, v)), env); }],
    ['vwap',    (args, env, line, col) => { const h = resolveSeriesArray(args[0], 0, env, line, col); const l = resolveSeriesArray(args[1], 1, env, line, col); const c = resolveSeriesArray(args[2], 2, env, line, col); const v = resolveSeriesArray(args[3], 3, env, line, col); return currentVal(cached(env, 'vwap', () => vwapCalc(h, l, c, v)), env); }],
    ['ad_line', (args, env, line, col) => { const h = resolveSeriesArray(args[0], 0, env, line, col); const l = resolveSeriesArray(args[1], 1, env, line, col); const c = resolveSeriesArray(args[2], 2, env, line, col); const v = resolveSeriesArray(args[3], 3, env, line, col); return currentVal(cached(env, 'adline', () => adLineCalc(h, l, c, v)), env); }],
    ['cmf',     (args, env, line, col) => { const h = resolveSeriesArray(args[0], 0, env, line, col); const l = resolveSeriesArray(args[1], 1, env, line, col); const c = resolveSeriesArray(args[2], 2, env, line, col); const v = resolveSeriesArray(args[3], 3, env, line, col); const p = asInt(args[4] ?? 20, 'cmf:length', line, col); return currentVal(cached(env, `cmf:${p}`, () => cmfCalc(h, l, c, v, p)), env); }],
];
