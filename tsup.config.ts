// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: { entry: 'src/index.ts', resolve: true },
  sourcemap: true,
  clean: true,
  target: 'es2019',
  platform: 'browser',
  external: ['react'], // only react is external; supabase & jotai ship with the lib
  treeshake: true,
  tsconfig: 'tsconfig.json'
});
