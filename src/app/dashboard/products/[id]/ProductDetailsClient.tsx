"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Pencil, 
  Plus, 
  ShoppingBag, 
  Trash2, 
  CheckCircle, 
  RotateCcw, 
  Clock, 
  Package, 
  Info, 
  History,
  Activity,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type TimelineEvent = {
  type: string;
  message: string;
  actorName: string;
  actorType: "USER" | "ADMIN" | "SYSTEM";
  createdAt: string;
};

type StockMovement = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
  user?: {
    name: string | null;
    email: string;
    role: string;
  };
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  stock: number;
  minStock: number;
  status: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

export function ProductDetailsClient({
  product,
  movements,
  timeline,
  isAdmin
}: {
  product: Product;
  movements: StockMovement[];
  timeline: TimelineEvent[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Set tab from URL param or default to details
  const tabParam = searchParams.get("tab") as "details" | "stock" | "activity" | null;
  const [activeTab, setActiveTab] = useState<"details" | "stock" | "activity">(tabParam || "details");

  // Sync state with URL change
  useEffect(() => {
    if (tabParam && ["details", "stock", "activity"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: "details" | "stock" | "activity") => {
    setActiveTab(tab);
    // Update URL query parameters
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  // Grouping logic for the timeline
  const groupTimeline = (events: TimelineEvent[]) => {
    const today: TimelineEvent[] = [];
    const yesterday: TimelineEvent[] = [];
    const older: TimelineEvent[] = [];

    const now = new Date();
    // Midnight today in local time
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Midnight yesterday in local time
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    events.forEach(event => {
      const date = new Date(event.createdAt);
      if (date >= todayStart) {
        today.push(event);
      } else if (date >= yesterdayStart) {
        yesterday.push(event);
      } else {
        older.push(event);
      }
    });

    return { today, yesterday, older };
  };

  const groupedTimeline = groupTimeline(timeline);

  // Time formatter
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) {
      if (diffMins <= 0) return "just now";
      if (diffMins === 1) return "1 minute ago";
      return `${diffMins} minutes ago`;
    }

    if (diffHours < 24) {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (date >= todayStart) {
        if (diffHours === 1) return "1 hour ago";
        return `${diffHours} hours ago`;
      }
    }

    const pad = (n: number) => n.toString().padStart(2, "0");
    const hhmm = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    if (date >= yesterdayStart && date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      return `Yesterday ${hhmm}`;
    }

    return `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()} ${hhmm}`;
  };

  // Color mapping
  const getEventStyle = (type: string) => {
    switch (type) {
      case "EDIT_PRODUCT":
        return {
          classes: "bg-blue-500/10 text-blue-400 border-blue-500/30",
          Icon: Pencil
        };
      case "ADD_STOCK":
        return {
          classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          Icon: Plus
        };
      case "SALE":
        return {
          classes: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          Icon: ShoppingBag
        };
      case "DELETE_REQUEST":
        return {
          classes: "bg-red-500/10 text-red-400 border-red-500/30",
          Icon: Trash2
        };
      case "ADMIN_APPROVE":
        return {
          classes: "bg-purple-500/10 text-purple-400 border-purple-500/30",
          Icon: CheckCircle
        };
      case "RESTORE":
        return {
          classes: "bg-teal-500/10 text-teal-400 border-teal-500/30",
          Icon: RotateCcw
        };
      default:
        return {
          classes: "bg-zinc-800 text-zinc-400 border-zinc-700",
          Icon: Clock
        };
    }
  };

  // Actor type labels
  const getActorLabel = (actorType: "USER" | "ADMIN" | "SYSTEM") => {
    switch (actorType) {
      case "USER":
        return "User";
      case "ADMIN":
        return "Admin";
      case "SYSTEM":
        return "System";
      default:
        return actorType;
    }
  };

  // Stock Badge Helpers
  const getStockBadgeStyle = (type: string) => {
    switch (type) {
      case "ADD":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "REMOVE":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "SALE":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "ADJUST":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getStockTypeText = (type: string) => {
    switch (type) {
      case "ADD":
        return "ເພີ່ມ";
      case "REMOVE":
        return "ຫຼຸດ";
      case "SALE":
        return "ຂາຍ";
      case "ADJUST":
        return "ປັບ";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/products/manage">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl h-10 w-10 shrink-0">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package className="text-blue-400 shrink-0" size={24} />
            {product.name}
          </h2>
          <p className="text-zinc-450 text-xs sm:text-sm mt-1">
            Product Detail and Operational Lifecycle Logs
          </p>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div className="flex border-b border-zinc-900 gap-1.5 p-1 bg-zinc-950/45 rounded-xl border border-zinc-850/60 max-w-md">
        <button
          onClick={() => handleTabChange("details")}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
            activeTab === "details"
              ? "bg-zinc-900 text-white shadow-inner"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
          }`}
        >
          ລາຍລະອຽດ (Details)
        </button>
        <button
          onClick={() => handleTabChange("stock")}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
            activeTab === "stock"
              ? "bg-zinc-900 text-white shadow-inner"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
          }`}
        >
          ສະຕັອກ (Stock)
        </button>
        <button
          onClick={() => handleTabChange("activity")}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
            activeTab === "activity"
              ? "bg-zinc-900 text-white shadow-inner"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
          }`}
        >
          ການເຄື່ອນໄຫວ (Activity)
        </button>
      </div>

      {/* Tab contents */}
      <div className="space-y-6">
        {/* 1. DETAILS TAB */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Gallery card */}
            <Card className="md:col-span-4 bg-zinc-950/40 border-zinc-850 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-zinc-900/50 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                  ຮູບສິນຄ້າ (Product Media)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="aspect-square w-full rounded-xl bg-zinc-900/60 overflow-hidden relative border border-zinc-800">
                  {product.images && product.images.length > 0 ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={product.images[0]} 
                      alt={product.name} 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                      ບໍ່ມີຮູບ
                    </div>
                  )}
                </div>
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {product.images.slice(1).map((img, idx) => (
                      <div key={idx} className="w-14 h-14 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Information card */}
            <Card className="md:col-span-8 bg-zinc-950/40 border-zinc-850 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-zinc-900/50 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                  ລາຍລະອຽດສິນຄ້າ (Product Info)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase font-bold">ຊື່ສິນຄ້າ (Product Name)</p>
                    <p className="text-white font-extrabold text-base">{product.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase font-bold">ໝວດໝູ່ (Category)</p>
                    <p className="text-zinc-300 font-medium">{product.category || "General"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase font-bold">ລາຄາ (Price)</p>
                    <p className="text-emerald-400 font-black text-lg">₭{product.price.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase font-bold">ສະຕັອກປັດຈຸບັນ (Current Stock)</p>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-black text-lg">{product.stock}</span>
                      <span className="text-xs text-zinc-500">
                        (ຂັ້ນຕ່ຳ: {product.minStock})
                      </span>
                    </div>
                  </div>
                </div>

                <hr className="border-zinc-900" />

                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 uppercase font-bold">ສະຖານະ (Status)</p>
                  <div>
                    {product.status === "ACTIVE" && (
                      <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        ເປີດໃຊ້ງານ (Active)
                      </Badge>
                    )}
                    {product.status === "PENDING_DELETE" && (
                      <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        ລໍຖ້າການລົບ (Pending Delete)
                      </Badge>
                    )}
                    {product.status === "DELETED" && (
                      <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                        ລົບແລ້ວ (Deleted)
                      </Badge>
                    )}
                  </div>
                </div>

                <hr className="border-zinc-900" />

                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 uppercase font-bold">ຄຳອະທິບາຍສິນຄ້າ (Description)</p>
                  <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl text-zinc-350 text-sm leading-relaxed whitespace-pre-wrap">
                    {product.description || "ບໍ່ມີລາຍລະອຽດສິນຄ້າສຳລັບລາຍການນີ້."}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 2. STOCK TAB */}
        {activeTab === "stock" && (
          <Card className="bg-zinc-950/40 border-zinc-850 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-zinc-900/50">
              <CardTitle className="text-zinc-200 font-bold flex items-center gap-2">
                ລາຍການເຄື່ອນໄຫວສະຕັອກ (Stock Movement History)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[700px]">
                  <TableHeader className="bg-zinc-900/50 border-b border-zinc-900">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">ວັນທີ / ເວລາ</TableHead>
                      <TableHead className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">ປະເພດ</TableHead>
                      <TableHead className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">ຈຳນວນ</TableHead>
                      <TableHead className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">ເຫດຜົນ</TableHead>
                      <TableHead className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">ຜູ້ດຳເນີນການ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow className="border-zinc-905">
                        <TableCell colSpan={5} className="text-center text-zinc-500 py-12">
                          <div className="flex flex-col items-center gap-3">
                            <Clock size={32} className="opacity-20 text-zinc-400" />
                            <p className="font-bold">No stock activity yet</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      movements.map((movement) => {
                        const isPositive = movement.quantity > 0;
                        const qtyDisplay = isPositive ? `+${movement.quantity}` : `${movement.quantity}`;
                        const qtyColor = isPositive ? "text-emerald-400" : "text-red-400";
                        
                        return (
                          <TableRow key={movement.id} className="border-zinc-900/50 hover:bg-zinc-900/20 transition-all duration-300">
                            <TableCell className="px-6 py-4 text-zinc-400 font-medium text-sm">
                              {new Date(movement.createdAt).toLocaleString("lo-LA", {
                                year: "numeric",
                                month: "numeric",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <Badge variant="outline" className={`font-semibold py-0.5 px-2.5 rounded-full text-xs ${getStockBadgeStyle(movement.type)}`}>
                                {getStockTypeText(movement.type)}
                              </Badge>
                            </TableCell>
                            <TableCell className={`px-6 py-4 font-black text-sm ${qtyColor}`}>
                              {qtyDisplay}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-zinc-350 text-sm max-w-[250px] truncate" title={movement.reason || "-"}>
                              {movement.reason || "-"}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-zinc-400 text-sm">
                              {movement.user?.name || movement.user?.email || "ລະບົບອັດຕະໂນມັດ"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. ACTIVITY TIMELINE TAB */}
        {activeTab === "activity" && (
          <Card className="bg-zinc-950/40 border-zinc-850 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-zinc-900/50">
              <CardTitle className="text-zinc-200 font-bold flex items-center gap-2">
                ປະຫວັດການເຄື່ອນໄຫວ ແລະ ອະນຸມັດ (Product Activity Timeline)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {timeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <Activity size={36} className="opacity-20 mb-3 text-zinc-400 animate-pulse" />
                  <p className="font-bold">No activity yet</p>
                </div>
              ) : (
                <div className="relative pl-8 border-l border-zinc-900 py-2 space-y-10">
                  {/* Today Section */}
                  {groupedTimeline.today.length > 0 && (
                    <div className="space-y-6">
                      <div className="relative -ml-8 flex items-center">
                        <div className="absolute left-0 w-3 h-3 rounded-full bg-zinc-900 border border-zinc-800 -translate-x-[2px]" />
                        <div className="bg-zinc-950 border border-zinc-900 text-zinc-400 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg tracking-wider">
                          Today
                        </div>
                      </div>
                      <div className="space-y-6 pl-2">
                        {groupedTimeline.today.map((event, idx) => {
                          const style = getEventStyle(event.type);
                          const IconComponent = style.Icon;
                          return (
                            <div key={`today-${idx}`} className="relative group p-4 bg-zinc-900/10 hover:bg-zinc-900/30 border border-transparent hover:border-zinc-900 rounded-2xl transition-all duration-300">
                              {/* Colored indicator dot with icon */}
                              <div className={`absolute left-0 top-4 w-7 h-7 rounded-full flex items-center justify-center border -translate-x-[42px] transition-transform duration-300 group-hover:scale-110 shadow ${style.classes}`}>
                                <IconComponent size={12} />
                              </div>
                              <div className="space-y-1">
                                <p className="text-zinc-200 text-sm font-semibold leading-relaxed">
                                  {event.message}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                  <span className="font-bold text-zinc-300">
                                    {event.actorName}
                                  </span>
                                  <span>•</span>
                                  <span>{formatTime(event.createdAt)}</span>
                                  <span>•</span>
                                  <span className="bg-zinc-900/80 px-2 py-0.5 rounded text-[10px] font-bold border border-zinc-850 flex items-center gap-1">
                                    {getActorLabel(event.actorType)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Yesterday Section */}
                  {groupedTimeline.yesterday.length > 0 && (
                    <div className="space-y-6">
                      <div className="relative -ml-8 flex items-center">
                        <div className="absolute left-0 w-3 h-3 rounded-full bg-zinc-900 border border-zinc-800 -translate-x-[2px]" />
                        <div className="bg-zinc-950 border border-zinc-900 text-zinc-400 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg tracking-wider">
                          Yesterday
                        </div>
                      </div>
                      <div className="space-y-6 pl-2">
                        {groupedTimeline.yesterday.map((event, idx) => {
                          const style = getEventStyle(event.type);
                          const IconComponent = style.Icon;
                          return (
                            <div key={`yest-${idx}`} className="relative group p-4 bg-zinc-900/10 hover:bg-zinc-900/30 border border-transparent hover:border-zinc-900 rounded-2xl transition-all duration-300">
                              {/* Colored indicator dot with icon */}
                              <div className={`absolute left-0 top-4 w-7 h-7 rounded-full flex items-center justify-center border -translate-x-[42px] transition-transform duration-300 group-hover:scale-110 shadow ${style.classes}`}>
                                <IconComponent size={12} />
                              </div>
                              <div className="space-y-1">
                                <p className="text-zinc-200 text-sm font-semibold leading-relaxed">
                                  {event.message}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                  <span className="font-bold text-zinc-300">
                                    {event.actorName}
                                  </span>
                                  <span>•</span>
                                  <span>{formatTime(event.createdAt)}</span>
                                  <span>•</span>
                                  <span className="bg-zinc-900/80 px-2 py-0.5 rounded text-[10px] font-bold border border-zinc-850 flex items-center gap-1">
                                    {getActorLabel(event.actorType)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Older Section */}
                  {groupedTimeline.older.length > 0 && (
                    <div className="space-y-6">
                      <div className="relative -ml-8 flex items-center">
                        <div className="absolute left-0 w-3 h-3 rounded-full bg-zinc-900 border border-zinc-800 -translate-x-[2px]" />
                        <div className="bg-zinc-950 border border-zinc-900 text-zinc-400 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg tracking-wider">
                          Older
                        </div>
                      </div>
                      <div className="space-y-6 pl-2">
                        {groupedTimeline.older.map((event, idx) => {
                          const style = getEventStyle(event.type);
                          const IconComponent = style.Icon;
                          return (
                            <div key={`older-${idx}`} className="relative group p-4 bg-zinc-900/10 hover:bg-zinc-900/30 border border-transparent hover:border-zinc-900 rounded-2xl transition-all duration-300">
                              {/* Colored indicator dot with icon */}
                              <div className={`absolute left-0 top-4 w-7 h-7 rounded-full flex items-center justify-center border -translate-x-[42px] transition-transform duration-300 group-hover:scale-110 shadow ${style.classes}`}>
                                <IconComponent size={12} />
                              </div>
                              <div className="space-y-1">
                                <p className="text-zinc-200 text-sm font-semibold leading-relaxed">
                                  {event.message}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                  <span className="font-bold text-zinc-300">
                                    {event.actorName}
                                  </span>
                                  <span>•</span>
                                  <span>{formatTime(event.createdAt)}</span>
                                  <span>•</span>
                                  <span className="bg-zinc-900/80 px-2 py-0.5 rounded text-[10px] font-bold border border-zinc-850 flex items-center gap-1">
                                    {getActorLabel(event.actorType)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
