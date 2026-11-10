import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  // Security check: CRON_SECRET token
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  // Always require CRON_SECRET — if env var is not set, deny all requests
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Auto clean: soft-delete products after 7 days of PENDING_DELETE
    const result = await prisma.product.updateMany({
      where: {
        status: "PENDING_DELETE",
        updatedAt: { lte: sevenDaysAgo }
      },
      data: {
        status: "DELETED"
      }
    });

    // Log the auto cleanup in audit logs for traceablity
    if (result.count > 0) {
      await prisma.auditLog.create({
        data: {
          action: "AUTO_CLEANUP_DELETIONS",
          details: `Auto-cleaned and soft-deleted ${result.count} products pending delete for > 7 days.`
        }
      });
    }

    return NextResponse.json({
      success: true,
      cleanedCount: result.count
    });
  } catch (error: any) {
    console.error("[CRON_CLEANUP_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
