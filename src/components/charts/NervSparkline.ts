import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import type { NervColor, Size } from '../../core/types';

export interface NervSparklineProps extends NervBaseProps {
  data?: number[];
  color?: NervColor;
  fill?: boolean;
  /** Enable live animation via requestAnimationFrame */
  animate?: boolean;
  /** Wave type for live mode */
  waveform?: 'sine' | 'noise' | 'pulse';
  /** Speed multiplier (default 1) */
  speed?: number;
  /** Data point count in live mode (default 40) */
  points?: number;
  /** Wave amplitude 0-50 (default 40) */
  amplitude?: number;
}

export class NervSparkline extends NervBase<NervSparklineProps> {
  private _line = new Graphics();
  private _fillGfx = new Graphics();
  private _rafId = 0;
  private _phase = 0;

  protected defaultProps(): NervSparklineProps {
    return {
      data: [],
      width: 80,
      height: 24,
      color: 'green',
      fill: false,
      interactive: false,
      animate: false,
      waveform: 'sine',
      speed: 1,
      points: 40,
      amplitude: 40,
    };
  }

  protected onInit(): void {
    this.addChild(this._fillGfx, this._line);
    if (this._props.animate) this._startAnimation();
  }

  private _startAnimation(): void {
    if (this._rafId) return;
    const frame = () => {
      this._phase += 0.025 * (this._props.speed ?? 1);
      const data = this._generateWave();
      this._drawData(data);
      this._rafId = requestAnimationFrame(frame);
    };
    this._rafId = requestAnimationFrame(frame);
  }

  private _stopAnimation(): void {
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = 0; }
  }

  private _generateWave(): number[] {
    const pts = this._props.points ?? 40;
    const amp = this._props.amplitude ?? 40;
    const wf = this._props.waveform ?? 'sine';
    const data: number[] = [];
    for (let i = 0; i < pts; i++) {
      const t = i / pts;
      let v = 50;
      switch (wf) {
        case 'sine':
          v = 50 + amp * Math.sin(this._phase + t * Math.PI * 4)
            * (0.6 + 0.4 * Math.sin(this._phase * 0.7 + t * Math.PI * 2));
          break;
        case 'noise':
          v = 50
            + amp * 0.5 * Math.sin(this._phase * 1.3 + t * Math.PI * 6)
            + amp * 0.3 * Math.sin(this._phase * 2.1 + t * Math.PI * 10)
            + amp * 0.2 * Math.cos(this._phase * 3.7 + t * Math.PI * 14);
          break;
        case 'pulse':
          const p = Math.sin(this._phase + t * Math.PI * 3);
          v = 50 + amp * (p > 0.6 ? 1 : p < -0.6 ? -0.8 : p * 0.4)
            + amp * 0.15 * Math.sin(this._phase * 3 + t * Math.PI * 12);
          break;
      }
      data.push(v);
    }
    return data;
  }

  getPreferredSize(): Size {
    return { width: this._props.width ?? 80, height: this._props.height ?? 24 };
  }

  protected redraw(): void {
    if (!this._props.animate) {
      this._drawData(this._props.data ?? []);
    }
  }

  private _drawData(data: number[]): void {
    const theme = this.theme;
    const w = this.componentWidth;
    const h = this.componentHeight;
    const accent = theme.colorForAccent(this._props.color ?? 'green');

    this._line.clear();
    this._fillGfx.clear();
    if (data.length < 2) return;

    let min = Infinity, max = -Infinity;
    for (const v of data) { if (v < min) min = v; if (v > max) max = v; }
    if (max - min < 1) { min -= 1; max += 1; }
    const range = max - min;
    const toX = (i: number) => (i / (data.length - 1)) * w;
    const toY = (v: number) => h - ((v - min) / range) * h;

    this._line.setStrokeStyle({ width: 1.5, color: accent, alpha: 0.9 });
    this._line.moveTo(toX(0), toY(data[0]));
    for (let i = 1; i < data.length; i++) this._line.lineTo(toX(i), toY(data[i]));
    this._line.stroke();

    if (this._props.fill) {
      this._fillGfx.moveTo(toX(0), toY(data[0]));
      for (let i = 1; i < data.length; i++) this._fillGfx.lineTo(toX(i), toY(data[i]));
      this._fillGfx.lineTo(toX(data.length - 1), h);
      this._fillGfx.lineTo(toX(0), h);
      this._fillGfx.closePath();
      this._fillGfx.fill({ color: accent, alpha: 0.15 });
    }
  }

  protected onDispose(): void {
    this._stopAnimation();
  }
}
