import { Text, TextStyle } from 'pixi.js';
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
  private _text!: Text;

  protected defaultProps(): NervLabelProps {
    return { text: '' };
  }

  protected onInit(): void {
    // Create the Text object once; redraw will update it in-place
    this._text = TextRenderer.create({
      text: '',
      role: this._props.role ?? 'mono',
      size: this._props.size ?? this.theme.fontSizes.md,
      color: this.theme.semantic.textPrimary,
    });
    this.addChild(this._text);
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
    const uppercase = p.uppercase ?? (p.role === 'display' || p.role === 'mono' || p.role === undefined);

    // Update text content in-place instead of destroy + recreate
    TextRenderer.updateText(this._text, displayText, uppercase);

    // Update style properties
    const style = this._text.style as TextStyle;
    style.fill = color;
    style.fontSize = p.size ?? theme.fontSizes.md;
    style.fontFamily = theme.fontFamily(p.role ?? 'mono');
    if (p.letterSpacing !== undefined) style.letterSpacing = p.letterSpacing;
    if (p.maxWidth !== undefined) {
      style.wordWrap = true;
      style.wordWrapWidth = p.maxWidth;
    } else {
      style.wordWrap = false;
    }
    if (p.align) style.align = p.align;
  }
}
