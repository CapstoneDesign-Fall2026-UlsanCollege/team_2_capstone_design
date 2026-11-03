import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const djangoApiOrigin = (process.env.DJANGO_API_ORIGIN || "http://127.0.0.1:8000").replace(/\/$/, "");

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
      afterFiles: [
        {
          source: "/api/:path*/",
          destination: `${djangoApiOrigin}/api/:path*/`,
        },
        {
          source: "/api/:path*",
          destination: `${djangoApiOrigin}/api/:path*`,
        },
      ],
      fallback: [],
    };
  },
};

export default withPWA(nextConfig);
