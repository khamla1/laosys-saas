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
    const category = url.searchParams.get("category") || "ALL";

    const orgFilter = organizationId ? { organizationId } : {};

    // Fetch all categories for filter tabs
    const categories = await prisma.category.findMany({
      where: orgFilter,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // Fetch products
    const products = await prisma.product.findMany({
      where: {
        ...orgFilter,
        ...(category !== "ALL" ? { category } : {}),
      },
    });

    // Fetch order items with completed orders
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          ...orgFilter,
          status: { in: ["PAID", "COMPLETED", "SHIPPED"] },
        },
        ...(category !== "ALL" ? { product: { category } } : {}),
      },
      select: {
        productId: true,
        quantity: true,
        price: true,
      },
    });

    // Aggregate sales by product
    const salesMap = new Map<string, { totalSold: number; totalRevenue: number }>();
    for (const item of orderItems) {
      if (!item.productId) continue;
      if (!salesMap.has(item.productId)) {
        salesMap.set(item.productId, { totalSold: 0, totalRevenue: 0 });
      }
      const rec = salesMap.get(item.productId)!;
      const qty = item.quantity || 1;
      rec.totalSold += qty;
      rec.totalRevenue += (Number(item.price) || 0) * qty;
    }

    // Combine product info with sales
    const trendingItems = products.map((prod) => {
      const sales = salesMap.get(prod.id) || { totalSold: 0, totalRevenue: 0 };
      const stock = prod.stock || 0;
      let stockStatus = "IN_STOCK";
      if (stock === 0) stockStatus = "OUT_OF_STOCK";
      else if (stock <= 5) stockStatus = "LOW_STOCK";

      // Suggested replenishment: if high demand, restock 3x sold or min 10
      const restockSuggested = sales.totalSold > 0 ? Math.max(10, sales.totalSold * 2) : 10;

      return {
        id: prod.id,
        name: prod.name,
        barcode: (prod.metadata as any)?.barcode || "-",
        categoryName: prod.category || "ທົ່ວໄປ",
        price: prod.price || 0,
        costPrice: (prod.metadata as any)?.costPrice || 0,
        stock,
        stockStatus,
        totalSold: sales.totalSold,
        totalRevenue: sales.totalRevenue,
        restockSuggested,
      };
    });

    // Sort by sales (units sold, then revenue, then stock)
    trendingItems.sort((a, b) => {
      if (b.totalSold !== a.totalSold) return b.totalSold - a.totalSold;
      return b.totalRevenue - a.totalRevenue;
    });

    // Key summaries
    const totalSoldAll = trendingItems.reduce((sum, item) => sum + item.totalSold, 0);
    const totalRevenueAll = trendingItems.reduce((sum, item) => sum + item.totalRevenue, 0);
    const lowStockCount = trendingItems.filter((i) => i.stockStatus === "LOW_STOCK").length;
    const outOfStockCount = trendingItems.filter((i) => i.stockStatus === "OUT_OF_STOCK").length;

    return NextResponse.json({
      categories,
      totalSoldAll,
      totalRevenueAll,
      lowStockCount,
      outOfStockCount,
      items: trendingItems,
    });
  } catch (error: any) {
    console.error("[Reports/Trending GET Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
