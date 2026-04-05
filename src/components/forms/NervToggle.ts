import { Graphics, Rectangle, Ticker } from 'pixi.js';
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
  onChange?: (on: boolean) => void;
}

export class NervToggle extends NervBase<NervToggleProps> {
  private _track = new Graphics();
  private _thumb = new Graphics();
  private _label: NervLabel | null = null;
  private _lastOnState: boolean | null = null;
  private _animTickerFn: ((ticker: { deltaMS: number }) => void) | null = null;

  protected defaultProps(): NervToggleProps {
    return { on: false, color: 'green', trackWidth: 40, trackHeight: 20 };
  }

  protected onInit(): void {
    // Create the label once; updated in-place via setProps in redraw()
    this._label = new NervLabel({ text: '', role: 'mono', size: this.theme.fontSizes.sm, rawColor: this.theme.semantic.textSecondary, interactive: false });
    this._label.visible = false;
    this.addChild(this._track, this._thumb, this._label);

    this.on('pointerdown', (e) => { e.stopPropagation(); });
    this.on('pointerup', (e) => {
      e.stopPropagation();
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
    this._thumb.clear();
    this._thumb.circle(0, th / 2, thumbR);
    this._thumb.fill({ color: isOn ? accent : theme.semantic.textMuted });

    if (this._lastOnState === null) {
      // First render -- snap to position
      this._thumb.position.x = thumbX;
      this._lastOnState = isOn;
    } else if (this._lastOnState !== isOn) {
      // State changed -- animate slide using direct Ticker
      this._lastOnState = isOn;
      this._animateThumbTo(thumbX, 150);
    }

    // Label -- update in-place
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

  private _animateThumbTo(targetX: number, durationMs: number): void {
    // Kill existing animation
    if (this._animTickerFn) {
      Ticker.shared.remove(this._animTickerFn);
      this._animTickerFn = null;
    }

    const startX = this._thumb.position.x;
    const delta = targetX - startX;
    let elapsed = 0;

    this._animTickerFn = (ticker) => {
      elapsed += ticker.deltaMS;
      const t = Math.min(elapsed / durationMs, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      this._thumb.position.x = startX + delta * eased;

      if (t >= 1) {
        this._thumb.position.x = targetX;
        if (this._animTickerFn) {
          Ticker.shared.remove(this._animTickerFn);
          this._animTickerFn = null;
        }
      }
    };

    Ticker.shared.add(this._animTickerFn);
  }

  protected onDispose(): void {
    if (this._animTickerFn) {
      Ticker.shared.remove(this._animTickerFn);
    }
  }
}
