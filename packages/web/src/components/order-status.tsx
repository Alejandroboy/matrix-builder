'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { computePersonalMatrix, computeCompatibility } from '@matrix/engine';
import MatrixChart from './matrix-chart';

type Status = 'created' | 'paid' | 'canceled';
type ProductType = 'personal' | 'compatibility';

interface ChartData {
  birthDateA: string;
  nameA: string;
  birthDateB: string | null;
  nameB: string | null;
}

/**
 * Страница возврата с оплаты. Подтверждение от Robokassa может прийти на
 * секунду-две позже, чем покупатель вернулся на сайт, поэтому здесь поллинг
 * с затухающими попытками, а не единичная проверка.
 *
 * Схема рисуется на всех состояниях, включая ожидание: человеку есть на что
 * смотреть, пока идёт проверка, и он сразу видит, что купил именно свой расчёт.
 * Данные для неё приходят из статус-роута, сам расчёт — на клиенте.
 */
export default function OrderStatus({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);
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
        setProductType(data.productType ?? null);
        setChart(data.chart ?? null);
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

  const isPair = productType === 'compatibility';

  // Расчёт мгновенный и на клиенте — тот же движок, что и в калькуляторе.
  const matrices = useMemo(() => {
    if (!chart) return null;
    try {
      if (isPair && chart.birthDateB) {
        const cm = computeCompatibility(chart.birthDateA, chart.birthDateB);
        return [
          { m: cm.a, name: chart.nameA },
          { m: cm.b, name: chart.nameB ?? '' },
        ];
      }
      return [{ m: computePersonalMatrix(chart.birthDateA), name: chart.nameA }];
    } catch {
      return null;
    }
  }, [chart, isPair]);

  const Charts = () =>
    matrices ? (
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns:
            matrices.length > 1 ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
        }}
      >
        {matrices.map((x, i) => (
          <div key={i}>
            {matrices.length > 1 && x.name && <h3>{x.name}</h3>}
            <MatrixChart matrix={x.m} title={x.name || undefined} maxWidth={440} />
          </div>
        ))}
      </div>
    ) : null;

  if (status === 'paid' && downloadUrl) {
    return (
      <div className="stack" style={{ gap: 24 }}>
        <div className="card stack">
          <span className="stamp">Оплачено</span>
          <h1>{isPair ? 'Разбор совместимости готов' : 'Разбор вашей матрицы готов'}</h1>
          <p>
            Файл в формате PDF. Ссылка действует 7 дней — сохраните документ себе или
            распечатайте. Копию мы отправили на вашу почту.
          </p>
          <div>
            <a href={downloadUrl}>
              <button>Скачать разбор (.pdf)</button>
            </a>
          </div>
        </div>

        {matrices && (
          <div className="card stack">
            <h2>{isPair ? 'Матрицы вашей пары' : 'Ваша матрица'}</h2>
            <Charts />
            <p className="muted">
              Эта же схема — на первой странице документа. Значения каждого аркана
              разобраны в{' '}
              <Link href="/arkan">карточках 22 арканов</Link>.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (status === 'canceled') {
    return (
      <div className="card stack">
        <h1>Платёж отменён</h1>
        <p>Деньги не списаны. Вернитесь к расчёту и оформите разбор ещё раз.</p>
        <div><a href="/"><button className="ghost">К расчёту</button></a></div>
      </div>
    );
  }

  if (gaveUp) {
    return (
      <div className="stack" style={{ gap: 24 }}>
        <div className="card stack">
          <h1>Платёж ещё обрабатывается</h1>
          <p>
            Банк подтверждает оплату дольше обычного. Обновите страницу через минуту —
            заказ {orderId} никуда не денется, а документ придёт на почту, как только
            оплата подтвердится.
          </p>
        </div>
        {matrices && <div className="card"><Charts /></div>}
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="card stack">
        <h1>Проверяем оплату</h1>
        <p className="muted">Это занимает несколько секунд.</p>
      </div>
      {matrices && (
        <div className="card stack">
          <h2>{isPair ? 'Матрицы вашей пары' : 'Ваша матрица'}</h2>
          <Charts />
        </div>
      )}
    </div>
  );
}