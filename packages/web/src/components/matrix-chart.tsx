'use client';

// Октаграмма — схема матрицы, сигнатурный визуал продукта.
// Геометрия совпадает с расчётом: круг r=196 из центра (260,260) в поле 520×520,
// ромб через день/месяц/год/основу, квадрат через четыре угла (r≈139),
// «под сердцем» и «под долларом» — на луче к нижнему правому углу.
//
// Стилистика «самоцветов»: каждый узел — цветной шар с бликом и подложкой-тенью.
// Тени рисуются вторым кругом со смещением, а не фильтрами: SVG-фильтры
// не переживают экспорт в PDF и растеризацию.

import type { PersonalMatrix } from '@matrix/engine';

const SIZE = 520;
const C = SIZE / 2;
const R = 196; // радиус вершин ромба
const Q = 139; // радиус углов квадрата

type Pt = { x: number; y: number };

const P = {
  left: { x: C - R, y: C },
  top: { x: C, y: C - R },
  right: { x: C + R, y: C },
  bottom: { x: C, y: C + R },
  tl: { x: C - Q, y: C - Q },
  tr: { x: C + Q, y: C - Q },
  br: { x: C + Q, y: C + Q },
  bl: { x: C - Q, y: C + Q },
  center: { x: C, y: C },
} satisfies Record<string, Pt>;

// Сердце и деньги живут на отдельном коротком луче ниже диагонали,
// иначе они наложились бы на её собственные точки.
const heartPt: Pt = { x: C + Q * 0.30, y: C + Q * 0.54 };
const moneyPt: Pt = { x: C + Q * 0.52, y: C + Q * 0.86 };

/** Точка на отрезке от центра к vertex на доле k. */
const along = (v: Pt, k: number): Pt => ({ x: C + (v.x - C) * k, y: C + (v.y - C) * k });

// Промежуточные узлы: на осях — на 0.55 от центра к вершине,
// на диагоналях — на 0.5 к углу квадрата.
const AXIS_IN = 0.4;
const AXIS_OUT = 0.7;
const DIAG_IN = 0.38;
const DIAG_OUT = 0.68;

const poly = (pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');

/** Возрастная шкала по кругу: 0 лет слева, дальше по часовой через верх. */
const AGE_LABELS: Array<{ x: number; y: number; anchor: 'start' | 'middle' | 'end'; text: string }> = [
  { x: 25, y: 260, anchor: 'start', text: '0 лет' },
  { x: 94, y: 94, anchor: 'start', text: '10 лет' },
  { x: 260, y: 20, anchor: 'middle', text: '20 лет' },
  { x: 426, y: 94, anchor: 'end', text: '30 лет' },
  { x: 495, y: 260, anchor: 'end', text: '40 лет' },
  { x: 426, y: 426, anchor: 'end', text: '50 лет' },
  { x: 260, y: 500, anchor: 'middle', text: '60 лет' },
  { x: 94, y: 426, anchor: 'start', text: '70 лет' },
];

const TICKS = Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2 - Math.PI; // старт слева, как у возрастной шкалы
  return {
    x1: C + Math.cos(a) * R,
    y1: C + Math.sin(a) * R,
    x2: C + Math.cos(a) * (R + 9),
    y2: C + Math.sin(a) * (R + 9),
  };
});

interface Palette {
  male: string;
  female: string;
  ring: string;
  line: string;
  ray: string;
  cornerFill: string;
  cornerStroke: string;
  cornerText: string;
  centerFill: string;
  centerText: string;
  nodeText: string;
  caption: string;
  captionHalo: string;
  shadow: string;
  day: string;
  month: string;
  year: string;
  base: string;
  heart: string;
  money: string;
}

const LIGHT: Palette = {
  ring: 'var(--rule)',
  line: 'var(--rule-strong)',
  ray: 'var(--stamp)',
  cornerFill: 'var(--paper-raised)',
  cornerStroke: 'var(--rule-strong)',
  cornerText: 'var(--ink)',
  centerFill: 'var(--ink)',
  centerText: 'var(--paper)',
  nodeText: '#FBFAF7',
  caption: 'var(--ink-soft)',
  captionHalo: 'var(--paper)',
  shadow: 'rgba(18,26,43,0.18)',
  male: '#6B4E9E',
  female: 'var(--stamp)',
  day: 'var(--node-day)',
  month: 'var(--node-month)',
  year: 'var(--node-year)',
  base: 'var(--node-base)',
  heart: 'var(--node-heart)',
  money: 'var(--node-money)',
};

