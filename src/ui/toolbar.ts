/**
 * @file ui/toolbar.ts
 * @description Chart toolbar – timeframes, chart type, drawing tools,
 * indicator picker, zoom controls, and settings toggle.
 *
 * Pure UI layer; all actions delegated via callbacks or directly
 * to the injected ChartEngine instance.
 */
import type ChartEngine from '../core/chart-engine.js';
import type { ChartType, DrawingMode, IndicatorId } from '../types/index.js';
import { INDICATOR_META } from '../core/indicators.js';

// ─────────────────────────────────────────────────────────────────────────────
// Public Init
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build and mount toolbar DOM inside #toolbar.
 * @param onTimeframeChange  App-level callback for timeframe switches.
 * @param onChartTypeChange  App-level callback for chart type switches.
 * @param engine             Chart engine for zoom/reset/drawing/indicators.
 */
export function initToolBar(
    onTimeframeChange: (tf: string) => void,
    onChartTypeChange: (type: ChartType) => void,
    engine: ChartEngine,
): void {
    const toolbar = document.getElementById('toolbar');
    if (!toolbar) {
        console.error('[Toolbar] #toolbar element not found');
        return;
    }
    toolbar.innerHTML = buildHTML();
    wireEvents(toolbar, onTimeframeChange, onChartTypeChange, engine);
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML Template
// ─────────────────────────────────────────────────────────────────────────────

function buildHTML(): string {
    return `
    <!-- Timeframe buttons -->
    <div class="tb-group">
      <span class="tb-label">Timeframe</span>
      <div class="tb-btns">
        ${['1m','5m','15m','30m','1h','4h','12h','1d','1w'].map((tf, i) => `
          <button class="tb-btn${i === 0 ? ' active' : ''}" data-tf="${tf}" title="${timeframeLabel(tf)}">${tf}</button>
        `).join('')}
      </div>
    </div>

    <!-- Chart type buttons -->
    <div class="tb-group">
      <span class="tb-label">Type</span>
      <div class="tb-btns">
        <button class="tb-btn active" data-ct="candlestick" title="Candlestick">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="3" height="7" fill="currentColor" rx="0.5"/><line x1="6.5" y1="2" x2="6.5" y2="5" stroke="currentColor" stroke-width="1.5"/><line x1="6.5" y1="12" x2="6.5" y2="14" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
        <button class="tb-btn" data-ct="heikin_ashi" title="Heikin Ashi">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="6" width="3" height="6" fill="currentColor" opacity="0.7" rx="0.5"/><rect x="8" y="4" width="3" height="8" fill="currentColor" rx="0.5"/><line x1="3.5" y1="3" x2="3.5" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="9.5" y1="2" x2="9.5" y2="4" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
        <button class="tb-btn" data-ct="line" title="Line">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polyline points="1,12 5,7 9,10 15,3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/></svg>
        </button>
        <button class="tb-btn" data-ct="area" title="Area">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polygon points="1,14 1,9 5,5 9,8 15,2 15,14" fill="currentColor" opacity="0.3"/><polyline points="1,9 5,5 9,8 15,2" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        </button>
        <button class="tb-btn" data-ct="bars" title="Bars">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="4" y1="3" x2="4" y2="13" stroke="currentColor" stroke-width="1.5"/><line x1="2.5" y1="7" x2="4" y2="7" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="10" x2="5.5" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="4" x2="10" y2="14" stroke="currentColor" stroke-width="1.5"/><line x1="8.5" y1="8" x2="10" y2="8" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="11" x2="11.5" y2="11" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
      </div>
    </div>

    <!-- Drawing tools -->
    <div class="tb-group">
      <span class="tb-label">Draw</span>
      <div class="tb-btns">
        <button class="tb-btn" data-draw="trendline" title="Trendline">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="2" y1="13" x2="14" y2="3" stroke="currentColor" stroke-width="1.5"/><circle cx="2" cy="13" r="1.5" fill="currentColor"/><circle cx="14" cy="3" r="1.5" fill="currentColor"/></svg>
        </button>
        <button class="tb-btn" data-draw="horizontal" title="Horizontal Line">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/></svg>
        </button>
        <button class="tb-btn" data-draw="fibonacci" title="Fibonacci Retracement">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="1" y1="3" x2="15" y2="3" stroke="#ef4444" stroke-width="1"/><line x1="1" y1="7" x2="15" y2="7" stroke="#22c55e" stroke-width="1"/><line x1="1" y1="10" x2="15" y2="10" stroke="#3b82f6" stroke-width="1"/><line x1="1" y1="13" x2="15" y2="13" stroke="#8b5cf6" stroke-width="1"/></svg>
        </button>
        <button class="tb-btn" data-draw="rectangle" title="Rectangle">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="8" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.1" rx="1"/></svg>
        </button>
        <button class="tb-btn" id="clear-drawings" title="Clear All Drawings">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3L13 13M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>

    <!-- Indicators -->
    <div class="tb-group">
      <span class="tb-label">Indicators</span>
      <div class="tb-btns">
        <button class="tb-btn" id="indicator-btn" title="Indicators">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polyline points="1,13 4,9 7,11 10,6 13,8" stroke="#22c55e" stroke-width="1.5" fill="none"/><polyline points="1,11 4,7 7,9 10,4 13,6" stroke="#3b82f6" stroke-width="1.5" fill="none" opacity="0.7"/></svg>
          <span>+ Add</span>
        </button>
      </div>
      <!-- Indicator dropdown (hidden by default) -->
      <div class="indicator-dropdown" id="indicator-dropdown" style="display:none;">
        ${buildIndicatorDropdown()}
      </div>
    </div>

    <!-- Zoom / Reset -->
    <div class="tb-group">
      <div class="tb-btns">
        <button class="tb-btn" id="zoom-in" title="Zoom In (+)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" stroke-width="1.5"/><line x1="7" y1="4" x2="7" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="7" x2="10" y2="7" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
        <button class="tb-btn" id="zoom-out" title="Zoom Out (-)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="7" x2="10" y2="7" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
        <button class="tb-btn" id="reset-view" title="Reset View (Home)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 1 0 1.5-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><polyline points="2,4 2,8 6,8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
  `;
}

function buildIndicatorDropdown(): string {
    const groups: Record<string, { id: IndicatorId; label: string }[]> = {};
    for (const [id, meta] of Object.entries(INDICATOR_META)) {
        const typedId = id as IndicatorId;
        if (!groups[meta.group]) groups[meta.group] = [];
        groups[meta.group].push({ id: typedId, label: meta.label });
    }

    return Object.entries(groups).map(([group, items]) => `
    <div class="ind-group">
      <div class="ind-group-label">${group}</div>
      ${items.map(({ id, label }) => `
        <label class="ind-item">
          <input type="checkbox" data-indicator="${id}" />          ${label}
          <span class="ind-dot" style="background:${INDICATOR_META[id]?.color ?? ''}"></span>
        </label>
      `).join('')}
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Wiring
// ─────────────────────────────────────────────────────────────────────────────

function wireEvents(
    toolbar: HTMLElement,
    onTfChange: (tf: string) => void,
    onCtChange: (ct: ChartType) => void,
    engine: ChartEngine,
): void {

    // Timeframe buttons.
    const tfBtns = toolbar.querySelectorAll<HTMLButtonElement>('[data-tf]');
    tfBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            tfBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            onTfChange(btn.dataset.tf!);
        });
    });

    // Chart type buttons.
    const ctBtns = toolbar.querySelectorAll<HTMLButtonElement>('[data-ct]');
    ctBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            ctBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            onCtChange((btn.dataset.ct as ChartType) ?? 'candlestick');
        });
    });

    // Drawing tools.
    const drawBtns = toolbar.querySelectorAll<HTMLButtonElement>('[data-draw]');
    drawBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const alreadyActive = btn.classList.contains('active');
            drawBtns.forEach((b) => b.classList.remove('active'));
            if (alreadyActive) {
                engine.setDrawingMode('none');
            } else {
                btn.classList.add('active');
                engine.setDrawingMode((btn.dataset.draw as DrawingMode) ?? 'none');
            }
        });
    });

    // Clear drawings.
    toolbar.querySelector('#clear-drawings')?.addEventListener('click', () => {
        engine.clearDrawings();
        drawBtns.forEach((b) => b.classList.remove('active'));
    });

    // Zoom / reset.
    toolbar.querySelector('#zoom-in')?.addEventListener('click',   () => engine.zoomIn());
    toolbar.querySelector('#zoom-out')?.addEventListener('click',  () => engine.zoomOut());
    toolbar.querySelector('#reset-view')?.addEventListener('click',() => engine.resetView());

    // Indicator dropdown toggle.
    const indBtn      = toolbar.querySelector('#indicator-btn');
    const indDropdown = toolbar.querySelector<HTMLElement>('#indicator-dropdown');
    indBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (indDropdown) {
            indDropdown.style.display = indDropdown.style.display === 'none' ? 'block' : 'none';
        }
    });
    document.addEventListener('click', () => {
        if (indDropdown) indDropdown.style.display = 'none';
    });

    // Indicator checkboxes.
    toolbar.querySelectorAll<HTMLInputElement>('[data-indicator]').forEach((chk) => {
        chk.addEventListener('change', () => {
            const id = chk.dataset.indicator as IndicatorId;
            engine.toggleIndicator(id);
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function timeframeLabel(tf: string): string {
    const map: Record<string, string> = {
        '1m':  '1 Minute',   '5m':  '5 Minutes',  '15m': '15 Minutes',
        '30m': '30 Minutes', '1h':  '1 Hour',      '4h':  '4 Hours',
        '12h': '12 Hours',   '1d':  '1 Day',       '3d':  '3 Days',
        '1w':  '1 Week',     '1month': '1 Month',  '1y':  '1 Year',
    };
    return map[tf] ?? tf;
}