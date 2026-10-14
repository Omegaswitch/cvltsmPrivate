import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { KitsSection } from '@/components/KitsSection';
import { ColourSection } from '@/components/ColourSection';
import { RendersSection } from '@/components/RendersSection';
import { VendorsSection } from '@/components/VendorsSection';
import { Footer } from '@/components/Footer';
import { BloodDefs } from '@/components/Daub';
import { BRAND } from '@/data/brand';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { title: 'CVLTSM', siteName: 'CVLTSM', description: 'A keycap set by SWG.', type: 'website', url: '/' },
};

/* What the page is, for search engines: the visible page has almost no words
   (DESIGN.md: no invented copy), so the facts are stated here instead. */
const site = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: BRAND.name,
  url: BRAND.url,
  description: `${BRAND.name}, a keycap set by ${BRAND.manufacturer.name}.`,
  publisher: { '@type': 'Organization', name: BRAND.manufacturer.name },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(site) }} />
      <Nav />
      <main>
        <Hero />
        {/* the kits scroll up over the film; the colors wait pinned beneath them */}
        <div className="below">
          <KitsSection />
          <ColourSection />
          <RendersSection />
          <VendorsSection />
        </div>
      </main>
      <Footer />
      <BloodDefs />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
