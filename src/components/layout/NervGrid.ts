import { Container } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import type { Size } from '../../core/types';

export interface NervGridProps extends NervBaseProps {
  columns?: number;
  rows?: number;
  gap?: number;
  cellWidth?: number;
  cellHeight?: number;
}

export class NervGrid extends NervBase<NervGridProps> {
  private _contentContainer = new Container();

  protected defaultProps(): NervGridProps {
    return {
      columns: 3,
      rows: 3,
      gap: 8,
      cellWidth: 80,
      cellHeight: 80,
    };
  }

  protected onInit(): void {
    this.addChild(this._contentContainer);
    this.eventMode = 'static';
  }

  getPreferredSize(): Size {
    const p = this._props;
    const cols = p.columns ?? 3;
    const rows = p.rows ?? 3;
    const gap = p.gap ?? 8;
    const cw = p.cellWidth ?? 80;
    const ch = p.cellHeight ?? 80;

    return {
      width: cols * cw + (cols - 1) * gap,
      height: rows * ch + (rows - 1) * gap,
    };
  }

  /** Add a child to the grid. Children are positioned in order: left-to-right, top-to-bottom. */
  addCell(child: Container): void {
    this._contentContainer.addChild(child);
    this.scheduleRedraw();
  }

  /** Remove a child from the grid. */
  removeCell(child: Container): void {
    this._contentContainer.removeChild(child);
    this.scheduleRedraw();
  }

  /** Get the number of children in the grid. */
  get cellCount(): number {
    return this._contentContainer.children.length;
  }

  protected redraw(): void {
    const p = this._props;
    const cols = p.columns ?? 3;
    const gap = p.gap ?? 8;
    const cw = p.cellWidth ?? 80;
    const ch = p.cellHeight ?? 80;

    const children = this._contentContainer.children;

    for (let i = 0; i < children.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      children[i].x = col * (cw + gap);
      children[i].y = row * (ch + gap);

      // If the child is a NervBase, set its size
      if ('setProps' in children[i]) {
        (children[i] as NervBase).setProps({ width: cw, height: ch } as never);
      }
    }

    const { width: totalW, height: totalH } = this.getPreferredSize();
    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= totalW && y >= 0 && y <= totalH };
  }

  protected onDispose(): void {
    this._contentContainer.destroy({ children: true });
  }
}
