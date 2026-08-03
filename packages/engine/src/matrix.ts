import { Arcana, reduce, digitSum } from './arcana';

/** Дата рождения — только ISO-строка 'YYYY-MM-DD'. Никаких Date на границе API. */
export type BirthDateISO = string;

/**
 * Позиции личной матрицы. Обозначения точек — по доминирующей школе
 * (сверено с публичным выводом формул на tvoyamatritsa.ru, пример 21.11.1986):
 *
 *   a  = день рождения (редукция)            — «характер»
 *   b  = месяц рождения                       — «духовный/эмоциональный портрет»
 *   c  = сумма цифр года (редукция)           — «судьба/социум»
 *   d  = a+b+c (редукция)                     — нижняя точка диагонального квадрата
 *   e  = a+b+c+d (редукция)                   — ЦЕНТР, «зона комфорта»
 *
 * Линия отношений/денег (отрезок d—c с промежуточными точками):
 *   d1 = d+e   — вход в линию со стороны отношений
 *   c1 = c+e   — «вход в денежный канал»
 *   x  = d1+c1 — центр линии (баланс отношений/денег)
 *   x1 = d1+x  — «ПОД СЕРДЦЕМ» (линия отношений; описывает подходящего партнёра)
 *   x2 = x+c1  — «ПОД ДОЛЛАРОМ» (финансовая точка)
 */
export interface PersonalMatrix {
  birthDate: BirthDateISO;
  positions: {
    personality: Arcana; // a
    spirituality: Arcana; // b
    destiny: Arcana; // c
    karmicBase: Arcana; // d
    center: Arcana; // e
    relationsEntry: Arcana; // d1
    moneyEntry: Arcana; // c1
    balance: Arcana; // x
    heart: Arcana; // x1, «под сердцем»
    money: Arcana; // x2, «под долларом»
  };
}

export type PositionKey = keyof PersonalMatrix['positions'];

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseBirthDate(iso: BirthDateISO): { y: number; m: number; d: number } {
  const match = ISO_RE.exec(iso);
  if (!match) throw new RangeError(`birthDate must be 'YYYY-MM-DD', got '${iso}'`);
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12) throw new RangeError(`month out of range in '${iso}'`);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d < 1 || d > daysInMonth) throw new RangeError(`day out of range in '${iso}'`);
  return { y, m, d };
}

export function computePersonalMatrix(birthDate: BirthDateISO): PersonalMatrix {
  const { y, m, d } = parseBirthDate(birthDate);

  const a = reduce(d);
  const b = reduce(m); // месяц всегда <= 12, редукция — no-op, но единообразие дешевле исключения
  const c = reduce(digitSum(y));
  const dd = reduce(a + b + c);
  const e = reduce(a + b + c + dd);

  const d1 = reduce(dd + e);
  const c1 = reduce(c + e);
  const x = reduce(d1 + c1);
  const x1 = reduce(d1 + x);
  const x2 = reduce(x + c1);

  return {
    birthDate,
    positions: {
      personality: a,
      spirituality: b,
      destiny: c,
      karmicBase: dd,
      center: e,
      relationsEntry: d1,
      moneyEntry: c1,
      balance: x,
      heart: x1,
      money: x2,
    },
  };
}
