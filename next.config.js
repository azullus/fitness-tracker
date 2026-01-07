/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable standalone output for Docker deployment
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Exclude better-sqlite3 from client-side bundling (server-only)
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  // PWA support
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
