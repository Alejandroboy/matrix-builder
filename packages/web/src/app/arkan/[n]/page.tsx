// Программная страница «N аркан в матрице судьбы».
// Контент — из тех же JSON, что и PDF: один источник, деплой = git push.
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
    <>
      <section className="band-dark">
        <div className="wrap" style={{ padding: '64px 20px 56px' }}>
          <div className="eyebrow">Аркан {num}</div>
          <h1 className="display" style={{ fontSize: 'clamp(34px, 4.6vw, 56px)' }}>
            {card.name}
          </h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
            {card.keywords.map((k) => (
              <span key={k} className="chip">
                {k}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="wrap split split-article">
        <article>
          <h2>Портрет</h2>
          <Prose text={prose.blocks.portraitFull} />

          <h2>В отношениях</h2>
          <Prose text={prose.blocks.asPartner} />
          <Prose text={prose.blocks.needsFromPartner} />

          <h2>Типичный конфликт</h2>
          <Prose text={prose.blocks.conflictPattern} />
        </article>

        <aside className="stack" style={{ position: 'sticky', top: 84 }}>
          <div className="card">
            <h3>Сильные стороны</h3>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {card.strengths.map((s) => (
                <li key={s} style={{ marginBottom: 8, fontSize: 15 }}>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Тени</h3>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {card.shadows.map((s) => (
                <li key={s} style={{ marginBottom: 8, fontSize: 15 }}>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card" style={{ borderColor: 'var(--ink)' }}>
            <h3>Аркан в позициях</h3>
            <p className="muted" style={{ marginBottom: 4 }}>В центре</p>
            <p style={{ fontSize: 15 }}>{card.positionNotes.center}</p>
            <p className="muted" style={{ marginBottom: 4 }}>Под сердцем</p>
            <p style={{ fontSize: 15 }}>{card.positionNotes.heart}</p>
            <p className="muted" style={{ marginBottom: 4 }}>На линии денег</p>
            <p style={{ fontSize: 15, marginBottom: 0 }}>{card.positionNotes.money}</p>
          </div>
        </aside>
      </div>

      <section className="wrap" style={{ paddingBottom: 64 }}>
        <div
          className="card"
          style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <p style={{ margin: 0, flex: '1 1 300px' }}>
            Узнайте, в каких позициях этот аркан стоит именно у вас, — расчёт бесплатный и
            мгновенный. Все энергии — в <Link href="/arkan">списке 22 арканов</Link>.
          </p>
          <Link href="/matrica">
            <button>Рассчитать мою матрицу</button>
          </Link>
          <Link href="/sovmestimost">
            <button className="ghost">Совместимость пары</button>
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
