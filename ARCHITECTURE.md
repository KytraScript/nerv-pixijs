# NERV-PixiJS Component Library Architecture

**A PixiJS 8 canvas-based component library with NERV/Evangelion visual design language.**
**Reference:** [NERV-UI by mdrbx](https://mdrbx.github.io/nerv-ui/docs/) (React) -- translated to pure WebGL canvas.

---

## Project Overview

48 components across 7 categories, rendered entirely in PixiJS WebGL. No DOM rendering -- everything is GPU-accelerated on an infinite canvas via `pixi-viewport`.

**Tech Stack:**
- PixiJS 8.6+ (WebGL/WebGPU renderer)
- pixi-viewport 6.x (infinite canvas with zoom/pan)
- TypeScript 5.8+
- Vite 6.x (dev + library build via `vite-plugin-dts`)
- Vitest (testing)

---

## Directory Structure

```
nerv-pixijs/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── index.html                          # Dev playground harness
├── src/
│   ├── index.ts                        # Public API barrel export
│   ├── core/
│   │   ├── NervTheme.ts                # Design token system (singleton)
│   │   ├── NervBase.ts                 # Base component class (abstract)
│   │   ├── NervApp.ts                  # App bootstrap + viewport + stage hierarchy
│   │   ├── InputManager.ts             # Mouse/keyboard routing, hidden DOM input proxy
│   │   ├── FocusManager.ts             # Tab order, focus ring, keyboard navigation
│   │   ├── LayoutEngine.ts             # Flexbox-like layout solver
│   │   ├── AnimationManager.ts         # Tween engine + NERV effect presets
│   │   ├── TextRenderer.ts             # BitmapText/Text abstraction + font loading
│   │   ├── ObjectPool.ts              # Generic object recycling pool
│   │   ├── CullingManager.ts           # Spatial hash grid viewport culling
│   │   ├── PropSystem.ts              # Reactive prop diffing
│   │   └── types.ts                    # Shared type definitions
│   ├── primitives/
│   │   ├── NervPanel.ts                # Bordered panel (Graphics)
│   │   ├── NervLabel.ts                # Styled text label
│   │   ├── NervIcon.ts                 # Sprite-based icon
│   │   ├── NervLine.ts                 # Styled line/divider
│   │   └── NervGlow.ts                 # Glow filter wrapper
│   ├── effects/
│   │   ├── ScanlineOverlay.ts          # CRT scanline effect
│   │   ├── GlowFilter.ts              # Ambient glow (amber/cyan)
│   │   ├── FlickerEffect.ts           # Text/element flicker
│   │   └── GridPattern.ts             # Hex grid / surveillance grid
│   ├── components/
│   │   ├── layout/
│   │   │   ├── NervCard.ts
│   │   │   ├── NervAccordion.ts
│   │   │   ├── NervDivider.ts
│   │   │   ├── NervDrawer.ts
│   │   │   ├── NervGrid.ts
│   │   │   ├── TargetingContainer.ts
│   │   │   ├── HexGridBackground.ts
│   │   │   └── MonitorOverlay.ts
│   │   ├── forms/
│   │   │   ├── NervButton.ts
│   │   │   ├── NervInputField.ts
│   │   │   ├── NervSelectMenu.ts
│   │   │   ├── NervCheckbox.ts
│   │   │   ├── NervToggle.ts
│   │   │   ├── NervRadioGroup.ts
│   │   │   ├── NervSlider.ts
│   │   │   └── NervTextArea.ts
│   │   ├── data-display/
│   │   │   ├── NervTerminalDisplay.ts
│   │   │   ├── NervDataGrid.ts
│   │   │   ├── NervSyncProgressBar.ts
│   │   │   ├── NervSegmentDisplay.ts
│   │   │   ├── NervBadge.ts
│   │   │   ├── NervChip.ts
│   │   │   ├── NervAvatar.ts
│   │   │   └── NervTooltip.ts
│   │   ├── charts/
│   │   │   ├── NervBarChart.ts
│   │   │   ├── NervGauge.ts
│   │   │   ├── NervPieChart.ts
│   │   │   ├── NervSyncRatioChart.ts
│   │   │   ├── NervLineChart.ts
│   │   │   └── NervSparkline.ts
│   │   ├── overlays/
│   │   │   ├── NervSystemDialog.ts
│   │   │   ├── NervClassifiedOverlay.ts
│   │   │   ├── NervTitleScreen.ts
│   │   │   ├── NervToast.ts
│   │   │   ├── NervPopover.ts
│   │   │   ├── NervContextMenu.ts
│   │   │   └── NervLoadingScreen.ts
│   │   ├── navigation/
│   │   │   ├── NervNavigationTabs.ts
│   │   │   ├── NervEmergencyBanner.ts
│   │   │   └── NervStepper.ts
│   │   └── hud/
│   │       ├── NervTargetingReticle.ts
│   │       ├── NervSurveillanceGrid.ts
│   │       ├── NervPatternAlert.ts
│   │       ├── NervMagiSystemPanel.ts
│   │       ├── NervStatusIndicator.ts
│   │       ├── NervMinimap.ts
│   │       ├── NervNodeConnector.ts
│   │       └── NervCommandPalette.ts
│   ├── playground/
│   │   ├── main.ts                     # Dev playground entry
│   │   └── scenes/
│   │       ├── AllComponents.ts
│   │       ├── FormDemo.ts
│   │       ├── InfiniteCanvasDemo.ts
│   │       └── PerformanceStress.ts
│   └── websocket/
│       ├── NervSocket.ts               # WebSocket client wrapper
│       └── NervSocketBridge.ts         # Binds socket data to components
```

---

## Core Systems

### NervTheme -- Design Token System

Singleton registry for all visual tokens. Components never hardcode colors/fonts -- they read from the theme.

**Color Tokens:**
| Token | Hex | Usage |
|---|---|---|
| black | #000000 | Backgrounds |
| red | #FF0000 | Danger/alerts |
| orange | #FF9900 | Primary accent |
| green | #00FF00 | Success/status |
| cyan | #00FFFF | Secondary accent |
| amber | #FFAA00 | Warnings |
| white | #E0E0E0 | Text |
| darkGray | #1A1A1A | Panel backgrounds |
| midGray | #555555 | Borders, muted text |
| magenta | #FF00FF | Tertiary accent |
| purple | #9933FF | Alternative accent |
| lcdGreen | #39FF14 | Segment displays |

**Semantic Colors:** bgBase, bgPanel, bgOverlay, textPrimary, textSecondary, textMuted, accentPrimary (orange), accentSecondary (cyan), accentTertiary (green), alertDanger, alertWarning, alertSuccess, borderDefault, borderFocus, borderDanger.

**Typography:**
| Role | Family | Usage |
|---|---|---|
| display | Oswald, Impact | Headers, labels |
| mono | Fira Code, JetBrains Mono | Data, terminal, readouts |
| body | Barlow Condensed | Body text, descriptions |
| title | Noto Serif JP, Playfair Display | Cinematic titles |

**Font Sizes:** xs(8), sm(10), md(12), lg(14), xl(18), xxl(24), display(32)

**Spacing:** xxs(2), xs(4), sm(8), md(12), lg(16), xl(24), xxl(32), xxxl(48)

**Effects:**
- borderRadius: 0 (brutalist, no rounding)
- borderWidth: 1
- borderAlpha: 0.7
- glowStrength: 4
- letterSpacing: tight(0.14), normal(0.18), wide(0.22), extraWide(0.26)
- scanlineAlpha: 0.04, scanlineSpacing: 2

### NervBase -- Base Component Class

Abstract superclass extending PixiJS `Container`. Every component inherits from this.

**Lifecycle:**
1. Constructor receives props -> merges with defaults -> calls `onInit()` -> schedules `redraw()`
2. `setProps(partial)` diffs against current props -> calls `onPropsChanged()` -> schedules `redraw()`
3. `setState(partial)` updates internal state -> calls `onStateChanged()` -> schedules `redraw()`
4. `redraw()` is batched -- multiple prop/state changes in one frame coalesce into a single redraw
5. `destroy()` calls `onDestroy()` hook -> cleans up tweens, pool objects, culling registration

**Key features:**
- Props are read-only from outside (set via `setProps()`)
- State is internal only (set via `setState()`)
- Layout hints: `layoutWidth`, `layoutHeight`, `flexGrow`, `flexShrink`, `margin`, `padding`
- Interaction setup: `eventMode = 'static'`, pointer events -> hover/press state
- Theme access via `this.theme` shortcut
- Every component declares `getPreferredSize()` for the layout engine

### InputManager -- Event Routing

Bridges raw canvas events to components:
- **Keyboard:** Listens to `document.keydown/keyup`, routes to focused component
- **Text input proxy:** Hidden `<input>`/`<textarea>` DOM elements for OS keyboard, IME, clipboard support. Activated when a NervInputField gains focus.
- **Drag tracking:** Manages pointerdown -> pointermove -> pointerup sequences
- **Context menu:** Intercepts right-click, routes to NervContextMenu overlay

### FocusManager -- Tab Navigation

- Tracks currently focused `NervBase` component
- Tab / Shift+Tab advances focus through focusable components sorted by `tabIndex` then position
- Renders a glowing orange focus ring (Graphics) at the top of z-order

### LayoutEngine -- Flexbox-like Solver

Minimal flexbox for PixiJS containers. Supports:
- `direction`: row | column
- `align`: start | center | end | stretch
- `justify`: start | center | end | space-between | space-around
- `gap`, `padding`, `wrap`
- Children's `flexGrow`, `flexShrink`, `margin`

Layout is **explicit** -- called in a component's `redraw()`, not every frame.

### AnimationManager -- Tweens

Lightweight tween system on `Ticker.shared`. No GSAP dependency.

**Pre-built NERV effects:**
- `flicker(target, duration)` -- alpha flicker
- `pulse(target, scale)` -- scale pulse
- `glowPulse(target, color)` -- glow intensity pulse
- `fadeIn/fadeOut(target, duration)`
- `slideIn(target, direction)`

### TextRenderer -- Font Abstraction

- `installFonts()` -- pre-rasterizes BitmapFonts at startup (Oswald, Fira Code, Barlow Condensed at sizes 8-32)
- `create(options)` -- returns BitmapText (mono/display) or Text (body/title) with NERV defaults
- BitmapText for labels, data readouts, grid cells (GPU-rendered, no canvas rasterization)
- Standard Text only for rich body text that rarely updates

### CullingManager -- Viewport Culling

Spatial hash grid (512px cells). Each frame:
1. Get viewport visible bounds
2. Find cells that intersect
3. Components in visible cells: `renderable = true`
4. All others: `renderable = false`, `interactiveChildren = false`

Expected: 95%+ components culled at any time on a large canvas.

### ObjectPool -- Recycling

Generic `ObjectPool<T extends NervBase>` for DataGrid rows, menu items, toast notifications.
- `acquire()` / `release()` API
- `prewarm(count)` for initialization

---

## Component Inventory (48 components)

### [01] Layout (8)
| Component | Description |
|---|---|
| NervCard | Panel with header/eyebrow/content/footer, variants: default/alert/hud/video |
| NervAccordion | Collapsible sections with animated expand/collapse |
| NervDivider | Themed horizontal/vertical separator with glow |
| NervDrawer | Slide-in panel from edge of screen |
| NervGrid | CSS-grid-like layout container |
| TargetingContainer | Corner bracket decorations + content area |
| HexGridBackground | Hexagonal grid pattern background |
| MonitorOverlay | Fullscreen frame with corner data readouts |

### [02] Forms (8)
| Component | Description |
|---|---|
| NervButton | 4 variants (primary/danger/ghost/terminal), 3 sizes, loading state |
| NervInputField | Text input with hidden DOM proxy, validation, placeholder |
| NervSelectMenu | Dropdown with scrollable options list |
| NervCheckbox | Boolean toggle with animated check mark |
| NervToggle | Slide toggle switch |
| NervRadioGroup | Grouped exclusive radio buttons |
| NervSlider | Track + thumb with value readout, ticks |
| NervTextArea | Multi-line text input with scrolling |

### [03] Data Display (8)
| Component | Description |
|---|---|
| NervTerminalDisplay | Scrolling monospace text buffer |
| NervDataGrid | Full data grid: sorting, pagination, pooled rows |
| NervSyncProgressBar | Animated segmented progress bar |
| NervSegmentDisplay | 7-segment LCD number display |
| NervBadge | Small labeled tag |
| NervChip | Removable tag with icon |
| NervAvatar | Circular sprite with border |
| NervTooltip | Hover tooltip positioned relative to target |

### [04] Charts (6)
| Component | Description |
|---|---|
| NervBarChart | Vertical/horizontal bars with animation |
| NervGauge | Circular gauge with animated needle |
| NervPieChart | Animated pie/donut chart |
| NervSyncRatioChart | Dual-value ratio display |
| NervLineChart | Time-series line chart |
| NervSparkline | Inline mini chart |

### [05] Overlays (7)
| Component | Description |
|---|---|
| NervSystemDialog | Modal dialog with title, body, action buttons |
| NervClassifiedOverlay | Fullscreen "CLASSIFIED" stamp effect |
| NervTitleScreen | Animated title card |
| NervToast | Temporary notification (managed by ToastManager on HUD layer) |
| NervPopover | Positioned popover attached to a target component |
| NervContextMenu | Right-click menu |
| NervLoadingScreen | Fullscreen loading with progress |

### [06] Navigation (3)
| Component | Description |
|---|---|
| NervNavigationTabs | Horizontal tab bar |
| NervEmergencyBanner | Animated scrolling alert banner |
| NervStepper | Step progress indicator |

### [07] HUD / Military (8)
| Component | Description |
|---|---|
| NervTargetingReticle | Animated targeting crosshair |
| NervSurveillanceGrid | Camera grid with labels |
| NervPatternAlert | Pulsing pattern indicator (BLUE/ORANGE/RED) |
| NervMagiSystemPanel | MAGI voting panel (MELCHIOR/BALTHASAR/CASPAR) |
| NervStatusIndicator | Colored status dot with label |
| NervMinimap | Viewport minimap showing world overview |
| NervNodeConnector | Draws connecting lines/curves between components |
| NervCommandPalette | Searchable command input (Ctrl+K style) |

---

## Component API Examples

### NervButton
```typescript
const btn = new NervButton({
  text: '>> EXECUTE',
  variant: 'primary',
  size: 'md',
  color: 'orange',
  onClick: () => console.log('fired'),
});
nervApp.addToWorld(btn, 100, 200);
btn.setProps({ text: 'PROCESSING...', loading: true, disabled: true });
```

### NervInputField
```typescript
const input = new NervInputField({
  label: 'PILOT_ID',
  placeholder: 'ENTER DESIGNATION',
  color: 'cyan',
  onChange: (val) => console.log(val),
  onSubmit: (val) => sendCommand(val),
});
```

### NervSlider
```typescript
const slider = new NervSlider({
  value: 42, min: 0, max: 100, step: 1,
  color: 'green',
  showValue: true,
  onChange: (v) => updateSync(v),
});
```

### NervCard
```typescript
const card = new NervCard({
  eyebrow: 'UNIT-01',
  title: 'SYNC RATE MONITOR',
  variant: 'hud',
  width: 400, height: 300,
  layout: { direction: 'column', gap: 8, padding: { top: 12, right: 12, bottom: 12, left: 12 } },
});
card.addChild(new NervSyncProgressBar({ value: 0.67, color: 'orange' }));
card.addChild(new NervButton({ text: 'DETAIL', variant: 'ghost' }));
```

### NervDataGrid
```typescript
const grid = new NervDataGrid({
  title: 'PILOT DATABASE',
  color: 'green',
  columns: [
    { key: 'id', header: 'ID', width: 60, align: 'center' },
    { key: 'name', header: 'DESIGNATION', sortable: true },
    { key: 'sync', header: 'SYNC %', width: 80, align: 'right', type: 'float' },
  ],
  data: pilots,
  pageSize: 20,
  onRowClick: (row) => selectPilot(row.id),
});
```

---

## Implementation Phases

| Phase | Scope | Estimate |
|---|---|---|
| **0: Scaffold** | npm init, Vite, TS, directory structure, build scripts | 1 day |
| **1: Core Systems** | Theme, Base, App, Input, Focus, Layout, Animation, Text, Pool, Culling | 5-7 days |
| **2: Primitives & Effects** | Panel, Label, Icon, Line, Glow, Scanlines, Flicker, GridPattern | 2-3 days |
| **3: Forms** | Button, Input, Checkbox, Toggle, Slider, Radio, Select, TextArea | 5-7 days |
| **4: Layout** | Card, Accordion, Divider, Drawer, Grid, Targeting, HexGrid, Monitor | 3-4 days |
| **5: Data Display** | Terminal, DataGrid, ProgressBar, Segment, Badge, Chip, Avatar, Tooltip | 4-5 days |
| **6: Charts** | Bar, Gauge, Pie, SyncRatio, Line, Sparkline | 4-5 days |
| **7: Overlays** | Dialog, Classified, TitleScreen, Toast, Popover, ContextMenu, Loading | 3-4 days |
| **8: Navigation** | Tabs, EmergencyBanner, Stepper | 2 days |
| **9: HUD/Military** | Reticle, Surveillance, PatternAlert, MAGI, Status, Minimap, NodeConnector, CommandPalette | 4-5 days |
| **10: WebSocket** | NervSocket wrapper, NervSocketBridge data binding | 2-3 days |
| **11: Performance** | Stress testing, profiling, culling tuning, texture caching | 3-4 days |

---

## Performance Architecture

- **Culling:** Spatial hash grid (512px cells), 95%+ components culled at any time
- **Object pooling:** DataGrid rows, menu items, toasts recycled via ObjectPool
- **Texture caching:** Static components call `cacheAsTexture()`, shared `GraphicsContext` for identical variants
- **Draw call batching:** BitmapText shares font atlas, sprites share spritesheets, no blend mode alternation
- **Text:** BitmapText for all high-frequency text, standard Text only for infrequent rich content
- **Events:** Explicit `hitArea` rectangles, `interactiveChildren = false` on leaf components
- **Render groups:** Complex panels use `enableRenderGroup()` for independent transform matrices

---

## Stage Hierarchy

```
app.stage
├── viewport (pixi-viewport)     # Infinite canvas, zoom/pan
│   ├── world components...      # NervBase instances
│   └── ...
├── hudLayer (Container)          # Screen-fixed overlays
│   ├── toasts
│   ├── dialogs
│   └── context menus
└── scanlineOverlay (Container)   # Fullscreen CRT effect
```
