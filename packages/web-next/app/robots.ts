import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/builder",
          "/planning-suggestions",
          "/profile",
          "/upgrade/",
          "/login",
          "/signup",
        ],
      },
    ],
    sitemap: "https://nextdestination.ai/sitemap.xml",
  };
}
