import { Container, Graphics } from 'pixi.js';
import { NervBase } from './NervBase';
import { NervTheme } from './NervTheme';

export class FocusManager {
  private _focused: NervBase | null = null;
  private _focusRing: Graphics;
  private _root: Container;

  constructor(root: Container) {
    this._root = root;
    this._focusRing = new Graphics();
    this._focusRing.visible = false;
    this._focusRing.label = 'FocusRing';
    root.addChild(this._focusRing);
  }

  get focused(): NervBase | null { return this._focused; }

  focus(component: NervBase): void {
    if (this._focused === component) return;
    if (this._focused) this._focused.blur();
    this._focused = component;
    component.focus();
    this.updateFocusRing();
  }

  blur(): void {
    if (this._focused) {
      this._focused.blur();
      this._focused = null;
    }
    this._focusRing.visible = false;
  }

  advanceFocus(direction: 1 | -1): void {
    const focusable = this.collectFocusOrder(this._root);
    if (!focusable.length) return;

    if (!this._focused) {
      this.focus(focusable[direction === 1 ? 0 : focusable.length - 1]);
      return;
    }

    const idx = focusable.indexOf(this._focused);
    const next = (idx + direction + focusable.length) % focusable.length;
    this.focus(focusable[next]);
  }

  private collectFocusOrder(root: Container): NervBase[] {
    const result: NervBase[] = [];

    const walk = (container: Container) => {
      for (const child of container.children) {
        if (child instanceof NervBase && !child.isDisabled && child.visible && (child.props.tabIndex ?? -1) >= 0) {
          result.push(child);
        }
        if (child instanceof Container) {
          walk(child);
        }
      }
    };

    walk(root);

    result.sort((a, b) => {
      const ta = a.props.tabIndex ?? 0;
      const tb = b.props.tabIndex ?? 0;
      if (ta !== tb) return ta - tb;
      // Same tabIndex: sort by position (top-left to bottom-right)
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    return result;
  }

  private updateFocusRing(): void {
    if (!this._focused) {
      this._focusRing.visible = false;
      return;
    }

    const theme = NervTheme.instance;
    const bounds = this._focused.getBounds();

    this._focusRing.clear();
    this._focusRing.setStrokeStyle({ width: 1.5, color: theme.semantic.borderFocus, alpha: 0.8 });
    this._focusRing.rect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);
    this._focusRing.stroke();
    this._focusRing.visible = true;
  }

  destroy(): void {
    this._focusRing.destroy();
    this._focused = null;
  }
}
