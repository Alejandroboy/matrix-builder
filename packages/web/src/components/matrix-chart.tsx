'use client';

// Октаграмма — сигнатурный элемент продукта.
//
// Геометрия и раскладка перенесены из дизайн-прототипа:
//  · восьмиугольное кольцо со скруглёнными углами — возрастная шкала 0–80 лет,
//    по 10 лет на ребро, деления через год, пятилетия отмечены кружком;
//  · значение каждого года считается делением пополам между значениями вершин
//    ребра — это та же арифметика «сумма соседних», что и во всей матрице;
//  · на каждой оси четыре узла, на каждой диагонали три, плюс сердце и деньги
//    на отдельном луче и медальон центра.
//
// Значения берутся из расчёта, а не выдумываются: всё, что есть в PersonalMatrix,
// приходит снаружи; промежуточные точки шкалы вычисляются здесь тем же правилом.
import { reduce, type PersonalMatrix } from '@matrix/engine';

const V = 760; // размер viewBox с полями под подписи
const OFF = 30; // поле вокруг схемы
const C = 350; // центр
const R = 250; // радиус вершин
const RA = 42; // вынос кольца наружу

type Pt = [number, number];

/**
 * Редукция берётся ИЗ ДВИЖКА, а не пишется здесь заново.
 *
 * В дизайн-прототипе она была сделана через остаток от деления на 22, и это
 * даёт другие числа: 21+13=34 превращается в 12 вместо 7. Наше правило —
 * сумма цифр, пока значение больше 22, — сверено с разобранным примером школы
 * и со скринами калькулятора конкурента, поэтому источник истины один: engine.
 */
const red = (v: number): number => reduce(v);

const at = (deg: number, rad: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [C + rad * Math.cos(a), C + rad * Math.sin(a)];
};

interface Palette {
  ring: string; line: string; lineStrong: string; comfort: string;
  age: string; cap: string;
  violet: string; terra: string; blue: string; amber: string; green: string; gold: string;
  ink: string; paper: string;
  hollowFill: string; hollowStroke: string; hollowText: string;
  bg: string;
}

const LIGHT: Palette = {
  ring: '#DEDCD4', line: '#CFCCC1', lineStrong: '#9A9588', comfort: '#DEDCD4',
  age: '#8A8578', cap: '#A19C8E',
  violet: '#5B3E8C', terra: '#A5342E', blue: '#2E5C8A', amber: '#B4802A',
  green: '#2F7A5E', gold: '#D9A93F', ink: '#121A2B', paper: '#FBFAF7',
  hollowFill: '#FFFFFF', hollowStroke: '#2B3245', hollowText: '#121A2B',
  bg: '#FBFAF7',
};

const DARK: Palette = {
  ring: 'rgba(251,250,247,0.30)', line: 'rgba(251,250,247,0.30)',
  lineStrong: 'rgba(251,250,247,0.55)', comfort: 'rgba(251,250,247,0.18)',
  age: 'rgba(251,250,247,0.62)', cap: 'rgba(251,250,247,0.45)',
  violet: '#9B7BE0', terra: '#E2604F', blue: '#5A8FCB', amber: '#D99B33',
  green: '#3E9E77', gold: '#E8C060', ink: '#121A2B', paper: '#FBFAF7',
  hollowFill: 'rgba(251,250,247,0.10)', hollowStroke: 'rgba(251,250,247,0.55)',
  hollowText: '#FBFAF7',
  bg: '#121A2B',
};

interface Node {
  cx: number; cy: number; r: number;
  fill: string; stroke: string; sw: number;
  value: number; fs: number; color: string;
}

