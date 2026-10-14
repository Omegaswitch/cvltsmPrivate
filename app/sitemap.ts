import type { MetadataRoute } from 'next';
import { BRAND } from '@/data/brand';

/** /sitemap.xml: the site's pages. Add a line here when a page is added. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BRAND.url}/` },
    { url: `${BRAND.url}/privacy` },
  ];
}
