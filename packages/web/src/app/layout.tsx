import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  // Базовый адрес: из него Next строит канонические и og-ссылки
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  title: 'Матрица судьбы — рассчитать онлайн бесплатно с расшифровкой',
  description:
    'Бесплатный расчёт матрицы судьбы по дате рождения: арканы характера, отношений и финансов — мгновенно, без регистрации. Совместимость пары по двум датам.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <header className="site-header">
          <div
            className="wrap"
            style={{ display: 'flex', alignItems: 'center', gap: 16, height: 64 }}
          >
            <Link
              href="/"
              style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink)', textDecoration: 'none' }}
            >
              <span className="logo-mark">МС</span>
              <strong style={{ fontFamily: 'var(--serif)', fontSize: 19 }}>Матрица судьбы</strong>
            </Link>

            <nav style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>
              <Link className="nav-pill" href="/matrica">Моя матрица</Link>
              <Link className="nav-pill" href="/sovmestimost">Совместимость</Link>
              <Link className="nav-pill" href="/arkan">Арканы</Link>
              <Link href="/matrica" style={{ marginLeft: 8 }}>
                <button>Рассчитать бесплатно</button>
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer style={{ borderTop: '1px solid var(--rule)', marginTop: 64, padding: '28px 0' }}>
          <div className="wrap muted">
            Матрица судьбы — арифметический расчёт по дате рождения и интерпретация для
            саморефлексии. Не гадание, не предсказание будущего и не замена консультации
            специалиста.
          </div>
          <div className="wrap" style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/legal/offer" className="muted">Оферта</Link>
            <Link href="/legal/privacy" className="muted">Обработка персональных данных</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
