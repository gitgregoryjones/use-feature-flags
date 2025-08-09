// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: { entry: 'src/index.ts', resolve: true }, // <- resolve external types
  sourcemap: true,
  clean: true,
  target: 'es2019',
  platform: 'browser',
  external: ['react', '@supabase/supabase-js', 'jotai'],
  treeshake: true,
  tsconfig: 'tsconfig.json',
});

