// apps/web/src/lib/download-token.ts
// Подписанная ссылка на скачивание: HMAC-SHA256(orderId + срок годности).
// Чистые функции без внешних зависимостей — тестируются как движок.
import { createHmac, timingSafeEqual } from 'node:crypto';

const b64url = (buf: Buffer) => buf.toString('base64url');

function sign(payload: string, secret: string): string {
  return b64url(createHmac('sha256', secret).update(payload).digest());
}

/** Токен вида `<orderId>.<expiresAtSec>.<hmac>` */
export function issueDownloadToken(orderId: string, secret: string, ttlSeconds = 7 * 24 * 3600, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + ttlSeconds;
  const payload = `${orderId}.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export type TokenCheck =
  | { ok: true; orderId: string }
  | { ok: false; reason: 'malformed' | 'expired' | 'bad-signature' };

export function verifyDownloadToken(token: string, secret: string, now = Date.now()): TokenCheck {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  const [orderId, expStr, mac] = parts as [string, string, string];
  const exp = Number(expStr);
  if (!orderId || !Number.isInteger(exp)) return { ok: false, reason: 'malformed' };

  const expected = sign(`${orderId}.${exp}`, secret);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  // timingSafeEqual бросает на разной длине — сравниваем длины сами
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad-signature' };
  }
  // ВАЖНО: срок проверяем ПОСЛЕ подписи — иначе ответ «expired» на токене
  // с поддельной подписью сообщает атакующему, что формат он угадал верно.
  if (exp * 1000 < now) return { ok: false, reason: 'expired' };

  return { ok: true, orderId };
}
