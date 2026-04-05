import { Graphics, Rectangle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervSyncProgressBarProps extends NervBaseProps {
  value?: number;
  color?: NervColor;
  segments?: number;
  showLabel?: boolean;
  label?: string;
  barWidth?: number;
  barHeight?: number;
}

export class NervSyncProgressBar extends NervBase<NervSyncProgressBarProps> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _segments = new Graphics();
  private _labelText!: Text;

  protected defaultProps(): NervSyncProgressBarProps {
    return {
      value: 0,
      color: 'orange',
      segments: 20,
      showLabel: true,
      barWidth: 200,
      barHeight: 16,
    };
  }

  protected onInit(): void {
    const theme = this.theme;
    // Create label text once; toggle visibility in redraw
    this._labelText = TextRenderer.create({
      text: '',
      role: 'mono',
      size: theme.fontSizes.xs,
      color: theme.semantic.textPrimary,
    });
    this._labelText.visible = false;

    this.addChild(this._bg, this._segments, this._border, this._labelText);
  }

  getPreferredSize(): Size {
    const barW = this._props.barWidth ?? 200;
    const barH = this._props.barHeight ?? 16;
    const labelH = this._props.showLabel ? 16 : 0;
    return { width: barW, height: barH + labelH };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const barW = p.barWidth ?? 200;
    const barH = p.barHeight ?? 16;
    const segmentCount = Math.max(1, p.segments ?? 20);
    const value = Math.max(0, Math.min(1, p.value ?? 0));
    const gap = 2;
    const segWidth = (barW - gap * (segmentCount - 1)) / segmentCount;
    const filledSegments = Math.round(value * segmentCount);

    // Background
    this._bg.clear();
    this._bg.rect(0, 0, barW, barH);
    this._bg.fill({ color: theme.semantic.bgPanel });

    // Border
    this._border.clear();
    this._border.setStrokeStyle({ width: theme.effects.borderWidth, color: accent, alpha: theme.effects.borderAlpha });
    this._border.rect(0, 0, barW, barH);
    this._border.stroke();

    // Segments
    this._segments.clear();
    for (let i = 0; i < segmentCount; i++) {
      const x = i * (segWidth + gap);
      const filled = i < filledSegments;

      this._segments.rect(x + 1, 1, segWidth - 1, barH - 2);
      if (filled) {
        // Trailing segment gets a slightly dimmer alpha for a sweep effect
        const segAlpha = i === filledSegments - 1 ? 0.85 : 1;
        this._segments.fill({ color: accent, alpha: segAlpha });
      } else {
        this._segments.fill({ color: theme.semantic.borderDefault, alpha: 0.15 });
      }
    }

    // Label
    if (p.showLabel) {
      const percent = Math.round(value * 100);
      const labelStr = p.label ? `${p.label} ${percent}%` : `${percent}%`;
      TextRenderer.updateText(this._labelText, labelStr, true);
      TextRenderer.updateStyle(this._labelText, { color: accent });
      this._labelText.x = Math.round((barW - this._labelText.width) / 2);
      this._labelText.y = barH + 2;
      this._labelText.visible = true;
    } else {
      this._labelText.visible = false;
    }

    this.hitArea = new Rectangle(0, 0, barW, barH);
  }

  protected onDispose(): void {
    // All children are auto-destroyed by NervBase.destroy({ children: true }).
  }
}
