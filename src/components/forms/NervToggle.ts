import { Container, Graphics, Rectangle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { NervLabel } from '../../primitives/NervLabel';
import type { NervColor, Size } from '../../core/types';

export interface NervToggleProps extends NervBaseProps {
  on?: boolean;
  text?: string;
  color?: NervColor;
  trackWidth?: number;
  trackHeight?: number;
  animationMs?: number;
  onChange?: (on: boolean) => void;
}

export class NervToggle extends NervBase<NervToggleProps> {
  private _track = new Graphics();
  private _thumbContainer = new Container();
  private _thumbGfx = new Graphics();
  private _label: NervLabel | null = null;
  private _locked = false;
  private _rafId = 0;
  private _firstDraw = true;

  protected defaultProps(): NervToggleProps {
    return { on: false, color: 'green', trackWidth: 40, trackHeight: 20, animationMs: 140 };
  }

  protected onInit(): void {
    this._thumbContainer.addChild(this._thumbGfx);
    this._label = new NervLabel({
      text: '', role: 'mono', size: this.theme.fontSizes.sm,
      rawColor: this.theme.semantic.textSecondary, interactive: false,
    });
    this._label.visible = false;
    this.addChild(this._track, this._thumbContainer, this._label);

    this._track.eventMode = 'none';
    this._thumbContainer.eventMode = 'none';

    this.on('pointerdown', (e) => e.stopPropagation());
    this.on('pointerup', (e) => {
      e.stopPropagation();
      if (this.isDisabled || this._locked) return;
      this._toggle();
    });
  }

  private _toggle(): void {
    const next = !this._props.on;
    const startX = this._thumbContainer.position.x;
    const endX = this._computeThumbX(next);
    const duration = this._props.animationMs ?? 140;

    // Lock immediately
    this._locked = true;

    // Update visual state (track + thumb color)
    this.setProps({ on: next });
    this._props.onChange?.(next);

    // Run animation completely outside PixiJS's systems
    const startTime = performance.now();

    const frame = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 1 ? 1 - (1 - t) * (1 - t) * (1 - t) : 1;

      this._thumbContainer.position.x = startX + (endX - startX) * eased;

      if (t < 1) {
        this._rafId = requestAnimationFrame(frame);
      } else {
        this._thumbContainer.position.x = endX;
        this._rafId = 0;
        this._locked = false;
      }
    };

    // Cancel any previous animation
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = requestAnimationFrame(frame);
  }

  private _computeThumbX(on: boolean): number {
    const tw = this._props.trackWidth ?? 40;
    const th = this._props.trackHeight ?? 20;
    const r = th / 2 - 3;
    return on ? tw - r - 4 : r + 4;
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

    // Track
    this._track.clear();
    this._track.roundRect(0, 0, tw, th, th / 2);
    this._track.fill({ color: isOn ? accent : theme.semantic.bgPanel, alpha: isOn ? 0.3 : 1 });
    this._track.roundRect(0, 0, tw, th, th / 2);
    this._track.stroke({ width: 1, color: isOn ? accent : theme.semantic.borderDefault, alpha: 0.7 });

    // Thumb COLOR only
    this._thumbGfx.clear();
    this._thumbGfx.circle(0, th / 2, thumbR);
    this._thumbGfx.fill({ color: isOn ? accent : theme.semantic.textMuted });

    // Snap position on first draw only
    if (this._firstDraw) {
      this._firstDraw = false;
      this._thumbContainer.position.x = this._computeThumbX(isOn);
    }

    // Label
    if (p.text) {
      this._label!.visible = true;
      this._label!.setProps({ text: p.text, size: theme.fontSizes.sm, rawColor: theme.semantic.textSecondary });
      this._label!.x = tw + 8;
      this._label!.y = Math.round((th - theme.fontSizes.sm) / 2);
    } else {
      this._label!.visible = false;
    }

    this.hitArea = new Rectangle(0, 0, this.getPreferredSize().width, th);
  }

  protected onDispose(): void {
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }
}
