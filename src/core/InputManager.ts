import { FocusManager } from './FocusManager';
import { NervBase } from './NervBase';

export interface KeyboardEventHandler {
  onKeyDown?(e: KeyboardEvent): void;
  onKeyUp?(e: KeyboardEvent): void;
  onTextInput?(text: string): void;
}

export class InputManager {
  private _focusManager: FocusManager;
  private _hiddenInput: HTMLInputElement;
  private _hiddenTextarea: HTMLTextAreaElement;
  private _activeTextTarget: (NervBase & KeyboardEventHandler) | null = null;
  private _boundKeyDown: (e: KeyboardEvent) => void;
  private _boundKeyUp: (e: KeyboardEvent) => void;

  constructor(focusManager: FocusManager) {
    this._focusManager = focusManager;

    // Create hidden DOM elements for text input
    this._hiddenInput = document.createElement('input');
    this._hiddenTextarea = document.createElement('textarea');

    for (const el of [this._hiddenInput, this._hiddenTextarea]) {
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      el.style.top = '-9999px';
      el.style.opacity = '0';
      el.style.width = '1px';
      el.style.height = '1px';
      el.setAttribute('tabindex', '-1');
      el.setAttribute('autocomplete', 'off');
      el.setAttribute('autocorrect', 'off');
      el.setAttribute('autocapitalize', 'off');
      el.setAttribute('spellcheck', 'false');
      document.body.appendChild(el);
    }

    this._boundKeyDown = this.onKeyDown.bind(this);
    this._boundKeyUp = this.onKeyUp.bind(this);
  }

  initialize(): void {
    document.addEventListener('keydown', this._boundKeyDown);
    document.addEventListener('keyup', this._boundKeyUp);

    this._hiddenInput.addEventListener('input', () => {
      if (this._activeTextTarget?.onTextInput) {
        this._activeTextTarget.onTextInput(this._hiddenInput.value);
      }
    });

    this._hiddenTextarea.addEventListener('input', () => {
      if (this._activeTextTarget?.onTextInput) {
        this._activeTextTarget.onTextInput(this._hiddenTextarea.value);
      }
    });
  }

  private onKeyDown(e: KeyboardEvent): void {
    // Tab navigation
    if (e.key === 'Tab') {
      e.preventDefault();
      this._focusManager.advanceFocus(e.shiftKey ? -1 : 1);
      return;
    }

    // Route to focused component
    const focused = this._focusManager.focused;
    if (focused && 'onKeyDown' in focused) {
      (focused as KeyboardEventHandler).onKeyDown?.(e);
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    const focused = this._focusManager.focused;
    if (focused && 'onKeyUp' in focused) {
      (focused as KeyboardEventHandler).onKeyUp?.(e);
    }
  }

  activateTextProxy(target: NervBase & KeyboardEventHandler, multiline: boolean, currentValue = ''): void {
    this._activeTextTarget = target;
    const el = multiline ? this._hiddenTextarea : this._hiddenInput;
    el.value = currentValue;
    el.focus();
  }

  deactivateTextProxy(): void {
    this._activeTextTarget = null;
    this._hiddenInput.blur();
    this._hiddenTextarea.blur();
  }

  getProxyValue(multiline = false): string {
    return multiline ? this._hiddenTextarea.value : this._hiddenInput.value;
  }

  setProxyValue(value: string, multiline = false): void {
    if (multiline) this._hiddenTextarea.value = value;
    else this._hiddenInput.value = value;
  }

  destroy(): void {
    document.removeEventListener('keydown', this._boundKeyDown);
    document.removeEventListener('keyup', this._boundKeyUp);
    this._hiddenInput.remove();
    this._hiddenTextarea.remove();
    this._activeTextTarget = null;
  }
}
