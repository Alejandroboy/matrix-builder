'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void;
  }
}

const ID = Number(process.env.NEXT_PUBLIC_METRIKA_ID ?? 0);

export default function Metrika() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMetrikaReady, setIsMetrikaReady] = useState(false);

  // Отслеживаем готовность Метрики
  useEffect(() => {
    const checkMetrika = () => {
      if (window.ym) {
        setIsMetrikaReady(true);
        return true;
      }
      return false;
    };

    // Проверяем сразу
    if (checkMetrika()) return;

    // Если не готова, ждем событие загрузки
    const handleLoad = () => {
      if (checkMetrika()) {
        document.removeEventListener('load', handleLoad);
      }
    };

    document.addEventListener('load', handleLoad);

    // Проверяем с интервалом (запасной вариант)
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (checkMetrika()) {
        clearInterval(interval);
        document.removeEventListener('load', handleLoad);
      } else if (attempts > 20) {
        // Даём 20 попыток (~2 секунды)
        clearInterval(interval);
        document.removeEventListener('load', handleLoad);
        console.warn('Metrika: Не удалось загрузить скрипт');
      }
    }, 100);

    return () => {
      clearInterval(interval);
      document.removeEventListener('load', handleLoad);
    };
  }, []);

  // Отправляем хит при смене страницы
  useEffect(() => {
    if (!ID || !isMetrikaReady || !window.ym) return;

    const qs = searchParams.toString();
    const url = pathname + (qs ? `?${qs}` : '');

    try {
      window.ym(ID, 'hit', url);
    } catch (error) {
      console.error('Metrika: Ошибка отправки хита', error);
    }
  }, [pathname, searchParams, isMetrikaReady]);

  if (!ID) return null;

  return (
    <>
      <Script
        id="metrika-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              k=e.createElement(t),a=e.getElementsByTagName(t)[0];
              k.async=1,k.src=r,a.parentNode.insertBefore(k,a);
              window.__metrikaReady = true;
            })
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
            
            ym(${ID}, "init", {
              defer: true,
              clickmap: true,
              trackLinks: true,
              accurateTrackBounce: true,
              webvisor: true
            });
          `
        }}
      />
      {/* Дополнительный Script для установки флага готовности */}
      <Script
        id="metrika-ready"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof ym !== 'undefined' && window.ym) {
              window.__metrikaReady = true;
              window.dispatchEvent(new Event('metrika-ready'));
            }
          `
        }}
      />
    </>
  );
}

/**
 * Отправка цели с гарантией готовности Метрики
 */
export function reachGoal(name: string, params?: Record<string, unknown>): void {
  if (!ID || typeof window === 'undefined') return;

  const sendGoal = () => {
    if (window.ym) {
      try {
        window.ym(ID, 'reachGoal', name, params);
        return true;
      } catch (error) {
        console.error('Metrika: Ошибка отправки цели', error);
        return false;
      }
    }
    return false;
  };

  // Пытаемся отправить сразу
  if (sendGoal()) return;

  // Если не получилось, ждём событие готовности
  const handleReady = () => {
    if (sendGoal()) {
      document.removeEventListener('metrika-ready', handleReady);
    }
  };

  document.addEventListener('metrika-ready', handleReady);

  // Таймаут на случай, если Метрика так и не загрузится
  setTimeout(() => {
    document.removeEventListener('metrika-ready', handleReady);
    if (!window.ym) {
      console.warn('Metrika: Не удалось отправить цель "${name}" - скрипт не загружен');
    }
  }, 5000);
}