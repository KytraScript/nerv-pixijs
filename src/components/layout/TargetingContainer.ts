import { Container, Graphics, Rectangle, Ticker } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import type { NervColor, Size } from '../../core/types';

export interface TargetingContainerProps extends NervBaseProps {
  color?: NervColor;
  padding?: number;
  animateBrackets?: boolean;
  bracketSize?: number;
  bracketThickness?: number;
  animationSpeed?: number;
}

interface TargetingContainerState extends NervBaseState {
  bracketPhase: number;
}

export class TargetingContainer extends NervBase<TargetingContainerProps, TargetingContainerState> {
  private _bg = new Graphics();
  private _brackets = new Graphics();
  private _contentArea = new Container();
  private _animTickerCb: (() => void) | null = null;

  constructor(props: TargetingContainerProps) {
    super(props, {
      focused: false,
      hovered: false,
      pressed: false,
      bracketPhase: 0,
    } as TargetingContainerState);
  }

  protected defaultProps(): TargetingContainerProps {
    return {
      width: 250,
      height: 180,
      color: 'orange',
      padding: 16,
      animateBrackets: true,
      bracketSize: 20,
      bracketThickness: 2,
      animationSpeed: 0.02,
    };
  }

  protected onInit(): void {
    this.addChild(this._bg, this._brackets, this._contentArea);

    if (this._props.animateBrackets !== false) {
      this._startAnimation();
    }
  }

  getPreferredSize(): Size {
    return {
      width: this._props.width ?? 250,
      height: this._props.height ?? 180,
    };
  }

  /** Add children to the targeting container's content area. */
  addContent(child: Container): void {
    this._contentArea.addChild(child);
  }

  removeContent(child: Container): void {
    this._contentArea.removeChild(child);
  }

  private _startAnimation(): void {
    this._animTickerCb = () => {
      if (this.destroyed) return;
      const speed = this._props.animationSpeed ?? 0.02;
      const phase = (this._state.bracketPhase + speed) % (Math.PI * 2);
      // Direct mutation to avoid excessive setState/redraw cycles
      this._state = { ...this._state, bracketPhase: phase };
      this._drawBrackets();
    };
    Ticker.shared.add(this._animTickerCb);
  }

  private _stopAnimation(): void {
    if (this._animTickerCb) {
      Ticker.shared.remove(this._animTickerCb);
      this._animTickerCb = null;
    }
  }

  protected onPropsChanged(prev: TargetingContainerProps, next: TargetingContainerProps): void {
    if (prev.animateBrackets !== next.animateBrackets) {
      if (next.animateBrackets !== false) {
        this._startAnimation();
      } else {
        this._stopAnimation();
      }
    }
  }

  private _drawBrackets(): void {
    const p = this._props;
    const theme = this.theme;
    const w = this.componentWidth;
    const h = this.componentHeight;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const cs = p.bracketSize ?? 20;
    const thick = p.bracketThickness ?? 2;
    const phase = this._state.bracketPhase;

    // Animated pulse alpha
    const pulseAlpha = p.animateBrackets !== false
      ? 0.7 + 0.3 * Math.sin(phase)
      : 1;

    this._brackets.clear();
    this._brackets.setStrokeStyle({ width: thick, color: accent, alpha: pulseAlpha });

    // Top-left bracket (L-shape)
    this._brackets.moveTo(0, cs);
    this._brackets.lineTo(0, 0);
    this._brackets.lineTo(cs, 0);

    // Top-right bracket
    this._brackets.moveTo(w - cs, 0);
    this._brackets.lineTo(w, 0);
    this._brackets.lineTo(w, cs);

    // Bottom-left bracket
    this._brackets.moveTo(0, h - cs);
    this._brackets.lineTo(0, h);
    this._brackets.lineTo(cs, h);

    // Bottom-right bracket
    this._brackets.moveTo(w - cs, h);
    this._brackets.lineTo(w, h);
    this._brackets.lineTo(w, h - cs);

    this._brackets.stroke();

    // Inner tick marks for targeting feel
    const tickLen = 6;
    const midX = w / 2;
    const midY = h / 2;
    this._brackets.setStrokeStyle({ width: 1, color: accent, alpha: pulseAlpha * 0.5 });

    // Top center tick
    this._brackets.moveTo(midX, 0);
    this._brackets.lineTo(midX, tickLen);
    // Bottom center tick
    this._brackets.moveTo(midX, h);
    this._brackets.lineTo(midX, h - tickLen);
    // Left center tick
    this._brackets.moveTo(0, midY);
    this._brackets.lineTo(tickLen, midY);
    // Right center tick
    this._brackets.moveTo(w, midY);
    this._brackets.lineTo(w - tickLen, midY);

    this._brackets.stroke();
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const w = this.componentWidth;
    const h = this.componentHeight;
    const pad = p.padding ?? 16;

    // Subtle background fill
    this._bg.clear();
    this._bg.rect(0, 0, w, h);
    this._bg.fill({ color: theme.semantic.bgPanel, alpha: 0.3 });

    // Content area
    this._contentArea.x = pad;
    this._contentArea.y = pad;

    // Draw brackets
    this._drawBrackets();

    this.hitArea = new Rectangle(0, 0, w, h);
  }

  protected onDispose(): void {
    // Only clean up the ticker callback; all children are auto-destroyed
    // by NervBase.destroy({ children: true }).
    this._stopAnimation();
  }
}
