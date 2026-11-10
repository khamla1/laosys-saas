import {
  verifyMobileRequest,
  mobileSuccess,
  mobileError,
  handleCorsOptions,
} from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function GET(req: Request) {
  try {
    const auth = await verifyMobileRequest(req);
    if (!auth.authenticated || !auth.organizationId) {
      return mobileError(auth.error || "Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "30", 10), 1), 100);
    const sinceParam = searchParams.get("since");

    const whereClause: any = {
      organizationId: auth.organizationId,
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    if (sinceParam) {
      const sinceDate = new Date(sinceParam);
      if (!isNaN(sinceDate.getTime())) {
        whereClause.createdAt = { gt: sinceDate };
      }
    }

    const [unreadCount, notifications] = await Promise.all([
      (prisma as any).notification.count({
        where: {
          organizationId: auth.organizationId,
          isRead: false,
        },
      }),
      (prisma as any).notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    const formatted = notifications.map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      link: n.link,
      createdAt: n.createdAt,
    }));

    return mobileSuccess({
      unreadCount,
      count: formatted.length,
      pollTimestamp: new Date().toISOString(),
      notifications: formatted,
    });
  } catch (error: any) {
    console.error("[MOBILE_NOTIFICATIONS_GET]", error);
    return mobileError("Failed to fetch notifications", 500, error.message);
  }
}
