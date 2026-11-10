import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // Fetch product to verify ownership/access
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product || product.status === "DELETED") {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Tenant Isolation
    const organizationId = (session.user as any).organizationId;
    let storeId = organizationId;
    
    if (role !== "ADMIN" && !storeId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (role !== "ADMIN" && product.organizationId !== storeId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Fetch Audit Logs matching this product
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        details: {
          contains: id
        }
      },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });

    // 2. Fetch Stock Movements matching this product
    const stockMovements = await prisma.stockMovement.findMany({
      where: {
        productId: id
      },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });

    // 3. Normalize structures
    const normalizedAudit = auditLogs.map(log => {
      let message = "";
      let parsed: any = {};
      try {
        if (log.details) {
          parsed = JSON.parse(log.details);
          message = parsed.message || "";
        }
      } catch (e) {
        message = log.details || "";
      }

      if (!message) {
        message = `${log.action} action performed`;
      }

      let type = log.action;
      if (type === "REQUEST_DELETE") type = "DELETE_REQUEST";
      if (type === "APPROVE_DELETE") type = "ADMIN_APPROVE";
      if (type === "RESTORE_PRODUCT") type = "RESTORE";

      let actorType: "USER" | "ADMIN" | "SYSTEM" = "USER";
      if (log.user?.role === "ADMIN") {
        actorType = "ADMIN";
      } else if (!log.user) {
        actorType = "SYSTEM";
      }

      const actorName = log.user?.name || log.user?.email || "System";

      return {
        type,
        message,
        actorName,
        actorType,
        createdAt: parsed.timestamp ? new Date(parsed.timestamp) : log.createdAt,
      };
    });

    const normalizedStock = stockMovements.map(mov => {
      let type = "";
      let message = "";
      const actorName = mov.user?.name || mov.user?.email || "System";
      
      if (mov.type === "ADD") {
        type = "ADD_STOCK";
        message = `User ${actorName} added ${mov.quantity} items to stock`;
      } else if (mov.type === "REMOVE") {
        type = "REMOVE_STOCK";
        message = `User ${actorName} removed ${Math.abs(mov.quantity)} items from stock`;
      } else if (mov.type === "SALE") {
        type = "SALE";
        message = `Sale of ${Math.abs(mov.quantity)} items completed`;
      } else if (mov.type === "ADJUST") {
        type = "ADJUST_STOCK";
        message = `User ${actorName} adjusted stock to ${mov.quantity}`;
      }

      if (mov.reason) {
        message += ` (${mov.reason})`;
      }

      let actorType: "USER" | "ADMIN" | "SYSTEM" = "USER";
      if (mov.type === "SALE" && !mov.user) {
        actorType = "SYSTEM";
      } else if (mov.user?.role === "ADMIN") {
        actorType = "ADMIN";
      } else if (!mov.user) {
        actorType = "SYSTEM";
      }

      return {
        type,
        message,
        actorName,
        actorType,
        createdAt: mov.createdAt,
      };
    });

    // 4. Merge and sort DESC
    const merged = [...normalizedAudit, ...normalizedStock];
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(merged);
  } catch (error) {
    console.error("[PRODUCT_LOGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
