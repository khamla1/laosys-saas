"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface RevenueTrendChartProps {
  data: any[];
  isLoading: boolean;
}

export function RevenueTrendChart({ data, isLoading }: RevenueTrendChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full rounded-xl bg-zinc-900/50" />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-zinc-950/40 border-zinc-800/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle className="text-zinc-200">ແນວໂນ້ມລາຍຮັບ</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-zinc-500 font-medium">
          ບໍ່ມີຂໍ້ມູນລາຍຮັບໃນໄລຍະເວລານີ້
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-950/40 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] animate-in fade-in slide-in-from-bottom-4 duration-500 [animation-delay:150ms] [animation-fill-mode:both]">
      <CardHeader>
        <CardTitle className="text-zinc-200 text-lg font-bold">ແນວໂນ້ມລາຍຮັບ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full mt-4">
          {mounted && (
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#52525b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `₭${(value / 1000).toFixed(0)}k`}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#10b981' }}
                formatter={(value: any) => [`₭${Number(value || 0).toLocaleString()}`, 'ລາຍຮັບ']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
