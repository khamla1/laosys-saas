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

    // Current Period Orders
    const currentOrders = await prisma.order.findMany({
      where: {
        ...baseWhereClause,
        createdAt: { gte: currentStart, lte: currentEnd }
      },
      select: { customerPhone: true, customerEmail: true, customerName: true, totalAmount: true }
    });

    const customerMap: Record<string, { name: string, spend: number, orders: number }> = {};

    currentOrders.forEach(order => {
      // Use phone as primary identifier, fallback to email, fallback to name
      const identifier = order.customerPhone || order.customerEmail || order.customerName || "Unknown";
      if (!customerMap[identifier]) {
        customerMap[identifier] = { name: order.customerName || "Unknown", spend: 0, orders: 0 };
      }
      customerMap[identifier].spend += order.totalAmount;
      customerMap[identifier].orders += 1;
    });

    const currentCustomersCount = Object.keys(customerMap).length;

    // Previous Period Orders
    const previousOrders = await prisma.order.findMany({
      where: {
        ...baseWhereClause,
        createdAt: { gte: previousStart, lte: previousEnd }
      },
      select: { customerPhone: true, customerEmail: true, customerName: true }
    });

    const prevCustomerMap: Record<string, boolean> = {};
    previousOrders.forEach(order => {
      const identifier = order.customerPhone || order.customerEmail || order.customerName || "Unknown";
      prevCustomerMap[identifier] = true;
    });

    const previousCustomersCount = Object.keys(prevCustomerMap).length;
    const growth = calculateGrowth(currentCustomersCount, previousCustomersCount);

    // Top Customers
    const topCustomers = Object.keys(customerMap).map(id => ({
      id,
      name: customerMap[id].name,
      spend: customerMap[id].spend,
      orders: customerMap[id].orders
    })).sort((a, b) => b.spend - a.spend).slice(0, 10);

    // Retention (New vs Returning)
    // We check if the current customers existed before the current period
    let newCount = 0;
    let returningCount = 0;

    if (currentCustomersCount > 0) {
      // Fetch all historical orders before currentStart for these customers to see if they are new or returning
      // To prevent massive IN clauses, we can just aggregate or fetch distinct.
      // Since MongoDB doesn't support massive distincts easily in Prisma without raw, we'll approximate:
      // If we are looking at 'today' or 'week', they might have ordered last month.
      const identifiers = Object.keys(customerMap).filter(id => id !== "Unknown");
      
      const historicalOrders = await prisma.order.findMany({
        where: {
          ...baseWhereClause,
          createdAt: { lt: currentStart },
          OR: [
            { customerPhone: { in: identifiers } },
            { customerEmail: { in: identifiers } }
          ]
        },
        select: { customerPhone: true, customerEmail: true }
      });

      const historicalSet = new Set();
      historicalOrders.forEach(o => {
        if (o.customerPhone) historicalSet.add(o.customerPhone);
        if (o.customerEmail) historicalSet.add(o.customerEmail);
      });

      identifiers.forEach(id => {
        if (historicalSet.has(id)) {
          returningCount++;
        } else {
          newCount++;
        }
      });
      
      // Add unknown customers to new
      newCount += (currentCustomersCount - identifiers.length);
    }

    const retention = [
      { name: "New Customers", value: newCount },
      { name: "Returning Customers", value: returningCount }
    ];

    return NextResponse.json({
      current: currentCustomersCount,
      previous: previousCustomersCount,
      growth,
      topCustomers,
      retention
    });

  } catch (error: any) {
    console.error("Customers Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch customers analytics" }, { status: 500 });
  }
}
