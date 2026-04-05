import { Graphics, Ticker } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervEmergencyBannerProps extends NervBaseProps {
  message?: string;
  color?: NervColor;
  scrollSpeed?: number;
  blinking?: boolean;
}

interface NervEmergencyBannerState extends NervBaseState {
  scrollOffset: number;
  blinkVisible: boolean;
}

export class NervEmergencyBanner extends NervBase<NervEmergencyBannerProps, NervEmergencyBannerState> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _textA: Text | null = null;
  private _textB: Text | null = null;
  private _mask = new Graphics();
  private _ticker: (() => void) | null = null;
  private _blinkElapsed = 0;
  private _scrollElapsed = 0;

  constructor(props: NervEmergencyBannerProps) {
    super(props, { focused: false, hovered: false, pressed: false, scrollOffset: 0, blinkVisible: true });
  }

  protected defaultProps(): NervEmergencyBannerProps {
    return {
      message: 'EMERGENCY',
      color: 'red',
      scrollSpeed: 60,
      blinking: true,
    };
  }

  protected onInit(): void {
    this.addChild(this._bg, this._border);

    this._ticker = () => {
      const dt = Ticker.shared.deltaMS;
      const speed = this._props.scrollSpeed ?? 60;

      // Scroll
      this._scrollElapsed += dt;
      const pxPerFrame = (speed * dt) / 1000;
      const newOffset = this._state.scrollOffset + pxPerFrame;
      const textWidth = this._getRepeatWidth();
      const wrapped = textWidth > 0 ? newOffset % textWidth : 0;

      // Blink
      let blinkVis = this._state.blinkVisible;
      if (this._props.blinking) {
        this._blinkElapsed += dt;
        if (this._blinkElapsed >= 600) {
          this._blinkElapsed = 0;
          blinkVis = !blinkVis;
        }
      } else {
        blinkVis = true;
      }

      // Batch state update
      if (wrapped !== this._state.scrollOffset || blinkVis !== this._state.blinkVisible) {
        this._state = { ...this._state, scrollOffset: wrapped, blinkVisible: blinkVis };
        this._updateTextPositions();
        this._bg.alpha = blinkVis ? 1 : 0.4;
      }
    };
    Ticker.shared.add(this._ticker);
  }

  private _getRepeatWidth(): number {
    if (!this._textA) return 400;
    return this._textA.width + 80; // gap between repeats
  }

  private _updateTextPositions(): void {
    const offset = this._state.scrollOffset;
    const repeatW = this._getRepeatWidth();
    const w = this.componentWidth;

    if (this._textA) {
      this._textA.x = -offset;
    }
    if (this._textB) {
      this._textB.x = -offset + repeatW;
    }

    // Wrap so text is always visible
    if (this._textA && this._textA.x + this._textA.width < 0) {
      this._textA.x += repeatW * 2;
    }
    if (this._textB && this._textB.x + this._textB.width < 0) {
      this._textB.x += repeatW * 2;
    }
  }

  getPreferredSize(): Size {
    return {
      width: this._props.width ?? 600,
      height: 28,
    };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'red');
    const { width: w, height: h } = this.getPreferredSize();

    // Background
    this._bg.clear();
    this._bg.rect(0, 0, w, h);
    this._bg.fill({ color: accent, alpha: 0.12 });

    // Border lines top and bottom
    this._border.clear();
    this._border.setStrokeStyle({ width: 1, color: accent, alpha: 0.8 });
    this._border.moveTo(0, 0); this._border.lineTo(w, 0);
    this._border.moveTo(0, h); this._border.lineTo(w, h);
    this._border.stroke();

    // Scrolling text instances
    if (this._textA) { this._textA.destroy(); this.removeChild(this._textA); }
    if (this._textB) { this._textB.destroy(); this.removeChild(this._textB); }

    const spacedMsg = `  ///  ${p.message ?? 'EMERGENCY'}  ///  ${p.message ?? 'EMERGENCY'}`;

    this._textA = TextRenderer.create({
      text: spacedMsg,
      role: 'display',
      size: theme.fontSizes.sm,
      color: accent,
    });
    this._textA.y = Math.round((h - this._textA.height) / 2);

    this._textB = TextRenderer.create({
      text: spacedMsg,
      role: 'display',
      size: theme.fontSizes.sm,
      color: accent,
    });
    this._textB.y = this._textA.y;

    this.addChild(this._textA, this._textB);

    // Apply mask so text doesn't overflow
    if (this._mask.parent) this.removeChild(this._mask);
    this._mask.clear();
    this._mask.rect(0, 0, w, h);
    this._mask.fill({ color: 0xFFFFFF });
    this.addChild(this._mask);
    this.mask = this._mask;

    this._updateTextPositions();

    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= w && y >= 0 && y <= h };
  }

  protected onDispose(): void {
    if (this._ticker) Ticker.shared.remove(this._ticker);
    this.mask = null;
    this._bg.destroy();
    this._border.destroy();
    this._mask.destroy();
    this._textA?.destroy();
    this._textB?.destroy();
  }
}
