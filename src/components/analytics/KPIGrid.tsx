import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Package, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface KPIGridProps {
  revenue: any;
  orders: any;
  products: any;
  customers: any;
  isLoading: boolean;
}

export function KPIGrid({ revenue, orders, products, customers, isLoading }: KPIGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[140px] w-full rounded-xl bg-zinc-900/50" />
        ))}
      </div>
    );
  }

  const colorClasses: Record<string, { border: string; bg: string; iconBg: string; iconBorder: string; text: string; glow: string }> = {
    emerald: {
      border: "hover:border-emerald-500/40",
      bg: "bg-emerald-500/10",
      iconBg: "bg-emerald-500/10",
      iconBorder: "border-emerald-500/20",
      text: "text-emerald-400",
      glow: "hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)]"
    },
    blue: {
      border: "hover:border-blue-500/40",
      bg: "bg-blue-500/10",
      iconBg: "bg-blue-500/10",
      iconBorder: "border-blue-500/20",
      text: "text-blue-400",
      glow: "hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)]"
    },
    orange: {
      border: "hover:border-orange-500/40",
      bg: "bg-orange-500/10",
      iconBg: "bg-orange-500/10",
      iconBorder: "border-orange-500/20",
      text: "text-orange-400",
      glow: "hover:shadow-[0_8px_30px_rgba(249,115,22,0.1)]"
    },
    purple: {
      border: "hover:border-purple-500/40",
      bg: "bg-purple-500/10",
      iconBg: "bg-purple-500/10",
      iconBorder: "border-purple-500/20",
      text: "text-purple-400",
      glow: "hover:shadow-[0_8px_30px_rgba(168,85,247,0.1)]"
    }
  };

  const kpis = [
    {
      title: "ລາຍຮັບທັງໝົດ",
      value: `₭${(revenue?.current || 0).toLocaleString()}`,
      growth: revenue?.growth || 0,
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
      color: "emerald"
    },
    {
      title: "ອໍເດີທັງໝົດ",
      value: (orders?.current || 0).toLocaleString(),
      growth: orders?.growth || 0,
      icon: <ShoppingCart className="w-5 h-5 text-blue-400" />,
      color: "blue"
    },
    {
      title: "ລູກຄ້າທັງໝົດ",
      value: (customers?.current || 0).toLocaleString(),
      growth: customers?.growth || 0,
      icon: <Users className="w-5 h-5 text-orange-400" />,
      color: "orange"
    },
    {
      title: "ສິນຄ້າທີ່ຂາຍໄດ້",
      value: (products?.current || 0).toLocaleString(),
      growth: products?.growth || 0,
      icon: <Package className="w-5 h-5 text-purple-400" />,
      color: "purple"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const style = colorClasses[kpi.color] || colorClasses.emerald;
        return (
          <Card 
            key={index} 
            style={{ animationDelay: `${index * 70}ms`, animationFillMode: "both" }}
            className={`group relative overflow-hidden bg-zinc-950/40 border-zinc-800/80 backdrop-blur-xl p-5 md:p-6 flex flex-col justify-center transition-all duration-500 hover:-translate-y-1 ring-1 ring-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500 ${style.border} ${style.glow}`}
          >
            {/* Hover Glow Ambient Aura */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${style.bg}`} />
            
            <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0 z-10 p-0">
              <CardTitle className="text-xs md:text-sm font-semibold tracking-wider text-zinc-400 uppercase group-hover:text-zinc-200 transition-colors duration-300">
                {kpi.title}
              </CardTitle>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-all duration-300 ${style.iconBg} ${style.iconBorder}`}>
                {kpi.icon}
              </div>
            </CardHeader>
            <CardContent className="relative p-0 mt-4 z-10">
              <div className="text-2xl md:text-3xl font-black tracking-tight text-white transition-all duration-500 truncate bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-zinc-400">
                {kpi.value}
              </div>
              <div className="flex items-center mt-2 space-x-2">
                <span className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                  kpi.growth >= 0 
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" 
                    : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                }`}>
                  {kpi.growth >= 0 ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
                  {Math.abs(kpi.growth)}%
                </span>
                <span className="text-xs text-zinc-500 font-medium">ທຽບໃສ່ໄລຍະຜ່ານມາ</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
