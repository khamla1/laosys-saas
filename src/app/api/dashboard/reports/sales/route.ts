import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    const organizationId = user.organizationId;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (!organizationId && !isAdmin) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "30D";

    const now = new Date();
    let startDate = new Date();

    if (range === "TODAY") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "7D") {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "30D") {
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "YEAR") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(2020, 0, 1);
    }

    const orgFilter = organizationId ? { organizationId } : {};

    // Fetch orders in date range
    const orders = await prisma.order.findMany({
      where: {
        ...orgFilter,
        status: { in: ["PAID", "COMPLETED", "SHIPPED"] },
        createdAt: { gte: startDate },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, category: true, metadata: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch expenses from Purchase Orders in date range safely
    let totalExpenses = 0;
    try {
      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: {
          ...orgFilter,
          status: { in: ["ORDERED", "RECEIVED"] },
          createdAt: { gte: startDate },
        },
        select: { totalAmount: true, status: true },
      });
      totalExpenses = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    } catch (poErr) {
      console.warn("[Reports/Sales] PurchaseOrder query error (non-fatal):", poErr);
    }

    // Calculate sales metrics
    let totalRevenue = 0;
    let totalEstimatedCost = 0;
    const customerSet = new Set<string>();
    const paymentMap: Record<string, { count: number; amount: number }> = {};
    const productSalesMap = new Map<string, { id: string; name: string; sold: number; revenue: number }>();

    for (const order of orders) {
      totalRevenue += Number(order.totalAmount) || 0;

      const custKey = order.customerPhone || order.customerName;
      if (custKey) customerSet.add(custKey.trim().toLowerCase());

      const method = order.paymentMethod || "CASH";
      if (!paymentMap[method]) {
        paymentMap[method] = { count: 0, amount: 0 };
      }
      paymentMap[method].count += 1;
      paymentMap[method].amount += Number(order.totalAmount) || 0;

      for (const item of order.items) {
        const prod = item.product;
        const qty = item.quantity || 1;
        const unitPrice = Number(item.price) || Number(prod?.price) || 0;
        const itemRev = unitPrice * qty;

        const costPrice = (prod?.metadata as any)?.costPrice || (prod?.price ? prod.price * 0.6 : 0);
        const itemCost = Number(costPrice) * qty;
        totalEstimatedCost += itemCost;

        if (prod) {
          if (!productSalesMap.has(prod.id)) {
            productSalesMap.set(prod.id, {
              id: prod.id,
              name: prod.name,
              sold: 0,
              revenue: 0,
            });
          }
          const rec = productSalesMap.get(prod.id)!;
          rec.sold += qty;
          rec.revenue += itemRev;
        }
      }
    }

    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const grossProfit = totalRevenue - totalEstimatedCost;
    const profitMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
    const netProfit = totalRevenue - (totalEstimatedCost > 0 ? totalEstimatedCost : totalExpenses);

    // Build timeline buckets
    const timelineMap = new Map<string, { label: string; revenue: number; orders: number }>();

    if (range === "TODAY") {
      for (let h = 8; h <= 22; h += 2) {
        const key = `${h}:00`;
        timelineMap.set(key, { label: key, revenue: 0, orders: 0 });
      }
      for (const o of orders) {
        const hour = new Date(o.createdAt).getHours();
        const bucket = `${Math.floor(hour / 2) * 2}:00`;
        if (timelineMap.has(bucket)) {
          const item = timelineMap.get(bucket)!;
          item.revenue += Number(o.totalAmount) || 0;
          item.orders += 1;
        }
      }
    } else if (range === "7D" || range === "30D") {
      if (range === "7D") {
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(5, 10);
          const dayName = ["ອາທິດ", "ຈັນ", "ອັງຄານ", "ພຸດ", "ພະຫັດ", "ສຸກ", "ເສົາ"][d.getDay()];
          timelineMap.set(key, { label: `${dayName} (${key})`, revenue: 0, orders: 0 });
        }
        for (const o of orders) {
          const key = new Date(o.createdAt).toISOString().slice(5, 10);
          if (timelineMap.has(key)) {
            const item = timelineMap.get(key)!;
            item.revenue += Number(o.totalAmount) || 0;
            item.orders += 1;
          }
        }
      } else {
        // 4 Weeks
        for (let w = 1; w <= 4; w++) {
          timelineMap.set(`W${w}`, { label: `ອາທິດທີ ${w}`, revenue: 0, orders: 0 });
        }
        for (const o of orders) {
          const diffDays = Math.floor((now.getTime() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          const weekNum = Math.min(4, Math.max(1, 4 - Math.floor(diffDays / 7)));
          const item = timelineMap.get(`W${weekNum}`);
          if (item) {
            item.revenue += Number(o.totalAmount) || 0;
            item.orders += 1;
          }
        }
      }
    } else {
      // YEAR (12 Months)
      const months = ["ມ.ກ", "ກ.ພ", "ມ.ນ", "ມ.ສ", "ພ.ພ", "ມິ.ຖ", "ກ.ລ", "ສ.ຫ", "ກ.ຍ", "ຕ.ລ", "ພ.ຈ", "ທ.ວ"];
      for (let m = 0; m < 12; m++) {
        timelineMap.set(`M${m}`, { label: months[m], revenue: 0, orders: 0 });
      }
      for (const o of orders) {
        const m = new Date(o.createdAt).getMonth();
        const item = timelineMap.get(`M${m}`);
        if (item) {
          item.revenue += Number(o.totalAmount) || 0;
          item.orders += 1;
        }
      }
    }

    const timeline = Array.from(timelineMap.values());
    const maxTimelineRev = Math.max(1, ...timeline.map((t) => t.revenue));
    const timelineWithHeights = timeline.map((t) => ({
      ...t,
      heightPercent: Math.max(12, Math.round((t.revenue / maxTimelineRev) * 100)),
    }));

    // Top 5 Products
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      range,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalCustomers: customerSet.size,
      totalExpenses,
      grossProfit,
      profitMargin,
      netProfit,
      timeline: timelineWithHeights,
      topProducts,
      paymentMethods: Object.entries(paymentMap).map(([method, val]) => ({
        method,
        count: val.count,
        amount: val.amount,
      })),
    });
  } catch (error: any) {
    console.error("[Reports/Sales GET Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
