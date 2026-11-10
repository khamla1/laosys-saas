"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  Clock,
  ChefHat,
  CheckSquare,
  UtensilsCrossed,
  Check,
  ZoomIn,
  X,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

type KDSItem = {
  id: string;
  quantity: number;
  status: string;
  createdAt: string;
  product: {
    id?: string;
    name: string;
    category?: string;
    images?: string[];
    resolvedImage?: string;
  };
  order: {
    id: string;
    createdAt: string;
    customerName: string;
    customerNote?: string;
    table?: {
      name: string;
    };
  };
};

type OrderGroup = {
  orderId: string;
  tableName: string;
  customerName: string;
  customerNote: string;
  createdAt: string;
  items: KDSItem[];
};

// Fallback image helper matching product keywords
function getFallbackImage(name: string = ""): string {
  const n = (name || "").toLowerCase();
  if (n.includes("candle") || n.includes("ທຽນ")) {
    return "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80";
  }
  if (n.includes("tote") || n.includes("ກະເປົ໋າ") || n.includes("bag")) {
    return "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80";
  }
  if (
    n.includes("stanley") ||
    n.includes("quencher") ||
    n.includes("ແກ້ວ") ||
    n.includes("ຈອກ") ||
    n.includes("cup") ||
    n.includes("tumbler")
  ) {
    return "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=600&q=80";
  }
  if (
    n.includes("gift") ||
    n.includes("ຊຸດຂອງຂວັນ") ||
    n.includes("set") ||
    n.includes("ພຣີມຽມ")
  ) {
    return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80";
  }
  if (n.includes("coffee") || n.includes("ກາເຟ")) {
    return "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&q=80";
  }
  if (n.includes("matcha") || n.includes("tea") || n.includes("ຊາ")) {
    return "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=80";
  }
  if (n.includes("cake") || n.includes("ເຄັກ")) {
    return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80";
  }
  if (n.includes("rice") || n.includes("ເຂົ້າ")) {
    return "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80";
  }
  if (n.includes("burger") || n.includes("fries")) {
    return "https://images.unsplash.com/photo-1576107232684-1279f3908581?w=600&q=80";
  }
  if (n.includes("noodle") || n.includes("ເຝີ") || n.includes("ໝີ່")) {
    return "https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=600&q=80";
  }
  if (
    n.includes("badminton") ||
    n.includes("ແບັດມິນຕັນ") ||
    n.includes("ໄມ້ແບັດ") ||
    n.includes("racket")
  ) {
    return "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80";
  }
  if (n.includes("shuttlecock") || n.includes("ລູກຂົນໄກ່")) {
    return "https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=600&q=80";
  }
  if (n.includes("shoe") || n.includes("ເກີບ")) {
    return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80";
  }
  if (n.includes("shirt") || n.includes("jersey") || n.includes("ເສື້ອ")) {
    return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80";
  }
  return "https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&q=80";
}

function getItemImage(item: KDSItem): string {
  if (item.product?.resolvedImage) {
    return item.product.resolvedImage;
  }
  if (item.product?.images && item.product.images.length > 0 && item.product.images[0]) {
    return item.product.images[0];
  }
  return getFallbackImage(item.product?.name);
}

