// GET /api/orders/:id/status — страница возврата с оплаты поллит этот эндпоинт.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { issueDownloadToken } from '@/lib/download-token';
import { getPayment } from '@/lib/yookassa';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, yookassaPaymentId: true },
  });
  if (!order) return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });

  let status = order.status;

  /**
   * Вебхук — оптимизация, а не единственный источник правды.
   * Он может не дойти: локальная разработка без туннеля, сетевой сбой,
   * задержка ретраев ЮKassa. Пользователь при этом уже заплатил и смотрит
   * на «проверяем оплату». Поэтому, пока заказ не оплачен, спрашиваем статус
   * платежа у API сами — тем же условным UPDATE, что и вебхук, так что
   * повторные вызовы и гонка с вебхуком безопасны.
   */
  if (status === 'created' && order.yookassaPaymentId) {
    try {
      const payment = await getPayment(order.yookassaPaymentId);
      if (payment.status === 'succeeded' && payment.paid) {
        await prisma.order.updateMany({
          where: { id, status: 'created' },
          data: { status: 'paid', paidAt: new Date() },
        });
        status = 'paid';
      } else if (payment.status === 'canceled') {
        await prisma.order.updateMany({
          where: { id, status: 'created' },
          data: { status: 'canceled' },
        });
        status = 'canceled';
      }
    } catch {
      // ЮKassa недоступна — оставляем created, клиент опросит ещё раз
    }
  }

  // Токен выдаём ТОЛЬКО для оплаченного заказа: сам факт наличия токена
  // на клиенте уже означает право на скачивание.
  const downloadUrl =
    status === 'paid'
      ? `/api/orders/${id}/download?t=${issueDownloadToken(id, process.env.DOWNLOAD_SECRET!)}`
      : null;

  return NextResponse.json({ status, downloadUrl }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}