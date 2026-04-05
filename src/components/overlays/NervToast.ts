import { Graphics, Rectangle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import { AnimationManager, Easing } from '../../core/AnimationManager';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface NervToastProps extends NervBaseProps {
  message?: string;
  color?: NervColor;
  duration?: number;
  position?: ToastPosition;
  onDismiss?: () => void;
}

export class NervToast extends NervBase<NervToastProps> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _accentBar = new Graphics();
  private _messageText!: Text;
  private _dismissTimer: ReturnType<typeof setTimeout> | null = null;

  protected defaultProps(): NervToastProps {
    return {
      message: '',
      color: 'orange',
      duration: 3000,
      position: 'top-right',
    };
  }

  protected onInit(): void {
    this.addChild(this._bg, this._border, this._accentBar);
    this.visible = false;

    // Create persistent Text object
    this._messageText = TextRenderer.create({
      text: '',
      role: 'mono',
      size: this.theme.fontSizes.sm,
      color: this.theme.semantic.textPrimary,
    });
    this.addChild(this._messageText);
  }

  getPreferredSize(): Size {
    const charWidth = this.theme.fontSizes.sm * 0.6;
    const msg = this._props.message ?? '';
    const textW = Math.min(msg.length * charWidth, 300);
    return {
      width: Math.max(textW + 40, 180),
      height: 40,
    };
  }

  show(): void {
    this.visible = true;
    const pos = this._props.position ?? 'top-right';
    const slideFrom = pos.includes('right') ? 'right' : 'left';
    AnimationManager.slideIn(this, slideFrom, 60, 250);

    if (this._dismissTimer) clearTimeout(this._dismissTimer);

    const duration = this._props.duration ?? 3000;
    if (duration > 0) {
      this._dismissTimer = setTimeout(() => this.dismiss(), duration);
    }
  }

  dismiss(): void {
    if (this._dismissTimer) {
      clearTimeout(this._dismissTimer);
      this._dismissTimer = null;
    }
    AnimationManager.tween(this, { alpha: 0 } as never, 200, {
      easing: Easing.easeInQuad,
      onComplete: () => {
        this.visible = false;
        this._props.onDismiss?.();
      },
    });
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const { width: w, height: h } = this.getPreferredSize();

    // Background
    this._bg.clear();
    this._bg.rect(0, 0, w, h);
    this._bg.fill({ color: theme.semantic.bgPanel, alpha: 0.92 });

    // Border
    this._border.clear();
    this._border.setStrokeStyle({ width: 1, color: accent, alpha: 0.6 });
    this._border.rect(0, 0, w, h);
    this._border.stroke();

    // Accent bar on the left
    this._accentBar.clear();
    this._accentBar.rect(0, 0, 3, h);
    this._accentBar.fill({ color: accent, alpha: 1 });

    // Message text -- update in place
    TextRenderer.updateText(this._messageText, p.message ?? '', false);
    TextRenderer.updateStyle(this._messageText, { color: theme.semantic.textPrimary, size: theme.fontSizes.sm });
    this._messageText.x = 12;
    this._messageText.y = Math.round((h - this._messageText.height) / 2);

    this.hitArea = new Rectangle(0, 0, w, h);
  }

  protected onDispose(): void {
    // Clean up timer only -- NervBase.destroy() handles children.
    if (this._dismissTimer) clearTimeout(this._dismissTimer);
  }
}
