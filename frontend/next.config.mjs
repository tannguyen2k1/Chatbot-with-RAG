const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  devIndicators: false,
  images: { unoptimized: true },
  experimental: {
    proxyTimeout: 300000, // 5 phút — stream RAG/LLM có thể dài
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
