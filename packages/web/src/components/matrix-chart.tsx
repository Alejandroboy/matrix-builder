'use client';

// Октаграмма — схема матрицы. Сигнатурный элемент интерфейса.
// Рисуется теми же токенами, что и остальной сайт: волосяные линии (--rule-strong),
// чернильные кружки на бумаге, киноварь (--stamp) — только на трёх позициях,
// вокруг которых строится продукт: центр, под сердцем, под долларом.
// Цифры — серифные, табличные: они здесь главный носитель смысла.

import type { PersonalMatrix } from '@matrix/engine';

const SIZE = 520;
const C = SIZE / 2;
const R = 196; // радиус вершин ромба
const Q = Math.round((R * Math.SQRT2) / 2); // радиус углов квадрата

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

// Точки «под сердцем» и «под долларом» — на луче от центра к нижнему правому углу.
const heartPt: Pt = { x: C + Q * 0.44, y: C + Q * 0.44 };
const moneyPt: Pt = { x: C + Q * 0.74, y: C + Q * 0.74 };

const path = (pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');

export default function MatrixChart({
  matrix,
  title,
}: {
  matrix: PersonalMatrix;
  title?: string;
}) {
  const p = matrix.positions;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      style={{ maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto' }}
      role="img"
      aria-label={
        title
          ? `Схема матрицы: ${title}. Центр — аркан ${p.center}, под сердцем — ${p.heart}, под долларом — ${p.money}.`
          : `Схема матрицы. Центр — аркан ${p.center}, под сердцем — ${p.heart}, под долларом — ${p.money}.`
      }
    >
      <circle
        cx={C}
        cy={C}
        r={R}
        fill="none"
        stroke="var(--rule)"
        strokeWidth={1}
      />
      <polygon
        points={path([P.left, P.top, P.right, P.bottom])}
        fill="none"
        stroke="var(--rule-strong)"
        strokeWidth={1.25}
      />
      <polygon
        points={path([P.tl, P.tr, P.br, P.bl])}
        fill="none"
        stroke="var(--rule-strong)"
        strokeWidth={1.25}
      />
      {/* Луч, на котором лежат линии отношений и денег */}
      <line
        x1={C}
        y1={C}
        x2={P.br.x}
        y2={P.br.y}
        stroke="var(--stamp)"
        strokeWidth={1}
        strokeDasharray="3 4"
        opacity={0.5}
      />

      <Node pt={P.left} value={p.personality} r={28} caption="день" side="left" />
      <Node pt={P.top} value={p.spirituality} r={28} caption="месяц" side="top" />
      <Node pt={P.right} value={p.destiny} r={28} caption="год" side="right" />
      <Node pt={P.bottom} value={p.karmicBase} r={28} caption="основа" side="bottom" />

      <Node pt={P.tl} value={p.cornerDayMonth} r={22} />
      <Node pt={P.tr} value={p.cornerMonthYear} r={22} />
      <Node pt={P.br} value={p.cornerYearBase} r={22} />
      <Node pt={P.bl} value={p.cornerBaseDay} r={22} />

      <Node
        pt={heartPt}
        value={p.heart}
        r={19}
        tone="stamp"
        caption="под сердцем"
        side="ray"
      />
      <Node
        pt={moneyPt}
        value={p.money}
        r={19}
        tone="stamp"
        caption="под долларом"
        side="ray"
      />
      <Node pt={P.center} value={p.center} r={34} tone="ink" />
    </svg>
  );
}

function Node({
  pt,
  value,
  r,
  tone = 'paper',
  caption,
  side,
}: {
  pt: Pt;
  value: number;
  r: number;
  tone?: 'paper' | 'ink' | 'stamp';
  caption?: string;
  side?: 'left' | 'top' | 'right' | 'bottom' | 'ray';
}) {
  const fill =
    tone === 'ink' ? 'var(--ink)' : tone === 'stamp' ? 'var(--stamp)' : 'var(--paper-raised)';
  const stroke = tone === 'paper' ? 'var(--rule-strong)' : 'none';
  const color = tone === 'paper' ? 'var(--ink)' : 'var(--paper)';
  const fontSize = r >= 30 ? 26 : r >= 26 ? 22 : r >= 21 ? 18 : 16;

  const capOffset = r + 16;
  const cap: Pt | null = !caption
    ? null
    : side === 'ray'
      ? { x: pt.x - r - 8, y: pt.y }
      : side === 'top'
        ? { x: pt.x, y: pt.y - capOffset + 4 }
        : side === 'bottom'
          ? { x: pt.x, y: pt.y + capOffset + 4 }
          : { x: pt.x, y: pt.y + capOffset };

  return (
    <g>
      <circle cx={pt.x} cy={pt.y} r={r} fill={fill} stroke={stroke} strokeWidth={1.25} />
      <text
        x={pt.x}
        y={pt.y}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        style={{
          fontFamily: 'var(--serif)',
          fontSize,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </text>
      {cap && (
        <text
          x={cap.x}
          y={cap.y}
          textAnchor={side === 'ray' ? 'end' : 'middle'}
          dominantBaseline="central"
          fill={tone === 'stamp' ? 'var(--stamp)' : 'var(--ink-soft)'}
          style={{ fontFamily: 'var(--sans)', fontSize: side === 'ray' ? 12 : 13 }}
        >
          {caption}
        </text>
      )}
    </g>
  );
}
