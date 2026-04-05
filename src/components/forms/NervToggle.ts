import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { NervLabel } from '../../primitives/NervLabel';
import { AnimationManager, Easing } from '../../core/AnimationManager';
import type { NervColor, Size } from '../../core/types';

export interface NervToggleProps extends NervBaseProps {
  on?: boolean;
  text?: string;
  color?: NervColor;
  trackWidth?: number;
  trackHeight?: number;
  onChange?: (on: boolean) => void;
}

export class NervToggle extends NervBase<NervToggleProps> {
  private _track = new Graphics();
  private _thumb = new Graphics();
  private _label: NervLabel | null = null;

  protected defaultProps(): NervToggleProps {
    return { on: false, color: 'green', trackWidth: 40, trackHeight: 20 };
  }

  protected onInit(): void {
    this.addChild(this._track, this._thumb);

    this.on('pointerup', () => {
      if (this.isDisabled) return;
      const next = !this._props.on;
      this.setProps({ on: next });
      this._props.onChange?.(next);
    });
  }

  getPreferredSize(): Size {
    const tw = this._props.trackWidth ?? 40;
    const th = this._props.trackHeight ?? 20;
    const textW = this._props.text ? this._props.text.length * 8 + 8 : 0;
    return { width: tw + textW, height: th };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const tw = p.trackWidth ?? 40;
    const th = p.trackHeight ?? 20;
    const accent = theme.colorForAccent(p.color ?? 'green');
    const isOn = p.on ?? false;
    const thumbR = th / 2 - 3;
    const thumbX = isOn ? tw - thumbR - 4 : thumbR + 4;

    // Track
    this._track.clear();
    this._track.roundRect(0, 0, tw, th, th / 2);
    this._track.fill({ color: isOn ? accent : theme.semantic.bgPanel, alpha: isOn ? 0.3 : 1 });
    this._track.roundRect(0, 0, tw, th, th / 2);
    this._track.stroke({ width: 1, color: isOn ? accent : theme.semantic.borderDefault, alpha: 0.7 });

    // Thumb
    AnimationManager.tween(this._thumb, { x: thumbX }, 120, { easing: Easing.easeOutCubic });
    this._thumb.clear();
    this._thumb.circle(0, th / 2, thumbR);
    this._thumb.fill({ color: isOn ? accent : theme.semantic.textMuted });
    if (!this._thumb.x) this._thumb.x = thumbX;

    // Label
    if (this._label) { this._label.destroy({ children: true }); this.removeChild(this._label); this._label = null; }
    if (p.text) {
      this._label = new NervLabel({ text: p.text, role: 'mono', size: theme.fontSizes.sm, rawColor: theme.semantic.textSecondary });
      this._label.x = tw + 8;
      this._label.y = Math.round((th - theme.fontSizes.sm) / 2);
      this.addChild(this._label);
    }

    const { width: w, height: h } = this.getPreferredSize();
    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= w && y >= 0 && y <= h };
  }

  protected onDispose(): void {
    this._track.destroy();
    this._thumb.destroy();
    this._label?.destroy({ children: true });
  }
}
