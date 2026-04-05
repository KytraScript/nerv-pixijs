import { Graphics, Container } from 'pixi.js';
import { NervBase } from '../../core/NervBase';
import type { NervBaseProps, NervBaseState } from '../../core/NervBase';
import { TextRenderer } from '../../core/TextRenderer';
import type { NervColor, Size } from '../../core/types';
import type { Text } from 'pixi.js';

export interface NervDataGridColumn {
  key: string;
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  type?: 'text' | 'number';
}

export interface NervDataGridProps extends NervBaseProps {
  columns?: NervDataGridColumn[];
  data?: Record<string, unknown>[];
  color?: NervColor;
  title?: string;
  pageSize?: number;
  onRowClick?: (row: Record<string, unknown>, index: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
}

interface NervDataGridState extends NervBaseState {
  currentPage: number;
  sortKey: string | null;
  sortDirection: 'asc' | 'desc';
  hoveredRow: number;
}

const ROW_HEIGHT = 24;
const HEADER_HEIGHT = 28;
const TITLE_HEIGHT = 24;
const PADDING = 8;

export class NervDataGrid extends NervBase<NervDataGridProps, NervDataGridState> {
  private _bg = new Graphics();
  private _border = new Graphics();
  private _headerBg = new Graphics();
  private _rowGraphics = new Graphics();
  private _headerContainer = new Container();
  private _bodyContainer = new Container();
  private _paginationContainer = new Container();
  private _titleText: Text | null = null;
  private _headerTexts: Text[] = [];
  private _cellTexts: Text[] = [];
  private _paginationTexts: Text[] = [];
  private _sortIndicators: Text[] = [];

  constructor(props: NervDataGridProps) {
    super(props, {
      focused: false,
      hovered: false,
      pressed: false,
      currentPage: 0,
      sortKey: null,
      sortDirection: 'asc' as const,
      hoveredRow: -1,
    });
  }

  protected defaultProps(): NervDataGridProps {
    return {
      columns: [],
      data: [],
      color: 'cyan',
      pageSize: 10,
    };
  }

  protected onInit(): void {
    this.addChild(this._bg, this._border, this._headerBg, this._headerContainer, this._bodyContainer, this._paginationContainer);

    this.on('pointermove', (e) => {
      const local = this.toLocal(e.global);
      const titleOffset = this._props.title ? TITLE_HEIGHT : 0;
      const bodyTop = PADDING + titleOffset + HEADER_HEIGHT;
      if (local.y >= bodyTop) {
        const row = Math.floor((local.y - bodyTop) / ROW_HEIGHT);
        const pageSize = this._props.pageSize ?? 10;
        if (row >= 0 && row < pageSize && row < this.getPageData().length) {
          if (this._state.hoveredRow !== row) this.setState({ hoveredRow: row });
        } else {
          if (this._state.hoveredRow !== -1) this.setState({ hoveredRow: -1 });
        }
      } else {
        if (this._state.hoveredRow !== -1) this.setState({ hoveredRow: -1 });
      }
    });

    this.on('pointerout', () => {
      if (this._state.hoveredRow !== -1) this.setState({ hoveredRow: -1 });
    });

    this.on('pointerup', (e) => {
      if (this.isDisabled) return;
      const local = this.toLocal(e.global);
      const columns = this._props.columns ?? [];
      const titleOffset = this._props.title ? TITLE_HEIGHT : 0;
      const headerTop = PADDING + titleOffset;
      const bodyTop = headerTop + HEADER_HEIGHT;

      // Header click for sorting
      if (local.y >= headerTop && local.y < bodyTop) {
        let xOffset = PADDING;
        for (const col of columns) {
          if (col.sortable && local.x >= xOffset && local.x < xOffset + col.width) {
            const newDir = this._state.sortKey === col.key && this._state.sortDirection === 'asc' ? 'desc' : 'asc';
            this.setState({ sortKey: col.key, sortDirection: newDir, currentPage: 0 });
            this._props.onSort?.(col.key, newDir);
            return;
          }
          xOffset += col.width;
        }
      }

      // Row click
      if (local.y >= bodyTop && this._state.hoveredRow >= 0) {
        const pageData = this.getPageData();
        if (this._state.hoveredRow < pageData.length) {
          const absoluteIndex = this._state.currentPage * (this._props.pageSize ?? 10) + this._state.hoveredRow;
          this._props.onRowClick?.(pageData[this._state.hoveredRow], absoluteIndex);
        }
      }
    });
  }

