import { Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { NervLabel } from '../../primitives/NervLabel';
import { AnimationManager } from '../../core/AnimationManager';
import type { NervColor, Size } from '../../core/types';

export interface NervCheckboxProps extends NervBaseProps {
  checked?: boolean;
  text?: string;
  color?: NervColor;
  size?: number;
  onChange?: (checked: boolean) => void;
}

export class NervCheckbox extends NervBase<NervCheckboxProps> {
  private _box = new Graphics();
  private _check = new Graphics();
  private _label: NervLabel | null = null;

  protected defaultProps(): NervCheckboxProps {
    return { checked: false, text: '', color: 'cyan', size: 16 };
  }

  protected onInit(): void {
    this.addChild(this._box, this._check);

    this.on('pointerup', () => {
      if (this.isDisabled) return;
      const next = !this._props.checked;
      this.setProps({ checked: next });
      AnimationManager.pulse(this._check, 1.2, 150);
      this._props.onChange?.(next);
    });
  }

  getPreferredSize(): Size {
    const s = this._props.size ?? 16;
    const textW = this._props.text ? this._props.text.length * 8 + 8 : 0;
    return { width: s + textW, height: s };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const s = p.size ?? 16;
    const accent = theme.colorForAccent(p.color ?? 'cyan');
    const checked = p.checked ?? false;

    // Box
    this._box.clear();
    this._box.rect(0, 0, s, s);
    this._box.fill({ color: checked ? accent : theme.semantic.bgPanel, alpha: checked ? 0.2 : 1 });
    this._box.setStrokeStyle({ width: 1, color: accent, alpha: this._state.hovered ? 1 : 0.7 });
    this._box.rect(0, 0, s, s);
    this._box.stroke();

    // Checkmark
    this._check.clear();
    this._check.visible = checked;
    if (checked) {
      this._check.setStrokeStyle({ width: 2, color: accent });
      this._check.moveTo(s * 0.2, s * 0.5);
      this._check.lineTo(s * 0.4, s * 0.75);
      this._check.lineTo(s * 0.8, s * 0.25);
      this._check.stroke();
    }

    // Label
    if (this._label) { this._label.destroy({ children: true }); this.removeChild(this._label); this._label = null; }
    if (p.text) {
      this._label = new NervLabel({ text: p.text, role: 'mono', size: theme.fontSizes.sm, rawColor: theme.semantic.textSecondary });
      this._label.x = s + 8;
      this._label.y = Math.round((s - theme.fontSizes.sm) / 2);
      this.addChild(this._label);
    }

    const { width: w, height: h } = this.getPreferredSize();
    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= w && y >= 0 && y <= h };
  }

  protected onDispose(): void {
    this._box.destroy();
    this._check.destroy();
    this._label?.destroy({ children: true });
  }
}
