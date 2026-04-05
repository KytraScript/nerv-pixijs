import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import { NervLine } from '../../primitives/NervLine';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervDividerProps extends NervBaseProps {
  direction?: 'horizontal' | 'vertical';
  length?: number;
  color?: NervColor;
  thickness?: number;
  spacing?: number;
  label?: string;
  labelColor?: number;
  dashed?: boolean;
}

export class NervDivider extends NervBase<NervDividerProps> {
  private _lineLeft: NervLine | null = null;
  private _lineRight: NervLine | null = null;
  private _lineFull: NervLine | null = null;
  private _labelText: Text | null = null;

  protected defaultProps(): NervDividerProps {
    return {
      direction: 'horizontal',
      length: 200,
      thickness: 1,
      spacing: 12,
      dashed: false,
      interactive: false,
    };
  }

  protected onInit(): void {
    this.eventMode = 'none';
  }

  getPreferredSize(): Size {
    const p = this._props;
    const len = p.length ?? 200;
    const spacing = p.spacing ?? 12;
    const thick = p.thickness ?? 1;
    const isVert = p.direction === 'vertical';

    if (isVert) {
      return { width: thick + spacing * 2, height: len };
    }
    return { width: len, height: thick + spacing * 2 };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const len = p.length ?? 200;
    const spacing = p.spacing ?? 12;
    const isVert = p.direction === 'vertical';

    // Clean up previous line children (they are NervBase, will be recreated)
    this._cleanup();

    const lineColor = p.color;
    const lineProps = {
      direction: p.direction ?? 'horizontal' as const,
      thickness: p.thickness ?? 1,
      color: lineColor,
      dashed: p.dashed,
    };

    if (p.label && !isVert) {
      // Draw label centered with lines on each side
      if (!this._labelText) {
        this._labelText = TextRenderer.create({
          text: p.label,
          role: 'mono',
          size: theme.fontSizes.xs,
          color: p.labelColor ?? theme.semantic.textMuted,
          uppercase: true,
        });
        this.addChild(this._labelText);
      } else {
        TextRenderer.updateText(this._labelText, p.label, true);
        TextRenderer.updateStyle(this._labelText, { color: p.labelColor ?? theme.semantic.textMuted });
      }
      this._labelText.visible = true;

      const labelW = this._labelText.width;
      const labelGap = theme.spacing.sm;
      const leftLen = Math.max((len - labelW - labelGap * 2) / 2, 10);
      const rightLen = Math.max(len - leftLen - labelW - labelGap * 2, 10);

      this._lineLeft = new NervLine({ ...lineProps, length: leftLen });
      this._lineLeft.x = 0;
      this._lineLeft.y = spacing + Math.round(this._labelText.height / 2);
      this.addChild(this._lineLeft);

      this._labelText.x = leftLen + labelGap;
      this._labelText.y = spacing;

      this._lineRight = new NervLine({ ...lineProps, length: rightLen });
      this._lineRight.x = leftLen + labelGap + labelW + labelGap;
      this._lineRight.y = spacing + Math.round(this._labelText.height / 2);
      this.addChild(this._lineRight);
    } else {
      if (this._labelText) this._labelText.visible = false;

      // Simple single line
      this._lineFull = new NervLine({ ...lineProps, length: len });
      if (isVert) {
        this._lineFull.x = spacing;
        this._lineFull.y = 0;
      } else {
        this._lineFull.x = 0;
        this._lineFull.y = spacing;
      }
      this.addChild(this._lineFull);
    }
  }

  private _cleanup(): void {
    // Remove and destroy line children (NervLine instances that get recreated each redraw)
    if (this._lineLeft) { this.removeChild(this._lineLeft); this._lineLeft.destroy({ children: true }); this._lineLeft = null; }
    if (this._lineRight) { this.removeChild(this._lineRight); this._lineRight.destroy({ children: true }); this._lineRight = null; }
    if (this._lineFull) { this.removeChild(this._lineFull); this._lineFull.destroy({ children: true }); this._lineFull = null; }
  }

  protected onDispose(): void {
    // All children (lines, label text) are auto-destroyed
    // by NervBase.destroy({ children: true }).
  }
}
