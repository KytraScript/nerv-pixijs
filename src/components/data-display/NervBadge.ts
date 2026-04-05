import { Graphics, Rectangle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervBadgeProps extends NervBaseProps {
  text?: string;
  color?: NervColor;
  variant?: 'filled' | 'outline';
}

const PADDING_X = 8;
const PADDING_Y = 3;
const BORDER_RADIUS = 3;

export class NervBadge extends NervBase<NervBadgeProps> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _label!: Text;

  protected defaultProps(): NervBadgeProps {
    return {
      text: 'BADGE',
      color: 'orange',
      variant: 'filled',
    };
  }

  protected onInit(): void {
    const theme = this.theme;
    // Create label text once; update in redraw
    this._label = TextRenderer.create({
      text: '',
      role: 'mono',
      size: theme.fontSizes.xs,
      color: theme.semantic.textPrimary,
    });

    this.addChild(this._bg, this._border, this._label);
  }

  getPreferredSize(): Size {
    const text = this._props.text ?? 'BADGE';
    const fontSize = this.theme.fontSizes.xs;
    const charWidth = fontSize * 0.65;
    return {
      width: Math.max(text.length * charWidth + PADDING_X * 2, 24),
      height: fontSize + PADDING_Y * 2,
    };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const isFilled = (p.variant ?? 'filled') === 'filled';
    const { width: w, height: h } = this.getPreferredSize();

    // Background
    this._bg.clear();
    this._bg.roundRect(0, 0, w, h, BORDER_RADIUS);
    if (isFilled) {
      this._bg.fill({ color: accent, alpha: 0.9 });
    } else {
      this._bg.fill({ color: theme.semantic.bgPanel, alpha: 0.6 });
    }

    // Border
    this._border.clear();
    this._border.setStrokeStyle({ width: 1, color: accent, alpha: 0.8 });
    this._border.roundRect(0, 0, w, h, BORDER_RADIUS);
    this._border.stroke();

    // Label
    const textColor = isFilled ? theme.colors.black : accent;
    TextRenderer.updateText(this._label, p.text ?? 'BADGE', true);
    TextRenderer.updateStyle(this._label, { color: textColor });
    this._label.x = Math.round((w - this._label.width) / 2);
    this._label.y = Math.round((h - this._label.height) / 2);

    this.cursor = 'default';
    this.hitArea = new Rectangle(0, 0, w, h);
  }

  protected onDispose(): void {
    // All children are auto-destroyed by NervBase.destroy({ children: true }).
  }
}
