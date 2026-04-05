import { BitmapText, Text, TextStyle } from 'pixi.js';
import { NervTheme } from './NervTheme';
import type { NervTextRole } from './types';

export interface NervTextOptions {
  text: string;
  role?: NervTextRole;
  size?: number;
  color?: number;
  alpha?: number;
  letterSpacing?: number;
  uppercase?: boolean;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
}

export class TextRenderer {
  private static _fontsLoaded = false;

  static async installFonts(): Promise<void> {
    if (this._fontsLoaded) return;
    this._fontsLoaded = true;
    const theme = NervTheme.instance;
    const families = [
      theme.fonts.display.family,
      theme.fonts.mono.family,
      theme.fonts.body.family,
    ];

    try {
      await Promise.all(
        families.map(family =>
          document.fonts.load(`12px "${family}"`).catch(() => {})
        )
      );
    } catch {}
  }

  private static resolveOptions(options: NervTextOptions) {
    const theme = NervTheme.instance;
    const role = options.role ?? 'mono';
    const fontFamily = theme.fontFamily(role);
    const fontSize = options.size ?? theme.fontSizes.md;
    const fill = options.color ?? theme.semantic.textPrimary;
    const uppercase = options.uppercase ?? (role === 'display' || role === 'mono');

    let letterSpacing = options.letterSpacing;
    if (letterSpacing === undefined) {
      switch (role) {
        case 'display': letterSpacing = theme.effects.letterSpacingWide * fontSize; break;
        case 'mono': letterSpacing = theme.effects.letterSpacingNormal * fontSize; break;
        default: letterSpacing = 0;
      }
    }

    const displayText = uppercase ? options.text.toUpperCase() : options.text;
    return { fontFamily, fontSize, fill, letterSpacing, displayText, uppercase, role };
  }

  /** Create a canvas-rasterized Text. Use for infrequently changing content. */
  static create(options: NervTextOptions): Text {
    const { fontFamily, fontSize, fill, letterSpacing, displayText } = this.resolveOptions(options);

    const text = new Text({
      text: displayText,
      style: new TextStyle({
        fontFamily, fontSize, fill, letterSpacing,
        align: options.align ?? 'left',
        wordWrap: options.maxWidth !== undefined,
        wordWrapWidth: options.maxWidth,
      }),
    });

    if (options.alpha !== undefined) text.alpha = options.alpha;
    return text;
  }

  /**
   * Update an existing Text object's content in-place.
   * Much cheaper than destroy + create (#2).
   */
  static updateText(textObj: Text, newText: string, uppercase = true): void {
    textObj.text = uppercase ? newText.toUpperCase() : newText;
  }

  /** Update an existing Text object's style (color, size, etc.) */
  static updateStyle(textObj: Text, updates: Partial<{ color: number; size: number; alpha: number }>): void {
    if (updates.color !== undefined) (textObj.style as TextStyle).fill = updates.color;
    if (updates.size !== undefined) (textObj.style as TextStyle).fontSize = updates.size;
    if (updates.alpha !== undefined) textObj.alpha = updates.alpha;
  }
}
