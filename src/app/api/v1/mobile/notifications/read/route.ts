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

export async function POST(req: Request) {
  try {
    const auth = await verifyMobileRequest(req);
    if (!auth.authenticated || !auth.organizationId) {
      return mobileError(auth.error || "Unauthorized", 401);
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // allow empty body if marking all
    }

    const { notificationId, all } = body;

    if (all || !notificationId) {
      const result = await (prisma as any).notification.updateMany({
        where: {
          organizationId: auth.organizationId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return mobileSuccess({
        message: "All notifications marked as read",
        updatedCount: result.count,
      });
    }

    const result = await (prisma as any).notification.updateMany({
      where: {
        id: notificationId,
        organizationId: auth.organizationId,
      },
      data: {
        isRead: true,
      },
    });

    if (result.count === 0) {
      return mobileError("Notification not found or already read", 404);
    }

    return mobileSuccess({
      message: "Notification marked as read",
      notificationId,
      updatedCount: result.count,
    });
  } catch (error: any) {
    console.error("[MOBILE_NOTIFICATIONS_READ_POST]", error);
    return mobileError("Failed to update notification status", 500, error.message);
  }
}
