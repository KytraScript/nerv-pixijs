import { Container, Graphics, Rectangle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { AnimationManager, Easing } from '../../core/AnimationManager';
import { NervPanel } from '../../primitives/NervPanel';
import type { NervColor, Size } from '../../core/types';

export type DrawerSide = 'left' | 'right' | 'top' | 'bottom';

export interface NervDrawerProps extends NervBaseProps {
  side?: DrawerSide;
  open?: boolean;
  drawerWidth?: number;
  drawerHeight?: number;
  color?: NervColor;
  scrimAlpha?: number;
  animationDuration?: number;
}

interface NervDrawerState extends NervBaseState {
  animatedOffset: number;
  isAnimating: boolean;
}

export class NervDrawer extends NervBase<NervDrawerProps, NervDrawerState> {
  private _scrim = new Graphics();
  private _panel: NervPanel | null = null;
  private _contentArea = new Container();
  private _drawerContainer = new Container();

  constructor(props: NervDrawerProps) {
    super(props, {
      focused: false,
      hovered: false,
      pressed: false,
      animatedOffset: props.open ? 0 : 1,
      isAnimating: false,
    } as NervDrawerState);
  }

  protected defaultProps(): NervDrawerProps {
    return {
      side: 'left',
      open: false,
      drawerWidth: 300,
      drawerHeight: 300,
      color: 'orange',
      scrimAlpha: 0.4,
      animationDuration: 300,
      width: 800,
      height: 600,
    };
  }

  protected onInit(): void {
    this._scrim.eventMode = 'static';
    this._scrim.cursor = 'pointer';
    this._scrim.on('pointerup', () => {
      this.emit('close');
    });

    this.addChild(this._scrim, this._drawerContainer);
    this._drawerContainer.addChild(this._contentArea);
  }

  getPreferredSize(): Size {
    return {
      width: this._props.width ?? 800,
      height: this._props.height ?? 600,
    };
  }

  /** Add children to the drawer's content area. */
  addContent(child: Container): void {
    this._contentArea.addChild(child);
  }

  removeContent(child: Container): void {
    this._contentArea.removeChild(child);
  }

  protected onPropsChanged(prev: NervDrawerProps, next: NervDrawerProps): void {
    if (prev.open !== next.open) {
      this._animateDrawer(next.open ?? false);
    }
  }

  private _animateDrawer(opening: boolean): void {
    const duration = this._props.animationDuration ?? 300;
    const proxy = { offset: this._state.animatedOffset };
    const target = opening ? 0 : 1;

    this.setState({ isAnimating: true } as Partial<NervDrawerState>);

    AnimationManager.tween(proxy, { offset: target }, duration, {
      easing: opening ? Easing.easeOutCubic : Easing.easeInQuad,
      onUpdate: () => {
        this.setState({ animatedOffset: proxy.offset } as Partial<NervDrawerState>);
      },
      onComplete: () => {
        this.setState({
          animatedOffset: target,
          isAnimating: false,
        } as Partial<NervDrawerState>);
      },
    });
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const containerW = this.componentWidth;
    const containerH = this.componentHeight;
    const side = p.side ?? 'left';
    const dw = p.drawerWidth ?? 300;
    const dh = p.drawerHeight ?? 300;
    const offset = this._state.animatedOffset;
    const isOpen = (p.open ?? false) || this._state.isAnimating;

    // Scrim
    this._scrim.clear();
    if (isOpen) {
      const scrimAlpha = (p.scrimAlpha ?? 0.4) * (1 - offset);
      this._scrim.rect(0, 0, containerW, containerH);
      this._scrim.fill({ color: theme.semantic.bgBase, alpha: scrimAlpha });
      this._scrim.visible = true;
    } else {
      this._scrim.visible = false;
    }

    // Rebuild panel
    if (this._panel) {
      this._drawerContainer.removeChild(this._panel);
      this._panel.destroy({ children: true });
    }

    const isHorizontal = side === 'left' || side === 'right';
    const panelW = isHorizontal ? dw : containerW;
    const panelH = isHorizontal ? containerH : dh;

    this._panel = new NervPanel({
      width: panelW,
      height: panelH,
      color: p.color ?? 'orange',
      fillAlpha: 0.95,
      showCornerBrackets: true,
      cornerSize: 16,
    });
    this._drawerContainer.addChildAt(this._panel, 0);

    // Position drawer based on side and animation offset
    const contentPad = theme.spacing.md;
    switch (side) {
      case 'left':
        this._drawerContainer.x = -dw * offset;
        this._drawerContainer.y = 0;
        break;
      case 'right':
        this._drawerContainer.x = containerW - dw + dw * offset;
        this._drawerContainer.y = 0;
        break;
      case 'top':
        this._drawerContainer.x = 0;
        this._drawerContainer.y = -dh * offset;
        break;
      case 'bottom':
        this._drawerContainer.x = 0;
        this._drawerContainer.y = containerH - dh + dh * offset;
        break;
    }

    // Content area
    this._contentArea.x = contentPad;
    this._contentArea.y = contentPad;

    this._drawerContainer.visible = isOpen;
    this.hitArea = new Rectangle(0, 0, containerW, containerH);
  }

  protected onDispose(): void {
    // Only clean up event listeners; all children are auto-destroyed
    // by NervBase.destroy({ children: true }).
    this._scrim.removeAllListeners();
  }
}
