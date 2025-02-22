import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'jxg3wl1b3h6c.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      }
    ],
    unoptimized: true,
  },
};

export default nextConfig;
