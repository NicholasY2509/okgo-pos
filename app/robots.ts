import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nyenyak.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/booking"],
        disallow: ["/admin/", "/api/", "/~offline"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
