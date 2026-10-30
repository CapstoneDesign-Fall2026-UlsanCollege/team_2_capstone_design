import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const djangoApiOrigin = (process.env.DJANGO_API_ORIGIN || "http://127.0.0.1:8000").replace(/\/$/, "");

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
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
        destination: "/s/brewmellow",
        permanent: true,
      },
      {
        source: "/origins/:path*",
        destination: "/s/brewmellow",
        permanent: true,
      },
      {
        source: "/subscribe",
        destination: "/s/brewmellow",
        permanent: true,
      },
      {
        source: "/checkout",
        destination: "/s/brewmellow/checkout",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/merchant/brewmellow",
        permanent: true,
      },
      {
        source: "/dashboard/:path*",
        destination: "/merchant/brewmellow/:path*",
        permanent: true,
      },
      {
        source: "/admin",
        destination: "/merchant/brewmellow",
        permanent: true,
      },
      {
        source: "/admin/:path*",
        destination: "/merchant/brewmellow/:path*",
        permanent: true,
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
