import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = process.cwd();
const dist = path.join(root, 'dist');
const target = path.join(root, 'deliverables');
fs.mkdirSync(target, { recursive: true });
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const asset = (name, mime) =>
  `data:${mime};base64,${fs.readFileSync(path.join(dist, 'assets', name)).toString('base64')}`;
const logo = asset('logo.png', 'image/png');
const scriptTag = html.match(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/);
const cssTag = html.match(/<link\b[^>]*rel="stylesheet"[^>]*>/);
if (!scriptTag || !cssTag) throw new Error('Built entrypoints were not found.');
const cssPath = cssTag[0].match(/href="([^"]+)"/)[1];
let css = fs.readFileSync(path.join(dist, cssPath), 'utf8');
const cssFile = path.join(dist, cssPath);
css = css.replace(/url\((["']?)([^"')]+\.woff2)\1\)/g, (_, quote, href) => {
  const file = href.startsWith('/')
    ? path.join(dist, href)
    : path.resolve(path.dirname(cssFile), href);
  return `url("data:font/woff2;base64,${fs.readFileSync(file).toString('base64')}")`;
});
let js = fs.readFileSync(path.join(dist, scriptTag[1]), 'utf8');
js = js.replaceAll('/assets/icons.svg#', '#').replaceAll('/assets/logo.png', logo);
js = js.replace(/^[ \t]+$/gm, '');
const rawSprite = fs.readFileSync(path.join(dist, 'assets', 'icons.svg'), 'utf8');
const symbols = rawSprite.slice(rawSprite.indexOf('>') + 1, rawSprite.lastIndexOf('</svg>'));
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true">${symbols}</svg>`;
html = html
  .replace(scriptTag[0], '')
  .replace(cssTag[0], () => `<style>${css}</style>`)
  .replaceAll('/assets/logo.png', logo);
html = html.replace(/^[ \t]+$/gm, '');
html = html.replace(
  '</body>',
  () => `${sprite}<script type="module">${js.replaceAll('</script', '<\\/script')}</script></body>`,
);
fs.writeFileSync(path.join(target, 'Jamaster-Prototip.html'), html);
// The source package is reproducible with npm ci; generated output and credentials are excluded.
execFileSync(
  'python',
  [
    '-c',
    `
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
root=Path.cwd()
paths=['src','public','scripts','tests','docs','index.html','package.json','package-lock.json','tsconfig.json','vite.config.ts','postcss.config.js','components.json','.prettierrc.json','.gitignore','README.md','LUCIDE-LICENSE.txt','SHADCN-LICENSE.md']
with ZipFile(root/'deliverables/Jamaster-React-Vite.zip','w',ZIP_DEFLATED) as archive:
 for entry in paths:
  source=root/entry
  for file in (source.rglob('*') if source.is_dir() else [source]):
   if file.is_file():archive.write(file,Path('jamaster-workspace')/file.relative_to(root))
`,
  ],
  { cwd: root, stdio: 'inherit' },
);
console.log('Created offline HTML and React/Vite source archive.');
