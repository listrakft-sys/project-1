/** @type {import('next').NextConfig} */
const isExport = process.env.GITHUB_PAGES === 'true';

const nextConfig = {
  reactStrictMode: true,
  ...(isExport && {
    output: 'export',
    images: { unoptimized: true },
    basePath: '/project-1',
  }),
  async rewrites() {
    if (isExport) return []; // No rewrites on static export
    return [
      {
        source: '/api/v1/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`
          : 'http://localhost:5000/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
