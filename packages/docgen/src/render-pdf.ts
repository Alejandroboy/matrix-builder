import PDFDocument from 'pdfkit';
import { ReportSection, ReportSpec } from './report';

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

/** Палитра схемы — те же цвета, что на сайте (globals.css), в печатном варианте. */
const CHART = {
  line: '#C9C2B4',
  ring: '#E4DFD4',
  day: '#3E5C76',
  month: '#2F6B4F',
  year: '#B8862B',
  base: '#A8442A',
  center: '#14213D',
  stamp: '#A03521',
  male: '#6B4E9E',
  minorFill: '#FFFFFF',
  minorStroke: '#C9C2B4',
  nodeText: '#FFFFFF',
  minorText: '#2b2b2b',
  caption: '#6E6A62',
};

export function renderReportPdf(spec: ReportSpec, opts: RenderOptions): NodeJS.ReadableStream {
  // font в конструкторе — обязательно наш TTF. Без него pdfkit по умолчанию
  // грузит метрики Helvetica из своей папки data/, которую сборщик Next
  // не копирует в .next/server → ENOENT на Helvetica.afm.
  const doc = new PDFDocument({
    size: PAGE.size,
    margin: PAGE.margin,
    font: opts.fonts.regular,
    info: { Title: opts.title ?? 'Разбор по матрице судьбы' },
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

/** Совместимость по имени: парный отчёт рендерится тем же кодом. */
export const renderCompatibilityPdf = renderReportPdf;

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
      const size = 300;
      ensureRoom(doc, size + (s.caption ? 46 : 26));
      const cx = doc.page.width / 2;
      const cy = doc.y + size / 2 + 6;
      drawOctagram(doc, s.positions, cx, cy, size / 2 - 26);
      doc.y = cy + size / 2 + 6;
      drawLegend(doc, cy + size / 2 + 14);
      // doc.x/doc.y не входят в graphics state: save/restore их не вернёт,
      // поэтому курсор возвращаем руками — иначе текст ниже уедет в узкую колонку.
      doc.x = PAGE.margin;
      doc.y = cy + size / 2 + 30;
      if (s.caption) {
        doc
          .font('body')
          .fontSize(10)
          .fillColor(CHART.caption)
          .text(s.caption, PAGE.margin, doc.y, {
            width: doc.page.width - PAGE.margin * 2,
            align: 'center',
          });
      }
      doc.moveDown(1.2);
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


/* ------------------------------- Октаграмма ------------------------------ */

type Positions = Extract<ReportSection, { kind: 'matrixVisual' }>['positions'];
type Pt = { x: number; y: number };

/**
 * Схема матрицы в PDF. Геометрия повторяет компонент matrix-chart.tsx:
 * окружность, ромб по вершинам день/месяц/год/основа, квадрат по углам,
 * оси, линии рода и по две точки на каждом направлении.
 */
function drawOctagram(
  doc: PDFKit.PDFDocument,
  p: Positions,
  cx: number,
  cy: number,
  r: number,
): void {
  const q = (r * Math.SQRT2) / 2;
  const P = {
    left: { x: cx - r, y: cy },
    top: { x: cx, y: cy - r },
    right: { x: cx + r, y: cy },
    bottom: { x: cx, y: cy + r },
    tl: { x: cx - q, y: cy - q },
    tr: { x: cx + q, y: cy - q },
    br: { x: cx + q, y: cy + q },
    bl: { x: cx - q, y: cy + q },
  };
  const along = (v: Pt, k: number): Pt => ({ x: cx + (v.x - cx) * k, y: cy + (v.y - cy) * k });
  const AXIS_IN = 0.4, AXIS_OUT = 0.7, DIAG_IN = 0.38, DIAG_OUT = 0.68;

  doc.save();

  // внешняя окружность
  doc.circle(cx, cy, r).lineWidth(0.75).strokeColor(CHART.ring).stroke();

  // ромб и квадрат
  poly(doc, [P.left, P.top, P.right, P.bottom]).lineWidth(1).strokeColor(CHART.line).stroke();
  poly(doc, [P.tl, P.tr, P.br, P.bl]).lineWidth(1).strokeColor(CHART.line).stroke();

  // оси
  doc.moveTo(P.left.x, cy).lineTo(P.right.x, cy).lineWidth(0.6).strokeColor(CHART.line).stroke();
  doc.moveTo(cx, P.top.y).lineTo(cx, P.bottom.y).lineWidth(0.6).strokeColor(CHART.line).stroke();

  // линии рода
  doc.moveTo(cx, cy).lineTo(P.tl.x, P.tl.y).lineWidth(1.1).strokeColor(CHART.male).stroke();
  doc.moveTo(cx, cy).lineTo(P.tr.x, P.tr.y).lineWidth(1.1).strokeColor(CHART.stamp).stroke();

  // денежный луч
  doc
    .moveTo(cx, cy)
    .lineTo(cx + q * 0.62, cy + q * 0.98)
    .lineWidth(0.9)
    .dash(2, { space: 3 })
    .strokeColor(CHART.stamp)
    .stroke()
    .undash();

  // промежуточные точки
  minor(doc, along(P.left, AXIS_IN), p.axisDay, CHART.day, 11);
  minor(doc, along(P.left, AXIS_OUT), p.axisDayOuter, CHART.day, 9.5);
  minor(doc, along(P.top, AXIS_IN), p.axisMonth, CHART.month, 11);
  minor(doc, along(P.top, AXIS_OUT), p.axisMonthOuter, CHART.month, 9.5);
  minor(doc, along(P.right, AXIS_IN), p.moneyEntry, CHART.year, 11);
  minor(doc, along(P.right, AXIS_OUT), p.axisYearOuter, CHART.year, 9.5);
  minor(doc, along(P.bottom, AXIS_IN), p.relationsEntry, CHART.base, 11);
  minor(doc, along(P.bottom, AXIS_OUT), p.axisBaseOuter, CHART.base, 9.5);

  minor(doc, along(P.tl, DIAG_IN), p.diagTopLeft, null, 11);
  minor(doc, along(P.tl, DIAG_OUT), p.diagTopLeftOuter, null, 9.5);
  minor(doc, along(P.tr, DIAG_IN), p.diagTopRight, null, 11);
  minor(doc, along(P.tr, DIAG_OUT), p.diagTopRightOuter, null, 9.5);
  minor(doc, along(P.br, DIAG_IN), p.diagBottomRight, null, 11);
  minor(doc, along(P.br, DIAG_OUT), p.diagBottomRightOuter, null, 9.5);
  minor(doc, along(P.bl, DIAG_IN), p.diagBottomLeft, null, 11);
  minor(doc, along(P.bl, DIAG_OUT), p.diagBottomLeftOuter, null, 9.5);

  // углы квадрата
  minor(doc, P.tl, p.cornerDayMonth, null, 14);
  minor(doc, P.tr, p.cornerMonthYear, null, 14);
  minor(doc, P.br, p.cornerYearBase, null, 14);
  minor(doc, P.bl, p.cornerBaseDay, null, 14);

  // сердце и деньги
  minor(doc, { x: cx + q * 0.3, y: cy + q * 0.54 }, p.heart, CHART.stamp, 11);
  minor(doc, { x: cx + q * 0.52, y: cy + q * 0.86 }, p.money, CHART.stamp, 11);

  // вершины
  jewel(doc, P.left, p.personality, CHART.day, 17, 'день', 'below');
  jewel(doc, P.top, p.spirituality, CHART.month, 17, 'месяц', 'above');
  jewel(doc, P.right, p.destiny, CHART.year, 17, 'год', 'below');
  jewel(doc, P.bottom, p.karmicBase, CHART.base, 17, 'основа', 'below');

  // центр
  jewel(doc, { x: cx, y: cy }, p.center, CHART.center, 21);

  doc.restore();
}

function poly(doc: PDFKit.PDFDocument, pts: Pt[]) {
  doc.moveTo(pts[0].x, pts[0].y);
  for (const pt of pts.slice(1)) doc.lineTo(pt.x, pt.y);
  return doc.closePath();
}

/** Число по центру кружка: pdfkit печатает от левого верхнего угла блока. */
function centeredNumber(
  doc: PDFKit.PDFDocument,
  value: number,
  pt: Pt,
  fontSize: number,
  color: string,
): void {
  const w = 60;
  doc
    .font('bold')
    .fontSize(fontSize)
    .fillColor(color)
    .text(String(value), pt.x - w / 2, pt.y - fontSize * 0.52, { width: w, align: 'center' });
}

function minor(
  doc: PDFKit.PDFDocument,
  pt: Pt,
  value: number,
  fill: string | null,
  radius: number,
): void {
  if (fill) {
    doc.circle(pt.x, pt.y, radius).fillColor(fill).fillOpacity(0.9).fill().fillOpacity(1);
  } else {
    doc
      .circle(pt.x, pt.y, radius)
      .fillColor(CHART.minorFill)
      .fill()
      .circle(pt.x, pt.y, radius)
      .lineWidth(0.9)
      .strokeColor(CHART.minorStroke)
      .stroke();
  }
  centeredNumber(doc, value, pt, radius * 0.95, fill ? CHART.nodeText : CHART.minorText);
}

function jewel(
  doc: PDFKit.PDFDocument,
  pt: Pt,
  value: number,
  fill: string,
  radius: number,
  caption?: string,
  capAt: 'above' | 'below' = 'below',
): void {
  doc.circle(pt.x, pt.y, radius).fillColor(fill).fill();
  // блик
  doc
    .ellipse(pt.x - radius * 0.32, pt.y - radius * 0.34, radius * 0.34, radius * 0.22)
    .fillColor('#FFFFFF')
    .fillOpacity(0.28)
    .fill()
    .fillOpacity(1);
  centeredNumber(doc, value, pt, radius * 0.92, CHART.nodeText);

  if (caption) {
    const w = 90;
    const y = capAt === 'above' ? pt.y - radius - 16 : pt.y + radius + 5;
    doc
      .font('body')
      .fontSize(8.5)
      .fillColor(CHART.caption)
      .text(caption, pt.x - w / 2, y, { width: w, align: 'center' });
  }
}


/** Легенда: без неё цветные диагонали для читателя просто украшение. */
function drawLegend(doc: PDFKit.PDFDocument, y: number): void {
  const items: Array<[string, string]> = [
    [CHART.male, 'линия мужского рода'],
    [CHART.stamp, 'линия женского рода'],
  ];
  const savedX = doc.x;
  const savedY = doc.y;
  doc.save().font('body').fontSize(8);
  const widths = items.map(([, label]) => doc.widthOfString(label) + 18);
  let x = (doc.page.width - (widths[0] + widths[1] + 14)) / 2;
  items.forEach(([color, label], i) => {
    doc.moveTo(x, y + 4).lineTo(x + 12, y + 4).lineWidth(1.4).strokeColor(color).stroke();
    doc.fillColor(CHART.caption).text(label, x + 16, y, { lineBreak: false });
    x += widths[i] + 14;
  });
  doc.restore();
  doc.x = savedX;
  doc.y = savedY;
}