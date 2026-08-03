import PDFDocument from 'pdfkit';
import { CompatibilityReportSpec, ReportSection } from './report';

/**
 * Рендерер: тупо идёт по секциям спецификации и рисует. Вся логика —
 * в компиляторе; здесь только вёрстка.
 *
 * КИРИЛЛИЦА: стандартные 14 PDF-шрифтов её НЕ содержат — обязательно
 * встраиваем TTF. Пути к шрифтам передаются снаружи (в проде — из
 * ассетов web-пакета; PT Serif / PT Sans хорошо смотрятся для этой ниши).
 */
export interface RenderFonts {
  regular: string; // путь к TTF
  bold: string;
}

export interface RenderOptions {
  fonts: RenderFonts;
  /** Заголовок PDF-метаданных */
  title?: string;
}

const PAGE = { size: 'A4' as const, margin: 56 };
const COLOR = { text: '#2b2b2b', accent: '#6b5b8a', muted: '#8a8a8a' };

export function renderCompatibilityPdf(
  spec: CompatibilityReportSpec,
  opts: RenderOptions,
): NodeJS.ReadableStream {
  const doc = new PDFDocument({
    size: PAGE.size,
    margin: PAGE.margin,
    info: { Title: opts.title ?? 'Совместимость по матрице судьбы' },
  });

  doc.registerFont('body', opts.fonts.regular);
  doc.registerFont('bold', opts.fonts.bold);

  for (const section of spec.sections) {
    renderSection(doc, section);
  }

  doc
    .moveDown(2)
    .font('body')
    .fontSize(8)
    .fillColor(COLOR.muted)
    .text(`Заказ ${spec.meta.orderId} · ${spec.meta.generatedAt}`, { align: 'center' });

  doc.end();
  return doc;
}

function renderSection(doc: PDFKit.PDFDocument, s: ReportSection): void {
  switch (s.kind) {
    case 'cover': {
      doc.font('bold').fontSize(24).fillColor(COLOR.accent).text(s.title, { align: 'center' });
      doc.moveDown(0.5);
      doc.font('body').fontSize(16).fillColor(COLOR.text).text(s.namesLine, { align: 'center' });
      doc.fontSize(11).fillColor(COLOR.muted).text(s.datesLine, { align: 'center' });
      doc.moveDown(2);
      return;
    }
    case 'matrixVisual': {
      // TODO(октаграмма): SVG-схема матрицы; до её готовности — аккуратный разделитель,
      // чтобы вёрстка и пагинация были финальными уже сейчас.
      const y = doc.y + 8;
      doc
        .moveTo(PAGE.margin, y)
        .lineTo(doc.page.width - PAGE.margin, y)
        .lineWidth(0.5)
        .strokeColor(COLOR.accent)
        .stroke();
      doc.moveDown(1.5);
      return;
    }
    case 'prose': {
      ensureRoom(doc, 120);
      doc.font('bold').fontSize(14).fillColor(COLOR.accent).text(s.heading);
      doc.moveDown(0.4);
      doc
        .font('body')
        .fontSize(10.5)
        .fillColor(COLOR.text)
        .text(s.body, { align: 'justify', lineGap: 2.5, paragraphGap: 6 });
      doc.moveDown(1);
      return;
    }
    case 'pairSynthesis': {
      ensureRoom(doc, 140);
      doc.font('bold').fontSize(14).fillColor(COLOR.accent).text(s.heading);
      doc.moveDown(0.4);
      doc
        .font('body')
        .fontSize(10.5)
        .fillColor(COLOR.text)
        .text(s.body, { align: 'justify', lineGap: 2.5 });
      doc.moveDown(0.6);
      doc.font('bold').fontSize(11).text('Что с этим делать');
      doc.moveDown(0.2);
      doc.font('body').fontSize(10.5).text(s.advice, { align: 'justify', lineGap: 2.5 });
      doc.moveDown(1);
      return;
    }
    case 'disclaimer': {
      ensureRoom(doc, 80);
      doc.moveDown(0.5);
      doc
        .font('body')
        .fontSize(8.5)
        .fillColor(COLOR.muted)
        .text(s.body, { align: 'justify', lineGap: 1.5 });
      return;
    }
    default: {
      const never: never = s;
      throw new Error(`Unknown section kind: ${(never as ReportSection).kind}`);
    }
  }
}

/** Не начинать секцию впритык к низу страницы. */
function ensureRoom(doc: PDFKit.PDFDocument, needed: number): void {
  const bottom = doc.page.height - PAGE.margin;
  if (doc.y + needed > bottom) doc.addPage();
}
