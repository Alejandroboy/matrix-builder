import { Arcana, CompatibilityMatrix, PersonalMatrix } from '@matrix/engine';
import { ArcanaContentMap } from './content-schema';

/* ------------------------------- Правила пар ------------------------------ */

export type Temperament = 'leader' | 'analyst' | 'dreamer' | 'stabilizer' | 'rebel';

export interface PairRule {
  id: string;
  match: [Temperament, Temperament];
  synthesis: string; // ~130–200 слов о динамике пары (плотность важнее объёма)
  advice: string; // ~60–90 слов
}

export interface PairRulesFile {
  /** Редакторское соответствие аркан -> темперамент (draft допустим, но полный) */
  temperaments: Record<string, Temperament>;
  rules: PairRule[];
}

export function findPairRule(a: Temperament, b: Temperament, rules: PairRule[]): PairRule {
  const key = [a, b].sort().join('-');
  const rule = rules.find((r) => [...r.match].sort().join('-') === key);
  if (!rule) throw new Error(`No pair rule for ${key}`);
  return rule;
}

export function temperamentOf(arcana: Arcana, file: PairRulesFile): Temperament {
  const t = file.temperaments[String(arcana)];
  if (!t) throw new Error(`No temperament for arcana ${arcana}`);
  return t;
}

/* --------------------------- Спецификация отчёта -------------------------- */

export type ReportSection =
  | { kind: 'cover'; title: string; namesLine: string; datesLine: string }
  // Схема-октаграмма. Позиции передаются целиком: рендерер не знает,
  // откуда они взялись, и просто рисует то, что дали.
  | {
  kind: 'matrixVisual';
  positions: PersonalMatrix['positions'];
  caption?: string;
}
  | { kind: 'prose'; heading: string; body: string }
  | { kind: 'pairSynthesis'; heading: string; body: string; advice: string }
  | { kind: 'disclaimer'; body: string };

/** Общая спецификация отчёта: рендерер работает с ней, не зная типа продукта. */
export interface ReportSpec {
  meta: { generatedAt: string; orderId: string };
  sections: ReportSection[];
}

/** Историческое имя парного отчёта; структура общая. */
export type CompatibilityReportSpec = ReportSpec;

/** ISO 'YYYY-MM-DD' -> '25.05.1987': в документе дата должна выглядеть по-русски. */
export function formatRu(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export const DISCLAIMER =
  'Матрица судьбы — это арифметический расчёт по дате рождения и интерпретация ' +
  'на основе символики 22 старших арканов. Этот отчёт — инструмент саморефлексии, ' +
  'а не гадание, не предсказание будущего и не замена консультации психолога.';

/* ------------------------------- Компилятор ------------------------------- */

export interface CompileInput {
  matrix: CompatibilityMatrix;
  content: ArcanaContentMap;
  pairRules: PairRulesFile;
  names: { a: string; b: string };
  orderId: string;
  generatedAt: string; // ISO, передаётся снаружи — компилятор чистый
}

/** Чистая функция (расчёт + контент) -> спецификация. Без IO, легко snapshot-ится. */
export function compileCompatibilityReport(input: CompileInput): CompatibilityReportSpec {
  const { matrix, content, pairRules, names, orderId, generatedAt } = input;

  const need = (a: Arcana) => {
    const c = content.get(a);
    if (!c) throw new Error(`No content for arcana ${a}`);
    return c;
  };

  const heartA = need(matrix.a.positions.heart);
  const heartB = need(matrix.b.positions.heart);
  const jointCharacter = need(matrix.joint.coupleCharacter);
  const jointHeart = need(matrix.joint.coupleHeart);

  const rule = findPairRule(
    temperamentOf(matrix.a.positions.center, pairRules),
    temperamentOf(matrix.b.positions.center, pairRules),
    pairRules.rules,
  );

  const sections: ReportSection[] = [
    {
      kind: 'cover',
      title: 'Совместимость по матрице судьбы',
      namesLine: `${names.a} и ${names.b}`,
      datesLine: `${formatRu(matrix.a.birthDate)} · ${formatRu(matrix.b.birthDate)}`,
    },
    { kind: 'matrixVisual', positions: matrix.a.positions, caption: names.a },
    { kind: 'matrixVisual', positions: matrix.b.positions, caption: names.b },
    {
      kind: 'prose',
      heading: 'Тема вашего союза',
      body: jointCharacter.prose.blocks.portraitShort,
    },
    {
      kind: 'prose',
      heading: 'Что держит вас вместе',
      body: jointHeart.prose.blocks.portraitShort,
    },
    {
      kind: 'prose',
      heading: `${names.a}: как вы устроены в паре`,
      body: heartA.prose.blocks.asPartner,
    },
    {
      kind: 'prose',
      heading: `Что нужно ${names.a} от партнёра`,
      body: heartA.prose.blocks.needsFromPartner,
    },
    {
      kind: 'prose',
      heading: `${names.b}: как вы устроены в паре`,
      body: heartB.prose.blocks.asPartner,
    },
    {
      kind: 'prose',
      heading: `Что нужно ${names.b} от партнёра`,
      body: heartB.prose.blocks.needsFromPartner,
    },
    {
      kind: 'pairSynthesis',
      heading: 'Динамика вашей пары',
      body: rule.synthesis,
      advice: rule.advice,
    },
    { kind: 'disclaimer', body: DISCLAIMER },
  ];

  return { meta: { generatedAt, orderId }, sections };
}