  private getSortedData(): Record<string, unknown>[] {
    const data = [...(this._props.data ?? [])];
    const { sortKey, sortDirection } = this._state;
    if (!sortKey) return data;

    data.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      let cmp = 0;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va ?? '').localeCompare(String(vb ?? ''));
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return data;
  }

  private getPageData(): Record<string, unknown>[] {
    const sorted = this.getSortedData();
    const pageSize = this._props.pageSize ?? 10;
    const start = this._state.currentPage * pageSize;
    return sorted.slice(start, start + pageSize);
  }

  private get totalPages(): number {
    const data = this._props.data ?? [];
    const pageSize = this._props.pageSize ?? 10;
    return Math.max(1, Math.ceil(data.length / pageSize));
  }

  private computeWidth(): number {
    if (this._props.width) return this._props.width;
    const columns = this._props.columns ?? [];
    return columns.reduce((sum, c) => sum + c.width, 0) + PADDING * 2;
  }

  getPreferredSize(): Size {
    const pageSize = this._props.pageSize ?? 10;
    const titleOffset = this._props.title ? TITLE_HEIGHT : 0;
    const paginationHeight = 28;
    return {
      width: this.computeWidth(),
      height: PADDING + titleOffset + HEADER_HEIGHT + ROW_HEIGHT * pageSize + paginationHeight + PADDING,
    };
  }

