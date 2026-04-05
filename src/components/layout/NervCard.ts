import { Container, Graphics } from 'pixi.js';
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
  private _eyebrowText: Text | null = null;
  private _titleText: Text | null = null;
  private _subtitleText: Text | null = null;
  private _footerText: Text | null = null;
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
    this.addChild(this._alertStripe, this._footerLine, this._contentArea);
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

    // Clear old text objects
    this._clearTexts();

    let cursorY = pad;

    // Eyebrow
    if (p.eyebrow) {
      this._eyebrowText = TextRenderer.create({
        text: p.eyebrow,
        role: 'mono',
        size: theme.fontSizes.xs,
        color: accent,
        alpha: 0.7,
        uppercase: true,
      });
      this._eyebrowText.x = pad;
      this._eyebrowText.y = cursorY;
      this.addChild(this._eyebrowText);
      cursorY += this._eyebrowText.height + theme.spacing.xs;
    }

    // Title
    if (p.title) {
      this._titleText = TextRenderer.create({
        text: p.title,
        role: 'display',
        size: theme.fontSizes.xl,
        color: isAlert ? theme.colors.red : theme.semantic.textPrimary,
        maxWidth: w - pad * 2,
      });
      this._titleText.x = pad;
      this._titleText.y = cursorY;
      this.addChild(this._titleText);
      cursorY += this._titleText.height + theme.spacing.xxs;
    }

    // Subtitle
    if (p.subtitle) {
      this._subtitleText = TextRenderer.create({
        text: p.subtitle,
        role: 'body',
        size: theme.fontSizes.sm,
        color: theme.semantic.textSecondary,
        uppercase: false,
        maxWidth: w - pad * 2,
      });
      this._subtitleText.x = pad;
      this._subtitleText.y = cursorY;
      this.addChild(this._subtitleText);
      cursorY += this._subtitleText.height + theme.spacing.sm;
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

      this._footerText = TextRenderer.create({
        text: p.footer,
        role: 'mono',
        size: theme.fontSizes.xs,
        color: theme.semantic.textMuted,
      });
      this._footerText.x = pad;
      this._footerText.y = footerY + theme.spacing.xs;
      this.addChild(this._footerText);
    }

    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= w && y >= 0 && y <= h };
  }

  private _clearTexts(): void {
    if (this._eyebrowText) { this.removeChild(this._eyebrowText); this._eyebrowText.destroy(); this._eyebrowText = null; }
    if (this._titleText) { this.removeChild(this._titleText); this._titleText.destroy(); this._titleText = null; }
    if (this._subtitleText) { this.removeChild(this._subtitleText); this._subtitleText.destroy(); this._subtitleText = null; }
    if (this._footerText) { this.removeChild(this._footerText); this._footerText.destroy(); this._footerText = null; }
  }

  protected onDispose(): void {
    this._clearTexts();
    this._footerLine.destroy();
    this._alertStripe.destroy();
    this._contentArea.destroy({ children: true });
    this._panel?.destroy({ children: true });
  }
}
