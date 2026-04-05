import { Container, Graphics, Rectangle } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import { LayoutEngine } from '../../core/LayoutEngine';
import { NervPanel } from '../../primitives/NervPanel';
import type { NervColor, Size, LayoutConfig } from '../../core/types';
import { INSETS_ZERO } from '../../core/types';
import type { Text } from 'pixi.js';

export type NervCardVariant = 'default' | 'alert' | 'hud' | 'video';

export interface NervCardProps extends NervBaseProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  footer?: string;
  variant?: NervCardVariant;
  color?: NervColor;
  contentPadding?: number;
  layout?: Partial<LayoutConfig>;
}

export class NervCard extends NervBase<NervCardProps> {
  private _panel: NervPanel | null = null;
  private _eyebrowText!: Text;
  private _titleText!: Text;
  private _subtitleText!: Text;
  private _footerText!: Text;
  private _footerLine = new Graphics();
  private _contentArea = new Container();
  private _alertStripe = new Graphics();

  protected defaultProps(): NervCardProps {
    return {
      width: 300,
      height: 200,
      variant: 'default',
      color: 'orange',
      contentPadding: 12,
    };
  }

  protected onInit(): void {
    const theme = this.theme;
    // Create text objects once with empty text; toggle visibility in redraw
    this._eyebrowText = TextRenderer.create({
      text: '',
      role: 'mono',
      size: theme.fontSizes.xs,
      color: theme.semantic.textPrimary,
      alpha: 0.7,
      uppercase: true,
    });
    this._titleText = TextRenderer.create({
      text: '',
      role: 'display',
      size: theme.fontSizes.xl,
      color: theme.semantic.textPrimary,
    });
    this._subtitleText = TextRenderer.create({
      text: '',
      role: 'body',
      size: theme.fontSizes.sm,
      color: theme.semantic.textSecondary,
      uppercase: false,
    });
    this._footerText = TextRenderer.create({
      text: '',
      role: 'mono',
      size: theme.fontSizes.xs,
      color: theme.semantic.textMuted,
    });

    this._eyebrowText.visible = false;
    this._titleText.visible = false;
    this._subtitleText.visible = false;
    this._footerText.visible = false;

    this.addChild(this._alertStripe, this._footerLine, this._contentArea);
    this.addChild(this._eyebrowText, this._titleText, this._subtitleText, this._footerText);
  }

  getPreferredSize(): Size {
    return { width: this._props.width ?? 300, height: this._props.height ?? 200 };
  }

  /** Add a child to the card's content area. */
  addContent(child: Container): void {
    this._contentArea.addChild(child);
    this.scheduleRedraw();
  }

  /** Remove a child from the card's content area. */
  removeContent(child: Container): void {
    this._contentArea.removeChild(child);
    this.scheduleRedraw();
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const w = this.componentWidth;
    const h = this.componentHeight;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const pad = p.contentPadding ?? 12;
    const variant = p.variant ?? 'default';

    // Determine variant-specific settings
    const isAlert = variant === 'alert';
    const isHud = variant === 'hud';
    const isVideo = variant === 'video';

    const panelFillAlpha = isHud ? 0.6 : isVideo ? 0.4 : 1;
    const panelBorderAlpha = isAlert ? 1 : theme.effects.borderAlpha;
    const panelColor = isAlert ? 'red' : (p.color ?? 'orange');

    // Rebuild panel
    if (this._panel) {
      this.removeChild(this._panel);
      this._panel.destroy({ children: true });
    }
    this._panel = new NervPanel({
      width: w,
      height: h,
      color: panelColor as NervColor,
      fillAlpha: panelFillAlpha,
      borderAlpha: panelBorderAlpha,
      showCornerBrackets: !isVideo,
      cornerSize: isHud ? 16 : 12,
    });
    this.addChildAt(this._panel, 0);

    // Alert stripe
    this._alertStripe.clear();
    if (isAlert) {
      this._alertStripe.rect(0, 0, 3, h);
      this._alertStripe.fill({ color: theme.colors.red, alpha: 0.9 });
    }

    let cursorY = pad;

    // Eyebrow
    if (p.eyebrow) {
      TextRenderer.updateText(this._eyebrowText, p.eyebrow, true);
      TextRenderer.updateStyle(this._eyebrowText, { color: accent, alpha: 0.7 });
      this._eyebrowText.x = pad;
      this._eyebrowText.y = cursorY;
      this._eyebrowText.visible = true;
      cursorY += this._eyebrowText.height + theme.spacing.xs;
    } else {
      this._eyebrowText.visible = false;
    }

    // Title
    if (p.title) {
      TextRenderer.updateText(this._titleText, p.title);
      TextRenderer.updateStyle(this._titleText, {
        color: isAlert ? theme.colors.red : theme.semantic.textPrimary,
      });
      (this._titleText.style as { wordWrap: boolean; wordWrapWidth: number }).wordWrap = true;
      (this._titleText.style as { wordWrapWidth: number }).wordWrapWidth = w - pad * 2;
      this._titleText.x = pad;
      this._titleText.y = cursorY;
      this._titleText.visible = true;
      cursorY += this._titleText.height + theme.spacing.xxs;
    } else {
      this._titleText.visible = false;
    }

    // Subtitle
    if (p.subtitle) {
      TextRenderer.updateText(this._subtitleText, p.subtitle, false);
      TextRenderer.updateStyle(this._subtitleText, { color: theme.semantic.textSecondary });
      (this._subtitleText.style as { wordWrap: boolean; wordWrapWidth: number }).wordWrap = true;
      (this._subtitleText.style as { wordWrapWidth: number }).wordWrapWidth = w - pad * 2;
      this._subtitleText.x = pad;
      this._subtitleText.y = cursorY;
      this._subtitleText.visible = true;
      cursorY += this._subtitleText.height + theme.spacing.sm;
    } else {
      this._subtitleText.visible = false;
    }

    // Content area positioning
    this._contentArea.x = pad;
    this._contentArea.y = cursorY;

    // Layout children in content area
    if (this._contentArea.children.length > 0) {
      const layoutConfig: LayoutConfig = {
        direction: 'column',
        align: 'start',
        justify: 'start',
        gap: theme.spacing.sm,
        padding: { ...INSETS_ZERO },
        wrap: false,
        ...p.layout,
      };
      const contentW = w - pad * 2;
      const footerReserve = p.footer ? theme.fontSizes.sm + theme.spacing.md * 2 : 0;
      const contentH = h - cursorY - pad - footerReserve;
      LayoutEngine.layout(this._contentArea, layoutConfig, contentW, contentH);
    }

    // Footer
    this._footerLine.clear();
    if (p.footer) {
      const footerY = h - theme.fontSizes.sm - theme.spacing.md - pad;
      this._footerLine.setStrokeStyle({ width: 1, color: accent, alpha: 0.3 });
      this._footerLine.moveTo(pad, footerY);
      this._footerLine.lineTo(w - pad, footerY);
      this._footerLine.stroke();

      TextRenderer.updateText(this._footerText, p.footer, true);
      TextRenderer.updateStyle(this._footerText, { color: theme.semantic.textMuted });
      this._footerText.x = pad;
      this._footerText.y = footerY + theme.spacing.xs;
      this._footerText.visible = true;
    } else {
      this._footerText.visible = false;
    }

    this.hitArea = new Rectangle(0, 0, w, h);
  }

  protected onDispose(): void {
    // Only clean up non-child resources.
    // All children (panel, texts, graphics, contentArea) are auto-destroyed
    // by NervBase.destroy({ children: true }).
  }
}
