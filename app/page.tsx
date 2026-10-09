import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { KitsSection } from '@/components/KitsSection';
import { ColourSection } from '@/components/ColourSection';
import { Footer } from '@/components/Footer';

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        {/* the kits scroll up over the film; the colour waits pinned beneath them */}
        <div className="below">
          <KitsSection />
          <ColourSection />
        </div>
      </main>
      <Footer />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
