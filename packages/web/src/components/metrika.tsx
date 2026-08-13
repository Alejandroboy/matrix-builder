'use client';

// Яндекс.Метрика.
//
// Две тонкости App Router, из-за которых нельзя просто вставить код счётчика:
//  1. Переходы между страницами идут без перезагрузки документа — счётчик их
//     не замечает, просмотр нужно отправлять вручную на смену маршрута.
//  2. usePathname отдаёт только путь и теряет строку запроса, а вместе с ней
//     UTM-метки. Поэтому берём и searchParams — иначе источники трафика
//     в отчётах схлопнутся в «переходы по прямым ссылкам».
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void;
  }
}

const ID = Number(process.env.NEXT_PUBLIC_METRIKA_ID ?? 0);

export default function Metrika() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!ID || !window.ym) return;
    const qs = searchParams.toString();
    window.ym(ID, 'hit', pathname + (qs ? `?${qs}` : ''));
  }, [pathname, searchParams]);

  if (!ID) return null; // в деве и без ключа счётчик не подключается

  return (
    <Script id="ym" strategy="afterInteractive">
      {`
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
        ym(${ID}, "init", {
          defer: true,
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true,
          webvisor: true
        });
      `}
    </Script>
  );
}

/**
 * Отправка цели. Вызывается из компонентов в моменты, которые нас интересуют:
 * нажали «купить», ушли на оплату, скачали документ.
 */
export function reachGoal(name: string, params?: Record<string, unknown>): void {
  if (!ID || typeof window === 'undefined' || !window.ym) return;
  window.ym(ID, 'reachGoal', name, params);
}
