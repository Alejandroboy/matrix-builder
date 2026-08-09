// Локальная заглушка платёжной страницы. Работает только при PAYMENTS_MODE=mock.
//
// Зачем: тестовый режим Robokassa требует паролей из личного кабинета, который
// открывают после проверки публичного сайта. До деплоя это единственный способ
// прогнать полный путь оплаты — и он проверяет наш код целиком, включая
// сверку подписи на ResultURL.
import { NextRequest, NextResponse } from 'next/server';
import { isMock, signResult } from '@/lib/robokassa';

export async function GET(req: NextRequest) {
  if (!isMock()) return new NextResponse('Not found', { status: 404 });

  const p = req.nextUrl.searchParams;
  const invId = p.get('InvId') ?? '';
  const outSum = p.get('OutSum') ?? '';
  const shpOrder = p.get('Shp_order') ?? '';
  const description = p.get('Description') ?? 'Заказ';

  const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>Тестовая оплата</title>
<style>
 body{font-family:system-ui,sans-serif;background:#FBFAF7;color:#1E1B16;
      display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
 .card{background:#fff;border:1px solid #E4DFD4;border-radius:8px;padding:32px;max-width:420px}
 h1{font-size:20px;margin:0 0 8px} p{color:#6E6A62;line-height:1.5}
 .sum{font-size:28px;font-weight:700;margin:16px 0}
 button{font:inherit;padding:12px 20px;border-radius:4px;border:1px solid #14213D;cursor:pointer}
 .pay{background:#14213D;color:#FBFAF7} .fail{background:#fff;color:#1E1B16;margin-left:8px}
 .note{font-size:13px;color:#A03521;margin-top:20px}
</style></head><body>
<div class="card">
  <h1>Тестовая оплата</h1>
  <p>${escapeHtml(description)}</p>
  <div class="sum">${escapeHtml(outSum)} ₽</div>
  <form method="POST">
    <input type="hidden" name="InvId" value="${escapeHtml(invId)}">
    <input type="hidden" name="OutSum" value="${escapeHtml(outSum)}">
    <input type="hidden" name="Shp_order" value="${escapeHtml(shpOrder)}">
    <button class="pay" name="action" value="pay" type="submit">Оплатить</button>
    <button class="fail" name="action" value="fail" type="submit">Отказаться</button>
  </form>
  <p class="note">Это заглушка для разработки. Деньги не списываются,
  Robokassa не участвует.</p>
</div></body></html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function POST(req: NextRequest) {
  if (!isMock()) return new NextResponse('Not found', { status: 404 });

  const form = await req.formData();
  const invId = String(form.get('InvId') ?? '');
  const outSum = String(form.get('OutSum') ?? '');
  const shpOrder = String(form.get('Shp_order') ?? '');

  if (form.get('action') !== 'pay') {
    return NextResponse.redirect(new URL(`/order/${shpOrder}`, req.url));
  }

  // Зовём настоящий ResultURL так же, как это сделала бы Robokassa:
  // с формой и подписью. Ошибку подписи здесь увидеть так же легко, как в бою.
  const body = new URLSearchParams({
    InvId: invId,
    OutSum: outSum,
    Shp_order: shpOrder,
    SignatureValue: signResult(outSum, invId, shpOrder),
  });

  const res = await fetch(new URL('/api/robokassa/result', req.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await res.text();
  if (!text.startsWith('OK')) {
    return new NextResponse(`ResultURL ответил: ${text}`, { status: 500 });
  }

  return NextResponse.redirect(new URL(`/order/${shpOrder}`, req.url));
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}