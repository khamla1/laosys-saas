import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getDateRanges, calculateGrowth, DateRangeType } from "@/lib/analytics";

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

    const baseWhereClause: any = {
      status: { in: ["PAID", "COMPLETED", "SHIPPED"] },
    };
    if (!isAdmin) {
      baseWhereClause.userId = userId;
    }

    const { currentStart, currentEnd, previousStart, previousEnd } = getDateRanges(range);

    // Current Period Order Items (to get quantities)
    const currentOrderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          ...baseWhereClause,
          createdAt: { gte: currentStart, lte: currentEnd }
        }
      },
      include: { product: true }
    });

    let currentProductsSold = 0;
    const productSalesMap: Record<string, { id: string, name: string, quantity: number, revenue: number, category: string }> = {};

    currentOrderItems.forEach(item => {
      currentProductsSold += item.quantity;
      const pid = item.productId;
      if (!productSalesMap[pid]) {
        productSalesMap[pid] = {
          id: pid,
          name: item.product?.name || "Unknown Product",
          quantity: 0,
          revenue: 0,
          category: item.product?.category || "Uncategorized"
        };
      }
      productSalesMap[pid].quantity += item.quantity;
      productSalesMap[pid].revenue += (item.quantity * item.price);
    });

    // Previous Period Order Items
    const previousOrderItems = await prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        order: {
          ...baseWhereClause,
          createdAt: { gte: previousStart, lte: previousEnd }
        }
      }
    });

    const previousProductsSold = previousOrderItems._sum.quantity || 0;
    const growth = calculateGrowth(currentProductsSold, previousProductsSold);

    const productsList = Object.values(productSalesMap);
    
    // Top Products by Quantity
    const topProducts = [...productsList].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    
    // Revenue Rankings
    const revenueRankings = [...productsList].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Lowest Selling Products (non-zero sales only to avoid listing dead products, or could just take bottom)
    const lowestSellingProducts = [...productsList].sort((a, b) => a.quantity - b.quantity).slice(0, 5);
    
    // Category Distribution
    const categoryMap: Record<string, number> = {};
    productsList.forEach(p => {
      if (!categoryMap[p.category]) categoryMap[p.category] = 0;
      categoryMap[p.category] += p.revenue;
    });
    const categoryDistribution = Object.keys(categoryMap).map(name => ({
      name,
      value: categoryMap[name]
    })).sort((a, b) => b.value - a.value);

    return NextResponse.json({
      current: currentProductsSold,
      previous: previousProductsSold,
      growth,
      topProducts,
      revenueRankings,
      lowestSellingProducts,
      categoryDistribution
    });

  } catch (error: any) {
    console.error("Products Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch products analytics" }, { status: 500 });
  }
}
