"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ProductPieChartProps {
  data: {
    name: string;
    value: number; // This can be revenue or qty
  }[];
}

const COLORS = ['#10b981', '#3b82f6', '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#ef4444', '#facc15'];

export function ProductPieChart({ data }: ProductPieChartProps) {
  const chartData = data.length > 0 ? data : [
    { name: "No Data", value: 1 }
  ];

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="w-full h-[350px] mt-4 print:h-[300px] print-chart-container flex items-center justify-center">
      {mounted && (
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
            label={({ percent }: { percent?: number }) => (percent && percent > 0.05) ? `${(percent * 100).toFixed(0)}%` : ''}
            labelLine={false}
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={data.length === 0 ? '#3f3f46' : COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: any) => [`₭${value.toLocaleString()}`, "ຍອດຂາຍ (Revenue)"]}
            labelStyle={{ display: 'none' }}
          />
          <Legend 
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: '20px', paddingBottom: '10px', width: '100%' }}
            iconType="circle"
            formatter={(value) => <span className="text-zinc-300 print:text-zinc-800 print:font-medium text-sm inline-block max-w-[120px] truncate align-bottom">{value}</span>}
          />
        </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
