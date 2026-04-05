import { Graphics, Rectangle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import { AnimationManager, Easing } from '../../core/AnimationManager';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface ContextMenuItem {
  label: string;
  onClick?: () => void;
  divider?: boolean;
  disabled?: boolean;
}

export interface NervContextMenuProps extends NervBaseProps {
  items?: ContextMenuItem[];
  color?: NervColor;
}

interface NervContextMenuState extends NervBaseState {
  hoveredIndex: number;
}

export class NervContextMenu extends NervBase<NervContextMenuProps, NervContextMenuState> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _itemGraphics: Graphics[] = [];
  private _itemTexts: Text[] = [];
  private _closeListener: ((e: Event) => void) | null = null;

  constructor(props: NervContextMenuProps) {
    super(props, { focused: false, hovered: false, pressed: false, hoveredIndex: -1 });
  }

  protected defaultProps(): NervContextMenuProps {
    return {
      items: [],
      color: 'orange',
    };
  }

  protected onInit(): void {
    this.addChild(this._bg, this._border);
    this.visible = false;
  }

  getPreferredSize(): Size {
    const items = this._props.items ?? [];
    const itemH = 26;
    const dividerH = 9;
    let totalH = 8; // top + bottom padding
    for (const item of items) {
      totalH += item.divider ? dividerH : itemH;
    }

    const maxLabelLen = Math.max(...items.map(i => i.label.length), 6);
    const charW = this.theme.fontSizes.sm * 0.6;
    return {
      width: Math.max(maxLabelLen * charW + 32, 120),
      height: totalH,
    };
  }

  openAt(x: number, y: number): void {
    this.setProps({ x, y });
    this.visible = true;
    this.alpha = 0;
    AnimationManager.tween(this, { alpha: 1 } as never, 120, { easing: Easing.easeOutQuad });

    // Close on click outside (use a small delay so the opening click doesn't close it)
    setTimeout(() => {
      this._closeListener = () => this.close();
      globalThis.addEventListener?.('pointerdown', this._closeListener, { once: true });
    }, 50);
  }

  close(): void {
    if (this._closeListener) {
      globalThis.removeEventListener?.('pointerdown', this._closeListener);
      this._closeListener = null;
    }
    AnimationManager.tween(this, { alpha: 0 } as never, 100, {
      easing: Easing.easeInQuad,
      onComplete: () => { this.visible = false; },
    });
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const items = p.items ?? [];
    const { width: w, height: h } = this.getPreferredSize();

    // Remove previous dynamic items from parent (don't destroy -- children: true handles it)
    for (const g of this._itemGraphics) { this.removeChild(g); }
    for (const t of this._itemTexts) { this.removeChild(t); }
    this._itemGraphics = [];
    this._itemTexts = [];

    // Background
    this._bg.clear();
    this._bg.rect(0, 0, w, h);
    this._bg.fill({ color: theme.semantic.bgPanel, alpha: 0.95 });

    // Border
    this._border.clear();
    this._border.setStrokeStyle({ width: 1, color: accent, alpha: 0.6 });
    this._border.rect(0, 0, w, h);
    this._border.stroke();

    // Items
    const itemH = 26;
    const dividerH = 9;
    const pad = 4;
    let cy = pad;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.divider) {
        const divLine = new Graphics();
        divLine.setStrokeStyle({ width: 1, color: accent, alpha: 0.2 });
        divLine.moveTo(pad, cy + Math.floor(dividerH / 2));
        divLine.lineTo(w - pad, cy + Math.floor(dividerH / 2));
        divLine.stroke();
        this.addChild(divLine);
        this._itemGraphics.push(divLine);
        cy += dividerH;
        continue;
      }

      const itemBg = new Graphics();
      const isHovered = this._state.hoveredIndex === i;

      if (isHovered && !item.disabled) {
        itemBg.rect(pad, cy, w - pad * 2, itemH);
        itemBg.fill({ color: accent, alpha: 0.2 });
      }

      itemBg.eventMode = 'static';
      itemBg.cursor = item.disabled ? 'default' : 'pointer';
      itemBg.hitArea = new Rectangle(pad, cy, w - pad * 2, itemH);

      const idx = i;
      itemBg.on('pointerover', () => {
        if (!items[idx].disabled) this.setState({ hoveredIndex: idx });
      });
      itemBg.on('pointerout', () => {
        this.setState({ hoveredIndex: -1 });
      });
      itemBg.on('pointerup', () => {
        if (!items[idx].disabled) {
          items[idx].onClick?.();
          this.close();
        }
      });

      this.addChild(itemBg);
      this._itemGraphics.push(itemBg);

      const txt = TextRenderer.create({
        text: item.label,
        role: 'mono',
        size: theme.fontSizes.sm,
        color: item.disabled ? theme.semantic.textMuted : theme.semantic.textPrimary,
        alpha: item.disabled ? 0.4 : 1,
      });
      txt.x = pad + 8;
      txt.y = cy + Math.round((itemH - txt.height) / 2);
      this.addChild(txt);
      this._itemTexts.push(txt);

      cy += itemH;
    }

    this.hitArea = new Rectangle(0, 0, w, h);
  }

  protected onDispose(): void {
    // Clean up global listener only -- NervBase.destroy() handles children.
    if (this._closeListener) {
      globalThis.removeEventListener?.('pointerdown', this._closeListener);
      this._closeListener = null;
    }
  }
}
