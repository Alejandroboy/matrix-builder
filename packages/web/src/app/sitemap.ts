// Карта сайта: главная, калькуляторы и все страницы арканов с готовым разбором.
// Список арканов берётся из контента, поэтому карта не устаревает при
// добавлении новых разборов.
import type { MetadataRoute } from 'next';
import { getContent } from '@/lib/content';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const main: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/matrica`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/sovmestimost`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/arkan`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const arcana: MetadataRoute.Sitemap = [...getContent().content.keys()]
    .sort((a, b) => a - b)
    .map((n) => ({
      url: `${SITE_URL}/arkan/${n}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  return [...main, ...arcana];
}
