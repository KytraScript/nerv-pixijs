import { Graphics, Rectangle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import type { NervColor, Size } from '../../core/types';

export interface NervMinimapViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NervMinimapProps extends NervBaseProps {
  worldWidth?: number;
  worldHeight?: number;
  size?: number;
  viewport?: NervMinimapViewport;
  color?: NervColor;
  markers?: { x: number; y: number; color?: number }[];
}

export class NervMinimap extends NervBase<NervMinimapProps> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _viewportRect = new Graphics();
  private _markerGraphics = new Graphics();
  private _grid = new Graphics();

  protected defaultProps(): NervMinimapProps {
    return {
      worldWidth: 2000,
      worldHeight: 2000,
      size: 150,
      viewport: { x: 0, y: 0, width: 800, height: 600 },
      color: 'orange',
    };
  }

  protected onInit(): void {
    this.addChild(this._bg, this._grid, this._markerGraphics, this._viewportRect, this._border);
  }

  getPreferredSize(): Size {
    const s = this._props.size ?? 150;
    const worldW = this._props.worldWidth ?? 2000;
    const worldH = this._props.worldHeight ?? 2000;
    const aspect = worldW / worldH;

    if (aspect >= 1) {
      return { width: s, height: Math.round(s / aspect) };
    }
    return { width: Math.round(s * aspect), height: s };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const { width: w, height: h } = this.getPreferredSize();
    const worldW = p.worldWidth ?? 2000;
    const worldH = p.worldHeight ?? 2000;
    const scaleX = w / worldW;
    const scaleY = h / worldH;

    // Background
    this._bg.clear();
    this._bg.rect(0, 0, w, h);
    this._bg.fill({ color: theme.semantic.bgBase, alpha: 0.85 });

    // Grid lines
    this._grid.clear();
    this._grid.setStrokeStyle({ width: 0.5, color: theme.semantic.borderDefault, alpha: 0.15 });
    const gridStep = Math.max(worldW, worldH) / 8;
    for (let gx = gridStep; gx < worldW; gx += gridStep) {
      const sx = gx * scaleX;
      this._grid.moveTo(sx, 0);
      this._grid.lineTo(sx, h);
    }
    for (let gy = gridStep; gy < worldH; gy += gridStep) {
      const sy = gy * scaleY;
      this._grid.moveTo(0, sy);
      this._grid.lineTo(w, sy);
    }
    this._grid.stroke();

    // Markers
    this._markerGraphics.clear();
    if (p.markers) {
      for (const marker of p.markers) {
        const mx = marker.x * scaleX;
        const my = marker.y * scaleY;
        this._markerGraphics.circle(mx, my, 2);
        this._markerGraphics.fill({ color: marker.color ?? accent, alpha: 0.9 });
      }
    }

    // Viewport indicator rectangle
    this._viewportRect.clear();
    if (p.viewport) {
      const vx = p.viewport.x * scaleX;
      const vy = p.viewport.y * scaleY;
      const vw = p.viewport.width * scaleX;
      const vh = p.viewport.height * scaleY;

      // Viewport fill
      this._viewportRect.rect(vx, vy, vw, vh);
      this._viewportRect.fill({ color: accent, alpha: 0.08 });

      // Viewport border
      this._viewportRect.setStrokeStyle({ width: 1, color: accent, alpha: 0.8 });
      this._viewportRect.rect(vx, vy, vw, vh);
      this._viewportRect.stroke();
    }

    // Outer border with corner brackets
    this._border.clear();
    this._border.setStrokeStyle({ width: 1, color: accent, alpha: 0.5 });
    this._border.rect(0, 0, w, h);
    this._border.stroke();

    const cs = 6;
    this._border.setStrokeStyle({ width: 1.5, color: accent, alpha: 1 });
    this._border.moveTo(0, cs); this._border.lineTo(0, 0); this._border.lineTo(cs, 0);
    this._border.moveTo(w - cs, 0); this._border.lineTo(w, 0); this._border.lineTo(w, cs);
    this._border.moveTo(0, h - cs); this._border.lineTo(0, h); this._border.lineTo(cs, h);
    this._border.moveTo(w - cs, h); this._border.lineTo(w, h); this._border.lineTo(w, h - cs);
    this._border.stroke();

    this.hitArea = new Rectangle(0, 0, w, h);
  }

  protected onDispose(): void {
    // No manual child destruction -- NervBase.destroy() handles children.
  }
}
