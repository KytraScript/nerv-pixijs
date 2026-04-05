import { Graphics, Ticker } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import { AnimationManager, Easing } from '../../core/AnimationManager';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervLoadingScreenProps extends NervBaseProps {
  message?: string;
  progress?: number;
  color?: NervColor;
}

interface NervLoadingScreenState extends NervBaseState {
  dotFrame: number;
}

export class NervLoadingScreen extends NervBase<NervLoadingScreenProps, NervLoadingScreenState> {
  private _overlay = new Graphics();
  private _progressBarBg = new Graphics();
  private _progressBarFill = new Graphics();
  private _progressBorder = new Graphics();
  private _messageText: Text | null = null;
  private _dotText: Text | null = null;
  private _percentText: Text | null = null;
  private _dotTicker: (() => void) | null = null;
  private _dotElapsed = 0;

  constructor(props: NervLoadingScreenProps) {
    super(props, { focused: false, hovered: false, pressed: false, dotFrame: 0 });
  }

  protected defaultProps(): NervLoadingScreenProps {
    return {
      message: 'LOADING',
      progress: 0,
      color: 'orange',
    };
  }

  protected onInit(): void {
    this.addChild(this._overlay, this._progressBarBg, this._progressBarFill, this._progressBorder);

    // Animated dots ticker
    this._dotTicker = () => {
      this._dotElapsed += Ticker.shared.deltaMS;
      if (this._dotElapsed >= 500) {
        this._dotElapsed = 0;
        const next = ((this._state.dotFrame) % 3) + 1;
        this.setState({ dotFrame: next });
      }
    };
    Ticker.shared.add(this._dotTicker);
  }

  getPreferredSize(): Size {
    return {
      width: this._props.width ?? 1920,
      height: this._props.height ?? 1080,
    };
  }

  show(): void {
    this.visible = true;
    this.alpha = 0;
    AnimationManager.tween(this, { alpha: 1 } as never, 250, { easing: Easing.easeOutQuad });
  }

  hide(): void {
    AnimationManager.tween(this, { alpha: 0 } as never, 200, {
      easing: Easing.easeInQuad,
      onComplete: () => { this.visible = false; },
    });
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const screenW = p.width ?? 1920;
    const screenH = p.height ?? 1080;
    const progress = Math.max(0, Math.min(p.progress ?? 0, 1));

    const barW = 320;
    const barH = 8;
    const cx = Math.round(screenW / 2);
    const cy = Math.round(screenH / 2);
    const barX = cx - barW / 2;
    const barY = cy + 20;

    // Dark overlay
    this._overlay.clear();
    this._overlay.rect(0, 0, screenW, screenH);
    this._overlay.fill({ color: 0x000000, alpha: 0.85 });

    // Progress bar background
    this._progressBarBg.clear();
    this._progressBarBg.rect(barX, barY, barW, barH);
    this._progressBarBg.fill({ color: theme.semantic.bgOverlay, alpha: 0.8 });

    // Progress bar fill
    this._progressBarFill.clear();
    const fillW = barW * progress;
    if (fillW > 0) {
      this._progressBarFill.rect(barX, barY, fillW, barH);
      this._progressBarFill.fill({ color: accent, alpha: 0.9 });
    }

    // Progress bar border
    this._progressBorder.clear();
    this._progressBorder.setStrokeStyle({ width: 1, color: accent, alpha: 0.5 });
    this._progressBorder.rect(barX, barY, barW, barH);
    this._progressBorder.stroke();

    // Message text
    if (this._messageText) { this._messageText.destroy(); this.removeChild(this._messageText); }
    const dots = '.'.repeat(this._state.dotFrame);
    this._messageText = TextRenderer.create({
      text: (p.message ?? 'LOADING') + dots,
      role: 'display',
      size: theme.fontSizes.lg,
      color: accent,
    });
    this._messageText.x = Math.round(cx - this._messageText.width / 2);
    this._messageText.y = barY - 30;
    this.addChild(this._messageText);

    // Percentage text
    if (this._percentText) { this._percentText.destroy(); this.removeChild(this._percentText); }
    this._percentText = TextRenderer.create({
      text: `${Math.round(progress * 100)}%`,
      role: 'mono',
      size: theme.fontSizes.sm,
      color: theme.semantic.textSecondary,
    });
    this._percentText.x = Math.round(cx - this._percentText.width / 2);
    this._percentText.y = barY + barH + 8;
    this.addChild(this._percentText);

    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= screenW && y >= 0 && y <= screenH };
  }

  protected onDispose(): void {
    if (this._dotTicker) Ticker.shared.remove(this._dotTicker);
    this._overlay.destroy();
    this._progressBarBg.destroy();
    this._progressBarFill.destroy();
    this._progressBorder.destroy();
    this._messageText?.destroy();
    this._dotText?.destroy();
    this._percentText?.destroy();
  }
}
