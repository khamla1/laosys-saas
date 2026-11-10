import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  context: any
) {
  const params = await context.params;
  const { id: productId, action } = params;

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (action === "approve") {
      // Mark as permanently DELETED or delete record
      await prisma.product.update({
        where: { id: productId },
        data: { status: "DELETED" }
      });

      await prisma.auditLog.create({
        data: {
          action: "APPROVE_DELETE",
          entityType: "PRODUCT",
          entityId: productId,
          userId: (session.user as any).id,
          details: { message: `Product ${productId} delete approved by admin` }
        }
      });

      return NextResponse.json({ success: true, message: "Product deleted" });
    }

    if (action === "restore") {
      await prisma.product.update({
        where: { id: productId },
        data: { status: "ACTIVE" }
      });

      await prisma.auditLog.create({
        data: {
          action: "RESTORE_PRODUCT",
          entityType: "PRODUCT",
          entityId: productId,
          userId: (session.user as any).id,
          details: { message: `Product ${productId} restored by admin` }
        }
      });

      return NextResponse.json({ success: true, message: "Product restored" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[ADMIN_PENDING_DELETE_PRODUCT_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
