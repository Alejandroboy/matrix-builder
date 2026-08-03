// Контент арканов и правила пар: читаются с диска на сервере.
// Один import на процесс (module scope) — контент неизменен в рантайме,
// деплой контента = git push (см. README монорепы).
import * as path from 'path';
import {
  loadAllContent,
  ArcanaContentMap,
  PairRulesFile,
} from '@matrix/docgen';
import * as fs from 'fs';

const ROOT = path.resolve(process.cwd(), '../../content');

let cache: { content: ArcanaContentMap; pairRules: PairRulesFile } | null = null;

export function getContent(): { content: ArcanaContentMap; pairRules: PairRulesFile } {
  if (!cache) {
    cache = {
      content: loadAllContent(path.join(ROOT, 'arcana')),
      pairRules: JSON.parse(
        fs.readFileSync(path.join(ROOT, 'pair-rules.json'), 'utf-8'),
      ) as PairRulesFile,
    };
  }
  return cache;
}
