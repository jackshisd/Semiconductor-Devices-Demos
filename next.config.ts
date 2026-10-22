import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? '.next-build' : '.next-dev',
};
export default nextConfig;
