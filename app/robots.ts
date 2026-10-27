import { BRAND } from '@/data/brand';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${BRAND.url}/sitemap.xml` };
}
