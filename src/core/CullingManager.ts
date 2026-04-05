import type { Viewport } from 'pixi-viewport';
import { Ticker } from 'pixi.js';
import { NervBase } from './NervBase';

export class CullingManager {
  private _viewport: Viewport;
  private _tracked = new Set<NervBase>();
  private _cellSize: number;
  private _enabled: boolean;
  private _tickerFn: (() => void) | null = null;

  constructor(viewport: Viewport, cellSize = 512, enabled = true) {
    this._viewport = viewport;
    this._cellSize = cellSize;
    this._enabled = enabled;

    if (enabled) {
      this._tickerFn = () => this.update();
      Ticker.shared.add(this._tickerFn);
    }
  }

  register(component: NervBase): void {
    this._tracked.add(component);
  }

  unregister(component: NervBase): void {
    this._tracked.delete(component);
  }

  private update(): void {
    if (!this._enabled || !this._tracked.size) return;

    const corner = this._viewport.corner;
    const screenW = this._viewport.screenWidth;
    const screenH = this._viewport.screenHeight;
    const scale = this._viewport.scaled;

    const left = corner.x;
    const top = corner.y;
    const right = left + screenW / scale;
    const bottom = top + screenH / scale;

    const margin = this._cellSize;
    const vLeft = left - margin;
    const vTop = top - margin;
    const vRight = right + margin;
    const vBottom = bottom + margin;

    for (const comp of this._tracked) {
      const x = comp.x;
      const y = comp.y;
      const w = comp.componentWidth;
      const h = comp.componentHeight;

      const visible = x + w > vLeft && x < vRight && y + h > vTop && y < vBottom;

      if (comp.renderable !== visible) {
        comp.renderable = visible;
        comp.interactiveChildren = visible;
      }
    }
  }

  get trackedCount(): number { return this._tracked.size; }

  destroy(): void {
    if (this._tickerFn) {
      Ticker.shared.remove(this._tickerFn);
      this._tickerFn = null;
    }
    this._tracked.clear();
  }
}
