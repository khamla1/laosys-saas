import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderTableClient } from "@/components/OrderTableClient";
import { ShoppingCart, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) return null;

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const isAdmin = role === "ADMIN";

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "la";
  const dicts = getDictionary(locale);
  const { orders: t, orderTable } = dicts;

  // Calculate Daily Summary using Prisma
  const now = new Date();
  
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

  const organizationId = (session.user as any).organizationId;
  const whereClause = isAdmin ? {} : { organizationId };

  const [orders, totalOrdersCount, todayData, yesterdayData, todayCount, yesterdayCount, sellers] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      take: 20, // Load 20 per page as requested
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        customerAddress: true,
        customerNote: true,
        paymentSlipUrl: true,
        createdAt: true,
        organizationId: true,
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            productId: true,
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              }
            }
          }
        },
        table: {
          select: {
            id: true,
            name: true,
          }
        },
        ...(isAdmin && {
          organization: {
            select: {
              name: true,
            }
          }
        })
      }
    }),
    prisma.order.count({ where: whereClause }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { ...whereClause, createdAt: { gte: startOfToday }, status: { in: ["PAID", "COMPLETED", "SHIPPED"] } }
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { ...whereClause, createdAt: { gte: startOfYesterday, lte: endOfYesterday }, status: { in: ["PAID", "COMPLETED", "SHIPPED"] } }
    }),
    prisma.order.count({
      where: { ...whereClause, createdAt: { gte: startOfToday } }
    }),
    prisma.order.count({
      where: { ...whereClause, createdAt: { gte: startOfYesterday, lte: endOfYesterday } }
    }),
    isAdmin ? prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    }) : Promise.resolve([])
  ]);

  const todayRevenue = todayData._sum.totalAmount || 0;
  const yesterdayRevenue = yesterdayData._sum.totalAmount || 0;
  const todayOrdersCount = todayCount;
  const yesterdayOrdersCount = yesterdayCount;

  // Calculate Growth (Avoid division by zero)
  const revenueGrowth = yesterdayRevenue === 0 
    ? (todayRevenue > 0 ? 100 : 0) 
    : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    
  const ordersGrowth = yesterdayOrdersCount === 0 
    ? (todayOrdersCount > 0 ? 100 : 0) 
    : ((todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">{t.title}</h2>
        <p className="text-zinc-400 mt-1">{t.desc}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
        <Card className="group relative overflow-hidden bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 sm:pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400 truncate">{t.todaysRevenue}</CardTitle>
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-white truncate">₭{todayRevenue.toLocaleString()}</div>
            <div className="flex items-center mt-1 text-[11px] sm:text-xs">
              {revenueGrowth >= 0 ? (
                <span className="text-emerald-400 flex items-center gap-1"><TrendingUp size={12}/> +{revenueGrowth.toFixed(1)}%</span>
              ) : (
                <span className="text-red-400 flex items-center gap-1"><TrendingDown size={12}/> {revenueGrowth.toFixed(1)}%</span>
              )}
              <span className="text-zinc-500 ml-1.5 sm:ml-2 truncate">{t.fromYesterday}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all duration-500">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-500/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 sm:pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400 truncate">{t.todaysOrders}</CardTitle>
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-white">{todayOrdersCount}</div>
            <div className="flex items-center mt-1 text-[11px] sm:text-xs">
              {ordersGrowth >= 0 ? (
                <span className="text-emerald-400 flex items-center gap-1"><TrendingUp size={12}/> +{ordersGrowth.toFixed(1)}%</span>
              ) : (
                <span className="text-red-400 flex items-center gap-1"><TrendingDown size={12}/> {ordersGrowth.toFixed(1)}%</span>
              )}
              <span className="text-zinc-500 ml-1.5 sm:ml-2 truncate">{t.fromYesterday}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1 group relative overflow-hidden bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] transition-all duration-500">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-orange-500/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 sm:pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400 truncate">{t.avgOrderValue}</CardTitle>
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-white">
              ₭{todayOrdersCount > 0 ? Math.round(todayRevenue / todayOrdersCount).toLocaleString() : 0}
            </div>
            <div className="flex items-center mt-1 text-[11px] sm:text-xs text-zinc-500">
              {t.perOrderAvg}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-200">{t.orderHistory}</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTableClient 
            orders={orders as any} 
            initialTotal={totalOrdersCount}
            isAdmin={isAdmin} 
            t={orderTable} 
            statusDict={dicts.status} 
            sellers={sellers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
