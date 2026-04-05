export type NervColor = 'orange' | 'green' | 'cyan' | 'red' | 'magenta' | 'amber' | 'purple' | 'lcdGreen' | 'white';

export type FlexDirection = 'row' | 'column';
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch';
export type FlexJustify = 'start' | 'center' | 'end' | 'space-between' | 'space-around';

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface LayoutConfig {
  direction: FlexDirection;
  align: FlexAlign;
  justify: FlexJustify;
  gap: number;
  padding: Insets;
  wrap: boolean;
}

export interface Size {
  width: number;
  height: number;
}

export type NervTextRole = 'display' | 'mono' | 'body' | 'title';

export const INSETS_ZERO: Readonly<Insets> = { top: 0, right: 0, bottom: 0, left: 0 };

export function insets(all: number): Insets;
export function insets(vertical: number, horizontal: number): Insets;
export function insets(top: number, right: number, bottom: number, left: number): Insets;
export function insets(a: number, b?: number, c?: number, d?: number): Insets {
  if (b === undefined) return { top: a, right: a, bottom: a, left: a };
  if (c === undefined) return { top: a, right: b, bottom: a, left: b };
  return { top: a, right: b, bottom: c, left: d! };
}
