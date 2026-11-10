"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  User,
  Receipt,
  Package,
  Layers,
  Settings,
  ShieldAlert,
  ArrowRight,
  Clock,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Activity,
  Trash2,
  SplitSquareHorizontal,
  Merge,
  ArrowRightLeft,
  PlusCircle,
  Tag,
  CreditCard,
  Code2,
  ExternalLink,
  ShieldCheck,
  Scale,
  Store,
  ArrowDownRight,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/excel";

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  refCode: string | null;
  details: string;
  ipAddress: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  } | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export function getFriendlyActionTitle(action: string, entityType: string) {
  const upper = (action || "").toUpperCase();

  // Data editor actions
  if (upper.includes("DATA_EDITOR")) {
    if (upper.includes("ORDER")) return "ແກ້ໄຂຂໍ້ມູນໃບບິນ / ອໍເດີ (Order Data Edited)";
    if (upper.includes("PRODUCT")) return "ແກ້ໄຂຂໍ້ມູນສິນຄ້າ (Product Data Edited)";
    if (upper.includes("STOCK")) return "ແກ້ໄຂສະຕັອກສິນຄ້າ (Stock Data Edited)";
    if (upper.includes("CUSTOMER")) return "ແກ້ໄຂຂໍ້ມູນລູກຄ້າ (Customer Data Edited)";
    if (upper.includes("SUPPLIER")) return "ແກ້ໄຂຂໍ້ມູນຜູ້ສະໜອງ (Supplier Data Edited)";
    if (upper.includes("TRANSACTION")) return "ແກ້ໄຂທຸລະກຳການເງິນ (Transaction Data Edited)";
    if (upper.includes("COUPON")) return "ແກ້ໄຂຄູປອງສ່ວນຫຼຸດ (Coupon Data Edited)";
    return "ແກ້ໄຂຂໍ້ມູນຜ່ານລະບົບ Data Editor";
  }

  // Stock
  if (upper.includes("STOCK") || upper.includes("ADJUST")) return "ປັບປຸງສະຕັອກສິນຄ້າ (Stock Adjustment)";

  // Orders
  if (upper.includes("ORDER_PAID") || upper.includes("BILL_PAID") || (upper.includes("ORDER") && upper.includes("PAID"))) return "ລູກຄ້າຊຳລະເງິນສຳເລັດ (Order Paid)";
  if (upper.includes("ORDER_CREATED") || upper.includes("CREATE_ORDER")) return "ສ້າງໃບບິນ/ອໍເດີໃໝ່ (New Order)";
  if (upper.includes("ORDER_CANCEL") || upper.includes("CANCEL_ORDER")) return "ຍົກເລີກໃບບິນ/ອໍເດີ (Order Cancelled)";
  if (upper.includes("ORDER_SPLIT") || upper.includes("SPLIT_ORDER") || upper.includes("SPLIT_BILL")) return "ແຍກບິນ / ແບ່ງໂຕະ (Split Bill)";
  if (upper.includes("ORDER_MERGE") || upper.includes("MERGE_ORDER") || upper.includes("MERGE_BILL")) return "ລວມບິນ / ລວມໂຕະ (Merged Bill)";
  if (upper.includes("ORDER_UPDATE") || upper.includes("UPDATE_ORDER") || upper.includes("UPDATE_STATUS")) return "ອັບເດດຂໍ້ມູນໃບບິນ/ອໍເດີ (Order Updated)";

  // Products
  if (upper.includes("PRODUCT_CREATE")) return "ເພີ່ມສິນຄ້າໃໝ່ (Product Created)";
  if (upper.includes("PRODUCT_UPDATE")) return "ແກ້ໄຂຂໍ້ມູນສິນຄ້າ (Product Updated)";
  if (upper.includes("PRODUCT_DELETE")) return "ລຶບສິນຄ້າອອກຈາກລະບົບ (Product Deleted)";

  // Tables
  if (upper.includes("TABLE_MOVE")) return "ຍ້າຍໂຕະ / ໂອນລາຍການ (Table Moved)";
  if (upper.includes("TABLE_STATUS") || upper.includes("CHANGE_TABLE")) return "ປ່ຽນສະຖານະໂຕະ (Table Status Changed)";

  // Settings
  if (upper.includes("SETTINGS")) return "ປ່ຽນແປງການຕັ້ງຄ່າຮ້ານ (Settings Updated)";

  // Fallback
  return action.replace(/_/g, " ");
}

