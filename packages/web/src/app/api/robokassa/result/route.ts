// ResultURL — серверное уведомление Robokassa об оплате (пароль #2).
// Главный, доверенный путь подтверждения. В ответ обязателен текст OK{InvId},
// иначе Robokassa считает уведомление недоставленным и повторяет попытки —
// это и есть наша страховка от разовых сбоев.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyResultSignature, formatSum } from '@/lib/robokassa';
import { sendReportEmail } from '@/lib/mail';

async function handle(params: URLSearchParams): Promise<NextResponse> {
  if (!verifyResultSignature(params)) {
    // Отвечаем нейтрально: подпись не сошлась — заказ не трогаем.
    return new NextResponse('bad sign', { status: 400 });
  }

  const invId = Number(params.get('InvId'));
  if (!Number.isInteger(invId)) return new NextResponse('bad invId', { status: 400 });

  const order = await prisma.order.findUnique({ where: { invId } });
  if (!order) return new NextResponse('unknown order', { status: 404 });

  // Сверяем сумму: подпись подтверждает отправителя, но не то, что заплатили
  // столько, сколько мы просили.
  if (params.get('OutSum') !== formatSum(order.amount)) {
    return new NextResponse('amount mismatch', { status: 400 });
  }

  // Условный UPDATE: параллельный повтор уведомления не даст второго перехода.
  await prisma.order.updateMany({
    where: { id: order.id, status: 'created' },
    data: {
      status: 'paid',
      paidAt: new Date(),
      providerPaymentId: params.get('PaymentMethod') ?? null,
    },
  });

  await sendReportEmail(order.id);

  // Ровно этот формат ответа ждёт Robokassa.
  return new NextResponse(`OK${invId}`, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const params = new URLSearchParams();
  form.forEach((v, k) => params.set(k, String(v)));
  return handle(params);
}

// Robokassa может быть настроена на GET — поддерживаем оба метода.
export async function GET(req: NextRequest) {
  return handle(req.nextUrl.searchParams);
}
