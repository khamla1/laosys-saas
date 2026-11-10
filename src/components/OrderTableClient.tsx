"use client";

import { askConfirm } from "@/components/ConfirmModal";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OrderStatusActions } from "@/components/OrderStatusActions";
import { BulkOrderStatusActions } from "@/components/BulkOrderStatusActions";
import { Search, Calendar, Package, Trash2, Loader2, Printer, Ban, Camera, RefreshCw, Store } from "lucide-react";
import { useConfirm } from "@/components/ConfirmModalProvider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PaginationControls } from "@/components/PaginationControls";
import { CameraScannerModal } from "@/components/CameraScannerModal";
import {
  BillVerifyResultCard,
  BillVerifyResultData,
  formatTimeDiffLao,
  formatDateTimeLaoStandard,
} from "@/components/BillVerifyResultCard";

type Product = {
  id: string;
  name: string;
  images: string[];
};

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  productId: string;
  product?: Product;
};

type Order = {
  id: string;
  totalAmount: number;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerAddress: string | null;
  customerNote: string | null;
  paymentSlipUrl?: string | null;
  createdAt: Date;
  userId?: string;
  user?: { name: string | null; email: string | null; };
  organizationId?: string;
  organization?: { name: string | null };
  table?: { name: string } | null;
  items: OrderItem[];
};

