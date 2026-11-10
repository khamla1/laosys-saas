"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface OrdersAnalyticsRowProps {
  ordersData: any;
  isLoading: boolean;
}

export function OrdersAnalyticsRow({ ordersData, isLoading }: OrdersAnalyticsRowProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[350px] w-full rounded-xl bg-zinc-900/50" />
        <Skeleton className="h-[350px] w-full rounded-xl bg-zinc-900/50" />
      </div>
    );
  }

  const trendData = ordersData?.trend || [];
  
  const translateStatus = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING": return "ລໍຖ້າດຳເນີນການ";
      case "PROCESSING": return "ກຳລັງດຳເນີນການ";
      case "COMPLETED": return "ສຳເລັດແລ້ວ";
      case "CANCELLED": return "ຍົກເລີກແລ້ວ";
      case "FAILED": return "ຫຼົ້ມເຫຼວ";
      default: return status;
    }
  };

  const statusData = (ordersData?.statusDistribution || []).map((item: any) => ({
    ...item,
    name: translateStatus(item.name)
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Orders Trend */}
      <Card className="bg-zinc-950/40 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgba(16,185,129,0.05)] animate-in fade-in slide-in-from-bottom-4 duration-500 [animation-delay:200ms] [animation-fill-mode:both]">
        <CardHeader>
          <CardTitle className="text-zinc-200 text-lg font-bold">ແນວໂນ້ມອໍເດີ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full mt-2">
            {trendData.length > 0 ? (
              mounted && <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#27272a', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                    formatter={(value: any) => [value, 'ຈຳນວນອໍເດີ']}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 font-medium">ບໍ່ມີຂໍ້ມູນອໍເດີ</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Status Distribution */}
      <Card className="bg-zinc-950/40 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgba(16,185,129,0.05)] animate-in fade-in slide-in-from-bottom-4 duration-500 [animation-delay:250ms] [animation-fill-mode:both]">
        <CardHeader>
          <CardTitle className="text-zinc-200 text-lg font-bold">ອໍເດີແຍກຕາມສະຖານະ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full mt-2">
            {statusData.length > 0 ? (
              mounted && <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={statusData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#27272a', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                    formatter={(value: any) => [value, 'ຈຳນວນ']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {statusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 font-medium">ບໍ່ມີຂໍ້ມູນສະຖານະ</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
