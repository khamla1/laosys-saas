import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, CalendarDays, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BusinessPerformanceGridProps {
  revenue: any;
  orders: any;
  isLoading: boolean;
}

export function BusinessPerformanceGrid({ revenue, orders, isLoading }: BusinessPerformanceGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[120px] w-full rounded-xl bg-zinc-900/50" />
        ))}
      </div>
    );
  }

  // Calculate best sales day from trend (assuming daily trend is available)
  let bestDay = { date: "N/A", amount: 0 };
  if (revenue?.trend && revenue.trend.length > 0) {
    bestDay = [...revenue.trend].sort((a, b) => b.revenue - a.revenue)[0];
  }

  const colorClasses: Record<string, { border: string; bg: string; iconBg: string; iconBorder: string; text: string; glow: string }> = {
    fuchsia: {
      border: "hover:border-fuchsia-500/40",
      bg: "bg-fuchsia-500/10",
      iconBg: "bg-fuchsia-500/10",
      iconBorder: "border-fuchsia-500/20",
      text: "text-fuchsia-400",
      glow: "hover:shadow-[0_8px_30px_rgba(217,70,239,0.1)]"
    },
    emerald: {
      border: "hover:border-emerald-500/40",
      bg: "bg-emerald-500/10",
      iconBg: "bg-emerald-500/10",
      iconBorder: "border-emerald-500/20",
      text: "text-emerald-400",
      glow: "hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)]"
    },
    sky: {
      border: "hover:border-sky-500/40",
      bg: "bg-sky-500/10",
      iconBg: "bg-sky-500/10",
      iconBorder: "border-sky-500/20",
      text: "text-sky-400",
      glow: "hover:shadow-[0_8px_30px_rgba(56,189,248,0.1)]"
    },
    indigo: {
      border: "hover:border-indigo-500/40",
      bg: "bg-indigo-500/10",
      iconBg: "bg-indigo-500/10",
      iconBorder: "border-indigo-500/20",
      text: "text-indigo-400",
      glow: "hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)]"
    }
  };

  const perfMetrics = [
    {
      title: "ຍອດຊື້ສະເລ່ຍຕໍ່ຄັ້ງ",
      value: `₭${(orders?.averageOrderValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: <ShoppingBag className="w-5 h-5 text-fuchsia-400" />,
      color: "fuchsia"
    },
    {
      title: "ການເຕີບໂຕຂອງລາຍຮັບ",
      value: `${revenue?.growth > 0 ? '+' : ''}${revenue?.growth || 0}%`,
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      color: "emerald"
    },
    {
      title: "ວັນທີຍອດຂາຍດີທີ່ສຸດ",
      value: bestDay.date === "N/A" ? "ບໍ່ມີຂໍ້ມູນ" : bestDay.date,
      subValue: bestDay.date === "N/A" ? undefined : `ຍອດຂາຍ: ₭${((bestDay as any).revenue || bestDay.amount || 0).toLocaleString()}`,
      icon: <Calendar className="w-5 h-5 text-sky-400" />,
      color: "sky"
    },
    {
      title: "ອໍເດີໃນໄລຍະນີ້",
      value: (orders?.current || 0).toLocaleString(),
      icon: <CalendarDays className="w-5 h-5 text-indigo-400" />,
      color: "indigo"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {perfMetrics.map((metric, index) => {
        const style = colorClasses[metric.color] || colorClasses.emerald;
        return (
          <Card 
            key={index} 
            style={{ animationDelay: `${index * 60 + 500}ms`, animationFillMode: "both" }}
            className={`group relative overflow-hidden bg-zinc-950/40 border-zinc-800/80 backdrop-blur-xl p-5 flex flex-col justify-center transition-all duration-500 hover:-translate-y-1 ring-1 ring-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500 ${style.border} ${style.glow}`}
          >
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${style.bg}`} />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase group-hover:text-zinc-200 transition-colors duration-300">{metric.title}</p>
                <div className="text-2xl font-black tracking-tight text-white mt-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-zinc-400">
                  {metric.value}
                </div>
                {metric.subValue && (
                  <div className="text-xs text-zinc-500 mt-1.5 font-medium">{metric.subValue}</div>
                )}
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-all duration-300 ${style.iconBg} ${style.iconBorder}`}>
                {metric.icon}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
