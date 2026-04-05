import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import type { NervColor, Size } from '../../core/types';

export interface NervNodeConnectorProps extends NervBaseProps {
  from?: NervBase;
  to?: NervBase;
  color?: NervColor;
  lineWidth?: number;
  curved?: boolean;
}

export class NervNodeConnector extends NervBase<NervNodeConnectorProps> {
  private _line = new Graphics();

  protected defaultProps(): NervNodeConnectorProps {
    return {
      color: 'orange',
      lineWidth: 1.5,
      curved: true,
      interactive: false,
    };
  }

  protected onInit(): void {
    this.addChild(this._line);
  }

  getPreferredSize(): Size {
    // The connector spans dynamically between two nodes; no fixed preferred size
    return { width: 0, height: 0 };
  }

  /** Call this to refresh the connection line when nodes move. */
  update(): void {
    this.scheduleRedraw();
  }

  private _getEndpoints(): { x1: number; y1: number; x2: number; y2: number } | null {
    const from = this._props.from;
    const to = this._props.to;
    if (!from || !to) return null;

    // Get world positions and compute center points
    const fromBounds = from.getBounds();
    const toBounds = to.getBounds();

    const x1 = fromBounds.x + fromBounds.width / 2;
    const y1 = fromBounds.y + fromBounds.height / 2;
    const x2 = toBounds.x + toBounds.width / 2;
    const y2 = toBounds.y + toBounds.height / 2;

    return { x1, y1, x2, y2 };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const lineW = p.lineWidth ?? 1.5;
    const curved = p.curved ?? true;

    this._line.clear();

    const ep = this._getEndpoints();
    if (!ep) return;

    const { x1, y1, x2, y2 } = ep;

    this._line.setStrokeStyle({ width: lineW, color: accent, alpha: 0.8 });

    if (curved) {
      // Bezier curve - control points offset horizontally
      const dx = Math.abs(x2 - x1);
      const cpOffset = Math.max(dx * 0.4, 30);

      this._line.moveTo(x1, y1);
      this._line.bezierCurveTo(
        x1 + cpOffset, y1,
        x2 - cpOffset, y2,
        x2, y2
      );
    } else {
      // Straight line
      this._line.moveTo(x1, y1);
      this._line.lineTo(x2, y2);
    }

    this._line.stroke();

    // Small endpoint dots
    this._line.circle(x1, y1, 3);
    this._line.fill({ color: accent, alpha: 0.9 });
    this._line.circle(x2, y2, 3);
    this._line.fill({ color: accent, alpha: 0.9 });
  }

  protected onDispose(): void {
    // No manual child destruction -- NervBase.destroy() handles children.
  }
}
