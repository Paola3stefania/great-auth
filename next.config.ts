import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // Local dev: symlinked better-auth causes type mismatches across @better-auth/core boundaries
    ignoreBuildErrors: true,
  },
  // Needed for Turbopack to resolve exports map through the symlinked better-auth package
  transpilePackages: ['better-auth'],
  experimental: {
    ppr: true,
    clientSegmentCache: true,
    nodeMiddleware: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.better-auth.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
