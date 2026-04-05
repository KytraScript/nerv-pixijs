import { Container, Ticker } from 'pixi.js';

export type EasingFn = (t: number) => number;

export const Easing = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutBack: (t: number) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
} as const;

interface TweenState {
  id: number;
  target: Record<string, number>;
  from: Record<string, number>;
  to: Record<string, number>;
  duration: number;
  elapsed: number;
  delay: number;
  easing: EasingFn;
  onUpdate?: (target: unknown) => void;
  onComplete?: (target: unknown) => void;
  paused: boolean;
  complete: boolean;
}

let nextId = 0;

export class Tween {
  constructor(private _state: TweenState) {}
  get id(): number { return this._state.id; }
  get isComplete(): boolean { return this._state.complete; }
  pause(): this { this._state.paused = true; return this; }
  resume(): this { this._state.paused = false; return this; }
  stop(): this { this._state.complete = true; return this; }
}

export class AnimationManager {
  private static _tweens = new Set<TweenState>();
  private static _initialized = false;

  private static init(): void {
    if (this._initialized) return;
    this._initialized = true;
    Ticker.shared.add((ticker) => this.update(ticker.deltaMS));
  }

  private static update(deltaMs: number): void {
    for (const tw of this._tweens) {
      if (tw.complete) { this._tweens.delete(tw); continue; }
      if (tw.paused) continue;

      if (tw.delay > 0) { tw.delay -= deltaMs; continue; }

      tw.elapsed += deltaMs;
      const progress = Math.min(tw.elapsed / tw.duration, 1);
      const eased = tw.easing(progress);

      for (const key in tw.to) {
        tw.target[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * eased;
      }

      tw.onUpdate?.(tw.target);

      if (progress >= 1) {
        tw.complete = true;
        tw.onComplete?.(tw.target);
        this._tweens.delete(tw);
      }
    }
  }

  static tween(
    target: unknown,
    props: Record<string, number>,
    duration: number,
    options?: {
      easing?: EasingFn;
      delay?: number;
      onUpdate?: (target: unknown) => void;
      onComplete?: (target: unknown) => void;
    }
  ): Tween {
    this.init();

    const t = target as Record<string, number>;
    const from: Record<string, number> = {};
    const to: Record<string, number> = {};
    for (const key in props) {
      from[key] = t[key];
      to[key] = props[key];
    }

    const state: TweenState = {
      id: nextId++,
      target: t,
      from, to,
      duration,
      elapsed: 0,
      delay: options?.delay ?? 0,
      easing: options?.easing ?? Easing.easeOutQuad,
      onUpdate: options?.onUpdate as ((t: unknown) => void) | undefined,
      onComplete: options?.onComplete as ((t: unknown) => void) | undefined,
      paused: false,
      complete: false,
    };

    this._tweens.add(state);
    return new Tween(state);
  }

  static kill(target: unknown): void {
    for (const tw of this._tweens) {
      if (tw.target === target) { tw.complete = true; }
    }
  }

  static killAll(): void {
    this._tweens.clear();
  }

  // -- NERV effect presets --

  static flicker(target: Container, duration = 300): Tween {
    const original = target.alpha;
    return this.tween(target, { alpha: 0.3 } as never, duration / 2, {
      easing: Easing.linear,
      onComplete: () => { this.tween(target, { alpha: original } as never, duration / 2, { easing: Easing.linear }); },
    });
  }

  static pulse(target: Container, scale = 1.05, duration = 400): Tween {
    return this.tween(target.scale, { x: scale, y: scale }, duration / 2, {
      easing: Easing.easeOutQuad,
      onComplete: () => { this.tween(target.scale, { x: 1, y: 1 }, duration / 2, { easing: Easing.easeInQuad }); },
    });
  }

  static fadeIn(target: Container, duration = 200): Tween {
    target.alpha = 0;
    target.visible = true;
    return this.tween(target, { alpha: 1 } as never, duration);
  }

  static fadeOut(target: Container, duration = 200): Tween {
    return this.tween(target, { alpha: 0 } as never, duration, {
      onComplete: () => { target.visible = false; },
    });
  }

  static slideIn(target: Container, from: 'left' | 'right' | 'top' | 'bottom', distance = 50, duration = 300): Tween {
    const dest = { x: target.x, y: target.y };
    switch (from) {
      case 'left': target.x -= distance; break;
      case 'right': target.x += distance; break;
      case 'top': target.y -= distance; break;
      case 'bottom': target.y += distance; break;
    }
    target.alpha = 0;
    target.visible = true;
    this.tween(target, { alpha: 1 } as never, duration);
    return this.tween(target, dest as never, duration, { easing: Easing.easeOutCubic });
  }
}
