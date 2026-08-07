import Link from 'next/link';
import { computePersonalMatrix, toArcana } from '@matrix/engine';
import MatrixChart from '@/components/matrix-chart';
import { getContent } from '@/lib/content';

export const metadata = {
  title: 'Матрица судьбы — рассчитать онлайн по дате рождения',
  description:
    'Восемь чисел из даты рождения: характер, отношения, деньги. Бесплатный расчёт матрицы судьбы мгновенно в браузере, полный PDF-разбор — от 290 ₽.',
};

// Пример на лендинге считается тем же движком, что и живой калькулятор:
// иллюстрация метода не должна расходиться с продуктом.
const SAMPLE_BIRTH = '1986-11-21';

const STEPS = [
  {
    n: '01',
    title: 'Дата',
    text: 'Введите день, месяц и год рождения — свои или партнёра, если считаете совместимость.',
  },
  {
    n: '02',
    title: 'Схема',
    text: 'Восемь позиций сложатся в матрицу: линия характера, линия отношений и денежная линия.',
  },
  {
    n: '03',
    title: 'Разбор',
    text: 'Читайте бесплатную расшифровку на странице или закажите PDF с полным разбором.',
  },
];

const FAQ = [
  {
    q: 'Это гадание?',
    a: 'Нет. Матрица судьбы — арифметический расчёт по дате рождения. Мы описываем характер и паттерны для саморефлексии, а не предсказываем будущее.',
  },
  {
    q: 'Как быстро придёт PDF?',
    a: 'Сразу после оплаты — ссылка на скачивание появляется на странице заказа и действует 7 дней.',
  },
  {
    q: 'А если разбор для моего сочетания арканов ещё не написан?',
    a: 'Сейчас написаны все 22 аркана, поэтому разбор соберётся для любой даты. Если что-то пойдёт не так, мы предложим оставить почту и напишем, как только всё починим.',
  },
  {
    q: 'Можно купить только совместимость, без личного разбора?',
    a: 'Да, это два отдельных продукта: личный разбор — 290 ₽, разбор пары — 390 ₽.',
  },
];