const DARK: Palette = {
  ring: 'rgba(251,250,247,0.28)',
  line: 'rgba(251,250,247,0.4)',
  ray: 'var(--stamp-on-dark)',
  cornerFill: 'rgba(251,250,247,0.12)',
  cornerStroke: 'rgba(251,250,247,0.5)',
  cornerText: '#FBFAF7',
  centerFill: 'url(#og-center)',
  centerText: '#0E1626',
  nodeText: '#0E1626',
  caption: 'rgba(251,250,247,0.72)',
  captionHalo: 'var(--ink)',
  shadow: 'rgba(0,0,0,0.35)',
  male: '#A78BD9',
  female: 'var(--stamp-on-dark)',
  day: 'var(--node-day-rev)',
  month: 'var(--node-month-rev)',
  year: 'var(--node-year-rev)',
  base: 'var(--node-base-rev)',
  heart: 'var(--node-heart-rev)',
  money: 'var(--node-money-rev)',
};

export default function MatrixChart({
                                      matrix,
                                      title,
                                      reversed = false,
                                      maxWidth = 440,
                                    }: {
  matrix: PersonalMatrix;
  title?: string;
  /** true — вариант для тёмной подложки (герой, баннеры) */
  reversed?: boolean;
  maxWidth?: number;
}) {
  const p = matrix.positions;
  const t = reversed ? DARK : LIGHT;
  const uid = reversed ? 'dark' : 'light';

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      style={{ maxWidth, height: 'auto', display: 'block', margin: '0 auto' }}
      role="img"
      aria-label={`Схема матрицы${title ? `: ${title}` : ''}. Центр — аркан ${p.center}, под сердцем — ${p.heart}, под долларом — ${p.money}.`}
    >
      <defs>
        <radialGradient id={`og-center-${uid}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={reversed ? '#FFFFFF' : '#2B3852'} />
          <stop offset="100%" stopColor={reversed ? '#EDEAE0' : '#121A2B'} />
        </radialGradient>
        <radialGradient id={`og-glow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={reversed ? '#E2725B' : '#8C2F26'} stopOpacity={reversed ? 0.35 : 0.08} />
          <stop offset="100%" stopColor={reversed ? '#E2725B' : '#8C2F26'} stopOpacity="0" />
        </radialGradient>
        <marker id={`arrow-male-${uid}`} viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={t.male} />
        </marker>
        <marker id={`arrow-female-${uid}`} viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={t.female} />
        </marker>
      </defs>

      <circle cx={C} cy={C} r={130} fill={`url(#og-glow-${uid})`} />
      <circle cx={C} cy={C} r={R} fill="none" stroke={t.ring} strokeWidth={1} />

      {TICKS.map((k, i) => (
        <line key={i} x1={k.x1} y1={k.y1} x2={k.x2} y2={k.y2} stroke={t.ring} strokeWidth={1.5} />
      ))}
      {AGE_LABELS.map((a) => (
        <text
          key={a.text}
          x={a.x}
          y={a.y}
          dy="0.35em"
          textAnchor={a.anchor}
          fill={t.caption}
          style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600 }}
        >
          {a.text}
        </text>
      ))}

      <polygon points={poly([P.left, P.top, P.right, P.bottom])} fill="none" stroke={t.line} strokeWidth={1.25} />
      <polygon points={poly([P.tl, P.tr, P.br, P.bl])} fill="none" stroke={t.line} strokeWidth={1.25} />

      {/* Оси: центр соединён со всеми четырьмя вершинами */}
      <line x1={P.left.x} y1={C} x2={P.right.x} y2={C} stroke={t.line} strokeWidth={1} opacity={0.7} />
      <line x1={C} y1={P.top.y} x2={C} y2={P.bottom.y} stroke={t.line} strokeWidth={1} opacity={0.7} />

      {/* Линии рода: мужская идёт к верхнему левому углу, женская — к верхнему правому */}
      <line
        x1={C} y1={C} x2={P.tl.x} y2={P.tl.y}
        stroke={t.male} strokeWidth={1.75} markerEnd={`url(#arrow-male-${uid})`} opacity={0.9}
      />
      <line
        x1={C} y1={C} x2={P.tr.x} y2={P.tr.y}
        stroke={t.female} strokeWidth={1.75} markerEnd={`url(#arrow-female-${uid})`} opacity={0.9}
      />
      <text
        x={(C + P.tl.x) / 2 - 4} y={(C + P.tl.y) / 2 - 8}
        textAnchor="middle" fill={t.male}
        transform={`rotate(-45 ${(C + P.tl.x) / 2 - 4} ${(C + P.tl.y) / 2 - 8})`}
        style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}
      >
        линия мужского рода
      </text>
      <text
        x={(C + P.tr.x) / 2 + 4} y={(C + P.tr.y) / 2 - 8}
        textAnchor="middle" fill={t.female}
        transform={`rotate(45 ${(C + P.tr.x) / 2 + 4} ${(C + P.tr.y) / 2 - 8})`}
        style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}
      >
        линия женского рода
      </text>

      {/* Денежный луч к нижнему правому углу */}
      <line
        x1={C} y1={C} x2={moneyPt.x + 16} y2={moneyPt.y + 26}
        stroke={t.ray} strokeWidth={1.5} strokeDasharray="3 5" opacity={0.75}
      />

      <Corner pt={P.tl} value={p.cornerDayMonth} t={t} />
      <Corner pt={P.tr} value={p.cornerMonthYear} t={t} />
      <Corner pt={P.br} value={p.cornerYearBase} t={t} />
      <Corner pt={P.bl} value={p.cornerBaseDay} t={t} />

      {/* Каждое направление получает по две точки: ближе к центру и ближе к вершине.
          Так схема симметрична — раньше пара была только на денежном луче. */}
      <Minor pt={along(P.left, AXIS_IN)} value={p.axisDay} t={t} fill={t.day} />
      <Minor pt={along(P.left, AXIS_OUT)} value={p.axisDayOuter} t={t} fill={t.day} small />
      <Minor pt={along(P.top, AXIS_IN)} value={p.axisMonth} t={t} fill={t.month} />
      <Minor pt={along(P.top, AXIS_OUT)} value={p.axisMonthOuter} t={t} fill={t.month} small />
      <Minor pt={along(P.right, AXIS_IN)} value={p.moneyEntry} t={t} fill={t.year} />
      <Minor pt={along(P.right, AXIS_OUT)} value={p.axisYearOuter} t={t} fill={t.year} small />
      <Minor pt={along(P.bottom, AXIS_IN)} value={p.relationsEntry} t={t} fill={t.base} />
      <Minor pt={along(P.bottom, AXIS_OUT)} value={p.axisBaseOuter} t={t} fill={t.base} small />

      <Minor pt={along(P.tl, DIAG_IN)} value={p.diagTopLeft} t={t} />
      <Minor pt={along(P.tl, DIAG_OUT)} value={p.diagTopLeftOuter} t={t} small />
      <Minor pt={along(P.tr, DIAG_IN)} value={p.diagTopRight} t={t} />
      <Minor pt={along(P.tr, DIAG_OUT)} value={p.diagTopRightOuter} t={t} small />
      <Minor pt={along(P.br, DIAG_IN)} value={p.diagBottomRight} t={t} />
      <Minor pt={along(P.br, DIAG_OUT)} value={p.diagBottomRightOuter} t={t} small />
      <Minor pt={along(P.bl, DIAG_IN)} value={p.diagBottomLeft} t={t} />
      <Minor pt={along(P.bl, DIAG_OUT)} value={p.diagBottomLeftOuter} t={t} small />

      <Jewel pt={P.left} r={28} fill={t.day} value={p.personality} t={t} caption="день" capAt="below" />
      <Jewel pt={P.top} r={28} fill={t.month} value={p.spirituality} t={t} caption="месяц" capAt="above" />
      <Jewel pt={P.right} r={28} fill={t.year} value={p.destiny} t={t} caption="год" capAt="below" />
      <Jewel pt={P.bottom} r={28} fill={t.base} value={p.karmicBase} t={t} caption="основа" capAt="below" />

      <Jewel pt={heartPt} r={21} fill={t.heart} value={p.heart} t={t} caption="под сердцем" capAt="left" />
      <Jewel pt={moneyPt} r={21} fill={t.money} value={p.money} t={t} caption="под долларом" capAt="left" />

      {/* Центральный медальон рисуется последним — он поверх всего */}
      <circle cx={C} cy={C + 4} r={42} fill={t.shadow} />
      <circle cx={C} cy={C} r={40} fill={reversed ? `url(#og-center-${uid})` : t.centerFill} />
      <ellipse cx={C - 14} cy={C - 14} rx={14} ry={9} fill="#FFFFFF" opacity={reversed ? 0.5 : 0.14} />
      <text
        x={C} y={C} dy="0.35em" textAnchor="middle"
        fill={t.centerText}
        style={{ fontFamily: 'var(--serif)', fontSize: 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
      >
        {p.center}
      </text>
    </svg>
  );
}

