"use client";

import { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";

interface RevenueChartProps {
  data: {
    date: string;
    revenue: number;
  }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  // If no data, provide an empty state or zeroes so the chart still renders nicely
  const chartData = data.length > 0 ? data : [
    { date: "N/A", revenue: 0 },
  ];

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="w-full h-[350px] mt-4 print:h-[300px] print-chart-container">
      {mounted && (
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 12 }} 
            dy={10} 
          />
          <YAxis 
            width={80}
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 12 }} 
            tickFormatter={(value) => `₭${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#10b981' }}
            formatter={(value: any) => [`₭${value.toLocaleString()}`, "ຍອດຂາຍ (Revenue)"]}
            labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#34d399' }}
            isAnimationActive={false}
          >
            <LabelList dataKey="revenue" position="top" fill="#10b981" fontSize={11} fontWeight="bold" formatter={(val: any) => Number(val || 0) > 0 ? `₭${(Number(val) / 1000).toFixed(0)}k` : ''} />
          </Area>
        </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
