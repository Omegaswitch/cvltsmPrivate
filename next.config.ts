import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // placeholders and real plates are plain files in /public, served as-is
    unoptimized: true,
  },
  // the archive is kept for reference and is not part of the build
  outputFileTracingExcludes: { '*': ['archive/**'] },
};

export default nextConfig;
