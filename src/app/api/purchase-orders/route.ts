import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pos = await prisma.purchaseOrder.findMany({
      where: { organizationId },
      include: {
        supplier: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(pos);
  } catch (error) {
    console.error("Failed to fetch POs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { supplierId, items, status } = body;

    if (!supplierId || !items || !items.length) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);

    const po = await prisma.purchaseOrder.create({
      data: {
        organizationId,
        supplierId,
        status: status || "DRAFT",
        totalAmount,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }
      },
      include: {
        supplier: true,
        items: true
      }
    });

    return NextResponse.json(po, { status: 201 });
  } catch (error) {
    console.error("Failed to create PO:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
