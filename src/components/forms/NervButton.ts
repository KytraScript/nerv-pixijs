import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import { AnimationManager } from '../../core/AnimationManager';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervButtonProps extends NervBaseProps {
  text: string;
  variant?: 'primary' | 'danger' | 'ghost' | 'terminal';
  size?: 'sm' | 'md' | 'lg';
  color?: NervColor;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
}

const SIZE_CONFIG = {
  sm: { paddingX: 10, paddingY: 4, fontSize: 10 },
  md: { paddingX: 16, paddingY: 8, fontSize: 12 },
  lg: { paddingX: 24, paddingY: 12, fontSize: 14 },
} as const;

export class NervButton extends NervBase<NervButtonProps> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _brackets = new Graphics();
  private _label: Text | null = null;

  protected defaultProps(): NervButtonProps {
    return { text: 'BUTTON', variant: 'primary', size: 'md', color: 'orange' };
  }

  protected onInit(): void {
    this.addChild(this._bg, this._border, this._brackets);

    this.on('pointerup', () => {
      if (!this.isDisabled && !this._props.loading) {
        AnimationManager.pulse(this, 1.03, 150);
        this._props.onClick?.();
      }
    });
  }

  getPreferredSize(): Size {
    const cfg = SIZE_CONFIG[this._props.size ?? 'md'];
    const text = this._props.text ?? '';
    const charWidth = cfg.fontSize * 0.65;
    return {
      width: this._props.fullWidth ? (this._props.width ?? 200) : Math.max(text.length * charWidth + cfg.paddingX * 2, 60),
      height: cfg.fontSize + cfg.paddingY * 2,
    };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const cfg = SIZE_CONFIG[p.size ?? 'md'];
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const { width: w, height: h } = this.getPreferredSize();
    const hovered = this._state.hovered && !p.disabled;
    const pressed = this._state.pressed && !p.disabled;
    const isGhost = p.variant === 'ghost';
    const isDanger = p.variant === 'danger';
    const isTerminal = p.variant === 'terminal';

    const borderColor = isDanger ? theme.colors.red : accent;
    const bgColor = hovered ? borderColor : (isGhost ? 0x000000 : theme.semantic.bgPanel);
    const bgAlpha = isGhost && !hovered ? 0 : (pressed ? 0.9 : hovered ? 0.85 : 1);
    const textColor = hovered ? theme.colors.black : (isTerminal ? theme.colors.lcdGreen : borderColor);

    // Background
    this._bg.clear();
    this._bg.rect(0, 0, w, h);
    this._bg.fill({ color: bgColor, alpha: bgAlpha });

    // Border
    this._border.clear();
    this._border.setStrokeStyle({ width: 1, color: borderColor, alpha: p.disabled ? 0.3 : 0.8 });
    this._border.rect(0, 0, w, h);
    this._border.stroke();

    // Corner brackets
    this._brackets.clear();
    const cs = 5;
    this._brackets.setStrokeStyle({ width: 1.5, color: borderColor, alpha: p.disabled ? 0.2 : 1 });
    this._brackets.moveTo(0, cs); this._brackets.lineTo(0, 0); this._brackets.lineTo(cs, 0);
    this._brackets.moveTo(w - cs, 0); this._brackets.lineTo(w, 0); this._brackets.lineTo(w, cs);
    this._brackets.moveTo(0, h - cs); this._brackets.lineTo(0, h); this._brackets.lineTo(cs, h);
    this._brackets.moveTo(w - cs, h); this._brackets.lineTo(w, h); this._brackets.lineTo(w, h - cs);
    this._brackets.stroke();

    // Label
    if (this._label) { this._label.destroy(); this.removeChild(this._label); }

    const displayText = p.loading ? '...' : (isTerminal ? `> ${p.text}` : `>> ${p.text}`);
    this._label = TextRenderer.create({
      text: displayText,
      role: isTerminal ? 'mono' : 'display',
      size: cfg.fontSize,
      color: textColor,
      alpha: p.disabled ? 0.4 : 1,
    });
    this._label.x = Math.round((w - this._label.width) / 2);
    this._label.y = Math.round((h - this._label.height) / 2);
    this.addChild(this._label);

    this.cursor = p.disabled ? 'default' : 'pointer';
    this.alpha = p.disabled ? 0.6 : 1;
    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= w && y >= 0 && y <= h };
  }

  protected onDispose(): void {
    this._bg.destroy();
    this._border.destroy();
    this._brackets.destroy();
    this._label?.destroy();
  }
}
