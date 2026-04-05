import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import { AnimationManager } from '../../core/AnimationManager';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export type NervTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface NervTooltipProps extends NervBaseProps {
  text?: string;
  target?: NervBase;
  position?: NervTooltipPosition;
  color?: NervColor;
}

const PADDING_X = 8;
const PADDING_Y = 4;
const ARROW_SIZE = 5;
const OFFSET = 4;

export class NervTooltip extends NervBase<NervTooltipProps> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _arrow = new Graphics();
  private _label: Text | null = null;
  private _boundShow: () => void;
  private _boundHide: () => void;
  private _attached = false;

  protected defaultProps(): NervTooltipProps {
    return {
      text: 'Tooltip',
      position: 'top',
      color: 'white',
    };
  }

  constructor(props: NervTooltipProps) {
    super(props);
    this._boundShow = () => this.show();
    this._boundHide = () => this.hide();
  }

  protected onInit(): void {
    this.addChild(this._bg, this._border, this._arrow);
    this.visible = false;
    this.eventMode = 'none';

    // Attach to target if provided
    if (this._props.target) {
      this.attachTo(this._props.target);
    }
  }

  protected onPropsChanged(prev: NervTooltipProps, next: NervTooltipProps): void {
    if (prev.target !== next.target) {
      if (prev.target) this.detachFrom(prev.target);
      if (next.target) this.attachTo(next.target);
    }
  }

  /** Attach tooltip to a target component. */
  attachTo(target: NervBase): void {
    if (this._attached) this.detachFrom(this._props.target!);
    target.on('pointerover', this._boundShow);
    target.on('pointerout', this._boundHide);
    this._attached = true;
  }

  /** Detach tooltip from a target component. */
  detachFrom(target: NervBase): void {
    target.off('pointerover', this._boundShow);
    target.off('pointerout', this._boundHide);
    this._attached = false;
  }

  show(): void {
    this.updatePosition();
    this.visible = true;
    this.alpha = 0;
    AnimationManager.tween(this, { alpha: 1 } as never, 150);
  }

  hide(): void {
    AnimationManager.tween(this, { alpha: 0 } as never, 100, {
      onComplete: () => { this.visible = false; },
    });
  }

  private updatePosition(): void {
    const target = this._props.target;
    if (!target) return;

    const pos = this._props.position ?? 'top';
    const { width: tw, height: th } = target.getPreferredSize();
    const { width: w, height: h } = this.getPreferredSize();

    // Get target's global position and convert to our parent's local space
    const targetGlobal = target.getGlobalPosition();
    const parentLocal = this.parent
      ? this.parent.toLocal(targetGlobal)
      : targetGlobal;

    switch (pos) {
      case 'top':
        this.x = parentLocal.x + Math.round((tw - w) / 2);
        this.y = parentLocal.y - h - ARROW_SIZE - OFFSET;
        break;
      case 'bottom':
        this.x = parentLocal.x + Math.round((tw - w) / 2);
        this.y = parentLocal.y + th + ARROW_SIZE + OFFSET;
        break;
      case 'left':
        this.x = parentLocal.x - w - ARROW_SIZE - OFFSET;
        this.y = parentLocal.y + Math.round((th - h) / 2);
        break;
      case 'right':
        this.x = parentLocal.x + tw + ARROW_SIZE + OFFSET;
        this.y = parentLocal.y + Math.round((th - h) / 2);
        break;
    }
  }

  getPreferredSize(): Size {
    const text = this._props.text ?? 'Tooltip';
    const fontSize = this.theme.fontSizes.xs;
    const charWidth = fontSize * 0.65;
    return {
      width: Math.max(text.length * charWidth + PADDING_X * 2, 30),
      height: fontSize + PADDING_Y * 2,
    };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'white');
    const { width: w, height: h } = this.getPreferredSize();
    const pos = p.position ?? 'top';

    // Background
    this._bg.clear();
    this._bg.rect(0, 0, w, h);
    this._bg.fill({ color: theme.semantic.bgOverlay, alpha: 0.95 });

    // Border
    this._border.clear();
    this._border.setStrokeStyle({ width: 1, color: accent, alpha: 0.6 });
    this._border.rect(0, 0, w, h);
    this._border.stroke();

    // Arrow
    this._arrow.clear();
    this._arrow.setStrokeStyle({ width: 0 });
    switch (pos) {
      case 'top':
        this._arrow.moveTo(w / 2 - ARROW_SIZE, h);
        this._arrow.lineTo(w / 2, h + ARROW_SIZE);
        this._arrow.lineTo(w / 2 + ARROW_SIZE, h);
        this._arrow.closePath();
        this._arrow.fill({ color: theme.semantic.bgOverlay, alpha: 0.95 });
        break;
      case 'bottom':
        this._arrow.moveTo(w / 2 - ARROW_SIZE, 0);
        this._arrow.lineTo(w / 2, -ARROW_SIZE);
        this._arrow.lineTo(w / 2 + ARROW_SIZE, 0);
        this._arrow.closePath();
        this._arrow.fill({ color: theme.semantic.bgOverlay, alpha: 0.95 });
        break;
      case 'left':
        this._arrow.moveTo(w, h / 2 - ARROW_SIZE);
        this._arrow.lineTo(w + ARROW_SIZE, h / 2);
        this._arrow.lineTo(w, h / 2 + ARROW_SIZE);
        this._arrow.closePath();
        this._arrow.fill({ color: theme.semantic.bgOverlay, alpha: 0.95 });
        break;
      case 'right':
        this._arrow.moveTo(0, h / 2 - ARROW_SIZE);
        this._arrow.lineTo(-ARROW_SIZE, h / 2);
        this._arrow.lineTo(0, h / 2 + ARROW_SIZE);
        this._arrow.closePath();
        this._arrow.fill({ color: theme.semantic.bgOverlay, alpha: 0.95 });
        break;
    }

    // Label
    if (this._label) { this._label.destroy(); this.removeChild(this._label); }
    this._label = TextRenderer.create({
      text: p.text ?? 'Tooltip',
      role: 'mono',
      size: theme.fontSizes.xs,
      color: accent,
      uppercase: false,
    });
    this._label.x = Math.round((w - this._label.width) / 2);
    this._label.y = Math.round((h - this._label.height) / 2);
    this.addChild(this._label);
  }

  protected onDispose(): void {
    if (this._props.target && this._attached) {
      this.detachFrom(this._props.target);
    }
    this._bg.destroy();
    this._border.destroy();
    this._arrow.destroy();
    this._label?.destroy();
  }
}
