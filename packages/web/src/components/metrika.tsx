'use client';

// Яндекс.Метрика.
//
// Две тонкости App Router, из-за которых нельзя просто вставить код счётчика:
//  1. Переходы между страницами идут без перезагрузки документа — счётчик их
//     не замечает, просмотр нужно отправлять вручную на смену маршрута.
//  2. usePathname отдаёт только путь и теряет строку запроса, а с ней UTM-метки.
//     Поэтому берём и searchParams — иначе платный трафик в отчётах схлопнется
//     в «прямые заходы».
//
// Ждать загрузки tag.js не нужно и вредно: сниппет синхронно создаёт функцию
// window.ym, которая складывает вызовы в очередь ym.a. Всё, что отправлено до
// загрузки скрипта, уйдёт само, когда он подтянется. Поэтому здесь нет ни
// опроса готовности, ни собственных событий — они только добавляли бы точки
// отказа.
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
    if (!ID || typeof window.ym !== 'function') return;
    const qs = searchParams.toString();
    window.ym(ID, 'hit', pathname + (qs ? `?${qs}` : ''));
  }, [pathname, searchParams]);

  if (!ID) return null; // без номера счётчика ничего не подключаем

  return (
    <Script id="metrika" strategy="afterInteractive">
      {`
        (function(m,e,t,r,i,k,a){
          m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          // Защита от повторной вставки: при навигации компонент может
          // смонтироваться заново, и tag.js подключился бы дважды.
          for (var j = 0; j < document.scripts.length; j++) {
            if (document.scripts[j].src === r) { return; }
          }
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],
          k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
        })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

        ym(${ID}, "init", {
          ssr: true,
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
 * Отправка цели. Вызывается в моменты воронки: нажали купить, ушли на оплату,
 * оплата подтверждена, скачали документ.
 *
 * Если tag.js ещё не загрузился — вызов попадёт в очередь ym.a и уйдёт позже,
 * так что дожидаться чего-либо не требуется.
 */
export function reachGoal(name: string, params?: Record<string, unknown>): void {
  if (!ID || typeof window === 'undefined') return;
  try {
    window.ym?.(ID, 'reachGoal', name, params);
  } catch (e) {
    console.error(`Метрика: не удалось отправить цель ${name}`, e);
  }
}