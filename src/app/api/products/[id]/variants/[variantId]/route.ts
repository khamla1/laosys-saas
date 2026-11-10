import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: productId, variantId } = params;
    const organizationId = (session.user as any).organizationId;
    const body = await request.json();

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product || product.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        name: body.name,
        sku: body.sku,
        price: body.price !== undefined ? (body.price === null ? null : parseFloat(body.price)) : undefined,
        stock: body.stock !== undefined ? parseInt(body.stock) : undefined,
        barcode: body.barcode,
      }
    });

    return NextResponse.json(variant);
  } catch (error) {
    console.error("[VARIANT_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: productId, variantId } = params;
    const organizationId = (session.user as any).organizationId;

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product || product.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.productVariant.delete({
      where: { id: variantId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VARIANT_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
