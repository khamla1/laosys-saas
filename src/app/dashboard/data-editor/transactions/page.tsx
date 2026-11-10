"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Pencil,
  Check,
  X,
  Loader2,
  Trash2,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  SlidersHorizontal,
  Filter,
  BarChart3,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wallet,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/excel";
import { PaginationControls } from "@/components/PaginationControls";

const fmt = (n: number) => "₭" + new Intl.NumberFormat("en").format(n || 0);

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  COMPLETED: {
    label: "COMPLETED (ສຳເລັດ)",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  PENDING: {
    label: "PENDING (ລໍຖ້າກວດສອບ)",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  FAILED: {
    label: "FAILED (ບໍ່ສຳເລັດ)",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
  },
};

const paymentConfig: Record<string, { label: string; bg: string; text: string }> = {
  CASH: { label: "ເງິນສົດ (CASH)", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  TRANSFER: { label: "ໂອນເງິນ (TRANSFER)", bg: "bg-blue-500/10", text: "text-blue-400" },
  CREDIT_CARD: { label: "ບັດເຄຣດິດ", bg: "bg-purple-500/10", text: "text-purple-400" },
  PROMPTPAY: { label: "QR / PromptPay", bg: "bg-cyan-500/10", text: "text-cyan-400" },
};

interface TransactionItem {
  id: string;
  reference: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  orderId?: string;
}

export default function EditTransactionsPage() {
  const [data, setData] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    amount: number | string;
    status: string;
    paymentMethod: string;
  }>({
    amount: 0,
    status: "COMPLETED",
    paymentMethod: "CASH",
  });
  const [saving, setSaving] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState<TransactionItem | null>(null);

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
        });

        const res = await fetch(`/api/data-editor/transactions?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
          setTotal(json.total || 0);
          if (isManualRefresh) {
            toast.success("ອັບເດດຂໍ້ມູນທຸລະກຳການເງິນລ່າສຸດແລ້ວ");
          }
        } else {
          toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນທຸລະກຳໄດ້");
        }
      } catch {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, search, statusFilter]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalTransactions = total;
    const totalAmountSum = data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const completedCount = data.filter((item) => item.status === "COMPLETED").length;
    const pendingCount = data.filter((item) => item.status === "PENDING").length;
    const failedCount = data.filter((item) => item.status === "FAILED").length;

    const sampleTotal = Math.max(data.length, 1);
    const completedPerc = Math.round((completedCount / sampleTotal) * 100);
    const pendingPerc = Math.round((pendingCount / sampleTotal) * 100);
    const failedPerc = Math.round((failedCount / sampleTotal) * 100);

    return {
      totalTransactions,
      totalAmountSum,
      completedCount,
      pendingCount,
      failedCount,
      completedPerc,
      pendingPerc,
      failedPerc,
    };
  }, [data, total]);

  const handleEdit = (item: TransactionItem) => {
    setEditingId(item.id);
    setEditValues({
      amount: item.amount || 0,
      status: item.status || "COMPLETED",
      paymentMethod: item.paymentMethod || "CASH",
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/data-editor/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          updates: {
            amount: Number(editValues.amount) || 0,
            status: editValues.status,
            paymentMethod: editValues.paymentMethod,
          },
        }),
      });

      if (res.ok) {
        toast.success("ບັນທຶກການແກ້ໄຂທຸລະກຳການເງິນສຳເລັດແລ້ວ");
        setEditingId(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/data-editor/transactions?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("ລຶບທຸລະກຳການເງິນອອກຮຽບຮ້ອຍ");
        fetchData();
      } else {
        toast.error("ບໍ່ສາມາດລຶບທຸລະກຳໄດ້");
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
      filename: `Transactions_Report_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Transactions",
      title: "ລາຍງານປະຫວັດທຸລະກຳການເງິນ (TRANSACTIONS REPORT)",
      subtitle: `ລວມທັງໝົດ ${data.length} ລາຍການ | ວັນທີສ້າງ: ${new Date().toLocaleDateString("lo-LA")}`,
      headers: ["ລຳດັບ", "ລະຫັດອ້າງອີງ (Reference)", "ຍອດເງິນ (₭)", "ສະຖານະ", "ຊ່ອງທາງຊຳລະ", "ວັນທີ ແລະ ເວລາ"],
      data: data.map((t, idx) => [
        idx + 1,
        t.reference || "-",
        t.amount ? Number(t.amount).toLocaleString() : "0",
        t.status || "-",
        t.paymentMethod || "-",
        t.createdAt ? new Date(t.createdAt).toLocaleString("lo-LA") : "-",
      ]),
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        "",
        `₭${data.reduce((sum, t) => sum + (Number(t.amount) || 0), 0).toLocaleString()}`,
        `${data.length} ລາຍການ`,
        "",
        "",
      ],
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── TOP BANNER & ACTIONS ── */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles size={13} />
              <span>ລະບົບຈັດການຂໍ້ມູນການເງິນ (Data Editor)</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              ແກ້ໄຂທຸລະກຳການເງິນ
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-mono">
                {total.toLocaleString()} ລາຍການ
              </span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed">
              ຈັດການ, ຕິດຕາມ ແລະ ດັດແກ້ປະຫວັດທຸລະກຳການເງິນ — ແກ້ໄຂຍອດເງິນ, ສະຖານະການຊຳລະ ແລະ ຊ່ອງທາງການຊຳລະເງິນໄດ້ທັນທີ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-sm font-medium border border-zinc-700/70 hover:border-zinc-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="ໂຫຼດຂໍ້ມູນໃໝ່"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin text-emerald-400" : "text-zinc-400"} />
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
              href="/dashboard/accounting/journals"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Wallet size={16} />
              <span>ບັນຊີການເງິນ</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Transactions */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ທຸລະກຳທັງໝົດ</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Receipt size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">{stats.totalTransactions.toLocaleString()}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ລາຍການທຸລະກຳໃນລະບົບ</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Revenue in View */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຍອດເງິນລວມ (ໜ້ານີ້)</span>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">{fmt(stats.totalAmountSum)}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ມູນຄ່າທຸລະກຳໃນຕາຕະລາງ</span>
            </div>
          </div>
        </div>

        {/* Card 3: Completed */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ສຳເລັດແລ້ວ</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.completedCount}{" "}
              <span className="text-sm font-semibold text-emerald-400 font-mono">({stats.completedPerc}%)</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, stats.completedPerc)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Pending / Failed */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ລໍຖ້າ / ບໍ່ສຳເລັດ</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {stats.pendingCount + stats.failedCount}{" "}
              <span className="text-sm font-semibold text-zinc-400 font-mono">
                ({stats.pendingPerc + stats.failedPerc}%)
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ລໍຖ້າການຢືນຢັນຍອດເງິນ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── VISUAL FINANCIAL FLOW CHART ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl backdrop-blur-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2.5">
              <BarChart3 size={18} className="text-emerald-400" />
              <span>ກາບສະແດງສະຖານະການເງິນ (Visual Financial Status Flow)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              ສັດສ່ວນທຸລະກຳ: ສຳເລັດ (Completed), ລໍຖ້າກວດສອບ (Pending), ແລະ ບໍ່ສຳເລັດ (Failed)
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 font-mono">
            {data.length} ລາຍການ (ໜ້ານີ້)
          </span>
        </div>

        {/* Multi-segment visual progress bar */}
        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          <div
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
            style={{ width: `${Math.max(stats.completedPerc, 2)}%` }}
            title={`ສຳເລັດ: ${stats.completedPerc}%`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${Math.max(stats.pendingPerc, 2)}%` }}
            title={`ລໍຖ້າ: ${stats.pendingPerc}%`}
          />
          <div
            className="h-full bg-rose-500 rounded-r-full transition-all duration-500"
            style={{ width: `${Math.max(stats.failedPerc, 2)}%` }}
            title={`ບໍ່ສຳເລັດ: ${stats.failedPerc}%`}
          />
        </div>

        {/* 3 Summary metric pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                ສຳເລັດ (COMPLETED)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.completedCount} ລາຍການ ({stats.completedPerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.completedPerc)}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                ລໍຖ້າກວດສອບ (PENDING)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.pendingCount} ລາຍການ ({stats.pendingPerc}%)
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
                ບໍ່ສຳເລັດ (FAILED)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.failedCount} ລາຍການ ({stats.failedPerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.failedPerc)}%` }}
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
            { id: "COMPLETED", label: "ສຳເລັດ (Completed)" },
            { id: "PENDING", label: "ລໍຖ້າກວດສອບ (Pending)" },
            { id: "FAILED", label: "ບໍ່ສຳເລັດ (Failed)" },
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
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                    : "bg-zinc-800/70 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Limit Controls */}
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
              placeholder="ຄົ້ນຫາ Reference ID..."
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-mono"
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

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="appearance-none pl-3.5 pr-8 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 hover:border-zinc-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
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

      {/* ── TRANSACTIONS DATA TABLE ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                <th className="px-5 py-4 font-semibold">ລະຫັດອ້າງອີງ (Reference)</th>
                <th className="px-5 py-4 font-semibold text-right">ຍອດເງິນ (Amount)</th>
                <th className="px-5 py-4 font-semibold">ສະຖານະ (Status)</th>
                <th className="px-5 py-4 font-semibold">ຊ່ອງທາງຊຳລະ</th>
                <th className="px-5 py-4 font-semibold">ວັນທີ ແລະ ເວລາ</th>
                <th className="px-5 py-4 font-semibold text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-emerald-500" size={32} />
                    <p className="text-zinc-500 text-sm mt-3 font-medium">ກຳລັງໂຫຼດຂໍ້ມູນທຸລະກຳ...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-600 mb-3 border border-zinc-700/50">
                      <CreditCard size={32} />
                    </div>
                    <p className="text-zinc-300 font-medium">ບໍ່ພົບຂໍ້ມູນທຸລະກຳທີ່ຄົ້ນຫາ</p>
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
                          ? "bg-emerald-500/10 border-l-4 border-l-emerald-500"
                          : "hover:bg-zinc-800/40"
                      }`}
                    >
                      {/* Column 1: Reference */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-400 shrink-0">
                            <Receipt size={13} />
                          </div>
                          <div>
                            <span className="font-mono text-xs font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">
                              {item.reference || `#${item.id.slice(-6).toUpperCase()}`}
                            </span>
                            {item.orderId && (
                              <p className="text-[11px] text-zinc-500 font-mono">Order: #{item.orderId.slice(-6)}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Amount */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.amount}
                            onChange={(e) => setEditValues({ ...editValues, amount: e.target.value })}
                            className="w-32 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-right text-emerald-400 font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            autoFocus
                          />
                        ) : (
                          <span className="font-extrabold text-emerald-400 font-mono text-base tracking-tight">
                            {fmt(item.amount)}
                          </span>
                        )}
                      </td>

                      {/* Column 3: Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editValues.status}
                            onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                          >
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="PENDING">PENDING</option>
                            <option value="FAILED">FAILED</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`} />
                            {item.status}
                          </span>
                        )}
                      </td>

                      {/* Column 4: Payment Method */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editValues.paymentMethod}
                            onChange={(e) => setEditValues({ ...editValues, paymentMethod: e.target.value })}
                            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                          >
                            <option value="CASH">CASH</option>
                            <option value="TRANSFER">TRANSFER</option>
                            <option value="CREDIT_CARD">CREDIT_CARD</option>
                            <option value="PROMPTPAY">PROMPTPAY</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${currentPayment.bg} ${currentPayment.text}`}
                          >
                            {item.paymentMethod}
                          </span>
                        )}
                      </td>

                      {/* Column 5: Created Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-zinc-400 text-xs font-mono">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString("lo-LA") : "—"}
                      </td>

                      {/* Column 6: Actions */}
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
                              className="p-2 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all active:scale-95"
                              title="ແກ້ໄຂຂໍ້ມູນ (Edit)"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              onClick={() => setDeleteConfirm(item)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-95"
                              title="ລຶບທຸລະກຳ (Delete)"
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
                <h3 className="text-lg font-bold text-white">ຢືນຢັນການລຶບທຸລະກຳ</h3>
                <p className="text-zinc-400 text-xs mt-0.5 font-mono">
                  Ref: {deleteConfirm.reference || `#${deleteConfirm.id.slice(-6)}`}
                </p>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>ຍອດເງິນ:</span>
                <span className="font-bold text-emerald-400 font-mono">{fmt(deleteConfirm.amount)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>ສະຖານະ:</span>
                <span className="font-semibold text-zinc-200">{deleteConfirm.status}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>ວິທີຊຳລະ:</span>
                <span className="font-semibold text-zinc-300">{deleteConfirm.paymentMethod}</span>
              </div>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed">
              ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບທຸລະກຳການເງິນນີ້? ການກະທຳນີ້ບໍ່ສາມາດຍ້ອນກັບໄດ້.
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
