import type { NervColor } from './types';

export interface NervColorTokens {
  black: number;
  red: number;
  orange: number;
  green: number;
  cyan: number;
  amber: number;
  white: number;
  darkGray: number;
  midGray: number;
  panel: number;
  purple: number;
  magenta: number;
  lcdGreen: number;
}

export interface NervSemanticColors {
  bgBase: number;
  bgPanel: number;
  bgOverlay: number;
  textPrimary: number;
  textSecondary: number;
  textMuted: number;
  accentPrimary: number;
  accentSecondary: number;
  accentTertiary: number;
  alertDanger: number;
  alertWarning: number;
  alertSuccess: number;
  borderDefault: number;
  borderFocus: number;
  borderDanger: number;
}

export interface NervFontConfig {
  family: string;
  fallbacks: string[];
}

export interface NervFontTokens {
  display: NervFontConfig;
  mono: NervFontConfig;
  body: NervFontConfig;
  title: NervFontConfig;
}

export interface NervFontSizes {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  display: number;
}

export interface NervSpacingTokens {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface NervEffectTokens {
  borderRadius: number;
  borderWidth: number;
  borderAlpha: number;
  glowStrength: number;
  letterSpacingTight: number;
  letterSpacingNormal: number;
  letterSpacingWide: number;
  letterSpacingExtraWide: number;
  scanlineAlpha: number;
  scanlineSpacing: number;
}

export interface NervThemeConfig {
  colors: NervColorTokens;
  semantic: NervSemanticColors;
  fonts: NervFontTokens;
  fontSizes: NervFontSizes;
  spacing: NervSpacingTokens;
  effects: NervEffectTokens;
}

const DEFAULT_COLORS: NervColorTokens = {
  black: 0x000000,
  red: 0xFF0000,
  orange: 0xFF9900,
  green: 0x00FF00,
  cyan: 0x00FFFF,
  amber: 0xFFAA00,
  white: 0xE0E0E0,
  darkGray: 0x1A1A1A,
  midGray: 0x555555,
  panel: 0x0A0A0A,
  purple: 0x9933FF,
  magenta: 0xFF00FF,
  lcdGreen: 0x39FF14,
};

const DEFAULT_SEMANTIC: NervSemanticColors = {
  bgBase: DEFAULT_COLORS.black,
  bgPanel: DEFAULT_COLORS.panel,
  bgOverlay: 0x0A0A14,
  textPrimary: DEFAULT_COLORS.white,
  textSecondary: 0xAAAAAA,
  textMuted: DEFAULT_COLORS.midGray,
  accentPrimary: DEFAULT_COLORS.orange,
  accentSecondary: DEFAULT_COLORS.cyan,
  accentTertiary: DEFAULT_COLORS.green,
  alertDanger: DEFAULT_COLORS.red,
  alertWarning: DEFAULT_COLORS.amber,
  alertSuccess: DEFAULT_COLORS.green,
  borderDefault: DEFAULT_COLORS.midGray,
  borderFocus: DEFAULT_COLORS.orange,
  borderDanger: DEFAULT_COLORS.red,
};

const DEFAULT_FONTS: NervFontTokens = {
  display: { family: 'Oswald', fallbacks: ['Impact', 'Arial Black', 'sans-serif'] },
  mono: { family: 'Fira Code', fallbacks: ['JetBrains Mono', 'Consolas', 'monospace'] },
  body: { family: 'Barlow Condensed', fallbacks: ['Arial Narrow', 'sans-serif'] },
  title: { family: 'Noto Serif JP', fallbacks: ['Playfair Display', 'Georgia', 'serif'] },
};

const DEFAULT_FONT_SIZES: NervFontSizes = { xs: 8, sm: 10, md: 12, lg: 14, xl: 18, xxl: 24, display: 32 };
const DEFAULT_SPACING: NervSpacingTokens = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

const DEFAULT_EFFECTS: NervEffectTokens = {
  borderRadius: 0,
  borderWidth: 1,
  borderAlpha: 0.7,
  glowStrength: 4,
  letterSpacingTight: 0.14,
  letterSpacingNormal: 0.18,
  letterSpacingWide: 0.22,
  letterSpacingExtraWide: 0.26,
  scanlineAlpha: 0.04,
  scanlineSpacing: 2,
};

function deepMerge<T>(base: T, overrides: Partial<T>): T {
  const result = { ...base } as T;
  for (const key in overrides) {
    const val = overrides[key as keyof T];
    if (val !== undefined && typeof val === 'object' && !Array.isArray(val) && val !== null) {
      (result as Record<string, unknown>)[key] = deepMerge((base as Record<string, unknown>)[key], val);
    } else if (val !== undefined) {
      (result as Record<string, unknown>)[key] = val;
    }
  }
  return result;
}

export class NervTheme {
  private static _instance: NervTheme | null = null;
  private _config: NervThemeConfig;

  private constructor(overrides?: Partial<NervThemeConfig>) {
    this._config = {
      colors: overrides?.colors ? deepMerge(DEFAULT_COLORS, overrides.colors) : { ...DEFAULT_COLORS },
      semantic: overrides?.semantic ? deepMerge(DEFAULT_SEMANTIC, overrides.semantic) : { ...DEFAULT_SEMANTIC },
      fonts: overrides?.fonts ? deepMerge(DEFAULT_FONTS, overrides.fonts) : { ...DEFAULT_FONTS },
      fontSizes: overrides?.fontSizes ? deepMerge(DEFAULT_FONT_SIZES, overrides.fontSizes) : { ...DEFAULT_FONT_SIZES },
      spacing: overrides?.spacing ? deepMerge(DEFAULT_SPACING, overrides.spacing) : { ...DEFAULT_SPACING },
      effects: overrides?.effects ? deepMerge(DEFAULT_EFFECTS, overrides.effects) : { ...DEFAULT_EFFECTS },
    };
  }

  static get instance(): NervTheme {
    if (!NervTheme._instance) {
      NervTheme._instance = new NervTheme();
    }
    return NervTheme._instance;
  }

  static initialize(overrides?: Partial<NervThemeConfig>): NervTheme {
    NervTheme._instance = new NervTheme(overrides);
    return NervTheme._instance;
  }

  get colors(): Readonly<NervColorTokens> { return this._config.colors; }
  get semantic(): Readonly<NervSemanticColors> { return this._config.semantic; }
  get fonts(): Readonly<NervFontTokens> { return this._config.fonts; }
  get fontSizes(): Readonly<NervFontSizes> { return this._config.fontSizes; }
  get spacing(): Readonly<NervSpacingTokens> { return this._config.spacing; }
  get effects(): Readonly<NervEffectTokens> { return this._config.effects; }

  colorForAccent(accent: NervColor): number {
    const map: Record<NervColor, number> = {
      orange: this._config.colors.orange,
      green: this._config.colors.green,
      cyan: this._config.colors.cyan,
      red: this._config.colors.red,
      magenta: this._config.colors.magenta,
      amber: this._config.colors.amber,
      purple: this._config.colors.purple,
      lcdGreen: this._config.colors.lcdGreen,
      white: this._config.colors.white,
    };
    return map[accent];
  }

  fontFamily(role: keyof NervFontTokens): string {
    const f = this._config.fonts[role];
    return [f.family, ...f.fallbacks].join(', ');
  }
}
