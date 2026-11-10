import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const orders = await prisma.purchaseOrder.findMany({
      where: { organizationId },
      include: {
        supplier: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const body = await req.json();
    const { supplierId, status, totalAmount, description, recordedBy, attachment, items } = body;

    if (!supplierId || typeof totalAmount !== "number") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const order = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        status: status || "DRAFT",
        totalAmount,
        description,
        recordedBy,
        attachment,
        organizationId,
        items: items && items.length > 0 ? {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        } : undefined
      },
      include: {
        supplier: true,
        items: true
      }
    });

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
