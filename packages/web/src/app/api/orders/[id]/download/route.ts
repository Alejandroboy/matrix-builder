// GET /api/orders/:id/download?t=<signed-token>
// Двойная проверка (подпись + paid в базе) и генерация на лету —
// паттерн Неустойки без изменений; поменялся только формат: PDF вместо docx.
import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import { prisma } from '@/lib/prisma';
import { verifyDownloadToken } from '@/lib/download-token';
import { computeCompatibility } from '@matrix/engine';
import { compileCompatibilityReport, renderCompatibilityPdf } from '@matrix/docgen';
import { getContent } from '@/lib/content';
import type { OrderInput } from '@/lib/order';

// Брендовые TTF лежат в packages/web/assets/fonts (см. README).
const FONTS = {
  regular: path.resolve(process.cwd(), 'assets/fonts/PTSerif-Regular.ttf'),
  bold: path.resolve(process.cwd(), 'assets/fonts/PTSerif-Bold.ttf'),
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get('t');
  if (!token) return NextResponse.json({ error: 'Нет токена' }, { status: 401 });

  const check = verifyDownloadToken(token, process.env.DOWNLOAD_SECRET!);
  if (!check.ok || check.orderId !== id) {
    return NextResponse.json({ error: 'Ссылка недействительна' }, { status: 403 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
  if (order.status !== 'paid') {
    return NextResponse.json({ error: 'Заказ не оплачен' }, { status: 402 });
  }

  const input = order.input as unknown as OrderInput;
  if (input.productType !== 'compatibility') {
    // Личный отчёт — следующий компилятор; до него personal не продаётся (см. Calculator)
    return NextResponse.json({ error: 'Тип пока не поддержан' }, { status: 501 });
  }

  const { content, pairRules } = getContent();
  const spec = compileCompatibilityReport({
    matrix: computeCompatibility(input.birthDateA, input.birthDateB!),
    content,
    pairRules,
    names: { a: input.nameA, b: input.nameB! },
    orderId: order.id,
    generatedAt: new Date().toISOString(),
  });

  const stream = renderCompatibilityPdf(spec, { fonts: FONTS });
  const buf = await streamToBuffer(stream);

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="sovmestimost-${id}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (c) => chunks.push(Buffer.from(c)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
