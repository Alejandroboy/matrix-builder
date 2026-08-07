// GET /api/arcana/:n — имя аркана и бесплатная затравка (portraitShort).
// Нужен клиенту: расчёт идёт в браузере, а тексты лежат на диске сервера.
// 404 для арканов без контента — по этому же признаку клиент решает,
// показывать ли ссылку на страницу /arkan/:n (её ещё нет в сборке).
import { NextResponse } from 'next/server';
import { toArcana } from '@matrix/engine';
import { getContent } from '@/lib/content';

export async function GET(_req: Request, { params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const num = Number(n);
  if (!Number.isInteger(num) || num < 1 || num > 22) {
    return NextResponse.json({ error: 'Аркан вне диапазона 1–22' }, { status: 400 });
  }

  const item = getContent().content.get(toArcana(num));
  if (!item) {
    return NextResponse.json({ error: 'Разбор ещё не готов' }, { status: 404 });
  }

  return NextResponse.json(
    {
      arcana: num,
      name: item.card.name,
      portraitShort: item.prose.blocks.portraitShort,
      positionNotes: item.card.positionNotes,
    },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  );
}