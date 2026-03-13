/**
 * @file main.ts
 * @description Orbityx Chart Pro — application bootstrap.
 *
 * The library is completely provider-agnostic. Before calling chart.init():
 *
 *   1. Implement DataProvider (or use a provider from /providers/examples/)
 *   2. chart.setProvider(myProvider)
 *   3. chart.registerInstruments([…])
 *   4. await chart.init()
 *
 * Changes vs original:
 *  - loadMoreHistory() added: fetches one page of candles older than the
 *    current oldest and prepends them to the DataManager cache without
 *    moving the viewport (seamless infinite backwards scroll).
 *  - engine.onNeedMoreData wired up in init() so the chart engine can
 *    trigger history fetches automatically as the user pans left.
 *  - _loadingMore flag prevents concurrent history requests.
 *  - Flag is reset in switchInstrument() and handleTimeframeChange() so
 *    changing the symbol/timeframe never leaves the loader stuck.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Quick start — Binance adapter
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * import OrbityxChart from './main.js';
 * import { BinanceProvider } from './providers/examples/binance.js';
 *
 * const chart = new OrbityxChart();
 * chart
 *   .setProvider(new BinanceProvider())
 *   .registerInstruments([
 *     { id: 'BTCUSDT', symbol: 'BTC/USDT', name: 'Bitcoin',  icon: '₿', iconColor: '#f7931a' },
 *     { id: 'ETHUSDT', symbol: 'ETH/USDT', name: 'Ethereum', icon: 'Ξ', iconColor: '#627eea' },
 *   ]);
 * await chart.init();
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom provider
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * const myProvider: DataProvider = {
 *   async fetchCandles({ instrumentId, timeframe }) {
 *     const rows = await myApi.getOHLCV(instrumentId, timeframe);
 *     return rows.map(r => ({
 *       timestamp: r.time * 1000,
 *       open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v,
 *     }));
 *   },
 * };
 */
import ChartEngine    from './core/chart-engine.js';
import dataManager    from './core/data-manager.js';
import wsService      from './services/ws.js';
import { registry }   from './services/api.js';
import { initToolBar }   from './ui/toolbar.js';
import { initTooltip }   from './ui/tooltip.js';
import {
    initLegend,
    applyMarketStats,
    populateSymbolSelector,
} from './ui/legend.js';
import { initThemeToggle } from './ui/theme.js';
import type {
    DataProvider,
    Instrument,
    ChartType,
    Timeframe,
    WSMessage,
} from './types/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** How often (ms) the 24 h stats ticker is refreshed. */
const STATS_REFRESH_MS = 60_000;

// ─────────────────────────────────────────────────────────────────────────────
// OrbityxChart
// ─────────────────────────────────────────────────────────────────────────────

class OrbityxChart {
    private engine:      ChartEngine;
    private activeId:    string = '';
    private timeframe:   string = '1d';
    private legendUnsub: (() => void) | null = null;
    private wsUnsub:     (() => void) | null = null;
    private statsTimer:  ReturnType<typeof setInterval> | null = null;

    /**
     * Guards against concurrent backwards history fetches.
     * Set to true while a prependCandles() call is in flight;
     * reset to false (along with engine.fetchingMoreHistory) once it resolves.
     */
    private _loadingMore = false;

    constructor(private opts: { canvasId?: string } = {}) {
        this.engine = new ChartEngine(opts.canvasId ?? 'chartCanvas');
    }

    // ── Configuration (chainable) ────────────────────────────────────────────

    /** Register the DataProvider that supplies OHLCV candles. Must be called before init(). */
    setProvider(provider: DataProvider): this {
        registry.setProvider(provider);
        return this;
    }

    /** Register a single instrument. */
    registerInstrument(instrument: Instrument): this {
        registry.registerInstrument(instrument);
        return this;
    }

    /** Register multiple instruments at once. */
    registerInstruments(instruments: Instrument[]): this {
        registry.registerInstruments(instruments);
        return this;
    }

    /** Set an optional WebSocket URL for live streaming. Omit for pull-only mode. */
    setWebSocketUrl(url: string): this {
        wsService.setUrl(url);
        return this;
    }

    /** Override the default first instrument (defaults to first registered). */
    setDefaultInstrument(id: string): this {
        this.activeId = id;
        return this;
    }

