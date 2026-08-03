// apps/web/src/lib/yookassa.ts
// Минимальный клиент ЮKassa. Без SDK: два вызова не оправдывают зависимость.

const API = 'https://api.yookassa.ru/v3';

function authHeader(): string {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secret) throw new Error('YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY не заданы');
  return 'Basic ' + Buffer.from(`${shopId}:${secret}`).toString('base64');
}

export interface YkPayment {
  id: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  paid: boolean;
  amount: { value: string; currency: string };
  metadata?: Record<string, string>;
  confirmation?: { confirmation_url?: string };
}

/**
 * Создание платежа.
 * Idempotence-Key = orderId: сколько бы раз пользователь ни кликнул «Оплатить»
 * по одному заказу, ЮKassa вернёт ТОТ ЖЕ платёж, а не создаст новый.
 * capture: true — автосписание без двухфазности; для цифрового товара это норма.
 */
export async function createPayment(params: {
  orderId: string;
  amountKopecks: number;
  description: string;
  returnUrl: string;
}): Promise<YkPayment> {
  const res = await fetch(`${API}/payments`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      'Idempotence-Key': params.orderId,
    },
    body: JSON.stringify({
      amount: {
        value: (params.amountKopecks / 100).toFixed(2),
        currency: 'RUB',
      },
      capture: true,
      confirmation: { type: 'redirect', return_url: params.returnUrl },
      description: params.description,
      metadata: { orderId: params.orderId },
    }),
  });
  if (!res.ok) {
    throw new Error(`YooKassa create failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/**
 * ЕДИНСТВЕННЫЙ доверенный источник статуса платежа.
 * Вебхук говорит «посмотри на платёж X» — смотрим сюда, не в тело вебхука.
 */
export async function getPayment(paymentId: string): Promise<YkPayment> {
  const res = await fetch(`${API}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) {
    throw new Error(`YooKassa get failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
