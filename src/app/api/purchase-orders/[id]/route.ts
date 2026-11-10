import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, ctx: any) {
  try {
    const resolvedParams = await ctx.params;
    const { id } = resolvedParams;

    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;
    const userId = (session?.user as any)?.id;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status, warehouseId } = body;

    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id, organizationId },
      include: { items: true }
    });

    if (!existingPO) {
      return NextResponse.json({ error: "PO not found" }, { status: 404 });
    }

    if (existingPO.status === "RECEIVED") {
      return NextResponse.json({ error: "PO is already received" }, { status: 400 });
    }

    if (status === "RECEIVED") {
      if (!warehouseId) {
        return NextResponse.json({ error: "Warehouse ID is required to receive stock" }, { status: 400 });
      }

      // Execute transaction to update PO and increase stock
      await prisma.$transaction(async (tx) => {
        // Update PO
        await tx.purchaseOrder.update({
          where: { id },
          data: { status }
        });

        // Add Stock and movements for each item
        for (const item of existingPO.items) {
          await tx.stock.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: warehouseId
              }
            },
            create: {
              productId: item.productId,
              warehouseId: warehouseId,
              quantity: item.quantity
            },
            update: {
              quantity: { increment: item.quantity }
            }
          });

          // Also update the global product stock count for backwards compatibility
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              organizationId,
              userId,
              type: "ADD",
              quantity: item.quantity,
              reason: `PO Received: ${id}`
            }
          });
        }
      });

      return NextResponse.json({ success: true, message: "PO received and stock updated" });
    }

    // Normal status update (e.g., DRAFT -> ORDERED)
    await prisma.purchaseOrder.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update PO:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: any) {
  try {
    const resolvedParams = await ctx.params;
    const { id } = resolvedParams;

    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id, organizationId }
    });

    if (!existingPO) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existingPO.status === "RECEIVED") {
      return NextResponse.json({ error: "Cannot delete a received PO" }, { status: 400 });
    }

    await prisma.purchaseOrder.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete PO:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
