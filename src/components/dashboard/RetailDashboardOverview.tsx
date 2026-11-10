"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { AlertCircle, ArrowRight, PackageX, ShoppingBag, Clock, Trophy, HeartHandshake, Truck } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ExcelExportButton } from "@/components/ExcelExportButton";
import { exportComprehensiveReportExcel } from "@/lib/excel-reports";

interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  price: number;
}

interface RecentOrder {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
}

interface TopProduct {
  id: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
}

interface CategorySales {
  name: string;
  value: number;
}

interface PendingPO {
  id: string;
  supplier: { name: string };
  totalAmount: number;
  createdAt: Date;
}

interface RetailDashboardOverviewProps {
  chartData: ChartDataPoint[];
  lowStockItems: LowStockItem[];
  recentOrders: RecentOrder[];
  topProducts?: TopProduct[];
  categorySalesData?: CategorySales[];
  pendingPOs?: PendingPO[];
  crmData?: any;
  sourceData?: any[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export function RetailDashboardOverview({
  chartData,
  lowStockItems,
  recentOrders,
  topProducts = [],
  categorySalesData = [],
  pendingPOs = [],
  crmData,
  sourceData = []
}: RetailDashboardOverviewProps) {
  
  return (
    <div className="space-y-6">
      {/* Top Bar with Export All Report Workbook Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/80 border border-zinc-800/80 p-5 rounded-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            ພາບລວມລາຍງານທຸລະກິດ (Retail Dashboard & Reports)
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Live Analytics
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">ຕິດຕາມຕົວຊີ້ວັດຫຼັກ, ແນວໂນ້ມຍອດຂາຍ, ສະຖານະສະຕັອກ ແລະ ລູກຄ້າ</p>
        </div>
        <ExcelExportButton
          onClick={() => exportComprehensiveReportExcel()}
          label="ດາວໂຫຼດ Excel ລາຍງານລວມທຸກໜ້າ (5 Sheets)"
        />
      </div>

      {/* 3-Column Top Cards for CRM & Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-900/10 border-pink-500/20 backdrop-blur-xl md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pink-400 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4" /> CRM & ລູກຄ້າສະມາຊິກ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{crmData?.newMembers || 0} ຄົນ</div>
            <p className="text-xs text-zinc-400 mt-1">ສະມາຊິກໃໝ່ອາທິດນີ້ (ລວມທັງໝົດ {crmData?.totalMembers || 0})</p>
            <div className="mt-4 pt-4 border-t border-pink-500/20 flex justify-between items-center">
              <span className="text-xs text-zinc-400">ຄະແນນຖືກໃຊ້ (Redeemed)</span>
              <span className="text-sm font-bold text-pink-300">{crmData?.pointsRedeemed?.toLocaleString() || 0} pts</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">ຍອດຂາຍແຍກຕາມໝວດໝູ່</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            {categorySalesData.length > 0 ? (
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySalesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {categorySalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                      itemStyle={{ color: '#e4e4e7' }}
                      formatter={(value: any) => [`₭${Number(value || 0).toLocaleString()}`, "ຍອດຂາຍ"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[120px] flex items-center justify-center text-sm text-zinc-500">ບໍ່ມີຂໍ້ມູນ</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">ຊ່ອງທາງການຂາຍ (POS vs Online)</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    cursor={{fill: '#27272a', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    formatter={(value: any) => [`${value}%`, "ສັດສ່ວນ"]}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Main Chart Section (2 cols) */}
        <Card className="bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-white font-semibold">ຍອດຂາຍຍ້ອນຫຼັງ 7 ວັນ (7-Day Sales Trend)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `₭${(value / 1000).toFixed(0)}k`}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#e4e4e7' }}
                    formatter={(value: any) => [`₭${Number(value || 0).toLocaleString()}`, "ຍອດຂາຍ"]}
                    labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products Section (1 col) */}
        <Card className="bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl lg:col-span-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Trophy className="w-32 h-32 text-amber-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              ສິນຄ້າຂາຍດີ (Top Selling)
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            {topProducts.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">ບໍ່ມີຂໍ້ມູນສິນຄ້າຂາຍດີ</div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{p.category}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-white">{p.unitsSold} ຊິ້ນ</p>
                      <p className="text-xs text-emerald-400">₭{p.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3-Column Bottom Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Low Stock Alerts */}
        <Card className="bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl relative overflow-hidden md:col-span-1">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <PackageX className="w-24 h-24 text-red-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              ສິນຄ້າໃກ້ໝົດສະຕ໋ອກ
            </CardTitle>
            <Link href="/dashboard/products" className="text-xs text-blue-400 hover:text-blue-300 flex items-center z-10 relative">
              ເບິ່ງທັງໝົດ <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="relative z-10">
            {lowStockItems.length === 0 ? (
              <div className="text-center py-6 text-zinc-500">
                ບໍ່ມີສິນຄ້າໃກ້ໝົດສະຕ໋ອກ
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-zinc-400">₭{item.price.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-400">{item.stock} ເຫຼືອ</p>
                      <p className="text-xs text-zinc-500">ຂັ້ນຕ່ຳ: {item.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incoming Supplier Orders */}
        <Card className="bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl relative overflow-hidden md:col-span-1">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Truck className="w-24 h-24 text-sky-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
              <Truck className="w-5 h-5 text-sky-400" />
              ລໍຖ້າສິນຄ້າເຂົ້າສາງ
            </CardTitle>
            <Link href="/dashboard/inventory/purchase-orders" className="text-xs text-blue-400 hover:text-blue-300 flex items-center z-10 relative">
              ເບິ່ງທັງໝົດ <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="relative z-10">
            {pendingPOs.length === 0 ? (
              <div className="text-center py-6 text-zinc-500">
                ບໍ່ມີໃບສັ່ງຊື້ທີ່ລໍຖ້າ
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                {pendingPOs.map((po) => (
                  <div key={po.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-white">{po.supplier.name}</p>
                      <p className="text-xs text-zinc-400">{formatDistanceToNow(new Date(po.createdAt), { addSuffix: true })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">₭{po.totalAmount.toLocaleString()}</p>
                      <p className="text-xs text-sky-400">ກຳລັງຈັດສົ່ງ</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl relative overflow-hidden md:col-span-1">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ShoppingBag className="w-24 h-24 text-blue-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              ອໍເດີລ່າສຸດ
            </CardTitle>
            <Link href="/dashboard/orders" className="text-xs text-blue-400 hover:text-blue-300 flex items-center z-10 relative">
              ເບິ່ງທັງໝົດ <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="relative z-10">
            {recentOrders.length === 0 ? (
              <div className="text-center py-6 text-zinc-500">
                ຍັງບໍ່ມີອໍເດີ
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                {recentOrders.map((order) => {
                  let statusColor = "text-yellow-400 bg-yellow-400/10";
                  if (order.status === "PAID" || order.status === "COMPLETED") statusColor = "text-emerald-400 bg-emerald-400/10";
                  if (order.status === "CANCELLED") statusColor = "text-red-400 bg-red-400/10";
                  
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                      <div>
                        <p className="text-sm font-medium text-white">₭{order.totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-zinc-400">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                        {order.status}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
