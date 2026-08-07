import * as path from 'path';
import { computePersonalMatrix } from '@matrix/engine';
import { loadAllContent } from '../content-loader';
import { compilePersonalReport } from '../personal-report';

const CONTENT_DIR = path.resolve(__dirname, '../../../../content/arcana');

describe('compilePersonalReport', () => {
  const content = loadAllContent(CONTENT_DIR);

  test('compiles a full personal spec (snapshot)', () => {
    // Дата подобрана так, чтобы центр (4), сердце (7) и деньги (5) были покрыты контентом
    const matrix = computePersonalMatrix('1980-01-10');
    const spec = compilePersonalReport({
      matrix,
      content,
      name: 'Анна',
      orderId: 'test-personal-1',
      generatedAt: '2026-08-04T00:00:00.000Z',
    });
    expect(spec.sections.map((s) => s.kind)).toEqual([
      'cover', 'matrixVisual', 'prose', 'prose', 'prose',
      'prose', 'prose', 'prose', 'prose', 'prose', 'disclaimer',
    ]);
    expect(spec).toMatchSnapshot();
  });

  test('fails fast when an arcana has no content', () => {
    // Непокрытый аркан ищем динамически: тест не должен ломаться от
    // пополнения контента (ломался дважды — на 7 и на 16/17).
    const { toArcana } = require('@matrix/engine');
    const uncovered = Array.from({ length: 22 }, (_, i) => toArcana(i + 1)).find(
      (a: number) => !content.has(a as never),
    );
    if (!uncovered) return; // все 22 покрыты — проверять нечего

    const matrix = computePersonalMatrix('1980-01-10');
    const broken = {
      ...matrix,
      positions: { ...matrix.positions, center: uncovered },
    };
    expect(() =>
      compilePersonalReport({
        matrix: broken, content, name: 'Х', orderId: 'x', generatedAt: 'x',
      }),
    ).toThrow(new RegExp(`No content for arcana ${uncovered}`));
  });
});
