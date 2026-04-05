import { Graphics, Rectangle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import type { NervColor, Size } from '../../core/types';

export interface NervSegmentDisplayProps extends NervBaseProps {
  value?: number | string;
  digits?: number;
  color?: NervColor;
  segmentSize?: number;
}

/**
 * Segment map for 7-segment display.
 * Segments labeled:
 *    _a_
 *  |f   |b
 *    _g_
 *  |e   |c
 *    _d_
 *
 * Each entry is a bitmask: a=1, b=2, c=4, d=8, e=16, f=32, g=64
 */
const SEGMENT_MAP: Record<string, number> = {
  '0': 0b0111111,  // a b c d e f
  '1': 0b0000110,  // b c
  '2': 0b1011011,  // a b d e g
  '3': 0b1001111,  // a b c d g
  '4': 0b1100110,  // b c f g
  '5': 0b1101101,  // a c d f g
  '6': 0b1111101,  // a c d e f g
  '7': 0b0000111,  // a b c
  '8': 0b1111111,  // all
  '9': 0b1101111,  // a b c d f g
  '-': 0b1000000,  // g
  ' ': 0b0000000,  // none
  '.': 0b10000000, // special: decimal point
};

export class NervSegmentDisplay extends NervBase<NervSegmentDisplayProps> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _segGraphics = new Graphics();

  protected defaultProps(): NervSegmentDisplayProps {
    return {
      value: 0,
      digits: 4,
      color: 'lcdGreen',
      segmentSize: 20,
    };
  }

  protected onInit(): void {
    this.addChild(this._bg, this._segGraphics, this._border);
  }

  getPreferredSize(): Size {
    const digits = this._props.digits ?? 4;
    const size = this._props.segmentSize ?? 20;
    const digitWidth = size * 0.8;
    const gap = size * 0.3;
    const padding = size * 0.4;
    return {
      width: digits * digitWidth + (digits - 1) * gap + padding * 2,
      height: size * 1.6 + padding * 2,
    };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'lcdGreen');
    const digits = p.digits ?? 4;
    const size = p.segmentSize ?? 20;
    const digitWidth = size * 0.8;
    const digitHeight = size * 1.6;
    const gap = size * 0.3;
    const padding = size * 0.4;
    const { width: w, height: h } = this.getPreferredSize();
    const segThick = Math.max(2, size * 0.15);

    // Format value to string
    const rawValue = String(p.value ?? 0);
    const chars = rawValue.padStart(digits, ' ').slice(-digits).split('');

    // Background
    this._bg.clear();
    this._bg.rect(0, 0, w, h);
    this._bg.fill({ color: theme.semantic.bgBase, alpha: 0.95 });

    // Border
    this._border.clear();
    this._border.setStrokeStyle({ width: theme.effects.borderWidth, color: accent, alpha: theme.effects.borderAlpha * 0.6 });
    this._border.rect(0, 0, w, h);
    this._border.stroke();

    // Draw segments
    this._segGraphics.clear();
    const halfH = digitHeight / 2;

    for (let d = 0; d < digits; d++) {
      const ch = chars[d];
      const mask = SEGMENT_MAP[ch] ?? 0;
      const dx = padding + d * (digitWidth + gap);
      const dy = padding;
      const segLen = digitWidth - segThick * 2;

      // Draw ghost segments (dim background)
      this.drawDigitSegments(dx, dy, segLen, halfH, segThick, 0b1111111, accent, 0.08);

      // Draw active segments
      if (mask & 0xFF) {
        this.drawDigitSegments(dx, dy, segLen, halfH, segThick, mask & 0x7F, accent, 1);
      }

      // Decimal point (special)
      if (mask & 0b10000000) {
        this._segGraphics.circle(dx + digitWidth + gap * 0.2, dy + digitHeight - segThick, segThick);
        this._segGraphics.fill({ color: accent });
      }
    }

    this.hitArea = new Rectangle(0, 0, w, h);
  }

  private drawDigitSegments(
    dx: number, dy: number,
    segLen: number, halfH: number,
    thick: number, mask: number,
    color: number, alpha: number
  ): void {
    const g = this._segGraphics;

    // a - top horizontal
    if (mask & 1) {
      g.rect(dx + thick, dy, segLen, thick);
      g.fill({ color, alpha });
    }
    // b - top-right vertical
    if (mask & 2) {
      g.rect(dx + thick + segLen, dy + thick, thick, halfH - thick * 1.5);
      g.fill({ color, alpha });
    }
    // c - bottom-right vertical
    if (mask & 4) {
      g.rect(dx + thick + segLen, dy + halfH + thick * 0.5, thick, halfH - thick * 1.5);
      g.fill({ color, alpha });
    }
    // d - bottom horizontal
    if (mask & 8) {
      g.rect(dx + thick, dy + halfH * 2 - thick, segLen, thick);
      g.fill({ color, alpha });
    }
    // e - bottom-left vertical
    if (mask & 16) {
      g.rect(dx, dy + halfH + thick * 0.5, thick, halfH - thick * 1.5);
      g.fill({ color, alpha });
    }
    // f - top-left vertical
    if (mask & 32) {
      g.rect(dx, dy + thick, thick, halfH - thick * 1.5);
      g.fill({ color, alpha });
    }
    // g - middle horizontal
    if (mask & 64) {
      g.rect(dx + thick, dy + halfH - thick * 0.5, segLen, thick);
      g.fill({ color, alpha });
    }
  }

  protected onDispose(): void {
    // All children are auto-destroyed by NervBase.destroy({ children: true }).
  }
}
