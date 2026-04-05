import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervAvatarProps extends NervBaseProps {
  initials?: string;
  color?: NervColor;
  size?: number;
}

export class NervAvatar extends NervBase<NervAvatarProps> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _label: Text | null = null;

  protected defaultProps(): NervAvatarProps {
    return {
      initials: '??',
      color: 'orange',
      size: 40,
    };
  }

  protected onInit(): void {
    this.addChild(this._bg, this._border);
  }

  getPreferredSize(): Size {
    const s = this._props.size ?? 40;
    return { width: s, height: s };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const size = p.size ?? 40;
    const radius = size / 2;
    const cx = radius;
    const cy = radius;
    const hovered = this._state.hovered && !p.disabled;

    // Background circle
    this._bg.clear();
    this._bg.circle(cx, cy, radius);
    this._bg.fill({ color: accent, alpha: hovered ? 0.35 : 0.2 });

    // Border circle
    this._border.clear();
    this._border.setStrokeStyle({ width: 1.5, color: accent, alpha: 0.8 });
    this._border.circle(cx, cy, radius);
    this._border.stroke();

    // Initials
    if (this._label) { this._label.destroy(); this.removeChild(this._label); }

    const initials = (p.initials ?? '??').slice(0, 2).toUpperCase();
    const fontSize = Math.max(8, Math.round(size * 0.35));
    this._label = TextRenderer.create({
      text: initials,
      role: 'display',
      size: fontSize,
      color: accent,
    });
    this._label.x = Math.round(cx - this._label.width / 2);
    this._label.y = Math.round(cy - this._label.height / 2);
    this.addChild(this._label);

    this.cursor = 'default';
    this.hitArea = {
      contains: (x: number, y: number) => {
        const dx = x - cx;
        const dy = y - cy;
        return dx * dx + dy * dy <= radius * radius;
      },
    };
  }

  protected onDispose(): void {
    this._bg.destroy();
    this._border.destroy();
    this._label?.destroy();
  }
}
