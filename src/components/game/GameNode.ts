import { Container, Graphics, Rectangle, FederatedPointerEvent } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { NervContext } from '../../core/NervContext';
import { TextRenderer } from '../../core/TextRenderer';
import type { NervColor, Size } from '../../core/types';
import type { Text, TextStyle } from 'pixi.js';

export interface GameNodeStat {
  key: string;
  label: string;
  value: number;
  max: number;
  color?: NervColor;
  /** If true, display as a bar. Otherwise display as a number. */
  showBar?: boolean;
}

export interface GameNodeProps extends NervBaseProps {
  /** Display name */
  name: string;
  /** Node type label (e.g. "HERO", "ENEMY") */
  type: string;
  /** Primary accent color */
  color?: NervColor;
  /** Stats to display */
  stats: GameNodeStat[];
  /** Node width */
  nodeWidth?: number;
  /** Whether this node can be dragged */
  draggable?: boolean;
  /** Optional level indicator */
  level?: number;
  /** Optional portrait/icon character */
  icon?: string;
}

interface GameNodeState extends NervBaseState {
  dragging: boolean;
}

export class GameNode extends NervBase<GameNodeProps, GameNodeState> {
  // Visual layers
  private _bg = new Graphics();
  private _border = new Graphics();
  private _brackets = new Graphics();
  private _headerLine = new Graphics();
  private _statBars = new Graphics();

  // Text elements created once in onInit
  private _nameText!: Text;
  private _typeText!: Text;
  private _levelText!: Text;
  private _iconText!: Text;
  private _statTexts: { label: Text; value: Text }[] = [];

  // Drag state
  private _dragOffset = { x: 0, y: 0 };

  constructor(props: GameNodeProps) {
    super(props, { focused: false, hovered: false, pressed: false, dragging: false });
  }

  protected defaultProps(): GameNodeProps {
    return {
      name: 'UNIT',
      type: 'NODE',
      color: 'cyan',
      stats: [],
      nodeWidth: 200,
      draggable: true,
      level: 1,
    };
  }

  protected onInit(): void {
    const theme = this.theme;

    // Create all text objects once
    this._nameText = TextRenderer.create({ text: '', role: 'display', size: theme.fontSizes.lg, color: 0xffffff });
    this._typeText = TextRenderer.create({ text: '', role: 'mono', size: theme.fontSizes.xs, color: 0x888888 });
    this._levelText = TextRenderer.create({ text: '', role: 'mono', size: theme.fontSizes.sm, color: 0xffffff });
    this._iconText = TextRenderer.create({ text: '', role: 'display', size: 24, color: 0xffffff });

    this.addChild(this._bg, this._border, this._brackets, this._headerLine, this._statBars);
    this.addChild(this._iconText, this._nameText, this._typeText, this._levelText);

    // Pre-create stat text slots (we'll show/hide as needed)
    for (let i = 0; i < 8; i++) {
      const label = TextRenderer.create({ text: '', role: 'mono', size: theme.fontSizes.xs, color: 0x888888 });
      const value = TextRenderer.create({ text: '', role: 'mono', size: theme.fontSizes.sm, color: 0xffffff });
      label.visible = false;
      value.visible = false;
      this.addChild(label, value);
      this._statTexts.push({ label, value });
    }

    // Drag handling
    if (this._props.draggable) {
      this.on('pointerdown', this._onDragStart, this);
      this.on('globalpointermove', this._onDragMove, this);
      this.on('pointerup', this._onDragEnd, this);
      this.on('pointerupoutside', this._onDragEnd, this);
    }
  }

  private _onDragStart(e: FederatedPointerEvent): void {
    e.stopPropagation();
    if (NervContext.available) NervContext.instance.pauseViewportDrag();
    this._dragOffset.x = e.global.x - this.x;
    this._dragOffset.y = e.global.y - this.y;
    this.setState({ dragging: true } as Partial<GameNodeState>);
    this.alpha = 0.85;
    this.zIndex = 9999;
    if (this.parent) this.parent.sortableChildren = true;
  }

  private _onDragMove(e: FederatedPointerEvent): void {
    if (!this._state.dragging) return;
    // Convert global coords to parent-local coords
    const parent = this.parent;
    if (!parent) return;
    const local = parent.toLocal(e.global);
    this.position.set(local.x - this._dragOffset.x + this.x - (e.global.x - this._dragOffset.x - this.x), local.y - this._dragOffset.y + this.y - (e.global.y - this._dragOffset.y - this.y));
    // Simpler: just use global offset directly since viewport handles transforms
    this.x = e.global.x - this._dragOffset.x;
    this.y = e.global.y - this._dragOffset.y;
  }

  private _onDragEnd(_e: FederatedPointerEvent): void {
    if (!this._state.dragging) return;
    if (NervContext.available) NervContext.instance.resumeViewportDrag();
    this.setState({ dragging: false } as Partial<GameNodeState>);
    this.alpha = 1;
    this.zIndex = 0;
  }

  getPreferredSize(): Size {
    const w = this._props.nodeWidth ?? 200;
    const statCount = this._props.stats.length;
    const headerH = 52;
    const statH = statCount * 28;
    return { width: w, height: headerH + statH + 16 };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'cyan');
    const w = p.nodeWidth ?? 200;
    const { height: h } = this.getPreferredSize();
    const hovered = this._state.hovered && !this._state.dragging;

