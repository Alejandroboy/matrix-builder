import Calculator from '@/components/calculator';

export const metadata = {
  title: 'Матрица судьбы: рассчитать совместимость по датам рождения',
  description:
    'Совместимость по матрице судьбы онлайн: арканы пары по двум датам рождения бесплатно, полный PDF-разбор — по желанию.',
};

export default function Sovmestimost() {
  return (
    <>
      <section className="wrap" style={{ padding: '48px 20px 24px' }}>
        <div className="eyebrow">Совместимость</div>
        <h1>Матрица вашей пары</h1>
        <p className="lead">
          Введите две даты рождения — арканы вашей пары посчитаются мгновенно. Тема союза,
          то, что держит вас вместе, и финансовая точка пары — бесплатно; подробный разбор
          с рекомендациями — в PDF.
        </p>
      </section>
      <section className="wrap" style={{ paddingBottom: 48 }}>
        <Calculator initialTab="compatibility" />
      </section>
    </>
  );
}
