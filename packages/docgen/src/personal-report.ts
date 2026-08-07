import { Arcana, PersonalMatrix } from '@matrix/engine';
import { ArcanaContentMap } from './content-schema';
import { DISCLAIMER, formatRu, ReportSection, ReportSpec } from './report';

export interface CompilePersonalInput {
  matrix: PersonalMatrix;
  content: ArcanaContentMap;
  name: string;
  orderId: string;
  generatedAt: string; // ISO, передаётся снаружи — компилятор чистый
}

/**
 * Личный разбор: три ключевые линии матрицы — характер, отношения, деньги.
 * Каждая раскрывается через свой аркан: полный портрет + позиционная заметка
 * («что эта энергия значит именно на этой линии»).
 *
 * Покрытие контентом проверяется до оплаты (assertPairCoverage по тем же трём
 * арканам); здесь при отсутствии текста падаем громко, а не печатаем пустоту.
 */
export function compilePersonalReport(input: CompilePersonalInput): ReportSpec {
  const { matrix, content, name, orderId, generatedAt } = input;
  const p = matrix.positions;

  const need = (a: Arcana) => {
    const c = content.get(a);
    if (!c) throw new Error(`No content for arcana ${a}`);
    return c;
  };

  const center = need(p.center);
  const heart = need(p.heart);
  const money = need(p.money);

  const sections: ReportSection[] = [
    {
      kind: 'cover',
      title: 'Разбор вашей матрицы судьбы',
      namesLine: name,
      datesLine: formatRu(matrix.birthDate),
    },
    // caption не нужен: имя уже на обложке, дублировать его под схемой — шум
    { kind: 'matrixVisual', positions: p },

    {
      kind: 'prose',
      heading: `Ваш характер: аркан ${p.center} — ${center.card.name}`,
      body: center.prose.blocks.portraitFull,
    },
    {
      kind: 'prose',
      heading: 'Эта энергия в центре матрицы',
      body: center.card.positionNotes.center,
    },

    {
      kind: 'prose',
      heading: `Отношения: аркан ${p.heart} — ${heart.card.name}`,
      body: heart.card.positionNotes.heart,
    },
    {
      kind: 'prose',
      heading: 'Какой партнёр вам подходит',
      body: heart.prose.blocks.needsFromPartner,
    },
    {
      kind: 'prose',
      heading: 'Что происходит в паре с этой энергией',
      body: heart.prose.blocks.asPartner,
    },
    {
      kind: 'prose',
      heading: 'Типичный конфликт этой линии',
      body: heart.prose.blocks.conflictPattern,
    },

    {
      kind: 'prose',
      heading: `Деньги: аркан ${p.money} — ${money.card.name}`,
      body: money.card.positionNotes.money,
    },
    {
      kind: 'prose',
      heading: 'Как эта энергия зарабатывает',
      body: money.prose.blocks.portraitShort,
    },

    { kind: 'disclaimer', body: DISCLAIMER },
  ];

  return { meta: { generatedAt, orderId }, sections };
}