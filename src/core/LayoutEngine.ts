import { Container } from 'pixi.js';
import { NervBase } from './NervBase';
import type { LayoutConfig, Size } from './types';

export class LayoutEngine {
  static layout(container: Container, config: LayoutConfig, availableWidth: number, availableHeight: number): void {
    const children = container.children.filter((c): c is NervBase => c instanceof NervBase && c.visible);
    if (!children.length) return;

    const { direction, align, justify, gap, padding } = config;
    const isRow = direction === 'row';

    const contentW = availableWidth - padding.left - padding.right;
    const contentH = availableHeight - padding.top - padding.bottom;

    // Measure children
    const sizes: Size[] = children.map(child => {
      const pref = child.getPreferredSize();
      return {
        width: child.layoutWidth === 'fill' ? 0 : child.layoutWidth === 'auto' ? pref.width : child.layoutWidth,
        height: child.layoutHeight === 'fill' ? 0 : child.layoutHeight === 'auto' ? pref.height : child.layoutHeight,
      };
    });

    // Calculate total fixed size along main axis
    const totalGaps = (children.length - 1) * gap;
    const totalMargins = children.reduce((sum, c) => sum + (isRow ? c.margin.left + c.margin.right : c.margin.top + c.margin.bottom), 0);
    const mainAxis = isRow ? contentW : contentH;

    let fixedMain = 0;
    let totalGrow = 0;
    for (let i = 0; i < children.length; i++) {
      const s = isRow ? sizes[i].width : sizes[i].height;
      fixedMain += s + (isRow ? children[i].margin.left + children[i].margin.right : children[i].margin.top + children[i].margin.bottom);
      totalGrow += children[i].flexGrow;
    }

    const freeSpace = Math.max(0, mainAxis - fixedMain - totalGaps);

    // Distribute flex space
    const finalSizes = sizes.map((s, i) => {
      const child = children[i];
      const main = isRow ? s.width : s.height;
      const cross = isRow ? s.height : s.width;
      const growShare = totalGrow > 0 ? (child.flexGrow / totalGrow) * freeSpace : 0;

      const finalMain = (isRow && child.layoutWidth === 'fill') || (!isRow && child.layoutHeight === 'fill')
        ? freeSpace / children.filter(c => (isRow ? c.layoutWidth : c.layoutHeight) === 'fill').length
        : main + growShare;

      let finalCross = cross;
      if (align === 'stretch') {
        finalCross = isRow ? contentH - child.margin.top - child.margin.bottom : contentW - child.margin.left - child.margin.right;
      }

      return { main: finalMain, cross: finalCross };
    });

    // Calculate justify offset
    const totalMain = finalSizes.reduce((sum, s) => sum + s.main, 0) + totalGaps + totalMargins;
    let mainOffset = 0;
    let mainGap = gap;

    switch (justify) {
      case 'center': mainOffset = (mainAxis - totalMain) / 2; break;
      case 'end': mainOffset = mainAxis - totalMain; break;
      case 'space-between':
        mainGap = children.length > 1 ? (mainAxis - totalMain + totalGaps) / (children.length - 1) : 0;
        break;
      case 'space-around': {
        const space = (mainAxis - totalMain + totalGaps) / children.length;
        mainOffset = space / 2;
        mainGap = space;
        break;
      }
    }

    // Position children
    let cursor = (isRow ? padding.left : padding.top) + mainOffset;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const { main, cross } = finalSizes[i];

      const mainMarginBefore = isRow ? child.margin.left : child.margin.top;
      const mainMarginAfter = isRow ? child.margin.right : child.margin.bottom;
      const crossMarginBefore = isRow ? child.margin.top : child.margin.left;

      cursor += mainMarginBefore;

      // Cross-axis alignment
      const crossAxis = isRow ? contentH : contentW;
      let crossPos = isRow ? padding.top : padding.left;

      switch (align) {
        case 'center': crossPos += (crossAxis - cross) / 2; break;
        case 'end': crossPos += crossAxis - cross; break;
        case 'stretch':
        case 'start': crossPos += crossMarginBefore; break;
      }

      if (isRow) {
        child.x = cursor;
        child.y = crossPos;
      } else {
        child.x = crossPos;
        child.y = cursor;
      }

      // Apply size via setProps
      child.setProps({ width: isRow ? main : cross, height: isRow ? cross : main } as never);

      cursor += main + mainMarginAfter + mainGap;
    }
  }

  static measure(container: Container, config: LayoutConfig): Size {
    const children = container.children.filter((c): c is NervBase => c instanceof NervBase && c.visible);
    const { direction, gap, padding } = config;
    const isRow = direction === 'row';

    let mainTotal = 0;
    let crossMax = 0;

    for (const child of children) {
      const pref = child.getPreferredSize();
      const w = child.layoutWidth === 'auto' ? pref.width : typeof child.layoutWidth === 'number' ? child.layoutWidth : 0;
      const h = child.layoutHeight === 'auto' ? pref.height : typeof child.layoutHeight === 'number' ? child.layoutHeight : 0;

      mainTotal += isRow ? w + child.margin.left + child.margin.right : h + child.margin.top + child.margin.bottom;
      crossMax = Math.max(crossMax, isRow ? h + child.margin.top + child.margin.bottom : w + child.margin.left + child.margin.right);
    }

    mainTotal += (children.length - 1) * gap;

    return {
      width: (isRow ? mainTotal : crossMax) + padding.left + padding.right,
      height: (isRow ? crossMax : mainTotal) + padding.top + padding.bottom,
    };
  }
}
