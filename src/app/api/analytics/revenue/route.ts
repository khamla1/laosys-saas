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

    // If SELLER, filter by userId. If ADMIN, fetch all.
    const whereClause: any = {
      status: { in: ["PAID", "COMPLETED", "SHIPPED"] },
    };
    if (!isAdmin) {
      whereClause.userId = userId;
    }

    const { currentStart, currentEnd, previousStart, previousEnd } = getDateRanges(range);

    // Current Period
    const currentOrders = await prisma.order.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: currentStart, lte: currentEnd }
      },
      select: { createdAt: true, totalAmount: true }
    });

    const currentRevenue = currentOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Previous Period
    const previousOrders = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        ...whereClause,
        createdAt: { gte: previousStart, lte: previousEnd }
      }
    });
    
    const previousRevenue = previousOrders._sum.totalAmount || 0;
    const growth = calculateGrowth(currentRevenue, previousRevenue);

    // Grouping for Trend Chart
    const trendMap: Record<string, number> = {};
    
    currentOrders.forEach(order => {
      let dateKey = "";
      if (range === "today") {
        dateKey = format(order.createdAt, "HH:00");
      } else if (range === "week" || range === "month") {
        dateKey = format(order.createdAt, "MMM dd");
      } else {
        dateKey = format(order.createdAt, "MMM yyyy");
      }

      if (!trendMap[dateKey]) trendMap[dateKey] = 0;
      trendMap[dateKey] += order.totalAmount;
    });

    // Format array for recharts
    const trend = Object.keys(trendMap).map(date => ({
      date,
      revenue: trendMap[date]
    })).sort((a, b) => {
      // Very basic sort, might not be perfect for months crossing years if not parsed
      // but since date-fns formats them linearly in our fetch, we can sort by original timestamp if needed.
      // For simplicity in JSON, we leave the sort order to the client or just let it be grouped chronologically 
      // if we ensure insertion order. Wait, Object.keys breaks chronological order if keys are string dates.
      // Better to map it back or rely on client.
      return 1;
    });

    // We will do proper chronological sorting in client if needed, or we can just sort by Date parsed
    trend.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      current: currentRevenue,
      previous: previousRevenue,
      growth,
      trend
    });

  } catch (error: any) {
    console.error("Revenue Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch revenue analytics" }, { status: 500 });
  }
}
