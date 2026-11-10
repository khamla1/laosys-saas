"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductsAnalyticsRowProps {
  productsData: any;
  isLoading: boolean;
}

export function ProductsAnalyticsRow({ productsData, isLoading }: ProductsAnalyticsRowProps) {
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

  const topProducts = productsData?.topProducts || [];
  const categoryData = productsData?.categoryDistribution || [];

  const COLORS = ['#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16'];
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Top Selling Products */}
      <Card className="bg-zinc-950/40 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgba(16,185,129,0.05)] animate-in fade-in slide-in-from-bottom-4 duration-500 [animation-delay:300ms] [animation-fill-mode:both]">
        <CardHeader>
          <CardTitle className="text-zinc-200 text-lg font-bold">ສິນຄ້າຂາຍດີທີ່ສຸດ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full mt-2">
            {topProducts.length > 0 ? (
              mounted && <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} width={100} tickFormatter={(val) => val.length > 12 ? val.substring(0, 12) + "..." : val} />
                  <Tooltip 
                    cursor={{ fill: '#27272a', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                    formatter={(value: any) => [value, 'ຈຳນວນທີ່ຂາຍໄດ້']}
                  />
                  <Bar dataKey="quantity" name="ຈຳນວນທີ່ຂายໄດ້" radius={[0, 4, 4, 0]}>
                    {topProducts.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 font-medium">ບໍ່ມີຂໍ້ມູນສິນຄ້າ</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Category (Pie Chart) */}
      <Card className="bg-zinc-950/40 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgba(16,185,129,0.05)] animate-in fade-in slide-in-from-bottom-4 duration-500 [animation-delay:350ms] [animation-fill-mode:both]">
        <CardHeader>
          <CardTitle className="text-zinc-200 text-lg font-bold">ລາຍຮັບແຍກຕາມໝວດໝູ່</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full mt-2 flex justify-center">
            {categoryData.length > 0 ? (
              mounted && <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`₭${Number(value || 0).toLocaleString()}`, 'ລາຍຮັບ']}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 font-medium">ບໍ່ມີຂໍ້ມູນໝວດໝູ່</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
