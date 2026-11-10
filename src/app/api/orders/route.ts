import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // Max 60 requests per minute per user

function applyRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRate = rateLimitMap.get(userId);

  if (!userRate) {
    rateLimitMap.set(userId, { count: 1, lastReset: now });
    return true;
  }

  if (now - userRate.lastReset > RATE_LIMIT_WINDOW_MS) {
    userRate.count = 1;
    userRate.lastReset = now;
    return true;
  }

  if (userRate.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  userRate.count += 1;
  return true;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 1. Authentication Check
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id: userId, role, organizationId } = session.user as any;

    if (!userId || !role) {
      return NextResponse.json({ error: "Invalid user session data" }, { status: 401 });
    }

    // 2. Rate Limiting Check
    if (!applyRateLimit(userId)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    // 3. Input Validation (Pagination)
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const cursorParam = searchParams.get("cursor");
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "";
    const dateFilter = searchParams.get("dateFilter") || "";
    const sellerId = searchParams.get("sellerId") || "";
    
    // Default to 50, min 1, max 100 (reduced for payload safety on mobile networks)
    const take = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 100) : 50;

    // 4. Access Control (Tenant Isolation)
    let storeId = organizationId || userId;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN" && !storeId) {
      return NextResponse.json({ error: "Missing organization configuration" }, { status: 403 });
    }

    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    const where: any = isAdmin ? {} : { organizationId: storeId };

    if (isAdmin && sellerId && sellerId !== "ALL") {
      where.organizationId = sellerId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (dateFilter && dateFilter !== "ALL") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (dateFilter === "TODAY") {
        where.createdAt = { gte: today };
      } else if (dateFilter === "WEEK") {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        where.createdAt = { gte: lastWeek };
      } else if (dateFilter === "MONTH") {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        where.createdAt = { gte: firstDayOfMonth };
      }
    }

    if (search) {
      const q = search.replace(/^(id:|id|#|ລະຫັດບິນ|ລະຫັດ|ບິນ|รหัสบิล|รหัส|บิล)\s*/i, "");
      const orConditions: any[] = [
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q, mode: "insensitive" } },
      ];
      if (/^[0-9a-fA-F]{24}$/.test(q)) {
        orConditions.push({ id: q });
      }
      where.OR = orConditions;
    }

    const selectFields: any = {
      id: true,
      totalAmount: true,
      status: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      customerAddress: true,
      customerNote: true,
      paymentSlipUrl: true,
      couponId: true,
      couponCode: true,
      discountAmount: true,
      createdAt: true,
      updatedAt: true,
      organizationId: true,
      table: {
        select: {
          id: true,
          name: true,
        }
      },
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          productId: true,
        }
      },
      ...(isAdmin && {
        organization: {
          select: {
            id: true,
            name: true,
          }
        }
      })
    };

    if (pageParam) {
      const page = Math.max(parseInt(pageParam, 10) || 1, 1);
      const skip = (page - 1) * take;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take,
          orderBy: [
            { createdAt: "desc" },
            { id: "desc" }
          ],
          select: selectFields,
        }),
        prisma.order.count({ where }),
      ]);

      return NextResponse.json({
        data: orders,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      });
    }

    // 5. Optimized Database Query & Field Selection (Legacy Cursor Mode)
    const orders = await logger.trackQuery("GET /api/orders (findMany)", () => prisma.order.findMany({
      where,
      take,
      ...(cursorParam ? { skip: 1, cursor: { id: cursorParam } } : {}),
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" }
      ],
      select: selectFields,
    }), 200);

    // 6. Return Response with Enterprise Caching
    return NextResponse.json(orders, {
      headers: {
        // Edge CDN Cache 10s, stale-while-revalidate 30s
        'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=30',
        'Vary': 'Cookie' // Ensure tenant isolation in shared caches
      }
    });
  } catch (error) {
    console.error("[ORDERS_GET_ERROR]", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