export function formatStatusLao(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "PAID") return "ຊຳລະເງິນແລ້ວ (PAID)";
  if (s === "PENDING") return "ລໍຖ້າຊຳລະ (Pending)";
  if (s === "CANCELLED" || s === "CANCELED") return "ຍົກເລີກແລ້ວ (Cancelled)";
  if (s === "DELIVERED") return "ຈັດສົ່ງສຳເລັດ (Delivered)";
  if (s === "PROCESSING") return "ກຳລັງດຳເນີນການ (Processing)";
  if (s === "COMPLETED") return "ສຳເລັດສົມບູນ (Completed)";
  return status;
}

export function formatPaymentMethodLao(method: string) {
  const m = (method || "").toUpperCase();
  if (m.includes("CASH_ON_DELIVERY") || m === "COD") return "ເກັບເງິນປາຍທາງ (COD)";
  if (m === "CASH") return "ເງິນສົດ (Cash)";
  if (m.includes("BCEL") || m.includes("ONEPAY") || m.includes("QR")) return "OnePay / BCEL QR";
  if (m.includes("TRANSFER") || m.includes("BANK")) return "ໂອນເງິນຜ່ານທະນາຄານ";
  if (m.includes("CARD") || m.includes("CREDIT")) return "ບັດເຄຣດິດ / ເດບິດ";
  return method;
}

export function formatRoleLao(role: string) {
  const r = (role || "").toUpperCase();
  if (r === "ADMIN") return "Admin ລະບົບ";
  if (r === "OWNER") return "ເຈົ້າຂອງຮ້ານ (Owner)";
  if (r === "MANAGER") return "ຜູ້ຈັດການ (Manager)";
  if (r === "STAFF") return "ພະນັກງານ (Staff)";
  if (r === "CASHIER") return "ແຄຊເຊຍ (Cashier)";
  if (r === "ACCOUNTANT") return "ບັນຊີ (Accountant)";
  if (r === "KITCHEN") return "ຫ້ອງຄົວ (Kitchen)";
  if (r === "SELLER") return "ຮ້ານຄ້າ / ຜູ້ຂາຍ";
  return role;
}

