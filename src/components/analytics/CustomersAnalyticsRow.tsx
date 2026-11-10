"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Award } from "lucide-react";

interface CustomersAnalyticsRowProps {
  customersData: any;
  isLoading: boolean;
}

export function CustomersAnalyticsRow({ customersData, isLoading }: CustomersAnalyticsRowProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-[350px] w-full lg:col-span-1 rounded-xl bg-zinc-900/50" />
        <Skeleton className="h-[350px] w-full lg:col-span-2 rounded-xl bg-zinc-900/50" />
      </div>
    );
  }

  const retentionData = (customersData?.retention || []).map((d: any) => ({
    ...d,
    name: d.name === "New" ? "ລູກຄ້າໃໝ່" : d.name === "Returning" ? "ລູກຄ້າເກົ່າ" : d.name
  }));
  const topCustomers = customersData?.topCustomers || [];

  const PIE_COLORS = ['#3b82f6', '#10b981'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Customer Retention */}
      <Card className="bg-zinc-950/40 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 lg:col-span-1 transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgba(16,185,129,0.05)] animate-in fade-in slide-in-from-bottom-4 duration-500 [animation-delay:400ms] [animation-fill-mode:both]">
        <CardHeader>
          <CardTitle className="text-zinc-200 text-lg font-bold">ລູກຄ້າໃໝ່ vs ລູກຄ້າເກົ່າ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full mt-2 flex justify-center">
            {retentionData.length > 0 && retentionData.some((d: any) => d.value > 0) ? (
              mounted && <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie
                    data={retentionData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {retentionData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 font-medium">ບໍ່ມີຂໍ້ມູນລູກຄ້າ</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Customers Table */}
      <Card className="bg-zinc-950/40 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 lg:col-span-2 transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgba(16,185,129,0.05)] animate-in fade-in slide-in-from-bottom-4 duration-500 [animation-delay:450ms] [animation-fill-mode:both]">
        <CardHeader>
          <CardTitle className="text-zinc-200 text-lg font-bold">ລູກຄ້າທີ່ມຽອດຊື້ສູງສຸດ</CardTitle>
        </CardHeader>
        <CardContent>
          {topCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-zinc-800/20">
                    <TableHead className="text-zinc-400 font-semibold w-20">ອັນດັບ</TableHead>
                    <TableHead className="text-zinc-400 font-semibold">ລູກຄ້າ</TableHead>
                    <TableHead className="text-zinc-400 font-semibold text-center w-24">ອໍເດີ</TableHead>
                    <TableHead className="text-right text-zinc-400 font-semibold">ຍອດຊື້ສະສົມ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((customer: any, index: number) => (
                    <TableRow key={index} className="border-zinc-900 hover:bg-zinc-900/40 transition-colors">
                      <TableCell>
                        {index < 3 ? (
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shadow-sm ${
                            index === 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            index === 1 ? 'bg-zinc-300/10 text-zinc-300 border border-zinc-300/20' :
                            'bg-orange-600/10 text-orange-400 border border-orange-500/20'
                          }`}>
                            <Trophy size={14} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-zinc-900/80 text-zinc-500 border border-zinc-800/80 flex items-center justify-center font-semibold text-xs">
                            {index + 1}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-200 font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center text-xs font-black text-zinc-300">
                            {customer.name ? customer.name.substring(0, 2).toUpperCase() : "AN"}
                          </div>
                          <span className="font-semibold text-zinc-100">{customer.name || customer.id || "ບໍ່ປະສົງອອກນາມ"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-300 text-center font-medium">
                        {customer.orders}
                      </TableCell>
                      <TableCell className="text-right font-black text-emerald-400">
                        ₭{customer.spend.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-zinc-500 font-medium">ບໍ່ມີຂໍ້ມູນລູກຄ້າ</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