    // Background
    this._bg.clear();
    this._bg.rect(0, 0, w, h);
    this._bg.fill({ color: theme.semantic.bgPanel, alpha: 0.95 });

    // Border -- glow on hover
    this._border.clear();
    this._border.setStrokeStyle({ width: hovered ? 1.5 : 1, color: accent, alpha: hovered ? 1 : 0.6 });
    this._border.rect(0, 0, w, h);
    this._border.stroke();

    // Corner brackets
    this._brackets.clear();
    const cs = 10;
    this._brackets.setStrokeStyle({ width: 2, color: accent, alpha: 1 });
    this._brackets.moveTo(0, cs); this._brackets.lineTo(0, 0); this._brackets.lineTo(cs, 0);
    this._brackets.moveTo(w - cs, 0); this._brackets.lineTo(w, 0); this._brackets.lineTo(w, cs);
    this._brackets.moveTo(0, h - cs); this._brackets.lineTo(0, h); this._brackets.lineTo(cs, h);
    this._brackets.moveTo(w - cs, h); this._brackets.lineTo(w, h); this._brackets.lineTo(w, h - cs);
    this._brackets.stroke();

    // Header section
    const headerY = 8;

    // Icon
    if (p.icon) {
      this._iconText.text = p.icon;
      (this._iconText.style as TextStyle).fill = accent;
      this._iconText.x = 10;
      this._iconText.y = headerY;
      this._iconText.visible = true;
    } else {
      this._iconText.visible = false;
    }

    const textStartX = p.icon ? 40 : 10;

    // Type label (eyebrow)
    this._typeText.text = `// ${p.type}`.toUpperCase();
    (this._typeText.style as TextStyle).fill = theme.semantic.textMuted;
    this._typeText.x = textStartX;
    this._typeText.y = headerY;

    // Name
    this._nameText.text = p.name.toUpperCase();
    (this._nameText.style as TextStyle).fill = accent;
    (this._nameText.style as TextStyle).fontSize = theme.fontSizes.lg;
    this._nameText.x = textStartX;
    this._nameText.y = headerY + 14;

    // Level
    if (p.level !== undefined) {
      this._levelText.text = `LV.${p.level}`;
      (this._levelText.style as TextStyle).fill = accent;
      this._levelText.x = w - 40;
      this._levelText.y = headerY + 4;
      this._levelText.visible = true;
    } else {
      this._levelText.visible = false;
    }

    // Header divider line
    const dividerY = 48;
    this._headerLine.clear();
    this._headerLine.setStrokeStyle({ width: 1, color: accent, alpha: 0.4 });
    this._headerLine.moveTo(8, dividerY);
    this._headerLine.lineTo(w - 8, dividerY);
    this._headerLine.stroke();

    // Stats
    this._statBars.clear();
    const statsStartY = dividerY + 8;

    p.stats.forEach((stat, i) => {
      const sy = statsStartY + i * 28;
      const slot = this._statTexts[i];
      if (!slot) return;

      const statColor = stat.color ? theme.colorForAccent(stat.color) : accent;

      // Label
      slot.label.text = stat.label.toUpperCase();
      (slot.label.style as TextStyle).fill = theme.semantic.textMuted;
      (slot.label.style as TextStyle).fontSize = theme.fontSizes.xs;
      slot.label.x = 10;
      slot.label.y = sy;
      slot.label.visible = true;

      if (stat.showBar !== false && stat.max > 0) {
        // Bar mode
        const barX = 10;
        const barW = w - 60;
        const barH = 8;
        const barY = sy + 12;
        const ratio = Math.max(0, Math.min(1, stat.value / stat.max));

        // Bar track
        this._statBars.rect(barX, barY, barW, barH);
        this._statBars.fill({ color: theme.semantic.borderDefault, alpha: 0.2 });

        // Bar fill
        if (ratio > 0) {
          this._statBars.rect(barX, barY, barW * ratio, barH);
          this._statBars.fill({ color: statColor, alpha: 0.8 });
        }

        // Value text
        slot.value.text = `${Math.round(stat.value)}/${stat.max}`;
        (slot.value.style as TextStyle).fill = statColor;
        (slot.value.style as TextStyle).fontSize = theme.fontSizes.xs;
        slot.value.x = w - 48;
        slot.value.y = sy;
        slot.value.visible = true;
      } else {
        // Number mode
        slot.value.text = String(Math.round(stat.value));
        (slot.value.style as TextStyle).fill = statColor;
        (slot.value.style as TextStyle).fontSize = theme.fontSizes.sm;
        slot.value.x = w - 48;
        slot.value.y = sy;
        slot.value.visible = true;
      }
    });

    // Hide unused stat slots
    for (let i = p.stats.length; i < this._statTexts.length; i++) {
      this._statTexts[i].label.visible = false;
      this._statTexts[i].value.visible = false;
    }

    this.cursor = p.draggable ? 'grab' : 'default';
    this.hitArea = new Rectangle(0, 0, w, h);
  }

  /** Update a single stat value (e.g. from combat damage) */
  updateStat(key: string, value: number): void {
    const stats = [...this._props.stats];
    const stat = stats.find(s => s.key === key);
    if (stat) {
      stat.value = value;
      this.setProps({ stats });
    }
  }

  /** Get current stat value */
  getStat(key: string): number | undefined {
    return this._props.stats.find(s => s.key === key)?.value;
  }

  protected onDispose(): void {
    if (NervContext.available && this._state.dragging) {
      NervContext.instance.resumeViewportDrag();
    }
  }
}