export function OrderTableClient({ 
  orders: initialOrders, 
  initialTotal,
  isAdmin = false, 
  t, 
  statusDict,
  sellers = []
}: { 
  orders: Order[], 
  initialTotal?: number,
  isAdmin?: boolean, 
  t: any, 
  statusDict?: any,
  sellers?: { id: string; name: string | null; email?: string | null; }[]
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [totalItems, setTotalItems] = useState(initialTotal ?? initialOrders.length);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isRefreshingSilently, setIsRefreshingSilently] = useState(false);
  const isFirstRender = useRef(true);

  const [search, setSearch] = useState("");
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [sellerFilter, setSellerFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsCache, setDetailsCache] = useState<Record<string, Order>>({});
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const router = useRouter();
  const { confirm } = useConfirm();

  const fetchOrdersPage = useCallback(async (page: number, limit: number, q: string, status: string, date: string, seller: string, silent = false) => {
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
      if (date !== "ALL") params.set("dateFilter", date);
      if (isAdmin && seller !== "ALL") params.set("sellerId", seller);

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          setOrders(json.data);
          setTotalItems(json.total ?? json.data.length);
        }
      }
    } catch (error) {
      console.error("Failed to fetch paginated orders", error);
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
      fetchOrdersPage(currentPage, itemsPerPage, search, statusFilter, dateFilter, sellerFilter);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, itemsPerPage, search, statusFilter, dateFilter, sellerFilter, fetchOrdersPage]);

  // Real-time auto-refresh: Listen to new order events and poll every 4s when tab is active
  useEffect(() => {
    const handleOrderEvent = () => {
      fetchOrdersPage(currentPage, itemsPerPage, search, statusFilter, dateFilter, sellerFilter, true);
    };

    window.addEventListener("refresh-orders", handleOrderEvent);
    window.addEventListener("new-orders-detected", handleOrderEvent);

    const autoSyncInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchOrdersPage(currentPage, itemsPerPage, search, statusFilter, dateFilter, sellerFilter, true);
      }
    }, 4000);

    return () => {
      window.removeEventListener("refresh-orders", handleOrderEvent);
      window.removeEventListener("new-orders-detected", handleOrderEvent);
      clearInterval(autoSyncInterval);
    };
  }, [fetchOrdersPage, currentPage, itemsPerPage, search, statusFilter, dateFilter, sellerFilter]);

  const handleDelete = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (!(await askConfirm("Are you sure you want to delete this order? This action cannot be undone.", { variant: "destructive" }))) return;

    setIsDeleting(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete order");
      }

      setOrders(prev => prev.filter(o => o.id !== orderId));
      setTotalItems(prev => Math.max(0, prev - 1));
      toast.success("Order deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("An error occurred while deleting the order.");
    } finally {
      setIsDeleting(null);
    }
  };

  // Current page orders (already filtered & paginated on the server)
  const filteredOrders = orders;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const rowVirtualizer = useVirtualizer({
    count: filteredOrders.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 65, // approximate row height in pixels
    overscan: 5,
  });

  const handleMouseEnter = useCallback((orderId: string) => {
    if (detailsCache[orderId]) return;
    
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    hoverTimeoutRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllersRef.current.set(orderId, controller);
      
      try {
        const res = await fetch(`/api/orders/${orderId}`, { signal: controller.signal });
        if (res.ok) {
          const fullOrder = await res.json();
          setDetailsCache(prev => ({ ...prev, [orderId]: fullOrder }));
        }
      } catch (e: any) {
        // silent fail or abort
      } finally {
        abortControllersRef.current.delete(orderId);
      }
    }, 150);
  }, [detailsCache]);

  const handleMouseLeave = useCallback((orderId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const controller = abortControllersRef.current.get(orderId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(orderId);
    }
  }, []);

  const handleRowClick = async (order: Order) => {
    handleMouseLeave(order.id);
    setDetailsError(null);

    if (detailsCache[order.id]) {
      setSelectedOrder(detailsCache[order.id]);
      return;
    }
    setSelectedOrder(order);
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (res.ok) {
        const fullOrder = await res.json();
        setDetailsCache(prev => ({ ...prev, [order.id]: fullOrder }));
        setSelectedOrder(fullOrder);
      } else {
        setDetailsError("Failed to load details. Please try again.");
      }
    } catch (e) {
      setDetailsError("Network error. Please check your connection.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOrder = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedOrderIds(prev => [...prev, id]);
    } else {
      setSelectedOrderIds(prev => prev.filter(orderId => orderId !== id));
    }
  };

  const selectedOrders = filteredOrders.filter(o => selectedOrderIds.includes(o.id));
  const uniqueStatuses = Array.from(new Set(selectedOrders.map(o => o.status)));
  const hasSameStatus = uniqueStatuses.length === 1;

  const buildOrderInspectionResult = (order: Order): BillVerifyResultData => {
    const shortId = `#ORD-${order.id.slice(-6).toUpperCase()}`;
    const createdDt = new Date(order.createdAt);
    // 7-day standard return/exchange guarantee on sales bills
    const returnWindowDt = new Date(createdDt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = formatTimeDiffLao(returnWindowDt, now);

    if (order.status === "CANCELLED") {
      return {
        code: shortId,
        typeLabel: "ໃບບິນຂາຍສິນຄ້າ (Sales Order Receipt)",
        status: "CANCELLED",
        statusTitle: "ໃບບິນຂາຍນີ້ຖືກຍົກເລີກແລ້ວ (CANCELLED)",
        expiryMessage: `ອໍເດີ ${shortId} ຂອງລູກຄ້າ "${order.customerName}" ຖືກຍົກເລີກແລ້ວ.`,
        customerName: `${order.customerName}${order.customerPhone ? ` (${order.customerPhone})` : ""}`,
        startDateFormatted: formatDateTimeLaoStandard(createdDt),
        amountFormatted: `₭${order.totalAmount.toLocaleString()}`,
        onViewReceipt: () => handleRowClick(order),
      };
    }

    if (order.status === "PENDING") {
      return {
        code: shortId,
        typeLabel: "ໃບບິນຂາຍສິນຄ້າ (Sales Order Receipt)",
        status: "UPCOMING",
        statusTitle: "ລໍຖ້າຊຳລະເງິນ (PENDING) • ຍັງບໍ່ໝົດອາຍຸ",
        expiryMessage: `ບິນ ${shortId} ຍັງຢູ່ໃນສະຖານະລໍຖ້າຢືນຢັນການຊຳລະເງິນ (ຍອດ ₭${order.totalAmount.toLocaleString()}).`,
        customerName: `${order.customerName}${order.customerPhone ? ` (${order.customerPhone})` : ""}`,
        startDateFormatted: formatDateTimeLaoStandard(createdDt),
        endDateFormatted: formatDateTimeLaoStandard(returnWindowDt),
        amountFormatted: `₭${order.totalAmount.toLocaleString()}`,
        onViewReceipt: () => handleRowClick(order),
      };
    }

    if (diff.isPast) {
      return {
        code: shortId,
        typeLabel: "ໃບບິນຂາຍສິນຄ້າ (Sales Order Receipt)",
        status: "EXPIRED",
        statusTitle: `ຊຳລະເງິນແລ້ວ (${order.status}) • ໝົດໄລຍະປະກັນປ່ຽນ/ຄືນສິນຄ້າ 7 ວັນແລ້ວ!`,
        expiryMessage: `ໃບບິນ ${shortId} ອອກເມື່ອ ${formatDateTimeLaoStandard(createdDt)} — ພົ້ນກຳນົດປ່ຽນ/ຄືນສິນຄ້າ 7 ວັນມາແລ້ວ ${diff.text}.`,
        customerName: `${order.customerName}${order.customerPhone ? ` (${order.customerPhone})` : ""}`,
        startDateFormatted: formatDateTimeLaoStandard(createdDt),
        endDateFormatted: formatDateTimeLaoStandard(returnWindowDt),
        amountFormatted: `₭${order.totalAmount.toLocaleString()}`,
        extraBadgeText: `ພົ້ນປະກັນບິນ ${diff.text}`,
        onViewReceipt: () => handleRowClick(order),
      };
    }

    return {
      code: shortId,
      typeLabel: "ໃບບິນຂາຍສິນຄ້າ (Sales Order Receipt)",
      status: "VALID",
      statusTitle: `ບິນຖືກຕ້ອງ (${order.status}) • ຍັງຢູ່ໃນໄລຍະປະກັນບິນ 7 ວັນ (ໃຊ້ງານໄດ້)`,
      expiryMessage: `ໃບບິນ ${shortId} ຍັງຢູ່ໃນໄລຍະຮັບປະກັນປ່ຽນ/ຄືນສິນຄ້າ — ເຫຼືອເວລາອີກ ${diff.text} (ສິ້ນສຸດ ${formatDateTimeLaoStandard(returnWindowDt)}).`,
      customerName: `${order.customerName}${order.customerPhone ? ` (${order.customerPhone})` : ""}`,
      startDateFormatted: formatDateTimeLaoStandard(createdDt),
      endDateFormatted: formatDateTimeLaoStandard(returnWindowDt),
      amountFormatted: `₭${order.totalAmount.toLocaleString()}`,
      extraBadgeText: `ເຫຼືອປະກັນ ${diff.text}`,
      onViewReceipt: () => handleRowClick(order),
    };
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <Input 
              placeholder={t.searchPlaceholder || "ພິມລະຫັດບິນ #ORD-..., ຊື່ລູກຄ້າ, ເບີໂທ..."} 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-3 sm:px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/20 active:scale-95"
            title="ເປີດກ້ອງສະແກນບາໂຄດບິນ / ໃບຮັບເງິນ"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">ເປີດກ້ອງສະແກນບິນ (Camera Scan)</span>
            <span className="sm:hidden">ກ້ອງສະແກນ</span>
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="flex-1 sm:flex-none bg-zinc-800 border border-zinc-700 rounded-md text-sm px-3 py-2 text-zinc-200 outline-none focus:border-blue-500 min-w-[130px]"
          >
            <option value="ALL">{t.allStatus}</option>
            <option value="PENDING">{statusDict?.PENDING || "Pending"}</option>
            <option value="PAID">{statusDict?.PAID || "Paid"}</option>
            <option value="SHIPPED">{statusDict?.SHIPPED || "Shipped"}</option>
            <option value="COMPLETED">{statusDict?.COMPLETED || "Completed"}</option>
            <option value="CANCELLED">{statusDict?.CANCELLED || "Cancelled"}</option>
          </select>
          <select 
            value={dateFilter} 
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="flex-1 sm:flex-none bg-zinc-800 border border-zinc-700 rounded-md text-sm px-3 py-2 text-zinc-200 outline-none focus:border-blue-500 min-w-[130px]"
          >
            <option value="ALL">{t.allTime}</option>
            <option value="TODAY">{t.today}</option>
            <option value="WEEK">{t.last7Days}</option>
            <option value="MONTH">{t.thisMonth}</option>
          </select>
          {isAdmin && sellers.length > 0 && (
            <select 
              value={sellerFilter} 
              onChange={(e) => { setSellerFilter(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-auto bg-zinc-800 border border-zinc-700 rounded-md text-sm px-3 py-2 text-zinc-200 outline-none focus:border-blue-500"
            >
              <option value="ALL">ຜູ້ຂາຍທັງໝົດ (All Stores)</option>
              {sellers.map(s => (
                <option key={s.id} value={s.id}>{s.name || s.email || s.id}</option>
              ))}
            </select>
          )}

          {/* Live Sync Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">ອັບເດດສົດ (Real-time)</span>
            <button
              type="button"
              onClick={() => fetchOrdersPage(currentPage, itemsPerPage, search, statusFilter, dateFilter, sellerFilter, false)}
              disabled={isLoadingPage || isRefreshingSilently}
              className="p-1 hover:text-white transition-colors disabled:opacity-50"
              title="ກົດຣີເຟຣຊຂໍ້ມູນດຽວນີ້"
            >
              <RefreshCw size={13} className={isLoadingPage || isRefreshingSilently ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* -- Scanned / Searched Order Bill Verification Banner -- */}
      {search.trim().length >= 3 && !isLoadingPage && (
        <BillVerifyResultCard
          data={
            filteredOrders.length >= 1
              ? buildOrderInspectionResult(filteredOrders[0])
              : {
                  code: search.trim().toUpperCase(),
                  typeLabel: "ໃບບິນຂາຍສິນຄ້າ (Sales Order Receipt)",
                  status: "NOT_FOUND",
                  statusTitle: "ບໍ່ພົບລະຫັດໃບບິນອໍເດີນີ້ໃນລະບົບ",
                  expiryMessage: `ບໍ່ພົບຂໍ້ມູນອໍເດີທີ່ກົງກັບລະຫັດ "${search.trim()}" — ກະລຸນາກວດສອບລະຫັດບິນອີກຄັ້ງ.`,
                }
          }
          onClose={() => setSearch("")}
        />
      )}

      {/* Orders Table */}
      <div ref={tableContainerRef} className={`rounded-xl border border-zinc-800/80 overflow-auto h-[600px] lg:h-[1350px] relative bg-zinc-950/50 shadow-xl backdrop-blur-xl ${isLoadingPage ? 'opacity-60 pointer-events-none transition-opacity' : ''}`}>
        <Table className="min-w-[320px] sm:min-w-[800px]">
          <TableHeader className="sticky top-0 z-20 bg-zinc-900/90 backdrop-blur shadow-sm outline outline-1 outline-zinc-800/50">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-zinc-900 cursor-pointer"
                />
              </TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t.orderId}</TableHead>
              {isAdmin && <TableHead className="hidden lg:table-cell text-xs font-semibold text-zinc-400 uppercase tracking-wider">Store / Owner</TableHead>}
              <TableHead className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t.customer}</TableHead>
              <TableHead className="hidden md:table-cell text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t.itemsSummary}</TableHead>
              <TableHead className="text-right sm:text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t.status}</TableHead>
              <TableHead className="hidden md:table-cell text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t.total}</TableHead>
              <TableHead className="hidden md:table-cell text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t.date}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow className="border-zinc-800 bg-zinc-900/30">
                <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-zinc-500 py-12">
                  <Package className="mx-auto h-8 w-8 text-zinc-600 mb-3" />
                  {t.noOrders}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <TableRow>
                    <TableCell style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px`, padding: 0, border: 0 }} colSpan={isAdmin ? 8 : 7} />
                  </TableRow>
                )}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const order = filteredOrders[virtualRow.index];
                  return (
                    <TableRow 
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      className="border-zinc-800/50 hover:border-blue-500/30 hover:bg-blue-500/5 cursor-pointer transition-all duration-300 group animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-8 before:bg-blue-500 before:rounded-r-full before:opacity-0 hover:before:opacity-100 before:transition-opacity before:shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                      style={{ animationDelay: `${(virtualRow.index % 10) * 50}ms` }}
                      onClick={() => handleRowClick(order)}
                      onMouseEnter={() => handleMouseEnter(order.id)}
                      onMouseLeave={() => handleMouseLeave(order.id)}
                    >
                      <TableCell className="w-12 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={(e) => handleSelectOrder(e.target.checked, order.id)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-zinc-900 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="align-top sm:align-middle font-mono text-xs text-zinc-400">
                        <span className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">{order.id.slice(-8)}</span>
                        {/* Mobile Date */}
                        <div className="md:hidden text-[10px] text-zinc-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="hidden lg:table-cell text-zinc-300">
                          <div className="font-medium text-sm text-purple-400">{order.organization?.name || order.user?.name || "No Store"}</div>
                          <div className="text-xs opacity-70">{order.user?.email || ""}</div>
                        </TableCell>
                      )}
                      <TableCell className="align-top sm:align-middle text-zinc-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs uppercase shadow-inner border border-blue-500/20 shrink-0">
                            {order.table ? 'T' : (order.customerName ? order.customerName.charAt(0) : '?')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm sm:text-base truncate flex items-center gap-2">
                              {order.customerName}
                              {order.table && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/50">
                                  ໂຕະ {order.table.name}
                                </span>
                              )}
                            </div>
                            {isAdmin && (order.organization || order.user) && (
                              <div className="mt-1 flex items-center gap-1.5 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md w-fit max-w-full">
                                <Store className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <span className="text-[11px] font-bold text-purple-300 truncate">
                                  {order.organization?.name || order.user?.name || `Store (${(order.organizationId || order.userId || "").slice(-6)})`}
                                </span>
                              </div>
                            )}
                            {order.customerPhone && <div className="text-[10px] sm:text-xs text-zinc-500 truncate">{order.customerPhone}</div>}
                          </div>
                        </div>
                        {/* Mobile Items Summary and Total */}
                        <div className="md:hidden mt-2 flex flex-col gap-0.5">
                          <div className="text-[10px] text-zinc-400">
                            {order.items.length} {t.uniqueProducts} ({order.items.reduce((acc, i) => acc + i.quantity, 0)} {t.totalPcs})
                          </div>
                          <div className="text-emerald-400 font-bold text-xs mt-0.5">₭{order.totalAmount.toLocaleString()}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-zinc-300 text-sm">
                        <div className="bg-zinc-800/50 inline-flex px-2 py-1 rounded-md border border-zinc-700/50 text-xs gap-1">
                          <span className="font-semibold text-zinc-200">{order.items.length}</span> {t.uniqueProducts} 
                          <span className="text-zinc-500">({order.items.reduce((acc, i) => acc + i.quantity, 0)} {t.totalPcs})</span>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="align-top sm:align-middle text-right sm:text-left pr-4 sm:pr-0">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                          <OrderStatusActions 
                            orderId={order.id} 
                            currentStatus={order.status} 
                            statusDict={statusDict} 
                            isAdmin={isAdmin} 
                          />
                          {isAdmin && (
                            <button
                              onClick={(e) => handleDelete(e, order.id)}
                              disabled={isDeleting === order.id}
                              className="p-1.5 sm:p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50 opacity-80 group-hover:opacity-100"
                              title="Delete Order"
                            >
                              {isDeleting === order.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">₭{order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="hidden md:table-cell text-right text-zinc-500 text-sm">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <TableRow>
                    <TableCell style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px`, padding: 0, border: 0 }} colSpan={isAdmin ? 7 : 6} />
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          tableContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onItemsPerPageChange={(size) => {
          setItemsPerPage(size);
          setCurrentPage(1);
          tableContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* Sticky Bulk Action Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] md:w-auto md:min-w-[500px] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-white">
              <div className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-inner border border-blue-400">
                {selectedOrderIds.length}
              </div>
              <span className="font-medium tracking-wide">ລາຍການທີ່ເລືອກ</span>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              {!hasSameStatus ? (
                <div className="text-xs text-red-400 font-medium px-4 py-2 bg-red-950/50 rounded-lg flex items-center gap-2 w-full justify-center">
                  <Ban size={14} /> ຕ້ອງເລືອກອໍເດີທີ່ມີສະຖານະດຽວກັນ
                </div>
              ) : (
                <div className="flex gap-2 w-full md:w-auto items-center">
                  <BulkOrderStatusActions 
                    orderIds={selectedOrderIds} 
                    currentStatus={uniqueStatuses[0]} 
                    statusDict={statusDict} 
                    isAdmin={isAdmin} 
                    onSuccess={() => {
                      router.refresh();
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader className="border-b border-zinc-800 pb-4 pr-6 sm:pr-0">
                <DialogTitle className="text-xl sm:text-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <span className="break-words w-full">{t.orderDetails}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs sm:text-sm font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                      ID: {selectedOrder.id.slice(-8)}
                    </span>
                    <a 
                      href={`/receipt/${selectedOrder.id}`} 
                      target="_blank" 
                      className="text-xs sm:text-sm text-zinc-300 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <Printer size={14} />
                      {t.printReceipt}
                    </a>
                  </div>
                </DialogTitle>
                <DialogDescription className="text-zinc-400 flex items-center gap-2 pt-2 sm:pt-0">
                  <Calendar size={14} /> {t.placedOn} {new Date(selectedOrder.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
                {/* Customer Info */}
                <div className="space-y-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
                  <h3 className="text-lg font-semibold text-zinc-200 border-b border-zinc-800 pb-2">{t.customerInfo}</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start">
                      <span className="text-zinc-500 sm:w-24 shrink-0 mb-0.5 sm:mb-0">{t.name}</span> 
                      <span className="font-medium text-white">{selectedOrder.customerName}</span>
                    </div>
                    {selectedOrder.table && (
                      <div className="flex flex-col sm:flex-row sm:items-start">
                        <span className="text-zinc-500 sm:w-24 shrink-0 mb-0.5 sm:mb-0">Table</span> 
                        <span className="font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{selectedOrder.table.name}</span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-start">
                      <span className="text-zinc-500 sm:w-24 shrink-0 mb-0.5 sm:mb-0">{t.phone}</span> 
                      <span className="text-white">{selectedOrder.customerPhone || "-"}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-start">
                      <span className="text-zinc-500 sm:w-24 shrink-0 mb-0.5 sm:mb-0">{t.email}</span> 
                      <span className="text-white break-words">{selectedOrder.customerEmail}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-start">
                      <span className="text-zinc-500 sm:w-24 shrink-0 mb-0.5 sm:mb-0">{t.address}</span> 
                      <span className="text-white">{selectedOrder.customerAddress || "-"}</span>
                    </div>
                    {selectedOrder.customerNote && (
                      <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded text-yellow-500/90">
                        <span className="font-semibold block mb-1">{t.noteFromCustomer}</span>
                        {selectedOrder.customerNote}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Status */}
                <div className="space-y-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50 flex flex-col">
                  <h3 className="text-lg font-semibold text-zinc-200 border-b border-zinc-800 pb-2">{t.orderStatus}</h3>
                  <div className="flex-1 flex flex-col justify-center gap-4">
                    <div>
                      <p className="text-sm text-zinc-500 mb-1">{t.currentStatus}</p>
                      <OrderStatusActions 
                        orderId={selectedOrder.id} 
                        currentStatus={selectedOrder.status} 
                        statusDict={statusDict}
                        isAdmin={isAdmin}
                      />
                    </div>
                    <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                      <p className="text-sm text-zinc-500 mb-1">{t.totalAmountPaid}</p>
                      <p className="text-3xl font-bold text-emerald-400">₭{selectedOrder.totalAmount.toLocaleString()}</p>
                    </div>

                    {selectedOrder.paymentSlipUrl && (
                      <div className="bg-zinc-900 p-3 rounded border border-zinc-800 flex flex-col gap-2">
                        <p className="text-sm text-zinc-500 font-medium">Payment Slip</p>
                        <a href={selectedOrder.paymentSlipUrl} target="_blank" rel="noopener noreferrer" className="block w-full aspect-[4/5] relative rounded-md overflow-hidden border border-zinc-700 hover:border-emerald-500 transition-colors">
                          <img src={selectedOrder.paymentSlipUrl} alt="Payment Slip" className="absolute inset-0 w-full h-full object-contain bg-zinc-950" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity text-white text-sm font-semibold">
                            Click to View Full Size
                          </div>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-zinc-200 border-b border-zinc-800 pb-2 mb-4">{t.purchasedItems}</h3>
                
                {detailsError ? (
                  <div className="py-10 flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/50 rounded-lg border border-red-900/30">
                    <p className="text-red-400 mb-4">{detailsError}</p>
                    <button onClick={() => handleRowClick(selectedOrder!)} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-zinc-300 transition-colors border border-zinc-700">
                      Try Again
                    </button>
                  </div>
                ) : isLoadingDetails ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-center gap-4 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 animate-pulse">
                        <div className="w-16 h-16 bg-zinc-800 rounded border border-zinc-700"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-zinc-700 rounded w-1/3"></div>
                          <div className="h-3 bg-zinc-800 rounded w-1/4"></div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="h-3 bg-zinc-800 rounded w-10 ml-auto"></div>
                          <div className="h-4 bg-zinc-700 rounded w-16 ml-auto"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedOrder.items.length === 0 ? (
                      <p className="text-sm text-zinc-500 py-4 text-center">ບໍ່ມີລາຍການສິນຄ້າໃນຄຳສັ່ງຊື້ນີ້ (No items in this order)</p>
                    ) : (
                      selectedOrder.items.map(item => (
                        <div key={item.id} className="flex items-center gap-4 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                        {/* Product Image */}
                        {item.product && item.product.images && item.product.images.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.product.images[0]} alt={item.product.name} className="w-16 h-16 object-cover rounded border border-zinc-700" />
                        ) : (
                          <div className="w-16 h-16 bg-zinc-800 rounded border border-zinc-700 flex items-center justify-center text-zinc-500 text-xs">
                            No Img
                          </div>
                        )}
                        
                        {/* Product Details */}
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{item.product ? item.product.name : "ສິນຄ້າຖືກລຶບແລ້ວ (Deleted Product)"}</h4>
                          <p className="text-zinc-500 text-sm">₭{item.price.toLocaleString()} {t.each}</p>
                        </div>
                        
                        {/* Quantity & Subtotal */}
                        <div className="text-right">
                          <p className="text-zinc-400 text-sm">{t.qty} <span className="font-bold text-white">{item.quantity}</span></p>
                          <p className="font-bold text-emerald-400 mt-1">₭{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Camera Barcode / QR Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={(code) => {
          setSearch(code);
          setCurrentPage(1);
          toast.success(`ຄົ້ນຫາອໍເດີ: ${code}`);
        }}
        title="ສະແກນບາໂຄດບິນ (Scan Order Bill)"
        subtitle="ສ່ອງກ້ອງໃສ່ບາໂຄດ ຫຼື QR Code ເທິງໃບບິນເພື່ອຄົ້ນຫາອໍເດີທັນທີ"
        placeholder="ຍິງເຄື່ອງສະແກນ ຫຼື ພິມລະຫັດບິນ..."
      />
    </div>
  );
}
