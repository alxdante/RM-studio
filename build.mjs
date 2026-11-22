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
const appCacheManifest = `CACHE MANIFEST\n# RM Studio ${jsName} ${cssName}\n./\n./index.html\n./${jsName}\n./${cssName}\n./display.html\n./display.css\n./display.js\n./xlsx.full.min.js\n./DSEG7Classic-BoldItalic.ttf\n./sw.js\n\nNETWORK:\n*\n`;
await writeFile(path.join(dist, 'offline.appcache'), appCacheManifest);

for (const file of ['xlsx.full.min.js', 'DSEG7Classic-BoldItalic.ttf', 'sw.js', '.nojekyll']) {
  await cp(path.join(root, file), path.join(dist, file));
}
for (const file of ['display.html', 'display.css', 'display.js']) {
  await cp(path.join(root, file), path.join(dist, file));
}

console.log(`Built ${path.relative(root, dist)}: ${jsName}, ${cssName}`);
