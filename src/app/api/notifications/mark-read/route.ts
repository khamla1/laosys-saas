import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    
    // We can either mark all as read or a specific notification
    const body = await req.json().catch(() => ({}));
    const { notificationId } = body;

    if (notificationId) {
      await (prisma as any).notification.updateMany({
        where: { id: notificationId, organizationId: orgId },
        data: { isRead: true },
      });
    } else {
      // Mark all as read
      await (prisma as any).notification.updateMany({
        where: { organizationId: orgId, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[NOTIFICATIONS_MARK_READ]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
