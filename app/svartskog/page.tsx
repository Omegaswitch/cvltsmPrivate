import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { STATION_OPEN } from '@/lib/station/open';
import { Station } from '@/components/station/Station';
import './station.css';

/*
 * Field Station 7: the hidden page. Not linked, not in the sitemap, not
 * indexed; found through the runes at the foot of the home page (SVARTSKOG).
 */
export const metadata: Metadata = {
  title: 'STN 7 / SVARTSKOG',
  robots: { index: false, follow: false },
};

export default function Page() {
  if (!STATION_OPEN) notFound();
  return <Station />;
}
