import { Graphics, Rectangle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import { AnimationManager, Easing } from '../../core/AnimationManager';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface DialogAction {
  text: string;
  variant?: 'primary' | 'danger' | 'ghost';
  onClick?: () => void;
}

export interface NervSystemDialogProps extends NervBaseProps {
  title?: string;
  body?: string;
  actions?: DialogAction[];
  color?: NervColor;
  dialogWidth?: number;
  onClose?: () => void;
}

export class NervSystemDialog extends NervBase<NervSystemDialogProps> {
  private _overlay = new Graphics();
  private _panel = new Graphics();
  private _titleBar = new Graphics();
  private _titleText!: Text;
  private _bodyText!: Text;
  private _actionTexts: Text[] = [];
  private _actionBgs: Graphics[] = [];
  private _brackets = new Graphics();

  protected defaultProps(): NervSystemDialogProps {
    return {
      title: 'SYSTEM DIALOG',
      body: '',
      actions: [],
      color: 'orange',
      dialogWidth: 420,
    };
  }

  protected onInit(): void {
    this.addChild(this._overlay, this._panel, this._titleBar, this._brackets);

    this._overlay.eventMode = 'static';
    this._overlay.cursor = 'default';
    this._overlay.on('pointerup', () => {
      this._props.onClose?.();
    });

    // Create persistent Text objects
    const theme = this.theme;
    const accent = theme.colorForAccent(this._props.color ?? 'orange');

    this._titleText = TextRenderer.create({
      text: this._props.title ?? 'SYSTEM DIALOG',
      role: 'display',
      size: theme.fontSizes.sm,
      color: accent,
    });
    this.addChild(this._titleText);

    this._bodyText = TextRenderer.create({
      text: '',
      role: 'mono',
      size: theme.fontSizes.md,
      color: theme.semantic.textPrimary,
      uppercase: false,
    });
    this._bodyText.visible = false;
    this.addChild(this._bodyText);
  }

  getPreferredSize(): Size {
    return { width: 1920, height: 1080 };
  }

  show(): void {
    this.visible = true;
    this.alpha = 0;
    AnimationManager.tween(this, { alpha: 1 } as never, 200, { easing: Easing.easeOutQuad });
  }

  hide(): void {
    AnimationManager.tween(this, { alpha: 0 } as never, 150, {
      easing: Easing.easeInQuad,
      onComplete: () => { this.visible = false; },
    });
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const dw = p.dialogWidth ?? 420;
    const padding = theme.spacing.lg;
    const titleHeight = 32;

    // Measure body text for height calculation
    const bodyFontSize = theme.fontSizes.md;
    const bodyMaxWidth = dw - padding * 2;
    const bodyLineCount = p.body ? Math.ceil((p.body.length * bodyFontSize * 0.55) / bodyMaxWidth) : 0;
    const bodyHeight = Math.max(bodyLineCount * (bodyFontSize + 4), bodyFontSize + 4);

    const actionsHeight = (p.actions && p.actions.length > 0) ? 36 : 0;
    const dh = titleHeight + padding + bodyHeight + padding + actionsHeight + padding;

    const screenW = this._props.width ?? 1920;
    const screenH = this._props.height ?? 1080;
    const dx = Math.round((screenW - dw) / 2);
    const dy = Math.round((screenH - dh) / 2);

    // Dark overlay
    this._overlay.clear();
    this._overlay.rect(0, 0, screenW, screenH);
    this._overlay.fill({ color: 0x000000, alpha: 0.65 });

    // Panel background
    this._panel.clear();
    this._panel.rect(dx, dy, dw, dh);
    this._panel.fill({ color: theme.semantic.bgPanel, alpha: 0.95 });
    this._panel.setStrokeStyle({ width: 1, color: accent, alpha: 0.7 });
    this._panel.rect(dx, dy, dw, dh);
    this._panel.stroke();

    // Title bar
    this._titleBar.clear();
    this._titleBar.rect(dx, dy, dw, titleHeight);
    this._titleBar.fill({ color: accent, alpha: 0.15 });
    this._titleBar.setStrokeStyle({ width: 1, color: accent, alpha: 0.5 });
    this._titleBar.moveTo(dx, dy + titleHeight);
    this._titleBar.lineTo(dx + dw, dy + titleHeight);
    this._titleBar.stroke();

    // Corner brackets on the panel
    this._brackets.clear();
    const cs = 8;
    this._brackets.setStrokeStyle({ width: 1.5, color: accent, alpha: 1 });
    this._brackets.moveTo(dx, dy + cs); this._brackets.lineTo(dx, dy); this._brackets.lineTo(dx + cs, dy);
    this._brackets.moveTo(dx + dw - cs, dy); this._brackets.lineTo(dx + dw, dy); this._brackets.lineTo(dx + dw, dy + cs);
    this._brackets.moveTo(dx, dy + dh - cs); this._brackets.lineTo(dx, dy + dh); this._brackets.lineTo(dx + cs, dy + dh);
    this._brackets.moveTo(dx + dw - cs, dy + dh); this._brackets.lineTo(dx + dw, dy + dh); this._brackets.lineTo(dx + dw, dy + dh - cs);
    this._brackets.stroke();

    // Title text -- update in place
    TextRenderer.updateText(this._titleText, p.title ?? 'SYSTEM DIALOG');
    TextRenderer.updateStyle(this._titleText, { color: accent, size: theme.fontSizes.sm });
    this._titleText.x = dx + padding;
    this._titleText.y = dy + Math.round((titleHeight - this._titleText.height) / 2);

    // Body text -- update in place
    if (p.body) {
      TextRenderer.updateText(this._bodyText, p.body, false);
      TextRenderer.updateStyle(this._bodyText, { color: theme.semantic.textPrimary, size: bodyFontSize });
      this._bodyText.x = dx + padding;
      this._bodyText.y = dy + titleHeight + padding;
      this._bodyText.visible = true;
    } else {
      this._bodyText.visible = false;
    }

    // Clean up old action elements -- these are dynamic, remove from parent but don't destroy individually
    for (const t of this._actionTexts) { this.removeChild(t); }
    for (const bg of this._actionBgs) { this.removeChild(bg); }
    this._actionTexts = [];
    this._actionBgs = [];

    // Action buttons
    if (p.actions && p.actions.length > 0) {
      const actionY = dy + dh - padding - 28;
      const btnSpacing = theme.spacing.sm;
      let actionX = dx + dw - padding;

      for (let i = p.actions.length - 1; i >= 0; i--) {
        const action = p.actions[i];
        const btnW = Math.max(action.text.length * 8 + 24, 70);
        actionX -= btnW;

        const isDanger = action.variant === 'danger';
        const isGhost = action.variant === 'ghost';
        const btnColor = isDanger ? theme.colors.red : accent;

        const bg = new Graphics();
        bg.rect(actionX, actionY, btnW, 28);
        bg.fill({ color: isGhost ? 0x000000 : theme.semantic.bgPanel, alpha: isGhost ? 0 : 0.8 });
        bg.setStrokeStyle({ width: 1, color: btnColor, alpha: 0.7 });
        bg.rect(actionX, actionY, btnW, 28);
        bg.stroke();

        bg.eventMode = 'static';
        bg.cursor = 'pointer';
        bg.hitArea = new Rectangle(actionX, actionY, btnW, 28);
        bg.on('pointerup', () => { action.onClick?.(); });

        this.addChild(bg);
        this._actionBgs.push(bg);

        const txt = TextRenderer.create({
          text: action.text,
          role: 'display',
          size: theme.fontSizes.xs,
          color: btnColor,
        });
        txt.x = actionX + Math.round((btnW - txt.width) / 2);
        txt.y = actionY + Math.round((28 - txt.height) / 2);
        this.addChild(txt);
        this._actionTexts.push(txt);

        actionX -= btnSpacing;
      }
    }

    this.hitArea = new Rectangle(0, 0, screenW, screenH);
  }

  protected onDispose(): void {
    // No manual child destruction -- NervBase.destroy() handles children.
  }
}