export default function Home() {
  const sample = computePersonalMatrix(SAMPLE_BIRTH);
  const { content } = getContent();
  const centerArcana = content.get(sample.positions.center);
  const heartArcana = content.get(sample.positions.heart);
  const moneyArcana = content.get(sample.positions.money);

  // Цитата — из реального разбора, а не выдуманная маркетинговая фраза
  const quote = centerArcana
    ? firstSentences(centerArcana.prose.blocks.portraitFull, 1)
    : null;

  return (
    <>
      {/* Герой */}
      <section className="band-dark">
        <div
          className="wrap"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 1.05fr) minmax(280px, 0.95fr)',
            gap: 48,
            alignItems: 'center',
            padding: '96px 20px 88px',
          }}
        >
          <div>
            <div className="eyebrow">Матрица судьбы · расчёт по дате рождения</div>
            <h1 className="display">Восемь чисел — и характер виден как на ладони</h1>
            <p className="lead" style={{ color: 'rgba(251,250,247,0.82)' }}>
              Дата рождения раскладывается в схему из восьми позиций: характер, отношения,
              деньги. Это арифметика, а не гадание — и считается мгновенно, прямо в браузере.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
              <Link href="/matrica">
                <button className="on-dark">Рассчитать свою матрицу</button>
              </Link>
              <Link href="#how">
                <button className="ghost-on-dark">Как это работает</button>
              </Link>
            </div>
            <p className="muted" style={{ marginTop: 20 }}>
              Без регистрации и почты. Полный PDF-разбор — по желанию, от 290 ₽.
            </p>
          </div>

          <div>
            <MatrixChart matrix={sample} reversed maxWidth={460} />
            <p
              className="muted"
              style={{ textAlign: 'center', marginTop: 12, fontSize: 13 }}
            >
              Пример разбора · аркан {sample.positions.center}
              {centerArcana ? ` «${centerArcana.card.name}»` : ''} в центре
            </p>
          </div>
        </div>
      </section>

      {/* Как это работает */}
      <section id="how" className="section">
        <div className="wrap">
          <h2>Как это работает</h2>
          <p className="muted" style={{ marginBottom: 36 }}>
            Три шага между датой рождения и разбором.
          </p>
          <div className="grid cols-3">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Пример разбора */}
      <section className="wrap" style={{ paddingBottom: 88 }}>
        <div className="card" style={{ padding: 48 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 40,
              alignItems: 'center',
            }}
          >
            <MatrixChart matrix={sample} maxWidth={400} />
            <div>
              <div className="eyebrow">Пример · дата 21.11.1986</div>
              <h2>Что вы увидите</h2>
              <SampleRow
                label="Центр — характер"
                value={sample.positions.center}
                name={centerArcana?.card.name}
              />
              <SampleRow
                label="Под сердцем — отношения"
                value={sample.positions.heart}
                name={heartArcana?.card.name}
              />
              <SampleRow
                label="Под долларом — деньги"
                value={sample.positions.money}
                name={moneyArcana?.card.name}
              />
              {quote && (
                <blockquote className="pull-quote" style={{ margin: '28px 0 12px' }}>
                  {quote}
                  <footer className="muted" style={{ marginTop: 10, fontFamily: 'var(--sans)' }}>
                    — из разбора аркана {sample.positions.center}
                    {centerArcana ? `, ${centerArcana.card.name}` : ''}
                  </footer>
                </blockquote>
              )}
              <p>
                <Link href={`/arkan/${sample.positions.center}`}>Смотреть карточку аркана →</Link>
              </p>
              <p className="muted">
                Цифры и разбор — иллюстрация метода. Ваш расчёт будет другим.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Баннер совместимости */}
      <section className="wrap" style={{ paddingBottom: 88 }}>
        <div
          className="band-dark"
          style={{
            borderRadius: 2,
            padding: 48,
            display: 'flex',
            gap: 32,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 320px' }}>
            <h2 style={{ marginBottom: 8 }}>Считаете вдвоём?</h2>
            <p className="muted" style={{ margin: 0 }}>
              У пары тоже есть матрица: тема союза, то, что держит вместе, и финансовая точка
              на двоих.
            </p>
          </div>
          <Link href="/sovmestimost">
            <button className="on-dark">Проверить совместимость</button>
          </Link>
        </div>
      </section>

      {/* Тарифы */}
      <section id="pricing" className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <h2>Сколько это стоит</h2>
          <p className="muted" style={{ marginBottom: 36 }}>
            Считать бесплатно можно всегда. Платите только за письменный разбор в PDF.
          </p>
          <div
            style={{
              display: 'grid',
              gap: 20,
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              alignItems: 'start',
            }}
          >
            <PriceCard
              title="Личный разбор"
              price="290 ₽"
              href="/matrica"
              items={[
                'Характер, отношения и деньги',
                'Полные разборы по трём ключевым арканам',
                'PDF на почту сразу после оплаты',
              ]}
            />
            <PriceCard
              featured
              badge="чаще выбирают"
              title="Совместимость"
              price="390 ₽"
              href="/sovmestimost"
              items={[
                'Обе матрицы рядом',
                'Аркан союза и динамика пары',
                'Что с этим делать — прямым текстом',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Вопросы */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ maxWidth: 780 }}>
          <h2>Вопросы</h2>
          {FAQ.map((item, i) => (
            <details key={item.q} className="acc" open={i === 0}>
              <summary>{item.q}</summary>
              <div>
                <p style={{ margin: 0 }}>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function SampleRow({ label, value, name }: { label: string; value: number; name?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 16,
        padding: '10px 0',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <span className="muted">{label}</span>
      <span
        className="num"
        style={{ fontFamily: 'var(--serif)', fontWeight: 700, whiteSpace: 'nowrap' }}
      >
        {value}
        {name ? ` · ${name}` : ''}
      </span>
    </div>
  );
}

function PriceCard({
  title, price, items, href, featured, badge,
}: {
  title: string; price: string; items: string[]; href: string;
  featured?: boolean; badge?: string;
}) {
  return (
    <div className={`card price-card${featured ? ' featured' : ''}`}>
      {badge && <span className="price-badge">{badge}</span>}
      <h3 style={{ marginBottom: 4 }}>{title}</h3>
      <div className="price-tag" style={{ marginBottom: 20 }}>{price}</div>
      <ul className="price-list">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <Link href={href}>
        <button className={featured ? undefined : 'ghost'} style={{ width: '100%' }}>
          Выбрать
        </button>
      </Link>
    </div>
  );
}

/** Первое предложение разбора — как цитата на лендинге. */
function firstSentences(text: string, count: number): string {
  const sentences = text.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/);
  return `«${sentences.slice(0, count).join(' ').trim()}»`;
}
