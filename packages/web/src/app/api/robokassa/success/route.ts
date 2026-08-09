// SuccessURL — возврат покупателя после оплаты (пароль #1).
//
// Зачем дублировать ResultURL: у Robokassa нет удобного опроса статуса, и если
// серверное уведомление задержалось, покупатель уже вернулся на сайт и ждёт
// документ. Подпись здесь настоящая, поэтому мы имеем право пометить заказ
// оплаченным и отсюда — это наша замена самолечащему полингу YooKassa.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuccessSignature, formatSum } from '@/lib/robokassa';
import { sendReportEmail } from '@/lib/mail';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const invId = Number(params.get('InvId'));

  if (!verifySuccessSignature(params) || !Number.isInteger(invId)) {
    return NextResponse.redirect(new URL('/?payment=error', req.url));
  }

  const order = await prisma.order.findUnique({ where: { invId } });
  if (!order) return NextResponse.redirect(new URL('/?payment=error', req.url));

  if (params.get('OutSum') === formatSum(order.amount)) {
    await prisma.order.updateMany({
      where: { id: order.id, status: 'created' },
      data: { status: 'paid', paidAt: new Date() },
    });
    await sendReportEmail(order.id);
  }

  return NextResponse.redirect(new URL(`/order/${order.id}`, req.url));
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const params = new URLSearchParams();
  form.forEach((v, k) => params.set(k, String(v)));
  const url = new URL(req.url);
  url.search = params.toString();
  return GET(new NextRequest(url, { headers: req.headers }));
}
