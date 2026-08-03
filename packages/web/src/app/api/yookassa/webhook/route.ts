import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPayment } from '@/lib/yookassa';

/**
 * POST /api/yookassa/webhook
 *
 * Модель доверия ЮKassa: уведомление НЕ подписано. Тело — только сигнал
 * «проверь платёж N». Истину читаем из их API через Basic auth.
 * Поэтому поддельный POST на этот URL бесполезен: без succeeded в API
 * заказ не пометится оплаченным.
 *
 * Идемпотентность: ЮKassa ретраит до ~24ч, пока не получит 200.
 * Обработчик обязан переживать дубли и отвечать 200 даже на них.
 */
export async function POST(req: NextRequest) {
  let paymentId: string | undefined;
  try {
    const body = await req.json();
    paymentId = body?.object?.id;
  } catch {
    // мусор в теле — не наш случай, но и не повод для ретраев
    return NextResponse.json({ ok: true });
  }
  if (!paymentId) return NextResponse.json({ ok: true });

  // Единственный источник истины — API, не тело вебхука
  let payment;
  try {
    payment = await getPayment(paymentId);
  } catch {
    // ЮKassa недоступна? Отвечаем 500 — пусть ретраят, у них это штатно.
    return NextResponse.json({ error: 'verification failed' }, { status: 500 });
  }

  const orderId = payment.metadata?.orderId;
  if (!orderId) return NextResponse.json({ ok: true }); // не наш платёж

  if (payment.status === 'succeeded' && payment.paid) {
    // Условный UPDATE = идемпотентность на уровне БД:
    // повторный вебхук просто обновит 0 строк.
    await prisma.order.updateMany({
      where: { id: orderId, yookassaPaymentId: paymentId, status: 'created' },
      data: { status: 'paid', paidAt: new Date() },
    });
  } else if (payment.status === 'canceled') {
    await prisma.order.updateMany({
      where: { id: orderId, yookassaPaymentId: paymentId, status: 'created' },
      data: { status: 'canceled' },
    });
  }
  // pending / waiting_for_capture — игнорируем, ждём следующего уведомления

  return NextResponse.json({ ok: true });
}
