import { Graphics, Container } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervTerminalDisplayProps extends NervBaseProps {
  lines?: string[];
  maxLines?: number;
  autoScroll?: boolean;
  color?: NervColor;
  showLineNumbers?: boolean;
  fontSize?: number;
}

export class NervTerminalDisplay extends NervBase<NervTerminalDisplayProps> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _lineContainer = new Container();
  private _mask = new Graphics();
  private _lineTexts: Text[] = [];
  private _scrollOffset = 0;

  protected defaultProps(): NervTerminalDisplayProps {
    return {
      lines: [],
      maxLines: 100,
      autoScroll: true,
      color: 'green',
      showLineNumbers: false,
      fontSize: 10,
    };
  }

  protected onInit(): void {
    this.addChild(this._bg, this._border, this._lineContainer);
    this._lineContainer.mask = this._mask;
    this.addChild(this._mask);

    this.on('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const lineHeight = (this._props.fontSize ?? 10) + 4;
      const visibleLines = Math.floor(this.componentHeight / lineHeight) - 1;
      const totalLines = (this._props.lines ?? []).length;
      const maxScroll = Math.max(0, totalLines - visibleLines);
      this._scrollOffset = Math.max(0, Math.min(maxScroll, this._scrollOffset + Math.sign(e.deltaY)));
      this.scheduleRedraw();
    });
  }

  getPreferredSize(): Size {
    return {
      width: this._props.width ?? 400,
      height: this._props.height ?? 200,
    };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'green');
    const w = this.componentWidth;
    const h = this.componentHeight;
    const pad = theme.spacing.sm;
    const fontSize = p.fontSize ?? 10;
    const lineHeight = fontSize + 4;
    const lines = p.lines ?? [];
    const maxLines = p.maxLines ?? 100;
    const showNums = p.showLineNumbers ?? false;

    // Trim to maxLines (keep most recent)
    const displayLines = lines.length > maxLines ? lines.slice(lines.length - maxLines) : lines;

    // Background
    this._bg.clear();
    this._bg.rect(0, 0, w, h);
    this._bg.fill({ color: theme.semantic.bgBase, alpha: 0.9 });

    // Border
    this._border.clear();
    this._border.setStrokeStyle({ width: theme.effects.borderWidth, color: accent, alpha: theme.effects.borderAlpha });
    this._border.rect(0, 0, w, h);
    this._border.stroke();

    // Mask
    this._mask.clear();
    this._mask.rect(pad, pad, w - pad * 2, h - pad * 2);
    this._mask.fill({ color: 0xFFFFFF });

    // Clear old text objects
    for (const t of this._lineTexts) {
      t.destroy();
    }
    this._lineTexts.length = 0;
    this._lineContainer.removeChildren();

    // Auto-scroll
    const visibleCount = Math.floor((h - pad * 2) / lineHeight);
    if (p.autoScroll) {
      this._scrollOffset = Math.max(0, displayLines.length - visibleCount);
    }

    // Render visible lines
    const startLine = this._scrollOffset;
    const endLine = Math.min(displayLines.length, startLine + visibleCount + 1);
    const gutterWidth = showNums ? String(displayLines.length).length * (fontSize * 0.65) + pad : 0;

    for (let i = startLine; i < endLine; i++) {
      const lineText = displayLines[i];
      const yPos = pad + (i - startLine) * lineHeight;

      if (showNums) {
        const numStr = String(i + 1).padStart(String(displayLines.length).length, ' ');
        const numText = TextRenderer.create({
          text: numStr,
          role: 'mono',
          size: fontSize,
          color: theme.semantic.textMuted,
          uppercase: false,
        });
        numText.x = pad;
        numText.y = yPos;
        this._lineContainer.addChild(numText);
        this._lineTexts.push(numText);
      }

      const text = TextRenderer.create({
        text: lineText,
        role: 'mono',
        size: fontSize,
        color: accent,
        uppercase: false,
      });
      text.x = pad + gutterWidth;
      text.y = yPos;
      this._lineContainer.addChild(text);
      this._lineTexts.push(text);
    }

    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= w && y >= 0 && y <= h };
  }

  /** Append a line and trigger redraw. */
  appendLine(line: string): void {
    const current = [...(this._props.lines ?? []), line];
    this.setProps({ lines: current });
  }

  /** Clear all lines. */
  clear(): void {
    this._scrollOffset = 0;
    this.setProps({ lines: [] });
  }

  protected onDispose(): void {
    for (const t of this._lineTexts) t.destroy();
    this._lineTexts.length = 0;
    this._bg.destroy();
    this._border.destroy();
    this._mask.destroy();
    this._lineContainer.destroy({ children: true });
  }
}
