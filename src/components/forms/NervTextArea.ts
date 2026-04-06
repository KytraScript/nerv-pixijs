import { Container, Graphics, Text, TextStyle, Rectangle } from 'pixi.js';
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

const LINE_HEIGHT = 16;
const FONT_SIZE = 12;
const PAD = 8;

export class NervTextArea extends NervBase<NervTextAreaProps, NervTextAreaState> implements KeyboardEventHandler {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _clipMask = new Graphics();
  private _scrollContainer = new Container();
  private _valueText: Text | null = null;
  private _placeholderText: Text | null = null;
  private _labelText: Text | null = null;
  private _cursor = new Graphics();
  private _scrollbar = new Graphics();
  private _cursorTimer: ReturnType<typeof setInterval> | null = null;
  private _internalValue = '';
  private _scrollY = 0;
  private _maxScrollY = 0;
  private _cursorLine = 0;
  private _cursorCol = 0;

  constructor(props: NervTextAreaProps) {
    super(props, { focused: false, hovered: false, pressed: false, cursorVisible: false });
    this._internalValue = props.value ?? '';
  }

  protected defaultProps(): NervTextAreaProps {
    return { width: 300, color: 'cyan', rows: 6, placeholder: '' };
  }

  private get _fieldY(): number {
    return this._props.textareaLabel ? 18 : 0;
  }

  private get _fieldH(): number {
    return (this._props.rows ?? 6) * LINE_HEIGHT + PAD * 2;
  }

  getPreferredSize(): Size {
    return { width: this._props.width ?? 300, height: this._fieldH + this._fieldY };
  }

  protected onInit(): void {
    this._labelText = TextRenderer.create({ text: '', role: 'mono', size: 10, color: 0x888888 });
    this._labelText.visible = false;

    this._valueText = TextRenderer.create({ text: '', role: 'mono', size: FONT_SIZE, color: 0xffffff, uppercase: false });
    this._placeholderText = TextRenderer.create({ text: '', role: 'mono', size: FONT_SIZE, color: 0x888888, alpha: 0.5, uppercase: false });
    this._placeholderText.visible = false;

    this._scrollContainer.addChild(this._valueText, this._placeholderText, this._cursor);

    this.addChild(this._bg, this._border, this._clipMask, this._labelText, this._scrollContainer, this._scrollbar);

    // Mask the scroll container to the field bounds
    this._scrollContainer.mask = this._clipMask;

    // Mouse wheel scrolling
    this.on('wheel', (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this._scroll(e.deltaY > 0 ? 3 : -3);
    });

    this.on('pointerdown', (e) => {
      e.stopPropagation();
      if (!this.isFocused) {
        this.context.focusComponent(this);
      }
    });
  }

  private _scroll(lines: number): void {
    this._scrollY = Math.max(0, Math.min(this._maxScrollY, this._scrollY + lines * LINE_HEIGHT));
    this._scrollContainer.y = this._fieldY + PAD - this._scrollY;
    this._drawScrollbar();
  }

  private _scrollToCursor(): void {
    const cursorY = this._cursorLine * LINE_HEIGHT;
    const visibleTop = this._scrollY;
    const visibleBottom = this._scrollY + this._fieldH - PAD * 2 - LINE_HEIGHT;

    if (cursorY < visibleTop) {
      this._scrollY = cursorY;
    } else if (cursorY > visibleBottom) {
      this._scrollY = cursorY - (this._fieldH - PAD * 2 - LINE_HEIGHT);
    }
    this._scrollY = Math.max(0, Math.min(this._maxScrollY, this._scrollY));
    this._scrollContainer.y = this._fieldY + PAD - this._scrollY;
  }

  private _drawScrollbar(): void {
    const w = this.componentWidth;
    const fieldY = this._fieldY;
    const fieldH = this._fieldH;
    const theme = this.theme;
    const accent = theme.colorForAccent(this._props.color ?? 'cyan');

    this._scrollbar.clear();
    if (this._maxScrollY <= 0) return;

    const trackH = fieldH - 4;
    const thumbRatio = fieldH / (this._maxScrollY + fieldH);
    const thumbH = Math.max(12, trackH * thumbRatio);
    const thumbY = fieldY + 2 + (this._scrollY / this._maxScrollY) * (trackH - thumbH);

    this._scrollbar.rect(w - 4, thumbY, 2, thumbH);
    this._scrollbar.fill({ color: accent, alpha: 0.4 });
  }

