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
    const matrix = computePersonalMatrix('1990-05-14'); // heart = 17, контента нет
    expect(() =>
      compilePersonalReport({
        matrix, content, name: 'Х', orderId: 'x', generatedAt: 'x',
      }),
    ).toThrow(/No content for arcana/);
  });
});
