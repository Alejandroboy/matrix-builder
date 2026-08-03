/**
 * Аркан — целое 1..22. Брендированный тип: сырое число не пролезет в API,
 * не пройдя через toArcana/reduce.
 */
export type Arcana = number & { readonly __brand: 'Arcana' };

export function toArcana(n: number): Arcana {
  if (!Number.isInteger(n) || n < 1 || n > 22) {
    throw new RangeError(`Arcana must be an integer in 1..22, got ${n}`);
  }
  return n as Arcana;
}

/**
 * Редукция к диапазону 1..22: суммируем цифры, пока значение > 22.
 *
 * ВЫБОР ШКОЛЫ: при сумме > 22 существуют две традиции — «вычесть 22» и
 * «сложить цифры». Мы следуем доминирующей (сложение цифр), сверено
 * с tvoyamatritsa.ru (пример 21.11.1986: 25 -> 7, 24 -> 6, 26 -> 8).
 * НЕ МЕНЯТЬ без пересчёта всех golden-эталонов.
 */
export function reduce(n: number): Arcana {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`reduce expects a positive integer, got ${n}`);
  }
  let x = n;
  while (x > 22) {
    x = String(x)
      .split('')
      .reduce((s, d) => s + Number(d), 0);
  }
  return toArcana(x);
}

/** Сумма цифр числа (для года рождения). */
export function digitSum(n: number): number {
  return String(Math.abs(n))
    .split('')
    .reduce((s, d) => s + Number(d), 0);
}
