import { build, transform } from 'esbuild';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const dist = path.join(root, 'dist');
const hash = (value) => createHash('sha256').update(value).digest('hex').slice(0, 8);

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const jsSource = await readFile(path.join(root, 'app.js'), 'utf8');
const cssSource = await readFile(path.join(root, 'styles.css'), 'utf8');
const [jsResult, cssResult] = await Promise.all([
  transform(jsSource, { loader: 'js', minify: true, sourcemap: false, legalComments: 'none' }),
  transform(cssSource, { loader: 'css', minify: true, sourcemap: false })
]);

const jsName = `app.${hash(jsResult.code)}.js`;
const cssName = `styles.${hash(cssResult.code)}.css`;
await writeFile(path.join(dist, jsName), jsResult.code);
await writeFile(path.join(dist, cssName), cssResult.code);

let html = await readFile(path.join(root, 'index.html'), 'utf8');
html = html
  .replace(/styles\.css\?[^"']*/i, cssName)
  .replace(/app\.js\?[^"']*/i, jsName);
await writeFile(path.join(dist, 'index.html'), html);

for (const file of ['xlsx.full.min.js', 'DSEG7Classic-BoldItalic.ttf', '.nojekyll']) {
  await cp(path.join(root, file), path.join(dist, file));
}

console.log(`Built ${path.relative(root, dist)}: ${jsName}, ${cssName}`);
