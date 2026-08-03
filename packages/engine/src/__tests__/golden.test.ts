import { computePersonalMatrix } from '../matrix';

/**
 * GOLDEN-ЭТАЛОНЫ ЛИЧНОЙ МАТРИЦЫ.
 *
 * Схема: доминирующая школа (11 = Сила, 8 = Справедливость).
 * Формулы: a=день, b=месяц, c=digitSum(год), d=a+b+c, e=a+b+c+d,
 *          d1=d+e, c1=c+e, x=d1+c1, x1(«под сердцем»)=d1+x, x2(«под долларом»)=x+c1.
 * Редукция: сумма цифр, пока значение > 22 (НЕ «вычитание 22»).
 *
 * Источник схемы: публичный вывод формул tvoyamatritsa.ru («Деньги в матрице
 * судьбы»), кейс REF ниже — дословно их разобранный пример 21.11.1986.
 * Остальные эталоны посчитаны вручную по этой схеме 2026-08-03.
 * Кросс-чек рекомендован на: matrica-sudby.ru, human-design.space (см. ⚠️ в README).
 */
const GOLDEN: Array<{
  birth: string;
  note: string;
  expected: {
    personality: number; spirituality: number; destiny: number; karmicBase: number;
    center: number; relationsEntry: number; moneyEntry: number; balance: number;
    heart: number; money: number;
  };
}> = [
  {
    birth: '1986-11-21',
    note: 'REF: разобранный пример источника (tvoyamatritsa), сверен дословно',
    // a=21, b=11, c=1+9+8+6=24->6, d=21+11+6=38->11, e=21+11+6+11=49->13,
    // d1=11+13=24->6, c1=6+13=19, x=6+19=25->7, x1=6+7=13, x2=7+19=26->8
    expected: {
      personality: 21, spirituality: 11, destiny: 6, karmicBase: 11,
      center: 13, relationsEntry: 6, moneyEntry: 19, balance: 7,
      heart: 13, money: 8,
    },
  },
  {
    birth: '1990-05-14',
    note: 'обычная дата без граничных условий',
    // a=14, b=5, c=1+9+9+0=19, d=14+5+19=38->11, e=14+5+19+11=49->13,
    // d1=11+13=24->6, c1=19+13=32->5, x=6+5=11, x1=6+11=17, x2=11+5=16
    expected: {
      personality: 14, spirituality: 5, destiny: 19, karmicBase: 11,
      center: 13, relationsEntry: 6, moneyEntry: 5, balance: 11,
      heart: 17, money: 16,
    },
  },
  {
    birth: '2000-12-31',
    note: 'день 31 -> редукция 4; год 2000 -> c=2',
    // a=31->4, b=12, c=2, d=4+12+2=18, e=4+12+2+18=36->9,
    // d1=18+9=27->9, c1=2+9=11, x=9+11=20, x1=9+20=29->11, x2=20+11=31->4
    expected: {
      personality: 4, spirituality: 12, destiny: 2, karmicBase: 18,
      center: 9, relationsEntry: 9, moneyEntry: 11, balance: 20,
      heart: 11, money: 4,
    },
  },
  {
    birth: '1988-11-22',
    note: 'день = 22: граница диапазона, БЕЗ редукции',
    // a=22, b=11, c=1+9+8+8=26->8, d=22+11+8=41->5, e=22+11+8+5=46->10,
    // d1=5+10=15, c1=8+10=18, x=15+18=33->6, x1=15+6=21, x2=6+18=24->6
    expected: {
      personality: 22, spirituality: 11, destiny: 8, karmicBase: 5,
      center: 10, relationsEntry: 15, moneyEntry: 18, balance: 6,
      heart: 21, money: 6,
    },
  },
  {
    birth: '1999-09-29',
    note: 'день 29 -> 11; c с двойной редукцией: 28 -> 10',
    // a=29->11, b=9, c=1+9+9+9=28->10, d=11+9+10=30->3, e=11+9+10+3=33->6,
    // d1=3+6=9, c1=10+6=16, x=9+16=25->7, x1=9+7=16, x2=7+16=23->5
    expected: {
      personality: 11, spirituality: 9, destiny: 10, karmicBase: 3,
      center: 6, relationsEntry: 9, moneyEntry: 16, balance: 7,
      heart: 16, money: 5,
    },
  },
];

describe('personal matrix golden', () => {
  test.each(GOLDEN)('$birth — $note', ({ birth, expected }) => {
    const m = computePersonalMatrix(birth);
    expect(m.positions).toEqual(expected);
  });
});

describe('input validation', () => {
  test('rejects malformed date', () => {
    expect(() => computePersonalMatrix('14.05.1990')).toThrow(RangeError);
  });
  test('rejects impossible day', () => {
    expect(() => computePersonalMatrix('2001-02-29')).toThrow(RangeError);
  });
  test('accepts leap day', () => {
    expect(() => computePersonalMatrix('2000-02-29')).not.toThrow();
  });
});
