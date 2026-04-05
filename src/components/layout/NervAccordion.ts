import { Container, Graphics } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import { AnimationManager, Easing } from '../../core/AnimationManager';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervAccordionSection {
  title: string;
  expanded?: boolean;
}

export interface NervAccordionProps extends NervBaseProps {
  sections: NervAccordionSection[];
  color?: NervColor;
  headerHeight?: number;
  sectionGap?: number;
}

interface AccordionSectionState {
  expanded: boolean;
  contentHeight: number;
  animatedHeight: number;
}

interface NervAccordionState extends NervBaseState {
  sectionStates: AccordionSectionState[];
}

const DEFAULT_HEADER_HEIGHT = 32;
const DEFAULT_CONTENT_HEIGHT = 100;

export class NervAccordion extends NervBase<NervAccordionProps, NervAccordionState> {
  private _headers: Graphics[] = [];
  private _headerLabels: Text[] = [];
  private _headerChevrons: Graphics[] = [];
  private _contentAreas: Container[] = [];
  private _contentMasks: Graphics[] = [];
  private _dividers: Graphics[] = [];

  constructor(props: NervAccordionProps) {
    const sectionStates = (props.sections ?? []).map(s => ({
      expanded: s.expanded ?? false,
      contentHeight: DEFAULT_CONTENT_HEIGHT,
      animatedHeight: s.expanded ? DEFAULT_CONTENT_HEIGHT : 0,
    }));
    super(props, {
      focused: false,
      hovered: false,
      pressed: false,
      sectionStates,
    } as NervAccordionState);
  }

  protected defaultProps(): NervAccordionProps {
    return {
      sections: [],
      color: 'orange',
      headerHeight: DEFAULT_HEADER_HEIGHT,
      sectionGap: 1,
      width: 280,
    };
  }

  protected onInit(): void {
    // built in redraw
  }

  getPreferredSize(): Size {
    const p = this._props;
    const hh = p.headerHeight ?? DEFAULT_HEADER_HEIGHT;
    const gap = p.sectionGap ?? 1;
    const sections = p.sections ?? [];
    const states = this._state.sectionStates;

    let totalH = 0;
    for (let i = 0; i < sections.length; i++) {
      totalH += hh;
      if (states[i]) totalH += states[i].animatedHeight;
      if (i < sections.length - 1) totalH += gap;
    }

    return { width: p.width ?? 280, height: Math.max(totalH, hh) };
  }

  /** Get the content container for a specific section index. */
  getSectionContent(index: number): Container | undefined {
    return this._contentAreas[index];
  }

  /** Set the actual content height for a section (call before expanding). */
  setSectionContentHeight(index: number, height: number): void {
    const states = [...this._state.sectionStates];
    if (states[index]) {
      states[index] = { ...states[index], contentHeight: height };
      if (states[index].expanded) {
        states[index].animatedHeight = height;
      }
      this.setState({ sectionStates: states } as Partial<NervAccordionState>);
    }
  }

