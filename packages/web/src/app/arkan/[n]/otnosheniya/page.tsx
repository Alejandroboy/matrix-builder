// Программная страница «N аркан в отношениях».
//
// Формулировка выбрана по Wordstat: люди ищут «13 аркан в отношениях» (364),
// а не «на линии отношений» (3). Отсюда и заголовок, и title, и слаг.
//
// Блоки asPartner / needsFromPartner / conflictPattern живут ТОЛЬКО здесь:
// с родительской страницы они убраны намеренно. Иначе две страницы отличались
// бы лишь наличием портрета, и поисковик склеил бы их как дубли.
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { toArcana } from '@matrix/engine';
import { getContent } from '@/lib/content';

export const dynamicParams = false;

export function generateStaticParams() {
  return [...getContent().content.keys()].map((a) => ({ n: String(a) }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const item = getContent().content.get(toArcana(Number(n)));
  if (!item) return {};
  const { card } = item;
  return {
    title: `${n} аркан в отношениях — «${card.name}» на линии сердца в матрице судьбы`,
    description:
      `Что означает ${n} аркан «${card.name}» в отношениях: каким партнёром он бывает, ` +
      `что ему нужно от второй половины и какой конфликт повторяется в паре.`,
    alternates: { canonical: `/arkan/${n}/otnosheniya` },
  };
}

export default async function ArkanRelationsPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const num = Number(n);
  if (!Number.isInteger(num) || num < 1 || num > 22) notFound();
  const item = getContent().content.get(toArcana(num));
  if (!item) notFound();
  const { card, prose } = item;

  return (
    <>
      <section className="band-dark">
        <div className="wrap" style={{ padding: '64px 20px 56px' }}>
          <div className="eyebrow">
            <Link href={`/arkan/${num}`}>Аркан {num} · {card.name}</Link>
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(30px, 4.2vw, 50px)' }}>
            {num} аркан в отношениях
          </h1>
          <p className="muted" style={{ maxWidth: '52ch', marginTop: 16 }}>
            Энергия «{card.name}» на линии сердца: каким партнёром бывает такой человек,
            что ему нужно от второй половины и что в паре повторяется из раза в раз.
          </p>
        </div>
      </section>

      <div className="wrap split split-article">
        <article>
          {/* Отдельный позиционный блок появится во второй волне контента;
              пока его нет — начинаем с короткой заметки из карточки. */}
          {prose.blocks.inHeart ? (
            <Prose text={prose.blocks.inHeart} />
          ) : (
            <p style={{ fontSize: 18 }}>{card.positionNotes.heart}</p>
          )}

          <h2>Каким партнёром бывает {card.name}</h2>
          <Prose text={prose.blocks.asPartner} />

          <h2>Что нужно этой энергии от партнёра</h2>
          <Prose text={prose.blocks.needsFromPartner} />

          <h2>Типичный конфликт в паре</h2>
          <Prose text={prose.blocks.conflictPattern} />

          <div className="notice" style={{ marginTop: 32 }}>
            <p style={{ margin: 0 }}>
              Это описание энергии, а не прогноз для конкретной пары. Аркан на линии
              сердца показывает повторяющиеся паттерны, а не предопределённый исход:
              как они проявятся, зависит от обоих партнёров.
            </p>
          </div>
        </article>

        <aside className="stack">
          <div className="card">
            <h3>Коротко: в паре</h3>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {card.inRelationship.asPartner.map((s) => (
                <li key={s} style={{ marginBottom: 8, fontSize: 15 }}>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Что ему важно от второй половины</h3>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {card.inRelationship.needsFromPartner.map((s) => (
                <li key={s} style={{ marginBottom: 8, fontSize: 15 }}>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card" style={{ borderColor: 'var(--ink)' }}>
            <h3>Этот аркан целиком</h3>
            <p className="muted" style={{ fontSize: 15 }}>
              Характер, сильные стороны и тени энергии «{card.name}» — в общем разборе
              аркана.
            </p>
            <p style={{ margin: 0 }}>
              <Link href={`/arkan/${num}`}>Аркан {num} «{card.name}» →</Link>
            </p>
          </div>
        </aside>
      </div>

      <section className="wrap" style={{ paddingBottom: 64 }}>
        <div
          className="card"
          style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <p style={{ margin: 0, flex: '1 1 300px' }}>
            Узнайте, какой аркан на линии сердца у вас и у партнёра, — расчёт бесплатный
            и мгновенный. Все энергии — в <Link href="/arkan">списке 22 арканов</Link>.
          </p>
          <Link href="/sovmestimost">
            <button>Проверить совместимость</button>
          </Link>
          <Link href="/matrica">
            <button className="ghost">Моя матрица</button>
          </Link>
        </div>
      </section>
    </>
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
