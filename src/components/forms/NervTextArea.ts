import { Graphics, Text, TextStyle, Rectangle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { KeyboardEventHandler } from '../../core/InputManager';
import type { NervColor, Size } from '../../core/types';

export interface NervTextAreaProps extends NervBaseProps {
  value?: string;
  placeholder?: string;
  textareaLabel?: string;
  color?: NervColor;
  rows?: number;
  maxLength?: number;
  onChange?: (value: string) => void;
}

interface NervTextAreaState extends NervBaseState {
  cursorVisible: boolean;
}

export class NervTextArea extends NervBase<NervTextAreaProps, NervTextAreaState> implements KeyboardEventHandler {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _valueText: Text | null = null;
  private _placeholderText: Text | null = null;
  private _labelText: Text | null = null;
  private _cursor = new Graphics();
  private _cursorTimer: ReturnType<typeof setInterval> | null = null;
  private _internalValue = '';

  constructor(props: NervTextAreaProps) {
    super(props, { focused: false, hovered: false, pressed: false, cursorVisible: false });
    this._internalValue = props.value ?? '';
  }

  protected defaultProps(): NervTextAreaProps {
    return { width: 250, color: 'cyan', rows: 4, placeholder: '' };
  }

  getPreferredSize(): Size {
    const rows = this._props.rows ?? 4;
    const lineH = 16;
    const labelH = this._props.textareaLabel ? 18 : 0;
    return { width: this._props.width ?? 250, height: rows * lineH + 16 + labelH };
  }

  protected onInit(): void {
    // Create text objects once; updated in-place in redraw()
    this._labelText = TextRenderer.create({ text: '', role: 'mono', size: 10, color: 0x888888 });
    this._labelText.visible = false;
    this._valueText = TextRenderer.create({ text: '', role: 'mono', size: 12, color: 0xffffff, uppercase: false });
    this._valueText.visible = false;
    this._placeholderText = TextRenderer.create({ text: '', role: 'mono', size: 12, color: 0x888888, alpha: 0.5, uppercase: false });
    this._placeholderText.visible = false;

    this.addChild(this._bg, this._border, this._labelText, this._valueText, this._placeholderText, this._cursor);

    this.on('pointerdown', (e) => {
      e.stopPropagation();
      if (!this.isFocused) {
        this.context.focusComponent(this);
      }
    });
  }

  focus(): void {
    if (this._cursorTimer) { clearInterval(this._cursorTimer); this._cursorTimer = null; }
    super.focus();
    this.context.activateTextInput(this, true, this._internalValue);
    this._cursorTimer = setInterval(() => {
      this.setState({ cursorVisible: !this._state.cursorVisible } as Partial<NervTextAreaState>);
    }, 530);
  }

  blur(): void {
    if (this._cursorTimer) { clearInterval(this._cursorTimer); this._cursorTimer = null; }
    this.context.deactivateTextInput();
    super.blur();
    this.setState({ cursorVisible: false } as Partial<NervTextAreaState>);
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Backspace') {
      this._internalValue = this._internalValue.slice(0, -1);
      this._props.onChange?.(this._internalValue);
      this.scheduleRedraw();
    } else if (e.key === 'Enter') {
      this._internalValue += '\n';
      this._props.onChange?.(this._internalValue);
      this.scheduleRedraw();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      if (this._props.maxLength && this._internalValue.length >= this._props.maxLength) return;
      this._internalValue += e.key;
      this._props.onChange?.(this._internalValue);
      this.scheduleRedraw();
    }
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const w = this.componentWidth;
    const accent = theme.colorForAccent(p.color ?? 'cyan');
    const hasLabel = !!p.textareaLabel;
    const labelH = hasLabel ? 18 : 0;
    const fieldY = labelH;
    const fieldH = this.componentHeight - labelH;

    this._bg.clear();
    this._bg.rect(0, fieldY, w, fieldH);
    this._bg.fill({ color: theme.semantic.bgPanel });

    this._border.clear();
    const bc = this._state.focused ? accent : theme.semantic.borderDefault;
    this._border.setStrokeStyle({ width: 1, color: bc, alpha: this._state.focused ? 1 : 0.7 });
    this._border.rect(0, fieldY, w, fieldH);
    this._border.stroke();

    // Label -- update in-place
    if (hasLabel) {
      this._labelText!.visible = true;
      this._labelText!.text = `// ${p.textareaLabel}`.toUpperCase();
      (this._labelText!.style as TextStyle).fill = theme.semantic.textMuted;
      this._labelText!.x = 2;
    } else {
      this._labelText!.visible = false;
    }

    // Value -- update in-place
    if (this._internalValue) {
      this._valueText!.visible = true;
      this._valueText!.text = this._internalValue;
      (this._valueText!.style as TextStyle).fill = theme.semantic.textPrimary;
      (this._valueText!.style as TextStyle).wordWrap = true;
      (this._valueText!.style as TextStyle).wordWrapWidth = w - 16;
      this._valueText!.x = 8;
      this._valueText!.y = fieldY + 8;
    } else {
      this._valueText!.visible = false;
    }

    // Placeholder -- update in-place
    if (!this._internalValue && p.placeholder) {
      this._placeholderText!.visible = true;
      this._placeholderText!.text = p.placeholder.toUpperCase();
      (this._placeholderText!.style as TextStyle).fill = theme.semantic.textMuted;
      this._placeholderText!.alpha = 0.5;
      this._placeholderText!.x = 8;
      this._placeholderText!.y = fieldY + 8;
    } else {
      this._placeholderText!.visible = false;
    }

    // Cursor
    this._cursor.clear();
    this._cursor.visible = this._state.focused && this._state.cursorVisible;
    if (this._cursor.visible) {
      const cx = 8 + (this._valueText?.width ?? 0) + 2;
      const lines = this._internalValue.split('\n').length - 1;
      const cy = fieldY + 8 + lines * 16;
      this._cursor.setStrokeStyle({ width: 1.5, color: accent });
      this._cursor.moveTo(cx, cy);
      this._cursor.lineTo(cx, cy + 14);
      this._cursor.stroke();
    }

    this.hitArea = new Rectangle(0, fieldY, w, fieldH);
  }

  get value(): string { return this._internalValue; }
  set value(v: string) { this._internalValue = v; this.scheduleRedraw(); }

  protected onDispose(): void {
    // Only clean up non-child resources; children are auto-destroyed by NervBase
    if (this._cursorTimer) clearInterval(this._cursorTimer);
  }
}
