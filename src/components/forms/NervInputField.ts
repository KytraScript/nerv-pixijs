import { Graphics, Text, Ticker } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { KeyboardEventHandler } from '../../core/InputManager';
import type { NervColor, Size } from '../../core/types';

export interface NervInputFieldProps extends NervBaseProps {
  value?: string;
  placeholder?: string;
  inputLabel?: string;
  color?: NervColor;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  maxLength?: number;
  password?: boolean;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}

interface NervInputFieldState extends NervBaseState {
  cursorVisible: boolean;
  cursorPos: number;
}

const SIZE_MAP = { sm: { h: 28, fontSize: 10 }, md: { h: 36, fontSize: 12 }, lg: { h: 44, fontSize: 14 } } as const;

export class NervInputField extends NervBase<NervInputFieldProps, NervInputFieldState> implements KeyboardEventHandler {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _valueText: Text | null = null;
  private _placeholderText: Text | null = null;
  private _labelText: Text | null = null;
  private _cursor = new Graphics();
  private _cursorTimer: ReturnType<typeof setInterval> | null = null;
  private _internalValue = '';

  constructor(props: NervInputFieldProps) {
    super(props, { focused: false, hovered: false, pressed: false, cursorVisible: false, cursorPos: 0 });
    this._internalValue = props.value ?? '';
  }

  protected defaultProps(): NervInputFieldProps {
    return { width: 200, size: 'md', color: 'cyan', placeholder: '' };
  }

  getPreferredSize(): Size {
    const cfg = SIZE_MAP[this._props.size ?? 'md'];
    const labelH = this._props.inputLabel ? cfg.fontSize + 6 : 0;
    return { width: this._props.width ?? 200, height: cfg.h + labelH };
  }

  protected onInit(): void {
    this.addChild(this._bg, this._border, this._cursor);
    this._cursor.visible = false;

    this.on('pointerdown', () => {
      this.focus();
    });
  }

  focus(): void {
    super.focus();
    this._cursorTimer = setInterval(() => {
      this.setState({ cursorVisible: !this._state.cursorVisible } as Partial<NervInputFieldState>);
    }, 530);
  }

  blur(): void {
    super.blur();
    if (this._cursorTimer) { clearInterval(this._cursorTimer); this._cursorTimer = null; }
    this.setState({ cursorVisible: false } as Partial<NervInputFieldState>);
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Backspace') {
      this._internalValue = this._internalValue.slice(0, -1);
      this._props.onChange?.(this._internalValue);
      this.scheduleRedraw();
    } else if (e.key === 'Enter') {
      this._props.onSubmit?.(this._internalValue);
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
    const cfg = SIZE_MAP[p.size ?? 'md'];
    const accent = theme.colorForAccent(p.color ?? 'cyan');
    const w = this.componentWidth;
    const hasLabel = !!p.inputLabel;
    const labelH = hasLabel ? cfg.fontSize + 6 : 0;
    const fieldY = labelH;

    // Background
    this._bg.clear();
    this._bg.rect(0, fieldY, w, cfg.h);
    this._bg.fill({ color: theme.semantic.bgPanel });

    // Border
    this._border.clear();
    const borderColor = p.error ? theme.colors.red : (this._state.focused ? accent : theme.semantic.borderDefault);
    const borderAlpha = this._state.focused ? 1 : theme.effects.borderAlpha;
    this._border.setStrokeStyle({ width: 1, color: borderColor, alpha: borderAlpha });
    this._border.rect(0, fieldY, w, cfg.h);
    this._border.stroke();

    // Focus brackets
    if (this._state.focused) {
      this._border.setStrokeStyle({ width: 2, color: accent, alpha: 1 });
      const cs = 6;
      this._border.moveTo(0, fieldY + cs); this._border.lineTo(0, fieldY); this._border.lineTo(cs, fieldY);
      this._border.moveTo(w - cs, fieldY); this._border.lineTo(w, fieldY); this._border.lineTo(w, fieldY + cs);
      this._border.moveTo(0, fieldY + cfg.h - cs); this._border.lineTo(0, fieldY + cfg.h); this._border.lineTo(cs, fieldY + cfg.h);
      this._border.moveTo(w - cs, fieldY + cfg.h); this._border.lineTo(w, fieldY + cfg.h); this._border.lineTo(w, fieldY + cfg.h - cs);
      this._border.stroke();
    }

    // Label
    if (this._labelText) { this._labelText.destroy(); this.removeChild(this._labelText); }
    if (hasLabel) {
      this._labelText = TextRenderer.create({ text: `// ${p.inputLabel}`, role: 'mono', size: cfg.fontSize - 2, color: theme.semantic.textMuted });
      this._labelText.x = 2;
      this._labelText.y = 0;
      this.addChild(this._labelText);
    }

    // Value text
    if (this._valueText) { this._valueText.destroy(); this.removeChild(this._valueText); }
    const displayVal = p.password ? '*'.repeat(this._internalValue.length) : this._internalValue;
    if (displayVal) {
      this._valueText = TextRenderer.create({ text: displayVal, role: 'mono', size: cfg.fontSize, color: theme.semantic.textPrimary, uppercase: false });
      this._valueText.x = 8;
      this._valueText.y = fieldY + Math.round((cfg.h - this._valueText.height) / 2);
      this.addChild(this._valueText);
    }

    // Placeholder
    if (this._placeholderText) { this._placeholderText.destroy(); this.removeChild(this._placeholderText); }
    if (!displayVal && p.placeholder) {
      this._placeholderText = TextRenderer.create({ text: p.placeholder, role: 'mono', size: cfg.fontSize, color: theme.semantic.textMuted, alpha: 0.5 });
      this._placeholderText.x = 8;
      this._placeholderText.y = fieldY + Math.round((cfg.h - this._placeholderText.height) / 2);
      this.addChild(this._placeholderText);
    }

    // Cursor
    this._cursor.clear();
    if (this._state.focused && this._state.cursorVisible) {
      const cursorX = 8 + (this._valueText?.width ?? 0) + 2;
      this._cursor.setStrokeStyle({ width: 1.5, color: accent });
      this._cursor.moveTo(cursorX, fieldY + 6);
      this._cursor.lineTo(cursorX, fieldY + cfg.h - 6);
      this._cursor.stroke();
    }
    this._cursor.visible = this._state.focused && this._state.cursorVisible;

    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= w && y >= fieldY && y <= fieldY + cfg.h };
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
