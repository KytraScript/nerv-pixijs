import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    return {
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'NervPixiJS',
          formats: ['es', 'cjs'],
          fileName: 'index',
        },
        rollupOptions: {
          external: ['pixi.js', 'pixi-viewport'],
        },
      },
      resolve: { alias: { '@nerv': resolve(__dirname, 'src') } },
    };
  }

  return {
    root: '.',
    resolve: { alias: { '@nerv': resolve(__dirname, 'src') } },
  };
});
