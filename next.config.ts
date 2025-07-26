import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move serverComponentsExternalPackages to the correct location
  serverExternalPackages: ['mongodb'],
  
  // Optimize for Vercel deployment
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      }
    ],
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
