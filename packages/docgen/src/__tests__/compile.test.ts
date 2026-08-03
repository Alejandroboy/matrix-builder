import * as path from 'path';
import { toArcana, CompatibilityMatrix } from '@matrix/engine';
import { loadAllContent, assertPairCoverage } from '../content-loader';
import { compileCompatibilityReport, PairRulesFile } from '../report';
import * as pairRulesJson from '../../../../content/pair-rules.json';

const CONTENT_DIR = path.resolve(__dirname, '../../../../content/arcana');

/**
 * Фикстура собрана вручную, чтобы все нужные компилятору позиции
 * попадали в покрытые контентом арканы (11 и 13) — независимость
 * snapshot-теста от темпов производства контента.
 */
function fixtureMatrix(): CompatibilityMatrix {
  const p = (n: number) => toArcana(n);
  const positionsA = {
    personality: p(11), spirituality: p(11), destiny: p(11), karmicBase: p(11),
    center: p(11), relationsEntry: p(11), moneyEntry: p(11), balance: p(11),
    heart: p(11), money: p(11),
  };
  const positionsB = { ...positionsA, center: p(13), heart: p(13) };
  return {
    a: { birthDate: '1990-01-01', positions: positionsA },
    b: { birthDate: '1992-02-02', positions: positionsB },
    joint: { coupleCharacter: p(13), coupleHeart: p(11), coupleMoney: p(13) },
  };
}

describe('compileCompatibilityReport', () => {
  const content = loadAllContent(CONTENT_DIR);
  const pairRules = pairRulesJson as unknown as PairRulesFile;

  test('pilot content loads and covers fixture pair', () => {
    expect(content.has(toArcana(11))).toBe(true);
    expect(content.has(toArcana(13))).toBe(true);
    expect(() =>
      assertPairCoverage(content, [toArcana(11), toArcana(13)]),
    ).not.toThrow();
  });

  test('compiles deterministic spec (snapshot)', () => {
    const spec = compileCompatibilityReport({
      matrix: fixtureMatrix(),
      content,
      pairRules,
      names: { a: 'Анна', b: 'Пётр' },
      orderId: 'test-order-1',
      generatedAt: '2026-08-03T00:00:00.000Z',
    });
    expect(spec.sections.map((s) => s.kind)).toEqual([
      'cover', 'matrixVisual', 'prose', 'prose', 'prose',
      'prose', 'prose', 'prose', 'pairSynthesis', 'disclaimer',
    ]);
    expect(spec).toMatchSnapshot();
  });

  test('fails fast when arcana content is missing', () => {
    const m = fixtureMatrix();
    m.joint.coupleCharacter = toArcana(7); // контента для 7 ещё нет
    expect(() =>
      compileCompatibilityReport({
        matrix: m, content, pairRules,
        names: { a: 'А', b: 'Б' }, orderId: 'x', generatedAt: 'x',
      }),
    ).toThrow(/No content for arcana 7/);
  });
});
