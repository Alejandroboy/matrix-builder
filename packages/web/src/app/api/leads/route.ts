// POST /api/leads — переходный период: контента на арканы пары ещё нет,
// собираем email вместо продажи. Уведомление — крон после пополнения контента.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateOrderInput } from '@/lib/validation';
import type { OrderInput } from '@/lib/order';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: Partial<OrderInput & { email: string; missingArcana: number[] }>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный JSON' }, { status: 400 });
  }
  if (!body.email || !EMAIL_RE.test(body.email)) {
    return NextResponse.json({ error: 'Некорректный email' }, { status: 422 });
  }
  const check = validateOrderInput(body);
  if (!check.ok) {
    return NextResponse.json({ error: 'Ошибки во вводе', issues: check.issues }, { status: 422 });
  }
  const lead = await prisma.lead.create({
    data: {
      email: body.email,
      productType: body.productType!,
      input: body as object,
      missingArcana: (body.missingArcana ?? []).filter(
        (n) => Number.isInteger(n) && n >= 1 && n <= 22,
      ),
    },
  });
  return NextResponse.json({ ok: true, leadId: lead.id });
}
