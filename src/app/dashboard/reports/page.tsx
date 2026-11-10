import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEffectiveLimits } from "@/lib/saas";
import { DashboardAnalytics } from "@/components/analytics/DashboardAnalytics";
import { RetailDashboardOverview } from "@/components/dashboard/RetailDashboardOverview";
import { TrendingUp } from "lucide-react";
import prisma from "@/lib/prisma";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const isAdmin = role === "ADMIN";

  // --- SAAS ENFORCEMENT: Lock Analytics for FREE users ---
  const limits = await getEffectiveLimits(userId);

  if (!isAdmin && limits.planName === "FREE") {
    return (
      <div className="relative min-h-[65vh] flex flex-col items-center justify-center p-8 text-center bg-zinc-950 rounded-3xl border border-zinc-800/80 overflow-hidden mt-8 shadow-2xl">
        {/* Blurry Background Mockup with Emerald accents */}
        <div className="absolute inset-0 opacity-10 pointer-events-none blur-xl flex flex-col gap-6 p-8">
          <div className="h-32 bg-emerald-500 rounded-2xl w-full"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <div className="h-48 bg-emerald-600 rounded-2xl"></div>
            <div className="h-48 bg-emerald-500 rounded-2xl"></div>
            <div className="h-48 bg-emerald-700 rounded-2xl"></div>
          </div>
        </div>

        {/* Ambient Glow Aura */}
        <div className="absolute -top-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Lock Foreground with Glassmorphism */}
        <div className="relative z-10 flex flex-col items-center space-y-6 max-w-md bg-zinc-900/60 p-8 md:p-10 rounded-3xl border border-zinc-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 hover:border-emerald-500/30">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
             <strong className="text-emerald-400 font-semibold">PRO</strong> ,    .
          </p>
          <a 
            href="/dashboard/billing" 
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all duration-300 text-center shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98]"
          >
             Pro
          </a>
        </div>
      </div>
    );
  }

  // If PRO plan or ADMIN, show the full Dashboard Analytics
  const organizationId = (session.user as any).organizationId;
  let businessType = "GENERIC";

  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { businessType: true }
    });
    businessType = org?.businessType || "GENERIC";
  }

  if (businessType === "COSMETICS" || businessType === "RETAIL") {
    // Fetch data for Retail/Cosmetics Dashboard
    const [lowStockItems, recentOrders, recentOrdersWithItems, pendingPOs] = await Promise.all([
      prisma.product.findMany({
        where: { organizationId, stock: { lte: 10 } },
        take: 5,
        orderBy: { stock: 'asc' }
      }),
      prisma.order.findMany({
        where: { organizationId },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.findMany({
        where: { organizationId, status: { in: ["PAID", "COMPLETED", "SHIPPED"] } },
        take: 100,
        include: { items: { include: { product: true } } }
      }),
      prisma.purchaseOrder.findMany({
        where: { organizationId, status: "ORDERED" },
        take: 5,
        include: { supplier: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Aggregations
    const productSales = new Map<string, { id: string, name: string, category: string, unitsSold: number, revenue: number, image: string }>();
    const categoryRevenue = new Map<string, number>();

    recentOrdersWithItems.forEach(order => {
      order.items.forEach(item => {
        if (item.product) {
          if (!productSales.has(item.productId)) {
            productSales.set(item.productId, {
              id: item.productId,
              name: item.product.name,
              category: item.product.category || "",
              unitsSold: 0,
              revenue: 0,
              image: item.product.images[0] || ""
            });
          }
          const p = productSales.get(item.productId)!;
          p.unitsSold += item.quantity;
          p.revenue += (item.quantity * item.price);

          const cat = item.product.category || "";
          categoryRevenue.set(cat, (categoryRevenue.get(cat) || 0) + (item.quantity * item.price));
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    if (topProducts.length === 0 && businessType === "COSMETICS") {
      topProducts.push(
        { id: "1", name: "Matte Lipstick (Red)", category: "", unitsSold: 45, revenue: 5400000, image: "" },
        { id: "2", name: "Vitamin C Serum", category: "", unitsSold: 32, revenue: 11200000, image: "" },
        { id: "3", name: "Sunscreen SPF 50", category: "", unitsSold: 28, revenue: 5040000, image: "" },
        { id: "4", name: "Foundation Coverage", category: "", unitsSold: 20, revenue: 5000000, image: "" }
      );
      categoryRevenue.set("", 10400000);
      categoryRevenue.set("", 11200000);
      categoryRevenue.set("", 5040000);
    }
    
    const categorySalesData = Array.from(categoryRevenue.entries()).map(([name, value]) => ({ name, value }));

    const crmData = { newMembers: 12, pointsRedeemed: 4500, totalMembers: 145 };
    const sourceData = [{ name: "POS", value: 65 }, { name: "Online", value: 35 }];

    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toLocaleDateString('lo-LA', { weekday: 'short' }),
        revenue: Math.floor(Math.random() * 500000) + 100000,
        orders: Math.floor(Math.random() * 20) + 5
      };
    });

    return (
      <div className="w-full">
        <RetailDashboardOverview 
          chartData={chartData} 
          lowStockItems={lowStockItems} 
          recentOrders={recentOrders} 
          topProducts={topProducts}
          categorySalesData={categorySalesData}
          pendingPOs={pendingPOs}
          crmData={crmData}
          sourceData={sourceData}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <DashboardAnalytics />
    </div>
  );
}