  toggleSection(index: number): void {
    const states = [...this._state.sectionStates];
    if (!states[index]) return;

    const expanding = !states[index].expanded;
    states[index] = { ...states[index], expanded: expanding };

    // Create a proxy for animating height
    const proxy = { height: states[index].animatedHeight };
    const targetHeight = expanding ? states[index].contentHeight : 0;

    AnimationManager.tween(proxy, { height: targetHeight }, 250, {
      easing: Easing.easeOutCubic,
      onUpdate: () => {
        const updated = [...this._state.sectionStates];
        updated[index] = { ...updated[index], animatedHeight: proxy.height };
        this.setState({ sectionStates: updated } as Partial<NervAccordionState>);
      },
    });

    this.setState({ sectionStates: states } as Partial<NervAccordionState>);
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const w = this.componentWidth;
    const accent = theme.colorForAccent(p.color ?? 'orange');
    const hh = p.headerHeight ?? DEFAULT_HEADER_HEIGHT;
    const gap = p.sectionGap ?? 1;
    const sections = p.sections ?? [];
    const states = this._state.sectionStates;

    // Clean up old display objects
    this._cleanupDisplayObjects();

    let cursorY = 0;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sState = states[i];
      if (!sState) continue;

      // Header background
      const headerBg = new Graphics();
      headerBg.rect(0, cursorY, w, hh);
      headerBg.fill({ color: theme.semantic.bgPanel, alpha: 1 });
      headerBg.setStrokeStyle({ width: 1, color: accent, alpha: 0.4 });
      headerBg.rect(0, cursorY, w, hh);
      headerBg.stroke();
      this.addChild(headerBg);
      this._headers.push(headerBg);

      // Header label
      const label = TextRenderer.create({
        text: section.title,
        role: 'display',
        size: theme.fontSizes.sm,
        color: sState.expanded ? accent : theme.semantic.textPrimary,
      });
      label.x = theme.spacing.sm;
      label.y = cursorY + Math.round((hh - label.height) / 2);
      this.addChild(label);
      this._headerLabels.push(label);

      // Chevron indicator
      const chevron = new Graphics();
      const chevronSize = 5;
      const chevronX = w - theme.spacing.md - chevronSize;
      const chevronY = cursorY + hh / 2;
      chevron.setStrokeStyle({ width: 1.5, color: accent, alpha: 0.8 });
      if (sState.expanded) {
        // Down chevron
        chevron.moveTo(chevronX - chevronSize, chevronY - 2);
        chevron.lineTo(chevronX, chevronY + 3);
        chevron.lineTo(chevronX + chevronSize, chevronY - 2);
      } else {
        // Right chevron
        chevron.moveTo(chevronX - 2, chevronY - chevronSize);
        chevron.lineTo(chevronX + 3, chevronY);
        chevron.lineTo(chevronX - 2, chevronY + chevronSize);
      }
      chevron.stroke();
      this.addChild(chevron);
      this._headerChevrons.push(chevron);

      // Hit area for header
      headerBg.eventMode = 'static';
      headerBg.cursor = 'pointer';
      const sectionIndex = i;
      headerBg.on('pointerup', () => this.toggleSection(sectionIndex));

      cursorY += hh;

      // Content area (masked by animatedHeight)
      if (sState.animatedHeight > 0) {
        const contentContainer = new Container();
        contentContainer.y = cursorY;
        this.addChild(contentContainer);
        this._contentAreas.push(contentContainer);

        // Mask to clip content
        const mask = new Graphics();
        mask.rect(0, cursorY, w, sState.animatedHeight);
        mask.fill({ color: 0xffffff });
        this.addChild(mask);
        contentContainer.mask = mask;
        this._contentMasks.push(mask);

        cursorY += sState.animatedHeight;
      } else {
        this._contentAreas.push(new Container());
        this._contentMasks.push(new Graphics());
      }

      // Gap divider
      if (i < sections.length - 1 && gap > 0) {
        const divider = new Graphics();
        divider.rect(0, cursorY, w, gap);
        divider.fill({ color: accent, alpha: 0.2 });
        this.addChild(divider);
        this._dividers.push(divider);
        cursorY += gap;
      }
    }

    const totalH = cursorY;
    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= w && y >= 0 && y <= totalH };
  }

  private _cleanupDisplayObjects(): void {
    for (const h of this._headers) { h.removeAllListeners(); this.removeChild(h); h.destroy(); }
    for (const l of this._headerLabels) { this.removeChild(l); l.destroy(); }
    for (const c of this._headerChevrons) { this.removeChild(c); c.destroy(); }
    for (const ca of this._contentAreas) { this.removeChild(ca); ca.destroy({ children: true }); }
    for (const m of this._contentMasks) { this.removeChild(m); m.destroy(); }
    for (const d of this._dividers) { this.removeChild(d); d.destroy(); }
    this._headers = [];
    this._headerLabels = [];
    this._headerChevrons = [];
    this._contentAreas = [];
    this._contentMasks = [];
    this._dividers = [];
  }

  protected onDispose(): void {
    this._cleanupDisplayObjects();
  }
}
