import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { SITE_URL } from '@/lib/site';
import { LEGAL, sellerLine } from '@/lib/legal';

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

    <footer style={{ borderTop: '1px solid var(--rule)', marginTop: 64, padding: '32px 0 40px' }}>
      <div className="wrap stack" style={{ gap: 16 }}>
        <div className="muted">
          Матрица судьбы — арифметический расчёт по дате рождения и интерпретация для
          саморефлексии. Не гадание, не предсказание будущего и не замена консультации
          специалиста.
        </div>

        {/* Контакты и реквизиты продавца. Требование платёжного провайдера
                и закона о защите прав потребителей: покупатель должен видеть,
                с кем имеет дело и куда писать. */}
        <div className="muted" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {LEGAL.email && <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>}
          {LEGAL.phone && <a href={`tel:${LEGAL.phoneHref || LEGAL.phone}`}>{LEGAL.phone}</a>}
        </div>

        <div className="muted" style={{ fontSize: 13 }}>
          {sellerLine()}
          {LEGAL.address ? `. Адрес для корреспонденции: ${LEGAL.address}` : ''}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/legal/offer" className="muted">Публичная оферта</Link>
          <Link href="/legal/privacy" className="muted">Обработка персональных данных</Link>
        </div>
      </div>
    </footer>
    </body>
    </html>
  );
}