import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }


    // Delete the order. Prisma cascade deletion should handle orderItems if configured, 
    // but let's delete them explicitly to be safe if schema doesn't have onDelete: Cascade for items
    await prisma.orderItem.deleteMany({
      where: { orderId: id }
    });

    await prisma.transaction.deleteMany({
      where: { orderId: id }
    });

    await prisma.order.deleteMany({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Order deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order.", details: error.message },
      { status: 500 }
    );
  }
}
