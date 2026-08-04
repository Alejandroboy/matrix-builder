'use client';

import { useEffect, useState } from 'react';

type Status = 'created' | 'paid' | 'canceled';

/**
 * Страница возврата с оплаты. Вебхук от ЮKassa может прийти на секунду-две
 * позже редиректа пользователя, поэтому здесь поллинг с затухающими
 * попытками, а не единичная проверка.
 */
export default function OrderStatus({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        setStatus(data.status);
        setDownloadUrl(data.downloadUrl);
        if (data.status === 'paid' || data.status === 'canceled') return;
      } catch {
        /* сеть моргнула — просто пробуем ещё раз */
      }
      attempt++;
      if (attempt > 20) { setGaveUp(true); return; }
      timer = setTimeout(poll, Math.min(1000 * attempt, 5000));
    };

    poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [orderId]);

  if (status === 'paid' && downloadUrl) {
    return (
      <div className="card stack">
        <span className="stamp">Оплачено</span>
        <h1>Претензия готова</h1>
        <p>Файл в формате Word. Ссылка действует 7 дней — сохраните документ себе.</p>
        <div><a href={downloadUrl}><button>Скачать претензию (.docx)</button></a></div>
      </div>
    );
  }

  if (status === 'canceled') {
    return (
      <div className="card stack">
        <h1>Платёж отменён</h1>
        <p>Деньги не списаны. Вернитесь к расчёту и попробуйте оформить документ ещё раз.</p>
        <div><a href="/"><button className="ghost">К расчёту</button></a></div>
      </div>
    );
  }

  if (gaveUp) {
    return (
      <div className="card stack">
        <h1>Платёж ещё обрабатывается</h1>
        <p>
          Банк подтверждает оплату дольше обычного. Обновите страницу через минуту —
          заказ {orderId} никуда не денется.
        </p>
      </div>
    );
  }

  return (
    <div className="card stack">
      <h1>Проверяем оплату</h1>
      <p className="muted">Это занимает несколько секунд.</p>
    </div>
  );
}
