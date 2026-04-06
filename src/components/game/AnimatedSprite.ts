import { Container, Sprite, Texture, Rectangle } from 'pixi.js';

export interface AnimatedSpriteOptions {
  /** Base64 PNG spritesheet data (no prefix needed, will add if missing) */
  spritesheet: string;
  /** Width of each frame in the spritesheet */
  frameWidth: number;
  /** Height of each frame */
  frameHeight: number;
  /** Frames per second (default 8) */
  fps?: number;
  /** Scale factor (default 1) */
  scale?: number;
  /** Whether to loop (default true) */
  loop?: boolean;
  /** Auto-play on creation (default true) */
  autoPlay?: boolean;
}

/**
 * Renders an animated sprite from a spritesheet PNG.
 * Cuts the spritesheet into frames based on frameWidth/frameHeight
 * and cycles through them using requestAnimationFrame.
 *
 * This is a plain Container (not a NervBase) so it can be embedded
 * inside GameNodes, Cards, or any other component.
 */
export class AnimatedGameSprite extends Container {
  private _frames: Texture[] = [];
  private _sprite: Sprite;
  private _currentFrame = 0;
  private _fps: number;
  private _loop: boolean;
  private _playing = false;
  private _rafId = 0;
  private _lastFrameTime = 0;
  private _loaded = false;

  constructor(options: AnimatedSpriteOptions) {
    super();
    this._fps = options.fps ?? 8;
    this._loop = options.loop ?? true;
    this._sprite = new Sprite();
    this._sprite.scale.set(options.scale ?? 1);
    this.addChild(this._sprite);
    this.label = 'AnimatedGameSprite';

    this._loadSpritesheet(options.spritesheet, options.frameWidth, options.frameHeight).then(() => {
      if (options.autoPlay !== false) this.play();
    });
  }

  private async _loadSpritesheet(base64: string, fw: number, fh: number): Promise<void> {
    // Ensure proper data URL prefix
    let src = base64;
    if (!src.startsWith('data:')) {
      src = `data:image/png;base64,${src}`;
    }

    // Load the image
    const img = new Image();
    img.src = src;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load spritesheet'));
    });

    // Create base texture from image
    const baseTexture = Texture.from(img);

    // Cut into frames (left to right, top to bottom)
    const cols = Math.floor(img.width / fw);
    const rows = Math.floor(img.height / fh);

    this._frames = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const frame = new Texture({
          source: baseTexture.source,
          frame: new Rectangle(col * fw, row * fh, fw, fh),
        });
        this._frames.push(frame);
      }
    }

    if (this._frames.length > 0) {
      this._sprite.texture = this._frames[0];
      this._loaded = true;
    }
  }

  play(): void {
    if (this._playing || !this._loaded) return;
    this._playing = true;
    this._lastFrameTime = performance.now();

    const tick = () => {
      if (!this._playing) return;
      const now = performance.now();
      const elapsed = now - this._lastFrameTime;
      const frameInterval = 1000 / this._fps;

      if (elapsed >= frameInterval) {
        this._lastFrameTime = now - (elapsed % frameInterval);
        this._currentFrame++;

        if (this._currentFrame >= this._frames.length) {
          if (this._loop) {
            this._currentFrame = 0;
          } else {
            this._currentFrame = this._frames.length - 1;
            this._playing = false;
            return;
          }
        }

        this._sprite.texture = this._frames[this._currentFrame];
      }

      this._rafId = requestAnimationFrame(tick);
    };

    this._rafId = requestAnimationFrame(tick);
  }

  pause(): void {
    this._playing = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = 0;
    }
  }

  stop(): void {
    this.pause();
    this._currentFrame = 0;
    if (this._frames.length > 0) {
      this._sprite.texture = this._frames[0];
    }
  }

  get isPlaying(): boolean { return this._playing; }
  get frameCount(): number { return this._frames.length; }
  get isLoaded(): boolean { return this._loaded; }

  set fps(v: number) { this._fps = v; }
  get fps(): number { return this._fps; }

  destroy(): void {
    this.pause();
    super.destroy({ children: true });
  }
}