/** Малый узел: промежуточная точка оси или диагонали. */
function Minor({
                 pt, value, t, fill, small = false,
               }: {
  pt: Pt; value: number; t: Palette; fill?: string; small?: boolean;
}) {
  const r = small ? 13 : 15;
  return (
    <g>
      <circle cx={pt.x} cy={pt.y + 1.5} r={r + 1} fill={t.shadow} opacity={0.5} />
      <circle
        cx={pt.x} cy={pt.y} r={r}
        fill={fill ?? t.cornerFill}
        stroke={fill ? 'none' : t.cornerStroke}
        strokeWidth={1.25}
        opacity={fill ? 0.85 : 1}
      />
      {fill && <ellipse cx={pt.x - 5} cy={pt.y - 5} rx={5} ry={3.5} fill="#FFFFFF" opacity={0.3} />}
      <text
        x={pt.x} y={pt.y} dy="0.35em" textAnchor="middle"
        fill={fill ? t.nodeText : t.cornerText}
        style={{
          fontFamily: 'var(--serif)',
          fontSize: small ? 12 : 14,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </text>
    </g>
  );
}

function Jewel({
                 pt, r, fill, value, t, caption, capAt,
               }: {
  pt: Pt; r: number; fill: string; value: number; t: Palette;
  caption?: string; capAt?: 'above' | 'below' | 'left';
}) {
  const cap =
    capAt === 'above' ? { x: pt.x, y: pt.y - r - 16, anchor: 'middle' as const }
      : capAt === 'left' ? { x: pt.x - r - 8, y: pt.y, anchor: 'end' as const }
        : { x: pt.x, y: pt.y + r + 16, anchor: 'middle' as const };

  return (
    <g>
      <circle cx={pt.x} cy={pt.y + 2} r={r + 1} fill={t.shadow} />
      <circle cx={pt.x} cy={pt.y} r={r} fill={fill} />
      <ellipse cx={pt.x - r * 0.33} cy={pt.y - r * 0.33} rx={r * 0.36} ry={r * 0.25} fill="#FFFFFF" opacity={0.3} />
      <text
        x={pt.x} y={pt.y} dy="0.35em" textAnchor="middle"
        fill={t.nodeText}
        style={{ fontFamily: 'var(--serif)', fontSize: r >= 26 ? 23 : 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </text>
      {caption && (
        <text
          x={cap.x} y={cap.y} dy="0.35em" textAnchor={cap.anchor}
          fill={t.caption}
          style={{
            fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600,
            paintOrder: 'stroke', stroke: t.captionHalo, strokeWidth: '5px', strokeLinejoin: 'round',
          }}
        >
          {caption}
        </text>
      )}
    </g>
  );
}

function Corner({ pt, value, t }: { pt: Pt; value: number; t: Palette }) {
  return (
    <g>
      <circle cx={pt.x} cy={pt.y + 2} r={23} fill={t.shadow} />
      <circle cx={pt.x} cy={pt.y} r={22} fill={t.cornerFill} stroke={t.cornerStroke} strokeWidth={1.25} />
      <text
        x={pt.x} y={pt.y} dy="0.35em" textAnchor="middle"
        fill={t.cornerText}
        style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </text>
    </g>
  );
}