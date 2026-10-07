import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CVLTSM',
  description: 'CVLTSM, a keycap set in double-shot ABS, drawn from the Nordic ritual.',
  openGraph: { title: 'CVLTSM', type: 'website' },
};

export const viewport: Viewport = {
  themeColor: '#070707',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-tone="void">
      <head>
        <link rel="preload" href="/fonts/Valhalica-Regular.otf" as="font" type="font/otf" crossOrigin="" />
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
