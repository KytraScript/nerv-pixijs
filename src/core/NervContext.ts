import type { FocusManager } from './FocusManager';
import type { InputManager } from './InputManager';
import type { NervBase } from './NervBase';

/**
 * NervContext is the central coordination singleton that components use
 * to access the focus manager, input manager, and viewport controls.
 *
 * It's initialized by NervApp.create() and accessed by components via
 * NervContext.instance. This avoids prop-drilling or passing managers
 * through every constructor.
 */
export class NervContext {
  private static _instance: NervContext | null = null;

  readonly focusManager: FocusManager;
  readonly inputManager: InputManager;
  private _viewportPauseDrag: (() => void) | null = null;
  private _viewportResumeDrag: (() => void) | null = null;

  constructor(
    focusManager: FocusManager,
    inputManager: InputManager,
  ) {
    this.focusManager = focusManager;
    this.inputManager = inputManager;
  }

  static initialize(ctx: NervContext): void {
    NervContext._instance = ctx;
  }

  static get instance(): NervContext {
    if (!NervContext._instance) {
      throw new Error('[NERV] NervContext not initialized. Call NervApp.create() first.');
    }
    return NervContext._instance;
  }

  static get available(): boolean {
    return NervContext._instance !== null;
  }

  /**
   * Register viewport drag control callbacks.
   * Called by NervApp after viewport is created.
   */
  setViewportDragControl(pause: () => void, resume: () => void): void {
    this._viewportPauseDrag = pause;
    this._viewportResumeDrag = resume;
  }

  /**
   * Pause viewport dragging (e.g., while a slider is being dragged).
   * Components call this to prevent their drag from moving the canvas.
   */
  pauseViewportDrag(): void {
    this._viewportPauseDrag?.();
  }

  /**
   * Resume viewport dragging after component drag ends.
   */
  resumeViewportDrag(): void {
    this._viewportResumeDrag?.();
  }

  /**
   * Focus a component through the system-wide focus manager.
   * Properly blurs the previous component first.
   */
  focusComponent(component: NervBase): void {
    this.focusManager.focus(component);
  }

  /**
   * Blur whatever is currently focused.
   */
  blurFocused(): void {
    this.focusManager.blur();
  }

  /**
   * Activate the hidden DOM text input proxy for a text component.
   * Routes keyboard input through the OS text input stack.
   */
  activateTextInput(target: NervBase & { onKeyDown?(e: KeyboardEvent): void }, multiline: boolean, currentValue = ''): void {
    this.inputManager.activateTextProxy(target as any, multiline, currentValue);
  }

  /**
   * Deactivate the text input proxy.
   */
  deactivateTextInput(): void {
    this.inputManager.deactivateTextProxy();
  }

  destroy(): void {
    NervContext._instance = null;
    this._viewportPauseDrag = null;
    this._viewportResumeDrag = null;
  }
}
