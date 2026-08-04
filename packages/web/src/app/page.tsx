import Calculator from '@/components/Calculator';

export const metadata = {
  title: 'Матрица судьбы — рассчитать онлайн бесплатно с расшифровкой',
  description:
    'Бесплатный расчёт матрицы судьбы по дате рождения: арканы характера, отношений и финансов мгновенно, без регистрации.',
};

export default function Home() {
  return (
    <>
      <section className="wrap" style={{ padding: '48px 20px 32px' }}>
        <h1>Матрица судьбы — рассчитать онлайн</h1>
        <p style={{ fontSize: 18 }}>
          Введите дату рождения — арканы характера, отношений и финансов посчитаются мгновенно,
          прямо в браузере. Это арифметический расчёт по дате и интерпретация для саморефлексии,
          а не гадание.
        </p>
      </section>
      <section className="wrap" style={{ paddingBottom: 48 }}>
        <Calculator initialTab="personal" />
      </section>
    </>
  );
}
