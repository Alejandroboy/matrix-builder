// Карта сайта: главная, калькуляторы и все страницы арканов с готовым разбором.
// Список арканов берётся из контента, поэтому карта не устаревает при
// добавлении новых разборов.
//
// lastModified берётся из времени правки файлов на диске, а не из new Date().
// Функция sitemap() выполняется на каждый запрос робота, поэтому «сейчас»
// означало бы «все 26 страниц изменились только что» при каждом обходе.
// Поисковик такому полю перестаёт верить, и мы теряем единственный способ
// сказать «вот эта страница действительно обновилась».
//
// Выкладка идёт через `git pull --ff-only` (deploy/deploy.sh), а git не трогает
// файлы, которые не менялись, — значит mtime на сервере переживает деплой
// и честно показывает дату последней правки.
import type { MetadataRoute } from 'next';
import * as fs from 'fs';
import * as path from 'path';
import { getContent, CONTENT_ROOT } from '@/lib/content';
import { SITE_URL } from '@/lib/site';

// Запас на случай, если файла не окажется на месте: заведомо старая метка
// безопаснее, чем «изменено только что».
const FALLBACK = new Date('2026-08-01T00:00:00Z');

function mtime(...segments: string[]): Date {
  try {
    return fs.statSync(path.join(...segments)).mtime;
  } catch {
    return FALLBACK;
  }
}

/**
 * Дата правки исходника страницы. Для статических маршрутов правка кода
 * и есть правка страницы: другого источника изменений у них нет.
 */
const src = (...segments: string[]): Date =>
  mtime(process.cwd(), 'src', 'app', ...segments);

const newest = (dates: Date[]): Date =>
  dates.reduce((a, b) => (b > a ? b : a), FALLBACK);

export default function sitemap(): MetadataRoute.Sitemap {
  const numbers = [...getContent().content.keys()].sort((a, b) => a - b);

  // Считаем stat один раз на страницу: карта отдаётся роботу целиком,
  // и лишние обращения к диску здесь ни к чему.
  const arcanaDates = new Map(
    numbers.map((n) => [n, mtime(CONTENT_ROOT, 'arcana', `${n}.json`)] as const),
  );

  const main: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: src('page.tsx'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/matrica`,
      lastModified: src('matrica', 'page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/sovmestimost`,
      lastModified: src('sovmestimost', 'page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/kak-rasschitat`,
      lastModified: src('kak-rasschitat', 'page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      // Хаб перечисляет разборы, поэтому меняется вместе с самым свежим из них
      url: `${SITE_URL}/arkan`,
      lastModified: newest([...arcanaDates.values()]),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  const arcana: MetadataRoute.Sitemap = numbers.flatMap((n) => {
    const lastModified = arcanaDates.get(n) ?? FALLBACK;
    return [
      {
        url: `${SITE_URL}/arkan/${n}`,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
      {
        // Позиционная страница: тот же источник контента, та же дата правки
        url: `${SITE_URL}/arkan/${n}/otnosheniya`,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
    ];
  });

  return [...main, ...arcana];
}
