// 1ファイルで開ける確認用ページ（preview.html）を作る。データと音声を中に埋め込む。
// 使い方: node tools/build-preview.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const data = JSON.parse(read('data/unit-1-1.json'));

const audio = {};
const dir = join(root, 'audio/1-1');
for (const f of readdirSync(dir).filter((f) => f.endsWith('.mp3'))) {
  audio[f.replace('.mp3', '')] = 'data:audio/mpeg;base64,' + readFileSync(join(dir, f)).toString('base64');
}

const safe = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const html = read('index.html')
  .replace('<link rel="stylesheet" href="style.css">', `<style>\n${read('style.css')}</style>`)
  .replace('<script src="app.js"></script>',
    `<script>window.UNIT_DATA=${safe(data)};window.AUDIO_DATA=${safe(audio)};</script>\n<script>\n${read('app.js')}</script>`);
writeFileSync(join(root, 'preview.html'), html);
console.log('preview.html', Math.round(html.length / 1024) + ' KB', Object.keys(audio).length + ' clips');
