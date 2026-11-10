"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Boxes,
  Search,
  Pencil,
  Check,
  X,
  Loader2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  BarChart3,
  Filter,
  ArrowUpRight,
  Warehouse,
  Package,
  Layers,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/excel";
import { PaginationControls } from "@/components/PaginationControls";

interface StockItem {
  id: string;
  productName: string;
  warehouseName: string;
  quantity: number;
  productId?: string;
  warehouseId?: string;
}

export default function EditStockPage() {
  const [data, setData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ quantity: number | string }>({ quantity: 0 });
  const [saving, setSaving] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [stockLevelFilter, setStockLevelFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState<StockItem | null>(null);

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

        const res = await fetch(`/api/data-editor/stock?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
          setTotal(json.total || 0);
          if (isManualRefresh) {
            toast.success("ອັບເດດຂໍ້ມູນສະຕັອກສິນຄ້າລ່າສຸດແລ້ວ");
          }
        } else {
          toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນສະຕັອກໄດ້");
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
    const totalItems = total;
    const totalUnits = data.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const healthyCount = data.filter((item) => Number(item.quantity) > 20).length;
    const lowCount = data.filter((item) => Number(item.quantity) > 0 && Number(item.quantity) <= 20).length;
    const outOfStockCount = data.filter((item) => Number(item.quantity) <= 0).length;

    const sampleTotal = Math.max(data.length, 1);
    const healthyPerc = Math.round((healthyCount / sampleTotal) * 100);
    const lowPerc = Math.round((lowCount / sampleTotal) * 100);
    const outPerc = Math.round((outOfStockCount / sampleTotal) * 100);

    return {
      totalItems,
      totalUnits,
      healthyCount,
      lowCount,
      outOfStockCount,
      healthyPerc,
      lowPerc,
      outPerc,
    };
  }, [data, total]);

  // Client-side quick filter by level
  const filteredData = useMemo(() => {
    if (stockLevelFilter === "HEALTHY") {
      return data.filter((item) => Number(item.quantity) > 20);
    }
    if (stockLevelFilter === "LOW") {
      return data.filter((item) => Number(item.quantity) > 0 && Number(item.quantity) <= 20);
    }
    if (stockLevelFilter === "OUT") {
      return data.filter((item) => Number(item.quantity) <= 0);
    }
    return data;
  }, [data, stockLevelFilter]);

  const handleEdit = (item: StockItem) => {
    setEditingId(item.id);
    setEditValues({ quantity: item.quantity });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/data-editor/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          updates: { quantity: Number(editValues.quantity) || 0 },
        }),
      });

      if (res.ok) {
        toast.success("ບັນທຶກການປັບປ່ຽນຈຳນວນສະຕັອກສຳເລັດແລ້ວ");
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
      const res = await fetch(`/api/data-editor/stock?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("ລຶບລາຍການສະຕັອກອອກຮຽບຮ້ອຍ");
        fetchData();
      } else {
        toast.error("ບໍ່ສາມາດລຶບລາຍການໄດ້");
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
      filename: `Stock_Report_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Stock",
      title: "ລາຍງານສະຕັອກສິນຄ້າໃນຄັງ (STOCK INVENTORY REPORT)",
      subtitle: `ລວມທັງໝົດ ${data.length} ລາຍການ | ວັນທີສ້າງ: ${new Date().toLocaleDateString("lo-LA")}`,
      headers: ["ລຳດັບ", "ລະຫັດສິນຄ້າ (ID)", "ຊື່ສິນຄ້າ", "ສາງສິນຄ້າ", "ຈຳນວນຄົງເຫຼືອ (ຊິ້ນ)", "ສະຖານະສະຕັອກ"],
      data: data.map((item, idx) => [
        idx + 1,
        item.id ? `#${item.id.slice(-6).toUpperCase()}` : "-",
        item.productName || "-",
        item.warehouseName || "ສາງຫຼັກ",
        Number(item.quantity) || 0,
        Number(item.quantity) <= 0
          ? "ໝົດສາງ (OUT)"
          : Number(item.quantity) <= 20
          ? "ໃກ້ໝົດ (LOW)"
          : "ປົກກະຕິ (HEALTHY)",
      ]),
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        "",
        "",
        "",
        `${data.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0)} ຊິ້ນ`,
        `${data.length} ລາຍການ`,
      ],
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── TOP BANNER & ACTIONS ── */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles size={13} />
              <span>ລະບົບຈັດການຂໍ້ມູນຄັງສິນຄ້າ (Data Editor)</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              ແກ້ໄຂຂໍ້ມູນຄັງສິນຄ້າ
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-mono">
                {total.toLocaleString()} ລາຍການ
              </span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed">
              ຈັດການ, ຕິດຕາມ ແລະ ດັດແກ້ຈຳນວນສິນຄ້າຄົງເຫຼືອໃນແຕ່ລະສາງ — ອັບເດດຍອດສະຕັອກໄດ້ທັນທີພ້ອມລະບົບກວດສອບຄວາມພ້ອມຂອງສິນຄ້າ
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
              href="/dashboard/inventory"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Warehouse size={16} />
              <span>ໄປໜ້າຈັດການສາງ (Inventory)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Stock Rows */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ລາຍການສະຕັອກທັງໝົດ</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Boxes size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">{stats.totalItems.toLocaleString()}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ລາຍການສິນຄ້າທີ່ຜູກກັບສາງ</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Units in Stock */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຈຳນວນຊິ້ນລວມ (ໜ້ານີ້)</span>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Package size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-teal-400 tracking-tight">{stats.totalUnits.toLocaleString()} <span className="text-sm font-semibold text-zinc-400">ຊິ້ນ</span></div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ຍອດສິນຄ້າພ້ອມສົ່ງໃນສາງ</span>
            </div>
          </div>
        </div>

        {/* Card 3: Healthy Stock */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ສະຕັອກປົກກະຕິ (&gt; 20)</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.healthyCount}{" "}
              <span className="text-sm font-semibold text-emerald-400 font-mono">({stats.healthyPerc}%)</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, stats.healthyPerc)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Low & Out of Stock */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ໃກ້ໝົດ / ໝົດສາງ</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {stats.lowCount + stats.outOfStockCount}{" "}
              <span className="text-sm font-semibold text-zinc-400 font-mono">
                ({stats.lowPerc + stats.outPerc}%)
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ຕ້ອງສັ່ງຊື້ເພີ່ມດ່ວນ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── VISUAL INVENTORY LEVEL CHART ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl backdrop-blur-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2.5">
              <BarChart3 size={18} className="text-emerald-400" />
              <span>ກາບສະແດງສະຖານະສະຕັອກສິນຄ້າໃນຄັງ (Visual Inventory Level Chart)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              ສັດສ່ວນສິນຄ້າໃນຄັງ: ສະຕັອກປົກກະຕິ, ສິນຄ້າໃກ້ໝົດ, ແລະ ສິນຄ້າທີ່ໝົດສາງ
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 font-mono">
            {data.length} ລາຍການໃນສາງ (ໜ້ານີ້)
          </span>
        </div>

        {/* Multi-segment visual progress bar */}
        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          <div
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
            style={{ width: `${Math.max(stats.healthyPerc, 2)}%` }}
            title={`ປົກກະຕິ: ${stats.healthyPerc}%`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${Math.max(stats.lowPerc, 2)}%` }}
            title={`ໃກ້ໝົດ: ${stats.lowPerc}%`}
          />
          <div
            className="h-full bg-rose-500 rounded-r-full transition-all duration-500"
            style={{ width: `${Math.max(stats.outPerc, 2)}%` }}
            title={`ໝົດສາງ: ${stats.outPerc}%`}
          />
        </div>

        {/* 3 Summary metric pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                ສະຕັອກປົກກະຕິ (&gt; 20 ຊິ້ນ)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.healthyCount} ລາຍການ ({stats.healthyPerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.healthyPerc)}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                ໃກ້ໝົດສາງ (1 - 20 ຊິ້ນ)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.lowCount} ລາຍການ ({stats.lowPerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.lowPerc)}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                ສິນຄ້າໝົດສາງ (0 ຊິ້ນ)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.outOfStockCount} ລາຍການ ({stats.outPerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.outPerc)}%` }}
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
            <Filter size={13} /> ລະດັບສະຕັອກ:
          </span>
          {[
            { id: "ALL", label: "ທັງໝົດ" },
            { id: "HEALTHY", label: "ສະຕັອກປົກກະຕິ (> 20)" },
            { id: "LOW", label: "ໃກ້ໝົດສາງ (1 - 20)" },
            { id: "OUT", label: "ໝົດສາງ (0)" },
          ].map((tab) => {
            const active = stockLevelFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStockLevelFilter(tab.id)}
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
              placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ ຫຼື ສາງ..."
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
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

      {/* ── STOCK DATA TABLE ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                <th className="px-5 py-4 font-semibold">ລະຫັດ (ID)</th>
                <th className="px-5 py-4 font-semibold">ຊື່ສິນຄ້າ (Product Name)</th>
                <th className="px-5 py-4 font-semibold">ຄັງສິນຄ້າ (Warehouse)</th>
                <th className="px-5 py-4 font-semibold text-right">ຈຳນວນໃນຄັງ</th>
                <th className="px-5 py-4 font-semibold">ລະດັບຄວາມພ້ອມ</th>
                <th className="px-5 py-4 font-semibold">ສະຖານະ</th>
                <th className="px-5 py-4 font-semibold text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-emerald-500" size={32} />
                    <p className="text-zinc-500 text-sm mt-3 font-medium">ກຳລັງໂຫຼດຂໍ້ມູນສະຕັອກ...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-600 mb-3 border border-zinc-700/50">
                      <Boxes size={32} />
                    </div>
                    <p className="text-zinc-300 font-medium">ບໍ່ພົບຂໍ້ມູນສະຕັອກທີ່ຄົ້ນຫາ</p>
                    <p className="text-zinc-500 text-xs mt-1">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ລ້າງຕົວກັ່ນຕອງເພື່ອເບິ່ງລາຍການອື່ນ</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const isEditing = editingId === item.id;
                  const qty = Number(item.quantity) || 0;
                  const isOut = qty <= 0;
                  const isLow = qty > 0 && qty <= 20;
                  const maxCap = 100;
                  const healthPercent = Math.min(100, Math.round((qty / maxCap) * 100));

                  return (
                    <tr
                      key={item.id}
                      className={`group transition-colors ${
                        isEditing
                          ? "bg-emerald-500/10 border-l-4 border-l-emerald-500"
                          : "hover:bg-zinc-800/40"
                      }`}
                    >
                      {/* Column 1: ID */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-zinc-500 font-bold group-hover:text-emerald-400 transition-colors">
                          #{item.id.slice(-6).toUpperCase()}
                        </span>
                      </td>

                      {/* Column 2: Product Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-400 shrink-0">
                            <Package size={15} />
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-200">{item.productName || "ສິນຄ້າບໍ່ມີຊື່"}</p>
                            {item.productId && (
                              <p className="text-[11px] text-zinc-500 font-mono">PID: #{item.productId.slice(-6)}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Warehouse */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700/60 text-zinc-300">
                          <Warehouse size={12} className="text-zinc-500" />
                          {item.warehouseName || "ສາງຫຼັກ"}
                        </span>
                      </td>

                      {/* Column 4: Quantity */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.quantity}
                            onChange={(e) => setEditValues({ quantity: e.target.value })}
                            className="w-24 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-right text-emerald-400 font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            autoFocus
                          />
                        ) : (
                          <span
                            className={`font-extrabold font-mono text-base ${
                              isOut ? "text-rose-400" : isLow ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {qty.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Column 5: Health Bar */}
                      <td className="px-5 py-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                            <span>{qty} / {maxCap}</span>
                            <span>{healthPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isOut
                                  ? "bg-rose-500"
                                  : isLow
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.max(healthPercent, 4)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Column 6: Status Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                            isOut
                              ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                              : isLow
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isOut ? "bg-rose-400" : isLow ? "bg-amber-400" : "bg-emerald-400"
                            }`}
                          />
                          {isOut ? "ໝົດສາງ (OUT)" : isLow ? "ໃກ້ໝົດ (LOW)" : "ພ້ອມຂາຍ (OK)"}
                        </span>
                      </td>

                      {/* Column 7: Actions */}
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
                              title="ແກ້ໄຂຈຳນວນ (Edit)"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              onClick={() => setDeleteConfirm(item)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-95"
                              title="ລຶບລາຍການ (Delete)"
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
                <AlertTriangle size={26} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">ຢືນຢັນການລຶບສະຕັອກ</h3>
                <p className="text-zinc-400 text-xs mt-0.5 font-mono">
                  ລະຫັດ: #{deleteConfirm.id.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>ສິນຄ້າ:</span>
                <span className="font-semibold text-white">{deleteConfirm.productName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>ສາງສິນຄ້າ:</span>
                <span className="font-semibold text-zinc-200">{deleteConfirm.warehouseName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>ຈຳນວນໃນຄັງ:</span>
                <span className="font-bold text-amber-400 font-mono">{deleteConfirm.quantity} ຊິ້ນ</span>
              </div>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed">
              ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍການສະຕັອກນີ້? ການກະທຳນີ້ບໍ່ສາມາດຍ້ອນກັບໄດ້.
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
