import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const { slug } = params;

    const organization = await prisma.organization.findUnique({
      where: { slug },
      include: {
        storefront: true,
      }
    });

    if (!organization) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: { 
        organizationId: organization.id,
        status: "ACTIVE" 
      },
      include: {
        variants: true,
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      store: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        storefront: organization.storefront,
      },
      products
    });
  } catch (error) {
    console.error("[SHOP_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
