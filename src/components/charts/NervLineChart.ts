import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervLineChartProps extends NervBaseProps {
  /** Array of series, each series is an array of y-values */
  data?: number[][];
  /** X-axis labels */
  labels?: string[];
  /** Color per series (theme accent names) */
  colors?: NervColor[];
  showGrid?: boolean;
  showDots?: boolean;
}

const DEFAULT_SERIES_COLORS: NervColor[] = ['orange', 'cyan', 'green', 'red', 'purple', 'amber'];

export class NervLineChart extends NervBase<NervLineChartProps> {
  private _grid = new Graphics();
  private _lines = new Graphics();
  private _dots = new Graphics();
  private _textPool: Text[] = [];
  private _textPoolUsed = 0;

  protected defaultProps(): NervLineChartProps {
    return {
      data: [],
      labels: [],
      colors: [],
      width: 300,
      height: 200,
      showGrid: true,
      showDots: true,
      interactive: false,
    };
  }

  protected onInit(): void {
    this.addChild(this._grid, this._lines, this._dots);
  }

  getPreferredSize(): Size {
    return {
      width: this._props.width ?? 300,
      height: this._props.height ?? 200,
    };
  }

  private _acquireText(opts: Parameters<typeof TextRenderer.create>[0]): Text {
    if (this._textPoolUsed < this._textPool.length) {
      const t = this._textPool[this._textPoolUsed];
      t.visible = true;
      TextRenderer.updateText(t, opts.text, opts.uppercase ?? true);
      TextRenderer.updateStyle(t, { color: opts.color, size: opts.size, alpha: opts.alpha });
      this._textPoolUsed++;
      return t;
    }
    const t = TextRenderer.create(opts);
    this._textPool.push(t);
    this.addChild(t);
    this._textPoolUsed++;
    return t;
  }

  private _reclaimPool(): void {
    for (let i = this._textPoolUsed; i < this._textPool.length; i++) {
      this._textPool[i].visible = false;
    }
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const data = p.data ?? [];
    const w = this.componentWidth;
    const h = this.componentHeight;
    const colors = p.colors ?? [];
    const labels = p.labels ?? [];

    this._textPoolUsed = 0;

    this._grid.clear();
    this._lines.clear();
    this._dots.clear();

    if (data.length === 0) {
      this._reclaimPool();
      return;
    }

    // Compute bounds
    const labelArea = labels.length > 0 ? theme.fontSizes.xs + theme.spacing.sm : 0;
    const chartW = w;
    const chartH = h - labelArea;

    let globalMin = Infinity;
    let globalMax = -Infinity;
    for (const series of data) {
      for (const v of series) {
        if (v < globalMin) globalMin = v;
        if (v > globalMax) globalMax = v;
      }
    }
    if (globalMin === globalMax) { globalMin -= 1; globalMax += 1; }
    const range = globalMax - globalMin;

    // Find max data points across all series
    let maxPoints = 0;
    for (const series of data) {
      if (series.length > maxPoints) maxPoints = series.length;
    }
    if (maxPoints < 2) {
      this._reclaimPool();
      return;
    }

    // Grid
    if (p.showGrid) {
      this._grid.setStrokeStyle({ width: 1, color: theme.semantic.borderDefault, alpha: 0.12 });

      // Horizontal grid
      for (let i = 0; i <= 4; i++) {
        const y = chartH * (1 - i / 4);
        this._grid.moveTo(0, y);
        this._grid.lineTo(chartW, y);
      }

      // Vertical grid
      const vLines = Math.min(maxPoints - 1, 10);
      for (let i = 0; i <= vLines; i++) {
        const x = (i / vLines) * chartW;
        this._grid.moveTo(x, 0);
        this._grid.lineTo(x, chartH);
      }

      this._grid.stroke();
    }

    // Draw series
    for (let si = 0; si < data.length; si++) {
      const series = data[si];
      if (series.length < 2) continue;

      const colorName = colors[si] ?? DEFAULT_SERIES_COLORS[si % DEFAULT_SERIES_COLORS.length];
      const color = theme.colorForAccent(colorName);

      this._lines.setStrokeStyle({ width: 2, color, alpha: 0.9 });

      for (let i = 0; i < series.length; i++) {
        const x = (i / (series.length - 1)) * chartW;
        const y = chartH - ((series[i] - globalMin) / range) * chartH;

        if (i === 0) {
          this._lines.moveTo(x, y);
        } else {
          this._lines.lineTo(x, y);
        }
      }
      this._lines.stroke();

      // Dots
      if (p.showDots) {
        for (let i = 0; i < series.length; i++) {
          const x = (i / (series.length - 1)) * chartW;
          const y = chartH - ((series[i] - globalMin) / range) * chartH;
          this._dots.circle(x, y, 3);
          this._dots.fill({ color });
        }
      }
    }

    // X-axis labels
    if (labels.length > 0) {
      const step = Math.max(1, Math.floor(labels.length / Math.min(labels.length, 8)));
      for (let i = 0; i < labels.length; i += step) {
        const x = (i / (maxPoints - 1)) * chartW;
        const lt = this._acquireText({
          text: labels[i],
          role: 'mono',
          size: theme.fontSizes.xs,
          color: theme.semantic.textMuted,
          uppercase: false,
        });
        lt.x = x - lt.width / 2;
        lt.y = chartH + theme.spacing.xxs;
      }
    }

    this._reclaimPool();
  }

  protected onDispose(): void {
    // No manual child destruction -- NervBase.destroy() handles children.
  }
}
