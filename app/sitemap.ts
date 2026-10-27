import { BRAND } from '@/data/brand';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/privacy'].map((path) => ({ url: `${BRAND.url}${path}` }));
}
