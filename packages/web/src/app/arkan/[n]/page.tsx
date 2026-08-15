// Программная страница «N аркан в матрице судьбы» — портрет энергии.
// Контент — из тех же JSON, что и PDF: один источник, деплой = git push.
//
// Блоки про отношения (asPartner / needsFromPartner / conflictPattern) вынесены
// на /arkan/[n]/otnosheniya. Держать их здесь означало бы, что дочерняя
// страница — строгое подмножество этой: поисковик склеивает такие пары
// и выбрасывает одну из них как малоценную.
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
    alternates: { canonical: `/arkan/${n}` },
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
          {/* «Значение», а не «Портрет»: первый H2 страницы должен повторять
              формулировку запроса («аркан N значение») и title, а не быть
              редакторским словом. */}
          <h2>
            Аркан {num} «{card.name}» — значение
          </h2>
          <Prose text={prose.blocks.portraitFull} />

          {/* Виньетка нигде на сайте не показывалась, хотя писалась как
              уникальная сценка против дедупликации. Здесь она к месту:
              иллюстрирует портрет и добавляет странице свой текст. */}
          <blockquote className="pull-quote" style={{ margin: '28px 0' }}>
            {card.vignette}
          </blockquote>

          {/* Отдельный заголовок под запрос «аркан N в центре матрицы»:
              новую страницу он не требует — центр и есть портрет энергии. */}
          <h2>Аркан {num} в центре матрицы</h2>
          {prose.blocks.inCenter ? (
            <Prose text={prose.blocks.inCenter} />
          ) : (
            <p>{card.positionNotes.center}</p>
          )}

          <h2>На других позициях</h2>
          <p>
            На линии сердца эта энергия описывает отношения — каким партнёром бывает
            человек и что повторяется в его паре:{' '}
            <Link href={`/arkan/${num}/otnosheniya`}>
              аркан {num} в отношениях
            </Link>
            .
          </p>
          <p>
            <strong>На линии денег.</strong> {card.positionNotes.money}
          </p>
        </article>

        <aside className="stack">
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
            <h3>Аркан {num} в отношениях</h3>
            <p className="muted" style={{ fontSize: 15 }}>
              Каким партнёром бывает «{card.name}», что ему нужно от второй половины
              и какой конфликт повторяется в паре.
            </p>
            <p style={{ margin: 0 }}>
              <Link href={`/arkan/${num}/otnosheniya`}>Читать разбор →</Link>
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