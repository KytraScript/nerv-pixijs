import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import { AnimationManager, Easing } from '../../core/AnimationManager';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervGaugeProps extends NervBaseProps {
  value?: number;
  min?: number;
  max?: number;
  label?: string;
  color?: NervColor;
  size?: number;
}

interface NervGaugeState extends NervBaseState {
  displayValue: number;
}

export class NervGauge extends NervBase<NervGaugeProps, NervGaugeState> {
  private _track = new Graphics();
  private _arc = new Graphics();
  private _needle = new Graphics();
  private _center = new Graphics();
  private _labelText: Text | null = null;
  private _valueText: Text | null = null;
  private _animTarget = { value: 0 };

  protected defaultProps(): NervGaugeProps {
    return {
      value: 0,
      min: 0,
      max: 1,
      label: '',
      color: 'orange',
      size: 120,
    };
  }

  constructor(props: NervGaugeProps) {
    super(props, {
      focused: false,
      hovered: false,
      pressed: false,
      displayValue: props.value ?? 0,
    } as NervGaugeState);
  }

  protected onInit(): void {
    this._animTarget.value = this._props.value ?? 0;
    this.addChild(this._track, this._arc, this._needle, this._center);
  }

  protected onPropsChanged(prev: NervGaugeProps, next: NervGaugeProps): void {
    if (prev.value !== next.value) {
      const target = next.value ?? 0;
      AnimationManager.tween(
        this._animTarget,
        { value: target },
        400,
        {
          easing: Easing.easeOutCubic,
          onUpdate: () => {
            this.setState({ displayValue: this._animTarget.value } as Partial<NervGaugeState>);
          },
        },
      );
    }
  }

  getPreferredSize(): Size {
    const s = this._props.size ?? 120;
    return { width: s, height: s };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const s = p.size ?? 120;
    const r = s / 2 - 4;
    const cx = s / 2;
    const cy = s / 2;
    const min = p.min ?? 0;
    const max = p.max ?? 1;
    const value = this._state.displayValue;
    const accent = theme.colorForAccent(p.color ?? 'orange');

    const ratio = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;

    // Gauge arc spans from 225deg (bottom-left) to -45deg (bottom-right), i.e. 270deg sweep
    const startAngle = Math.PI * 0.75;  // 135deg = bottom-left
    const endAngle = Math.PI * 2.25;    // 405deg = bottom-right (wrap)
    const sweepAngle = endAngle - startAngle; // 270deg

    // Track (background arc)
    this._track.clear();
    this._track.setStrokeStyle({ width: 6, color: theme.semantic.borderDefault, alpha: 0.3 });
    this._track.arc(cx, cy, r, startAngle, endAngle);
    this._track.stroke();

    // Filled arc
    this._arc.clear();
    if (ratio > 0) {
      const fillEnd = startAngle + sweepAngle * ratio;
      this._arc.setStrokeStyle({ width: 6, color: accent, alpha: 0.9 });
      this._arc.arc(cx, cy, r, startAngle, fillEnd);
      this._arc.stroke();
    }

    // Needle
    this._needle.clear();
    const needleAngle = startAngle + sweepAngle * ratio;
    const needleLen = r - 12;
    const nx = cx + Math.cos(needleAngle) * needleLen;
    const ny = cy + Math.sin(needleAngle) * needleLen;
    this._needle.setStrokeStyle({ width: 2, color: accent });
    this._needle.moveTo(cx, cy);
    this._needle.lineTo(nx, ny);
    this._needle.stroke();

    // Center dot
    this._center.clear();
    this._center.circle(cx, cy, 3);
    this._center.fill({ color: accent });

    // Value text
    if (this._valueText) { this.removeChild(this._valueText); this._valueText.destroy(); this._valueText = null; }
    const displayVal = Number(value.toFixed(2));
    this._valueText = TextRenderer.create({
      text: String(displayVal),
      role: 'mono',
      size: theme.fontSizes.lg,
      color: accent,
    });
    this._valueText.x = cx - this._valueText.width / 2;
    this._valueText.y = cy + 12;
    this.addChild(this._valueText);

    // Label text
    if (this._labelText) { this.removeChild(this._labelText); this._labelText.destroy(); this._labelText = null; }
    if (p.label) {
      this._labelText = TextRenderer.create({
        text: p.label,
        role: 'mono',
        size: theme.fontSizes.xs,
        color: theme.semantic.textSecondary,
      });
      this._labelText.x = cx - this._labelText.width / 2;
      this._labelText.y = cy + 28;
      this.addChild(this._labelText);
    }
  }

  protected onDispose(): void {
    AnimationManager.kill(this._animTarget);
    this._track.destroy();
    this._arc.destroy();
    this._needle.destroy();
    this._center.destroy();
    this._valueText?.destroy();
    this._labelText?.destroy();
  }
}
