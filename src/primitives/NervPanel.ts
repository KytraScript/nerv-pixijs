import { Graphics, Rectangle } from 'pixi.js';
import { NervBase } from '../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../core/NervBase';
import type { NervColor, Size } from '../core/types';

export interface NervPanelProps extends NervBaseProps {
  color?: NervColor;
  fill?: number;
  fillAlpha?: number;
  borderAlpha?: number;
  showCornerBrackets?: boolean;
  cornerSize?: number;
  glowAlpha?: number;
}

export class NervPanel extends NervBase<NervPanelProps> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _brackets = new Graphics();

  protected defaultProps(): NervPanelProps {
    return {
      width: 200,
      height: 100,
      color: 'orange',
      fillAlpha: 1,
      borderAlpha: undefined,
      showCornerBrackets: true,
      cornerSize: 12,
      glowAlpha: 0,
    };
  }

  protected onInit(): void {
    this.addChild(this._bg, this._border, this._brackets);
  }

  getPreferredSize(): Size {
    return { width: this._props.width ?? 200, height: this._props.height ?? 100 };
  }

  protected redraw(): void {
    const w = this.componentWidth;
    const h = this.componentHeight;
    const theme = this.theme;
    const accent = theme.colorForAccent(this._props.color ?? 'orange');
    const fill = this._props.fill ?? theme.semantic.bgPanel;
    const fillAlpha = this._props.fillAlpha ?? 1;
    const borderAlpha = this._props.borderAlpha ?? theme.effects.borderAlpha;
    const cornerSize = this._props.cornerSize ?? 12;

    // Background
    this._bg.clear();
    this._bg.rect(0, 0, w, h);
    this._bg.fill({ color: fill, alpha: fillAlpha });

    // Border
    this._border.clear();
    this._border.setStrokeStyle({ width: theme.effects.borderWidth, color: accent, alpha: borderAlpha });
    this._border.rect(0, 0, w, h);
    this._border.stroke();

    // Corner brackets
    this._brackets.clear();
    if (this._props.showCornerBrackets !== false) {
      const bw = 1.5;
      this._brackets.setStrokeStyle({ width: bw, color: accent, alpha: 1 });

      // Top-left
      this._brackets.moveTo(0, cornerSize);
      this._brackets.lineTo(0, 0);
      this._brackets.lineTo(cornerSize, 0);

      // Top-right
      this._brackets.moveTo(w - cornerSize, 0);
      this._brackets.lineTo(w, 0);
      this._brackets.lineTo(w, cornerSize);

      // Bottom-left
      this._brackets.moveTo(0, h - cornerSize);
      this._brackets.lineTo(0, h);
      this._brackets.lineTo(cornerSize, h);

      // Bottom-right
      this._brackets.moveTo(w - cornerSize, h);
      this._brackets.lineTo(w, h);
      this._brackets.lineTo(w, h - cornerSize);

      this._brackets.stroke();
    }

    this.hitArea = new Rectangle(0, 0, w, h);
  }
}
