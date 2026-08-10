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
      // /legal/ намеренно НЕ закрыт: документы должны быть доступны и
      // проверяющим платёжного провайдера, и покупателю. От индексации они
      // закрыты метатегом на самих страницах — этого достаточно.
      disallow: ['/api/', '/order/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}