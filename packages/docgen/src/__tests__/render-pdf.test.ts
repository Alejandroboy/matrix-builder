import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFileSync } from 'child_process';
import { toArcana, computeCompatibility, CompatibilityMatrix } from '@matrix/engine';
import { loadAllContent } from '../content-loader';
import { compileCompatibilityReport, PairRulesFile } from '../report';
import { renderCompatibilityPdf } from '../render-pdf';
import * as pairRulesJson from '../../../../content/pair-rules.json';

const CONTENT_DIR = path.resolve(__dirname, '../../../../content/arcana');

// В песочнице/CI используем системный DejaVu (кириллица есть);
// в проде web передаст свои брендовые TTF.
const FONTS = {
  regular: '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
  bold: '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
};

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

const hasFonts = fs.existsSync(FONTS.regular) && fs.existsSync(FONTS.bold);
const describeIfFonts = hasFonts ? describe : describe.skip;

describeIfFonts('renderCompatibilityPdf (smoke)', () => {
  test('renders a real PDF with extractable Cyrillic text', async () => {
    const content = loadAllContent(CONTENT_DIR);
    const spec = compileCompatibilityReport({
      matrix: fixtureMatrix(),
      content,
      pairRules: pairRulesJson as unknown as PairRulesFile,
      names: { a: 'Анна', b: 'Пётр' },
      orderId: 'smoke-1',
      generatedAt: '2026-08-03T00:00:00.000Z',
    });

    const out = path.join(os.tmpdir(), `matrix-smoke-${Date.now()}.pdf`);
    await new Promise<void>((resolve, reject) => {
      const stream = renderCompatibilityPdf(spec, { fonts: FONTS });
      const file = fs.createWriteStream(out);
      stream.pipe(file);
      file.on('finish', resolve);
      file.on('error', reject);
    });

    const size = fs.statSync(out).size;
    expect(size).toBeGreaterThan(20_000); // не пустышка

    // Проверяем текстовый слой: кириллица реально встроилась, а не превратилась в квадраты
    const raw = execFileSync('pdftotext', [out, '-'], { encoding: 'utf-8' });
    const text = raw.replace(/\s+/g, ' '); // pdftotext переносит строки внутри заголовков
    expect(text).toContain('Совместимость по матрице судьбы');
    expect(text).toContain('Тема вашего союза');
    expect(text).toContain('Анна');
    fs.unlinkSync(out);
  }, 20_000);
});
