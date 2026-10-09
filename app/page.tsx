import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { Manuscript } from '@/components/Manuscript';
import { Footer } from '@/components/Footer';
import { TornEdge } from '@/components/TornEdge';
import { Incantation } from '@/components/Incantation';
import { MANUSCRIPT } from '@/data/manuscript';

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <section id="manuscript" className="sheet" aria-label="Manuscript">
          <TornEdge />
          <Manuscript paragraphs={MANUSCRIPT} variant="sheet" />
        </section>
      </main>
      <Footer />
      <div className="grain" aria-hidden="true" />
      <Incantation stage={0} />
    </>
  );
}
