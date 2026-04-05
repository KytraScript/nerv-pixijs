import { Graphics, Ticker } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { Size } from '../../core/types';
import type { Text } from 'pixi.js';

export type AlertPattern = 'blue' | 'orange' | 'red';

export interface NervPatternAlertProps extends NervBaseProps {
  pattern?: AlertPattern;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface NervPatternAlertState extends NervBaseState {
  pulsePhase: number;
}

const SIZE_CONFIG = {
  sm: { shapeR: 8, fontSize: 8, gap: 8 },
  md: { shapeR: 12, fontSize: 10, gap: 10 },
  lg: { shapeR: 16, fontSize: 13, gap: 12 },
} as const;

export class NervPatternAlert extends NervBase<NervPatternAlertProps, NervPatternAlertState> {
  private _shape = new Graphics();
  private _pulseRing = new Graphics();
  private _label: Text | null = null;
  private _ticker: (() => void) | null = null;

  constructor(props: NervPatternAlertProps) {
    super(props, { focused: false, hovered: false, pressed: false, pulsePhase: 0 });
  }

  protected defaultProps(): NervPatternAlertProps {
    return {
      pattern: 'blue',
      label: '',
      size: 'md',
    };
  }

  private _getPatternColor(): number {
    const theme = this.theme;
    switch (this._props.pattern) {
      case 'blue': return theme.colors.cyan;
      case 'orange': return theme.colors.orange;
      case 'red': return theme.colors.red;
      default: return theme.colors.cyan;
    }
  }

  protected onInit(): void {
    this.addChild(this._pulseRing, this._shape);

    this._ticker = () => {
      const dt = Ticker.shared.deltaMS;
      const phase = (this._state.pulsePhase + dt * 0.003) % (Math.PI * 2);
      this._state = { ...this._state, pulsePhase: phase };

      // Update pulse ring alpha directly for smooth animation
      const pulseAlpha = 0.1 + Math.sin(phase) * 0.15;
      const pulseScale = 1.0 + Math.sin(phase) * 0.3;
      this._pulseRing.alpha = Math.max(0, pulseAlpha);
      this._pulseRing.scale.set(pulseScale);
    };
    Ticker.shared.add(this._ticker);
  }

  getPreferredSize(): Size {
    const cfg = SIZE_CONFIG[this._props.size ?? 'md'];
    const labelText = this._props.label ?? '';
    const charW = cfg.fontSize * 0.65;
    const textW = labelText.length > 0 ? labelText.length * charW + cfg.gap : 0;
    return {
      width: cfg.shapeR * 2 + textW + 8,
      height: Math.max(cfg.shapeR * 2 + 8, cfg.fontSize + 4),
    };
  }

  protected redraw(): void {
    const p = this._props;
    const cfg = SIZE_CONFIG[p.size ?? 'md'];
    const color = this._getPatternColor();
    const { height: h } = this.getPreferredSize();
    const cx = cfg.shapeR + 4;
    const cy = Math.round(h / 2);

    // Pulse ring (animated via ticker)
    this._pulseRing.clear();
    this._pulseRing.circle(cx, cy, cfg.shapeR + 4);
    this._pulseRing.fill({ color, alpha: 0.15 });
    this._pulseRing.pivot.set(cx, cy);
    this._pulseRing.position.set(cx, cy);

    // Main shape - use different shapes per pattern
    this._shape.clear();

    switch (p.pattern) {
      case 'red': {
        // Triangle for red/danger
        const r = cfg.shapeR;
        this._shape.moveTo(cx, cy - r);
        this._shape.lineTo(cx + r, cy + r * 0.7);
        this._shape.lineTo(cx - r, cy + r * 0.7);
        this._shape.closePath();
        this._shape.fill({ color, alpha: 0.9 });
        break;
      }
      case 'orange': {
        // Diamond for orange/warning
        const r = cfg.shapeR;
        this._shape.moveTo(cx, cy - r);
        this._shape.lineTo(cx + r, cy);
        this._shape.lineTo(cx, cy + r);
        this._shape.lineTo(cx - r, cy);
        this._shape.closePath();
        this._shape.fill({ color, alpha: 0.9 });
        break;
      }
      default: {
        // Circle for blue/info
        this._shape.circle(cx, cy, cfg.shapeR);
        this._shape.fill({ color, alpha: 0.9 });
        break;
      }
    }

    // Label
    if (this._label) { this._label.destroy(); this.removeChild(this._label); }
    const labelText = p.label ?? '';
    if (labelText.length > 0) {
      this._label = TextRenderer.create({
        text: labelText,
        role: 'mono',
        size: cfg.fontSize,
        color: this.theme.semantic.textPrimary,
      });
      this._label.x = cx + cfg.shapeR + cfg.gap;
      this._label.y = Math.round(cy - this._label.height / 2);
      this.addChild(this._label);
    }
  }

  protected onDispose(): void {
    if (this._ticker) Ticker.shared.remove(this._ticker);
    this._shape.destroy();
    this._pulseRing.destroy();
    this._label?.destroy();
  }
}
