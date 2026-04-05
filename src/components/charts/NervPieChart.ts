import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface PieChartDatum {
  label: string;
  value: number;
  color: NervColor;
}

export interface NervPieChartProps extends NervBaseProps {
  data?: PieChartDatum[];
  size?: number;
  donut?: boolean;
  donutWidth?: number;
  showLabels?: boolean;
}

// Default palette rotation when drawing segments
const SEGMENT_COLORS: NervColor[] = ['orange', 'cyan', 'green', 'red', 'purple', 'amber', 'magenta', 'lcdGreen'];

export class NervPieChart extends NervBase<NervPieChartProps> {
  private _segments = new Graphics();
  private _textNodes: Text[] = [];

  protected defaultProps(): NervPieChartProps {
    return {
      data: [],
      size: 160,
      donut: false,
      donutWidth: 20,
      showLabels: true,
    };
  }

  protected onInit(): void {
    this.addChild(this._segments);
  }

  getPreferredSize(): Size {
    const s = this._props.size ?? 160;
    return { width: s, height: s };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const data = p.data ?? [];
    const s = p.size ?? 160;
    const cx = s / 2;
    const cy = s / 2;
    const r = s / 2 - 2;
    const isDonut = p.donut ?? false;
    const donutW = p.donutWidth ?? 20;
    const innerR = isDonut ? Math.max(0, r - donutW) : 0;

    // Clean up text nodes
    for (const t of this._textNodes) { this.removeChild(t); t.destroy(); }
    this._textNodes = [];

    this._segments.clear();

    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total <= 0 || data.length === 0) return;

    let currentAngle = -Math.PI / 2; // start at top

    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const sliceAngle = (d.value / total) * Math.PI * 2;
      const endAngle = currentAngle + sliceAngle;
      const color = theme.colorForAccent(d.color ?? SEGMENT_COLORS[i % SEGMENT_COLORS.length]);

      if (isDonut) {
        // Draw donut segment as two arcs connected by lines
        // Outer arc
        this._segments.moveTo(
          cx + Math.cos(currentAngle) * r,
          cy + Math.sin(currentAngle) * r,
        );
        this._segments.arc(cx, cy, r, currentAngle, endAngle);
        // Line to inner arc
        this._segments.lineTo(
          cx + Math.cos(endAngle) * innerR,
          cy + Math.sin(endAngle) * innerR,
        );
        // Inner arc (reverse direction)
        this._segments.arc(cx, cy, innerR, endAngle, currentAngle, true);
        this._segments.closePath();
        this._segments.fill({ color, alpha: 0.85 });
      } else {
        // Filled pie slice
        this._segments.moveTo(cx, cy);
        this._segments.arc(cx, cy, r, currentAngle, endAngle);
        this._segments.lineTo(cx, cy);
        this._segments.closePath();
        this._segments.fill({ color, alpha: 0.85 });
      }

      // Segment border
      this._segments.setStrokeStyle({ width: 1, color: theme.semantic.bgBase, alpha: 0.6 });
      if (isDonut) {
        this._segments.moveTo(
          cx + Math.cos(currentAngle) * r,
          cy + Math.sin(currentAngle) * r,
        );
        this._segments.arc(cx, cy, r, currentAngle, endAngle);
        this._segments.lineTo(
          cx + Math.cos(endAngle) * innerR,
          cy + Math.sin(endAngle) * innerR,
        );
        this._segments.arc(cx, cy, innerR, endAngle, currentAngle, true);
        this._segments.closePath();
        this._segments.stroke();
      } else {
        this._segments.moveTo(cx, cy);
        this._segments.arc(cx, cy, r, currentAngle, endAngle);
        this._segments.closePath();
        this._segments.stroke();
      }

      // Label
      if (p.showLabels) {
        const midAngle = currentAngle + sliceAngle / 2;
        const labelR = isDonut ? r + 10 : r * 0.65;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;

        const pct = Math.round((d.value / total) * 100);
        const labelStr = `${d.label} ${pct}%`;

        const lt = TextRenderer.create({
          text: labelStr,
          role: 'mono',
          size: theme.fontSizes.xs,
          color: isDonut ? theme.semantic.textSecondary : theme.semantic.textPrimary,
          uppercase: false,
        });
        lt.x = lx - lt.width / 2;
        lt.y = ly - lt.height / 2;
        this.addChild(lt);
        this._textNodes.push(lt);
      }

      currentAngle = endAngle;
    }
  }

  protected onDispose(): void {
    this._segments.destroy();
    for (const t of this._textNodes) t.destroy();
  }
}