    /** Override the default timeframe (defaults to '1d'). */
    setDefaultTimeframe(tf: Timeframe | string): this {
        this.timeframe = tf;
        return this;
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    async init(): Promise<void> {
        if (registry.instrumentCount === 0) {
            console.warn(
                '[Orbityx] No instruments registered.\n' +
                'Call chart.registerInstruments([…]) before init().',
            );
        }

        if (!this.activeId) {
            this.activeId = registry.getAllInstruments()[0]?.id ?? '';
        }

        try {
            initThemeToggle(this.engine);

            initToolBar(
                tf  => this.handleTimeframeChange(tf),
                ct  => this.engine.setChartType(ct as ChartType),
                this.engine,
            );

            this.legendUnsub = initLegend(this.activeId);
            initTooltip(this.engine);

            const selectEl = document.getElementById('symbol-select') as HTMLSelectElement | null;
            if (selectEl) {
                populateSymbolSelector(selectEl);
                if (this.activeId) selectEl.value = this.activeId;
                selectEl.addEventListener('change', () => this.switchInstrument(selectEl.value));
            }

            await this.loadData();
            this.engine.init(dataManager);

            // Wire the engine's lazy-load hook to our history fetcher.
            // The engine sets fetchingMoreHistory = true before calling this;
            // loadMoreHistory() resets both flags when the request finishes.
            this.engine.onNeedMoreData = () => { void this.loadMoreHistory(); };

            this.refreshStats();
            this.statsTimer = setInterval(() => this.refreshStats(), STATS_REFRESH_MS);

            this.setupWebSocket();
            this.startFPSMonitor();

            wsService.onStatus(c => this.updateConnectionDot(c));

            document.getElementById('fullscreen-btn')
                ?.addEventListener('click', this.toggleFullscreen);

            document.getElementById('settings-btn')
                ?.addEventListener('click', () => this.toggleModal('settings-modal'));

            document.querySelector('.modal-close')
                ?.addEventListener('click', () => this.toggleModal('settings-modal', false));

            console.info('[Orbityx] Ready —', registry.instrumentCount, 'instrument(s) registered.');
        } catch (err) {
            console.error('[Orbityx] init() failed:', err);
            this.showError('Initialisation Error', String(err));
        }
    }

    destroy(): void {
        this.wsUnsub?.();
        this.legendUnsub?.();
        if (this.statsTimer) clearInterval(this.statsTimer);
        this.engine.destroy();
        registry.destroy();
    }

    // ── Data loading ─────────────────────────────────────────────────────────

    /**
     * Full load — replaces the entire cache, resets the viewport, and redraws.
     * Called on init, symbol change, and timeframe change.
     */
    private async loadData(): Promise<void> {
        if (!this.activeId) return;
        this.showLoading(true);
        try {
            const candles = await dataManager.loadCandles(this.activeId, this.timeframe);
            this.engine.setData(candles);
            this.engine.setTimeframe(this.timeframe);
            setText('#last-update', `Updated: ${new Date().toLocaleTimeString()}`);
        } catch (err) {
            this.showError('Data Error', String(err));
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Lazy backwards history load — called automatically by the engine when
     * the viewport comes within LAZY_LOAD_THRESHOLD candles of the oldest entry.
     *
     * Fetches one page of candles older than the current oldest timestamp,
     * prepends them to the DataManager cache, and shifts offsetCandles forward
     * by the same amount so the visible window does not jump.
     *
     * The fetch is a no-op while _loadingMore is true to prevent concurrent
     * requests from the same scroll event stream.
     */
    private async loadMoreHistory(): Promise<void> {
        if (this._loadingMore || !this.activeId) {
            // Already in flight — make sure the engine flag is also cleared so
            // it can fire again next time (defensive reset).
            this.engine.fetchingMoreHistory = false;
            return;
        }

        this._loadingMore = true;

        try {
            const oldest = dataManager.getData()[0];
            if (!oldest) return;

            // Ask the provider for candles ending just before the oldest we have.
            const added = await dataManager.prependCandles(
                this.activeId,
                this.timeframe,
                oldest.timestamp - 1,
            );

            if (added > 0) {
                // Shift the viewport right by exactly the number of prepended
                // candles so the currently visible range stays identical.
                this.engine.state.offsetCandles += added;
                this.engine.setData(dataManager.getData());
            }
            // added === 0 means the provider returned nothing — we have reached
            // the beginning of the available history; stop triggering.
        } catch (err) {
            // History load failures are non-critical — log and continue.
            console.warn('[Orbityx] loadMoreHistory() failed:', err);
        } finally {
            this._loadingMore              = false;
            // Release the engine gate so it can fire the hook again next time
            // the viewport gets close to the left edge.
            this.engine.fetchingMoreHistory = false;
        }
    }

    /** Refresh 24 h market statistics from the provider. */
    private async refreshStats(): Promise<void> {
        if (!this.activeId) return;
        try {
            const stats = await registry.fetchMarketStats(this.activeId);
            if (stats) applyMarketStats(stats, this.activeId);
        } catch {
            // Stats are decorative — silently ignore fetch failures.
        }
    }

    // ── Instrument / Timeframe switching ─────────────────────────────────────

    private switchInstrument(id: string): void {
        // Reset history loader state so the new symbol can trigger lazy loads.
        this._loadingMore              = false;
        this.engine.fetchingMoreHistory = false;

        this.activeId = id;
        this.legendUnsub?.();
        this.legendUnsub = initLegend(id);
        registry.notifyInstrumentChange(id, this.timeframe);
        this.loadData().then(() => this.refreshStats()).catch(console.error);
    }

    private handleTimeframeChange(tf: string): void {
        // Reset history loader state so the new timeframe can trigger lazy loads.
        this._loadingMore              = false;
        this.engine.fetchingMoreHistory = false;

        this.timeframe = tf;
        registry.notifyInstrumentChange(this.activeId, tf);
        this.loadData().then(() => this.engine.resetView()).catch(console.error);
    }

    // ── WebSocket ─────────────────────────────────────────────────────────────

    private setupWebSocket(): void {
        this.wsUnsub = wsService.subscribe((msg: WSMessage) => {
            switch (msg.type) {
                case 'candle':
                    if (msg.payload) {
                        dataManager.processLiveTick(msg.payload);
                        this.engine.setData(dataManager.getData());
                    }
                    break;
                case 'trade':
                    if (typeof msg.price === 'number') {
                        this.engine.state.currentPrice = msg.price;
                        this.engine.requestDraw();
                    }
                    break;
                case 'heartbeat':
                    wsService.send({ type: 'pong' });
                    break;
            }
        });
    }

    // ── UI helpers ────────────────────────────────────────────────────────────

    private showLoading(v: boolean): void {
        const el = document.getElementById('loading-indicator');
        if (el) el.style.display = v ? 'flex' : 'none';
    }

    private showError(title: string, message: string): void {
        const el = document.getElementById('error-notification');
        if (!el) { console.error(`[Orbityx] ${title}: ${message}`); return; }
        setText('.error-title',   title);
        setText('.error-message', message);
        el.style.display = 'flex';
        setTimeout(() => { el.style.display = 'none'; }, 8_000);
        el.querySelector('.error-dismiss')?.addEventListener(
            'click', () => { el.style.display = 'none'; }, { once: true },
        );
    }

    private readonly toggleFullscreen = (): void => {
        const el = document.querySelector<HTMLElement>('.chart-container');
        if (!el) return;
        if (!document.fullscreenElement) void el.requestFullscreen();
        else void document.exitFullscreen();
    };

    private toggleModal(id: string, show?: boolean): void {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.style.display = (show ?? modal.style.display === 'none') ? 'flex' : 'none';
    }

    private updateConnectionDot(connected: boolean): void {
        const el = document.getElementById('connection-status');
        if (el) {
            el.innerHTML =
                `<span class="status-dot ${connected ? 'connected' : 'disconnected'}"></span>` +
                (connected ? 'Live' : 'Offline');
        }
    }

    private startFPSMonitor(): void {
        let last = performance.now();
        const el = document.getElementById('frame-rate');
        const tick = (): void => {
            const now = performance.now();
            if (el) el.textContent = `${Math.round(1_000 / (now - last))} FPS`;
            last = now;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function setText(sel: string, val: string): void {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) el.textContent = val;
}

// Expose on window for CDN / non-module usage.
(window as unknown as Record<string, unknown>)['OrbityxChart'] = OrbityxChart;

export default OrbityxChart;
export { registry };
export type { DataProvider, Instrument } from './types/index.js';