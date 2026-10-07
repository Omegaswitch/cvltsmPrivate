import { Chrome } from '@/components/Chrome';
import { HeroSection } from '@/components/HeroSection';
import { ObjectSection } from '@/components/ObjectSection';
import { AnatomySection } from '@/components/AnatomySection';
import { SigilsSection } from '@/components/SigilsSection';
import { RitualSection } from '@/components/RitualSection';
import { ArchiveSection } from '@/components/ArchiveSection';
import { SetSection } from '@/components/SetSection';
import { VoidSection } from '@/components/VoidSection';
import { CompleteSection } from '@/components/CompleteSection';
import { Credits } from '@/components/Credits';

/**
 * The exhibition, in order. The narrative runs
 * ORDER → DISCOVERY → DISSECTION → RITUAL → CONTAMINATION → ORDER,
 * and the page follows it section by section.
 */
export default function Page() {
  return (
    <>
      <Chrome />
      <main>
        <HeroSection />
        <ObjectSection />
        <AnatomySection />
        <SigilsSection />
        <RitualSection />
        <ArchiveSection />
        <SetSection />
        <VoidSection />
        <CompleteSection />
        <Credits />
      </main>
    </>
  );
}
