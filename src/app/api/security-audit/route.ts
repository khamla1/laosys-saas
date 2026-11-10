import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sanitizeNoSql } from "@/lib/security";

/**
 * GET: Returns security audit logs, restricted to ADMIN users only.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN") {
      return new NextResponse("Forbidden - Admin access required", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const actionFilter = searchParams.get("action");

    // Build query
    const where: any = {};
    if (actionFilter) {
      where.action = actionFilter;
    }

    // Fetch logs from prisma
    const logs = await prisma.auditLog.findMany({
      where: sanitizeNoSql(where),
      orderBy: { createdAt: "desc" },
      take: limit > 200 ? 200 : limit, // Cap the limit at 200
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("[SECURITY_AUDIT_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
