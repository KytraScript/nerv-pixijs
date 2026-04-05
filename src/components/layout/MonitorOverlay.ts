import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface MonitorOverlayProps extends NervBaseProps {
  topLeft?: string;
  topRight?: string;
  bottomLeft?: string;
  bottomRight?: string;
  color?: NervColor;
  framePadding?: number;
  frameCornerSize?: number;
}

export class MonitorOverlay extends NervBase<MonitorOverlayProps> {
  private _frame = new Graphics();
  private _tlText: Text | null = null;
  private _trText: Text | null = null;
  private _blText: Text | null = null;
  private _brText: Text | null = null;

  protected defaultProps(): MonitorOverlayProps {
    return {
      width: 800,
      height: 600,
      color: 'orange',
      framePadding: 8,
      frameCornerSize: 24,
    };
  }

  protected onInit(): void {
    this.addChild(this._frame);
    this.eventMode = 'none';
  }

  getPreferredSize(): Size {
    return {
      width: this._props.width ?? 800,
      height: this._props.height ?? 600,
    };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const w = this.componentWidth;
    const h = this.componentHeight;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const pad = p.framePadding ?? 8;
    const cs = p.frameCornerSize ?? 24;

    // Clear old texts
    this._clearTexts();

    // Draw frame
    this._frame.clear();

    // Outer border lines (partial, not full rect -- monitor feel)
    this._frame.setStrokeStyle({ width: 1, color: accent, alpha: 0.3 });
    this._frame.rect(0, 0, w, h);
    this._frame.stroke();

    // Corner brackets (larger, more prominent)
    this._frame.setStrokeStyle({ width: 2, color: accent, alpha: 0.9 });

    // Top-left
    this._frame.moveTo(0, cs);
    this._frame.lineTo(0, 0);
    this._frame.lineTo(cs, 0);

    // Top-right
    this._frame.moveTo(w - cs, 0);
    this._frame.lineTo(w, 0);
    this._frame.lineTo(w, cs);

    // Bottom-left
    this._frame.moveTo(0, h - cs);
    this._frame.lineTo(0, h);
    this._frame.lineTo(cs, h);

    // Bottom-right
    this._frame.moveTo(w - cs, h);
    this._frame.lineTo(w, h);
    this._frame.lineTo(w, h - cs);

    this._frame.stroke();

    // Cross-hair tick marks at edge midpoints
    const tickLen = 8;
    this._frame.setStrokeStyle({ width: 1, color: accent, alpha: 0.5 });
    // Top center
    this._frame.moveTo(w / 2 - tickLen, 0);
    this._frame.lineTo(w / 2 + tickLen, 0);
    // Bottom center
    this._frame.moveTo(w / 2 - tickLen, h);
    this._frame.lineTo(w / 2 + tickLen, h);
    // Left center
    this._frame.moveTo(0, h / 2 - tickLen);
    this._frame.lineTo(0, h / 2 + tickLen);
    // Right center
    this._frame.moveTo(w, h / 2 - tickLen);
    this._frame.lineTo(w, h / 2 + tickLen);

    this._frame.stroke();

    const textSize = theme.fontSizes.xs;
    const textColor = accent;
    const textAlpha = 0.7;

    // Top-left text
    if (p.topLeft) {
      this._tlText = TextRenderer.create({
        text: p.topLeft,
        role: 'mono',
        size: textSize,
        color: textColor,
        alpha: textAlpha,
      });
      this._tlText.x = pad + 4;
      this._tlText.y = pad + 4;
      this.addChild(this._tlText);
    }

    // Top-right text
    if (p.topRight) {
      this._trText = TextRenderer.create({
        text: p.topRight,
        role: 'mono',
        size: textSize,
        color: textColor,
        alpha: textAlpha,
      });
      this._trText.x = w - pad - 4 - this._trText.width;
      this._trText.y = pad + 4;
      this.addChild(this._trText);
    }

    // Bottom-left text
    if (p.bottomLeft) {
      this._blText = TextRenderer.create({
        text: p.bottomLeft,
        role: 'mono',
        size: textSize,
        color: textColor,
        alpha: textAlpha,
      });
      this._blText.x = pad + 4;
      this._blText.y = h - pad - 4 - this._blText.height;
      this.addChild(this._blText);
    }

    // Bottom-right text
    if (p.bottomRight) {
      this._brText = TextRenderer.create({
        text: p.bottomRight,
        role: 'mono',
        size: textSize,
        color: textColor,
        alpha: textAlpha,
      });
      this._brText.x = w - pad - 4 - this._brText.width;
      this._brText.y = h - pad - 4 - this._brText.height;
      this.addChild(this._brText);
    }
  }

  private _clearTexts(): void {
    if (this._tlText) { this.removeChild(this._tlText); this._tlText.destroy(); this._tlText = null; }
    if (this._trText) { this.removeChild(this._trText); this._trText.destroy(); this._trText = null; }
    if (this._blText) { this.removeChild(this._blText); this._blText.destroy(); this._blText = null; }
    if (this._brText) { this.removeChild(this._brText); this._brText.destroy(); this._brText = null; }
  }

  protected onDispose(): void {
    this._clearTexts();
    this._frame.destroy();
  }
}
