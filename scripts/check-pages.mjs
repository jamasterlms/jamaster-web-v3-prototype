import { build } from 'rolldown';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
const target = path.resolve('node_modules/.cache/jamaster-check-pages.mjs');
fs.mkdirSync(path.dirname(target), { recursive: true });
await build({
  input: path.resolve('scripts/check-pages.tsx'),
  platform: 'node',
  resolve: { alias: { '@': path.resolve('src') } },
  external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime'],
  transform: { jsx: { runtime: 'automatic' }, define: { 'import.meta.env.BASE_URL': '"./"' } },
  output: { file: target, format: 'esm', codeSplitting: false },
});
await import(pathToFileURL(target).href);
