import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const configuredApiOrigin = (
  process.env.DJANGO_API_ORIGIN ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  ""
)
  .trim()
  .replace(/\/+$/, "");

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false,
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: false,
  workboxOptions: {
    navigateFallbackDenylist: [/^\/api\//],
    runtimeCaching: [
      {
        urlPattern: /^\/api\/.*/i,
        handler: "NetworkOnly",
      },
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  skipTrailingSlashRedirect: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/origins",
        destination: "/",
        permanent: true,
      },
      {
        source: "/origins/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/subscribe",
        destination: "/#collection-section",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/admin",
        destination: "/login",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/signup",
          destination: "/login",
        },
      ],
      afterFiles: configuredApiOrigin
        ? [
            {
              source: "/api/:path*/",
              destination: `${configuredApiOrigin}/api/:path*/`,
            },
            {
              source: "/api/:path*",
              destination: `${configuredApiOrigin}/api/:path*`,
            },
          ]
        : [],
      fallback: [],
    };
  },
};

export default withPWA(nextConfig);
