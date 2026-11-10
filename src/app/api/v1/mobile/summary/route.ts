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

    const orgId = auth.organizationId;

    // Calculate start of today (local time / UTC)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      org,
      todayOrders,
      pendingOrdersCount,
      processingOrdersCount,
      unreadNotificationsCount,
      latestOrder,
      latestNotification,
      lowStockCount,
    ] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true, slug: true, businessType: true, logo: true },
      }),
      prisma.order.findMany({
        where: {
          organizationId: orgId,
          createdAt: { gte: startOfToday },
          status: { not: "CANCELLED" },
        },
        select: { totalAmount: true },
      }),
      prisma.order.count({
        where: {
          organizationId: orgId,
          status: { in: ["PENDING", "PAID"] },
        },
      }),
      prisma.order.count({
        where: {
          organizationId: orgId,
          status: { in: ["PROCESSING", "SHIPPED"] },
        },
      }),
      (prisma as any).notification.count({
        where: {
          organizationId: orgId,
          isRead: false,
        },
      }),
      prisma.order.findFirst({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true, status: true, totalAmount: true },
      }),
      (prisma as any).notification.findFirst({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true, title: true },
      }),
      prisma.product.count({
        where: {
          organizationId: orgId,
          stock: { lte: 5 },
          status: "ACTIVE",
        },
      }),
    ]);

    const todaySales = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return mobileSuccess({
      store: org,
      serverTime: new Date().toISOString(),
      kpis: {
        todaySales,
        todayOrdersCount: todayOrders.length,
        pendingOrdersCount,
        processingOrdersCount,
        unreadNotificationsCount,
        lowStockCount,
      },
      latestSync: {
        latestOrderTimestamp: latestOrder?.createdAt || null,
        latestOrderId: latestOrder?.id || null,
        latestOrderNumber: latestOrder ? `#ORD-${latestOrder.id.slice(-6).toUpperCase()}` : null,
        latestNotificationTimestamp: latestNotification?.createdAt || null,
        latestNotificationTitle: latestNotification?.title || null,
      },
    });
  } catch (error: any) {
    console.error("[MOBILE_SUMMARY_GET]", error);
    return mobileError("Failed to fetch dashboard summary", 500, error.message);
  }
}
