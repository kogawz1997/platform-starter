const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.yourdomain.com",
      },
    ],
  },
};

export default nextConfig;
