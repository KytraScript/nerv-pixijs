import { Graphics, Container, Rectangle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { NervLabel } from '../../primitives/NervLabel';
import { AnimationManager } from '../../core/AnimationManager';
import type { NervColor, Size } from '../../core/types';

export interface NervRadioOption {
  value: string;
  label: string;
}

export interface NervRadioGroupProps extends NervBaseProps {
  options: NervRadioOption[];
  selected?: string;
  color?: NervColor;
  direction?: 'row' | 'column';
  gap?: number;
  radioSize?: number;
  onChange?: (value: string) => void;
}

export class NervRadioGroup extends NervBase<NervRadioGroupProps> {
  private _items: Container[] = [];
  private _lastSelected: string | undefined = undefined;
  private _built = false;

  protected defaultProps(): NervRadioGroupProps {
    return { options: [], color: 'cyan', direction: 'column', gap: 8, radioSize: 14 };
  }

  getPreferredSize(): Size {
    const p = this._props;
    const s = p.radioSize ?? 14;
    const gap = p.gap ?? 8;
    const count = (p.options ?? []).length;
    const itemH = Math.max(s, 16);

    if (p.direction === 'row') {
      const totalW = count * (s + 80) + (count - 1) * gap;
      return { width: totalW, height: itemH };
    }
    return { width: 200, height: count * itemH + (count - 1) * gap };
  }

  protected redraw(): void {
    const p = this._props;

    // Only rebuild items when selection or options change, not on hover
    if (this._built && this._lastSelected === p.selected) return;
    this._lastSelected = p.selected;
    this._built = true;

    // Clear old items
    for (const item of this._items) { this.removeChild(item); item.destroy({ children: true }); }
    this._items = [];

    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'cyan');
    const s = p.radioSize ?? 14;
    const gap = p.gap ?? 8;
    const isRow = p.direction === 'row';
    const itemH = Math.max(s, 16);

    (p.options ?? []).forEach((opt, i) => {
      const container = new Container();
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.interactiveChildren = false;

      const isSelected = p.selected === opt.value;
      const cx = s / 2;
      const cy = s / 2;

      const outer = new Graphics();
      outer.circle(cx, cy, s / 2);
      outer.stroke({ width: 1, color: isSelected ? accent : theme.semantic.borderDefault, alpha: 0.8 });
      container.addChild(outer);

      if (isSelected) {
        const inner = new Graphics();
        inner.circle(cx, cy, s / 2 - 4);
        inner.fill({ color: accent });
        container.addChild(inner);
      }

      const label = new NervLabel({ text: opt.label, role: 'mono', size: theme.fontSizes.sm, rawColor: theme.semantic.textSecondary, interactive: false });
      label.x = s + 6;
      label.y = Math.round((s - theme.fontSizes.sm) / 2);
      container.addChild(label);

      if (isRow) {
        container.x = i * (s + 80 + gap);
      } else {
        container.y = i * (itemH + gap);
      }

      container.on('pointerdown', (e) => { e.stopPropagation(); });
      container.on('pointerup', (e) => {
        e.stopPropagation();
        if (this.isDisabled) return;
        this.setProps({ selected: opt.value });
        p.onChange?.(opt.value);
      });

      container.hitArea = new Rectangle(0, 0, s + 80, itemH);

      this.addChild(container);
      this._items.push(container);
    });
  }

  protected onDispose(): void {
    this._items = [];
  }
}
