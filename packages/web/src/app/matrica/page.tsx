import Calculator from '@/components/calculator';

export const metadata = {
  title: 'Матрица судьбы — рассчитать онлайн бесплатно по дате рождения',
  description:
    'Введите дату рождения — арканы характера, отношений и финансов посчитаются мгновенно, прямо в браузере. Бесплатно и без регистрации.',
};

export default function MatricaPage() {
  return (
    <>
      <section className="wrap" style={{ padding: '48px 20px 24px' }}>
        <div className="eyebrow">Личная матрица</div>
        <h1>Ваша матрица</h1>
        <p className="lead">
          Введите имя и дату рождения — схема, ключевые арканы и расшифровка по трём позициям
          появятся сразу, без ожидания и регистрации.
        </p>
      </section>
      <section className="wrap" style={{ paddingBottom: 64 }}>
        <Calculator initialTab="personal" />
      </section>
    </>
  );
}
