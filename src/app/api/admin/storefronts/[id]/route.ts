import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: any
) {
  const params = await context.params;
  const organizationId = params.id;

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { theme, bannerUrl, primaryColor, customDomain } = body;

    const storefront = await prisma.storefront.upsert({
      where: { organizationId },
      update: {
        theme: theme || "MODERN",
        bannerUrl: bannerUrl || null,
        customDomain: customDomain ? customDomain.trim() : null,
        metadata: {
          primaryColor: primaryColor || "#3b82f6",
        },
      },
      create: {
        organizationId,
        theme: theme || "MODERN",
        bannerUrl: bannerUrl || null,
        customDomain: customDomain ? customDomain.trim() : null,
        metadata: {
          primaryColor: primaryColor || "#3b82f6",
        },
      },
    });

    return NextResponse.json({ success: true, storefront });
  } catch (error: any) {
    console.error("[ADMIN_STOREFRONT_UPDATE_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to update storefront" }, { status: 500 });
  }
}
