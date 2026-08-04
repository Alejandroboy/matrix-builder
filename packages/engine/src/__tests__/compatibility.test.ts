import { computeCompatibility } from '../compatibility';

/**
 * Golden совместимости. Пара из кросс-чека 2026-08-04:
 * скрины калькулятора конкурента подтвердили попозиционное сложение
 * (проверено ~20 позиций парной карты) и центр пары = 8.
 */
describe('compatibility golden', () => {
  test('21.11.1986 + 14.05.1990', () => {
    const cm = computeCompatibility('1986-11-21', '1990-05-14');
    // Личные центры: 13 и 13 (подтверждены двумя конкурентами)
    expect(cm.a.positions.center).toBe(13);
    expect(cm.b.positions.center).toBe(13);
    // Центр пары: 13+13=26 -> 8 — ПОДТВЕРЖДЁН скрином парной карты конкурента
    expect(cm.joint.coupleCharacter).toBe(8);
    // Heart/money пары: по нашей схеме x1/x2 (REF tvoyamatritsa);
    // парный принцип подтверждён, сами значения — производные схемы.
    expect(cm.joint.coupleHeart).toBe(3); // 13+17=30 -> 3
    expect(cm.joint.coupleMoney).toBe(6); // 8+16=24 -> 6
  });

  test('симметрия: порядок дат не влияет на joint', () => {
    const ab = computeCompatibility('1986-11-21', '1990-05-14');
    const ba = computeCompatibility('1990-05-14', '1986-11-21');
    expect(ab.joint).toEqual(ba.joint);
  });
});
