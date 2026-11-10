"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Receipt,
  Search,
  Pencil,
  Check,
  X,
  Loader2,
  Trash2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Plus,
  BarChart3,
  Filter,
  ArrowUpRight,
  ShoppingBag,
  Phone,
  User,
  Clock,
  CreditCard,
  Calendar,
  Printer,
  Sparkles,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/excel";
import { PaginationControls } from "@/components/PaginationControls";

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  PAID: {
    label: "PAID (ຊຳລະແລ້ວ)",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  COMPLETED: {
    label: "COMPLETED (ສຳເລັດ)",
    bg: "bg-teal-500/15",
    text: "text-teal-300",
    border: "border-teal-500/30",
    dot: "bg-teal-400",
  },
  PROCESSING: {
    label: "PROCESSING (ກຳລັງກຽມ)",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/30",
    dot: "bg-blue-400",
  },
  SHIPPED: {
    label: "SHIPPED (ຈັດສົ່ງແລ້ວ)",
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    border: "border-purple-500/30",
    dot: "bg-purple-400",
  },
  PENDING: {
    label: "PENDING (ລໍຖ້າຊຳລະ)",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  CANCELLED: {
    label: "CANCELLED (ຍົກເລີກ)",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
  },
  REFUNDED: {
    label: "REFUNDED (ຄືນເງິນ)",
    bg: "bg-zinc-500/15",
    text: "text-zinc-400",
    border: "border-zinc-500/30",
    dot: "bg-zinc-400",
  },
};

const paymentConfig: Record<string, { label: string; bg: string; text: string }> = {
  CASH: { label: "ເງິນສົດ (CASH)", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  TRANSFER: { label: "ໂອນເງິນ (TRANSFER)", bg: "bg-blue-500/10", text: "text-blue-400" },
  CASH_ON_DELIVERY: { label: "ປາຍທາງ (COD)", bg: "bg-purple-500/10", text: "text-purple-400" },
};

const fmt = (n: number) => "₭" + new Intl.NumberFormat("en").format(n || 0);

interface OrderItemProduct {
  id: string;
  name: string;
}

interface OrderItemRow {
  id: string;
  quantity?: number;
  price?: number;
  product?: OrderItemProduct;
}

interface OrderItem {
  id: string;
  totalAmount: number;
  status: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  paymentMethod: string;
  items?: OrderItemRow[];
  createdAt: string;
  updatedAt: string;
}

export default function EditOrdersPage() {
  const [data, setData] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    customerName: string;
    customerPhone: string;
    totalAmount: number | string;
    status: string;
    paymentMethod: string;
  }>({
    customerName: "",
    customerPhone: "",
    totalAmount: 0,
    status: "PENDING",
    paymentMethod: "CASH",
  });
  const [saving, setSaving] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState<OrderItem | null>(null);

  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search: search.trim(),
          status: statusFilter,
          paymentMethod: paymentFilter,
        });

        const res = await fetch(`/api/data-editor/orders?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
          setTotal(json.total || 0);
          if (isManualRefresh) {
            toast.success("ອັບເດດຂໍ້ມູນໃບບິນລ່າສຸດແລ້ວ");
          }
        } else {
          toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນອໍເດີໄດ້");
        }
      } catch {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, search, statusFilter, paymentFilter]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalOrders = total;
    const currentTotalAmount = data.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
    const paidOrCompleted = data.filter((item) => item.status === "PAID" || item.status === "COMPLETED").length;
    const pendingOrProcessing = data.filter((item) => item.status === "PENDING" || item.status === "PROCESSING").length;
    const cancelled = data.filter((item) => item.status === "CANCELLED" || item.status === "REFUNDED").length;

    const sampleTotal = Math.max(data.length, 1);
    const paidPerc = Math.round((paidOrCompleted / sampleTotal) * 100);
    const pendingPerc = Math.round((pendingOrProcessing / sampleTotal) * 100);
    const cancelledPerc = Math.round((cancelled / sampleTotal) * 100);

    return {
      totalOrders,
      currentTotalAmount,
      paidOrCompleted,
      pendingOrProcessing,
      cancelled,
      paidPerc,
      pendingPerc,
      cancelledPerc,
    };
  }, [data, total]);

  const handleEdit = (item: OrderItem) => {
    setEditingId(item.id);
    setEditValues({
      customerName: item.customerName || "",
      customerPhone: item.customerPhone || "",
      totalAmount: item.totalAmount || 0,
      status: item.status || "PENDING",
      paymentMethod: item.paymentMethod || "CASH",
    });
  };

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/data-editor/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          updates: { status: newStatus },
        }),
      });

      if (res.ok) {
        toast.success(`ປ່ຽນສະຖານະເປັນ ${newStatus} ແລ້ວ`);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການປ່ຽນສະຖານະ");
    }
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/data-editor/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          updates: {
            customerName: editValues.customerName.trim() || null,
            customerPhone: editValues.customerPhone.trim() || null,
            totalAmount: Number(editValues.totalAmount) || 0,
            status: editValues.status,
            paymentMethod: editValues.paymentMethod,
          },
        }),
      });

      if (res.ok) {
        toast.success("ບັນທຶກການແກ້ໄຂອໍເດີສຳເລັດແລ້ວ");
        setEditingId(null);
        fetchData();
      } else {
        const e = await res.json();
        toast.error(e.error || "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/data-editor/orders?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("ລຶບອໍເດີອອກຈາກລະບົບຮຽບຮ້ອຍ");
        fetchData();
      } else {
        toast.error("ບໍ່ສາມາດລຶບອໍເດີໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບ");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const handleExportExcel = () => {
    exportToExcel({
      filename: `Orders_Report_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Orders",
      title: "ລາຍງານຂໍ້ມູນອໍເດີ ແລະ ໃບບິນ (ORDERS & BILLING REPORT)",
      subtitle: `ລວມທັງໝົດ ${data.length} ບິນ | ວັນທີສ້າງ: ${new Date().toLocaleDateString("lo-LA")}`,
      headers: ["ລຳດັບ", "ລະຫັດບິນ (ID)", "ຊື່ລູກຄ້າ", "ເບີໂທ", "ຍອດລວມ (₭)", "ສະຖານະ", "ວິທີຊຳລະ", "ວັນທີສ້າງ"],
      data: data.map((o, idx) => [
        idx + 1,
        o.id ? `#${o.id.slice(-6).toUpperCase()}` : "-",
        o.customerName || "ລູກຄ້າທົ່ວໄປ",
        o.customerPhone || "-",
        o.totalAmount ? Number(o.totalAmount).toLocaleString() : "0",
        o.status || "-",
        o.paymentMethod || "-",
        o.createdAt ? new Date(o.createdAt).toLocaleDateString("lo-LA") : "-",
      ]),
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        "",
        "",
        "",
        `₭${data.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0).toLocaleString()}`,
        `${data.length} ບິນ`,
        "",
        "",
      ],
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── TOP BANNER & ACTIONS ── */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles size={13} />
              <span>ລະບົບຈັດການຂໍ້ມູນອໍເດີ ແລະ ໃບບິນ (Data Editor)</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              ແກ້ໄຂອໍເດີ / ໃບບິນ
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-mono">
                {total.toLocaleString()} ລາຍການ
              </span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed">
              ຈັດການ, ຕິດຕາມ ແລະ ດັດແກ້ຂໍ້ມູນໃບບິນທັງໝົດໃນລະບົບ — ແກ້ໄຂຂໍ້ມູນລູກຄ້າ, ຍອດເງິນ, ສະຖານະບິນ ແລະ ວິທີການຊຳລະເງິນໄດ້ທັນທີ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-sm font-medium border border-zinc-700/70 hover:border-zinc-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="ໂຫຼດຂໍ້ມູນໃໝ່"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin text-blue-400" : "text-zinc-400"} />
              <span>ໂຫຼດຂໍ້ມູນໃໝ່</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-sm font-medium border border-emerald-500/30 transition-all shadow-sm active:scale-95"
            >
              <ArrowUpRight size={16} className="text-emerald-400" />
              <span>ດາວໂຫຼດ Excel ສວຍໆ</span>
            </button>

            <Link
              href="/dashboard/pos"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              <ShoppingBag size={16} />
              <span>ເປີດຂາຍໜ້າຮ້ານ (POS)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Orders */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ບິນທັງໝົດໃນລະບົບ</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Receipt size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">{stats.totalOrders.toLocaleString()}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ປະຫວັດການຂາຍທັງໝົດ</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Revenue in View */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຍອດຂາຍລວມ (ໜ້ານີ້)</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">{fmt(stats.currentTotalAmount)}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ມູນຄ່າທຸລະກຳລວມໃນຕາຕະລາງ</span>
            </div>
          </div>
        </div>

        {/* Card 3: Paid & Completed */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຊຳລະແລ້ວ / ສຳເລັດ</span>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.paidOrCompleted}{" "}
              <span className="text-sm font-semibold text-teal-400 font-mono">({stats.paidPerc}%)</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, stats.paidPerc)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Pending / In Progress */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ລໍຖ້າດຳເນີນການ</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {stats.pendingOrProcessing}{" "}
              <span className="text-sm font-semibold text-zinc-400 font-mono">({stats.pendingPerc}%)</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ລໍຖ້າຊຳລະ ຫຼື ກຳລັງກຽມຈັດສົ່ງ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── VISUAL ORDER STATUS CHART ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl backdrop-blur-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2.5">
              <BarChart3 size={18} className="text-blue-400" />
              <span>ກາບສະແດງສະຖານະອໍເດີ ແລະ ໃບບິນ (Visual Order Status Chart)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              ສັດສ່ວນອໍເດີຕາມສະຖານະ: ຊຳລະແລ້ວ, ສຳເລັດ, ລໍຖ້າດຳເນີນການ, ແລະ ອໍເດີຍົກເລີກ
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-3.5 py-1.5 rounded-full border border-blue-500/20 font-mono">
            {data.length} ບິນຫຼ້າສຸດ (ໜ້ານີ້)
          </span>
        </div>

        {/* Multi-segment visual progress bar */}
        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          <div
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
            style={{ width: `${Math.max(stats.paidPerc, 2)}%` }}
            title={`ຊຳລະແລ້ວ/ສຳເລັດ: ${stats.paidPerc}%`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${Math.max(stats.pendingPerc, 2)}%` }}
            title={`ລໍຖ້າດຳເນີນການ: ${stats.pendingPerc}%`}
          />
          <div
            className="h-full bg-rose-500 rounded-r-full transition-all duration-500"
            style={{ width: `${Math.max(stats.cancelledPerc, 2)}%` }}
            title={`ຍົກເລີກ/ຄືນເງິນ: ${stats.cancelledPerc}%`}
          />
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                ຊຳລະແລ້ວ / ສຳເລັດ (COMPLETED & PAID)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.paidOrCompleted} ບິນ ({stats.paidPerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.paidPerc)}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                ລໍຖ້າຊຳລະ / ກຳລັງກຽມ (PENDING & PROCESSING)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.pendingOrProcessing} ບິນ ({stats.pendingPerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.pendingPerc)}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                ຍົກເລີກ / ຄືນເງິນ (CANCELLED & REFUNDED)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.cancelled} ບິນ ({stats.cancelledPerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.cancelledPerc)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── FAST FILTER & SEARCH BAR ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm space-y-4">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-medium text-zinc-500 flex items-center gap-1 pr-1">
            <Filter size={13} /> ສະຖານະ:
          </span>
          {[
            { id: "ALL", label: "ທັງໝົດ" },
            { id: "PAID", label: "PAID (ຊຳລະແລ້ວ)" },
            { id: "COMPLETED", label: "COMPLETED (ສຳເລັດ)" },
            { id: "PROCESSING", label: "PROCESSING (ກຳລັງກຽມ)" },
            { id: "PENDING", label: "PENDING (ລໍຖ້າຊຳລະ)" },
            { id: "CANCELLED", label: "CANCELLED (ຍົກເລີກ)" },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  active
                    ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                    : "bg-zinc-800/70 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search, Payment Filter & Limit Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="ຄົ້ນຫາຊື່ລູກຄ້າ ຫຼື ເບີໂທລະສັບ..."
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Payment Method Filter */}
            <div className="relative">
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none pl-3.5 pr-8 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 hover:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="ALL">ທຸກວິທີຊຳລະ (All Payment)</option>
                <option value="CASH">ເງິນສົດ (CASH)</option>
                <option value="TRANSFER">ໂອນເງິນ (TRANSFER)</option>
                <option value="CASH_ON_DELIVERY">ປາຍທາງ (CASH_ON_DELIVERY)</option>
              </select>
              <CreditCard size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>

            {/* Page Limit Selector */}
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="appearance-none pl-3.5 pr-8 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 hover:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value={20}>20 ລາຍການ / ໜ້າ</option>
                <option value={50}>50 ລາຍການ / ໜ້າ</option>
                <option value={100}>100 ລາຍການ / ໜ້າ</option>
              </select>
              <SlidersHorizontal size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── ORDERS DATA TABLE ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                <th className="px-5 py-4 font-semibold">ໄອດີບິນ (ID)</th>
                <th className="px-5 py-4 font-semibold">ລູກຄ້າ (Customer)</th>
                <th className="px-5 py-4 font-semibold">ເບີໂທລະສັບ</th>
                <th className="px-5 py-4 font-semibold">ລາຍການສິນຄ້າ</th>
                <th className="px-5 py-4 font-semibold text-right">ຍອດເງິນລວມ</th>
                <th className="px-5 py-4 font-semibold">ສະຖານະ (Status)</th>
                <th className="px-5 py-4 font-semibold">ວິທີຊຳລະ</th>
                <th className="px-5 py-4 font-semibold">ວັນທີສ້າງ</th>
                <th className="px-5 py-4 font-semibold text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
                    <p className="text-zinc-500 text-sm mt-3 font-medium">ກຳລັງໂຫຼດຂໍ້ມູນອໍເດີ...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-24 text-center">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-600 mb-3 border border-zinc-700/50">
                      <Receipt size={32} />
                    </div>
                    <p className="text-zinc-300 font-medium">ບໍ່ພົບຂໍ້ມູນອໍເດີທີ່ຄົ້ນຫາ</p>
                    <p className="text-zinc-500 text-xs mt-1">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ລ້າງຕົວກັ່ນຕອງເພື່ອເບິ່ງລາຍການອື່ນ</p>
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const isEditing = editingId === item.id;
                  const currentStatus = statusConfig[item.status] || {
                    label: item.status,
                    bg: "bg-zinc-700/50",
                    text: "text-zinc-300",
                    border: "border-zinc-600",
                    dot: "bg-zinc-400",
                  };
                  const currentPayment = paymentConfig[item.paymentMethod] || {
                    label: item.paymentMethod,
                    bg: "bg-zinc-800",
                    text: "text-zinc-300",
                  };

                  return (
                    <tr
                      key={item.id}
                      className={`group transition-colors ${
                        isEditing
                          ? "bg-blue-500/10 border-l-4 border-l-blue-500"
                          : "hover:bg-zinc-800/40"
                      }`}
                    >
                      {/* Column 1: ID */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-400 group-hover:text-blue-400 transition-colors">
                          <span className="font-bold">#{item.id.slice(-6).toUpperCase()}</span>
                          <Link
                            href={`/receipt/${item.id}`}
                            target="_blank"
                            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white transition-opacity"
                            title="ເບິ່ງໃບບິນ (View Receipt)"
                          >
                            <ExternalLink size={12} />
                          </Link>
                        </div>
                      </td>

                      {/* Column 2: Customer Name */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.customerName}
                            onChange={(e) => setEditValues({ ...editValues, customerName: e.target.value })}
                            placeholder="ຊື່ລູກຄ້າ..."
                            className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 font-bold text-xs shrink-0">
                              <User size={13} />
                            </div>
                            <span className="font-semibold text-zinc-200">
                              {item.customerName || "ລູກຄ້າທົ່ວໄປ (Walk-in)"}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Column 3: Customer Phone */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.customerPhone}
                            onChange={(e) => setEditValues({ ...editValues, customerPhone: e.target.value })}
                            placeholder="ເບີໂທລະສັບ..."
                            className="w-36 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        ) : item.customerPhone ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300 font-mono">
                            <Phone size={12} className="text-zinc-500" />
                            {item.customerPhone}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Column 4: Items Preview */}
                      <td className="px-5 py-4">
                        {item.items && item.items.length > 0 ? (
                          <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700/60 inline-block">
                              {item.items.length} ລາຍການ
                            </span>
                            <p className="text-[11px] text-zinc-400 truncate max-w-[180px]">
                              {item.items.map((i) => i.product?.name || "ສິນຄ້າ").join(", ")}
                            </p>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs">ບໍ່ມີລາຍການສິນຄ້າ</span>
                        )}
                      </td>

                      {/* Column 5: Total Amount */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.totalAmount}
                            onChange={(e) => setEditValues({ ...editValues, totalAmount: e.target.value })}
                            className="w-32 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-right text-emerald-400 font-mono font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        ) : (
                          <span className="font-extrabold text-emerald-400 font-mono text-base tracking-tight">
                            {fmt(item.totalAmount)}
                          </span>
                        )}
                      </td>

                      {/* Column 6: Status Badge & Quick Change */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editValues.status}
                            onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="PAID">PAID</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="PROCESSING">PROCESSING</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="PENDING">PENDING</option>
                            <option value="CANCELLED">CANCELLED</option>
                            <option value="REFUNDED">REFUNDED</option>
                          </select>
                        ) : (
                          <div className="relative inline-block group/status">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border} transition-all`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`} />
                              {item.status}
                            </span>
                            {/* Fast status switcher tooltip */}
                            <div className="hidden group-hover/status:flex absolute left-0 top-full mt-1 z-30 bg-zinc-900 border border-zinc-700 rounded-xl p-1 shadow-2xl flex-col gap-0.5 min-w-[130px]">
                              {["PAID", "COMPLETED", "PROCESSING", "PENDING", "CANCELLED"].map((st) => (
                                <button
                                  key={st}
                                  onClick={() => handleQuickStatusChange(item.id, st)}
                                  className={`text-left px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors ${
                                    item.status === st ? "text-blue-400 font-bold" : "text-zinc-300"
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Column 7: Payment Method */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editValues.paymentMethod}
                            onChange={(e) => setEditValues({ ...editValues, paymentMethod: e.target.value })}
                            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="CASH">CASH</option>
                            <option value="TRANSFER">TRANSFER</option>
                            <option value="CASH_ON_DELIVERY">CASH_ON_DELIVERY</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${currentPayment.bg} ${currentPayment.text}`}
                          >
                            {item.paymentMethod}
                          </span>
                        )}
                      </td>

                      {/* Column 8: Created Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-zinc-400 text-xs font-mono">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("lo-LA") : "—"}
                      </td>

                      {/* Column 9: Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
                              title="ບັນທຶກ (Save)"
                            >
                              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all active:scale-95"
                              title="ຍົກເລີກ (Cancel)"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all active:scale-95"
                              title="ແກ້ໄຂຂໍ້ມູນ (Edit)"
                            >
                              <Pencil size={15} />
                            </button>

                            <Link
                              href={`/receipt/${item.id}`}
                              target="_blank"
                              className="p-2 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all active:scale-95"
                              title="ພິມໃບບິນ (Print Receipt)"
                            >
                              <Printer size={15} />
                            </Link>

                            <button
                              onClick={() => setDeleteConfirm(item)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-95"
                              title="ລຶບອໍເດີ (Delete)"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40">
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={limit}
            onPageChange={setPage}
            onItemsPerPageChange={(size) => {
              setLimit(size);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertCircle size={26} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">ຢືນຢັນການລຶບອໍເດີ</h3>
                <p className="text-zinc-400 text-xs mt-0.5 font-mono">
                  ລະຫັດບິນ: #{deleteConfirm.id.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>ລູກຄ້າ:</span>
                <span className="font-semibold text-white">{deleteConfirm.customerName || "ລູກຄ້າທົ່ວໄປ"}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>ຍອດເງິນລວມ:</span>
                <span className="font-bold text-emerald-400 font-mono">{fmt(deleteConfirm.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>ສະຖານະ:</span>
                <span className="font-semibold text-zinc-200">{deleteConfirm.status}</span>
              </div>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed">
              ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບອໍເດີນີ້ອອກຈາກຖານຂໍ້ມູນ? ການກະທຳນີ້ຈະລຶບລາຍການສິນຄ້າໃນບິນອອກ ແລະ ບໍ່ສາມາດກູ້ຄືນໄດ້.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold transition-colors"
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-600/20 transition-colors"
              >
                ຢືນຢັນການລຶບ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