export function parseLogDetails(log: AuditLogItem) {
  const meta = log.metadata || {};
  let detailsStr = log.details || "";

  // 1. Try to extract embedded JSON if details contains a JSON object
  let embeddedJson: any = null;
  const jsonMatch = detailsStr.match(/(\{.*\})/);
  if (jsonMatch) {
    try {
      embeddedJson = JSON.parse(jsonMatch[1]);
    } catch {
      // not valid json, ignore
    }
  }

  // Combine meta with any changes or embedded json
  const combined: Record<string, any> = {
    ...meta,
    ...(meta.changes || {}),
    ...(embeddedJson || {}),
  };

  // Extract entity ID from details if not in entityId/refCode: e.g. "Updated Orders 6ae6ea74f1bdc3d264a8f9fd"
  let extractedEntityId = log.entityId || combined.entityId || combined.id;
  if (!extractedEntityId) {
    const idMatch = detailsStr.match(/([a-f0-9]{24})/i);
    if (idMatch) extractedEntityId = idMatch[1];
  }

  // 2. Check if this is Stock
  const isStock =
    log.action === "STOCK_ADJUSTED" ||
    log.entityType === "STOCK" ||
    meta.entityType === "STOCK" ||
    log.action?.includes("STOCK") ||
    meta.delta !== undefined ||
    combined.delta !== undefined;

  if (isStock) {
    let productName = combined.productName || combined.refCode || log.refCode || "";
    if (!productName && detailsStr) {
      const match = detailsStr.match(/"([^"]+)"/);
      if (match) productName = match[1];
    }

    let delta = combined.delta;
    if (delta === undefined && detailsStr) {
      const deltaMatch = detailsStr.match(/:\s*([+-]?\d+)\s*\(/);
      if (deltaMatch) delta = parseInt(deltaMatch[1]);
    }

    let newStock = combined.newStock;
    if (newStock === undefined && detailsStr) {
      const newStockMatch = detailsStr.match(/ສະຕັອກໃໝ່:\s*(\d+)/);
      if (newStockMatch) newStock = parseInt(newStockMatch[1]);
    }

    let previousStock = combined.previousStock;
    if (previousStock === undefined && newStock !== undefined && delta !== undefined) {
      previousStock = newStock - delta;
    }

    let reason = combined.reason || "";
    if (!reason && detailsStr) {
      const reasonMatch = detailsStr.match(/\[ເຫດຜົນ:\s*([^\]]+)\]/);
      if (reasonMatch) reason = reasonMatch[1];
    }

    return {
      isStock: true,
      productName: productName || "ສິນຄ້າໃນຄັງ",
      delta,
      newStock,
      previousStock,
      reason,
      productId: extractedEntityId,
      rawFields: combined,
    };
  }

  // 3. Check if this is Order
  const isOrder =
    log.action?.includes("ORDER") ||
    log.entityType === "ORDER" ||
    meta.orderNumber ||
    combined.totalAmount !== undefined ||
    detailsStr.toLowerCase().includes("order");

  if (isOrder) {
    let orderNo =
      combined.orderNumber ||
      combined.orderNo ||
      combined.refCode ||
      log.refCode;

    if (!orderNo && extractedEntityId) {
      orderNo = `ORD-${extractedEntityId.slice(-6).toUpperCase()}`;
    }

    const customerName = combined.customerName || combined.customer || combined.name;
    const customerPhone = combined.customerPhone || combined.phone;
    const amount = combined.amount || combined.totalAmount || combined.total || combined.grandTotal;
    const status = combined.status || combined.orderStatus;
    const paymentMethod = combined.paymentMethod || combined.method;
    const reason = combined.reason || "";

    // Generate human-friendly description instead of showing raw JSON
    let cleanText = "";
    if (log.action?.includes("DATA_EDITOR")) {
      cleanText = `ແກ້ໄຂຂໍ້ມູນໃບບິນຜ່ານລະບົບ Data Editor`;
    } else {
      cleanText = detailsStr;
      if (jsonMatch) {
        cleanText = cleanText.replace(jsonMatch[0], "").trim();
      }
      cleanText = cleanText.replace(/\[ເຫດຜົນ:[^\]]+\]/g, "").trim();
      cleanText = cleanText.replace(/:\s*$/, "").trim();
    }

    return {
      isOrder: true,
      orderNo: orderNo || (extractedEntityId ? `#${extractedEntityId.slice(-6).toUpperCase()}` : "ໃບບິນ/ອໍເດີ"),
      orderId: extractedEntityId,
      customerName,
      customerPhone,
      amount,
      status,
      paymentMethod,
      reason,
      cleanText: cleanText || "ອັບເດດຂໍ້ມູນໃບບິນ/ອໍເດີສຳເລັດ",
      rawFields: combined,
    };
  }

  // 4. General
  let cleanText = detailsStr;
  if (jsonMatch) {
    cleanText = cleanText.replace(jsonMatch[0], "").trim();
  }
  let reason = combined.reason || "";
  if (!reason) {
    const reasonMatch = cleanText.match(/\[ເຫດຜົນ:\s*([^\]]+)\]/);
    if (reasonMatch) reason = reasonMatch[1];
  }
  cleanText = cleanText.replace(/\[ເຫດຜົນ:[^\]]+\]/g, "").trim();
  cleanText = cleanText.replace(/:\s*$/, "").trim();

  return {
    isGeneral: true,
    cleanText: cleanText || "ດຳເນີນການແກ້ໄຂຂໍ້ມູນ",
    reason,
    rawFields: combined,
  };
}

