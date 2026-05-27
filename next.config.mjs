/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd()
  },
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: true
  },
  output: 'export',
  basePath: '/VE-LYRA-Labs-Assignment'
};

export default nextConfig;
