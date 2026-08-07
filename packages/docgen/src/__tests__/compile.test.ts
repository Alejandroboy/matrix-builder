import * as path from 'path';
import { toArcana, computeCompatibility, CompatibilityMatrix } from '@matrix/engine';
import { loadAllContent, assertPairCoverage } from '../content-loader';
import { compileCompatibilityReport, PairRulesFile } from '../report';
import * as pairRulesJson from '../../../../content/pair-rules.json';

const CONTENT_DIR = path.resolve(__dirname, '../../../../content/arcana');

/**
 * Фикстура строится реальным расчётом, а не руками: так она не устаревает
 * при добавлении позиций в PersonalMatrix (история с углами квадрата).
 * Даты подобраны так, чтобы нужные компилятору арканы были покрыты контентом.
 */
function fixtureMatrix(): CompatibilityMatrix {
  const cm = computeCompatibility('1980-01-10', '1980-01-28');
  return {
    ...cm,
    joint: {
      coupleCharacter: toArcana(13),
      coupleHeart: toArcana(11),
      coupleMoney: toArcana(13),
    },
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
      'cover', 'matrixVisual', 'matrixVisual', 'prose', 'prose',
      'prose', 'prose', 'prose', 'prose', 'pairSynthesis', 'disclaimer',
    ]);
    expect(spec).toMatchSnapshot();
  });

  test('fails fast when arcana content is missing', () => {
    // Аркан без контента ищем динамически: тест не должен ломаться
    // от пополнения контента (см. историю с арканом 7).
    const uncovered = Array.from({ length: 22 }, (_, i) => toArcana(i + 1)).find(
      (a) => !content.has(a),
    );
    if (!uncovered) return; // все 22 покрыты — проверять нечего, fail-fast обеспечен загрузчиком
    const m = fixtureMatrix();
    m.joint.coupleCharacter = uncovered;
    expect(() =>
      compileCompatibilityReport({
        matrix: m, content, pairRules,
        names: { a: 'А', b: 'Б' }, orderId: 'x', generatedAt: 'x',
      }),
    ).toThrow(new RegExp(`No content for arcana ${uncovered}`));
  });
});