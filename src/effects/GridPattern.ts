import { Container, Graphics } from 'pixi.js';
import { NervTheme } from '../core/NervTheme';

export interface HexGridOptions {
  width: number;
  height: number;
  cellSize?: number;
  color?: number;
  alpha?: number;
  lineWidth?: number;
}

export class GridPattern extends Container {
  private _gfx = new Graphics();

  constructor() {
    super();
    this.addChild(this._gfx);
    this.eventMode = 'none';
    this.interactiveChildren = false;
    this.label = 'GridPattern';
  }

  drawHexGrid(opts: HexGridOptions): void {
    const theme = NervTheme.instance;
    const cellSize = opts.cellSize ?? 30;
    const color = opts.color ?? theme.semantic.borderDefault;
    const alpha = opts.alpha ?? 0.15;
    const lineWidth = opts.lineWidth ?? 0.5;

    this._gfx.clear();
    this._gfx.setStrokeStyle({ width: lineWidth, color, alpha });

    const hexH = cellSize * 2;
    const hexW = Math.sqrt(3) * cellSize;
    const vertStep = hexH * 0.75;

    for (let row = -1; row * vertStep < opts.height + hexH; row++) {
      for (let col = -1; col * hexW < opts.width + hexW; col++) {
        const cx = col * hexW + (row % 2 !== 0 ? hexW / 2 : 0);
        const cy = row * vertStep;
        this.drawHex(cx, cy, cellSize);
      }
    }
    this._gfx.stroke();
  }

  drawSquareGrid(opts: HexGridOptions): void {
    const theme = NervTheme.instance;
    const cellSize = opts.cellSize ?? 30;
    const color = opts.color ?? theme.semantic.borderDefault;
    const alpha = opts.alpha ?? 0.1;
    const lineWidth = opts.lineWidth ?? 0.5;

    this._gfx.clear();
    this._gfx.setStrokeStyle({ width: lineWidth, color, alpha });

    for (let x = 0; x <= opts.width; x += cellSize) {
      this._gfx.moveTo(x, 0);
      this._gfx.lineTo(x, opts.height);
    }
    for (let y = 0; y <= opts.height; y += cellSize) {
      this._gfx.moveTo(0, y);
      this._gfx.lineTo(opts.width, y);
    }
    this._gfx.stroke();
  }

  private drawHex(cx: number, cy: number, size: number): void {
    for (let i = 0; i < 6; i++) {
      const angle1 = (Math.PI / 3) * i - Math.PI / 6;
      const angle2 = (Math.PI / 3) * (i + 1) - Math.PI / 6;
      this._gfx.moveTo(cx + size * Math.cos(angle1), cy + size * Math.sin(angle1));
      this._gfx.lineTo(cx + size * Math.cos(angle2), cy + size * Math.sin(angle2));
    }
  }

  destroy(): void {
    super.destroy({ children: true });
  }
}
