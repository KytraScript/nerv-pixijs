import { Container } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { GridPattern } from '../../effects/GridPattern';
import type { NervColor, Size } from '../../core/types';

export interface HexGridBackgroundProps extends NervBaseProps {
  cellSize?: number;
  color?: NervColor;
  rawColor?: number;
  gridAlpha?: number;
  lineWidth?: number;
}

export class HexGridBackground extends NervBase<HexGridBackgroundProps> {
  private _grid: GridPattern | null = null;
  private _contentArea = new Container();

  protected defaultProps(): HexGridBackgroundProps {
    return {
      width: 400,
      height: 300,
      cellSize: 30,
      gridAlpha: 0.15,
      lineWidth: 0.5,
    };
  }

  protected onInit(): void {
    this.addChild(this._contentArea);
    this.eventMode = 'none';
    this.interactiveChildren = true;
  }

  getPreferredSize(): Size {
    return {
      width: this._props.width ?? 400,
      height: this._props.height ?? 300,
    };
  }

  /** Add children that will render on top of the hex grid. */
  addContent(child: Container): void {
    this._contentArea.addChild(child);
  }

  removeContent(child: Container): void {
    this._contentArea.removeChild(child);
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const w = this.componentWidth;
    const h = this.componentHeight;

    // Determine grid color
    const gridColor = p.rawColor
      ?? (p.color ? theme.colorForAccent(p.color) : theme.semantic.borderDefault);

    // Rebuild grid
    if (this._grid) {
      this.removeChild(this._grid);
      this._grid.destroy();
    }

    this._grid = new GridPattern();
    this._grid.drawHexGrid({
      width: w,
      height: h,
      cellSize: p.cellSize ?? 30,
      color: gridColor,
      alpha: p.gridAlpha ?? 0.15,
      lineWidth: p.lineWidth ?? 0.5,
    });

    // Insert grid behind content
    this.addChildAt(this._grid, 0);

    // Content stays on top
    this.setChildIndex(this._contentArea, this.children.length - 1);
  }

  protected onDispose(): void {
    this._grid?.destroy();
    this._contentArea.destroy({ children: true });
  }
}
