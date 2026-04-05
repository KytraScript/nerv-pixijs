import { NervApp } from '../core/NervApp';
import { TextRenderer } from '../core/TextRenderer';
import { NervTheme } from '../core/NervTheme';
import { Graphics, Text, TextStyle } from 'pixi.js';

async function main() {
  const app = await NervApp.create({
    worldWidth: 5000,
    worldHeight: 5000,
  });

  const theme = NervTheme.instance;

  // -- Title --
  const title = new Text({
    text: 'NERV-PIXIJS PLAYGROUND',
    style: new TextStyle({
      fontFamily: theme.fontFamily('display'),
      fontSize: theme.fontSizes.display,
      fill: theme.semantic.accentPrimary,
      letterSpacing: theme.effects.letterSpacingWide * theme.fontSizes.display,
    }),
  });
  title.x = 100;
  title.y = 60;
  app.viewport.addChild(title);

  // -- Subtitle --
  const subtitle = new Text({
    text: '// CORE SYSTEMS VALIDATION',
    style: new TextStyle({
      fontFamily: theme.fontFamily('mono'),
      fontSize: theme.fontSizes.md,
      fill: theme.semantic.textMuted,
      letterSpacing: theme.effects.letterSpacingNormal * theme.fontSizes.md,
    }),
  });
  subtitle.x = 100;
  subtitle.y = 100;
  app.viewport.addChild(subtitle);

  // -- Test panels --
  const colors: [string, number][] = [
    ['ORANGE', theme.colors.orange],
    ['CYAN', theme.colors.cyan],
    ['GREEN', theme.colors.green],
    ['RED', theme.colors.red],
    ['MAGENTA', theme.colors.magenta],
    ['AMBER', theme.colors.amber],
  ];

  colors.forEach(([name, color], i) => {
    const x = 100 + (i % 3) * 220;
    const y = 150 + Math.floor(i / 3) * 120;

    // Panel background
    const panel = new Graphics();
    panel.rect(0, 0, 200, 100);
    panel.fill({ color: theme.semantic.bgPanel });
    panel.rect(0, 0, 200, 100);
    panel.stroke({ width: 1, color, alpha: 0.7 });
    panel.x = x;
    panel.y = y;

    // Corner brackets
    const bracket = new Graphics();
    bracket.setStrokeStyle({ width: 1.5, color, alpha: 1 });
    // Top-left
    bracket.moveTo(0, 12); bracket.lineTo(0, 0); bracket.lineTo(12, 0);
    // Top-right
    bracket.moveTo(188, 0); bracket.lineTo(200, 0); bracket.lineTo(200, 12);
    // Bottom-left
    bracket.moveTo(0, 88); bracket.lineTo(0, 100); bracket.lineTo(12, 100);
    // Bottom-right
    bracket.moveTo(188, 100); bracket.lineTo(200, 100); bracket.lineTo(200, 88);
    bracket.stroke();
    bracket.x = x;
    bracket.y = y;

    // Label
    const label = TextRenderer.create({
      text: `[${String(i + 1).padStart(2, '0')}] ${name}`,
      role: 'mono',
      size: theme.fontSizes.sm,
      color: theme.semantic.textMuted,
    });
    label.x = x + 8;
    label.y = y + 6;

    // Value
    const value = TextRenderer.create({
      text: `0x${color.toString(16).toUpperCase().padStart(6, '0')}`,
      role: 'mono',
      size: theme.fontSizes.lg,
      color,
    });
    value.x = x + 8;
    value.y = y + 40;

    // Status dot
    const dot = new Graphics();
    dot.circle(0, 0, 4);
    dot.fill({ color });
    dot.x = x + 185;
    dot.y = y + 12;

    app.viewport.addChild(panel);
    app.viewport.addChild(bracket);
    app.viewport.addChild(label);
    app.viewport.addChild(value);
    app.viewport.addChild(dot);
  });

  // -- Info text --
  const info = TextRenderer.create({
    text: 'SCROLL TO ZOOM | DRAG TO PAN | INFINITE CANVAS ACTIVE',
    role: 'mono',
    size: theme.fontSizes.xs,
    color: theme.semantic.textMuted,
  });
  info.x = 100;
  info.y = 400;
  app.viewport.addChild(info);

  console.log('[NERV] Playground initialized. Core systems operational.');
}

main().catch(console.error);
