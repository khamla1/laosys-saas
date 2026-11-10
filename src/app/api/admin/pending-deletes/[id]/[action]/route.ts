import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  context: any
) {
  const params = await context.params;
  const { id: orgId, action } = params;

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (action === "approve") {
      // Permanently delete or mark organization as deleted
      await prisma.organization.update({
        where: { id: orgId },
        data: { status: "DELETED" }
      });

      await prisma.auditLog.create({
        data: {
          action: "APPROVE_DELETE_STORE",
          entityType: "ORGANIZATION",
          entityId: orgId,
          userId: (session.user as any).id,
          details: { message: `Permanently approved deletion of organization ${orgId}` }
        }
      });

      return NextResponse.json({ success: true, message: "Organization deleted successfully" });
    }

    if (action === "cancel") {
      // Restore organization to ACTIVE
      await prisma.organization.update({
        where: { id: orgId },
        data: { status: "ACTIVE" }
      });

      await prisma.auditLog.create({
        data: {
          action: "CANCEL_DELETE_STORE",
          entityType: "ORGANIZATION",
          entityId: orgId,
          userId: (session.user as any).id,
          details: { message: `Cancelled deletion of organization ${orgId}` }
        }
      });

      return NextResponse.json({ success: true, message: "Organization restored successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[ADMIN_PENDING_DELETE_STORE_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
