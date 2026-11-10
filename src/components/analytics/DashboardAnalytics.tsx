"use client";

import { useState } from "react";
import { useAnalytics } from "./useAnalytics";
import { DateRangeType } from "@/lib/analytics";
import { KPIGrid } from "./KPIGrid";
import { RevenueTrendChart } from "./RevenueTrendChart";
import { OrdersAnalyticsRow } from "./OrdersAnalyticsRow";
import { ProductsAnalyticsRow } from "./ProductsAnalyticsRow";
import { CustomersAnalyticsRow } from "./CustomersAnalyticsRow";
import { BusinessPerformanceGrid } from "./BusinessPerformanceGrid";
import { Calendar } from "lucide-react";

export function DashboardAnalytics() {
  const [range, setRange] = useState<DateRangeType>("month");

  const { data: revenueData, isLoading: revenueLoading } = useAnalytics("revenue", range);
  const { data: ordersData, isLoading: ordersLoading } = useAnalytics("orders", range);
  const { data: productsData, isLoading: productsLoading } = useAnalytics("products", range);
  const { data: customersData, isLoading: customersLoading } = useAnalytics("customers", range);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Analytics Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500">
            ວິເຄາະທຸລະກິດຂັ້ນສູງ
          </h2>
          <p className="text-zinc-400 mt-1">ລາຍງານການວິເຄາະ ແລະ ວັດແທກປະສິດທິພາບຂອງຮ້ານຄ້າຢ່າງລະອຽດ.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-1 px-4 backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30">
          <Calendar size={16} className="text-emerald-400" />
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value as DateRangeType)}
            className="bg-transparent border-none text-zinc-200 focus:ring-0 focus:outline-none py-2 text-sm cursor-pointer font-medium"
          >
            <option value="today" className="bg-zinc-950 text-zinc-200">ມື້ນີ້</option>
            <option value="week" className="bg-zinc-950 text-zinc-200">ອາທິດນີ້</option>
            <option value="month" className="bg-zinc-950 text-zinc-200">ເດືອນນີ້</option>
            <option value="year" className="bg-zinc-950 text-zinc-200">ປີນີ້</option>
            <option value="all" className="bg-zinc-950 text-zinc-200">ທັງໝົດ</option>
          </select>
        </div>
      </div>

      {/* Row 1: KPI Grid */}
      <KPIGrid 
        revenue={revenueData} 
        orders={ordersData} 
        products={productsData} 
        customers={customersData} 
        isLoading={revenueLoading || ordersLoading || productsLoading || customersLoading} 
      />

      {/* Row 2: Revenue Trend */}
      <RevenueTrendChart data={(revenueData as any)?.trend || []} isLoading={revenueLoading} />

      {/* Row 3: Orders Analytics */}
      <OrdersAnalyticsRow ordersData={ordersData} isLoading={ordersLoading} />

      {/* Row 4: Products Analytics */}
      <ProductsAnalyticsRow productsData={productsData} isLoading={productsLoading} />

      {/* Row 5: Customers Analytics */}
      <CustomersAnalyticsRow customersData={customersData} isLoading={customersLoading} />

      {/* Row 6: Business Performance */}
      <BusinessPerformanceGrid revenue={revenueData} orders={ordersData} isLoading={revenueLoading || ordersLoading} />
    </div>
  );
}
