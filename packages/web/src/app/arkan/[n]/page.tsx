// Программная страница «N аркан в матрице судьбы».
// Контент — из тех же JSON, что и PDF: один источник, деплой = git push.
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { toArcana } from '@matrix/engine';
import { getContent } from '@/lib/content';

export const dynamicParams = false;

export function generateStaticParams() {
  // Индексируются только арканы с готовым контентом
  return [...getContent().content.keys()].map((a) => ({ n: String(a) }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const item = getContent().content.get(toArcana(Number(n)));
  if (!item) return {};
  return {
    title: `${n} аркан «${item.card.name}» в матрице судьбы — значение и расшифровка`,
    description: item.prose.blocks.portraitShort.slice(0, 155),
  };
}

export default async function ArkanPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const num = Number(n);
  if (!Number.isInteger(num) || num < 1 || num > 22) notFound();
  const item = getContent().content.get(toArcana(num));
  if (!item) notFound();
  const { card, prose } = item;

  return (
    <article className="wrap stack" style={{ padding: '48px 20px' }}>
      <h1>
        {num} аркан «{card.name}» в матрице судьбы
      </h1>
      <Prose text={prose.blocks.portraitFull} />

      <h2>{card.name} в отношениях</h2>
      <Prose text={prose.blocks.asPartner} />
      <Prose text={prose.blocks.needsFromPartner} />

      <h2>Типичный конфликт</h2>
      <Prose text={prose.blocks.conflictPattern} />

      <h2>{num} аркан в позициях матрицы</h2>
      <h3>В центре</h3>
      <p>{card.positionNotes.center}</p>
      <h3>Под сердцем</h3>
      <p>{card.positionNotes.heart}</p>
      <h3>На линии денег</h3>
      <p>{card.positionNotes.money}</p>

      <p>
        <Link href="/">Рассчитайте свою матрицу</Link> — мгновенно и бесплатно, или
        посмотрите <Link href="/sovmestimost">совместимость с партнёром</Link>.
      </p>
      <p style={{ fontSize: 13, color: '#8a8a8a' }}>
        Матрица судьбы — арифметический расчёт по дате рождения и интерпретация для
        саморефлексии, а не гадание и не предсказание будущего.
      </p>
    </article>
  );
}

function Prose({ text }: { text: string }) {
  return (
    <>
      {text.split('\n\n').map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}
