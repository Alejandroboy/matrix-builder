// POST /api/orders
// Поток тот же, что в Неустойке: валидация → покрытие контентом →
// заказ в базе → платёж в ЮKassa → confirmation_url клиенту.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPayment } from '@/lib/yookassa';
import { computeCompatibility, computePersonalMatrix, Arcana } from '@matrix/engine';
import { assertPairCoverage } from '@matrix/docgen';
import { getContent } from '@/lib/content';
import { validateOrderInput } from '@/lib/validation';
import { PRICE_KOPECKS, type OrderInput } from '@/lib/order';

export async function POST(req: NextRequest) {
  let body: Partial<OrderInput> & { consent?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный JSON' }, { status: 400 });
  }

  // Согласие фиксируем ДО записи персональных данных: без него заказа нет.
  if (body.consent !== true) {
    return NextResponse.json(
      { error: 'Нужно согласие на обработку персональных данных' },
      { status: 422 },
    );
  }

  const check = validateOrderInput(body);
  if (!check.ok) {
    return NextResponse.json({ error: 'Ошибки во вводе', issues: check.issues }, { status: 422 });
  }
  const input = body as OrderInput;

  // Покрытие контентом: продаём только то, что можем сгенерировать.
  // Непокрытые арканы -> 409 со списком, фронт показывает лид-форму.
  const needed: Arcana[] =
    input.productType === 'compatibility'
      ? neededForCompatibility(input.birthDateA, input.birthDateB!)
      : neededForPersonal(input.birthDateA);
  try {
    assertPairCoverage(getContent().content, needed);
  } catch {
    const covered = getContent().content;
    const missing = [...new Set(needed)].filter((a) => !covered.has(a));
    return NextResponse.json(
      { error: 'content_not_ready', missingArcana: missing },
      { status: 409 },
    );
  }

  const amount = PRICE_KOPECKS[input.productType];
  const order = await prisma.order.create({
    data: {
      productType: input.productType,
      input: input as object,
      amount,
      email: input.email,
      consentAt: new Date(),
    },
  });

  const payment = await createPayment({
    orderId: order.id,
    amountKopecks: amount,
    description:
      input.productType === 'compatibility'
        ? `Разбор совместимости, заказ ${order.id}`
        : `Личный разбор матрицы, заказ ${order.id}`,
    returnUrl: `${process.env.APP_URL}/order/${order.id}`,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { yookassaPaymentId: payment.id },
  });

  return NextResponse.json({
    orderId: order.id,
    confirmationUrl: payment.confirmation?.confirmation_url,
  });
}

function neededForPersonal(birthA: string): Arcana[] {
  const m = computePersonalMatrix(birthA);
  return [m.positions.center, m.positions.heart, m.positions.money];
}

function neededForCompatibility(birthA: string, birthB: string): Arcana[] {
  const cm = computeCompatibility(birthA, birthB);
  // Ровно те арканы, к которым обратится compileCompatibilityReport
  return [
    cm.a.positions.heart,
    cm.b.positions.heart,
    cm.joint.coupleCharacter,
    cm.joint.coupleHeart,
  ];
}
