import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervSyncRatioChartProps extends NervBaseProps {
  valueA?: number;
  valueB?: number;
  labelA?: string;
  labelB?: string;
  color?: NervColor;
}

export class NervSyncRatioChart extends NervBase<NervSyncRatioChartProps> {
  private _barA = new Graphics();
  private _barB = new Graphics();
  private _divider = new Graphics();
  private _textPool: Text[] = [];
  private _textPoolUsed = 0;

  protected defaultProps(): NervSyncRatioChartProps {
    return {
      valueA: 50,
      valueB: 50,
      labelA: 'A',
      labelB: 'B',
      color: 'orange',
      width: 260,
      height: 40,
      interactive: false,
    };
  }

  protected onInit(): void {
    this.addChild(this._barA, this._barB, this._divider);
  }

  getPreferredSize(): Size {
    return {
      width: this._props.width ?? 260,
      height: this._props.height ?? 40,
    };
  }

  private _acquireText(opts: Parameters<typeof TextRenderer.create>[0]): Text {
    if (this._textPoolUsed < this._textPool.length) {
      const t = this._textPool[this._textPoolUsed];
      t.visible = true;
      TextRenderer.updateText(t, opts.text, opts.uppercase ?? true);
      TextRenderer.updateStyle(t, { color: opts.color, size: opts.size, alpha: opts.alpha });
      this._textPoolUsed++;
      return t;
    }
    const t = TextRenderer.create(opts);
    this._textPool.push(t);
    this.addChild(t);
    this._textPoolUsed++;
    return t;
  }

  private _reclaimPool(): void {
    for (let i = this._textPoolUsed; i < this._textPool.length; i++) {
      this._textPool[i].visible = false;
    }
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const w = this.componentWidth;
    const h = this.componentHeight;
    const vA = p.valueA ?? 50;
    const vB = p.valueB ?? 50;
    const total = vA + vB;
    const accent = theme.colorForAccent(p.color ?? 'orange');

    this._textPoolUsed = 0;

    this._barA.clear();
    this._barB.clear();
    this._divider.clear();

    if (total <= 0) {
      this._reclaimPool();
      return;
    }

    const ratioA = vA / total;
    const labelH = theme.fontSizes.sm + theme.spacing.xs;
    const barY = labelH;
    const barH = h - labelH * 2;
    const barWA = w * ratioA;
    const barWB = w - barWA;

    // Bar A (left, accent color)
    this._barA.rect(0, barY, barWA, barH);
    this._barA.fill({ color: accent, alpha: 0.8 });

    // Bar B (right, secondary color)
    const secondaryColor = theme.semantic.accentSecondary;
    this._barB.rect(barWA, barY, barWB, barH);
    this._barB.fill({ color: secondaryColor, alpha: 0.8 });

    // Center divider line
    this._divider.setStrokeStyle({ width: 1, color: theme.semantic.bgBase });
    this._divider.moveTo(barWA, barY);
    this._divider.lineTo(barWA, barY + barH);
    this._divider.stroke();

    // Label A (top left)
    const ltA = this._acquireText({
      text: `${p.labelA ?? 'A'}`,
      role: 'mono',
      size: theme.fontSizes.xs,
      color: accent,
    });
    ltA.x = theme.spacing.xs;
    ltA.y = 0;

    // Value A (inside left bar)
    const vtA = this._acquireText({
      text: `${Math.round(ratioA * 100)}%`,
      role: 'mono',
      size: theme.fontSizes.sm,
      color: theme.semantic.textPrimary,
    });
    vtA.x = Math.max(2, barWA / 2 - vtA.width / 2);
    vtA.y = barY + barH / 2 - vtA.height / 2;

    // Label B (top right)
    const ltB = this._acquireText({
      text: `${p.labelB ?? 'B'}`,
      role: 'mono',
      size: theme.fontSizes.xs,
      color: secondaryColor,
    });
    ltB.x = w - ltB.width - theme.spacing.xs;
    ltB.y = 0;

    // Value B (inside right bar)
    const vtB = this._acquireText({
      text: `${Math.round((1 - ratioA) * 100)}%`,
      role: 'mono',
      size: theme.fontSizes.sm,
      color: theme.semantic.textPrimary,
    });
    vtB.x = Math.min(w - vtB.width - 2, barWA + barWB / 2 - vtB.width / 2);
    vtB.y = barY + barH / 2 - vtB.height / 2;

    // Bottom labels: raw values
    const rawA = this._acquireText({
      text: String(vA),
      role: 'mono',
      size: theme.fontSizes.xs,
      color: theme.semantic.textMuted,
    });
    rawA.x = theme.spacing.xs;
    rawA.y = barY + barH + theme.spacing.xxs;

    const rawB = this._acquireText({
      text: String(vB),
      role: 'mono',
      size: theme.fontSizes.xs,
      color: theme.semantic.textMuted,
    });
    rawB.x = w - rawB.width - theme.spacing.xs;
    rawB.y = barY + barH + theme.spacing.xxs;

    this._reclaimPool();
  }

  protected onDispose(): void {
    // No manual child destruction -- NervBase.destroy() handles children.
  }
}
