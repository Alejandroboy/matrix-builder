// POST /api/cron/purge — политика хранения ПДн.
//
// Через RETENTION_DAYS после создания заказа имя и дата рождения больше не нужны:
// ссылка на скачивание живёт DOWNLOAD_DAYS. Обнуляем input, оставляя сам заказ —
// факт оплаты нужен для бухгалтерии, персональные данные для этого не нужны.
//
// Вызывать раз в сутки планировщиком хостинга:
//   curl -X POST https://<домен>/api/cron/purge -H "x-cron-key: $CRON_SECRET"
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RETENTION_DAYS } from '@/lib/legal';

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-cron-key');
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const threshold = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.updateMany({
    where: { createdAt: { lt: threshold }, purgedAt: null },
    data: { input: undefined, purgedAt: new Date() },
  });

  // Лиды: обнуляем вход, но email оставляем — он живёт до отзыва согласия,
  // потому что именно на него мы обещали написать о готовности разбора.
  const leads = await prisma.lead.updateMany({
    where: { createdAt: { lt: threshold }, purgedAt: null },
    data: { input: undefined, purgedAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    purgedOrders: orders.count,
    purgedLeads: leads.count,
    olderThan: threshold.toISOString(),
  });
}
