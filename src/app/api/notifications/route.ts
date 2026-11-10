import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;

    const notifications = await (prisma as any).notification.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 50, // Get latest 50
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;

    await (prisma as any).notification.deleteMany({
      where: { organizationId: orgId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[NOTIFICATIONS_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
