import PDFDocument from 'pdfkit';
// Редукция берётся из движка, а не пишется здесь заново: правило «сумма цифр,
// пока значение больше 22» — единственный источник истины и для сайта, и для PDF.
import {reduce} from '@matrix/engine';
import {ReportSection, ReportSpec} from './report';

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

/**
 * Палитра схемы — те же значения, что в LIGHT из matrix-chart.tsx.
 * Веб и PDF рисуют одну и ту же картинку двумя рендерерами, поэтому цвета
 * держим синхронно: расхождение сразу видно клиенту, который смотрит сайт
 * и скачанный документ рядом.
 */
const CHART = {
  ring: '#DEDCD4',
  line: '#CFCCC1',
  lineStrong: '#9A9588',
  comfort: '#DEDCD4',
  age: '#8A8578',
  cap: '#A19C8E',
  violet: '#5B3E8C',
  terra: '#A5342E',
  blue: '#2E5C8A',
  amber: '#B4802A',
  green: '#2F7A5E',
  gold: '#D9A93F',
  ink: '#121A2B',
  paper: '#FBFAF7',
  hollowFill: '#FFFFFF',
  hollowStroke: '#2B3245',
  hollowText: '#121A2B',
  bg: '#FBFAF7',
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
      // Схема стала подробнее (возрастное кольцо со значениями по годам),
      // поэтому ей нужна вся полезная ширина полосы набора, иначе числа
      // на кольце уходят в нечитаемый кегль.
      const size = Math.min(430, doc.page.width - PAGE.margin * 2);
      ensureRoom(doc, size + (s.caption ? 46 : 26));
      const cx = doc.page.width / 2;
      const cy = doc.y + size / 2 + 6;
      drawOctagram(doc, s.positions, cx, cy, size);
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
      throw new Error(`Unknown section kind: ${(s as ReportSection).kind}`);
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
 * Схема матрицы в PDF.
 *
 * Геометрия портирована один в один из matrix-chart.tsx: та же система
 * координат (viewBox 760, центр 350, радиус вершин 250, вынос кольца 42),
 * те же радиусы узлов и кегли. Раньше здесь была своя, более ранняя схема —
 * без возрастного кольца и с другим числом узлов, — и документ переставал
 * походить на то, что человек видел на сайте перед покупкой.
 *
 * Чтобы не пересчитывать координаты руками, рисуем прямо в координатах
 * прототипа, а на страницу переносим аффинным преобразованием pdfkit.
 * Побочный плюс: толщины линий и кегли масштабируются вместе с фигурой,
 * то есть пропорции гарантированно совпадают с вебом.
 */
const GEO = {
  C: 350, // центр в координатах прототипа
  R: 250, // радиус вершин
  RA: 42, // вынос возрастного кольца наружу
  EXTENT: 374, // полуразмер вместе с подписями десятилетий
};

const at = (deg: number, rad: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return { x: GEO.C + rad * Math.cos(a), y: GEO.C + rad * Math.sin(a) };
};

interface ChartNode {
  cx: number; cy: number; r: number;
  fill: string; stroke: string | null; sw: number;
  value: number; fs: number; color: string;
}

/**
 * @param doc
 * @param p
 * @param cx
 * @param cy
 * @param size полная ширина схемы на странице в пунктах
 */
function drawOctagram(
  doc: PDFKit.PDFDocument,
  p: Positions,
  cx: number,
  cy: number,
  size: number,
): void {
  const k = size / 2 / GEO.EXTENT;

  doc.save();
  // Переносим начало координат в центр схемы, масштабируем, затем сдвигаем
  // так, чтобы дальше можно было писать координаты прототипа как есть.
  doc.translate(cx, cy).scale(k).translate(-GEO.C, -GEO.C);

  const W = p.personality, N = p.spirituality, E = p.destiny, S = p.karmicBase;
  const center = p.center;
  const corners: Record<number, number> = {
    225: p.cornerDayMonth, 315: p.cornerMonthYear,
    45: p.cornerYearBase, 135: p.cornerBaseDay,
  };

  const nodes: ChartNode[] = [];
  const add = (
    deg: number, rad: number, r: number,
    fill: string, stroke: string | null, sw: number,
    value: number, fs: number, color: string,
  ) => {
    const { x, y } = at(deg, rad);
    nodes.push({ cx: x, cy: y, r, fill, stroke, sw, value, fs, color });
  };

  // Оси: вершина, две промежуточные точки и внутренняя
  ([
    [180, W, CHART.violet, CHART.blue],
    [270, N, CHART.violet, CHART.blue],
    [0, E, CHART.terra, CHART.amber],
    [90, S, CHART.terra, CHART.amber],
  ] as const).forEach(([deg, outer, tone, accent]) => {
    const mid = reduce(outer + center);
    const q3 = reduce(outer + mid);
    const q1 = reduce(mid + center);
    add(deg, GEO.R, 34, tone, null, 0, outer, 34, CHART.paper);
    add(deg, 187.5, 22, accent, null, 0, q3, 22, CHART.paper);
    add(deg, 125, 20, CHART.hollowFill, accent, 2.5, mid, 20, CHART.hollowText);
    add(deg, 62.5, 15, CHART.green, null, 0, q1, 15, CHART.paper);
  });

  // Диагонали: угол квадрата и две точки к центру
  [225, 315, 45, 135].forEach((deg) => {
    const corner = corners[deg];
    const dm = reduce(corner + center);
    const dq = reduce(corner + dm);
    add(deg, GEO.R, 30, CHART.hollowFill, CHART.hollowStroke, 3.5, corner, 30, CHART.hollowText);
    add(deg, 195, 21, CHART.hollowFill, CHART.hollowStroke, 2, dq, 20, CHART.hollowText);
    add(deg, 157.5, 19, CHART.hollowFill, CHART.hollowStroke, 2, dm, 18, CHART.hollowText);
  });

  // Линия отношений и денег — отдельный луч между диагональю и осью
  add(22.5, 118, 18, CHART.green, null, 0, p.heart, 16, CHART.paper);
  add(22.5, 190, 20, CHART.gold, null, 0, p.money, 18, CHART.ink);
  add(0, 0, 38, CHART.gold, null, 0, center, 36, CHART.ink);

  drawAgeRing(doc, [W, corners[225], N, corners[315], E, corners[45], S, corners[135]]);

  // Каркас: оси, диагонали, ромб, квадрат
  seg(doc, 100, GEO.C, 600, GEO.C, CHART.line, 1.5);
  seg(doc, GEO.C, 100, GEO.C, 600, CHART.line, 1.5);
  seg(doc, 173.2, 173.2, 526.8, 526.8, CHART.line, 1.5);
  seg(doc, 173.2, 526.8, 526.8, 173.2, CHART.line, 1.5);
  poly(doc, [
    { x: 100, y: 350 }, { x: 350, y: 100 }, { x: 600, y: 350 }, { x: 350, y: 600 },
  ]).lineWidth(2).strokeColor(CHART.lineStrong).stroke();
  poly(doc, [
    { x: 173.2, y: 173.2 }, { x: 526.8, y: 173.2 },
    { x: 526.8, y: 526.8 }, { x: 173.2, y: 526.8 },
  ]).lineWidth(2).strokeColor(CHART.lineStrong).stroke();

  // Зона комфорта
  doc.circle(GEO.C, GEO.C, 155).lineWidth(1.5).strokeColor(CHART.comfort).stroke();

  // Денежный луч — пунктиром
  doc
    .moveTo(GEO.C, GEO.C).lineTo(553.3, 434.2)
    .lineWidth(2).dash(2, { space: 6 }).strokeColor(CHART.gold).stroke().undash();

  // Линии рода со стрелками: в SVG это marker, в pdfkit рисуем треугольник сами
  arrowLine(doc, GEO.C, GEO.C, 265.1, 265.1, CHART.violet);
  arrowLine(doc, GEO.C, GEO.C, 434.9, 265.1, CHART.terra);

  // Узлы поверх каркаса
  for (const n of nodes) {
    doc.circle(n.cx, n.cy, n.r).fillColor(n.fill).fill();
    if (n.stroke) {
      doc.circle(n.cx, n.cy, n.r).lineWidth(n.sw).strokeColor(n.stroke).stroke();
    }
    centeredNumber(doc, n.value, { x: n.cx, y: n.cy }, n.fs, n.color);
  }

  // Десятилетия и подписи вершин
  const labels: Array<{
    x: number; y: number; text: string;
    align: 'left' | 'center' | 'right'; fs: number; soft?: boolean;
  }> = [
    { x: -24, y: 350, text: '0 лет', align: 'left', fs: 20 },
    { x: -24, y: 380, text: 'день', align: 'left', fs: 17, soft: true },
    { x: 112, y: 112, text: '10 лет', align: 'center', fs: 20 },
    { x: 350, y: -22, text: '20 лет', align: 'center', fs: 20 },
    { x: 350, y: 8, text: 'месяц', align: 'center', fs: 17, soft: true },
    { x: 588, y: 112, text: '30 лет', align: 'center', fs: 20 },
    { x: 724, y: 350, text: '40 лет', align: 'right', fs: 20 },
    { x: 724, y: 380, text: 'год', align: 'right', fs: 17, soft: true },
    { x: 588, y: 588, text: '50 лет', align: 'center', fs: 20 },
    { x: 350, y: 722, text: '60 лет', align: 'center', fs: 20 },
    { x: 350, y: 692, text: 'основа', align: 'center', fs: 17, soft: true },
    { x: 112, y: 588, text: '70 лет', align: 'center', fs: 20 },
  ];
  for (const l of labels) {
    const w = 200;
    const x = l.align === 'left' ? l.x : l.align === 'right' ? l.x - w : l.x - w / 2;
    doc
      .font(l.soft ? 'body' : 'bold')
      .fontSize(l.fs)
      .fillColor(l.soft ? CHART.cap : CHART.age)
      .text(l.text, x, l.y - l.fs * 0.52, { width: w, align: l.align, lineBreak: false });
  }

  doc.restore();
}

/**
 * Возрастное кольцо: восьмиугольник со скруглёнными углами, деления через год,
 * пятилетия — кольцом. Значение каждого года — «сумма соседних», та же
 * арифметика, что и во всей матрице.
 *
 * Подписи диапазонов («0-1», «1-2») из веба сюда не переносятся: в вебе они
 * набраны 7.5px, что на печатном размере даёт около 4pt — нечитаемая грязь
 * по контуру. На узких экранах они по той же причине скрыты через CSS.
 */
function drawAgeRing(doc: PDFKit.PDFDocument, seq: number[]): void {
  const EL = 2 * GEO.R * Math.sin(Math.PI / 8);
  const edges = Array.from({ length: 8 }, (_, e) => {
    const A = at(180 + e * 45, GEO.R);
    const B = at(180 + (e + 1) * 45, GEO.R);
    const ux = (B.x - A.x) / EL, uy = (B.y - A.y) / EL;
    const nx = uy, ny = -ux; // нормаль наружу
    return {
      nx, ny,
      T1: { x: A.x + GEO.RA * nx, y: A.y + GEO.RA * ny },
      T2: { x: B.x + GEO.RA * nx, y: B.y + GEO.RA * ny },
    };
  });

  let path = '';
  edges.forEach((g, i) => {
    const n = edges[(i + 1) % 8];
    path +=
      (i === 0 ? 'M' : 'L') + `${g.T1.x.toFixed(1)},${g.T1.y.toFixed(1)}` +
      `L${g.T2.x.toFixed(1)},${g.T2.y.toFixed(1)}` +
      `A${GEO.RA},${GEO.RA} 0 0 1 ${n.T1.x.toFixed(1)},${n.T1.y.toFixed(1)}`;
  });
  path += 'Z';
  doc.path(path).lineWidth(1.5).lineJoin('round').strokeColor(CHART.ring).stroke();

  edges.forEach((g, e) => {
    const A = seq[e], B = seq[(e + 1) % 8];
    const v = new Array<number>(11);
    v[0] = A; v[10] = B; v[5] = reduce(A + B);
    v[2] = reduce(A + v[5]); v[8] = reduce(v[5] + B);
    v[1] = reduce(A + v[2]); v[3] = reduce(v[2] + v[5]);
    v[6] = reduce(v[5] + v[8]); v[9] = reduce(v[8] + B);
    v[4] = reduce(v[3] + v[5]); v[7] = reduce(v[6] + v[8]);

    const on = (f: number): Pt => ({
      x: g.T1.x + (g.T2.x - g.T1.x) * f,
      y: g.T1.y + (g.T2.y - g.T1.y) * f,
    });

    for (let i = 1; i <= 9; i++) {
      const { x, y } = on(i / 10);
      if (i === 5) {
        // Пятилетие — кольцом, чтобы взгляд цеплялся за опорные точки
        doc.circle(x, y, 5).fillColor(CHART.bg).fill();
        doc.circle(x, y, 5).lineWidth(2).strokeColor(CHART.lineStrong).stroke();
        continue;
      }
      doc.circle(x, y, 3).fillColor(CHART.lineStrong).fill();
      centeredNumber(doc, v[i], { x: x + g.nx * 14, y: y + g.ny * 14 }, 14, CHART.age);
    }
  });
}

function seg(
  doc: PDFKit.PDFDocument,
  x1: number, y1: number, x2: number, y2: number,
  color: string, width: number,
): void {
  doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(width).strokeColor(color).stroke();
}

/** Линия рода: отрезок плюс залитый треугольник на конце. */
function arrowLine(
  doc: PDFKit.PDFDocument,
  x1: number, y1: number, x2: number, y2: number,
  color: string,
): void {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = 20;
  // Ствол не доводим до самого острия, иначе он выглядывает из-под треугольника
  const bx = x2 - Math.cos(a) * head * 0.9;
  const by = y2 - Math.sin(a) * head * 0.9;
  seg(doc, x1, y1, bx, by, color, 4);
  const wing = head * 0.42;
  doc
    .moveTo(x2, y2)
    .lineTo(bx - Math.sin(a) * wing, by + Math.cos(a) * wing)
    .lineTo(bx + Math.sin(a) * wing, by - Math.cos(a) * wing)
    .closePath()
    .fillColor(color)
    .fill();
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
  const w = 200;
  doc
    .font('bold')
    .fontSize(fontSize)
    .fillColor(color)
    .text(String(value), pt.x - w / 2, pt.y - fontSize * 0.52, {
      width: w,
      align: 'center',
      lineBreak: false,
    });
}


/** Легенда: без неё цветные диагонали для читателя просто украшение. */
function drawLegend(doc: PDFKit.PDFDocument, y: number): void {
  const items: Array<[string, string]> = [
    // Цвета берём те же, что у стрелок на схеме. Ключи male/stamp исчезли
    // вместе со старой палитрой, а undefined pdfkit молча рисует чёрным —
    // легенда переставала соответствовать линиям.
    [CHART.violet, 'линия мужского рода'],
    [CHART.terra, 'линия женского рода'],
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