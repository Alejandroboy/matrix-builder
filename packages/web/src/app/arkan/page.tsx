// Индекс арканов: хаб для перелинковки программных страниц /arkan/[n].
// Собирается из тех же JSON, что и PDF — контент один, источник один.
import Link from 'next/link';
import { getContent } from '@/lib/content';

export const metadata = {
  title: '22 аркана матрицы судьбы — значения и расшифровка',
  description:
    'Значение всех 22 арканов матрицы судьбы: характер, отношения и деньги по каждой энергии. Разборы с примерами, без гадания и предсказаний.',
};

export default function ArkanIndex() {
  const { content } = getContent();
  const items = [...content.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <article className="wrap stack" style={{ padding: '48px 20px' }}>
      <h1>22 аркана матрицы судьбы</h1>
      <p style={{ fontSize: 18 }}>
        Каждая энергия описана в двух состояниях — проработанном и непроработанном, — и
        отдельно разобрана на линии отношений и денег. Чтобы узнать свои арканы,{' '}
        <Link href="/">рассчитайте матрицу по дате рождения</Link>.
      </p>

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
        }}
      >
        {items.map(([arcana, item]) => (
          <Link
            key={arcana}
            href={`/arkan/${arcana}`}
            className="card"
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <strong style={{ fontFamily: 'var(--serif)', fontSize: 17 }}>
              {arcana} · {item.card.name}
            </strong>
            <span className="muted" style={{ display: 'block', marginTop: 4 }}>
              {item.card.keywords.slice(0, 3).join(' · ')}
            </span>
          </Link>
        ))}
      </div>

      <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
        Матрица судьбы — арифметический расчёт по дате рождения и интерпретация для
        саморефлексии, а не гадание и не предсказание будущего.
      </p>
    </article>
  );
}
