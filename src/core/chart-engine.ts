/**
 * @file core/chart-engine.ts
 * @description Professional canvas-based OHLCV chart renderer.
 *
 * Features:
 *  - Candlestick, Line, Area, Bars, Heikin Ashi chart types
 *  - Volume panel with proportional bars
 *  - Sub-panels for RSI / MACD
 *  - Technical indicator overlays (SMA, EMA, Bollinger Bands)
 *  - Crosshair with axis labels
 *  - Zoom (wheel + toolbar), pan (drag), keyboard navigation
 *  - High-DPI canvas support
 *  - Drawing tools (trendline, horizontal, fibonacci, rectangle)
 *  - requestAnimationFrame-based rendering with dirty-flag
 */
import type {
    Candle, ChartConfig, ChartState, ThemeColors, ChartType,
    DrawingMode, IndicatorId, IndicatorSeries, Drawing, PricePoint,
} from '../types/index.js';
import { clamp, niceAxisTicks, isFiniteNumber } from '../utils/math.js';
import { axisLabel, formatDate } from '../utils/date.js';
import { formatPrice } from '../utils/format.js';
import { computeAllIndicators } from './indicators.js';

// ─────────────────────────────────────────────────────────────────────────────
// Default configuration
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Readonly<ChartConfig> = {
    theme: 'dark',
    candleWidth: 8,
    candleSpacing: 2,
    volumePanelRatio: 0.18,
    volumePanelGap: 4,
    margin: { top: 40, right: 80, bottom: 32, left: 10 },
    darkTheme: {
        upColor:        'rgba(34,197,94,0.85)',
        downColor:      'rgba(239,68,68,0.85)',
        upWick:         'rgba(34,197,94,0.7)',
        downWick:       'rgba(239,68,68,0.7)',
        bgColor:        '#0f141b',
        panelBg:        '#0b0f14',
        gridColor:      'rgba(42,58,72,0.7)',
        axisColor:      'rgba(55,75,90,0.9)',
        textColor:      'rgba(200,210,220,0.9)',
        mutedText:      'rgba(120,140,160,0.7)',
        priceLineColor: 'rgba(96,195,255,0.8)',
        crosshairColor: 'rgba(120,160,200,0.6)',
        selectionColor: 'rgba(96,195,255,0.12)',
        volumeUp:       'rgba(34,197,94,0.35)',
        volumeDown:     'rgba(239,68,68,0.35)',
    },
    lightTheme: {
        upColor:        'rgba(22,163,74,0.85)',
        downColor:      'rgba(220,38,38,0.85)',
        upWick:         'rgba(22,163,74,0.7)',
        downWick:       'rgba(220,38,38,0.7)',
        bgColor:        '#f8fafc',
        panelBg:        '#f1f5f9',
        gridColor:      'rgba(200,210,220,0.6)',
        axisColor:      'rgba(160,175,190,0.9)',
        textColor:      'rgba(30,40,55,0.9)',
        mutedText:      'rgba(100,115,130,0.8)',
        priceLineColor: 'rgba(37,99,235,0.7)',
        crosshairColor: 'rgba(37,99,235,0.4)',
        selectionColor: 'rgba(37,99,235,0.1)',
        volumeUp:       'rgba(22,163,74,0.3)',
        volumeDown:     'rgba(220,38,38,0.3)',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Chart Engine
// ─────────────────────────────────────────────────────────────────────────────

export default class ChartEngine {
    readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private dpr = 1;

    config: ChartConfig;
    state: ChartState;

    private timeframe = '1d';
    private indicatorCache = new Map<IndicatorId, IndicatorSeries>();
    private drawings: Drawing[] = [];
    private draftDrawing: Drawing | null = null;
    private subPanelHeight = 100;

    onNeedMoreData: (() => void) | null = null;
    fetchingMoreHistory = false;
    private readonly LAZY_LOAD_THRESHOLD = 80;

    private _onResize: () => void;
    private _onWheel:  (e: WheelEvent) => void;
    private _onMDown:  (e: MouseEvent) => void;
    private _onMMove:  (e: MouseEvent) => void;
    private _onMUp:    (e: MouseEvent) => void;
    private _onMLeave: (e: MouseEvent) => void;
    private _onKey:    (e: KeyboardEvent) => void;

    constructor(canvasId: string) {
        const el = document.getElementById(canvasId);
        if (!(el instanceof HTMLCanvasElement)) {
            throw new Error(`#${canvasId} is not a <canvas> element or does not exist`);
        }
        this.canvas = el;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('Could not acquire 2D rendering context');
        this.ctx = ctx;

        this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as ChartConfig;

        this.state = {
            data: [],
            visibleData: [],
            viewportStart: 0,
            scaleX: 1,
            offsetCandles: 0,
            minPrice: 0,
            maxPrice: 0,
            width: 0,
            height: 0,
            currentPrice: 0,
            isDragging: false,
            dragStartX: 0,
            mouseX: -1,
            mouseY: -1,
            mouseInside: false,
            drawingMode: 'none',
            chartType: 'candlestick',
            activeIndicators: new Set(),
            rafPending: false,
        };

        this._onResize = this.handleResize.bind(this);
        this._onWheel  = this.handleWheel.bind(this);
        this._onMDown  = this.handleMouseDown.bind(this);
        this._onMMove  = this.handleMouseMove.bind(this);
        this._onMUp    = this.handleMouseUp.bind(this);
        this._onMLeave = this.handleMouseLeave.bind(this);
        this._onKey    = this.handleKey.bind(this);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Initialization
    // ───────────────────────────────────────────────────────────────────────────

    init(dataManager: { getData(): Candle[] }): void {
        this.dpr = window.devicePixelRatio || 1;
        this.resizeCanvas();
        this.setData(dataManager.getData());
        this.setupEventListeners();
        this.requestDraw();
    }

    update(): void {
        this.requestDraw();
    }

    destroy(): void {
        window.removeEventListener('resize', this._onResize);
        window.removeEventListener('keydown', this._onKey);
        this.canvas.removeEventListener('wheel',      this._onWheel);
        this.canvas.removeEventListener('mousedown',  this._onMDown);
        this.canvas.removeEventListener('mousemove',  this._onMMove);
        this.canvas.removeEventListener('mouseup',    this._onMUp);
        this.canvas.removeEventListener('mouseleave', this._onMLeave);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Data
    // ───────────────────────────────────────────────────────────────────────────

    setData(data: Candle[]): void {
        this.state.data = data;
        this.state.currentPrice = data.length ? data[data.length - 1]!.close : 0;
        this.invalidateIndicatorCache();
        this.recomputeIndicators();
        this.updateVisibleData();
        this.requestDraw();
    }

    setTimeframe(tf: string): void {
        this.timeframe = tf;
        this.requestDraw();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // View Controls
    // ───────────────────────────────────────────────────────────────────────────

    resetView(): void {
        this.state.scaleX = 1;
        this.state.offsetCandles = 0;
        this.updateVisibleData();
        this.requestDraw();
    }

    zoomIn(): void {
        this.state.scaleX = clamp(this.state.scaleX * 1.25, 0.2, 20);
        this.updateVisibleData();
        this.requestDraw();
    }

    zoomOut(): void {
        this.state.scaleX = clamp(this.state.scaleX / 1.25, 0.2, 20);
        this.updateVisibleData();
        this.requestDraw();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Chart Type & Drawing Mode
    // ───────────────────────────────────────────────────────────────────────────

    setChartType(type: ChartType): void {
        this.state.chartType = type;
        this.requestDraw();
    }

    setDrawingMode(mode: DrawingMode): void {
        this.state.drawingMode = mode;
        this.canvas.style.cursor = mode === 'none' ? 'default' : 'crosshair';
    }

    clearDrawings(): void {
        this.drawings = [];
        this.requestDraw();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Indicators
    // ───────────────────────────────────────────────────────────────────────────

    toggleIndicator(id: IndicatorId): void {
        if (this.state.activeIndicators.has(id)) {
            this.state.activeIndicators.delete(id);
        } else {
            this.state.activeIndicators.add(id);
        }
        this.recomputeIndicators();
        this.requestDraw();
    }

    private invalidateIndicatorCache(): void {
        this.indicatorCache.clear();
    }

    private recomputeIndicators(): void {
        if (this.state.activeIndicators.size === 0) {
            this.indicatorCache.clear();
            return;
        }
        this.indicatorCache = computeAllIndicators(
            this.state.data,
            this.state.activeIndicators,
        );
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Theme
    // ───────────────────────────────────────────────────────────────────────────

    applyTheme(theme: 'dark' | 'light'): void {
        this.config.theme = theme;
        this.requestDraw();
    }

    getColors(): ThemeColors {
        return this.config.theme === 'dark'
            ? this.config.darkTheme
            : this.config.lightTheme;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Canvas Sizing
    // ───────────────────────────────────────────────────────────────────────────

    resizeCanvas(): void {
        const container = this.canvas.parentElement;
        if (!container) return;

        this.dpr = window.devicePixelRatio || 1;
        const cssW = container.clientWidth;
        const cssH = container.clientHeight;

        this.canvas.width  = Math.round(cssW * this.dpr);
        this.canvas.height = Math.round(cssH * this.dpr);
        this.canvas.style.width  = `${cssW}px`;
        this.canvas.style.height = `${cssH}px`;
        this.ctx.scale(this.dpr, this.dpr);

        this.state.width  = cssW;
        this.state.height = cssH;
        this.updateVisibleData();
    }

    private handleResize(): void {
        this.resizeCanvas();
        this.requestDraw();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Viewport Math
    // ───────────────────────────────────────────────────────────────────────────

    private get plotLeft():  number { return this.config.margin.left; }
    private get plotRight(): number { return this.state.width - this.config.margin.right; }
    private get plotWidth(): number { return this.plotRight - this.plotLeft; }
    private get plotTop():   number { return this.config.margin.top; }

    private get plotBottom(): number {
        let bottom = this.state.height - this.config.margin.bottom;
        if (this.state.activeIndicators.has('volume')) {
            bottom -= this.volumePanelH + this.config.volumePanelGap;
        }
        for (const _ of this.getSubPanelIds()) {
            bottom -= this.subPanelHeight + this.config.volumePanelGap;
        }
        return bottom;
    }

    private get plotHeight(): number {
        return Math.max(1, this.plotBottom - this.plotTop);
    }

    private get volumePanelH(): number {
        return Math.round(this.state.height * this.config.volumePanelRatio);
    }

    private get candleStep(): number {
        return (this.config.candleWidth + this.config.candleSpacing) * this.state.scaleX;
    }

    private get maxVisibleCandles(): number {
        return Math.max(1, Math.floor(this.plotWidth / this.candleStep));
    }

    updateVisibleData(): void {
        const { data } = this.state;
        if (!data.length) {
            this.state.visibleData   = [];
            this.state.viewportStart = 0;
            this.state.minPrice      = 0;
            this.state.maxPrice      = 0;
            return;
        }

        const maxVis = this.maxVisibleCandles;
        const maxOffset = Math.max(0, data.length - maxVis);

        this.state.offsetCandles = clamp(this.state.offsetCandles, 0, maxOffset);

        const offset = Math.round(this.state.offsetCandles);
        const end    = Math.max(0, data.length - offset);
        const start  = Math.max(0, end - maxVis);

        this.state.viewportStart = start;
        this.state.visibleData   = data.slice(start, end);

        if (!this.state.visibleData.length) {
            this.state.minPrice = 0;
            this.state.maxPrice = 0;
            return;
        }

        let lo = Infinity, hi = -Infinity;
        for (const c of this.state.visibleData) {
            if (c.low  < lo) lo = c.low;
            if (c.high > hi) hi = c.high;
        }
        const pad = (hi - lo) * 0.05 || Math.abs(hi) * 0.02 || 1;
        this.state.minPrice = lo - pad;
        this.state.maxPrice = hi + pad;

        if (
            start < this.LAZY_LOAD_THRESHOLD &&
            !this.fetchingMoreHistory &&
            this.onNeedMoreData
        ) {
            this.fetchingMoreHistory = true;
            this.onNeedMoreData();
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Coordinate Transforms
    // ───────────────────────────────────────────────────────────────────────────

    priceToY(price: number): number {
        const { minPrice, maxPrice } = this.state;
        if (maxPrice === minPrice) return this.plotTop + this.plotHeight / 2;
        const ratio = (price - minPrice) / (maxPrice - minPrice);
        return this.plotBottom - ratio * this.plotHeight;
    }

    indexToX(index: number): number {
        return this.plotLeft + index * this.candleStep;
    }

    xToIndex(x: number): number {
        const relX = x - this.plotLeft;
        if (relX < 0 || relX > this.plotWidth) return -1;
        return Math.floor(relX / this.candleStep);
    }

    yToPrice(y: number): number {
        const { minPrice, maxPrice } = this.state;
        const ratio = (this.plotBottom - y) / this.plotHeight;
        return minPrice + ratio * (maxPrice - minPrice);
    }

    timestampToX(ts: number): number {
        const idx = this.state.data.findIndex(c => c.timestamp === ts);
        if (idx === -1) return -1;
        const visIdx = idx - this.state.viewportStart;
        if (visIdx < 0 || visIdx >= this.state.visibleData.length) return -1;
        return this.indexToX(visIdx) + (this.config.candleWidth * this.state.scaleX) / 2;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // rAF Draw Queue
    // ───────────────────────────────────────────────────────────────────────────

    requestDraw(): void {
        if (this.state.rafPending) return;
        this.state.rafPending = true;
        requestAnimationFrame(() => {
            this.state.rafPending = false;
            this.draw();
        });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Main Render Pipeline
    // ───────────────────────────────────────────────────────────────────────────

    draw(): void {
        const { width, height } = this.state;
        if (!width || !height) return;

        this.ctx.clearRect(0, 0, width, height);
        this.drawBackground();
        this.drawGrid();
        this.drawPriceAxis();
        this.drawTimeAxis();
        this.drawCandles();
        this.drawIndicatorOverlays();
        this.drawCurrentPriceLine();
        this.drawVolumePanelIfActive();
        this.drawSubPanels();
        this.drawDrawings();
        if (this.state.mouseInside) this.drawCrosshair();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Background
    // ───────────────────────────────────────────────────────────────────────────

    private drawBackground(): void {
        const c = this.getColors();
        this.ctx.fillStyle = c.bgColor;
        this.ctx.fillRect(0, 0, this.state.width, this.state.height);
        this.ctx.fillStyle = c.panelBg;
        this.ctx.fillRect(this.plotLeft, this.plotTop, this.plotWidth, this.plotHeight);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Grid
    // ───────────────────────────────────────────────────────────────────────────

    private drawGrid(): void {
        const c = this.getColors();
        this.ctx.save();
        this.ctx.strokeStyle = c.gridColor;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 6]);

        for (const price of niceAxisTicks(this.state.minPrice, this.state.maxPrice, 8)) {
            const y = Math.round(this.priceToY(price)) + 0.5;
            if (y < this.plotTop || y > this.plotBottom) continue;
            this.ctx.beginPath();
            this.ctx.moveTo(this.plotLeft, y);
            this.ctx.lineTo(this.plotRight, y);
            this.ctx.stroke();
        }

        const vLines = Math.max(1, Math.floor(this.plotWidth / 80));
        for (let i = 0; i <= vLines; i++) {
            const x = Math.round(this.plotLeft + (i / vLines) * this.plotWidth) + 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.plotTop);
            this.ctx.lineTo(x, this.plotBottom);
            this.ctx.stroke();
        }

        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Price Axis (right)
    // ───────────────────────────────────────────────────────────────────────────

    private drawPriceAxis(): void {
        const c = this.getColors();
        this.ctx.save();
        this.ctx.fillStyle   = c.textColor;
        this.ctx.font        = '11px "JetBrains Mono", "Roboto Mono", monospace';
        this.ctx.textAlign   = 'left';
        this.ctx.textBaseline = 'middle';

        for (const price of niceAxisTicks(this.state.minPrice, this.state.maxPrice, 8)) {
            const y = Math.round(this.priceToY(price));
            if (y < this.plotTop || y > this.plotBottom) continue;
            this.ctx.strokeStyle = c.axisColor;
            this.ctx.lineWidth   = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(this.plotRight, y);
            this.ctx.lineTo(this.plotRight + 4, y);
            this.ctx.stroke();
            this.ctx.fillText(formatPrice(price), this.plotRight + 7, y);
        }
        this.ctx.restore();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Time Axis (bottom)
    // ───────────────────────────────────────────────────────────────────────────

    private drawTimeAxis(): void {
        if (!this.state.visibleData.length) return;
        const c = this.getColors();
        this.ctx.save();
        this.ctx.fillStyle    = c.mutedText;
        this.ctx.font         = '10px "JetBrains Mono", "Roboto Mono", monospace';
        this.ctx.textAlign    = 'center';
        this.ctx.textBaseline = 'top';

        const step = Math.max(1, Math.round(this.state.visibleData.length / 8));
        for (let i = 0; i < this.state.visibleData.length; i += step) {
            const candle = this.state.visibleData[i];
            if (!candle) continue;
            const x = this.indexToX(i) + (this.config.candleWidth * this.state.scaleX) / 2;
            if (x < this.plotLeft + 20 || x > this.plotRight - 20) continue;
            this.ctx.fillText(axisLabel(candle.timestamp, this.timeframe), x, this.plotBottom + 5);
        }
        this.ctx.restore();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Candle Rendering
    // ───────────────────────────────────────────────────────────────────────────

    private drawCandles(): void {
        switch (this.state.chartType) {
            case 'line':        return this.drawLineChart();
            case 'area':        return this.drawAreaChart();
            case 'heikin_ashi': return this.drawHeikinAshi();
            case 'bars':        return this.drawBars();
            default:            return this.drawCandlesticks();
        }
    }

    private drawCandlesticks(): void {
        const c    = this.getColors();
        const bodyW = Math.max(1, this.config.candleWidth * this.state.scaleX);
        this.ctx.save();

        for (let i = 0; i < this.state.visibleData.length; i++) {
            const candle = this.state.visibleData[i];
            if (!candle) continue;
            const isUp   = candle.close >= candle.open;
            const x      = this.indexToX(i);
            const cx     = x + bodyW / 2;
            const openY  = this.priceToY(candle.open);
            const closeY = this.priceToY(candle.close);
            const highY  = this.priceToY(candle.high);
            const lowY   = this.priceToY(candle.low);

            this.ctx.strokeStyle = isUp ? c.upWick : c.downWick;
            this.ctx.lineWidth   = Math.max(1, this.state.scaleX * 0.8);
            this.ctx.beginPath();
            this.ctx.moveTo(cx, highY);
            this.ctx.lineTo(cx, lowY);
            this.ctx.stroke();

            const bodyTop = Math.min(openY, closeY);
            const bodyH   = Math.max(1, Math.abs(openY - closeY));
            this.ctx.fillStyle = isUp ? c.upColor : c.downColor;
            this.ctx.fillRect(x, bodyTop, bodyW, bodyH);

            if (bodyW > 3) {
                this.ctx.strokeStyle = isUp ? c.upColor : c.downColor;
                this.ctx.lineWidth   = 1;
                this.ctx.strokeRect(x, bodyTop, bodyW, bodyH);
            }
        }
        this.ctx.restore();
    }

    private drawHeikinAshi(): void {
        const ha    = this.computeHeikinAshi(this.state.visibleData);
        const c     = this.getColors();
        const bodyW = Math.max(1, this.config.candleWidth * this.state.scaleX);
        this.ctx.save();

        for (let i = 0; i < ha.length; i++) {
            const candle = ha[i];
            if (!candle) continue;
            const isUp   = candle.close >= candle.open;
            const x      = this.indexToX(i);
            const cx     = x + bodyW / 2;

            this.ctx.strokeStyle = isUp ? c.upWick : c.downWick;
            this.ctx.lineWidth   = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(cx, this.priceToY(candle.high));
            this.ctx.lineTo(cx, this.priceToY(candle.low));
            this.ctx.stroke();

            const bodyTop = Math.min(this.priceToY(candle.open), this.priceToY(candle.close));
            const bodyH   = Math.max(1, Math.abs(this.priceToY(candle.open) - this.priceToY(candle.close)));
            this.ctx.fillStyle = isUp ? c.upColor : c.downColor;
            this.ctx.fillRect(x, bodyTop, bodyW, bodyH);
        }
        this.ctx.restore();
    }

    private computeHeikinAshi(candles: Candle[]): Candle[] {
        const ha: Candle[] = [];
        for (let i = 0; i < candles.length; i++) {
            const cur = candles[i];
            if (!cur) continue;
            const haClose = (cur.open + cur.high + cur.low + cur.close) / 4;
            const prev    = ha[i - 1];
            const haOpen  = i === 0 || !prev
                ? (cur.open + cur.close) / 2
                : (prev.open + prev.close) / 2;
            const haCandle: Candle = {
                timestamp: cur.timestamp,
                open:      haOpen,
                high:      Math.max(cur.high, haOpen, haClose),
                low:       Math.min(cur.low,  haOpen, haClose),
                close:     haClose,
                volume:    cur.volume,
            };
            ha.push(haCandle);
        }
        return ha;
    }

    private drawBars(): void {
        const c    = this.getColors();
        const step = this.candleStep;
        this.ctx.save();

        for (let i = 0; i < this.state.visibleData.length; i++) {
            const candle = this.state.visibleData[i];
            if (!candle) continue;
            const isUp   = candle.close >= candle.open;
            const cx     = this.indexToX(i) + step / 2;
            const tick   = Math.min(4, step * 0.35);

            this.ctx.strokeStyle = isUp ? c.upColor : c.downColor;
            this.ctx.lineWidth   = Math.max(1, this.state.scaleX * 0.8);

            this.ctx.beginPath();
            this.ctx.moveTo(cx, this.priceToY(candle.high));
            this.ctx.lineTo(cx, this.priceToY(candle.low));
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(cx - tick, this.priceToY(candle.open));
            this.ctx.lineTo(cx, this.priceToY(candle.open));
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(cx, this.priceToY(candle.close));
            this.ctx.lineTo(cx + tick, this.priceToY(candle.close));
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    private drawLineChart(): void {
        const c = this.getColors();
        this.ctx.save();
        this.ctx.strokeStyle = c.priceLineColor;
        this.ctx.lineWidth   = 2;
        this.ctx.lineJoin    = 'round';
        this.ctx.beginPath();

        for (let i = 0; i < this.state.visibleData.length; i++) {
            const candle = this.state.visibleData[i];
            if (!candle) continue;
            const x = this.indexToX(i) + (this.config.candleWidth * this.state.scaleX) / 2;
            const y = this.priceToY(candle.close);
            i === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
        this.ctx.restore();
    }

    private drawAreaChart(): void {
        if (!this.state.visibleData.length) return;
        const c = this.getColors();
        this.ctx.save();
        this.ctx.lineWidth = 2;
        this.ctx.lineJoin  = 'round';

        const grad = this.ctx.createLinearGradient(0, this.plotTop, 0, this.plotBottom);
        grad.addColorStop(0, 'rgba(34,197,94,0.25)');
        grad.addColorStop(1, 'rgba(34,197,94,0.01)');
        this.ctx.fillStyle = grad;

        const halfW = (this.config.candleWidth * this.state.scaleX) / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(this.indexToX(0) + halfW, this.plotBottom);
        for (let i = 0; i < this.state.visibleData.length; i++) {
            const candle = this.state.visibleData[i];
            if (!candle) continue;
            this.ctx.lineTo(
                this.indexToX(i) + halfW,
                this.priceToY(candle.close),
            );
        }
        this.ctx.lineTo(
            this.indexToX(this.state.visibleData.length - 1) + halfW,
            this.plotBottom,
        );
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.strokeStyle = c.priceLineColor;
        this.ctx.beginPath();
        for (let i = 0; i < this.state.visibleData.length; i++) {
            const candle = this.state.visibleData[i];
            if (!candle) continue;
            const x = this.indexToX(i) + halfW;
            const y = this.priceToY(candle.close);
            i === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
        this.ctx.restore();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Current Price Line
    // ───────────────────────────────────────────────────────────────────────────

    private drawCurrentPriceLine(): void {
        if (!this.state.currentPrice) return;
        const c = this.getColors();
        const y = this.priceToY(this.state.currentPrice);
        if (y < this.plotTop || y > this.plotBottom) return;

        this.ctx.save();
        this.ctx.strokeStyle = c.priceLineColor;
        this.ctx.lineWidth   = 1;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.plotLeft, y);
        this.ctx.lineTo(this.plotRight, y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        const label   = formatPrice(this.state.currentPrice);
        const padding = 4;
        const tagW    = this.ctx.measureText(label).width + padding * 2 + 10;
        this.ctx.fillStyle = c.priceLineColor;
        this.ctx.beginPath();
        this.ctx.roundRect(this.plotRight + 2, y - 9, tagW, 18, 3);
        this.ctx.fill();
        this.ctx.fillStyle    = c.bgColor;
        this.ctx.font         = 'bold 10px "JetBrains Mono", monospace';
        this.ctx.textAlign    = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, this.plotRight + 7, y + 0.5);
        this.ctx.restore();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Volume Panel
    // ───────────────────────────────────────────────────────────────────────────

    private drawVolumePanelIfActive(): void {
        if (!this.state.activeIndicators.has('volume')) return;
        this.drawVolumePanel();
    }

    drawVolumePanel(): void {
        if (!this.state.visibleData.length) return;
        const c        = this.getColors();
        const panelTop = this.plotBottom + this.config.volumePanelGap;
        const panelH   = this.volumePanelH;
        const bodyW    = Math.max(1, this.config.candleWidth * this.state.scaleX);
        const maxVol   = Math.max(1, ...this.state.visibleData.map(cv => cv.volume));

        this.ctx.fillStyle = c.panelBg;
        this.ctx.fillRect(this.plotLeft, panelTop, this.plotWidth, panelH);

        for (let i = 0; i < this.state.visibleData.length; i++) {
            const candle = this.state.visibleData[i];
            if (!candle) continue;
            const isUp   = candle.close >= candle.open;
            const barH   = Math.max(1, (candle.volume / maxVol) * panelH);
            this.ctx.fillStyle = isUp ? c.volumeUp : c.volumeDown;
            this.ctx.fillRect(this.indexToX(i), panelTop + panelH - barH, bodyW, barH);
        }

        this.ctx.strokeStyle = c.axisColor;
        this.ctx.lineWidth   = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.plotLeft, panelTop);
        this.ctx.lineTo(this.plotRight, panelTop);
        this.ctx.stroke();

        this.ctx.fillStyle    = c.mutedText;
        this.ctx.font         = '10px sans-serif';
        this.ctx.textAlign    = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('VOL', this.plotLeft + 4, panelTop + 3);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Indicator Overlays
    // ───────────────────────────────────────────────────────────────────────────

    private drawIndicatorOverlays(): void {
        for (const [, series] of this.indicatorCache) {
            if (series.isSubPanel) continue;
            if (series.bollingerPoints) {
                this.drawBollingerBands(series);
            } else if (series.points) {
                this.drawLineSeries(series.points, series.color ?? 'rgba(96,195,255,0.8)');
            }
        }
    }

    private drawLineSeries(
        points: { timestamp: number; value: number }[],
        color:  string,
    ): void {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth   = 1.5;
        this.ctx.lineJoin    = 'round';
        this.ctx.beginPath();

        let started = false;
        for (let i = 0; i < this.state.visibleData.length; i++) {
            const pt = points[this.state.viewportStart + i];
            if (!pt || !isFiniteNumber(pt.value)) { started = false; continue; }
            const x = this.indexToX(i) + (this.config.candleWidth * this.state.scaleX) / 2;
            const y = this.priceToY(pt.value);
            if (!started) { this.ctx.moveTo(x, y); started = true; }
            else { this.ctx.lineTo(x, y); }
        }
        this.ctx.stroke();
        this.ctx.restore();
    }

    private drawBollingerBands(series: IndicatorSeries): void {
        if (!series.bollingerPoints) return;
        const pts = series.bollingerPoints;
        const seriesColor = series.color ?? 'rgba(6,182,212,0.8)';

        const drawBand = (
            getter: (p: typeof pts[0]) => number,
            color:  string,
            dash?:  number[],
        ) => {
            this.ctx.save();
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth   = 1;
            if (dash) this.ctx.setLineDash(dash);
            this.ctx.beginPath();
            let started = false;
            for (let i = 0; i < this.state.visibleData.length; i++) {
                const pt = pts[this.state.viewportStart + i];
                if (!pt || !isFiniteNumber(getter(pt))) { started = false; continue; }
                const x = this.indexToX(i) + (this.config.candleWidth * this.state.scaleX) / 2;
                const y = this.priceToY(getter(pt));
                if (!started) { this.ctx.moveTo(x, y); started = true; }
                else { this.ctx.lineTo(x, y); }
            }
            this.ctx.stroke();
            if (dash) this.ctx.setLineDash([]);
            this.ctx.restore();
        };

        drawBand(p => p.upper,  seriesColor);
        drawBand(p => p.lower,  seriesColor);
        drawBand(p => p.middle, seriesColor, [4, 4]);

        const fillColor: string = seriesColor.includes('rgb')
            ? seriesColor.replace(')', ', 0.06)').replace('rgb(', 'rgba(')
            : 'rgba(6,182,212,0.06)';

        this.ctx.save();
        this.ctx.fillStyle = fillColor;
        this.ctx.beginPath();
        let started = false;
        for (let i = 0; i < this.state.visibleData.length; i++) {
            const pt = pts[this.state.viewportStart + i];
            if (!pt || !isFiniteNumber(pt.upper)) { started = false; continue; }
            const x = this.indexToX(i) + (this.config.candleWidth * this.state.scaleX) / 2;
            if (!started) { this.ctx.moveTo(x, this.priceToY(pt.upper)); started = true; }
            else { this.ctx.lineTo(x, this.priceToY(pt.upper)); }
        }
        for (let i = this.state.visibleData.length - 1; i >= 0; i--) {
            const pt = pts[this.state.viewportStart + i];
            if (!pt || !isFiniteNumber(pt.lower)) continue;
            const x = this.indexToX(i) + (this.config.candleWidth * this.state.scaleX) / 2;
            this.ctx.lineTo(x, this.priceToY(pt.lower));
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Sub-Panels (RSI, MACD)
    // ───────────────────────────────────────────────────────────────────────────

    private getSubPanelIds(): IndicatorId[] {
        const ids: IndicatorId[] = [];
        for (const [id, series] of this.indicatorCache) {
            if (series.isSubPanel) ids.push(id);
        }
        return ids;
    }

    private drawSubPanels(): void {
        const ids = this.getSubPanelIds();
        if (!ids.length) return;

        let panelTop = this.plotBottom + this.config.volumePanelGap;
        if (this.state.activeIndicators.has('volume')) {
            panelTop += this.volumePanelH + this.config.volumePanelGap;
        }
        for (const id of ids) {
            const series = this.indicatorCache.get(id);
            if (!series) continue;
            this.drawSubPanel(series, panelTop);
            panelTop += this.subPanelHeight + this.config.volumePanelGap;
        }
    }

    private drawSubPanel(series: IndicatorSeries, panelTop: number): void {
        const c      = this.getColors();
        const panelH = this.subPanelHeight;

        this.ctx.fillStyle = c.panelBg;
        this.ctx.fillRect(this.plotLeft, panelTop, this.plotWidth, panelH);

        this.ctx.strokeStyle = c.axisColor;
        this.ctx.lineWidth   = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.plotLeft, panelTop);
        this.ctx.lineTo(this.plotRight, panelTop);
        this.ctx.stroke();

        this.ctx.fillStyle    = c.mutedText;
        this.ctx.font         = '10px sans-serif';
        this.ctx.textAlign    = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(series.label, this.plotLeft + 4, panelTop + 3);

        let rangeMin = 0, rangeMax = 100;
        if (series.subPanelRange) {
            [rangeMin, rangeMax] = series.subPanelRange;
        } else if (series.macdPoints) {
            const vals: number[] = [];
            for (let i = 0; i < this.state.visibleData.length; i++) {
                const pt = series.macdPoints[this.state.viewportStart + i];
                if (pt) vals.push(pt.macd, pt.signal, pt.histogram);
            }
            const v = vals.filter(isFiniteNumber);
            if (v.length) {
                const rng = Math.max(Math.abs(Math.min(...v)), Math.abs(Math.max(...v)));
                rangeMin = -rng * 1.1;
                rangeMax =  rng * 1.1;
            }
        }

        const toY = (v: number) =>
            panelTop + panelH - ((v - rangeMin) / (rangeMax - rangeMin)) * panelH;

        if (series.id === 'rsi_14') {
            for (const ref of [30, 50, 70]) {
                const y = toY(ref);
                this.ctx.strokeStyle = ref === 50 ? c.mutedText : c.gridColor;
                this.ctx.lineWidth   = 1;
                this.ctx.setLineDash(ref === 50 ? [] : [3, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(this.plotLeft, y);
                this.ctx.lineTo(this.plotRight, y);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                this.ctx.fillStyle    = c.mutedText;
                this.ctx.font         = '9px monospace';
                this.ctx.textAlign    = 'right';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(String(ref), this.plotRight - 2, y);
            }
        }

        if (series.points) {
            const seriesColor = series.color ?? 'rgba(96,195,255,0.8)';
            this.ctx.save();
            this.ctx.strokeStyle = seriesColor;
            this.ctx.lineWidth   = 1.5;
            this.ctx.beginPath();
            let started = false;
            for (let i = 0; i < this.state.visibleData.length; i++) {
                const pt = series.points[this.state.viewportStart + i];
                if (!pt || !isFiniteNumber(pt.value)) { started = false; continue; }
                const x = this.indexToX(i) + (this.config.candleWidth * this.state.scaleX) / 2;
                const y = toY(pt.value);
                if (!started) { this.ctx.moveTo(x, y); started = true; }
                else { this.ctx.lineTo(x, y); }
            }
            this.ctx.stroke();
            this.ctx.restore();
        }

        if (series.macdPoints) {
            const zeroY = toY(0);
            const bodyW = Math.max(1, this.config.candleWidth * this.state.scaleX);

            for (let i = 0; i < this.state.visibleData.length; i++) {
                const pt = series.macdPoints[this.state.viewportStart + i];
                if (!pt || !isFiniteNumber(pt.histogram)) continue;
                const x      = this.indexToX(i);
                const histY  = toY(pt.histogram);
                const barTop = Math.min(histY, zeroY);
                const barH   = Math.abs(histY - zeroY);
                this.ctx.fillStyle = pt.histogram >= 0
                    ? 'rgba(34,197,94,0.5)'
                    : 'rgba(239,68,68,0.5)';
                this.ctx.fillRect(x, barTop, bodyW, barH);
            }

            this.ctx.save();
            this.ctx.strokeStyle = '#22c55e';
            this.ctx.lineWidth   = 1.5;
            this.ctx.beginPath();
            let s = false;
            for (let i = 0; i < this.state.visibleData.length; i++) {
                const pt = series.macdPoints[this.state.viewportStart + i];
                if (!pt || !isFiniteNumber(pt.macd)) { s = false; continue; }
                const x = this.indexToX(i) + bodyW / 2;
                const y = toY(pt.macd);
                if (!s) { this.ctx.moveTo(x, y); s = true; } else this.ctx.lineTo(x, y);
            }
            this.ctx.stroke();

            this.ctx.strokeStyle = '#f59e0b';
            this.ctx.beginPath();
            s = false;
            for (let i = 0; i < this.state.visibleData.length; i++) {
                const pt = series.macdPoints[this.state.viewportStart + i];
                if (!pt || !isFiniteNumber(pt.signal)) { s = false; continue; }
                const x = this.indexToX(i) + bodyW / 2;
                const y = toY(pt.signal);
                if (!s) { this.ctx.moveTo(x, y); s = true; } else this.ctx.lineTo(x, y);
            }
            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Crosshair
    // ───────────────────────────────────────────────────────────────────────────

    private drawCrosshair(): void {
        const { mouseX: mx, mouseY: my } = this.state;
        if (mx < this.plotLeft || mx > this.plotRight) return;
        if (my < this.plotTop  || my > this.plotBottom) return;

        const c = this.getColors();
        this.ctx.save();
        this.ctx.strokeStyle = c.crosshairColor;
        this.ctx.lineWidth   = 1;
        this.ctx.setLineDash([4, 6]);

        this.ctx.beginPath();
        this.ctx.moveTo(this.plotLeft, my);
        this.ctx.lineTo(this.plotRight, my);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(mx, this.plotTop);
        this.ctx.lineTo(mx, this.plotBottom);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        const price  = this.yToPrice(my);
        const pLabel = formatPrice(price);
        const tagW   = this.ctx.measureText(pLabel).width + 14;
        this.ctx.fillStyle    = c.crosshairColor;
        this.ctx.beginPath();
        this.ctx.roundRect(this.plotRight + 2, my - 9, tagW, 18, 3);
        this.ctx.fill();
        this.ctx.fillStyle    = '#fff';
        this.ctx.font         = '10px monospace';
        this.ctx.textAlign    = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(pLabel, this.plotRight + 6, my + 0.5);

        const idx = this.xToIndex(mx);
        if (idx >= 0 && idx < this.state.visibleData.length) {
            const candle = this.state.visibleData[idx];
            if (candle) {
                const tLabel = formatDate(candle.timestamp, 'DD MMM YY HH:mm');
                const tW     = this.ctx.measureText(tLabel).width + 14;
                const tX     = clamp(mx - tW / 2, this.plotLeft, this.plotRight - tW);
                this.ctx.fillStyle = c.crosshairColor;
                this.ctx.beginPath();
                this.ctx.roundRect(tX, this.plotBottom + 2, tW, 16, 3);
                this.ctx.fill();
                this.ctx.fillStyle  = '#fff';
                this.ctx.textAlign  = 'center';
                this.ctx.fillText(tLabel, tX + tW / 2, this.plotBottom + 10);
            }
        }
        this.ctx.restore();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Drawing Tools
    // ───────────────────────────────────────────────────────────────────────────

    private drawDrawings(): void {
        const all = [...this.drawings, ...(this.draftDrawing ? [this.draftDrawing] : [])];
        for (const drawing of all) this.renderDrawing(drawing);
    }

    private renderDrawing(drawing: Drawing): void {
        if (!drawing.points.length) return;
        const c = this.getColors();
        this.ctx.save();
        this.ctx.strokeStyle = drawing.isDraft ? c.crosshairColor : drawing.color;
        this.ctx.lineWidth   = drawing.lineWidth;
        this.ctx.setLineDash(drawing.isDraft ? [4, 4] : []);

        const toXY = (pp: PricePoint): [number, number] => [
            this.timestampToX(pp.timestamp),
            this.priceToY(pp.price),
        ];

        switch (drawing.type) {
            case 'trendline': {
                if (drawing.points.length < 2) break;
                const p0 = drawing.points[0];
                const p1 = drawing.points[1];
                if (!p0 || !p1) break;
                const [x1, y1] = toXY(p0);
                const [x2, y2] = toXY(p1);
                if (x1 < 0 || x2 < 0) break;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
                break;
            }
            case 'horizontal': {
                const p0 = drawing.points[0];
                if (!p0) break;
                const y = this.priceToY(p0.price);
                this.ctx.beginPath();
                this.ctx.moveTo(this.plotLeft, y);
                this.ctx.lineTo(this.plotRight, y);
                this.ctx.stroke();
                this.ctx.fillStyle    = drawing.color;
                this.ctx.font         = '10px monospace';
                this.ctx.textAlign    = 'right';
                this.ctx.textBaseline = 'bottom';
                this.ctx.fillText(formatPrice(p0.price), this.plotRight - 4, y - 2);
                break;
            }
            case 'fibonacci': {
                if (drawing.points.length < 2) break;
                const p0 = drawing.points[0];
                const p1 = drawing.points[1];
                if (!p0 || !p1) break;
                const [, y1] = toXY(p0);
                const [, y2] = toXY(p1);
                const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
                const colors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899'];
                for (let li = 0; li < levels.length; li++) {
                    const level = levels[li];
                    if (level === undefined) continue;
                    const y = y2 + (y1 - y2) * level;
                    this.ctx.strokeStyle  = colors[li % colors.length] ?? '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.plotLeft, y);
                    this.ctx.lineTo(this.plotRight, y);
                    this.ctx.stroke();
                    this.ctx.fillStyle    = colors[li % colors.length] ?? '#ffffff';
                    this.ctx.font         = '9px monospace';
                    this.ctx.textAlign    = 'right';
                    this.ctx.textBaseline = 'bottom';
                    this.ctx.fillText(`${(level * 100).toFixed(1)}%`, this.plotRight - 4, y - 1);
                }
                break;
            }
            case 'rectangle': {
                if (drawing.points.length < 2) break;
                const p0 = drawing.points[0];
                const p1 = drawing.points[1];
                if (!p0 || !p1) break;
                const [x1, y1] = toXY(p0);
                const [x2, y2] = toXY(p1);
                if (x1 < 0 || x2 < 0) break;
                const rx = Math.min(x1, x2), ry = Math.min(y1, y2);
                const rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
                this.ctx.fillStyle = drawing.color
                    .replace(')', ', 0.08)')
                    .replace('rgb(', 'rgba(');
                this.ctx.fillRect(rx, ry, rw, rh);
                this.ctx.strokeRect(rx, ry, rw, rh);
                break;
            }
        }
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Event Listeners
    // ───────────────────────────────────────────────────────────────────────────

    private setupEventListeners(): void {
        window.addEventListener('resize',  this._onResize, { passive: true });
        window.addEventListener('keydown', this._onKey);
        this.canvas.addEventListener('wheel',      this._onWheel,  { passive: false });
        this.canvas.addEventListener('mousedown',  this._onMDown);
        this.canvas.addEventListener('mousemove',  this._onMMove);
        this.canvas.addEventListener('mouseup',    this._onMUp);
        this.canvas.addEventListener('mouseleave', this._onMLeave);
    }

    private handleWheel(e: WheelEvent): void {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        this.state.scaleX = clamp(this.state.scaleX * factor, 0.2, 20);
        this.updateVisibleData();
        this.requestDraw();
    }

    private handleMouseDown(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const mx   = e.clientX - rect.left;
        const my   = e.clientY - rect.top;

        if (this.state.drawingMode !== 'none') {
            this.handleDrawingClick(mx, my);
            return;
        }

        this.state.isDragging = true;
        this.state.dragStartX = mx;
        this.canvas.style.cursor = 'grabbing';
    }

    private handleMouseMove(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const mx   = e.clientX - rect.left;
        const my   = e.clientY - rect.top;

        this.state.mouseX    = mx;
        this.state.mouseY    = my;
        this.state.mouseInside = true;

        if (this.state.isDragging) {
            const delta = mx - this.state.dragStartX;
            this.state.dragStartX = mx;

            const candleDelta = delta / this.candleStep;
            const maxOffset   = Math.max(0, this.state.data.length - this.maxVisibleCandles);
            this.state.offsetCandles = clamp(
                this.state.offsetCandles + candleDelta,
                0,
                maxOffset,
            );
            this.updateVisibleData();
        }

        if (this.draftDrawing && this.draftDrawing.points.length === 1) {
            const pp = this.canvasToPrice(mx, my);
            if (pp) {
                if (this.draftDrawing.points.length > 1) {
                    this.draftDrawing.points[1] = pp;
                } else {
                    this.draftDrawing.points.push(pp);
                }
            }
        }

        this.requestDraw();
    }

    private handleMouseUp(e: MouseEvent): void {
        if (this.state.isDragging) {
            this.state.isDragging    = false;
            this.canvas.style.cursor = this.state.drawingMode === 'none' ? 'default' : 'crosshair';
        }

        if (this.draftDrawing && this.draftDrawing.points.length >= 2) {
            const rect = this.canvas.getBoundingClientRect();
            const pp   = this.canvasToPrice(e.clientX - rect.left, e.clientY - rect.top);
            if (pp) {
                this.draftDrawing.points[1] = pp;
                this.draftDrawing.isDraft   = false;
                this.drawings.push(this.draftDrawing);
                this.draftDrawing = null;
                this.setDrawingMode('none');
                this.requestDraw();
            }
        }
    }

    private handleMouseLeave(): void {
        this.state.mouseInside = false;
        this.state.isDragging  = false;
        this.canvas.style.cursor = 'default';
        this.requestDraw();
    }

    private handleKey(e: KeyboardEvent): void {
        const maxOffset = Math.max(0, this.state.data.length - this.maxVisibleCandles);
        switch (e.key) {
            case '+': case '=': this.zoomIn();  break;
            case '-': case '_': this.zoomOut(); break;
            case 'ArrowLeft': {
                this.state.offsetCandles = clamp(this.state.offsetCandles + 5, 0, maxOffset);
                this.updateVisibleData();
                this.requestDraw();
                break;
            }
            case 'ArrowRight': {
                this.state.offsetCandles = clamp(this.state.offsetCandles - 5, 0, maxOffset);
                this.updateVisibleData();
                this.requestDraw();
                break;
            }
            case 'Home': case '0': this.resetView(); break;
            case 'Escape':
                this.setDrawingMode('none');
                this.draftDrawing = null;
                break;
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Drawing Tool Helpers
    // ───────────────────────────────────────────────────────────────────────────

    private handleDrawingClick(cx: number, cy: number): void {
        const pp = this.canvasToPrice(cx, cy);
        if (!pp) return;

        if (!this.draftDrawing) {
            this.draftDrawing = {
                id:        `draw_${Date.now()}`,
                type:      this.state.drawingMode,
                points:    [pp],
                color:     this.getColors().priceLineColor,
                lineWidth: 1.5,
                isDraft:   true,
            };
        } else {
            if (this.state.drawingMode === 'horizontal') {
                this.draftDrawing.isDraft = false;
                this.drawings.push(this.draftDrawing);
                this.draftDrawing = null;
                this.setDrawingMode('none');
            } else {
                this.draftDrawing.points.push(pp);
                if (this.draftDrawing.points.length >= 2) {
                    this.draftDrawing.isDraft = false;
                    this.drawings.push(this.draftDrawing);
                    this.draftDrawing = null;
                    this.setDrawingMode('none');
                }
            }
        }
        this.requestDraw();
    }

    private canvasToPrice(cx: number, cy: number): PricePoint | null {
        const idx = this.xToIndex(cx);
        if (idx < 0 || idx >= this.state.visibleData.length) return null;
        const candle = this.state.visibleData[idx];
        if (!candle) return null;
        return {
            timestamp: candle.timestamp,
            price:     this.yToPrice(cy),
        };
    }

    getCandleAtCursor(): Candle | null {
        const idx = this.xToIndex(this.state.mouseX);
        if (idx < 0 || idx >= this.state.visibleData.length) return null;
        return this.state.visibleData[idx] ?? null;
    }
}