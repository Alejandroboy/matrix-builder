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

/**
 * Корень контента. Экспортируется, потому что дата правки JSON-файлов нужна
 * карте сайта: она и есть честная дата изменения страницы аркана.
 */
export const CONTENT_ROOT = path.resolve(process.cwd(), '../../content');

const ROOT = CONTENT_ROOT;

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