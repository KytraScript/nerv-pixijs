import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import { AnimationManager } from '../../core/AnimationManager';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervChipProps extends NervBaseProps {
  text?: string;
  color?: NervColor;
  removable?: boolean;
  onRemove?: () => void;
}

const PADDING_X = 10;
const PADDING_Y = 4;
const BORDER_RADIUS = 3;
const CLOSE_SIZE = 10;
const CLOSE_GAP = 6;

export class NervChip extends NervBase<NervChipProps> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _closeBtn = new Graphics();
  private _label: Text | null = null;
  private _closeX: Text | null = null;

  protected defaultProps(): NervChipProps {
    return {
      text: 'CHIP',
      color: 'cyan',
      removable: false,
    };
  }

  protected onInit(): void {
    this.addChild(this._bg, this._border, this._closeBtn);

    this._closeBtn.eventMode = 'static';
    this._closeBtn.cursor = 'pointer';
    this._closeBtn.on('pointerup', () => {
      if (!this.isDisabled && this._props.removable) {
        AnimationManager.pulse(this, 0.95, 100);
        this._props.onRemove?.();
      }
    });
  }

  getPreferredSize(): Size {
    const text = this._props.text ?? 'CHIP';
    const fontSize = this.theme.fontSizes.sm;
    const charWidth = fontSize * 0.65;
    const closeExtra = this._props.removable ? CLOSE_SIZE + CLOSE_GAP : 0;
    return {
      width: Math.max(text.length * charWidth + PADDING_X * 2 + closeExtra, 32),
      height: fontSize + PADDING_Y * 2,
    };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'cyan');
    const { width: w, height: h } = this.getPreferredSize();
    const hovered = this._state.hovered && !p.disabled;

    // Background
    this._bg.clear();
    this._bg.roundRect(0, 0, w, h, BORDER_RADIUS);
    this._bg.fill({ color: hovered ? accent : theme.semantic.bgPanel, alpha: hovered ? 0.2 : 0.8 });

    // Border
    this._border.clear();
    this._border.setStrokeStyle({ width: 1, color: accent, alpha: 0.7 });
    this._border.roundRect(0, 0, w, h, BORDER_RADIUS);
    this._border.stroke();

    // Label
    if (this._label) { this._label.destroy(); this.removeChild(this._label); }
    this._label = TextRenderer.create({
      text: p.text ?? 'CHIP',
      role: 'mono',
      size: theme.fontSizes.sm,
      color: accent,
    });
    this._label.x = PADDING_X;
    this._label.y = Math.round((h - this._label.height) / 2);
    this.addChild(this._label);

    // Close button
    this._closeBtn.clear();
    if (this._closeX) { this._closeX.destroy(); this.removeChild(this._closeX); this._closeX = null; }

    if (p.removable) {
      const closeX = w - PADDING_X - CLOSE_SIZE;
      const closeY = Math.round((h - CLOSE_SIZE) / 2);

      // X mark drawn as lines
      this._closeBtn.setStrokeStyle({ width: 1.5, color: accent, alpha: 0.8 });
      this._closeBtn.moveTo(closeX, closeY);
      this._closeBtn.lineTo(closeX + CLOSE_SIZE, closeY + CLOSE_SIZE);
      this._closeBtn.moveTo(closeX + CLOSE_SIZE, closeY);
      this._closeBtn.lineTo(closeX, closeY + CLOSE_SIZE);
      this._closeBtn.stroke();

      this._closeBtn.hitArea = {
        contains: (x: number, y: number) =>
          x >= closeX - 4 && x <= closeX + CLOSE_SIZE + 4 &&
          y >= closeY - 4 && y <= closeY + CLOSE_SIZE + 4,
      };
    }

    this.cursor = p.disabled ? 'default' : 'pointer';
    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= w && y >= 0 && y <= h };
  }

  protected onDispose(): void {
    this._bg.destroy();
    this._border.destroy();
    this._closeBtn.destroy();
    this._label?.destroy();
    this._closeX?.destroy();
  }
}
