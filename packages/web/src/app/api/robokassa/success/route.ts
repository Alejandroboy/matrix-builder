// SuccessURL — возврат покупателя после оплаты (пароль #1).
//
// Зачем дублировать ResultURL: у Robokassa нет удобного опроса статуса, и если
// серверное уведомление задержалось, покупатель уже вернулся на сайт и ждёт
// документ. Подпись здесь настоящая, поэтому мы имеем право пометить заказ
// оплаченным и отсюда — это наша замена самолечащему полингу YooKassa.
//
// Редиректы строим от APP_URL, а НЕ от req.url: за nginx-прокси Next видит
// внутренний адрес (http://localhost:3000), на котором реально слушает
// процесс, и заголовки Host/X-Forwarded-* на это не всегда влияют. С req.url
// в основании покупателя после честной оплаты уносило на localhost вместо
// боевого домена — баг, пойманный на первом же тестовом платеже.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuccessSignature, formatSum } from '@/lib/robokassa';
import { sendReportEmail } from '@/lib/mail';
import { SITE_URL } from '@/lib/site';

function redirectTo(path: string): NextResponse {
  return NextResponse.redirect(new URL(path, SITE_URL));
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const invId = Number(params.get('InvId'));

  if (!verifySuccessSignature(params) || !Number.isInteger(invId)) {
    return redirectTo('/?payment=error');
  }

  const order = await prisma.order.findUnique({ where: { invId } });
  if (!order) return redirectTo('/?payment=error');

  if (params.get('OutSum') === formatSum(order.amount)) {
    await prisma.order.updateMany({
      where: { id: order.id, status: 'created' },
      data: { status: 'paid', paidAt: new Date() },
    });
    await sendReportEmail(order.id);
  }

  return redirectTo(`/order/${order.id}`);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const params = new URLSearchParams();
  form.forEach((v, k) => params.set(k, String(v)));
  const url = new URL(req.url);
  url.search = params.toString();
  return GET(new NextRequest(url, { headers: req.headers }));
}