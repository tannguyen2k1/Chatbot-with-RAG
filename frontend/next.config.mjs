const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  devIndicators: false,
  images: { unoptimized: true },
  experimental: {
    proxyTimeout: 30000, // 30 giây
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_BASE_URL + '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
