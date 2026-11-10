import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://laosys.site";

  // Static core routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop/gee-svn`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Dynamically include all active organizations/shops in sitemap for #1 Google ranking
  try {
    const orgs = await prisma.organization.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    for (const org of orgs) {
      if (org.slug && org.slug !== "gee-svn") {
        routes.push({
          url: `${baseUrl}/shop/${org.slug}`,
          lastModified: org.updatedAt || new Date(),
          changeFrequency: "daily",
          priority: 0.9,
        });
      }
    }
  } catch (err) {
    console.error("Error generating dynamic sitemap:", err);
  }

  return routes;
}
