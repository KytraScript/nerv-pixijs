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
  /** Transition duration in ms when value changes (default 200, 0 to snap) */
  transitionMs?: number;
}

export class NervSyncProgressBar extends NervBase<NervSyncProgressBarProps> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _segmentsGfx = new Graphics();
  private _labelText!: Text;
  private _displayValue = 0;
  private _rafId = 0;

  protected defaultProps(): NervSyncProgressBarProps {
    return {
      value: 0,
      color: 'orange',
      segments: 20,
      showLabel: true,
      barWidth: 200,
      barHeight: 16,
      transitionMs: 200,
    };
  }

  protected onInit(): void {
    this._displayValue = this._props.value ?? 0;
    this._labelText = TextRenderer.create({
      text: '',
      role: 'mono',
      size: this.theme.fontSizes.xs,
      color: this.theme.semantic.textPrimary,
    });
    this._labelText.visible = false;
    this.addChild(this._bg, this._segmentsGfx, this._border, this._labelText);
  }

  protected onPropsChanged(prev: NervSyncProgressBarProps, next: NervSyncProgressBarProps): void {
    if (prev.value !== next.value) {
      const targetValue = Math.max(0, Math.min(1, next.value ?? 0));
      const duration = next.transitionMs ?? 200;
      if (duration <= 0) {
        this._displayValue = targetValue;
        return; // redraw will pick it up via scheduleRedraw from setProps
      }
      this._animateValue(targetValue, duration);
    }
  }

  private _animateValue(target: number, durationMs: number): void {
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = 0; }

    const start = this._displayValue;
    const distance = target - start;
    if (Math.abs(distance) < 0.001) { this._displayValue = target; return; }

    const startTime = performance.now();

    const frame = () => {
      const t = Math.min((performance.now() - startTime) / durationMs, 1);
      const eased = 1 - (1 - t) * (1 - t); // ease-out quad
      this._displayValue = start + distance * eased;
      this._drawBar();
      if (t < 1) {
        this._rafId = requestAnimationFrame(frame);
      } else {
        this._displayValue = target;
        this._drawBar();
        this._rafId = 0;
      }
    };
    this._rafId = requestAnimationFrame(frame);
  }

  getPreferredSize(): Size {
    const barW = this._props.barWidth ?? 200;
    const barH = this._props.barHeight ?? 16;
    const labelH = this._props.showLabel ? 16 : 0;
    return { width: barW, height: barH + labelH };
  }

  protected redraw(): void {
    this._drawBar();
  }

  private _drawBar(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const barW = p.barWidth ?? 200;
    const barH = p.barHeight ?? 16;
    const segmentCount = Math.max(1, p.segments ?? 20);
    const value = Math.max(0, Math.min(1, this._displayValue));
    const gap = 2;
    const segWidth = (barW - gap * (segmentCount - 1)) / segmentCount;
    const filledSegments = Math.round(value * segmentCount);

    this._bg.clear();
    this._bg.rect(0, 0, barW, barH);
    this._bg.fill({ color: theme.semantic.bgPanel });

    this._border.clear();
    this._border.setStrokeStyle({ width: theme.effects.borderWidth, color: accent, alpha: theme.effects.borderAlpha });
    this._border.rect(0, 0, barW, barH);
    this._border.stroke();

    this._segmentsGfx.clear();
    for (let i = 0; i < segmentCount; i++) {
      const x = i * (segWidth + gap);
      this._segmentsGfx.rect(x + 1, 1, segWidth - 1, barH - 2);
      if (i < filledSegments) {
        const segAlpha = i === filledSegments - 1 ? 0.85 : 1;
        this._segmentsGfx.fill({ color: accent, alpha: segAlpha });
      } else {
        this._segmentsGfx.fill({ color: theme.semantic.borderDefault, alpha: 0.15 });
      }
    }

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
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }
}
