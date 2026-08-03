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
 * Joint-формулы: принцип ПОДТВЕРЖДЁН источником (avatariumlife.com, гайд по
 * матрице совместимости): «парная матрица строится сложением одинаковых позиций
 * из двух личных матриц — центральные арканы, точки зоны отношений, финансов».
 * Это ровно наша реализация: reduce(posA + posB) по соответствующим позициям.
 *
 * ⚠️ Остался численный кросс-чек (5 минут руками): вбить пару golden-дат
 * в 1-2 калькулятора совместимости конкурентов и сверить joint-значения;
 * после сверки добавить golden в compatibility.test.ts.
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
