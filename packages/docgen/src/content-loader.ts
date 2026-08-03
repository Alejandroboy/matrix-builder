import * as fs from 'fs';
import * as path from 'path';
import { Arcana, toArcana } from '@matrix/engine';
import { ArcanaContent, ArcanaContentMap } from './content-schema';

const REQUIRED_PROSE_BLOCKS = [
  'portraitShort',
  'portraitFull',
  'asPartner',
  'needsFromPartner',
  'conflictPattern',
] as const;

const REQUIRED_POSITION_NOTES = ['center', 'heart', 'money'] as const;

/** Fail fast при старте: недостающий блок = падение сборки, не пустая секция в чьём-то PDF. */
export function loadAllContent(dir: string): ArcanaContentMap {
  const result: ArcanaContentMap = new Map();
  const files = fs.readdirSync(dir).filter((f) => /^\d+\.json$/.test(f));
  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8')) as ArcanaContent;
    const arcana = toArcana(raw.card.arcana);
    if (raw.prose.arcana !== raw.card.arcana) {
      throw new Error(`content/${file}: card.arcana != prose.arcana`);
    }
    if (String(raw.card.arcana) !== path.basename(file, '.json')) {
      throw new Error(`content/${file}: filename does not match card.arcana`);
    }
    for (const block of REQUIRED_PROSE_BLOCKS) {
      if (!raw.prose.blocks[block]?.trim()) {
        throw new Error(`content/${file}: missing prose block "${block}"`);
      }
    }
    for (const note of REQUIRED_POSITION_NOTES) {
      if (!raw.card.positionNotes?.[note]?.trim()) {
        throw new Error(`content/${file}: missing positionNotes.${note}`);
      }
    }
    result.set(arcana, raw);
  }
  return result;
}

/**
 * Готовность к продаже: обе стороны пары должны иметь контент.
 * Непокрытые арканы на переходный период = лид-магнит («оставьте email»), не продажа пустоты.
 */
export function assertPairCoverage(content: ArcanaContentMap, needed: Arcana[]): void {
  const missing = [...new Set(needed)].filter((a) => !content.has(a));
  if (missing.length) {
    throw new Error(`No content for arcana: ${missing.join(', ')}`);
  }
}
