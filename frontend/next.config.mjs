const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  images: { unoptimized: true },
  experimental: {
    proxyTimeout: 300000, // 300 giây - tránh timeout khi LLM xử lý multi-turn
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
