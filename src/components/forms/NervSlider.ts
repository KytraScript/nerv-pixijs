import { Graphics, FederatedPointerEvent, Rectangle, TextStyle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervSliderProps extends NervBaseProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  color?: NervColor;
  trackWidth?: number;
  showValue?: boolean;
  showTicks?: boolean;
  tickCount?: number;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
}

export class NervSlider extends NervBase<NervSliderProps> {
  private _track = new Graphics();
  private _fill = new Graphics();
  private _thumb = new Graphics();
  private _ticks = new Graphics();
  private _valueLabel: Text | null = null;
  private _dragging = false;

  protected defaultProps(): NervSliderProps {
    return { value: 0, min: 0, max: 100, step: 1, color: 'green', trackWidth: 200, showValue: true, showTicks: false, tickCount: 10 };
  }

  protected onInit(): void {
    // Create value label once; updated in-place in redraw()
    this._valueLabel = TextRenderer.create({ text: '', role: 'mono', size: this.theme.fontSizes.sm, color: 0xffffff });
    this._valueLabel.visible = false;
    this.addChild(this._track, this._fill, this._ticks, this._thumb, this._valueLabel);

    const onDrag = (e: FederatedPointerEvent) => {
      if (!this._dragging) return;
      const local = this.toLocal(e.global);
      this.setValueFromX(local.x);
    };

    this._thumb.on('pointerdown', () => { this._dragging = true; });
    this._track.on('pointerdown', (e: FederatedPointerEvent) => {
      this._dragging = true;
      const local = this.toLocal(e.global);
      this.setValueFromX(local.x);
    });

    this.on('globalpointermove', onDrag);
    this.on('pointerup', () => { if (this._dragging) { this._dragging = false; this._props.onChangeEnd?.(this._props.value ?? 0); } });
    this.on('pointerupoutside', () => { if (this._dragging) { this._dragging = false; this._props.onChangeEnd?.(this._props.value ?? 0); } });
  }

  private setValueFromX(x: number): void {
    const p = this._props;
    const tw = p.trackWidth ?? 200;
    const min = p.min ?? 0;
    const max = p.max ?? 100;
    const step = p.step ?? 1;
    const ratio = Math.max(0, Math.min(1, x / tw));
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    const clamped = Math.max(min, Math.min(max, stepped));

    if (clamped !== p.value) {
      this.setProps({ value: clamped });
      p.onChange?.(clamped);
    }
  }

  getPreferredSize(): Size {
    return { width: this._props.trackWidth ?? 200, height: this._props.showValue ? 36 : 20 };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const tw = p.trackWidth ?? 200;
    const min = p.min ?? 0;
    const max = p.max ?? 100;
    const value = p.value ?? 0;
    const accent = theme.colorForAccent(p.color ?? 'green');
    const ratio = max > min ? (value - min) / (max - min) : 0;
    const trackY = p.showValue ? 18 : 4;
    const trackH = 4;

    // Track
    this._track.clear();
    this._track.eventMode = 'static';
    this._track.cursor = 'pointer';
    this._track.rect(0, trackY, tw, trackH);
    this._track.fill({ color: theme.semantic.borderDefault, alpha: 0.4 });
    this._track.hitArea = new Rectangle(-4, trackY - 8, tw + 8, trackH + 16);

    // Fill
    this._fill.clear();
    this._fill.rect(0, trackY, tw * ratio, trackH);
    this._fill.fill({ color: accent });

    // Ticks
    this._ticks.clear();
    if (p.showTicks) {
      const count = p.tickCount ?? 10;
      this._ticks.setStrokeStyle({ width: 1, color: theme.semantic.borderDefault, alpha: 0.3 });
      for (let i = 0; i <= count; i++) {
        const x = (i / count) * tw;
        this._ticks.moveTo(x, trackY + trackH + 2);
        this._ticks.lineTo(x, trackY + trackH + 6);
      }
      this._ticks.stroke();
    }

    // Thumb
    const thumbX = tw * ratio;
    const thumbR = 6;
    this._thumb.clear();
    this._thumb.eventMode = 'static';
    this._thumb.cursor = 'grab';
    this._thumb.x = 0;
    this._thumb.y = 0;

    // Diamond shape
    this._thumb.moveTo(thumbX, trackY - thumbR);
    this._thumb.lineTo(thumbX + thumbR, trackY + trackH / 2);
    this._thumb.lineTo(thumbX, trackY + trackH + thumbR);
    this._thumb.lineTo(thumbX - thumbR, trackY + trackH / 2);
    this._thumb.closePath();
    this._thumb.fill({ color: accent });
    this._thumb.hitArea = new Rectangle(thumbX - 12, trackY - 16, 24, 32);

    // Value label -- update in-place
    if (p.showValue) {
      this._valueLabel!.visible = true;
      this._valueLabel!.text = String(value).toUpperCase();
      (this._valueLabel!.style as TextStyle).fill = accent;
      (this._valueLabel!.style as TextStyle).fontSize = theme.fontSizes.sm;
      this._valueLabel!.x = Math.max(0, Math.min(tw - this._valueLabel!.width, thumbX - this._valueLabel!.width / 2));
      this._valueLabel!.y = 0;
    } else {
      this._valueLabel!.visible = false;
    }

    this.hitArea = new Rectangle(-8, 0, tw + 16, p.showValue ? 36 : 20);
  }

  protected onDispose(): void {
    // NervBase.destroy() passes { children: true }, so child Graphics/Text
    // are auto-destroyed. Nothing extra to clean up here.
  }
}
