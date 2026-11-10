import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;
    const userRole = user.role;
    const userOrgId = user.organizationId || userId;
    const isAdmin = userRole === "ADMIN";

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const skip = (page - 1) * limit;

    const search = (searchParams.get("search") || "").trim();
    const entityType = searchParams.get("entityType") || "ALL";
    const entityId = searchParams.get("entityId");
    const action = searchParams.get("action") || "ALL";
    const selectedUserId = searchParams.get("userId");
    const dateRange = searchParams.get("dateRange");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Scoping: Non-admin users are restricted to their own organization
    const where: any = {};
    if (!isAdmin || !searchParams.get("allOrgs")) {
      where.organizationId = userOrgId;
    }

    // Specific Entity ID query (for single order/product history)
    if (entityId) {
      where.OR = [
        { details: { contains: entityId, mode: "insensitive" } },
        { action: { contains: entityId, mode: "insensitive" } },
      ];
    }

    // Entity Type filter
    if (entityType && entityType !== "ALL") {
      if (entityType === "ORDER") {
        where.action = { in: [
          "ORDER_CREATED", "ORDER_PAID", "ORDER_SPLIT", "ORDER_MERGED",
          "ORDER_CANCELLED", "ORDER_UPDATED", "UPDATE_ORDER_STATUS",
          "ORDER_DELETED", "ORDER_ITEM_ADDED", "ORDER_SERVICE_FEE_SET",
          "DATA_EDITOR_UPDATE_ORDERS", "DATA_EDITOR_DELETE_ORDERS"
        ] };
      } else if (entityType === "PRODUCT") {
        where.action = { in: [
          "PRODUCT_CREATED", "PRODUCT_UPDATED", "PRODUCT_DELETED",
          "STOCK_ADJUSTED", "DATA_EDITOR_UPDATE_PRODUCTS",
          "DATA_EDITOR_DELETE_PRODUCTS", "DATA_EDITOR_UPDATE_STOCK"
        ] };
      } else if (entityType === "TABLE") {
        where.action = { in: [
          "TABLE_MOVED", "TABLE_LOCKED", "TABLE_STATUS_CHANGED",
          "TABLE_CREATED", "TABLE_DELETED"
        ] };
      } else if (entityType === "SETTING") {
        where.action = { in: [
          "SETTINGS_UPDATED", "SELLER_SETTINGS_UPDATED"
        ] };
      } else {
        where.action = { startsWith: entityType };
      }
    }

    // Specific Action filter
    if (action && action !== "ALL") {
      where.action = { contains: action, mode: "insensitive" };
    }

    // User / Actor filter
    if (selectedUserId && selectedUserId !== "ALL") {
      where.userId = selectedUserId;
    }

    // Date Range filters
    const now = new Date();
    if (dateRange === "today") {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.createdAt = { gte: startOfToday };
    } else if (dateRange === "7days") {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: past7 };
    } else if (dateRange === "30days") {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: past30 };
    } else if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Search query (across details, action, user name/email)
    if (search) {
      const searchCondition = [
        { details: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchCondition }];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
    }

    // Start of today for KPI stats
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const baseOrgWhere = { organizationId: userOrgId };

    const [logs, total, totalCount, billsCount, productsCount, todayCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
              organizations: {
                select: {
                  organizationId: true,
                  role: true,
                },
              },
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: baseOrgWhere }),
      prisma.auditLog.count({
        where: {
          ...baseOrgWhere,
          OR: [
            { action: { contains: "ORDER", mode: "insensitive" } },
            { action: { contains: "BILL", mode: "insensitive" } },
          ],
        },
      }),
      prisma.auditLog.count({
        where: {
          ...baseOrgWhere,
          OR: [
            { action: { contains: "PRODUCT", mode: "insensitive" } },
            { action: { contains: "STOCK", mode: "insensitive" } },
          ],
        },
      }),
      prisma.auditLog.count({
        where: {
          ...baseOrgWhere,
          createdAt: { gte: startOfToday },
        },
      }),
    ]);

    // Format logs with entityType and refCode extracted from metadata
    const formattedLogs = logs.map((log: any) => {
      const meta = (log.metadata as Record<string, any>) || {};
      const entityTypeDetected =
        meta.entityType ||
        (log.action.includes("ORDER") || log.action.includes("BILL")
          ? "ORDER"
          : log.action.includes("PRODUCT")
          ? "PRODUCT"
          : log.action.includes("STOCK")
          ? "STOCK"
          : log.action.includes("TABLE")
          ? "TABLE"
          : log.action.includes("SETTING")
          ? "SETTING"
          : "SYSTEM");

      // Resolve staff/operator name and role
      const matchedOrgRole = log.user?.organizations?.find(
        (o: any) => o.organizationId === log.organizationId
      )?.role;

      const operatorName =
        log.user?.name || meta.operatorName || log.user?.email || "ພະນັກງານ (Staff)";
      const operatorEmail = log.user?.email || meta.operatorEmail || "";
      const operatorRole =
        matchedOrgRole || meta.operatorRole || log.user?.role || "STAFF";

      return {
        id: log.id,
        action: log.action,
        entityType: entityTypeDetected,
        entityId: meta.entityId || null,
        refCode: meta.refCode || null,
        details: log.details || "",
        ipAddress: log.ipAddress || meta.ipAddress || null,
        metadata: meta,
        createdAt: log.createdAt,
        user: log.user || meta.operatorName
          ? {
              id: log.user?.id || log.userId || "",
              name: operatorName,
              email: operatorEmail,
              role: operatorRole,
              image: log.user?.image || null,
            }
          : null,
        organization: log.organization
          ? {
              id: log.organization.id,
              name: log.organization.name,
              slug: log.organization.slug,
            }
          : null,
      };
    });

    return NextResponse.json({
      data: formattedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalCount,
        billsCount,
        productsCount,
        todayCount,
      },
    });
  } catch (error) {
    console.error("[AUDIT_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
