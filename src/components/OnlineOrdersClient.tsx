"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ShoppingCart, Clock, CreditCard, CheckCircle, XCircle, Search, Filter, ChevronRight, User, Phone, MapPin, Package, FileText, ArrowRight, RefreshCw, Store } from "lucide-react";
import { toast } from "sonner";
import { PaginationControls } from "@/components/PaginationControls";

export default function OnlineOrdersClient({ 
  initialOrders,
  initialTotal,
  initialStats,
  isAdmin = false,
  sellers = []
}: { 
  initialOrders: any[],
  initialTotal?: number,
  initialStats?: { total: number; pending: number; completed: number; revenue: number },
  isAdmin?: boolean,
  sellers?: { id: string; name: string | null }[]
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [totalItems, setTotalItems] = useState(initialTotal ?? initialOrders.length);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isRefreshingSilently, setIsRefreshingSilently] = useState(false);
  const isFirstRender = useRef(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sellerFilter, setSellerFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchOrdersPage = useCallback(async (page: number, limit: number, q: string, status: string, seller: string, silent = false) => {
    if (!silent) {
      setIsLoadingPage(true);
    } else {
      setIsRefreshingSilently(true);
    }
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (q.trim()) params.set("search", q.trim());
      if (status !== "ALL") params.set("status", status);
      if (isAdmin && seller !== "ALL") params.set("sellerId", seller);

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          setOrders(json.data);
          setTotalItems(json.total ?? json.data.length);
        }
      }
    } catch (e) {
      console.error("Failed to fetch online orders page", e);
    } finally {
      if (!silent) setIsLoadingPage(false);
      setIsRefreshingSilently(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchOrdersPage(currentPage, itemsPerPage, search, statusFilter, sellerFilter);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, itemsPerPage, search, statusFilter, sellerFilter, fetchOrdersPage]);

  // Real-time auto-refresh: Listen to new order events and poll every 4s
  useEffect(() => {
    const handleOrderEvent = () => {
      fetchOrdersPage(currentPage, itemsPerPage, search, statusFilter, sellerFilter, true);
    };

    window.addEventListener("refresh-orders", handleOrderEvent);
    window.addEventListener("new-orders-detected", handleOrderEvent);

    const autoSyncInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchOrdersPage(currentPage, itemsPerPage, search, statusFilter, sellerFilter, true);
      }
    }, 4000);

    return () => {
      window.removeEventListener("refresh-orders", handleOrderEvent);
      window.removeEventListener("new-orders-detected", handleOrderEvent);
      clearInterval(autoSyncInterval);
    };
  }, [fetchOrdersPage, currentPage, itemsPerPage, search, statusFilter, sellerFilter]);
  
  // Calculate stats
  const totalOrders = initialStats?.total ?? totalItems;
  const pendingOrders = initialStats?.pending ?? orders.filter(o => o.status === "PENDING").length;
  const completedOrders = initialStats?.completed ?? orders.filter(o => o.status === "COMPLETED").length;
  const totalRevenue = initialStats?.revenue ?? orders.reduce((sum, o) => o.status === "COMPLETED" ? sum + o.totalAmount : sum, 0);

  // Current page orders (already filtered & paginated on server)
  const filteredOrders = orders;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`ອັບເດດສະຖານະເປັນ ${newStatus} ສຳເລັດແລ້ວ`);
        setOrders(orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "ອັບເດດສະຖານະບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PENDING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CANCELLED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header section with Stats */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">ອໍເດີອອນລາຍ</h1>
            <p className="text-zinc-400 mt-1 text-sm">Online Orders Management</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="font-medium text-sm">ອໍເດີທັງໝົດ</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalOrders}</div>
          </div>
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span className="font-medium text-sm">ລໍຖ້າດຳເນີນການ</span>
            </div>
            <div className="text-3xl font-bold text-amber-400">{pendingOrders}</div>
          </div>
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="font-medium text-sm">ສຳເລັດແລ້ວ</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">{completedOrders}</div>
          </div>
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <span className="font-medium text-sm">ຍອດຂາຍອອນລາຍ</span>
            </div>
            <div className="text-3xl font-bold text-white">₭ {totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Order List */}
        <div className={`${selectedOrder ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all duration-300`}>
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
            {/* Filters */}
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/50 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-center justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="ຄົ້ນຫາລະຫັດ ຫຼື ຊື່ລູກຄ້າ..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                {["ALL", "PENDING", "PROCESSING", "COMPLETED", "CANCELLED"].map(status => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                      statusFilter === status 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {status === "ALL" ? "ທັງໝົດ" : status}
                  </button>
                ))}
              </div>
              {isMounted && isAdmin && sellers && sellers.length > 0 && (
                <div className="w-full sm:w-auto">
                  <select
                    value={sellerFilter}
                    onChange={(e) => { setSellerFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="ALL">ຮ້ານຄ້າທັງໝົດ (All Stores)</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || `Store (${s.id.slice(-6)})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Real-time Status Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">ອັບເດດສົດ (Real-time)</span>
                <button
                  type="button"
                  onClick={() => fetchOrdersPage(currentPage, itemsPerPage, search, statusFilter, sellerFilter, false)}
                  disabled={isLoadingPage || isRefreshingSilently}
                  className="p-1 hover:text-white transition-colors disabled:opacity-50"
                  title="ກົດຣີເຟຣຊຂໍ້ມູນດຽວນີ້"
                >
                  <RefreshCw size={13} className={isLoadingPage || isRefreshingSilently ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className={`divide-y divide-zinc-800/40 ${isLoadingPage ? 'opacity-60 pointer-events-none transition-opacity' : ''}`}>
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-400 text-lg">ບໍ່ພົບລາຍການອໍເດີ</p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div 
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-3 sm:p-4 cursor-pointer transition-all hover:bg-zinc-800/30 flex items-center justify-between gap-2 sm:gap-4 group ${
                      selectedOrder?.id === order.id ? 'bg-blue-500/5 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-4 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-blue-400 transition-colors shrink-0">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h3 className="font-bold text-white text-sm sm:text-base">#{order.id.slice(-6).toUpperCase()}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)} {order.status}
                          </span>
                          {isAdmin && (order.organization || order.user) && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold text-xs truncate max-w-[130px] sm:max-w-[200px] inline-flex items-center gap-1">
                              <Store className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="truncate">{order.organization?.name || order.user?.name || `Store (${(order.organizationId || order.userId || "").slice(-6)})`}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-zinc-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1 min-w-0 max-w-full"><User className="w-3 h-3 shrink-0" /> <span className="truncate">{order.customerName || "ລູກຄ້າທົ່ວໄປ"}</span></span>
                          <span className="flex items-center gap-1 shrink-0" suppressHydrationWarning><Clock className="w-3 h-3 shrink-0" /> {new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <div className="text-right shrink-0">
                        <div className="text-[10px] sm:text-sm text-zinc-500 mb-0.5">ຍອດລວມ</div>
                        <div className="font-bold text-emerald-400 text-sm sm:text-lg whitespace-nowrap">₭ {order.totalAmount.toLocaleString()}</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform ${selectedOrder?.id === order.id ? 'text-blue-500 translate-x-1' : 'text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-1'}`} />
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 pb-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(size) => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Order Details */}
        {selectedOrder && (
          <div className="lg:col-span-5 animate-in slide-in-from-right-8 duration-300">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl sticky top-6">
              
              {/* Detail Header */}
              <div className="p-6 border-b border-zinc-800/80 bg-gradient-to-b from-zinc-800/20 to-transparent">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">ອໍເດີ #{selectedOrder.id.slice(-6).toUpperCase()}</h2>
                    <p className="text-sm text-zinc-400">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)} {selectedOrder.status}
                  </span>
                  {isAdmin && (selectedOrder.organization || selectedOrder.user) && (
                    <span className="text-xs font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>{selectedOrder.organization?.name || selectedOrder.user?.name || `Store (${(selectedOrder.organizationId || selectedOrder.userId || "").slice(-6)})`}</span>
                    </span>
                  )}
                  <span className="text-sm text-zinc-400 bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700/50">
                    ການຊຳລະ: {selectedOrder.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-6 border-b border-zinc-800/80 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-2">ຂໍ້ມູນລູກຄ້າ</h3>
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-zinc-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-zinc-200">{selectedOrder.customerName || "ລູກຄ້າທົ່ວໄປ"}</div>
                  </div>
                </div>
                {selectedOrder.customerPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-zinc-500 mt-0.5" />
                    <div className="text-sm text-zinc-400">{selectedOrder.customerPhone}</div>
                  </div>
                )}
                {selectedOrder.customerAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-zinc-500 mt-0.5" />
                    <div className="text-sm text-zinc-400 leading-relaxed">{selectedOrder.customerAddress}</div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="p-6 border-b border-zinc-800/80 bg-zinc-950/30">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">ລາຍການສິນຄ້າ</h3>
                
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="space-y-4">
                    {selectedOrder.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-xs font-bold text-zinc-300 border border-zinc-700">
                            {item.quantity}x
                          </div>
                          <div>
                            <div className="text-sm font-medium text-zinc-200">{item.productName || "ສິນຄ້າ"}</div>
                            {item.variantName && <div className="text-xs text-zinc-500">{item.variantName}</div>}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-zinc-300">
                          ₭ {(item.quantity * item.unitPrice).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-zinc-500 italic">ບໍ່ພົບລາຍລະອຽດສິນຄ້າ (ຂໍ້ມູນເກົ່າ)</div>
                )}

                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex justify-between items-center">
                  <span className="text-zinc-400">ຍອດລວມທັງໝົດ</span>
                  <span className="text-2xl font-bold text-emerald-400">₭ {selectedOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 bg-zinc-950/50">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">ອັບເດດສະຖານະອໍເດີ</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, "PROCESSING")}
                    className="w-full py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl text-sm font-medium transition-colors"
                  >
                    ກຳລັງກຽມເຄື່ອງ
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, "COMPLETED")}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 rounded-xl text-sm font-medium transition-colors"
                  >
                    ຈັດສົ່ງສຳເລັດ
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, "CANCELLED")}
                    className="w-full col-span-2 py-2.5 bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-colors"
                  >
                    ຍົກເລີກອໍເດີ (Cancel)
                  </button>
                  <a
                    href="/dashboard/shipping"
                    className="w-full col-span-2 py-2.5 bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4 text-indigo-400" />
                    <span>ເບິ່ງໃນໜ້າຂົນສົ່ງ & ພິມໃບສົ່ງເຄື່ອງ (Shipping)</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
