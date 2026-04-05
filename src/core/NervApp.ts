import { Application, Container } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { NervTheme } from './NervTheme';
import type { NervThemeConfig } from './NervTheme';
import { NervBase } from './NervBase';
import { InputManager } from './InputManager';
import { FocusManager } from './FocusManager';
import { CullingManager } from './CullingManager';
import { TextRenderer } from './TextRenderer';
import { NervContext } from './NervContext';

export interface NervAppOptions {
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  backgroundColor?: number;
  worldWidth?: number;
  worldHeight?: number;
  themeOverrides?: Partial<NervThemeConfig>;
  enableCulling?: boolean;
  enableScanlines?: boolean;
}

export class NervApp {
  readonly pixiApp: Application;
  readonly viewport: Viewport;
  readonly hudLayer: Container;
  readonly inputManager: InputManager;
  readonly focusManager: FocusManager;
  readonly cullingManager: CullingManager;
  private _onResize: (() => void) | null = null;

  private constructor(
    pixiApp: Application,
    viewport: Viewport,
    hudLayer: Container,
    inputManager: InputManager,
    focusManager: FocusManager,
    cullingManager: CullingManager,
    onResize: () => void,
  ) {
    this.pixiApp = pixiApp;
    this.viewport = viewport;
    this.hudLayer = hudLayer;
    this.inputManager = inputManager;
    this.focusManager = focusManager;
    this.cullingManager = cullingManager;
    this._onResize = onResize;
  }

  static async create(options: NervAppOptions = {}): Promise<NervApp> {
    const width = options.width ?? window.innerWidth;
    const height = options.height ?? window.innerHeight;
    const worldWidth = options.worldWidth ?? 10000;
    const worldHeight = options.worldHeight ?? 10000;

    NervTheme.initialize(options.themeOverrides);
    const theme = NervTheme.instance;

    const pixiApp = new Application();
    await pixiApp.init({
      canvas: options.canvas,
      width,
      height,
      backgroundColor: options.backgroundColor ?? theme.semantic.bgBase,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    if (!options.canvas) {
      document.body.appendChild(pixiApp.canvas);
    }

    await TextRenderer.installFonts();

    // Create viewport (infinite canvas)
    const viewport = new Viewport({
      screenWidth: width,
      screenHeight: height,
      worldWidth,
      worldHeight,
      events: pixiApp.renderer.events,
    });

    viewport
      .drag()
      .pinch()
      .wheel()
      .decelerate()
      .clampZoom({ minScale: 0.1, maxScale: 5 });

    pixiApp.stage.addChild(viewport);

    // HUD layer with render group (#10) -- cached independently from world
    const hudLayer = new Container();
    hudLayer.label = 'HUD';
    hudLayer.isRenderGroup = true;
    pixiApp.stage.addChild(hudLayer);

    const focusManager = new FocusManager(hudLayer);
    const inputManager = new InputManager(focusManager);
    inputManager.initialize();

    // Initialize context so components can access managers
    const context = new NervContext(focusManager, inputManager);
    context.setViewportDragControl(
      () => { viewport.plugins.pause('drag'); },
      () => { viewport.plugins.resume('drag'); },
    );
    NervContext.initialize(context);

    const cullingManager = new CullingManager(
      viewport, 512,
      options.enableCulling !== false,
    );

    // Click on empty canvas blurs focused component
    viewport.on('pointerdown', (e) => {
      if (e.target === viewport) {
        context.blurFocused();
      }
    });

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      pixiApp.renderer.resize(w, h);
      viewport.resize(w, h);
    };
    window.addEventListener('resize', onResize);

    return new NervApp(pixiApp, viewport, hudLayer, inputManager, focusManager, cullingManager, onResize);
  }

  addToWorld(component: NervBase, x?: number, y?: number): void {
    if (x !== undefined) component.x = x;
    if (y !== undefined) component.y = y;
    this.viewport.addChild(component);
    this.cullingManager.register(component);
  }

  removeFromWorld(component: NervBase): void {
    this.cullingManager.unregister(component);
    component.removeFromParent();
  }

  addToHUD(component: NervBase): void {
    this.hudLayer.addChild(component);
  }

  destroy(): void {
    // Remove resize listener (#5)
    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
      this._onResize = null;
    }
    this.inputManager.destroy();
    this.focusManager.destroy();
    this.cullingManager.destroy();
    // Destroy with full cleanup (#6)
    this.pixiApp.destroy(true, { children: true });
  }
}
