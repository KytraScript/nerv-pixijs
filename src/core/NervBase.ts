import { Container, Rectangle, Ticker } from 'pixi.js';
import { NervTheme } from './NervTheme';
import { AnimationManager } from './AnimationManager';
import type { Insets, Size } from './types';
import { INSETS_ZERO } from './types';

export interface NervBaseProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  visible?: boolean;
  alpha?: number;
  disabled?: boolean;
  tabIndex?: number;
  label?: string;
}

export interface NervBaseState {
  focused: boolean;
  hovered: boolean;
  pressed: boolean;
}

export abstract class NervBase<
  P extends NervBaseProps = NervBaseProps,
  S extends NervBaseState = NervBaseState
> extends Container {

  // -- Props --
  protected _props: Readonly<P>;
  protected _prevProps: Readonly<P> | null = null;

  get props(): Readonly<P> { return this._props; }

  setProps(next: Partial<P>): void {
    this._prevProps = this._props;
    this._props = { ...this._props, ...next };

    if (next.x !== undefined) this.x = next.x;
    if (next.y !== undefined) this.y = next.y;
    if (next.visible !== undefined) this.visible = next.visible;
    if (next.alpha !== undefined) this.alpha = next.alpha;

    this.onPropsChanged(this._prevProps, this._props);
    this.scheduleRedraw();
  }

  // -- State --
  protected _state: S;
  protected _prevState: S | null = null;

  get state(): Readonly<S> { return this._state; }

  protected setState(next: Partial<S>): void {
    this._prevState = this._state;
    this._state = { ...this._state, ...next };
    this.onStateChanged(this._prevState, this._state);
    this.scheduleRedraw();
  }

  // -- Layout hints --
  layoutWidth: number | 'auto' | 'fill' = 'auto';
  layoutHeight: number | 'auto' | 'fill' = 'auto';
  flexGrow = 0;
  flexShrink = 0;
  margin: Insets = { ...INSETS_ZERO };
  padding: Insets = { ...INSETS_ZERO };

  // -- Redraw batching --
  private _redrawScheduled = false;
  private _tickerCallback: (() => void) | null = null;

  protected scheduleRedraw(): void {
    if (this._redrawScheduled) return;
    this._redrawScheduled = true;

    this._tickerCallback = () => {
      this._redrawScheduled = false;
      if (this._tickerCallback) {
        Ticker.shared.remove(this._tickerCallback);
        this._tickerCallback = null;
      }
      if (!this.destroyed) this.redraw();
    };
    Ticker.shared.addOnce(this._tickerCallback);
  }

  // -- Theme shortcut --
  protected get theme(): NervTheme { return NervTheme.instance; }

  // -- Computed dimensions --
  get componentWidth(): number { return this._props.width ?? this.getPreferredSize().width; }
  get componentHeight(): number { return this._props.height ?? this.getPreferredSize().height; }

  // -- Constructor --
  constructor(props: P, defaultState?: S) {
    super();

    this._props = { ...this.defaultProps(), ...props };
    this._state = { ...(defaultState ?? { focused: false, hovered: false, pressed: false } as S) };

    this.label = props.label ?? this.constructor.name;

    if (props.x !== undefined) this.x = props.x;
    if (props.y !== undefined) this.y = props.y;
    if (props.visible !== undefined) this.visible = props.visible;
    if (props.alpha !== undefined) this.alpha = props.alpha;

    this.eventMode = 'static';
    this.cursor = this._props.disabled ? 'default' : 'pointer';

    this.setupInteraction();
    // Defer onInit to after child class field initializers have run
    queueMicrotask(() => {
      this.onInit();
      this.scheduleRedraw();
    });
  }

  // -- Lifecycle hooks --
  protected onInit(): void {}
  protected onPropsChanged(_prev: P, _next: P): void {}
  protected onStateChanged(_prev: S, _next: S): void {}
  protected abstract redraw(): void;
  protected onDispose(): void {}

  // -- Required overrides --
  protected abstract defaultProps(): P;
  abstract getPreferredSize(): Size;

  // -- Interaction --
  private setupInteraction(): void {
    this.on('pointerover', () => {
      if (!this._props.disabled) this.setState({ hovered: true } as Partial<S>);
    });
    this.on('pointerout', () => {
      this.setState({ hovered: false, pressed: false } as Partial<S>);
    });
    this.on('pointerdown', () => {
      if (!this._props.disabled) this.setState({ pressed: true } as Partial<S>);
    });
    this.on('pointerup', () => {
      this.setState({ pressed: false } as Partial<S>);
    });
  }

  get isFocused(): boolean { return this._state.focused; }
  get isHovered(): boolean { return this._state.hovered; }
  get isDisabled(): boolean { return this._props.disabled ?? false; }

  focus(): void {
    this.setState({ focused: true } as Partial<S>);
  }

  blur(): void {
    this.setState({ focused: false } as Partial<S>);
  }

  // -- Cleanup --
  destroy(options?: { children?: boolean }): void {
    AnimationManager.kill(this);
    if (this._tickerCallback) {
      Ticker.shared.remove(this._tickerCallback);
    }
    this.onDispose();
    super.destroy(options);
  }
}
