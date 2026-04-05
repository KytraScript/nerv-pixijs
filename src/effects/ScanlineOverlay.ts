import { Container, Graphics } from 'pixi.js';
import { NervTheme } from '../core/NervTheme';

export class ScanlineOverlay extends Container {
  private _gfx = new Graphics();
  private _width: number;
  private _height: number;

  constructor(width: number, height: number) {
    super();
    this._width = width;
    this._height = height;
    this.addChild(this._gfx);
    this.eventMode = 'none';
    this.interactiveChildren = false;
    this.label = 'ScanlineOverlay';
    this.draw();
  }

  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    this.draw();
  }

  private draw(): void {
    const theme = NervTheme.instance;
    const spacing = theme.effects.scanlineSpacing;
    const alpha = theme.effects.scanlineAlpha;

    this._gfx.clear();
    this._gfx.setStrokeStyle({ width: 1, color: 0x000000, alpha });

    for (let y = 0; y < this._height; y += spacing) {
      this._gfx.moveTo(0, y);
      this._gfx.lineTo(this._width, y);
    }
    this._gfx.stroke();
  }

  destroy(options?: boolean | { children?: boolean }): void {
    super.destroy({ children: true, ...(typeof options === 'object' ? options : {}) });
  }
}
