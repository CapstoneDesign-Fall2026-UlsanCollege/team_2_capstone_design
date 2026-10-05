import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ['optimize-overnight-electric-centres.trycloudflare.com', 'localhost:3000'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*', // Proxy to Django Backend
      },
    ]
  },
};

export default withPWA(nextConfig);
