import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import pkg from './package.json' with { type: 'json' };

const { version } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await mkdir(path.join(distDir, 'js'), { recursive: true });

await Promise.all([
    cp(path.join(srcDir, 'css'), path.join(distDir, 'css'), { recursive: true }),
    cp(path.join(srcDir, 'data'), path.join(distDir, 'data'), { recursive: true }),
    cp(path.join(srcDir, 'js'), path.join(distDir, 'js'), { recursive: true }),
    cp(path.join(srcDir, 'index.html'), path.join(distDir, 'index.html')),
    cp(path.join(srcDir, 'cka-tracker.html'), path.join(distDir, 'cka-tracker.html')),
    cp(path.join(srcDir, 'cka-practice-tasks.html'), path.join(distDir, 'cka-practice-tasks.html')),
    cp(path.join(srcDir, '404.html'), path.join(distDir, '404.html')),
    cp(path.join(srcDir, 'robots.txt'), path.join(distDir, 'robots.txt')),
]);

await build({
    entryPoints: [path.join(srcDir, 'js', 'tracker.js')],
    bundle: true,
    format: 'iife',
    loader: {
        '.js': 'jsx',
    },
    jsx: 'automatic',
    legalComments: 'none',
    minify: true,
    outfile: path.join(distDir, 'js', 'tracker.js'),
    platform: 'browser',
    target: ['es2020'],
});

await writeFile(path.join(distDir, '.nojekyll'), '');

const htmlPages = ['index.html', 'cka-tracker.html', 'cka-practice-tasks.html'];
await Promise.all(
    htmlPages.map(async (file) => {
        const filePath = path.join(distDir, file);
        const content = await readFile(filePath, 'utf8');
        await writeFile(filePath, content.replaceAll('__APP_VERSION__', `v${version}`));
    }),
);