  private _computeCursorPosition(): void {
    const lines = this._internalValue.split('\n');
    this._cursorLine = lines.length - 1;
    this._cursorCol = lines[lines.length - 1].length;
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
    let changed = false;

    if (e.key === 'Backspace') {
      if (this._internalValue.length > 0) {
        this._internalValue = this._internalValue.slice(0, -1);
        changed = true;
      }
    } else if (e.key === 'Enter') {
      this._internalValue += '\n';
      changed = true;
    } else if (e.key === 'Escape') {
      this.context.blurFocused();
      return;
    } else if (e.key === 'Tab') {
      return; // Handled by InputManager
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      if (this._props.maxLength && this._internalValue.length >= this._props.maxLength) return;
      this._internalValue += e.key;
      changed = true;
    }

    if (changed) {
      this._props.onChange?.(this._internalValue);
      this._computeCursorPosition();
      this.scheduleRedraw();
      // Scroll to cursor after redraw
      queueMicrotask(() => this._scrollToCursor());
    }
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const w = this.componentWidth;
    const accent = theme.colorForAccent(p.color ?? 'cyan');
    const fieldY = this._fieldY;
    const fieldH = this._fieldH;

    // Background
    this._bg.clear();
    this._bg.rect(0, fieldY, w, fieldH);
    this._bg.fill({ color: theme.semantic.bgPanel });

    // Border
    this._border.clear();
    const bc = this._state.focused ? accent : theme.semantic.borderDefault;
    this._border.setStrokeStyle({ width: 1, color: bc, alpha: this._state.focused ? 1 : 0.7 });
    this._border.rect(0, fieldY, w, fieldH);
    this._border.stroke();

    // Focus brackets
    if (this._state.focused) {
      const cs = 6;
      this._border.setStrokeStyle({ width: 2, color: accent, alpha: 1 });
      this._border.moveTo(0, fieldY + cs); this._border.lineTo(0, fieldY); this._border.lineTo(cs, fieldY);
      this._border.moveTo(w - cs, fieldY); this._border.lineTo(w, fieldY); this._border.lineTo(w, fieldY + cs);
      this._border.moveTo(0, fieldY + fieldH - cs); this._border.lineTo(0, fieldY + fieldH); this._border.lineTo(cs, fieldY + fieldH);
      this._border.moveTo(w - cs, fieldY + fieldH); this._border.lineTo(w, fieldY + fieldH); this._border.lineTo(w, fieldY + fieldH - cs);
      this._border.stroke();
    }

    // Clip mask
    this._clipMask.clear();
    this._clipMask.rect(0, fieldY, w - 6, fieldH);
    this._clipMask.fill({ color: 0xffffff });

    // Label
    if (p.textareaLabel) {
      this._labelText!.visible = true;
      this._labelText!.text = `// ${p.textareaLabel}`.toUpperCase();
      (this._labelText!.style as TextStyle).fill = theme.semantic.textMuted;
      this._labelText!.x = 2;
      this._labelText!.y = 0;
    } else {
      this._labelText!.visible = false;
    }

    // Value text
    if (this._internalValue) {
      this._valueText!.visible = true;
      this._valueText!.text = this._internalValue;
      (this._valueText!.style as TextStyle).fill = theme.semantic.textPrimary;
      (this._valueText!.style as TextStyle).fontSize = FONT_SIZE;
      (this._valueText!.style as TextStyle).wordWrap = true;
      (this._valueText!.style as TextStyle).wordWrapWidth = w - PAD * 2 - 8;
      (this._valueText!.style as TextStyle).lineHeight = LINE_HEIGHT;
      this._valueText!.x = PAD;
      this._valueText!.y = 0;
      this._placeholderText!.visible = false;

      // Compute content height and max scroll
      const contentH = this._valueText!.height;
      const viewH = fieldH - PAD * 2;
      this._maxScrollY = Math.max(0, contentH - viewH);
    } else {
      this._valueText!.visible = false;
      this._maxScrollY = 0;

      // Placeholder
      if (p.placeholder) {
        this._placeholderText!.visible = true;
        this._placeholderText!.text = p.placeholder.toUpperCase();
        (this._placeholderText!.style as TextStyle).fill = theme.semantic.textMuted;
        (this._placeholderText!.style as TextStyle).fontSize = FONT_SIZE;
        this._placeholderText!.alpha = 0.5;
        this._placeholderText!.x = PAD;
        this._placeholderText!.y = 0;
      } else {
        this._placeholderText!.visible = false;
      }
    }

    // Position scroll container (don't reset scroll on redraw)
    this._scrollContainer.x = 0;
    if (this._scrollContainer.y === 0) {
      this._scrollContainer.y = fieldY + PAD;
    }

    // Cursor
    this._cursor.clear();
    this._cursor.visible = this._state.focused && this._state.cursorVisible;
    if (this._cursor.visible) {
      this._computeCursorPosition();
      // Approximate cursor x from last line's character count
      const lastLine = this._internalValue.split('\n')[this._cursorLine] ?? '';
      const charW = FONT_SIZE * 0.6; // approximate monospace char width
      const cx = PAD + Math.min(lastLine.length * charW, (w - PAD * 2 - 8));
      const cy = this._cursorLine * LINE_HEIGHT;
      this._cursor.setStrokeStyle({ width: 1.5, color: accent });
      this._cursor.moveTo(cx, cy);
      this._cursor.lineTo(cx, cy + LINE_HEIGHT - 2);
      this._cursor.stroke();
    }

    // Scrollbar
    this._drawScrollbar();

    this.hitArea = new Rectangle(0, fieldY, w, fieldH);
  }

  get value(): string { return this._internalValue; }
  set value(v: string) {
    this._internalValue = v;
    this._computeCursorPosition();
    this.scheduleRedraw();
  }

  protected onDispose(): void {
    if (this._cursorTimer) clearInterval(this._cursorTimer);
  }
}
