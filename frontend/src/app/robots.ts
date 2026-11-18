import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/privacy", "/terms", "/s/"],
        disallow: [
          "/merchant/",
          "/api/",
          "/login",
          "/signup",
          "/account",
          "/coming-soon",
          "/offline",
        ],
      },
    ],
    sitemap: "https://shopcraft.me/sitemap.xml",
  };
}