export default function AuditLogsDashboardPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalCount: 0,
    billsCount: 0,
    productsCount: 0,
    todayCount: 0,
  });

  // Modal to inspect full change payload
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) params.set("search", search.trim());
      if (entityType !== "ALL") params.set("entityType", entityType);
      if (dateRange !== "ALL") params.set("dateRange", dateRange);

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
        if (json.stats) {
          setStats(json.stats);
        }
      } else {
        toast.error("ບໍ່ສາມາດໂຫຼດປະຫວັດການແກ້ໄຂໄດ້");
      }
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດປະຫວັດ");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, entityType, dateRange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  // Safe Date & Time formatter that never throws Invalid option errors
  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      const pad = (n: number) => String(n).padStart(2, "0");
      const day = pad(d.getDate());
      const month = pad(d.getMonth() + 1);
      const year = d.getFullYear();
      const hours = pad(d.getHours());
      const mins = pad(d.getMinutes());
      const secs = pad(d.getSeconds());
      return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
    } catch {
      return dateStr;
    }
  };

  // Format Lao relative date
  const formatTimeAgoLao = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

      if (diffSec < 60) return "ຫາກໍ່ດຽວນີ້";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} ນາທີກ່ອນ`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr} ຊົ່ວໂມງກ່ອນ`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 7) return `${diffDay} ມື້ກ່ອນ`;
      
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return dateStr;
    }
  };

  // Get action styling and badges
  const getActionBadge = (action: string) => {
    const upper = action.toUpperCase();

    if (upper.includes("PAID") || upper.includes("COMPLETE") || upper.includes("APPROVE")) {
      return {
        label: "ຊຳລະເງິນ / ສຳເລັດ",
        bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        icon: CheckCircle2,
      };
    }
    if (upper.includes("SPLIT")) {
      return {
        label: "ແຍກບິນ",
        bg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        icon: SplitSquareHorizontal,
      };
    }
    if (upper.includes("MERGE")) {
      return {
        label: "ລວມບິນ",
        bg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
        icon: Merge,
      };
    }
    if (upper.includes("CANCEL") || upper.includes("DELETE") || upper.includes("REJECT")) {
      return {
        label: "ຍົກເລີກ / ລຶບ",
        bg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
        icon: Trash2,
      };
    }
    if (upper.includes("MOVE") || upper.includes("TRANSFER")) {
      return {
        label: "ຍ້າຍໂຕະ / ໂອນ",
        bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        icon: ArrowRightLeft,
      };
    }
    if (upper.includes("CREATE") || upper.includes("ADD") || upper.includes("OPEN")) {
      return {
        label: "ສ້າງໃໝ່ / ເພີ່ມ",
        bg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        icon: PlusCircle,
      };
    }
    if (upper.includes("ADJUST") || upper.includes("STOCK")) {
      return {
        label: "ປັບສະຕັອກ",
        bg: "bg-teal-500/15 text-teal-400 border-teal-500/30",
        icon: Tag,
      };
    }
    if (upper.includes("DATA_EDITOR")) {
      return {
        label: "ແກ້ໄຂຜ່ານ Data Editor",
        bg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        icon: SlidersHorizontal,
      };
    }
    return {
      label: "ແກ້ໄຂຂໍ້ມູນ",
      bg: "bg-zinc-500/15 text-zinc-300 border-zinc-700",
      icon: Activity,
    };
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (logs.length === 0) {
      toast.error("ບໍ່ມີຂໍ້ມູນສຳລັບ Export");
      return;
    }

    const exportRows = logs.map((log) => ({
      "ວັນທີ & ເວລາ": formatDateTime(log.createdAt),
      "ການດຳເນີນງານ (Action)": log.action,
      "ໝວດໝູ່ (Category)": log.entityType,
      "ເລກອ້າງອີງ (Ref)": log.refCode || log.entityId || "-",
      "ລາຍລະອຽດ (Details)": log.details,
      "ຜູ້ແກ້ໄຂ (Operator)": log.user?.name || log.user?.email || "System",
      "ບົດບາດ (Role)": log.user?.role || "-",
      "IP Address": log.ipAddress || "-",
    }));

    exportToExcel(exportRows, `audit_trail_export_${Date.now()}`);
    toast.success("Export ປະຫວັດລະບົບສຳເລັດແລ້ວ!");
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-16 font-sans">
      {/* ─── 1. TOP HEADER & KPI METRICS ─── */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Audit Trail & History System
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                Live Recording • ບັນທຶກທຸກກິດຈະກຳ
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ປະຫວັດການແກ້ໄຂ & ບັນທຶກກິດຈະກຳ (Audit Logs)
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
              ຕິດຕາມ ແລະ ກວດສອບທຸກການສ້າງ, ແກ້ໄຂ, ຍົກເລີກບິນ, ແຍກ/ລວມບິນ, ປັບສະຕັອກສິນຄ້າ ແລະ ການຕັ້ງຄ່າທັງໝົດໃນລະບົບ
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportExcel}
              disabled={loading || logs.length === 0}
              className="px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-700 flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>ໂຫຼດຂໍ້ມູນໃໝ່</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">ທັງໝົດທຸກກິດຈະກຳ</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {stats.totalCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">ລາຍການບັນທຶກໃນຖານຂໍ້ມູນ</div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">ບິນ & ອໍເດີ (Bills)</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-400 font-mono">
              {stats.billsCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">ສ້າງ, ຈ່າຍ, ແຍກ, ຍົກເລີກບິນ</div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">ສິນຄ້າ & ສະຕັອກ</span>
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-teal-400 font-mono">
              {stats.productsCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">ແກ້ໄຂລາຄາ & ປັບສະຕັອກ</div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">ການດຳເນີນງານມື້ນີ້</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {stats.todayCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">ກິດຈະກຳຕັ້ງແຕ່ເຊົ້າຮອດປັດຈຸບັນ</div>
          </div>
        </div>
      </div>

      {/* ─── 2. FILTERS & SEARCH TABS ─── */}
      <div className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800 space-y-3.5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
            {[
              { id: "ALL", label: "ທັງໝົດ", icon: Activity },
              { id: "ORDER", label: "ບິນ & ອໍເດີ", icon: Receipt },
              { id: "PRODUCT", label: "ສິນຄ້າ & ສະຕັອກ", icon: Package },
              { id: "TABLE", label: "ໂຕະອາຫານ", icon: Layers },
              { id: "SETTING", label: "ຕັ້ງຄ່າຮ້ານ", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setEntityType(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  entityType === tab.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-bold shrink-0">
            {[
              { id: "ALL", label: "ທຸກເວລາ" },
              { id: "today", label: "ມື້ນີ້" },
              { id: "7days", label: "7 ມື້" },
              { id: "30days", label: "30 ມື້" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setDateRange(d.id);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  dateRange === d.id
                    ? "bg-zinc-800 text-white font-black"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ຄົ້ນຫາເລກບິນ (#ORD-...), ຊື່ສິນຄ້າ, ຊື່ພະນັກງານ, ຫຼື ຂໍ້ຄວາມການແກ້ໄຂ..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* ─── 3. AUDIT LOGS TABLE & LIST ─── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">ວັນທີ & ເວລາ</th>
                <th className="py-3.5 px-4">ຜູ້ດຳເນີນການ (Operator)</th>
                <th className="py-3.5 px-4">ປະເພດການດຳເນີນງານ</th>
                <th className="py-3.5 px-4">ເລກອ້າງອີງ / ເປົ້າໝາຍ</th>
                <th className="py-3.5 px-4">ລາຍລະອຽດການແກ້ໄຂ</th>
                <th className="py-3.5 px-4 text-right">ກວດສອບ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                    <span>ກຳລັງໂຫຼດປະຫວັດການແກ້ໄຂ...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500">
                    <History className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-60" />
                    <p className="font-bold text-zinc-400 text-sm">ບໍ່ພົບປະຫວັດການແກ້ໄຂໃນເງື່ອນໄຂນີ້</p>
                    <p className="text-xs text-zinc-600 mt-0.5">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ເລືອກໝວດໝູ່ໃໝ່</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const Icon = badge.icon;
                  const meta = log.metadata || {};
                  const parsed = parseLogDetails(log);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-zinc-850/60 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedLog(log);
                        setShowRawJson(false);
                      }}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-zinc-200">
                          {formatTimeAgoLao(log.createdAt)}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {formatDateTime(log.createdAt)}
                        </div>
                      </td>

                      {/* Operator */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {log.user?.image ? (
                            <img
                              src={log.user.image}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover border border-zinc-700 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center font-bold text-[10px] text-blue-400 shrink-0">
                              {log.user?.name
                                ? log.user.name.slice(0, 2).toUpperCase()
                                : (log.metadata as any)?.operatorName
                                ? (log.metadata as any).operatorName.slice(0, 2).toUpperCase()
                                : "ST"}
                            </div>
                          )}
                          <div className="min-w-0 max-w-[150px]">
                            <div className="font-bold text-white truncate text-xs">
                              {log.user?.name || (log.metadata as any)?.operatorName || "ພະນັກງານ (Staff)"}
                            </div>
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 truncate max-w-[140px]">
                              {formatRoleLao(log.user?.role || (log.metadata as any)?.operatorRole || "STAFF")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-black border inline-flex items-center gap-1.5 ${badge.bg}`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{badge.label}</span>
                        </span>
                        <div className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[150px]">
                          {getFriendlyActionTitle(log.action, log.entityType)}
                        </div>
                      </td>

                      {/* Ref Code / Target */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {parsed.orderNo || log.refCode || log.entityId ? (
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono font-bold text-[11px] inline-flex items-center gap-1">
                            {(log.entityType === "ORDER" || parsed.isOrder) && <Receipt className="w-3 h-3 text-purple-400" />}
                            {(log.entityType === "PRODUCT" || parsed.isStock) && <Package className="w-3 h-3 text-teal-400" />}
                            {log.entityType === "TABLE" && <Layers className="w-3 h-3 text-amber-400" />}
                            <span>{parsed.orderNo || log.refCode || `#${log.entityId?.slice(-6).toUpperCase()}`}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-mono text-[11px]">-</span>
                        )}
                        {(meta.amount || parsed.amount) && (
                          <div className="text-[10px] font-mono font-black text-emerald-400 mt-0.5">
                            ₭{Number(meta.amount || parsed.amount).toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Details Description (Clean & Human-friendly without duplicate reasons) */}
                      <td className="py-3.5 px-4 max-w-[420px]">
                        {parsed.isStock ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-xs">
                                {parsed.productName}
                              </span>
                              {parsed.delta !== undefined && (
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[11px] font-mono font-black border inline-flex items-center gap-0.5 ${
                                    parsed.delta > 0
                                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                      : parsed.delta < 0
                                      ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                      : "bg-zinc-800 text-zinc-300 border-zinc-700"
                                  }`}
                                >
                                  {parsed.delta > 0 ? (
                                    <ArrowUpRight className="w-3 h-3" />
                                  ) : parsed.delta < 0 ? (
                                    <ArrowDownRight className="w-3 h-3" />
                                  ) : null}
                                  {parsed.delta > 0 ? `+${parsed.delta}` : parsed.delta}
                                </span>
                              )}
                              {parsed.newStock !== undefined && (
                                <span className="text-[11px] text-zinc-400">
                                  ສະຕັອກໃໝ່:{" "}
                                  <strong className="text-zinc-200 font-mono font-bold">
                                    {parsed.newStock.toLocaleString()}
                                  </strong>
                                </span>
                              )}
                            </div>
                            {parsed.reason && (
                              <div className="flex items-center gap-1.5 text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg w-fit">
                                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate max-w-[340px]">
                                  {parsed.reason}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : parsed.isOrder ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-xs">
                                {parsed.cleanText || "ແກ້ໄຂຂໍ້ມູນໃບບິນ / ອໍເດີ"}
                              </span>
                              {parsed.customerName && (
                                <span className="text-[11px] text-zinc-300">
                                  ລູກຄ້າ: <strong className="text-white">{parsed.customerName}</strong>
                                </span>
                              )}
                              {parsed.status && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  {formatStatusLao(parsed.status)}
                                </span>
                              )}
                            </div>
                            {parsed.reason && (
                              <div className="flex items-center gap-1.5 text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg w-fit">
                                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate max-w-[340px]">
                                  {parsed.reason}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed">
                              {parsed.cleanText || log.details}
                            </p>
                            {parsed.reason && (
                              <div className="flex items-center gap-1.5 text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg w-fit">
                                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate max-w-[340px]">
                                  {parsed.reason}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                            setShowRawJson(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-bold border border-blue-500/20 hover:border-blue-500 transition-all inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ເບິ່ງ</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div>
            ສະແດງ{" "}
            <strong className="text-white font-mono">
              {logs.length > 0 ? (page - 1) * limit + 1 : 0}
            </strong>{" "}
            ຫາ{" "}
            <strong className="text-white font-mono">
              {Math.min(page * limit, total)}
            </strong>{" "}
            ຈາກທັງໝົດ{" "}
            <strong className="text-white font-mono">{total.toLocaleString()}</strong> ລາຍການ
          </div>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none"
            >
              <option value={10}>10 ແຖວ / ໜ້າ</option>
              <option value={25}>25 ແຖວ / ໜ້າ</option>
              <option value={50}>50 ແຖວ / ໜ້າ</option>
              <option value={100}>100 ແຖວ / ໜ້າ</option>
            </select>

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-40 disabled:hover:bg-zinc-900"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2 font-bold text-white">
              {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-40 disabled:hover:bg-zinc-900"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4. INSPECT LOG DETAILS MODAL (Client/Shop Owner Friendly + Admin Raw Mode) ─── */}
      {selectedLog && (() => {
        const parsed = parseLogDetails(selectedLog);
        const badge = getActionBadge(selectedLog.action);
        const Icon = badge.icon;
        const friendlyTitle = getFriendlyActionTitle(selectedLog.action, selectedLog.entityType);

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${badge.bg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-white">
                        {friendlyTitle}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {selectedLog.entityType}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {selectedLog.organization?.name ? `${selectedLog.organization.name} • ` : ""}
                      {formatTimeAgoLao(selectedLog.createdAt)} ({formatDateTime(selectedLog.createdAt)})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden space-y-4 custom-scrollbar text-xs w-full min-w-0">
                {/* 1. Operator Info Card */}
                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {selectedLog.user?.image ? (
                      <img
                        src={selectedLog.user.image}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
                        {selectedLog.user?.name
                          ? selectedLog.user.name.slice(0, 2).toUpperCase()
                          : (selectedLog.metadata as any)?.operatorName
                          ? (selectedLog.metadata as any).operatorName.slice(0, 2).toUpperCase()
                          : "ST"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        ຜູ້ດຳເນີນການແກ້ໄຂ (Operator / ພະນັກງານ)
                      </div>
                      <div className="font-bold text-white text-sm truncate">
                        {selectedLog.user?.name || (selectedLog.metadata as any)?.operatorName || "ພະນັກງານ (Staff)"}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {selectedLog.user?.email || (selectedLog.metadata as any)?.operatorEmail || "ບັນຊີພະນັກງານໃນລະບົບ"}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-mono font-bold uppercase">
                      {formatRoleLao(selectedLog.user?.role || (selectedLog.metadata as any)?.operatorRole || "STAFF")}
                    </span>
                  </div>
                </div>

                {/* 2. Primary Activity Details (Clean & Visual for Shop Owner) */}
                {parsed.isStock ? (
                  <div className="space-y-3.5">
                    {/* Product Name Header */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/40 via-zinc-950 to-zinc-950 border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                            ສິນຄ້າໃນຄັງ
                          </div>
                          <div className="text-sm sm:text-base font-black text-white truncate">
                            {parsed.productName}
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/dashboard/inventory?search=${encodeURIComponent(parsed.productName)}`}
                        className="px-3.5 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500 text-teal-300 hover:text-white text-xs font-bold border border-teal-500/30 transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>ເບິ່ງໃນຄັງສິນຄ້າ</span>
                      </Link>
                    </div>

                    {/* 3 Metric Cards: Prev -> Delta -> New */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                          ສະຕັອກເດີມ
                        </span>
                        <div className="text-xl sm:text-2xl font-black font-mono text-zinc-300">
                          {parsed.previousStock !== undefined ? parsed.previousStock.toLocaleString() : "-"}
                        </div>
                        <span className="text-[10px] text-zinc-500">ກ່ອນການປັບ</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                          ຈຳນວນທີ່ປັບ (Delta)
                        </span>
                        <div
                          className={`text-xl sm:text-2xl font-black font-mono flex items-center justify-center gap-1 ${
                            parsed.delta !== undefined && parsed.delta > 0
                              ? "text-emerald-400"
                              : parsed.delta !== undefined && parsed.delta < 0
                              ? "text-rose-400"
                              : "text-zinc-400"
                          }`}
                        >
                          {parsed.delta !== undefined && parsed.delta > 0 && <ArrowUpRight className="w-5 h-5" />}
                          {parsed.delta !== undefined && parsed.delta < 0 && <ArrowDownRight className="w-5 h-5" />}
                          {parsed.delta !== undefined
                            ? parsed.delta > 0
                              ? `+${parsed.delta.toLocaleString()}`
                              : parsed.delta.toLocaleString()
                            : "-"}
                        </div>
                        <span className="text-[10px] text-zinc-500">ຜົນຕ່າງ</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-zinc-950 border border-teal-500/30 text-center bg-teal-500/5">
                        <span className="text-[10px] font-bold text-teal-400 uppercase block mb-1">
                          ສະຕັອກໃໝ່ລ່າສຸດ
                        </span>
                        <div className="text-xl sm:text-2xl font-black font-mono text-teal-300">
                          {parsed.newStock !== undefined ? parsed.newStock.toLocaleString() : "-"}
                        </div>
                        <span className="text-[10px] text-teal-500/80">ຍອດປັດຈຸບັນ</span>
                      </div>
                    </div>

                    {/* Reason Callout Box */}
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>ເຫດຜົນໃນການປັບປ່ຽນສະຕັອກ (Reason Provided)</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-amber-100 pl-6 leading-relaxed break-words">
                        {parsed.reason || "ບໍ່ມີການລະບຸເຫດຜົນເພີ່ມເຕີມ"}
                      </p>
                    </div>
                  </div>
                ) : parsed.isOrder ? (
                  <div className="space-y-3.5">
                    {/* Order Ref & Action Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-950 to-zinc-950 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                            ໃບບິນ / ອໍເດີ
                          </div>
                          <div className="text-base font-black text-white font-mono truncate">
                            {parsed.orderNo}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {parsed.amount && (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-black text-sm">
                            ₭{Number(parsed.amount).toLocaleString()}
                          </span>
                        )}
                        <Link
                          href="/dashboard/orders"
                          className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500 text-purple-300 hover:text-white text-xs font-bold border border-purple-500/30 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>ເບິ່ງລາຍການບິນ</span>
                        </Link>
                      </div>
                    </div>

                    {/* Order Information Breakdown (Shop Owner Friendly) */}
                    {(parsed.customerName || parsed.amount || parsed.status || parsed.paymentMethod) && (
                      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                          ຂໍ້ມູນອໍເດີ (Order Information)
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {parsed.customerName && (
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 min-w-0">
                              <span className="text-zinc-500 block text-[10px] uppercase font-bold">ຊື່ລູກຄ້າ</span>
                              <span className="text-white font-bold text-xs truncate block">{parsed.customerName}</span>
                            </div>
                          )}
                          {parsed.customerPhone && (
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 min-w-0">
                              <span className="text-zinc-500 block text-[10px] uppercase font-bold">ເບີໂທລະສັບ</span>
                              <span className="text-zinc-300 font-bold font-mono text-xs truncate block">{parsed.customerPhone}</span>
                            </div>
                          )}
                          {parsed.amount && (
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 min-w-0">
                              <span className="text-zinc-500 block text-[10px] uppercase font-bold">ຍອດລວມທັງໝົດ</span>
                              <span className="text-emerald-400 font-black font-mono text-xs">₭{Number(parsed.amount).toLocaleString()}</span>
                            </div>
                          )}
                          {parsed.status && (
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 min-w-0">
                              <span className="text-zinc-500 block text-[10px] uppercase font-bold">ສະຖານະບິນ</span>
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                {formatStatusLao(parsed.status)}
                              </span>
                            </div>
                          )}
                          {parsed.paymentMethod && (
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 min-w-0">
                              <span className="text-zinc-500 block text-[10px] uppercase font-bold">ຮູບແບບການຊຳລະ</span>
                              <span className="text-zinc-300 font-bold text-xs truncate block">
                                {formatPaymentMethodLao(parsed.paymentMethod)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Description */}
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        ລາຍລະອຽດການດຳເນີນງານ
                      </span>
                      <p className="text-sm font-medium text-zinc-200 leading-relaxed break-words">
                        {parsed.cleanText}
                      </p>
                    </div>

                    {/* Reason Callout if available */}
                    {parsed.reason && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>ເຫດຜົນການດຳເນີນງານ</span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-amber-100 pl-6 leading-relaxed break-words">
                          {parsed.reason}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* General Action Card */}
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        ຂໍ້ຄວາມບັນທຶກລາຍລະອຽດ
                      </span>
                      <p className="text-sm font-medium text-zinc-200 leading-relaxed break-words">
                        {parsed.cleanText || selectedLog.details}
                      </p>
                    </div>

                    {parsed.reason && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>ເຫດຜົນ</span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-amber-100 pl-6 leading-relaxed break-words">
                          {parsed.reason}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Admin & Technical Details Toggle (ສະເພາະ Super Admin ເທົ່ານັ້ນ) */}
                {isAdmin && (
                  <div className="pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setShowRawJson(!showRawJson)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-850/80 border border-zinc-800 transition-all text-xs"
                    >
                      <span className="flex items-center gap-2 font-bold text-zinc-300">
                        <Code2 className="w-4 h-4 text-purple-400" />
                        <span>ຂໍ້ມູນລະບົບ & Raw JSON (Admin Mode)</span>
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {showRawJson ? "▲ ເຊື່ອງ" : "▼ ສະແດງຂໍ້ມູນລະບົບ"}
                      </span>
                    </button>

                    {showRawJson && (
                      <div className="mt-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 animate-in fade-in">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] font-mono">
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-zinc-500 block text-[10px] uppercase font-bold">Log Record ID</span>
                            <span className="text-zinc-300 font-bold select-all break-all">{selectedLog.id}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-zinc-500 block text-[10px] uppercase font-bold">Action Code</span>
                            <span className="text-purple-400 font-bold select-all">{selectedLog.action}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-zinc-500 block text-[10px] uppercase font-bold">Entity Type</span>
                            <span className="text-teal-400 font-bold select-all">{selectedLog.entityType}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-zinc-500 block text-[10px] uppercase font-bold">Entity ID</span>
                            <span className="text-zinc-300 font-bold select-all break-all">{selectedLog.entityId || "N/A"}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-zinc-500 block text-[10px] uppercase font-bold">IP Address</span>
                            <span className="text-zinc-300 font-bold select-all">{selectedLog.ipAddress || "Internal"}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                            <span className="text-zinc-500 block text-[10px] uppercase font-bold">Tenant / Shop</span>
                            <span className="text-zinc-300 font-bold">{selectedLog.organization?.name || "Global / Default"}</span>
                          </div>
                        </div>

                        {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                          <div className="space-y-1 w-full min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                              Full Metadata JSON Payload:
                            </span>
                            <pre className="p-3.5 rounded-xl bg-black border border-zinc-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-w-full custom-scrollbar leading-relaxed">
                              {JSON.stringify(selectedLog.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
                <div className="text-[11px] text-zinc-500 font-mono">
                  ບັນທຶກອັດຕະໂນມັດ • ບໍ່ສາມາດລົບຫຼືແກ້ໄຂໄດ້ (Immutable Audit Trail)
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  ປິດໜ້າຕ່າງ
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
