import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { KitsSection } from '@/components/KitsSection';
import { ColourSection } from '@/components/ColourSection';
import { RendersSection } from '@/components/RendersSection';
import { RitualSection } from '@/components/RitualSection';
import { VendorsSection } from '@/components/VendorsSection';
import { CreditsSection } from '@/components/CreditsSection';
import { Manuscript } from '@/components/Manuscript';
import { Incantation } from '@/components/Incantation';
import { MANUSCRIPT } from '@/data/manuscript';

export default function Page() {
  return (
    <>
      <Manuscript paragraphs={MANUSCRIPT} />
      <Header />
      <main>
        <Hero />
        <KitsSection />
        <ColourSection />
        <RendersSection />
        <RitualSection />
        <VendorsSection />
      </main>
      <CreditsSection />
      <Incantation stage={0} />
    </>
  );
}
