import { Graphics, Text } from 'pixi.js';
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
    this.addChild(this._bg, this._border, this._cursor);
    this.on('pointerdown', () => this.focus());
  }

  focus(): void {
    super.focus();
    this._cursorTimer = setInterval(() => {
      this.setState({ cursorVisible: !this._state.cursorVisible } as Partial<NervTextAreaState>);
    }, 530);
  }

  blur(): void {
    super.blur();
    if (this._cursorTimer) { clearInterval(this._cursorTimer); this._cursorTimer = null; }
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

    // Label
    if (this._labelText) { this._labelText.destroy(); this.removeChild(this._labelText); this._labelText = null; }
    if (hasLabel) {
      this._labelText = TextRenderer.create({ text: `// ${p.textareaLabel}`, role: 'mono', size: 10, color: theme.semantic.textMuted });
      this._labelText.x = 2;
      this.addChild(this._labelText);
    }

    // Value
    if (this._valueText) { this._valueText.destroy(); this.removeChild(this._valueText); this._valueText = null; }
    if (this._internalValue) {
      this._valueText = TextRenderer.create({
        text: this._internalValue,
        role: 'mono',
        size: 12,
        color: theme.semantic.textPrimary,
        uppercase: false,
        maxWidth: w - 16,
      });
      this._valueText.x = 8;
      this._valueText.y = fieldY + 8;
      this.addChild(this._valueText);
    }

    // Placeholder
    if (this._placeholderText) { this._placeholderText.destroy(); this.removeChild(this._placeholderText); this._placeholderText = null; }
    if (!this._internalValue && p.placeholder) {
      this._placeholderText = TextRenderer.create({ text: p.placeholder, role: 'mono', size: 12, color: theme.semantic.textMuted, alpha: 0.5, uppercase: false });
      this._placeholderText.x = 8;
      this._placeholderText.y = fieldY + 8;
      this.addChild(this._placeholderText);
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

    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= w && y >= fieldY && y <= fieldY + fieldH };
  }

  get value(): string { return this._internalValue; }
  set value(v: string) { this._internalValue = v; this.scheduleRedraw(); }

  protected onDispose(): void {
    if (this._cursorTimer) clearInterval(this._cursorTimer);
    this._bg.destroy();
    this._border.destroy();
    this._cursor.destroy();
    this._valueText?.destroy();
    this._placeholderText?.destroy();
    this._labelText?.destroy();
  }
}