export default function MatrixChart({
                                      matrix,
                                      reversed = false,
                                      maxWidth = 560,
                                      title,
                                    }: {
  matrix: PersonalMatrix;
  reversed?: boolean;
  maxWidth?: number;
  title?: string;
}) {
  const t = reversed ? DARK : LIGHT;
  const p = matrix.positions;

  const W = p.personality, N = p.spirituality, E = p.destiny, S = p.karmicBase;
  const center = p.center;
  const corners: Record<number, number> = {
    225: p.cornerDayMonth, 315: p.cornerMonthYear,
    45: p.cornerYearBase, 135: p.cornerBaseDay,
  };

  const nodes: Node[] = [];
  const add = (
    deg: number, rad: number, r: number,
    fill: string, stroke: string | null, sw: number,
    value: number, fs: number, color: string,
  ) => {
    const [cx, cy] = at(deg, rad);
    nodes.push({ cx, cy, r, fill, stroke: stroke ?? 'none', sw, value, fs, color });
  };

  // Оси: вершина, две промежуточные точки и внутренняя
  ([
    [180, W, t.violet, t.blue],
    [270, N, t.violet, t.blue],
    [0, E, t.terra, t.amber],
    [90, S, t.terra, t.amber],
  ] as const).forEach(([deg, outer, tone, accent]) => {
    const mid = red(outer + center);
    const q3 = red(outer + mid);
    const q1 = red(mid + center);
    add(deg, R, 34, tone, null, 0, outer, 34, t.paper);
    add(deg, 187.5, 22, accent, null, 0, q3, 22, t.paper);
    add(deg, 125, 20, t.hollowFill, accent, 2.5, mid, 20, t.hollowText);
    add(deg, 62.5, 15, t.green, null, 0, q1, 15, t.paper);
  });

  // Диагонали: угол квадрата и две точки к центру
  [225, 315, 45, 135].forEach((deg) => {
    const corner = corners[deg];
    const dm = red(corner + center);
    const dq = red(corner + dm);
    add(deg, R, 30, t.hollowFill, t.hollowStroke, 3.5, corner, 30, t.hollowText);
    add(deg, 195, 21, t.hollowFill, t.hollowStroke, 2, dq, 20, t.hollowText);
    add(deg, 157.5, 19, t.hollowFill, t.hollowStroke, 2, dm, 18, t.hollowText);
  });

  // Линия отношений и денег — отдельный луч между диагональю и осью
  add(22.5, 118, 18, t.green, null, 0, p.heart, 16, t.paper);
  add(22.5, 190, 20, t.gold, null, 0, p.money, 18, t.ink);
  add(0, 0, 38, t.gold, null, 0, center, 36, t.ink);

  // Рёбра восьмиугольника: по ним идёт возрастная шкала
  const EL = 2 * R * Math.sin(Math.PI / 8);
  const edges = Array.from({ length: 8 }, (_, e) => {
    const A = at(180 + e * 45, R);
    const B = at(180 + (e + 1) * 45, R);
    const ux = (B[0] - A[0]) / EL, uy = (B[1] - A[1]) / EL;
    const nx = uy, ny = -ux; // нормаль наружу
    return {
      ux, uy, nx, ny,
      T1: [A[0] + RA * nx, A[1] + RA * ny] as Pt,
      T2: [B[0] + RA * nx, B[1] + RA * ny] as Pt,
    };
  });

  let octPath = '';
  edges.forEach((g, i) => {
    const n = edges[(i + 1) % 8];
    octPath +=
      (i === 0 ? 'M' : 'L') + `${g.T1[0].toFixed(1)},${g.T1[1].toFixed(1)}` +
      `L${g.T2[0].toFixed(1)},${g.T2[1].toFixed(1)}` +
      `A${RA},${RA} 0 0 1 ${n.T1[0].toFixed(1)},${n.T1[1].toFixed(1)}`;
  });
  octPath += 'Z';

  // Значения шкалы: делим ребро пополам, потом ещё и ещё — сумма соседних
  const seq = [W, corners[225], N, corners[315], E, corners[45], S, corners[135]];
  const ticks: Array<{ x: number; y: number; r: number; fill: string; stroke: string; sw: number }> = [];
  const yearLabels: Array<{ x: number; y: number; text: string; fs: number; color: string; rot?: number; op?: number }> = [];

  edges.forEach((g, e) => {
    const A = seq[e], B = seq[(e + 1) % 8];
    const v = new Array<number>(11);
    v[0] = A; v[10] = B; v[5] = red(A + B);
    v[2] = red(A + v[5]); v[8] = red(v[5] + B);
    v[1] = red(A + v[2]); v[3] = red(v[2] + v[5]);
    v[6] = red(v[5] + v[8]); v[9] = red(v[8] + B);
    v[4] = red(v[3] + v[5]); v[7] = red(v[6] + v[8]);

    let rot = (Math.atan2(g.uy, g.ux) * 180) / Math.PI;
    while (rot > 90) rot -= 180;
    while (rot <= -90) rot += 180;

    const on = (f: number): Pt => [
      g.T1[0] + (g.T2[0] - g.T1[0]) * f,
      g.T1[1] + (g.T2[1] - g.T1[1]) * f,
    ];

    for (let i = 1; i <= 9; i++) {
      const [x, y] = on(i / 10);
      if (i === 5) {
        // Пятилетие — кольцом, чтобы взгляд цеплялся за опорные точки
        ticks.push({ x, y, r: 5, fill: t.bg, stroke: t.lineStrong, sw: 2 });
        continue;
      }
      ticks.push({ x, y, r: 3, fill: t.lineStrong, stroke: 'none', sw: 0 });
      yearLabels.push({
        x: x + g.nx * 14, y: y + g.ny * 14,
        text: String(v[i]), fs: 14, color: t.age,
      });
    }
    for (let i = 0; i < 10; i++) {
      const year = e * 10 + i;
      const [x, y] = on((i + 0.5) / 10);
      yearLabels.push({
        x: x - g.nx * 11, y: y - g.ny * 11,
        text: `${year}-${year + 1}`, fs: 7.5, color: t.cap, rot, op: 0.55,
      });
    }
  });

  return (
    <svg
      viewBox={`${-OFF} ${-OFF} ${V} ${V}`}
      width="100%"
      style={{ maxWidth, height: 'auto', display: 'block', margin: '0 auto' }}
      role="img"
      aria-label={
        `Схема матрицы${title ? ` (${title})` : ''}: центр — аркан ${center}, ` +
        `под сердцем — ${p.heart}, под долларом — ${p.money}.`
      }
    >
      <defs>
        <marker id="mx-arrow-m" viewBox="0 0 10 10" refX="9.5" refY="5"
                markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 Z" fill={t.violet} />
        </marker>
        <marker id="mx-arrow-f" viewBox="0 0 10 10" refX="9.5" refY="5"
                markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 Z" fill={t.terra} />
        </marker>
      </defs>

      {/* Восьмиугольное кольцо — возрастная шкала */}
      <path d={octPath} fill="none" stroke={t.ring} strokeWidth={1.5} strokeLinejoin="round" />
      {ticks.map((d, i) => (
        <circle key={`t${i}`} cx={d.x} cy={d.y} r={d.r} fill={d.fill}
                stroke={d.stroke} strokeWidth={d.sw} />
      ))}
      {yearLabels.map((l, i) => (
        <text
          key={`y${i}`} x={l.x} y={l.y} dy="0.35em" textAnchor="middle"
          fill={l.color} opacity={l.op ?? 1}
          transform={l.rot ? `rotate(${l.rot} ${l.x} ${l.y})` : undefined}
          style={{
            fontFamily: l.rot ? 'var(--sans)' : 'var(--serif)',
            fontSize: l.fs, fontWeight: l.rot ? 600 : 700,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {l.text}
        </text>
      ))}

      {/* Каркас: оси, диагонали, ромб, квадрат */}
      <line x1={100} y1={C} x2={600} y2={C} stroke={t.line} strokeWidth={1.5} />
      <line x1={C} y1={100} x2={C} y2={600} stroke={t.line} strokeWidth={1.5} />
      <line x1={173.2} y1={173.2} x2={526.8} y2={526.8} stroke={t.line} strokeWidth={1.5} />
      <line x1={173.2} y1={526.8} x2={526.8} y2={173.2} stroke={t.line} strokeWidth={1.5} />
      <polygon points="100,350 350,100 600,350 350,600" fill="none"
               stroke={t.lineStrong} strokeWidth={2} />
      <polygon points="173.2,173.2 526.8,173.2 526.8,526.8 173.2,526.8" fill="none"
               stroke={t.lineStrong} strokeWidth={2} />
      {/* Зона комфорта */}
      <circle cx={C} cy={C} r={155} fill="none" stroke={t.comfort} strokeWidth={1.5} />

      {/* Денежный луч и линии рода */}
      <line x1={C} y1={C} x2={553.3} y2={434.2} stroke={t.gold}
            strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" />
      <line x1={C} y1={C} x2={265.1} y2={265.1} stroke={t.violet}
            strokeWidth={4} markerEnd="url(#mx-arrow-m)" />
      <line x1={C} y1={C} x2={434.9} y2={265.1} stroke={t.terra}
            strokeWidth={4} markerEnd="url(#mx-arrow-f)" />

      {/* Узлы поверх каркаса */}
      {nodes.map((n, i) => (
        <g key={`n${i}`}>
          <circle cx={n.cx} cy={n.cy} r={n.r} fill={n.fill}
                  stroke={n.stroke} strokeWidth={n.sw} />
          <text
            x={n.cx} y={n.cy} dy="0.35em" textAnchor="middle" fill={n.color}
            style={{
              fontFamily: 'var(--serif)', fontSize: n.fs, fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {n.value}
          </text>
        </g>
      ))}

      {/* Десятилетия и подписи вершин */}
      {[
        { x: -24, y: 350, text: '0 лет', anchor: 'start' as const, fs: 20 },
        { x: -24, y: 380, text: 'день', anchor: 'start' as const, fs: 17, soft: true },
        { x: 112, y: 112, text: '10 лет', anchor: 'middle' as const, fs: 20 },
        { x: 350, y: -22, text: '20 лет', anchor: 'middle' as const, fs: 20 },
        { x: 350, y: 8, text: 'месяц', anchor: 'middle' as const, fs: 17, soft: true },
        { x: 588, y: 112, text: '30 лет', anchor: 'middle' as const, fs: 20 },
        { x: 724, y: 350, text: '40 лет', anchor: 'end' as const, fs: 20 },
        { x: 724, y: 380, text: 'год', anchor: 'end' as const, fs: 17, soft: true },
        { x: 588, y: 588, text: '50 лет', anchor: 'middle' as const, fs: 20 },
        { x: 350, y: 722, text: '60 лет', anchor: 'middle' as const, fs: 20 },
        { x: 350, y: 692, text: 'основа', anchor: 'middle' as const, fs: 17, soft: true },
        { x: 112, y: 588, text: '70 лет', anchor: 'middle' as const, fs: 20 },
      ].map((l, i) => (
        <text
          key={`d${i}`} x={l.x} y={l.y} dy="0.35em" textAnchor={l.anchor}
          fill={'soft' in l && l.soft ? t.cap : t.age}
          style={{ fontFamily: 'var(--sans)', fontSize: l.fs, fontWeight: 'soft' in l && l.soft ? 600 : 700 }}
        >
          {l.text}
        </text>
      ))}
    </svg>
  );
}