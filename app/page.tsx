import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { KitsSection } from '@/components/KitsSection';
import { ColourSection } from '@/components/ColourSection';
import { RendersSection } from '@/components/RendersSection';
import { VendorsSection } from '@/components/VendorsSection';
import { Footer } from '@/components/Footer';
import { Sound } from '@/components/Sound';

export default function Page() {
  return (
    <>
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
      <Sound />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
