'use client';

// Мост между бесплатным результатом и покупкой.
//
// Раньше под результатом сразу стояло поле почты и кнопка с ценой: человек
// видел цифру, но не видел, за что платит. Здесь перечислены РЕАЛЬНЫЕ разделы
// документа — списки собраны по compilePersonalReport и compileCompatibilityReport
// в @matrix/docgen. Если состав отчёта поменяется, править надо оба места;
// придумывать пункты «для красоты» нельзя — это станет обещанием, которого
// в PDF нет.
import { arcanaName } from '@/lib/arcana-names';

interface Line {
  title: string;
  hint: string;
}

/** Разделы личного разбора — по порядку из compilePersonalReport. */
function personalLines(center: number, heart: number, money: number): Line[] {
  return [
    {
      title: `Характер: аркан ${center} — ${arcanaName(center)}`,
      hint: 'полный портрет энергии, а не короткая заметка',
    },
    {
      title: 'Эта энергия в центре матрицы',
      hint: 'как центральный аркан задаёт остальные линии',
    },
    {
      title: `Отношения: аркан ${heart} — ${arcanaName(heart)}`,
      hint: 'что линия под сердцем говорит о вашей паре',
    },
    {
      title: 'Какой партнёр вам подходит',
      hint: 'что вам нужно от второй половины',
    },
    {
      title: 'Что происходит в паре с этой энергией',
      hint: 'каким партнёром бываете вы сами',
    },
    {
      title: 'Типичный конфликт этой линии',
      hint: 'сценарий, который повторяется, и как из него выйти',
    },
    {
      title: `Деньги: аркан ${money} — ${arcanaName(money)}`,
      hint: 'через что к вам приходит доход',
    },
    {
      title: 'Как эта энергия зарабатывает',
      hint: 'сильные и слабые денежные стратегии',
    },
  ];
}

/** Разделы разбора совместимости — по порядку из compileCompatibilityReport. */
function pairLines(nameA: string, nameB: string): Line[] {
  return [
    { title: 'Тема вашего союза', hint: 'аркан, который описывает пару целиком' },
    { title: 'Что держит вас вместе', hint: 'общая линия отношений' },
    { title: `${nameA}: как вы устроены в паре`, hint: 'сильные стороны и требовательность' },
    { title: `Что нужно ${nameA} от партнёра`, hint: 'без чего отношения не работают' },
    { title: `${nameB}: как вы устроены в паре`, hint: 'то же со второй стороны' },
    { title: `Что нужно ${nameB} от партнёра`, hint: 'без чего отношения не работают' },
    {
      title: 'Динамика вашей пары',
      hint: 'что происходит между вами и что с этим делать',
    },
  ];
}

export default function PurchaseOffer({
  kind,
  center,
  heart,
  money,
  nameA,
  nameB,
}: {
  kind: 'personal' | 'compatibility';
  center?: number;
  heart?: number;
  money?: number;
  nameA?: string;
  nameB?: string;
}) {
  const isPair = kind === 'compatibility';
  const lines = isPair
    ? pairLines(nameA?.trim() || 'Первый партнёр', nameB?.trim() || 'Второй партнёр')
    : personalLines(center ?? 0, heart ?? 0, money ?? 0);

  return (
    <section className="offer">
      <p className="offer__seen">
        {isPair
          ? 'Вы уже видите обе матрицы и три аркана вашей пары. Это расчёт — он останется бесплатным.'
          : 'Вы уже видите схему и три ключевых аркана. Выше — короткие заметки по каждой линии; это расчёт, он останется бесплатным.'}
      </p>

      <h3 className="offer__title">
        {isPair
          ? 'В полном разборе совместимости — семь разделов'
          : 'В полном разборе — восемь разделов'}
      </h3>

      <ul className="offer__list">
        {lines.map((l) => (
          <li key={l.title} className="offer__item">
            <span className="offer__mark" aria-hidden="true" />
            <span>
              <strong>{l.title}</strong>
              <span className="muted"> — {l.hint}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="muted offer__foot">
        {isPair
          ? 'Плюс обе схемы в печатном виде. PDF придёт на почту сразу после оплаты.'
          : 'Плюс ваша схема в печатном виде, включая возрастную шкалу 0–80 лет. PDF придёт на почту сразу после оплаты.'}
      </p>
    </section>
  );
}
