import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { Footer } from '@/components/Footer';

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
      </main>
      <Footer />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
