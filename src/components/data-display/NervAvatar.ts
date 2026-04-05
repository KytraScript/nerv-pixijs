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
  private _label!: Text;

  protected defaultProps(): NervAvatarProps {
    return {
      initials: '??',
      color: 'orange',
      size: 40,
    };
  }

  protected onInit(): void {
    const theme = this.theme;
    // Create label text once; update in redraw
    this._label = TextRenderer.create({
      text: '',
      role: 'display',
      size: theme.fontSizes.sm,
      color: theme.semantic.textPrimary,
    });

    this.addChild(this._bg, this._border, this._label);
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
    const initials = (p.initials ?? '??').slice(0, 2).toUpperCase();
    const fontSize = Math.max(8, Math.round(size * 0.35));
    TextRenderer.updateText(this._label, initials, false); // Already uppercased
    TextRenderer.updateStyle(this._label, { color: accent, size: fontSize });
    this._label.x = Math.round(cx - this._label.width / 2);
    this._label.y = Math.round(cy - this._label.height / 2);

    this.cursor = 'default';
    // Avatar is circular; use a custom contains for circular hit testing
    this.hitArea = {
      contains: (x: number, y: number) => {
        const dx = x - cx;
        const dy = y - cy;
        return dx * dx + dy * dy <= radius * radius;
      },
    };
  }

  protected onDispose(): void {
    // All children are auto-destroyed by NervBase.destroy({ children: true }).
  }
}
