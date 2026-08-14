import type { Metadata } from 'next';
import Link from 'next/link';
import LogoMark from '@/components/logo-mark';
import { Suspense } from 'react';
import Metrika from '@/components/metrika';
import './globals.css';
import { SITE_URL, YANDEX_VERIFICATION } from '@/lib/site';
import { LEGAL, sellerLine } from '@/lib/legal';

export const metadata: Metadata = {
  // Базовый адрес: из него Next строит канонические и og-ссылки
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  // Подтверждение прав в Вебмастере. Пустое значение — тег не выводится.
  ...(YANDEX_VERIFICATION ? { verification: { yandex: YANDEX_VERIFICATION } } : {}),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Матрица судьбы',
    images: [{ url: '/og.jpg', width: 1200, height: 630 }],
  },
  title: 'Матрица судьбы — рассчитать онлайн бесплатно с расшифровкой',
  description:
    'Бесплатный расчёт матрицы судьбы по дате рождения: арканы характера, отношений и финансов — мгновенно, без регистрации. Совместимость пары по двум датам.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Suspense fallback={null}>
          <Metrika />
        </Suspense>
        <header className="site-header">
          {/* Раскладка шапки живёт в globals.css (.site-header .wrap, .brand,
              .site-nav): инлайновые стили не перебиваются медиазапросами,
              а на узком экране словесный логотип и кнопка должны уходить. */}
          <div className="wrap">
            <Link href="/" className="brand">
              <LogoMark size={30} />
              <strong>Матрица судьбы</strong>
            </Link>

            <nav className="site-nav">
              <Link className="nav-pill" href="/matrica">Моя матрица</Link>
              <Link className="nav-pill" href="/sovmestimost">Совместимость</Link>
              <Link className="nav-pill" href="/arkan">Арканы</Link>
              <Link href="/matrica" className="nav-cta" style={{ marginLeft: 8 }}>
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
