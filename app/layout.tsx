import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RITUAL / 2026',
  description: 'An object in 108 parts. A Nordic ritual keycap study.',
  openGraph: { title: 'RITUAL / 2026', type: 'website' },
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
    <html lang="en" data-tone="black">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;1,400&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
