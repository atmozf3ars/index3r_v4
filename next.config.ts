import { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  images: {
    domains: ['theinnercircle.gg'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  devIndicators: {
    appIsrStatus: false,
  },
  reactStrictMode: false,
  serverRuntimeConfig: {
    FILE_DIRECTORY: process.env.FILE_DIRECTORY || 'O:/innercircle-indexer/innercircle',
  },
  publicRuntimeConfig: {
    staticFolder: '/static',
  },
  webpack: (config, { isServer }) => {
    config.externals = [...config.externals, 'sharp'];
    config.externals.push('@resvg/resvg-js');

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
      };
    }

    return config;
  },
  
  serverExternalPackages: [
    'fs',
    'fluent-ffmpeg',
    '@ffmpeg-installer/ffmpeg',
    'canvas',
    'web-audio-api',
  ],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

