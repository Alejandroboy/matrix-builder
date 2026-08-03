import { reduce } from './arcana';
import { Arcana } from './arcana';
import { BirthDateISO, PersonalMatrix, computePersonalMatrix } from './matrix';

export interface CompatibilityMatrix {
  a: PersonalMatrix;
  b: PersonalMatrix;
  joint: {
    coupleCharacter: Arcana; // «тема союза» — центральный аркан пары
    coupleHeart: Arcana; // «что держит пару» — под сердцем пары
    coupleMoney: Arcana; // финансовая точка пары
  };
}

/**
 * ⚠️ PLACEHOLDER-ФОРМУЛЫ joint-позиций.
 * Общий принцип школы — сумма соответствующих позиций двух матриц с редукцией,
 * но точный публичный вывод парных формул (как для личной линии на
 * tvoyamatritsa.ru) в открытых источниках не найден: калькуляторы совместимости
 * конкурентов прячут вывод. ПЕРЕД ПРОДАЖЕЙ PDF совместимости:
 * сверить joint-значения на 2-3 калькуляторах конкурентов по одной паре дат
 * и при расхождении поправить формулы + добавить golden в compatibility.test.
 */
export function computeCompatibility(
  birthA: BirthDateISO,
  birthB: BirthDateISO,
): CompatibilityMatrix {
  const a = computePersonalMatrix(birthA);
  const b = computePersonalMatrix(birthB);
  return {
    a,
    b,
    joint: {
      coupleCharacter: reduce(a.positions.center + b.positions.center),
      coupleHeart: reduce(a.positions.heart + b.positions.heart),
      coupleMoney: reduce(a.positions.money + b.positions.money),
    },
  };
}
