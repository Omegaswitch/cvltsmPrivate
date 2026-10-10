import type { Metadata, Viewport } from 'next';
import './globals.css';

const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const metadata: Metadata = {
  metadataBase: new URL(host ? `https://${host}` : 'http://localhost:3000'),
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
        <link rel="preload" href="/fonts/FaithCollapsing.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
