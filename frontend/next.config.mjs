const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination:  process.env.NEXT_PUBLIC_API_BASE_URL + '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
