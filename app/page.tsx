import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { KitsSection } from '@/components/KitsSection';
import { ColourSection } from '@/components/ColourSection';
import { RendersSection } from '@/components/RendersSection';
import { RitualSection } from '@/components/RitualSection';
import { VendorsSection } from '@/components/VendorsSection';
import { CreditsSection } from '@/components/CreditsSection';

export default function Page() {
  return (
    <>
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
    </>
  );
}
