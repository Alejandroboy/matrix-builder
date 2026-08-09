// Адаптер Robokassa.
//
// Почему не YooKassa: она не подключает самозанятых (НПД). Robokassa через
// «Робочеки СМЗ» формирует чек за самозанятого в «Мой налог» автоматически.
//
// Три отличия от YooKassa, определившие устройство модуля:
//  1. Подпись — MD5 от строки с двоеточиями, а не Basic-авторизация.
//  2. Номер счёта (InvId) обязан быть числом — у Order для этого есть invId.
//  3. Нет удобного API опроса статуса. Вместо него ДВА подписанных возврата:
//     ResultURL (сервер-сервер, пароль #2) и SuccessURL (возврат пользователя,
//     пароль #1). Оба помечают заказ оплаченным — это наша замена полингу.
import { createHash } from 'crypto';

const PAY_URL = 'https://auth.robokassa.ru/Merchant/Index.aspx';

/**
 * Мок-режим для локальной разработки.
 *
 * Тестовый режим самой Robokassa требует тестовых паролей из личного кабинета,
 * а кабинет открывают только после проверки публично доступного сайта. Пока
 * домена нет, весь путь «заказ → подтверждение → письмо → PDF» прогоняется
 * через локальную заглушку. Она формирует НАСТОЯЩУЮ подпись нашими же
 * паролями и стучится в реальный ResultURL — то есть проверяется и код
 * проверки подписи, а не только счастливый путь.
 */
export function isMock(): boolean {
  // В production мок выключен принудительно, даже если переменная осталась
  // в .env: платёжная заглушка на боевом домене — это дыра в кассе.
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.PAYMENTS_MODE === 'mock';
}

/** Готова ли боевая интеграция. До получения ключей продажи отключены. */
export function isPaymentsConfigured(): boolean {
  return isMock() || Boolean(process.env.ROBOKASSA_LOGIN && process.env.ROBOKASSA_PASSWORD1);
}

function md5(s: string): string {
  return createHash('md5').update(s, 'utf8').digest('hex');
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Не задана переменная окружения ${name}`);
  return v;
}

/** Сумма для Robokassa: рубли с точкой, копейки двумя знаками. */
export function formatSum(kopecks: number): string {
  return (kopecks / 100).toFixed(2);
}

/**
 * Чек для фискализации. Для самозанятого НДС не применяется (tax: 'none'),
 * товар — цифровой (payment_object: 'service', способ расчёта — полная оплата).
 *
 * ⚠️ Состав чека нужно сверить с настройками магазина в личном кабинете
 * Robokassa после подключения «Робочеков СМЗ»: там же выбирается, кто
 * выступает фискальным агентом.
 */
export function buildReceipt(description: string, kopecks: number): string {
  const receipt = {
    items: [
      {
        name: description.slice(0, 128),
        quantity: 1,
        sum: Number(formatSum(kopecks)),
        payment_method: 'full_payment',
        payment_object: 'service',
        tax: 'none',
      },
    ],
  };
  // В подпись и в URL идёт ОДНА И ТА ЖЕ строка — сначала JSON, потом
  // кодирование. Если закодировать по-разному, подпись не сойдётся.
  return JSON.stringify(receipt);
}

export interface PaymentLinkInput {
  invId: number;
  amountKopecks: number;
  description: string;
  email?: string;
  /** Наш внутренний id заказа — вернётся обратно в Shp_order. */
  orderId: string;
}

/**
 * Ссылка на страницу оплаты.
 * Строка подписи: MerchantLogin:OutSum:InvId:Receipt:Пароль#1:Shp_*
 * Shp-параметры добавляются в конец в алфавитном порядке.
 */
export function buildPaymentUrl(input: PaymentLinkInput): string {
  if (isMock()) {
    const p = new URLSearchParams({
      InvId: String(input.invId),
      OutSum: formatSum(input.amountKopecks),
      Shp_order: input.orderId,
      Description: input.description,
    });
    return `/api/robokassa/mock?${p.toString()}`;
  }

  const login = env('ROBOKASSA_LOGIN');
  const password1 = env('ROBOKASSA_PASSWORD1');
  const isTest = process.env.ROBOKASSA_IS_TEST === '1';

  const outSum = formatSum(input.amountKopecks);
  const receipt = buildReceipt(input.description, input.amountKopecks);
  const shp = { Shp_order: input.orderId };

  const signature = md5(
    [login, outSum, String(input.invId), receipt, password1, `Shp_order=${shp.Shp_order}`].join(':'),
  );

  const params = new URLSearchParams({
    MerchantLogin: login,
    OutSum: outSum,
    InvId: String(input.invId),
    Description: input.description,
    Receipt: receipt,
    SignatureValue: signature,
    Culture: 'ru',
    Encoding: 'utf-8',
    Shp_order: shp.Shp_order,
  });
  if (input.email) params.set('Email', input.email);
  if (isTest) params.set('IsTest', '1');

  return `${PAY_URL}?${params.toString()}`;
}

/**
 * Проверка уведомления на ResultURL: MD5(OutSum:InvId:Пароль#2:Shp_*).
 * Сравнение регистронезависимое — Robokassa присылает подпись в верхнем регистре.
 */
export function verifyResultSignature(params: URLSearchParams): boolean {
  const outSum = params.get('OutSum') ?? '';
  const invId = params.get('InvId') ?? '';
  const signature = (params.get('SignatureValue') ?? '').toLowerCase();
  const shpOrder = params.get('Shp_order');

  const parts = [outSum, invId, env('ROBOKASSA_PASSWORD2')];
  if (shpOrder) parts.push(`Shp_order=${shpOrder}`);

  return md5(parts.join(':')) === signature;
}

/** Подпись уведомления — нужна моку, чтобы позвать ResultURL как настоящая Robokassa. */
export function signResult(outSum: string, invId: string, shpOrder: string): string {
  return md5([outSum, invId, env('ROBOKASSA_PASSWORD2'), `Shp_order=${shpOrder}`].join(':'));
}

/** Проверка возврата пользователя на SuccessURL: там пароль #1. */
export function verifySuccessSignature(params: URLSearchParams): boolean {
  const outSum = params.get('OutSum') ?? '';
  const invId = params.get('InvId') ?? '';
  const signature = (params.get('SignatureValue') ?? '').toLowerCase();
  const shpOrder = params.get('Shp_order');

  const parts = [outSum, invId, env('ROBOKASSA_PASSWORD1')];
  if (shpOrder) parts.push(`Shp_order=${shpOrder}`);

  return md5(parts.join(':')) === signature;
}