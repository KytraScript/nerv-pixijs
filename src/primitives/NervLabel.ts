import { Text } from 'pixi.js';
import { NervBase } from '../core/NervBase';
import type { NervBaseProps } from '../core/NervBase';
import { TextRenderer } from '../core/TextRenderer';
import type { NervColor, NervTextRole, Size } from '../core/types';

export interface NervLabelProps extends NervBaseProps {
  text: string;
  role?: NervTextRole;
  size?: number;
  color?: NervColor;
  rawColor?: number;
  uppercase?: boolean;
  letterSpacing?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  prefix?: string;
}

export class NervLabel extends NervBase<NervLabelProps> {
  private _text: Text | null = null;

  protected defaultProps(): NervLabelProps {
    return { text: '' };
  }

  getPreferredSize(): Size {
    if (!this._text) return { width: 0, height: 0 };
    return { width: this._text.width, height: this._text.height };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const color = p.rawColor ?? (p.color ? theme.colorForAccent(p.color) : theme.semantic.textPrimary);
    const displayText = p.prefix ? `${p.prefix} ${p.text}` : p.text;

    if (this._text) {
      this._text.destroy();
      this.removeChild(this._text);
    }

    this._text = TextRenderer.create({
      text: displayText,
      role: p.role ?? 'mono',
      size: p.size ?? theme.fontSizes.md,
      color,
      uppercase: p.uppercase ?? (p.role === 'display' || p.role === 'mono' || p.role === undefined),
      letterSpacing: p.letterSpacing,
      maxWidth: p.maxWidth,
      align: p.align,
    });

    this.addChild(this._text);
  }

  protected onDispose(): void {
    this._text?.destroy();
  }
}
