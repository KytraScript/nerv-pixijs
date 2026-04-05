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
  private _tlText!: Text;
  private _trText!: Text;
  private _blText!: Text;
  private _brText!: Text;

  protected defaultProps(): MonitorOverlayProps {
    return {
      width: 800,
      height: 600,
      color: 'orange',
      framePadding: 8,
      frameCornerSize: 24,
      interactive: false,
    };
  }

  protected onInit(): void {
    this.addChild(this._frame);
    this.eventMode = 'none';

    const theme = this.theme;
    const textSize = theme.fontSizes.xs;
    const textColor = theme.semantic.textPrimary;
    const textAlpha = 0.7;

    // Create text objects once; toggle visibility in redraw
    this._tlText = TextRenderer.create({ text: '', role: 'mono', size: textSize, color: textColor, alpha: textAlpha });
    this._trText = TextRenderer.create({ text: '', role: 'mono', size: textSize, color: textColor, alpha: textAlpha });
    this._blText = TextRenderer.create({ text: '', role: 'mono', size: textSize, color: textColor, alpha: textAlpha });
    this._brText = TextRenderer.create({ text: '', role: 'mono', size: textSize, color: textColor, alpha: textAlpha });

    this._tlText.visible = false;
    this._trText.visible = false;
    this._blText.visible = false;
    this._brText.visible = false;

    this.addChild(this._tlText, this._trText, this._blText, this._brText);
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

    // Top-left text
    if (p.topLeft) {
      TextRenderer.updateText(this._tlText, p.topLeft, true);
      TextRenderer.updateStyle(this._tlText, { color: accent, alpha: 0.7 });
      this._tlText.x = pad + 4;
      this._tlText.y = pad + 4;
      this._tlText.visible = true;
    } else {
      this._tlText.visible = false;
    }

    // Top-right text
    if (p.topRight) {
      TextRenderer.updateText(this._trText, p.topRight, true);
      TextRenderer.updateStyle(this._trText, { color: accent, alpha: 0.7 });
      this._trText.x = w - pad - 4 - this._trText.width;
      this._trText.y = pad + 4;
      this._trText.visible = true;
    } else {
      this._trText.visible = false;
    }

    // Bottom-left text
    if (p.bottomLeft) {
      TextRenderer.updateText(this._blText, p.bottomLeft, true);
      TextRenderer.updateStyle(this._blText, { color: accent, alpha: 0.7 });
      this._blText.x = pad + 4;
      this._blText.y = h - pad - 4 - this._blText.height;
      this._blText.visible = true;
    } else {
      this._blText.visible = false;
    }

    // Bottom-right text
    if (p.bottomRight) {
      TextRenderer.updateText(this._brText, p.bottomRight, true);
      TextRenderer.updateStyle(this._brText, { color: accent, alpha: 0.7 });
      this._brText.x = w - pad - 4 - this._brText.width;
      this._brText.y = h - pad - 4 - this._brText.height;
      this._brText.visible = true;
    } else {
      this._brText.visible = false;
    }
  }

  protected onDispose(): void {
    // All children are auto-destroyed by NervBase.destroy({ children: true }).
  }
}
