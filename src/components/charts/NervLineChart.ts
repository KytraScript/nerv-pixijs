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
  private _textNodes: Text[] = [];

  protected defaultProps(): NervLineChartProps {
    return {
      data: [],
      labels: [],
      colors: [],
      width: 300,
      height: 200,
      showGrid: true,
      showDots: true,
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

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const data = p.data ?? [];
    const w = this.componentWidth;
    const h = this.componentHeight;
    const colors = p.colors ?? [];
    const labels = p.labels ?? [];

    // Clean up text
    for (const t of this._textNodes) { this.removeChild(t); t.destroy(); }
    this._textNodes = [];

    this._grid.clear();
    this._lines.clear();
    this._dots.clear();

    if (data.length === 0) return;

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
    if (maxPoints < 2) return;

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
        const lt = TextRenderer.create({
          text: labels[i],
          role: 'mono',
          size: theme.fontSizes.xs,
          color: theme.semantic.textMuted,
          uppercase: false,
        });
        lt.x = x - lt.width / 2;
        lt.y = chartH + theme.spacing.xxs;
        this.addChild(lt);
        this._textNodes.push(lt);
      }
    }
  }

  protected onDispose(): void {
    this._grid.destroy();
    this._lines.destroy();
    this._dots.destroy();
    for (const t of this._textNodes) t.destroy();
  }
}
