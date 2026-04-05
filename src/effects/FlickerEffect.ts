import { Container, Ticker } from 'pixi.js';

export interface FlickerConfig {
  minAlpha?: number;
  maxAlpha?: number;
  speed?: number;
  intensity?: number;
}

export class FlickerEffect {
  private _target: Container;
  private _config: Required<FlickerConfig>;
  private _running = false;
  private _elapsed = 0;
  private _tickerFn: ((ticker: { deltaMS: number }) => void) | null = null;

  constructor(target: Container, config?: FlickerConfig) {
    this._target = target;
    this._config = {
      minAlpha: config?.minAlpha ?? 0.85,
      maxAlpha: config?.maxAlpha ?? 1.0,
      speed: config?.speed ?? 8,
      intensity: config?.intensity ?? 0.3,
    };
  }

  start(): this {
    if (this._running) return this;
    this._running = true;

    this._tickerFn = (ticker) => {
      this._elapsed += ticker.deltaMS * 0.001 * this._config.speed;
      const noise = Math.sin(this._elapsed * 13.7) * Math.cos(this._elapsed * 7.3) * this._config.intensity;
      const { minAlpha, maxAlpha } = this._config;
      this._target.alpha = minAlpha + (maxAlpha - minAlpha) * (0.5 + noise * 0.5);
    };

    Ticker.shared.add(this._tickerFn);
    return this;
  }

  stop(): this {
    if (!this._running) return this;
    this._running = false;
    if (this._tickerFn) {
      Ticker.shared.remove(this._tickerFn);
      this._tickerFn = null;
    }
    this._target.alpha = this._config.maxAlpha;
    return this;
  }

  destroy(): void {
    this.stop();
  }
}
