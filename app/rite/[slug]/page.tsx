import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { COOKIE, STAGES, readProgress, versesFor } from '@/lib/hunt';
import { Manuscript } from '@/components/Manuscript';
import { Incantation, SpeakField } from '@/components/Incantation';
import { TwigStone } from '@/components/TwigStone';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'CVLTSM', robots: { index: false, follow: false } };

/**
 * A page of the hunt. It exists only for a visitor whose signed cookie says
 * they have earned it; for everyone else it is a 404, so the address alone
 * reveals nothing.
 */
export default async function RitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = STAGES.findIndex((s, i) => i > 0 && s.slug === slug);
  if (index < 1) notFound();

  const rite = readProgress((await cookies()).get(COOKIE)?.value);
  if (!rite || rite.progress < index) notFound();

  const stage = STAGES[index];
  const last = index === STAGES.length - 1;

  return (
    <main className="rite">
      <a className="rite__mark" href="/">CVLTSM</a>
      <Manuscript paragraphs={versesFor(stage, rite.seed)} variant="inline" />
      {stage.stone ? <TwigStone staves={stage.stone} /> : null}
      {last ? null : (
        <>
          <SpeakField stage={index} />
          <Incantation stage={index} />
        </>
      )}
    </main>
  );
}
