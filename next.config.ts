import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
