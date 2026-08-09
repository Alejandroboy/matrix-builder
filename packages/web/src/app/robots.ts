// robots.txt генерируется Next из этого файла.
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Служебные разделы в индексе не нужны: страница заказа персональна,
      // API отдаёт JSON, юридические документы не должны конкурировать
      // с продуктовыми страницами в выдаче.
      disallow: ['/api/', '/order/', '/legal/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
