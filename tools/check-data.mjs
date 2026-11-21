// データの機械チェック。参照切れ、正解番号、音声ファイル、ふりがな、未使用の項目を調べる。
// 使い方: node tools/check-data.mjs
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const U = read('data/units.json').map((f) => read('data/' + f));
const ids = new Set(), qs = new Set(), bad = [];
const hasEx = (k) => U.some((u) => u.explanations && u.explanations[k]);

for (const d of U) for (const i of d.items) for (const x of [i, ...(i.variants || [])]) {
  if (ids.has(x.id)) bad.push('重複した項目 ' + x.id);
  ids.add(x.id);
  if (!existsSync(join(root, x.audio))) bad.push('音声がない ' + x.id);
  for (const f of x.furigana || []) if (!x.ja.includes(f.t)) bad.push('ふりがなが本文にない ' + x.id);
  if (x.explain && !hasEx(x.explain)) bad.push('解説がない ' + x.id);
}
for (const d of U) {
  const q = new Map(d.questions.map((x) => [x.id, x])), r = new Set(d.roleplays.map((x) => x.id));
  const used = new Set();
  for (const x of d.questions) {
    if (qs.has(x.id)) bad.push('重複した問題 ' + x.id);
    qs.add(x.id);
    for (const k of [x.item, x.audio_item, ...(x.sequence || [])].filter(Boolean)) if (!ids.has(k)) bad.push(x.id + ' の参照先がない ' + k);
    const n = (x.choices || x.choices_ceb || []).length;
    if (x.type !== 'order' && !(x.answer < n)) bad.push(x.id + ' の正解番号');
    if (x.choices && new Set(x.choices).size !== x.choices.length) bad.push(x.id + ' に同じ選択肢');
    if (x.type === 'scene' && x.item && x.choices[x.answer] !== d.items.find((i) => i.id === x.item).romaji) bad.push(x.id + ' の正解が項目と違う');
    if (x.explain && !hasEx(x.explain)) bad.push(x.id + ' の解説がない');
  }
  for (const l of d.lessons) {
    for (const k of l.new_items) if (!ids.has(k)) bad.push(l.id + ' ' + k);
    for (const s of l.steps) {
      for (const k of s.questions || s.sequences || []) { if (!q.has(k)) bad.push(l.id + ' ' + k); used.add(k); }
      for (const k of s.roleplays || []) { if (!r.has(k)) bad.push(l.id + ' ' + k); used.add(k); }
      for (const k of s.items || []) if (!ids.has(k)) bad.push(l.id + ' ' + k);
    }
  }
  for (const p of d.roleplays) for (const k of p.sequence) if (!ids.has(k)) bad.push(p.id + ' ' + k);
  for (const x of [...d.questions, ...d.roleplays]) if (!used.has(x.id)) bad.push('使われていない ' + x.id);
  const taught = new Set(d.lessons.flatMap((l) => l.new_items));
  for (const i of d.items) if (!taught.has(i.id)) bad.push('教えていない項目 ' + i.id);
}
console.log(`ユニット ${U.length}、項目 ${ids.size}、問題 ${qs.size}、問題点 ${bad.length}`);
if (bad.length) { console.log(bad.join('\n')); process.exit(1); }
