import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: productId } = params;
    const organizationId = (session.user as any).organizationId;

    // Verify product belongs to org
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product || product.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const variants = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(variants);
  } catch (error) {
    console.error("[VARIANTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: productId } = params;
    const organizationId = (session.user as any).organizationId;
    const body = await request.json();

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product || product.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        name: body.name,
        sku: body.sku,
        price: body.price !== undefined ? parseFloat(body.price) : null,
        stock: body.stock ? parseInt(body.stock) : 0,
        barcode: body.barcode,
      }
    });

    return NextResponse.json(variant);
  } catch (error) {
    console.error("[VARIANTS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
