// Письмо с готовым разбором. Отправляется один раз при переходе заказа в paid —
// кто бы ни обнаружил оплату первым: вебхук ЮKassa или опрос статуса с клиента.
//
// Почему это критично: ссылка на скачивание живёт на странице возврата, и если
// покупатель закрыл вкладку, письмо остаётся единственным способом получить товар.
import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { issueDownloadToken } from './download-token';
import { DOWNLOAD_DAYS, LEGAL, req } from './legal';
import type { ProductType } from './order';

function transport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null; // в деве без SMTP просто не шлём

  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    // 465 — SSL сразу, 25 и 587 — обычное соединение с возможным STARTTLS
    secure: port === 465,
    // Авторизация опциональна: на тарифах VDS СТАРТ у NetAngels исходящие
    // SMTP-порты закрыты, и почта уходит через их релей skvmrelay.netangels.ru
    // на порту 25 БЕЗ логина и пароля. Если передать пустой auth, nodemailer
    // всё равно пошлёт команду AUTH и получит отказ.
    ...(user && pass ? { auth: { user, pass } } : {}),
    // Релей может не предлагать TLS — не считаем это ошибкой
    tls: { rejectUnauthorized: false },
  });
}

function subject(productType: ProductType): string {
  return productType === 'compatibility'
    ? 'Ваш разбор совместимости готов'
    : 'Ваш разбор матрицы судьбы готов';
}

function body(productType: ProductType, url: string): { text: string; html: string } {
  const what =
    productType === 'compatibility'
      ? 'разбор совместимости вашей пары'
      : 'разбор вашей матрицы судьбы';

  const text = [
    'Здравствуйте!',
    '',
    `Оплата прошла, ${what} готов. Скачать PDF:`,
    url,
    '',
    `Ссылка действует ${DOWNLOAD_DAYS} дней — сохраните файл себе.`,
    '',
    'Если ссылка не открылась или в документе что-то не так, ответьте на это письмо,',
    `мы разберёмся: ${req(LEGAL.email)}`,
    '',
    'Расчёт по дате рождения — инструмент саморефлексии, а не предсказание будущего.',
  ].join('\n');

  const html = `
    <div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#1E1B16;max-width:520px">
      <p>Здравствуйте!</p>
      <p>Оплата прошла, ${what} готов.</p>
      <p>
        <a href="${url}"
           style="display:inline-block;background:#14213D;color:#FBFAF7;
                  padding:12px 22px;border-radius:4px;text-decoration:none">
          Скачать PDF
        </a>
      </p>
      <p style="color:#6E6A62;font-size:14px">
        Ссылка действует ${DOWNLOAD_DAYS} дней — сохраните файл себе.
      </p>
      <p style="color:#6E6A62;font-size:14px">
        Если ссылка не открылась или в документе что-то не так — ответьте на это письмо,
        мы разберёмся: ${req(LEGAL.email)}
      </p>
      <p style="color:#8A857B;font-size:13px">
        Расчёт по дате рождения — инструмент саморефлексии, а не предсказание будущего.
      </p>
    </div>`;

  return { text, html };
}

/**
 * Шлёт письмо, если заказ оплачен и письмо ещё не уходило.
 * Идемпотентна: emailSentAt проставляется условным UPDATE, поэтому
 * параллельные вызовы вебхука и полинга не дадут двух писем.
 */
export async function sendReportEmail(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== 'paid' || order.emailSentAt || !order.email) return;

  // Занимаем право на отправку до самой отправки: если письмо упадёт,
  // лучше не отправить, чем отправить дважды — ссылка всё равно есть на сайте.
  const claimed = await prisma.order.updateMany({
    where: { id: orderId, emailSentAt: null },
    data: { emailSentAt: new Date() },
  });
  if (claimed.count === 0) return;

  const mailer = transport();
  if (!mailer) {
    console.warn(`[mail] SMTP не настроен, письмо по заказу ${orderId} не отправлено`);
    return;
  }

  const token = issueDownloadToken(orderId, process.env.DOWNLOAD_SECRET!);
  const url = `${process.env.APP_URL}/api/orders/${orderId}/download?t=${token}`;
  const { text, html } = body(order.productType as ProductType, url);

  try {
    await mailer.sendMail({
      from: process.env.MAIL_FROM,
      to: order.email,
      subject: subject(order.productType as ProductType),
      text,
      html,
    });
  } catch (e) {
    // Право на отправку возвращаем: следующий опрос статуса попробует снова.
    await prisma.order.update({ where: { id: orderId }, data: { emailSentAt: null } });
    console.error(`[mail] не удалось отправить письмо по заказу ${orderId}`, e);
  }
}