export default function KDSClient({ dicts }: { dicts: any }) {
  const [items, setItems] = useState<KDSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Image Preview Modal
  const [zoomImage, setZoomImage] = useState<{ url: string; name: string } | null>(null);

  // Status Pop-up Alert State for Kitchen Chef
  const [chefAlert, setChefAlert] = useState<{
    open: boolean;
    title: string;
    message: string;
    subText?: string;
    imageUrl?: string;
    status: "PREPARING" | "READY" | "SERVED";
  }>({
    open: false,
    title: "",
    message: "",
    status: "PREPARING",
  });

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/restaurant/kds");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch KDS items", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 3000); // Poll every 3s

    const handleSync = () => {
      fetchItems();
    };
    window.addEventListener("refresh-orders", handleSync);
    window.addEventListener("new-orders-detected", handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-orders", handleSync);
      window.removeEventListener("new-orders-detected", handleSync);
    };
  }, []);

  const updateStatus = async (item: KDSItem, newStatus: string, tableName: string = "Walk-in") => {
    setUpdatingId(item.id);
    const itemImg = getItemImage(item);

    try {
      const res = await fetch("/api/restaurant/kds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, status: newStatus }),
      });
      if (res.ok) {
        // Optimistic update
        setItems(prev => {
          if (newStatus === "SERVED") {
            return prev.filter(i => i.id !== item.id);
          }
          return prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i);
        });

        // Trigger Chef Pop-up Alert Modal!
        let title = "ເລີ່ມປຸງແຕ່ງອາຫານແລ້ວ! (PREPARING)";
        if (newStatus === "READY") {
          title = "ອາຫານພ້ອມເສີຟແລ້ວ! (READY)";
        } else if (newStatus === "SERVED") {
          title = "ເສີຟອາຫານຮຽບຮ້ອຍແລ້ວ! (SERVED)";
        }

        setChefAlert({
          open: true,
          title,
          message: `${item.quantity}x ${item.product.name}`,
          subText: `ໂຕະ: ${tableName} ${newStatus === "READY" ? "• ພະນັກງານສາມາດນຳໄປເສີຟໄດ້ທັນທີ" : ""}`,
          imageUrl: itemImg,
          status: newStatus as any,
        });

        // Auto close alert after 3 seconds
        setTimeout(() => {
          setChefAlert(prev => ({ ...prev, open: false }));
        }, 3000);

        toast.success(`ອັບເດດສະຖານະເປັນ ${newStatus} ແລ້ວ`);
      } else {
        toast.error("ອັບເດດສະຖານະບໍ່ສຳເລັດ");
      }
    } catch (error) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບເດດ");
    } finally {
      setUpdatingId(null);
    }
  };

  // Group items by Order
  const groupedOrders = items.reduce((acc: Record<string, OrderGroup>, item) => {
    if (!acc[item.order.id]) {
      acc[item.order.id] = {
        orderId: item.order.id,
        tableName: item.order.table?.name || "Walk-in / ສັ່ງກັບບ້ານ",
        customerName: item.order.customerName,
        customerNote: item.order.customerNote || "",
        createdAt: item.order.createdAt,
        items: []
      };
    }
    acc[item.order.id].items.push(item);
    return acc;
  }, {});

  const orders = Object.values(groupedOrders).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  if (loading && items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-zinc-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="h-full p-3 sm:p-5 md:p-6 overflow-y-auto custom-scrollbar relative">
      
      {/* ── Chef Status Pop-up Alert Modal ── */}
      {chefAlert.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl border p-6 sm:p-8 text-center shadow-2xl transition-all scale-100 ${
            chefAlert.status === "READY" 
              ? "bg-gradient-to-b from-emerald-950/95 via-zinc-900 to-zinc-950 border-emerald-500/60 shadow-emerald-500/20" :
            chefAlert.status === "PREPARING"
              ? "bg-gradient-to-b from-blue-950/95 via-zinc-900 to-zinc-950 border-blue-500/60 shadow-blue-500/20" :
              "bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 border-zinc-700 shadow-zinc-500/10"
          }`}>
            <div className="flex justify-center mb-5">
              <div className="relative">
                {chefAlert.imageUrl ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-zinc-900">
                    <img 
                      src={chefAlert.imageUrl} 
                      alt={chefAlert.message} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner ${
                    chefAlert.status === "READY" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-bounce" :
                    chefAlert.status === "PREPARING" ? "bg-blue-500/20 text-blue-400 border border-blue-500/40" :
                    "bg-zinc-700 text-zinc-300"
                  }`}>
                    {chefAlert.status === "READY" && <CheckCircle className="w-10 h-10" />}
                    {chefAlert.status === "PREPARING" && <ChefHat className="w-10 h-10" />}
                    {chefAlert.status === "SERVED" && <CheckSquare className="w-10 h-10" />}
                  </div>
                )}
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                  chefAlert.status === "READY" ? "bg-emerald-500 text-white" :
                  chefAlert.status === "PREPARING" ? "bg-blue-500 text-white" :
                  "bg-zinc-600 text-white"
                }`}>
                  {chefAlert.status === "READY" ? <Check className="w-4 h-4" /> : <ChefHat className="w-4 h-4" />}
                </div>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white">{chefAlert.title}</h3>
            
            <div className="mt-4 p-4 bg-zinc-800/90 rounded-2xl border border-zinc-700/80 shadow-md">
              <p className="text-lg sm:text-xl font-extrabold text-amber-300 break-words">
                {chefAlert.message}
              </p>
              {chefAlert.subText && (
                <p className="text-xs sm:text-sm font-semibold text-zinc-400 mt-1.5">
                  {chefAlert.subText}
                </p>
              )}
            </div>

            <div className="mt-6">
              <Button 
                onClick={() => setChefAlert(prev => ({ ...prev, open: false }))}
                className={`w-full py-6 text-base font-extrabold rounded-2xl shadow-lg transition-all active:scale-95 ${
                  chefAlert.status === "READY" 
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40" :
                  chefAlert.status === "PREPARING"
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40" :
                    "bg-zinc-700 hover:bg-zinc-600 text-white"
                }`}
              >
                <Check className="w-5 h-5 mr-1.5" />
                <span>ຕົກລົງ / ຮັບຊາບ (OK)</span>
              </Button>
            </div>
            <p className="text-[11px] text-zinc-400 mt-3 font-medium flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-zinc-500" />
              <span>ໜ້າຕ່າງຈະປິດອັດຕະໂນມັດພາຍໃນ 3 ວິນາທີ</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Image Full Zoom Preview Modal ── */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative"
          >
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <h4 className="text-sm font-bold text-white truncate pr-2">
                {zoomImage.name}
              </h4>
              <button 
                onClick={() => setZoomImage(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-square max-h-[70vh] bg-zinc-950 flex items-center justify-center">
              <img 
                src={zoomImage.url} 
                alt={zoomImage.name} 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Orders Board ── */}
      {orders.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-70 min-h-[50vh] space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 shadow-inner">
            <ChefHat size={44} />
          </div>
          <h2 className="text-xl font-bold text-zinc-300">ບໍ່ມີຄິວອາຫານໃນຂະນະນີ້</h2>
          <p className="text-sm text-zinc-500">ທຸກລາຍການຖືກປຸງແຕ່ງ ແລະ ເສີຟຄົບຮຽບຮ້ອຍແລ້ວ (Zero pending kitchen orders)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 w-full items-start pb-8">
          {(orders || []).map((order) => {
            const timeDiff = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
            const isWarning = timeDiff > 15;
            
            return (
              <div 
                key={order.orderId} 
                className={`w-full flex flex-col rounded-2xl border ${
                  isWarning 
                    ? 'border-red-500/50 bg-red-950/20 shadow-red-500/5' 
                    : 'border-zinc-800/80 bg-zinc-900/90'
                } shadow-xl overflow-hidden transition-all duration-200`}
              >
                {/* Header */}
                <div className={`p-4 border-b flex justify-between items-start gap-2 ${
                  isWarning ? 'bg-red-500/20 border-red-500/30' : 'bg-zinc-800/80 border-zinc-700/80'
                }`}>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-black text-white leading-tight break-words">
                      {order.tableName}
                    </h3>
                    <p className="text-zinc-300 text-xs sm:text-sm mt-1 font-medium truncate">
                      {order.customerName}
                    </p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm ${
                    isWarning ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-700 text-zinc-200'
                  }`}>
                    <Clock size={13} className="shrink-0" />
                    <span>{timeDiff} ນາທີ</span>
                  </div>
                </div>
                
                {/* Customer Note */}
                {order.customerNote && (
                  <div className="px-4 py-2.5 bg-amber-500/10 text-amber-300 text-xs sm:text-sm border-b border-amber-500/20 font-medium leading-relaxed break-words flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>ໝາຍເຫດ: {order.customerNote}</span>
                  </div>
                )}
                
                {/* Items in this Order */}
                <div className="p-3 flex-1 space-y-2.5">
                  {(order.items || []).map(item => {
                    const itemImg = getItemImage(item);

                    return (
                      <div 
                        key={item.id} 
                        className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                          item.status === 'PREPARING' 
                            ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20' 
                            : item.status === 'READY'
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-zinc-800/60 border-zinc-700/60 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          
                          {/* ── Product Image with Zoom Click ── */}
                          <div 
                            onClick={() => setZoomImage({ url: itemImg, name: item.product.name })}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-700/60 shrink-0 relative cursor-pointer group shadow-md"
                            title="ກົດເພື່ອເບິ່ງຮູບໃຫຍ່"
                          >
                            <img 
                              src={itemImg} 
                              alt={item.product.name} 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-4 h-4 text-white" />
                            </div>
                          </div>

                          {/* Quantity Badge */}
                          <div className={`w-8 h-8 rounded-xl bg-zinc-900/90 border border-zinc-700/50 flex items-center justify-center font-extrabold text-xs shrink-0 shadow-inner ${
                            item.status === 'PREPARING' ? 'text-blue-400 border-blue-500/30' : 'text-zinc-200'
                          }`}>
                            {item.quantity}x
                          </div>

                          {/* Product Name & Status Indicator */}
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-xs sm:text-sm leading-snug break-words ${
                              item.status === 'READY' ? 'line-through opacity-50 text-zinc-400' : 'text-white'
                            }`}>
                              {item.product.name}
                            </p>
                            {item.status === 'PREPARING' && (
                              <p className="text-[11px] text-blue-400 mt-1 font-semibold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping inline-block" />
                                <span>ກຳລັງປຸງແຕ່ງ...</span>
                              </p>
                            )}
                            {item.status === 'READY' && (
                              <p className="text-[11px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 inline" />
                                <span>ພ້ອມເສີຟແລ້ວ</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Status Action Buttons */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {item.status === 'PENDING' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateStatus(item, "PREPARING", order.tableName)}
                              disabled={updatingId === item.id}
                              className="bg-blue-600 hover:bg-blue-500 h-9 px-3 text-xs font-bold min-w-[84px] rounded-lg shadow-md shadow-blue-600/20 flex items-center justify-center gap-1"
                            >
                              <UtensilsCrossed className="w-3.5 h-3.5" />
                              <span>ທຳອາຫານ</span>
                            </Button>
                          )}
                          {item.status === 'PREPARING' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateStatus(item, "READY", order.tableName)}
                              disabled={updatingId === item.id}
                              className="bg-emerald-600 hover:bg-emerald-500 h-9 px-3 text-xs font-bold min-w-[84px] rounded-lg shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1"
                            >
                              <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                              <span>ພ້ອມເສີຟ</span>
                            </Button>
                          )}
                          {item.status === 'READY' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateStatus(item, "SERVED", order.tableName)}
                              disabled={updatingId === item.id}
                              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 h-9 px-3 text-xs font-bold min-w-[84px] rounded-lg flex items-center justify-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>ເສີຟແລ້ວ</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
