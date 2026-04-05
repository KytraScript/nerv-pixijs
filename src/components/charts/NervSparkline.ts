import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import type { NervColor, Size } from '../../core/types';

export interface NervSparklineProps extends NervBaseProps {
  data?: number[];
  color?: NervColor;
  fill?: boolean;
}

export class NervSparkline extends NervBase<NervSparklineProps> {
  private _line = new Graphics();
  private _fill = new Graphics();

  protected defaultProps(): NervSparklineProps {
    return {
      data: [],
      width: 80,
      height: 24,
      color: 'green',
      fill: false,
    };
  }

  protected onInit(): void {
    this.addChild(this._fill, this._line);
  }

  getPreferredSize(): Size {
    return {
      width: this._props.width ?? 80,
      height: this._props.height ?? 24,
    };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const data = p.data ?? [];
    const w = this.componentWidth;
    const h = this.componentHeight;
    const accent = theme.colorForAccent(p.color ?? 'green');

    this._line.clear();
    this._fill.clear();

    if (data.length < 2) return;

    let min = Infinity;
    let max = -Infinity;
    for (const v of data) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (min === max) { min -= 1; max += 1; }
    const range = max - min;

    const toX = (i: number) => (i / (data.length - 1)) * w;
    const toY = (v: number) => h - ((v - min) / range) * h;

    // Stroke line
    this._line.setStrokeStyle({ width: 1.5, color: accent, alpha: 0.9 });
    this._line.moveTo(toX(0), toY(data[0]));
    for (let i = 1; i < data.length; i++) {
      this._line.lineTo(toX(i), toY(data[i]));
    }
    this._line.stroke();

    // Optional fill below line
    if (p.fill) {
      this._fill.moveTo(toX(0), toY(data[0]));
      for (let i = 1; i < data.length; i++) {
        this._fill.lineTo(toX(i), toY(data[i]));
      }
      // Close path down to bottom
      this._fill.lineTo(toX(data.length - 1), h);
      this._fill.lineTo(toX(0), h);
      this._fill.closePath();
      this._fill.fill({ color: accent, alpha: 0.15 });
    }
  }

  protected onDispose(): void {
    this._line.destroy();
    this._fill.destroy();
  }
}
