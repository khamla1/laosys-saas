import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const limit = parseInt(searchParams.get("limit") || (pageParam ? "20" : "200"), 10);
    const organizationId = searchParams.get("organizationId");
    const organizationName = searchParams.get("organizationName");
    const action = searchParams.get("action");
    const search = (searchParams.get("search") || "").trim();
    const includeStats = searchParams.get("stats") === "true";

    const where: any = {};
    if (organizationId && organizationId !== "ALL") {
      where.organizationId = organizationId;
    }
    if (organizationName && organizationName !== "ALL") {
      if (organizationName === "ທົ່ວລະບົບ") {
        where.organizationId = null;
      } else {
        where.organization = { name: organizationName };
      }
    }
    if (action && action !== "ALL") {
      if (action === "LOGIN") {
        where.OR = [
          { action: { contains: "LOGIN", mode: "insensitive" } },
          { action: { contains: "LOGOUT", mode: "insensitive" } },
          { action: { contains: "AUTH", mode: "insensitive" } },
        ];
      } else if (action === "SECURITY") {
        where.OR = [
          { action: { contains: "FAIL", mode: "insensitive" } },
          { action: { contains: "LOCK", mode: "insensitive" } },
          { action: { contains: "BLOCK", mode: "insensitive" } },
        ];
      } else {
        where.action = { contains: action, mode: "insensitive" };
      }
    }
    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { organization: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (pageParam) {
      const page = Math.max(parseInt(pageParam, 10) || 1, 1);
      const take = Math.min(Math.max(limit || 20, 1), 100);
      const skip = (page - 1) * take;

      const [logs, total, statsData] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
        }),
        prisma.auditLog.count({ where }),
        includeStats
          ? Promise.all([
              prisma.auditLog.count(),
              prisma.auditLog.count({ where: { action: { contains: "UPDATE", mode: "insensitive" } } }),
              prisma.auditLog.count({ where: { action: { contains: "DELETE", mode: "insensitive" } } }),
              prisma.auditLog.count({
                where: {
                  OR: [
                    { action: { contains: "LOGIN", mode: "insensitive" } },
                    { action: { contains: "LOGOUT", mode: "insensitive" } },
                  ]
                }
              }),
              prisma.auditLog.count({
                where: {
                  OR: [
                    { action: { contains: "FAIL", mode: "insensitive" } },
                    { action: { contains: "LOCK", mode: "insensitive" } },
                    { action: { contains: "BLOCK", mode: "insensitive" } },
                  ]
                }
              }),
              prisma.organization.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
            ])
          : Promise.resolve(null),
      ]);

      const formattedLogs = logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: (log.metadata as any)?.entityType || log.action.split("_")[0] || "SYSTEM",
        entityId: (log.metadata as any)?.entityId || "",
        details: log.details || "",
        ipAddress: log.ipAddress || (log.metadata as any)?.ipAddress || null,
        metadata: (log.metadata as Record<string, any>) || {},
        createdAt: log.createdAt,
        user: log.user ? { id: log.user.id, name: log.user.name || log.user.email, email: log.user.email, role: log.user.role } : undefined,
        organization: log.organization ? { id: log.organization.id, name: log.organization.name, slug: log.organization.slug } : undefined,
      }));

      return NextResponse.json({
        data: formattedLogs,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
        ...(statsData
          ? {
              stats: {
                total: statsData[0],
                updates: statsData[1],
                deletions: statsData[2],
                logins: statsData[3],
                security: statsData[4],
                orgs: statsData[5].map((o) => o.name).filter(Boolean),
              },
            }
          : {}),
      });
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit > 500 ? 500 : limit,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: (log.metadata as any)?.entityType || log.action.split("_")[0] || "SYSTEM",
      entityId: (log.metadata as any)?.entityId || "",
      details: log.details || "",
      ipAddress: log.ipAddress || (log.metadata as any)?.ipAddress || null,
      metadata: (log.metadata as Record<string, any>) || {},
      createdAt: log.createdAt,
      user: log.user ? { id: log.user.id, name: log.user.name || log.user.email, email: log.user.email, role: log.user.role } : undefined,
      organization: log.organization ? { id: log.organization.id, name: log.organization.name, slug: log.organization.slug } : undefined,
    }));

    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error("[ADMIN_LOGS_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
