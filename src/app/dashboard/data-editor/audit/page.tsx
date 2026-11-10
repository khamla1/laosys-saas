"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  History,
  Search,
  Loader2,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  SlidersHorizontal,
  Filter,
  BarChart3,
  User,
  ShieldCheck,
  FileEdit,
  Trash2,
  Clock,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/excel";
import { PaginationControls } from "@/components/PaginationControls";

const actionMap: Record<string, { label: string; bg: string; text: string; border: string; isDelete: boolean }> = {
  DATA_EDITOR_UPDATE_ORDERS: {
    label: "ແກ້ໄຂອໍເດີ (Update Orders)",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/30",
    isDelete: false,
  },
  DATA_EDITOR_UPDATE_PRODUCTS: {
    label: "ແກ້ໄຂສິນຄ້າ (Update Products)",
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    border: "border-purple-500/30",
    isDelete: false,
  },
  DATA_EDITOR_UPDATE_CUSTOMERS: {
    label: "ແກ້ໄຂລູກຄ້າ (Update Customers)",
    bg: "bg-cyan-500/15",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    isDelete: false,
  },
  DATA_EDITOR_UPDATE_TRANSACTIONS: {
    label: "ແກ້ໄຂທຸລະກຳ (Update Transactions)",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    isDelete: false,
  },
  DATA_EDITOR_UPDATE_STOCK: {
    label: "ແກ້ໄຂສະຕັອກ (Update Stock)",
    bg: "bg-teal-500/15",
    text: "text-teal-400",
    border: "border-teal-500/30",
    isDelete: false,
  },
  DATA_EDITOR_UPDATE_SUPPLIERS: {
    label: "ແກ້ໄຂຜູ້ສະໜອງ (Update Suppliers)",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
    isDelete: false,
  },
  DATA_EDITOR_UPDATE_COUPONS: {
    label: "ແກ້ໄຂຄູປອງ (Update Coupons)",
    bg: "bg-pink-500/15",
    text: "text-pink-400",
    border: "border-pink-500/30",
    isDelete: false,
  },
  DATA_EDITOR_DELETE_ORDERS: {
    label: "ລົບອໍເດີ (Delete Orders)",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    isDelete: true,
  },
  DATA_EDITOR_DELETE_PRODUCTS: {
    label: "ລົບສິນຄ້າ (Delete Products)",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    isDelete: true,
  },
  DATA_EDITOR_DELETE_TRANSACTIONS: {
    label: "ລົບທຸລະກຳ (Delete Transactions)",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    isDelete: true,
  },
  DATA_EDITOR_DELETE_STOCK: {
    label: "ລົບສະຕັອກ (Delete Stock)",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    isDelete: true,
  },
  DATA_EDITOR_DELETE_SUPPLIERS: {
    label: "ລົບຜູ້ສະໜອງ (Delete Suppliers)",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    isDelete: true,
  },
  DATA_EDITOR_DELETE_COUPONS: {
    label: "ລົບຄູປອງ (Delete Coupons)",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    isDelete: true,
  },
};

function renderAuditDetails(details: string) {
  try {
    const jsonMatch = details.match(/:\s*({.*})$/);
    if (jsonMatch) {
      const obj = JSON.parse(jsonMatch[1]);
      return (
        <div className="flex flex-wrap gap-1.5 max-w-lg">
          {Object.entries(obj).map(([key, val]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 rounded-lg text-xs"
            >
              <span className="text-zinc-400 font-medium">{key}:</span>
              <span className="text-zinc-200 font-mono font-bold">{String(val)}</span>
            </span>
          ))}
        </div>
      );
    }
    return <span className="text-zinc-300 text-xs font-mono">{details}</span>;
  } catch {
    return <span className="text-zinc-300 text-xs font-mono">{details}</span>;
  }
}

interface AuditItem {
  id: string;
  action: string;
  userId?: string;
  details?: string;
  createdAt: string;
  user?: {
    name?: string;
    email?: string;
  };
}

