import { Graphics } from 'pixi.js';
import { NervBase } from '../core/NervBase';
import type { NervBaseProps } from '../core/NervBase';
import type { NervColor, Size } from '../core/types';

export interface NervLineProps extends NervBaseProps {
  length?: number;
  direction?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: NervColor;
  rawColor?: number;
  lineAlpha?: number;
  dashed?: boolean;
  dashLength?: number;
  gapLength?: number;
}

export class NervLine extends NervBase<NervLineProps> {
  private _gfx = new Graphics();

  protected defaultProps(): NervLineProps {
    return { length: 100, direction: 'horizontal', thickness: 1, interactive: false };
  }

  protected onInit(): void {
    this.addChild(this._gfx);
    this.eventMode = 'none';
  }

  getPreferredSize(): Size {
    const len = this._props.length ?? 100;
    const thick = this._props.thickness ?? 1;
    return this._props.direction === 'vertical'
      ? { width: thick, height: len }
      : { width: len, height: thick };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const len = p.length ?? 100;
    const thick = p.thickness ?? 1;
    const color = p.rawColor ?? (p.color ? theme.colorForAccent(p.color) : theme.semantic.borderDefault);
    const alpha = p.lineAlpha ?? theme.effects.borderAlpha;
    const isVert = p.direction === 'vertical';

    this._gfx.clear();

    if (p.dashed) {
      const dash = p.dashLength ?? 6;
      const gap = p.gapLength ?? 4;
      this._gfx.setStrokeStyle({ width: thick, color, alpha });
      let cursor = 0;
      while (cursor < len) {
        const end = Math.min(cursor + dash, len);
        if (isVert) {
          this._gfx.moveTo(0, cursor);
          this._gfx.lineTo(0, end);
        } else {
          this._gfx.moveTo(cursor, 0);
          this._gfx.lineTo(end, 0);
        }
        cursor = end + gap;
      }
      this._gfx.stroke();
    } else {
      this._gfx.setStrokeStyle({ width: thick, color, alpha });
      if (isVert) {
        this._gfx.moveTo(0, 0);
        this._gfx.lineTo(0, len);
      } else {
        this._gfx.moveTo(0, 0);
        this._gfx.lineTo(len, 0);
      }
      this._gfx.stroke();
    }
  }
}
