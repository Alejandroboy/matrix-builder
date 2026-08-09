// GET /api/orders/:id/status — страница возврата с оплаты опрашивает этот роут.
//
// Опроса платёжного провайдера здесь нет: у Robokassa нет удобного API статуса.
// Об оплате сообщают два подписанных возврата — ResultURL (сервер-сервер) и
// SuccessURL (возврат покупателя), оба помечают заказ оплаченным. Здесь мы
// только читаем состояние и выдаём ссылку на скачивание.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { issueDownloadToken } from '@/lib/download-token';
import { sendReportEmail } from '@/lib/mail';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, productType: true },
  });
  if (!order) return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });

  // Подстраховка: если письмо не ушло в момент подтверждения оплаты
  // (например, SMTP был недоступен), пробуем ещё раз. Функция идемпотентна.
  if (order.status === 'paid') await sendReportEmail(id);

  // Токен выдаём ТОЛЬКО для оплаченного заказа: сам факт наличия токена
  // на клиенте уже означает право на скачивание.
  const downloadUrl =
    order.status === 'paid'
      ? `/api/orders/${id}/download?t=${issueDownloadToken(id, process.env.DOWNLOAD_SECRET!)}`
      : null;

  return NextResponse.json(
    { status: order.status, downloadUrl, productType: order.productType },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}