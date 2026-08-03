import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFileSync } from 'child_process';
import { toArcana, CompatibilityMatrix } from '@matrix/engine';
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
