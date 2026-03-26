import { isFiniteNumber } from '../../../utils/math.js';
import type { StdlibFn } from './helpers.js';

export const entries: Array<[string, StdlibFn]> = [
    ['na',  (args, _e, _l, _c) => typeof args[0] !== 'number' || isNaN(args[0] as number) || !isFinite(args[0] as number)],
    ['nz',  (args, _, line, col) => { const v = args[0]; if (typeof v === 'number' && isFiniteNumber(v)) return v; return typeof args[1] === 'number' ? args[1] : 0; }],
];
