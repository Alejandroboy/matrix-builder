/**
 * Фирменный знак — та же октаграмма, что на схеме матрицы, упрощённая до
 * силуэта: окружность, ромб, квадрат и точка центра.
 *
 * Почему так: схема — единственный элемент, который человек видит и на сайте,
 * и в PDF. Знак, собранный из неё, не приходится «узнавать» отдельно.
 *
 * Цвета берутся из currentColor и --stamp, поэтому знак одинаково работает
 * на кремовом фоне и на тёмной полосе.
 */
export default function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flex: '0 0 auto' }}
    >
      <circle cx="24" cy="24" r="21.5" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      {/* Ромб: день — месяц — год — основа */}
      <path d="M24 6 L42 24 L24 42 L6 24 Z" stroke="currentColor" strokeWidth="2" />
      {/* Квадрат углов */}
      <path d="M11.3 11.3 H36.7 V36.7 H11.3 Z" stroke="currentColor" strokeWidth="2" />
      {/* Центр — единственный акцент, как и на схеме */}
      <circle cx="24" cy="24" r="5.5" fill="var(--stamp, #A03521)" />
    </svg>
  );
}
