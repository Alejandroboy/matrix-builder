// Проверка внутренней дубликации контента арканов.
// Запуск из корня монорепы: node scripts/content-similarity.mjs
// Меряет пересечение шинглов (троек слов) между всеми парами арканов —
// тем же способом, каким дубли ищут поисковики.

import fs from 'fs';
import path from 'path';

const DIR = 'content/arcana';
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json'));
const data = files.map(f => {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  return { n: j.card.arcana, name: j.card.name, card: j.card, prose: j.prose.blocks };
}).sort((a,b) => a.n - b.n);

const norm = s => (s||'').toLowerCase().replace(/ё/g,'е').replace(/[^а-я0-9\s]/g,' ').split(/\s+/).filter(Boolean);
const shingles = (s, k=3) => {
  const w = norm(s); const set = new Set();
  for (let i=0;i+k<=w.length;i++) set.add(w.slice(i,i+k).join(' '));
  return set;
};
const jac = (a,b) => {
  let inter=0; for (const x of a) if (b.has(x)) inter++;
  const uni = a.size + b.size - inter;
  return uni ? inter/uni : 0;
};

function report(label, get) {
  const sh = data.map(d => ({ n:d.n, name:d.name, s: shingles(get(d)), len: (get(d)||'').length }));
  const pairs = [];
  for (let i=0;i<sh.length;i++) for (let j=i+1;j<sh.length;j++)
    pairs.push({ a: sh[i], b: sh[j], v: jac(sh[i].s, sh[j].s) });
  pairs.sort((x,y)=>y.v-x.v);
  const avg = pairs.reduce((s,p)=>s+p.v,0)/pairs.length;
  const lens = sh.map(x=>x.len);
  console.log(`\n=== ${label} ===`);
  console.log(`длина: min ${Math.min(...lens)}, median ${lens.slice().sort((a,b)=>a-b)[11]}, max ${Math.max(...lens)}`);
  console.log(`средняя похожесть по всем парам: ${(avg*100).toFixed(1)}%`);
  console.log('топ-5 самых похожих пар:');
  pairs.slice(0,5).forEach(p =>
    console.log(`  ${(p.v*100).toFixed(1)}%  ${p.a.n} ${p.a.name} ↔ ${p.b.n} ${p.b.name}`));
}

report('positionNotes.heart', d => d.card.positionNotes.heart);
report('positionNotes.center', d => d.card.positionNotes.center);
report('positionNotes.money', d => d.card.positionNotes.money);
report('prose.asPartner', d => d.prose.asPartner);
report('prose.needsFromPartner', d => d.prose.needsFromPartner);
report('prose.conflictPattern', d => d.prose.conflictPattern);
report('СТРАНИЦА отношений целиком', d =>
  [d.card.positionNotes.heart, d.prose.asPartner, d.prose.needsFromPartner, d.prose.conflictPattern,
   d.card.inRelationship.asPartner.join(' '), d.card.inRelationship.needsFromPartner.join(' ')].join(' '));
