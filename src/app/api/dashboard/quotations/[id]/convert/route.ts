import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const quotation = await prisma.quotation.findUnique({ where: { id } });
    if (!quotation || quotation.organizationId !== organizationId) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    let parsedItems: any[] = [];
    if (typeof quotation.items === "string") {
      try {
        parsedItems = JSON.parse(quotation.items);
      } catch {
        parsedItems = [];
      }
    } else if (Array.isArray(quotation.items)) {
      parsedItems = quotation.items;
    }

    // Create Order in database
    const order = await prisma.order.create({
      data: {
        organizationId,
        customerName: quotation.customerName,
        totalAmount: quotation.totalAmount,
        status: "PENDING",
        paymentMethod: "CASH",
        items: {
          create: parsedItems
            .filter((i) => i.productId)
            .map((i) => ({
              productId: i.productId,
              quantity: Number(i.quantity) || 1,
              unitPrice: Number(i.unitPrice) || 0,
            })),
        },
      },
    });

    // Update quotation status to ACCEPTED
    await prisma.quotation.update({
      where: { id },
      data: { status: "ACCEPTED" },
    });

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
