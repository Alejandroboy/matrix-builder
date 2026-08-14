'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void;
  }
}

const ID = Number(process.env.NEXT_PUBLIC_METRIKA_ID ?? 0);

function sendHit(pathname: string, qs: string) {
  window.ym?.(ID, 'hit', pathname + (qs ? `?${qs}` : ''));
}

export default function Metrika() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Первый рендер обрабатывает onReady скрипта — тут его пропускаем,
    // чтобы не было гонки: window.ym может быть ещё не готов.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!ID || typeof window.ym !== 'function') return;
    sendHit(pathname, searchParams.toString());
  }, [pathname, searchParams]);

  if (!ID) return null;

  return (
    <Script
      id="metrika"
      strategy="afterInteractive"
      onReady={() => {
        // Скрипт точно инициализирован — шлём хит первой страницы здесь,
        // а не надеемся на порядок эффектов.
        sendHit(pathname, searchParams.toString());
      }}
    >
      {`
        (function(m,e,t,r,i,k,a){
          m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {
            if (document.scripts[j].src === r) { return; }
          }
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],
          k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
        })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

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

export function reachGoal(name: string, params?: Record<string, unknown>): void {
  if (!ID || typeof window === 'undefined') return;
  try {
    window.ym?.(ID, 'reachGoal', name, params);
  } catch (e) {
    console.error(`Метрика: не удалось отправить цель ${name}`, e);
  }
}