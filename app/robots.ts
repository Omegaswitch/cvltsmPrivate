import type { MetadataRoute } from 'next';
import { BRAND } from '@/data/brand';

/** /robots.txt: everything may be crawled; the sitemap says what there is. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${BRAND.url}/sitemap.xml`,
  };
}