export default function AuditTrailPage() {
  const [data, setData] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search: search.trim(),
        });

        const res = await fetch(`/api/data-editor/audit?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
          setTotal(json.total || 0);
          if (isManualRefresh) {
            toast.success("ອັບເດດປະຫວັດການແກ້ໄຂລ່າສຸດແລ້ວ");
          }
        } else {
          toast.error("ບໍ່ສາມາດໂຫຼດປະຫວັດການແກ້ໄຂໄດ້");
        }
      } catch {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, search]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalLogs = total;
    const updateLogs = data.filter((item) => item.action && item.action.includes("UPDATE")).length;
    const deleteLogs = data.filter((item) => item.action && item.action.includes("DELETE")).length;
    const latestUser = data[0]?.user?.name || data[0]?.user?.email || "System";

    const sampleTotal = Math.max(data.length, 1);
    const updatePerc = Math.round((updateLogs / sampleTotal) * 100);
    const deletePerc = Math.round((deleteLogs / sampleTotal) * 100);

    return {
      totalLogs,
      updateLogs,
      deleteLogs,
      latestUser,
      updatePerc,
      deletePerc,
    };
  }, [data, total]);

  // Client-side quick filter
  const filteredData = useMemo(() => {
    if (actionFilter === "UPDATE") {
      return data.filter((item) => item.action.includes("UPDATE"));
    }
    if (actionFilter === "DELETE") {
      return data.filter((item) => item.action.includes("DELETE"));
    }
    if (actionFilter === "ORDERS") {
      return data.filter((item) => item.action.includes("ORDERS"));
    }
    if (actionFilter === "PRODUCTS") {
      return data.filter((item) => item.action.includes("PRODUCTS"));
    }
    if (actionFilter === "STOCK") {
      return data.filter((item) => item.action.includes("STOCK"));
    }
    return data;
  }, [data, actionFilter]);

  const totalPages = Math.ceil(total / limit);

  const handleExportExcel = () => {
    exportToExcel({
      filename: `Audit_Report_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "AuditTrail",
      title: "ລາຍງານປະຫວັດການແກ້ໄຂຂໍ້ມູນທັງໝົດ (AUDIT TRAIL REPORT)",
      subtitle: `ລວມທັງໝົດ ${data.length} ລາຍການ | ວັນທີສ້າງ: ${new Date().toLocaleDateString("lo-LA")}`,
      headers: ["ລຳດັບ", "ການກະທຳ (Action)", "ຜູ້ດຳເນີນການ", "ອີເມລ", "ລາຍລະອຽດ (Details)", "ວັນທີ ແລະ ເວລາ"],
      data: data.map((item, idx) => [
        idx + 1,
        item.action || "-",
        item.user?.name || item.userId || "System",
        item.user?.email || "-",
        item.details || "-",
        item.createdAt ? new Date(item.createdAt).toLocaleString("lo-LA") : "-",
      ]),
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        `${data.length} ລາຍການ`,
        "",
        "",
        "",
        "",
      ],
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── TOP BANNER & ACTIONS ── */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck size={13} />
              <span>ລະບົບບັນທຶກຄວາມປອດໄພ ແລະ ປະຫວັດການແກ້ໄຂ (Audit Trail)</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              ປະຫວັດການແກ້ໄຂ (Audit)
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-mono">
                {total.toLocaleString()} ລາຍການ
              </span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed">
              ຕິດຕາມ, ກວດສອບ ແລະ ບັນທຶກທຸກການປ່ຽນແປງຂໍ້ມູນໃນລະບົບ — ກວດສອບຜູ້ແກ້ໄຂ, ລາຍລະອຽດການດັດແກ້ ແລະ ເວລາດຳເນີນການແບບ Realtime
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-sm font-medium border border-zinc-700/70 hover:border-zinc-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="ໂຫຼດຂໍ້ມູນໃໝ່"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin text-indigo-400" : "text-zinc-400"} />
              <span>ໂຫຼດຂໍ້ມູນໃໝ່</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-sm font-medium border border-emerald-500/30 transition-all shadow-sm active:scale-95"
            >
              <ArrowUpRight size={16} className="text-emerald-400" />
              <span>ດາວໂຫຼດ Excel ສວຍໆ</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Audit Logs */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ລາຍການບັນທຶກທັງໝົດ</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <History size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">{stats.totalLogs.toLocaleString()}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ປະຫວັດການດັດແກ້ທັງໝົດ</span>
            </div>
          </div>
        </div>

        {/* Card 2: Update Actions */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ການແກ້ໄຂ (Updates)</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileEdit size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-blue-400 tracking-tight">
              {stats.updateLogs}{" "}
              <span className="text-sm font-semibold text-zinc-400 font-mono">({stats.updatePerc}%)</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, stats.updatePerc)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Delete Actions */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ການລຶບ (Deletions)</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Trash2 size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-rose-400 tracking-tight">
              {stats.deleteLogs}{" "}
              <span className="text-sm font-semibold text-zinc-400 font-mono">({stats.deletePerc}%)</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, stats.deletePerc)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Most Recent Performer */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຜູ້ດຳເນີນການລ່າສຸດ</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <User size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-white tracking-tight truncate" title={stats.latestUser}>
              {stats.latestUser}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ແກ້ໄຂລາຍການຫຼ້າສຸດ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── VISUAL AUDIT BREAKDOWN CHART ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl backdrop-blur-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2.5">
              <BarChart3 size={18} className="text-indigo-400" />
              <span>ກາບສະແດງສັດສ່ວນການດັດແກ້ຂໍ້ມູນ (Audit Activity Distribution)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              ສັດສ່ວນການແກ້ໄຂ (Updates) ທຽບກັບການລຶບຂໍ້ມູນ (Deletions)
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/20 font-mono">
            {data.length} ລາຍການ (ໜ້ານີ້)
          </span>
        </div>

        {/* Multi-segment visual progress bar */}
        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          <div
            className="h-full bg-blue-500 rounded-l-full transition-all duration-500"
            style={{ width: `${Math.max(stats.updatePerc, 2)}%` }}
            title={`ການແກ້ໄຂ: ${stats.updatePerc}%`}
          />
          <div
            className="h-full bg-rose-500 rounded-r-full transition-all duration-500"
            style={{ width: `${Math.max(stats.deletePerc, 2)}%` }}
            title={`ການລຶບ: ${stats.deletePerc}%`}
          />
        </div>

        {/* 2 Summary metric pills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                ການດັດແກ້ຂໍ້ມູນ (UPDATE)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.updateLogs} ລາຍການ ({stats.updatePerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.updatePerc)}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                ການລຶບຂໍ້ມູນ (DELETE)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.deleteLogs} ລາຍການ ({stats.deletePerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.deletePerc)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── FAST FILTER & SEARCH BAR ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm space-y-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-medium text-zinc-500 flex items-center gap-1 pr-1">
            <Filter size={13} /> ປະເພດ:
          </span>
          {[
            { id: "ALL", label: "ທັງໝົດ" },
            { id: "UPDATE", label: "ການແກ້ໄຂ (Updates)" },
            { id: "DELETE", label: "ການລຶບ (Deletions)" },
            { id: "PRODUCTS", label: "ສິນຄ້າ (Products)" },
            { id: "ORDERS", label: "ອໍເດີ (Orders)" },
            { id: "STOCK", label: "ສະຕັອກ (Stock)" },
          ].map((tab) => {
            const active = actionFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActionFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  active
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20"
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
              placeholder="ຄົ້ນຫາລາຍລະອຽດການແກ້ໄຂ..."
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
              >
                <span className="text-xs">ລ້າງ</span>
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
                className="appearance-none pl-3.5 pr-8 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 hover:border-zinc-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value={30}>30 ລາຍການ / ໜ້າ</option>
                <option value={50}>50 ລາຍການ / ໜ້າ</option>
                <option value={100}>100 ລາຍການ / ໜ້າ</option>
              </select>
              <SlidersHorizontal size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── AUDIT DATA TABLE ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                <th className="px-5 py-4 font-semibold">ການກະທຳ (Action)</th>
                <th className="px-5 py-4 font-semibold">ຜູ້ດຳເນີນການ (User)</th>
                <th className="px-5 py-4 font-semibold">ລາຍລະອຽດການປ່ຽນແປງ (Changes)</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">ວັນທີ ແລະ ເວລາ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
                    <p className="text-zinc-500 text-sm mt-3 font-medium">ກຳລັງໂຫຼດປະຫວັດການແກ້ໄຂ...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-600 mb-3 border border-zinc-700/50">
                      <History size={32} />
                    </div>
                    <p className="text-zinc-300 font-medium">ບໍ່ພົບປະຫວັດການແກ້ໄຂ</p>
                    <p className="text-zinc-500 text-xs mt-1">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ລ້າງຕົວກັ່ນຕອງເພື່ອເບິ່ງລາຍການອື່ນ</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const actionInfo = actionMap[item.action] || {
                    label: item.action,
                    bg: "bg-zinc-700/40",
                    text: "text-zinc-300",
                    border: "border-zinc-600",
                    isDelete: false,
                  };

                  return (
                    <tr key={item.id} className="hover:bg-zinc-800/40 transition-colors">
                      {/* Column 1: Action */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${actionInfo.bg} ${actionInfo.text} ${actionInfo.border}`}
                        >
                          {actionInfo.isDelete ? <Trash2 size={12} /> : <FileEdit size={12} />}
                          {actionInfo.label}
                        </span>
                      </td>

                      {/* Column 2: User */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-bold shrink-0">
                            <User size={13} />
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-200 text-xs">
                              {item.user?.name || "System User"}
                            </p>
                            {item.user?.email && (
                              <p className="text-[11px] text-zinc-500">{item.user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Details */}
                      <td className="px-5 py-4">
                        {renderAuditDetails(item.details || "—")}
                      </td>

                      {/* Column 4: Timestamp */}
                      <td className="px-5 py-4 whitespace-nowrap text-zinc-400 text-xs font-mono">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={12} className="text-zinc-500" />
                          {item.createdAt ? new Date(item.createdAt).toLocaleString("lo-LA") : "—"}
                        </span>
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
    </div>
  );
}
