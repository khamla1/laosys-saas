import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET all organizations with their storefronts (Admin only)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        logo: true,
        storefront: {
          select: {
            id: true,
            theme: true,
            bannerUrl: true,
            customDomain: true,
          }
        },
        members: {
          where: { role: "OWNER" },
          select: {
            user: {
              select: { name: true, email: true }
            }
          },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("[ADMIN_STOREFRONTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT - Update storefront for a specific organization (Admin only)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { organizationId, theme, bannerUrl, customDomain, name, slug } = body;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    }

    // Update organization name and slug if provided
    if (name || slug) {
      const updateData: any = {};
      if (name) updateData.name = name;
      if (slug) updateData.slug = slug;
      
      await prisma.organization.update({
        where: { id: organizationId },
        data: updateData
      });
      
      // Revalidate the shop path
      const { revalidatePath } = require("next/cache");
      if (slug) {
        revalidatePath(`/shop/${slug}`);
      }
    }

    const storefront = await prisma.storefront.upsert({
      where: { organizationId },
      create: {
        organizationId,
        theme: theme || "light",
        bannerUrl: bannerUrl || null,
        customDomain: customDomain || null,
      },
      update: {
        theme,
        bannerUrl,
        customDomain,
      },
    });

    return NextResponse.json(storefront);
  } catch (error) {
    console.error("[ADMIN_STOREFRONTS_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
