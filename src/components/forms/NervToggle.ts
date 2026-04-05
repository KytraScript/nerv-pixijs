import { Container, Graphics, Rectangle, Ticker } from 'pixi.js';
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
  // The thumb is a Container holding a Graphics circle.
  // redraw() updates the circle's color but never touches the Container's position.
  // The position is animated separately via Ticker.
  private _thumbContainer = new Container();
  private _thumbGfx = new Graphics();
  private _label: NervLabel | null = null;
  private _lastOnState: boolean | null = null;
  private _animating = false;
  private _animTicker: ((t: { deltaMS: number }) => void) | null = null;

  protected defaultProps(): NervToggleProps {
    return { on: false, color: 'green', trackWidth: 40, trackHeight: 20, animationMs: 140 };
  }

  protected onInit(): void {
    this._thumbContainer.addChild(this._thumbGfx);
    this._label = new NervLabel({ text: '', role: 'mono', size: this.theme.fontSizes.sm, rawColor: this.theme.semantic.textSecondary, interactive: false });
    this._label.visible = false;
    this.addChild(this._track, this._thumbContainer, this._label);

    this.on('pointerdown', (e) => { e.stopPropagation(); });
    this.on('pointerup', (e) => {
      e.stopPropagation();
      if (this.isDisabled || this._animating) return;
      const next = !this._props.on;
      this.setProps({ on: next });
      this._props.onChange?.(next);
    });
    // Prevent child events from bubbling and re-triggering
    this._track.eventMode = 'none';
    this._thumbContainer.eventMode = 'none';
  }

  getPreferredSize(): Size {
    const tw = this._props.trackWidth ?? 40;
    const th = this._props.trackHeight ?? 20;
    const textW = this._props.text ? this._props.text.length * 8 + 8 : 0;
    return { width: tw + textW, height: th };
  }

  private _getThumbX(on: boolean): number {
    const tw = this._props.trackWidth ?? 40;
    const th = this._props.trackHeight ?? 20;
    const thumbR = th / 2 - 3;
    return on ? tw - thumbR - 4 : thumbR + 4;
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const tw = p.trackWidth ?? 40;
    const th = p.trackHeight ?? 20;
    const accent = theme.colorForAccent(p.color ?? 'green');
    const isOn = p.on ?? false;
    const thumbR = th / 2 - 3;

    // Track -- redrawn every time (color changes with state)
    this._track.clear();
    this._track.roundRect(0, 0, tw, th, th / 2);
    this._track.fill({ color: isOn ? accent : theme.semantic.bgPanel, alpha: isOn ? 0.3 : 1 });
    this._track.roundRect(0, 0, tw, th, th / 2);
    this._track.stroke({ width: 1, color: isOn ? accent : theme.semantic.borderDefault, alpha: 0.7 });

    // Thumb circle -- redraw the shape (color changes), but DO NOT touch position
    this._thumbGfx.clear();
    this._thumbGfx.circle(0, th / 2, thumbR);
    this._thumbGfx.fill({ color: isOn ? accent : theme.semantic.textMuted });

    // Position -- only change on actual toggle, not hover redraws
    const targetX = this._getThumbX(isOn);
    if (this._lastOnState === null) {
      // First render: snap
      this._thumbContainer.position.x = targetX;
      this._lastOnState = isOn;
    } else if (this._lastOnState !== isOn) {
      // State toggled: animate the Container (not the Graphics)
      this._lastOnState = isOn;
      this._slideThumbTo(targetX, p.animationMs ?? 140);
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

    const { width: w, height: h } = this.getPreferredSize();
    this.hitArea = new Rectangle(0, 0, w, h);
  }

  private _slideThumbTo(targetX: number, durationMs: number): void {
    if (this._animTicker) {
      Ticker.shared.remove(this._animTicker);
      this._animTicker = null;
    }

    const startX = this._thumbContainer.position.x;
    const distance = targetX - startX;
    if (Math.abs(distance) < 0.5) {
      this._thumbContainer.position.x = targetX;
      return;
    }

    this._animating = true;
    let elapsed = 0;

    const tickFn = (ticker: { deltaMS: number }) => {
      elapsed += ticker.deltaMS;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      this._thumbContainer.position.x = startX + distance * eased;

      if (t >= 1) {
        this._thumbContainer.position.x = targetX;
        Ticker.shared.remove(tickFn);
        this._animTicker = null;
        this._animating = false;
      }
    };

    this._animTicker = tickFn;
    Ticker.shared.add(tickFn);
  }

  protected onDispose(): void {
    if (this._animTicker) {
      Ticker.shared.remove(this._animTicker);
    }
  }
}
