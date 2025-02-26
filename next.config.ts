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
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'qeevsipplmosdujltokq.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      }
    ],
    unoptimized: true,
  },
};

export default nextConfig;