  protected redraw(): void {
    const p = this._props;
    const theme = this.theme;
    const accent = theme.colorForAccent(p.color ?? 'cyan');
    const columns = p.columns ?? [];
    const w = this.computeWidth();
    const { height: h } = this.getPreferredSize();
    const titleOffset = p.title ? TITLE_HEIGHT : 0;

    // Clear old texts
    this.clearTexts();

    // Background
    this._bg.clear();
    this._bg.rect(0, 0, w, h);
    this._bg.fill({ color: theme.semantic.bgPanel });

    // Border
    this._border.clear();
    this._border.setStrokeStyle({ width: theme.effects.borderWidth, color: accent, alpha: theme.effects.borderAlpha });
    this._border.rect(0, 0, w, h);
    this._border.stroke();

    // Title
    if (p.title) {
      if (this._titleText) { this._titleText.destroy(); this.removeChild(this._titleText); }
      this._titleText = TextRenderer.create({
        text: p.title,
        role: 'display',
        size: theme.fontSizes.sm,
        color: accent,
      });
      this._titleText.x = PADDING;
      this._titleText.y = PADDING;
      this.addChild(this._titleText);
    }

    // Header background
    const headerY = PADDING + titleOffset;
    this._headerBg.clear();
    this._headerBg.rect(0, headerY, w, HEADER_HEIGHT);
    this._headerBg.fill({ color: accent, alpha: 0.15 });

    // Header separator
    this._headerBg.setStrokeStyle({ width: 1, color: accent, alpha: 0.4 });
    this._headerBg.moveTo(0, headerY + HEADER_HEIGHT);
    this._headerBg.lineTo(w, headerY + HEADER_HEIGHT);
    this._headerBg.stroke();

    // Header texts
    this._headerContainer.removeChildren();
    let xPos = PADDING;
    for (const col of columns) {
      const sortIndicator = this._state.sortKey === col.key
        ? (this._state.sortDirection === 'asc' ? ' ^' : ' v')
        : '';
      const headerText = TextRenderer.create({
        text: col.header + sortIndicator,
        role: 'mono',
        size: theme.fontSizes.xs,
        color: accent,
      });
      headerText.x = xPos;
      headerText.y = headerY + Math.round((HEADER_HEIGHT - headerText.height) / 2);
      this._headerContainer.addChild(headerText);
      this._headerTexts.push(headerText);
      xPos += col.width;
    }

    // Body rows
    this._bodyContainer.removeChildren();
    this._rowGraphics.clear();
    this._bodyContainer.addChild(this._rowGraphics);

    const pageData = this.getPageData();
    const bodyTop = headerY + HEADER_HEIGHT;

    for (let rowIdx = 0; rowIdx < pageData.length; rowIdx++) {
      const row = pageData[rowIdx];
      const rowY = bodyTop + rowIdx * ROW_HEIGHT;

      // Row highlight
      if (rowIdx === this._state.hoveredRow) {
        this._rowGraphics.rect(0, rowY, w, ROW_HEIGHT);
        this._rowGraphics.fill({ color: accent, alpha: 0.1 });
      }

      // Alternating subtle stripe
      if (rowIdx % 2 === 1 && rowIdx !== this._state.hoveredRow) {
        this._rowGraphics.rect(0, rowY, w, ROW_HEIGHT);
        this._rowGraphics.fill({ color: theme.semantic.bgOverlay, alpha: 0.3 });
      }

      // Cell values
      let cellX = PADDING;
      for (const col of columns) {
        const value = String(row[col.key] ?? '');
        const cellText = TextRenderer.create({
          text: value,
          role: 'mono',
          size: theme.fontSizes.xs,
          color: theme.semantic.textPrimary,
          uppercase: false,
        });

        const align = col.align ?? 'left';
        if (align === 'right') {
          cellText.x = cellX + col.width - cellText.width - PADDING;
        } else if (align === 'center') {
          cellText.x = cellX + Math.round((col.width - cellText.width) / 2);
        } else {
          cellText.x = cellX;
        }
        cellText.y = rowY + Math.round((ROW_HEIGHT - cellText.height) / 2);
        this._bodyContainer.addChild(cellText);
        this._cellTexts.push(cellText);
        cellX += col.width;
      }
    }

    // Pagination
    this._paginationContainer.removeChildren();
    const pagY = bodyTop + (p.pageSize ?? 10) * ROW_HEIGHT + 4;
    const totalPages = this.totalPages;
    const currentPage = this._state.currentPage;

    const pageInfo = TextRenderer.create({
      text: `PAGE ${currentPage + 1}/${totalPages}`,
      role: 'mono',
      size: theme.fontSizes.xs,
      color: theme.semantic.textSecondary,
    });
    pageInfo.x = Math.round((w - pageInfo.width) / 2);
    pageInfo.y = pagY;
    this._paginationContainer.addChild(pageInfo);
    this._paginationTexts.push(pageInfo);

    if (totalPages > 1) {
      // Prev button
      const prev = TextRenderer.create({
        text: '<< PREV',
        role: 'mono',
        size: theme.fontSizes.xs,
        color: currentPage > 0 ? accent : theme.semantic.textMuted,
      });
      prev.x = PADDING;
      prev.y = pagY;
      prev.eventMode = 'static';
      prev.cursor = currentPage > 0 ? 'pointer' : 'default';
      prev.on('pointerup', () => {
        if (currentPage > 0) this.setState({ currentPage: currentPage - 1, hoveredRow: -1 });
      });
      this._paginationContainer.addChild(prev);
      this._paginationTexts.push(prev);

      // Next button
      const next = TextRenderer.create({
        text: 'NEXT >>',
        role: 'mono',
        size: theme.fontSizes.xs,
        color: currentPage < totalPages - 1 ? accent : theme.semantic.textMuted,
      });
      next.x = w - PADDING - next.width;
      next.y = pagY;
      next.eventMode = 'static';
      next.cursor = currentPage < totalPages - 1 ? 'pointer' : 'default';
      next.on('pointerup', () => {
        if (currentPage < totalPages - 1) this.setState({ currentPage: currentPage + 1, hoveredRow: -1 });
      });
      this._paginationContainer.addChild(next);
      this._paginationTexts.push(next);
    }

    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= w && y >= 0 && y <= h };
  }

  /** Navigate to a specific page (0-indexed). */
  goToPage(page: number): void {
    const clamped = Math.max(0, Math.min(this.totalPages - 1, page));
    this.setState({ currentPage: clamped, hoveredRow: -1 });
  }

  private clearTexts(): void {
    for (const t of this._headerTexts) t.destroy();
    for (const t of this._cellTexts) t.destroy();
    for (const t of this._paginationTexts) t.destroy();
    for (const t of this._sortIndicators) t.destroy();
    this._headerTexts.length = 0;
    this._cellTexts.length = 0;
    this._paginationTexts.length = 0;
    this._sortIndicators.length = 0;
  }

  protected onDispose(): void {
    this.clearTexts();
    this._titleText?.destroy();
    this._bg.destroy();
    this._border.destroy();
    this._headerBg.destroy();
    this._rowGraphics.destroy();
    this._headerContainer.destroy({ children: true });
    this._bodyContainer.destroy({ children: true });
    this._paginationContainer.destroy({ children: true });
  }
}
