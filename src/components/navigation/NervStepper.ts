import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervStepperProps extends NervBaseProps {
  steps?: string[];
  currentStep?: number;
  color?: NervColor;
}

export class NervStepper extends NervBase<NervStepperProps> {
  private _lines = new Graphics();
  private _dots: Graphics[] = [];
  private _labels: Text[] = [];

  protected defaultProps(): NervStepperProps {
    return {
      steps: [],
      currentStep: 0,
      color: 'orange',
    };
  }

  protected onInit(): void {
    this.addChild(this._lines);
  }

  getPreferredSize(): Size {
    const steps = this._props.steps ?? [];
    const count = Math.max(steps.length, 1);
    return {
      width: this._props.width ?? count * 120,
      height: 48,
    };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const steps = p.steps ?? [];
    const current = p.currentStep ?? 0;
    const { width: w, height: h } = this.getPreferredSize();

    // Cleanup
    for (const d of this._dots) { d.destroy(); this.removeChild(d); }
    for (const l of this._labels) { l.destroy(); this.removeChild(l); }
    this._dots = [];
    this._labels = [];

    if (steps.length === 0) {
      this._lines.clear();
      return;
    }

    const dotR = 6;
    const dotY = 14;
    const stepSpacing = steps.length > 1 ? (w - 40) / (steps.length - 1) : 0;
    const startX = 20;

    // Connecting lines
    this._lines.clear();
    for (let i = 0; i < steps.length - 1; i++) {
      const x1 = startX + i * stepSpacing;
      const x2 = startX + (i + 1) * stepSpacing;
      const completed = i < current;
      this._lines.setStrokeStyle({ width: 2, color: completed ? accent : theme.semantic.borderDefault, alpha: completed ? 0.8 : 0.3 });
      this._lines.moveTo(x1 + dotR + 2, dotY);
      this._lines.lineTo(x2 - dotR - 2, dotY);
      this._lines.stroke();
    }

    // Dots and labels
    for (let i = 0; i < steps.length; i++) {
      const cx = startX + i * stepSpacing;
      const completed = i < current;
      const active = i === current;

      const dot = new Graphics();

      if (completed) {
        // Filled dot
        dot.circle(cx, dotY, dotR);
        dot.fill({ color: accent, alpha: 1 });
      } else if (active) {
        // Outlined dot with inner fill
        dot.circle(cx, dotY, dotR);
        dot.fill({ color: accent, alpha: 0.3 });
        dot.setStrokeStyle({ width: 2, color: accent, alpha: 1 });
        dot.circle(cx, dotY, dotR);
        dot.stroke();
      } else {
        // Empty dot
        dot.setStrokeStyle({ width: 1, color: theme.semantic.borderDefault, alpha: 0.5 });
        dot.circle(cx, dotY, dotR);
        dot.stroke();
      }

      this.addChild(dot);
      this._dots.push(dot);

      // Step label below dot
      const label = TextRenderer.create({
        text: steps[i],
        role: 'mono',
        size: theme.fontSizes.xs,
        color: active ? accent : (completed ? theme.semantic.textPrimary : theme.semantic.textMuted),
      });
      label.x = Math.round(cx - label.width / 2);
      label.y = dotY + dotR + 6;
      this.addChild(label);
      this._labels.push(label);
    }

    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= w && y >= 0 && y <= h };
  }

  protected onDispose(): void {
    this._lines.destroy();
    for (const d of this._dots) d.destroy();
    for (const l of this._labels) l.destroy();
  }
}
