import { Graphics, Rectangle, Ticker } from 'pixi.js';
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
  private _messageText!: Text;
  private _percentText!: Text;
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

    // Create persistent Text objects
    const theme = this.theme;
    const accent = theme.colorForAccent(this._props.color ?? 'orange');

    this._messageText = TextRenderer.create({
      text: '',
      role: 'display',
      size: theme.fontSizes.lg,
      color: accent,
    });
    this.addChild(this._messageText);

    this._percentText = TextRenderer.create({
      text: '0%',
      role: 'mono',
      size: theme.fontSizes.sm,
      color: theme.semantic.textSecondary,
    });
    this.addChild(this._percentText);

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

    // Message text -- update in place
    const dots = '.'.repeat(this._state.dotFrame);
    TextRenderer.updateText(this._messageText, (p.message ?? 'LOADING') + dots);
    TextRenderer.updateStyle(this._messageText, { color: accent, size: theme.fontSizes.lg });
    this._messageText.x = Math.round(cx - this._messageText.width / 2);
    this._messageText.y = barY - 30;

    // Percentage text -- update in place
    TextRenderer.updateText(this._percentText, `${Math.round(progress * 100)}%`);
    TextRenderer.updateStyle(this._percentText, { color: theme.semantic.textSecondary, size: theme.fontSizes.sm });
    this._percentText.x = Math.round(cx - this._percentText.width / 2);
    this._percentText.y = barY + barH + 8;

    this.hitArea = new Rectangle(0, 0, screenW, screenH);
  }

  protected onDispose(): void {
    // Clean up ticker only -- NervBase.destroy() handles children.
    if (this._dotTicker) Ticker.shared.remove(this._dotTicker);
  }
}
