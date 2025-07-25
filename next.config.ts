import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
  },
  // Optimize for Vercel deployment
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Handle large files for S3 uploads
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  // Improve build performance
  swcMinify: true,
  // Enable compression
  compress: true,
  // Optimize images
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
