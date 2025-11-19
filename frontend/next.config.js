/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Production domain configuration
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    compress: true,
  }),
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;





