import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface BarChartDatum {
  label: string;
  value: number;
  color?: NervColor;
}

export interface NervBarChartProps extends NervBaseProps {
  data?: BarChartDatum[];
  maxValue?: number;
  showLabels?: boolean;
  showValues?: boolean;
  color?: NervColor;
  orientation?: 'vertical' | 'horizontal';
}

export class NervBarChart extends NervBase<NervBarChartProps> {
  private _bars = new Graphics();
  private _grid = new Graphics();
  private _textNodes: Text[] = [];

  protected defaultProps(): NervBarChartProps {
    return {
      data: [],
      maxValue: 100,
      showLabels: true,
      showValues: true,
      color: 'orange',
      width: 300,
      height: 200,
      orientation: 'vertical',
    };
  }

  protected onInit(): void {
    this.addChild(this._grid, this._bars);
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
    const maxVal = p.maxValue ?? Math.max(1, ...data.map(d => d.value));
    const w = this.componentWidth;
    const h = this.componentHeight;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const isVertical = (p.orientation ?? 'vertical') === 'vertical';

    // Clean up previous text nodes
    for (const t of this._textNodes) { this.removeChild(t); t.destroy(); }
    this._textNodes = [];

    this._grid.clear();
    this._bars.clear();

    if (data.length === 0) return;

    const labelAreaSize = p.showLabels ? theme.fontSizes.sm + theme.spacing.sm : 0;
    const valueAreaSize = p.showValues ? theme.fontSizes.xs + theme.spacing.xxs : 0;

    if (isVertical) {
      this.drawVertical(data, maxVal, w, h, accent, labelAreaSize, valueAreaSize);
    } else {
      this.drawHorizontal(data, maxVal, w, h, accent, labelAreaSize, valueAreaSize);
    }
  }

  private drawVertical(
    data: BarChartDatum[], maxVal: number,
    w: number, h: number, accent: number,
    labelArea: number, valueArea: number,
  ): void {
    const theme = this.theme;
    const p = this._props;
    const chartH = h - labelArea - valueArea;
    const gap = theme.spacing.xxs;
    const barWidth = Math.max(2, (w - gap * (data.length - 1)) / data.length);

    // Grid lines
    this._grid.setStrokeStyle({ width: 1, color: theme.semantic.borderDefault, alpha: 0.15 });
    for (let i = 0; i <= 4; i++) {
      const y = valueArea + chartH * (1 - i / 4);
      this._grid.moveTo(0, y);
      this._grid.lineTo(w, y);
    }
    this._grid.stroke();

    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const ratio = Math.min(1, d.value / maxVal);
      const barH = chartH * ratio;
      const x = i * (barWidth + gap);
      const y = valueArea + chartH - barH;
      const barColor = d.color ? theme.colorForAccent(d.color) : accent;

      this._bars.rect(x, y, barWidth, barH);
      this._bars.fill({ color: barColor, alpha: 0.85 });

      // Top highlight
      this._bars.rect(x, y, barWidth, 1);
      this._bars.fill({ color: barColor });

      if (p.showValues) {
        const vt = TextRenderer.create({
          text: String(d.value),
          role: 'mono',
          size: theme.fontSizes.xs,
          color: barColor,
        });
        vt.x = x + barWidth / 2 - vt.width / 2;
        vt.y = y - theme.fontSizes.xs - theme.spacing.xxs;
        this.addChild(vt);
        this._textNodes.push(vt);
      }

      if (p.showLabels) {
        const lt = TextRenderer.create({
          text: d.label,
          role: 'mono',
          size: theme.fontSizes.xs,
          color: theme.semantic.textSecondary,
          uppercase: false,
        });
        lt.x = x + barWidth / 2 - lt.width / 2;
        lt.y = valueArea + chartH + theme.spacing.xxs;
        this.addChild(lt);
        this._textNodes.push(lt);
      }
    }
  }

  private drawHorizontal(
    data: BarChartDatum[], maxVal: number,
    w: number, h: number, accent: number,
    labelArea: number, _valueArea: number,
  ): void {
    const theme = this.theme;
    const p = this._props;
    const labelCol = p.showLabels ? 60 : 0;
    const chartW = w - labelCol;
    const gap = theme.spacing.xxs;
    const barHeight = Math.max(2, (h - gap * (data.length - 1)) / data.length);

    // Grid lines
    this._grid.setStrokeStyle({ width: 1, color: theme.semantic.borderDefault, alpha: 0.15 });
    for (let i = 0; i <= 4; i++) {
      const x = labelCol + chartW * (i / 4);
      this._grid.moveTo(x, 0);
      this._grid.lineTo(x, h);
    }
    this._grid.stroke();

    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const ratio = Math.min(1, d.value / maxVal);
      const barW = chartW * ratio;
      const y = i * (barHeight + gap);
      const barColor = d.color ? theme.colorForAccent(d.color) : accent;

      this._bars.rect(labelCol, y, barW, barHeight);
      this._bars.fill({ color: barColor, alpha: 0.85 });

      if (p.showLabels) {
        const lt = TextRenderer.create({
          text: d.label,
          role: 'mono',
          size: theme.fontSizes.xs,
          color: theme.semantic.textSecondary,
          uppercase: false,
        });
        lt.x = labelCol - lt.width - theme.spacing.xs;
        lt.y = y + barHeight / 2 - lt.height / 2;
        this.addChild(lt);
        this._textNodes.push(lt);
      }

      if (p.showValues) {
        const vt = TextRenderer.create({
          text: String(d.value),
          role: 'mono',
          size: theme.fontSizes.xs,
          color: barColor,
        });
        vt.x = labelCol + barW + theme.spacing.xs;
        vt.y = y + barHeight / 2 - vt.height / 2;
        this.addChild(vt);
        this._textNodes.push(vt);
      }
    }
  }

  protected onDispose(): void {
    this._bars.destroy();
    this._grid.destroy();
    for (const t of this._textNodes) t.destroy();
  }
}
