"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

interface TopProductsChartProps {
  data: {
    name: string;
    qtySold: number;
    revenue: number;
  }[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  const chartData = data.length > 0 ? data : [
    { name: "No data", qtySold: 0, revenue: 0 },
  ];

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="w-full h-[350px] mt-4 print:h-[300px] print-chart-container">
      {mounted && (
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
          barSize={40}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 12 }} 
            dy={10} 
            tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
          />
          <YAxis 
            yAxisId="left"
            orientation="left"
            width={60}
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 12 }} 
          />
          <Tooltip 
            cursor={{ fill: '#27272a', opacity: 0.4 }}
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#3b82f6' }}
            formatter={(value: any) => [value, "ຈຳນວນທີ່ຂາຍໄດ້ (Qty)"]}
            labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
          />
          <Bar yAxisId="left" dataKey="qtySold" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            <LabelList dataKey="qtySold" position="top" fill="#3b82f6" fontSize={12} fontWeight="bold" />
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#60a5fa'} />
            ))}
          </Bar>
        </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
