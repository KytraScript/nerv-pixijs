import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { Size } from '../../core/types';
import type { Text } from 'pixi.js';

export type StatusType = 'online' | 'offline' | 'warning' | 'error';

export interface NervStatusIndicatorProps extends NervBaseProps {
  status?: StatusType;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CONFIG = {
  sm: { dotR: 4, fontSize: 8, gap: 6 },
  md: { dotR: 5, fontSize: 10, gap: 8 },
  lg: { dotR: 7, fontSize: 12, gap: 10 },
} as const;

export class NervStatusIndicator extends NervBase<NervStatusIndicatorProps> {
  private _dot = new Graphics();
  private _label: Text | null = null;

  protected defaultProps(): NervStatusIndicatorProps {
    return {
      status: 'online',
      text: '',
      size: 'md',
    };
  }

  protected onInit(): void {
    this.addChild(this._dot);
  }

  private _getStatusColor(): number {
    const theme = this.theme;
    switch (this._props.status) {
      case 'online': return theme.colors.green;
      case 'offline': return theme.semantic.textMuted;
      case 'warning': return theme.colors.amber;
      case 'error': return theme.colors.red;
      default: return theme.colors.green;
    }
  }

  getPreferredSize(): Size {
    const cfg = SIZE_CONFIG[this._props.size ?? 'md'];
    const text = this._props.text ?? '';
    const charW = cfg.fontSize * 0.65;
    const textW = text.length > 0 ? text.length * charW + cfg.gap : 0;
    return {
      width: cfg.dotR * 2 + textW,
      height: Math.max(cfg.dotR * 2, cfg.fontSize + 2),
    };
  }

  protected redraw(): void {
    const p = this._props;
    const cfg = SIZE_CONFIG[p.size ?? 'md'];
    const color = this._getStatusColor();
    const { width: w, height: h } = this.getPreferredSize();
    const cy = Math.round(h / 2);

    // Status dot
    this._dot.clear();

    // Outer glow ring for active states
    if (p.status === 'online' || p.status === 'error') {
      this._dot.circle(cfg.dotR, cy, cfg.dotR + 2);
      this._dot.fill({ color, alpha: 0.15 });
    }

    // Main dot
    this._dot.circle(cfg.dotR, cy, cfg.dotR);
    this._dot.fill({ color, alpha: p.status === 'offline' ? 0.4 : 1 });

    // Label text
    if (this._label) { this._label.destroy(); this.removeChild(this._label); }
    if (p.text && p.text.length > 0) {
      this._label = TextRenderer.create({
        text: p.text,
        role: 'mono',
        size: cfg.fontSize,
        color: this.theme.semantic.textPrimary,
      });
      this._label.x = cfg.dotR * 2 + cfg.gap;
      this._label.y = Math.round(cy - this._label.height / 2);
      this.addChild(this._label);
    }

    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= w && y >= 0 && y <= h };
  }

  protected onDispose(): void {
    this._dot.destroy();
    this._label?.destroy();
  }
}
