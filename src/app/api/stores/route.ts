import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "ALL";

    const whereClause: any = {};

    if (query.trim() !== "") {
      whereClause.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
      ];
    }

    if (type && type !== "ALL") {
      whereClause.businessType = type;
    }

    const stores = await prisma.organization.findMany({
      where: whereClause,
      include: {
        storefront: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      count: stores.length,
      stores: stores.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        logo: s.logo,
        businessType: s.businessType,
        createdAt: s.createdAt,
        productsCount: s._count.products,
        storefrontUrl: `/shop/${s.slug}`,
        bannerUrl:
          s.storefront?.bannerUrl ||
          (s.storefront?.metadata as any)?.banners?.[0]?.url ||
          null,
        theme: s.storefront?.theme || "light",
      })),
    });
  } catch (err: any) {
    console.error("Error fetching public stores:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stores", stores: [] },
      { status: 500 }
    );
  }
}
