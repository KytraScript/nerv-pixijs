import { Graphics, Container, Rectangle, TextStyle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import { AnimationManager } from '../../core/AnimationManager';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervSelectOption {
  value: string;
  label: string;
}

export interface NervSelectMenuProps extends NervBaseProps {
  options: NervSelectOption[];
  selected?: string;
  placeholder?: string;
  selectLabel?: string;
  color?: NervColor;
  maxVisibleOptions?: number;
  onChange?: (value: string) => void;
}

interface SelectState {
  focused: boolean;
  hovered: boolean;
  pressed: boolean;
  open: boolean;
  hoveredIndex: number;
}

export class NervSelectMenu extends NervBase<NervSelectMenuProps, SelectState> {
  private _trigger = new Graphics();
  private _triggerText: Text | null = null;
  private _arrow = new Graphics();
  private _labelText: Text | null = null;
  private _dropdown: Container | null = null;

  constructor(props: NervSelectMenuProps) {
    super(props, { focused: false, hovered: false, pressed: false, open: false, hoveredIndex: -1 });
  }

  protected defaultProps(): NervSelectMenuProps {
    return { width: 200, options: [], color: 'cyan', placeholder: 'SELECT...', maxVisibleOptions: 6 };
  }

  protected onInit(): void {
    // Create persistent text objects once; updated in-place in redraw()
    this._labelText = TextRenderer.create({ text: '', role: 'mono', size: 10, color: 0x888888 });
    this._labelText.visible = false;
    this._triggerText = TextRenderer.create({ text: '', role: 'mono', size: 12, color: 0xffffff });

    this.addChild(this._trigger, this._arrow, this._labelText, this._triggerText);

    this.on('pointerdown', (e) => { e.stopPropagation(); });
    this.on('pointerup', (e) => {
      e.stopPropagation();
      if (this.isDisabled) return;
      this.setState({ open: !this._state.open });
    });
  }

  getPreferredSize(): Size {
    const labelH = this._props.selectLabel ? 18 : 0;
    return { width: this._props.width ?? 200, height: 36 + labelH };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const w = p.width ?? 200;
    const accent = theme.colorForAccent(p.color ?? 'cyan');
    const hasLabel = !!p.selectLabel;
    const labelH = hasLabel ? 18 : 0;
    const triggerH = 36;
    const triggerY = labelH;
    const selected = (p.options ?? []).find(o => o.value === p.selected);

    // Label -- update in-place
    if (hasLabel) {
      this._labelText!.visible = true;
      this._labelText!.text = `// ${p.selectLabel}`.toUpperCase();
      (this._labelText!.style as TextStyle).fill = theme.semantic.textMuted;
      this._labelText!.x = 2;
      this._labelText!.y = 0;
    } else {
      this._labelText!.visible = false;
    }

    // Trigger
    this._trigger.clear();
    this._trigger.rect(0, triggerY, w, triggerH);
    this._trigger.fill({ color: theme.semantic.bgPanel });
    this._trigger.setStrokeStyle({ width: 1, color: this._state.open ? accent : theme.semantic.borderDefault, alpha: this._state.open ? 1 : 0.7 });
    this._trigger.rect(0, triggerY, w, triggerH);
    this._trigger.stroke();

    // Trigger text -- update in-place
    const displayText = selected?.label ?? p.placeholder ?? 'SELECT...';
    this._triggerText!.text = displayText.toUpperCase();
    (this._triggerText!.style as TextStyle).fill = selected ? theme.semantic.textPrimary : theme.semantic.textMuted;
    this._triggerText!.x = 8;
    this._triggerText!.y = triggerY + Math.round((triggerH - 12) / 2);

    // Arrow
    this._arrow.clear();
    const arrowX = w - 16;
    const arrowY = triggerY + triggerH / 2;
    this._arrow.setStrokeStyle({ width: 1.5, color: accent });
    if (this._state.open) {
      this._arrow.moveTo(arrowX - 4, arrowY + 2);
      this._arrow.lineTo(arrowX, arrowY - 2);
      this._arrow.lineTo(arrowX + 4, arrowY + 2);
    } else {
      this._arrow.moveTo(arrowX - 4, arrowY - 2);
      this._arrow.lineTo(arrowX, arrowY + 2);
      this._arrow.lineTo(arrowX + 4, arrowY - 2);
    }
    this._arrow.stroke();

    // Only rebuild dropdown when open state changes, not on every hover redraw
    const shouldBeOpen = this._state.open;
    const isCurrentlyOpen = this._dropdown !== null;

    if (!shouldBeOpen && isCurrentlyOpen) {
      this.removeChild(this._dropdown!);
      this._dropdown!.destroy({ children: true });
      this._dropdown = null;
    }

    if (shouldBeOpen && !isCurrentlyOpen) {
      const options = p.options ?? [];
      const maxVis = p.maxVisibleOptions ?? 6;
      const visCount = Math.min(options.length, maxVis);
      const optH = 32;
      const ddH = visCount * optH;

      this._dropdown = new Container();
      this._dropdown.y = triggerY + triggerH + 2;
      this._dropdown.eventMode = 'static';
      this._dropdown.interactiveChildren = true;
      this._dropdown.on('pointerdown', (e) => { e.stopPropagation(); });

      const ddBg = new Graphics();
      ddBg.rect(0, 0, w, ddH);
      ddBg.fill({ color: 0x0A0A14 });
      ddBg.rect(0, 0, w, ddH);
      ddBg.stroke({ width: 1, color: accent, alpha: 0.5 });
      this._dropdown.addChild(ddBg);

      options.slice(0, maxVis).forEach((opt, i) => {
        const optContainer = new Container();
        optContainer.y = i * optH;
        optContainer.eventMode = 'static';
        optContainer.cursor = 'pointer';
        optContainer.interactiveChildren = false;

        const isSelected = p.selected === opt.value;

        const optBg = new Graphics();
        optBg.rect(0, 0, w, optH);
        optBg.fill({ color: 0x0A0A14, alpha: 0 });
        optContainer.addChild(optBg);

        const optText = TextRenderer.create({
          text: opt.label,
          role: 'mono',
          size: 12,
          color: isSelected ? accent : theme.semantic.textPrimary,
        });
        optText.x = 8;
        optText.y = Math.round((optH - 12) / 2);
        optContainer.addChild(optText);

        if (isSelected) {
          const checkmark = TextRenderer.create({ text: '>', role: 'mono', size: 12, color: accent });
          checkmark.x = w - 20;
          checkmark.y = Math.round((optH - 12) / 2);
          optContainer.addChild(checkmark);
        }

        optContainer.on('pointerover', () => {
          optBg.clear();
          optBg.rect(0, 0, w, optH);
          optBg.fill({ color: accent, alpha: 0.2 });
        });
        optContainer.on('pointerout', () => {
          optBg.clear();
          optBg.rect(0, 0, w, optH);
          optBg.fill({ color: 0x0A0A14, alpha: 0 });
        });
        optContainer.on('pointerdown', (e) => { e.stopPropagation(); });
        optContainer.on('pointerup', (e) => {
          e.stopPropagation();
          this.setProps({ selected: opt.value });
          this.setState({ open: false });
          p.onChange?.(opt.value);
        });
        optContainer.hitArea = new Rectangle(0, 0, w, optH);

        this._dropdown!.addChild(optContainer);
      });

      this.addChild(this._dropdown);
    }

    this.hitArea = new Rectangle(0, 0, w, triggerY + triggerH);
  }

  protected onDispose(): void {
    // NervBase.destroy() passes { children: true }, so child Graphics/Text/Container
    // are auto-destroyed. Nothing extra to clean up here.
  }
}
