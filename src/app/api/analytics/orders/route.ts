import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getDateRanges, calculateGrowth, DateRangeType } from "@/lib/analytics";
import { format } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as DateRangeType) || "month";
    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isAdmin = role === "ADMIN";

    const baseWhereClause: any = {};
    if (!isAdmin) {
      baseWhereClause.userId = userId;
    }

    const { currentStart, currentEnd, previousStart, previousEnd } = getDateRanges(range);

    // Current Period
    const currentOrders = await prisma.order.findMany({
      where: {
        ...baseWhereClause,
        createdAt: { gte: currentStart, lte: currentEnd }
      },
      select: { createdAt: true, status: true, totalAmount: true }
    });

    const currentOrdersCount = currentOrders.length;
    let totalRevenue = 0;
    
    // Status Distribution
    const statusMap: Record<string, number> = {};
    
    // Trend Map
    const trendMap: Record<string, number> = {};

    currentOrders.forEach(order => {
      totalRevenue += order.totalAmount;
      
      // Status
      if (!statusMap[order.status]) statusMap[order.status] = 0;
      statusMap[order.status] += 1;

      // Trend
      let dateKey = "";
      if (range === "today") {
        dateKey = format(order.createdAt, "HH:00");
      } else if (range === "week" || range === "month") {
        dateKey = format(order.createdAt, "MMM dd");
      } else {
        dateKey = format(order.createdAt, "MMM yyyy");
      }

      if (!trendMap[dateKey]) trendMap[dateKey] = 0;
      trendMap[dateKey] += 1;
    });

    const averageOrderValue = currentOrdersCount > 0 ? totalRevenue / currentOrdersCount : 0;

    // Previous Period
    const previousOrdersCount = await prisma.order.count({
      where: {
        ...baseWhereClause,
        createdAt: { gte: previousStart, lte: previousEnd }
      }
    });
    
    const growth = calculateGrowth(currentOrdersCount, previousOrdersCount);

    const trend = Object.keys(trendMap).map(date => ({
      date,
      orders: trendMap[date]
    }));
    
    // Sort trend dates (rough sorting)
    trend.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const statusDistribution = Object.keys(statusMap).map(status => ({
      name: status,
      value: statusMap[status]
    }));

    return NextResponse.json({
      current: currentOrdersCount,
      previous: previousOrdersCount,
      growth,
      averageOrderValue,
      statusDistribution,
      trend
    });

  } catch (error: any) {
    console.error("Orders Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch orders analytics" }, { status: 500 });
  }
}
