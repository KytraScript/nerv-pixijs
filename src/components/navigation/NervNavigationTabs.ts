import { Graphics, Rectangle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import { AnimationManager, Easing } from '../../core/AnimationManager';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface TabItem {
  label: string;
  value: string;
}

export interface NervNavigationTabsProps extends NervBaseProps {
  tabs?: TabItem[];
  selected?: string;
  color?: NervColor;
  onChange?: (value: string) => void;
}

interface NervNavigationTabsState extends NervBaseState {
  hoveredTab: number;
}

export class NervNavigationTabs extends NervBase<NervNavigationTabsProps, NervNavigationTabsState> {
  private _bg = new Graphics();
  private _indicator = new Graphics();
  private _tabBgs: Graphics[] = [];
  private _tabTexts: Text[] = [];

  constructor(props: NervNavigationTabsProps) {
    super(props, { focused: false, hovered: false, pressed: false, hoveredTab: -1 });
  }

  protected defaultProps(): NervNavigationTabsProps {
    return {
      tabs: [],
      selected: '',
      color: 'orange',
    };
  }

  protected onInit(): void {
    this.addChild(this._bg);
  }

  getPreferredSize(): Size {
    const tabs = this._props.tabs ?? [];
    const tabW = 100;
    return {
      width: this._props.width ?? Math.max(tabs.length * tabW, 200),
      height: 36,
    };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const tabs = p.tabs ?? [];
    const { width: w, height: h } = this.getPreferredSize();

    // Remove previous dynamic elements from parent (don't destroy -- children: true handles it)
    for (const g of this._tabBgs) { this.removeChild(g); }
    for (const t of this._tabTexts) { this.removeChild(t); }
    this._tabBgs = [];
    this._tabTexts = [];
    if (this._indicator.parent) this.removeChild(this._indicator);

    // Bottom line
    this._bg.clear();
    this._bg.setStrokeStyle({ width: 1, color: theme.semantic.borderDefault, alpha: 0.3 });
    this._bg.moveTo(0, h - 1);
    this._bg.lineTo(w, h - 1);
    this._bg.stroke();

    if (tabs.length === 0) return;

    const tabW = w / tabs.length;
    const selectedIdx = tabs.findIndex(t => t.value === p.selected);

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const tx = i * tabW;
      const isSelected = i === selectedIdx;
      const isHov = this._state.hoveredTab === i;

      // Tab hit area
      const tabBg = new Graphics();
      if (isHov && !isSelected) {
        tabBg.rect(tx, 0, tabW, h);
        tabBg.fill({ color: accent, alpha: 0.06 });
      }

      tabBg.eventMode = 'static';
      tabBg.cursor = 'pointer';
      tabBg.hitArea = new Rectangle(tx, 0, tabW, h);

      const idx = i;
      tabBg.on('pointerover', () => this.setState({ hoveredTab: idx }));
      tabBg.on('pointerout', () => this.setState({ hoveredTab: -1 }));
      tabBg.on('pointerup', () => {
        p.onChange?.(tabs[idx].value);
      });

      this.addChild(tabBg);
      this._tabBgs.push(tabBg);

      // Tab label
      const txt = TextRenderer.create({
        text: tab.label,
        role: 'display',
        size: theme.fontSizes.sm,
        color: isSelected ? accent : theme.semantic.textSecondary,
      });
      txt.x = Math.round(tx + (tabW - txt.width) / 2);
      txt.y = Math.round((h - 3 - txt.height) / 2);
      this.addChild(txt);
      this._tabTexts.push(txt);
    }

    // Active indicator line
    this._indicator.clear();
    if (selectedIdx >= 0) {
      const ix = selectedIdx * tabW;
      this._indicator.setStrokeStyle({ width: 2, color: accent, alpha: 1 });
      this._indicator.moveTo(ix, h - 1);
      this._indicator.lineTo(ix + tabW, h - 1);
      this._indicator.stroke();
    }
    this.addChild(this._indicator);

    this.hitArea = new Rectangle(0, 0, w, h);
  }

  protected onDispose(): void {
    // No manual child destruction -- NervBase.destroy() handles children.
  }
}
