import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Калькулятор неустойки по договору 2026 — расчёт и претензия',
  description:
    'Бесплатный расчёт неустойки (пени) по договору за каждый день просрочки с учётом частичных оплат и ключевой ставки ЦБ. Готовая претензия в Word.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <header style={{ borderBottom: '1px solid var(--rule)', padding: '14px 0' }}>
          <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <strong style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>Неустойка.рф</strong>
            <span className="muted">Расчёт по ст. 330 ГК РФ</span>
          </div>
        </header>
        <main>{children}</main>
        <footer style={{ borderTop: '1px solid var(--rule)', marginTop: 64, padding: '24px 0' }}>
          <div className="wrap muted">
            Расчёт носит справочный характер. Проверьте условия вашего договора перед подачей документов.
          </div>
        </footer>
      </body>
    </html>
  );
}
