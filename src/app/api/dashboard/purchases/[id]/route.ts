import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    if (status === "RECEIVED" && existing.status !== "RECEIVED") {
      const poItems = await prisma.purchaseOrderItem.findMany({
        where: { poId: id },
      });
      for (const item of poItems) {
        if (item.productId && item.quantity > 0) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existing.status,
        description: description !== undefined ? description : existing.description,
        recordedBy: recordedBy !== undefined ? recordedBy : existing.recordedBy,
        attachment: attachment !== undefined ? attachment : existing.attachment,
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.purchaseOrder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
