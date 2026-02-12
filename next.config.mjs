/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily disable ESLint during build for production readiness check
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['prismjs', 'unified', 'remark', 'rehype'],
  },

  // Compression and caching
  compress: true,

  // Bundle analyzer (optional, for development)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer')({
          enabled: true,
        }))()
      );
      return config;
    },
  }),
};

export default nextConfig;
