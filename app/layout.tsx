import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Loader } from '@/components/Loader';
import { Sound } from '@/components/Sound';

export const metadata: Metadata = {
  metadataBase: new URL('https://cvltsm.cat'),
  title: 'CVLTSM',
  description: 'CVLTSM, a keycap set by SWG.',
  openGraph: { title: 'CVLTSM', siteName: 'CVLTSM', description: 'A keycap set by SWG.', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'CVLTSM', description: 'A keycap set by SWG.' },
};

export const viewport: Viewport = {
  themeColor: '#070605',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/Valhalica-Regular.otf" as="font" type="font/otf" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500&display=swap"
        />
      </head>
      {/* here, not in a page: the music and the loader live across pages (the privacy policy and back) */}
      <body>{children}<Sound /><Loader /></body>
    </html>
  );
}
