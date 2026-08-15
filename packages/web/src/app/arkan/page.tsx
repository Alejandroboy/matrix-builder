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
          // Заголовок — не ссылка: оба перехода подписаны явно и лежат
          // в подвале. Иначе на тач-устройствах, где нет ховера, непонятно,
          // что кликабельных мест два.
          //
          // «Значение», а не «портрет»: портрет — это заголовок раздела внутри
          // страницы, в анкоре он без контекста не читается. «Значение» же —
          // слово, которым запрос и формулируют («1 аркан значение»), и оно
          // совпадает с title целевой страницы.
          <div key={arcana} className="card">
            <strong className="arcana-card__title">
              {arcana} · {item.card.name}
            </strong>
            <span className="arcana-card__keywords">
              {item.card.keywords.slice(0, 3).join(' · ')}
            </span>
            <div className="arcana-card__foot">
              <Link href={`/arkan/${arcana}`} className="arcana-card__link">
                Аркан {arcana} — значение →
              </Link>
              {/* Прямая ссылка на позиционную страницу: у новых URL должна быть
                  входящая перелинковка не только с родительского аркана. */}
              <Link
                href={`/arkan/${arcana}/otnosheniya`}
                className="arcana-card__link"
              >
                Аркан {arcana} в отношениях →
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
        Матрица судьбы — арифметический расчёт по дате рождения и интерпретация для
        саморефлексии, а не гадание и не предсказание будущего.
      </p>
    </article>
  );
}