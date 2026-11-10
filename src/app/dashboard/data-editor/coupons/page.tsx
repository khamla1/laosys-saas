"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Ticket,
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
  Percent,
  Coins,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/excel";
import { PaginationControls } from "@/components/PaginationControls";

const fmt = (n: number) => "₭" + new Intl.NumberFormat("en").format(n || 0);

interface CouponItem {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderVal?: number;
  maxDiscount?: number;
  usageCount?: number;
  isActive: boolean;
  createdAt?: string;
}

export default function EditCouponsPage() {
  const [data, setData] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    code: string;
    type: string;
    value: number | string;
    minOrderVal: number | string;
    maxDiscount: number | string;
    isActive: boolean;
  }>({
    code: "",
    type: "FIXED",
    value: 0,
    minOrderVal: 0,
    maxDiscount: 0,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState<CouponItem | null>(null);

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

        const res = await fetch(`/api/data-editor/coupons?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
          setTotal(json.total || 0);
          if (isManualRefresh) {
            toast.success("ອັບເດດຂໍ້ມູນຄູປອງລ່າສຸດແລ້ວ");
          }
        } else {
          toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນຄູປອງໄດ້");
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
    const totalCoupons = total;
    const activeCount = data.filter((item) => item.isActive).length;
    const totalUsages = data.reduce((sum, item) => sum + (Number(item.usageCount) || 0), 0);
    const percentCount = data.filter((item) => item.type === "PERCENTAGE").length;

    const sampleTotal = Math.max(data.length, 1);
    const activePerc = Math.round((activeCount / sampleTotal) * 100);
    const inactivePerc = 100 - activePerc;

    return {
      totalCoupons,
      activeCount,
      totalUsages,
      percentCount,
      activePerc,
      inactivePerc,
    };
  }, [data, total]);

  // Client-side quick filter
  const filteredData = useMemo(() => {
    if (filterTab === "ACTIVE") return data.filter((item) => item.isActive);
    if (filterTab === "INACTIVE") return data.filter((item) => !item.isActive);
    if (filterTab === "PERCENTAGE") return data.filter((item) => item.type === "PERCENTAGE");
    if (filterTab === "FIXED") return data.filter((item) => item.type === "FIXED");
    return data;
  }, [data, filterTab]);

  const handleEdit = (item: CouponItem) => {
    setEditingId(item.id);
    setEditValues({
      code: item.code || "",
      type: item.type || "FIXED",
      value: item.value || 0,
      minOrderVal: item.minOrderVal || 0,
      maxDiscount: item.maxDiscount || 0,
      isActive: Boolean(item.isActive),
    });
  };

  const handleToggleStatus = async (item: CouponItem) => {
    try {
      const res = await fetch("/api/data-editor/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          updates: { isActive: !item.isActive },
        }),
      });

      if (res.ok) {
        toast.success(`ປ່ຽນສະຖານະຄູປອງ ${item.code} ແລ້ວ`);
        fetchData();
      } else {
        toast.error("ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການປ່ຽນສະຖານະ");
    }
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/data-editor/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          updates: {
            code: editValues.code.trim().toUpperCase(),
            type: editValues.type,
            value: Number(editValues.value) || 0,
            minOrderVal: Number(editValues.minOrderVal) || 0,
            maxDiscount: Number(editValues.maxDiscount) || 0,
            isActive: editValues.isActive,
          },
        }),
      });

      if (res.ok) {
        toast.success("ບັນທຶກການແກ້ໄຂຄູປອງສຳເລັດແລ້ວ");
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
      const res = await fetch(`/api/data-editor/coupons?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("ລຶບຄູປອງອອກຈາກລະບົບຮຽບຮ້ອຍ");
        fetchData();
      } else {
        toast.error("ບໍ່ສາມາດລຶບຄູປອງໄດ້");
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
      filename: `Coupons_Report_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Coupons",
      title: "ລາຍງານຂໍ້ມູນຄູປອງ ແລະ ໂປຣໂມຊັ່ນ (COUPONS REPORT)",
      subtitle: `ລວມທັງໝົດ ${data.length} ລາຍການ | ວັນທີສ້າງ: ${new Date().toLocaleDateString("lo-LA")}`,
      headers: ["ລຳດັບ", "ລະຫັດຄູປອງ", "ປະເພດ", "ມູນຄ່າສ່ວນຫຼຸດ", "ຍອດຊື້ຂັ້ນຕ່ຳ (₭)", "ຫຼຸດສູງສຸດ (₭)", "ໃຊ້ແລ້ວ (ຄັ້ງ)", "ສະຖານະ"],
      data: data.map((item, idx) => [
        idx + 1,
        item.code || "-",
        item.type || "-",
        item.type === "PERCENTAGE" ? `${item.value}%` : Number(item.value).toLocaleString(),
        Number(item.minOrderVal || 0).toLocaleString(),
        Number(item.maxDiscount || 0).toLocaleString(),
        Number(item.usageCount || 0),
        item.isActive ? "ເປີດໃຊ້ງານ (ACTIVE)" : "ປິດໃຊ້ງານ (INACTIVE)",
      ]),
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        `${data.length} ຄູປອງ`,
        "",
        "",
        "",
        "",
        `${data.reduce((sum, c) => sum + (Number(c.usageCount) || 0), 0)} ຄັ້ງ`,
        "",
      ],
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── TOP BANNER & ACTIONS ── */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-48 w-48 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles size={13} />
              <span>ລະບົບຈັດການຂໍ້ມູນຄູປອງ (Data Editor)</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              ແກ້ໄຂຄູປອງ / ໂປຣໂມຊັ່ນ
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-mono">
                {total.toLocaleString()} ລາຍການ
              </span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed">
              ຈັດການ, ຕິດຕາມ ແລະ ດັດແກ້ລະຫັດສ່ວນຫຼຸດ — ປັບປ່ຽນປະເພດສ່ວນຫຼຸດ, ມູນຄ່າ, ຂັ້ນຕ່ຳ ແລະ ເປີດ/ປິດການໃຊ້ງານໄດ້ທັນທີ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-sm font-medium border border-zinc-700/70 hover:border-zinc-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="ໂຫຼດຂໍ້ມູນໃໝ່"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin text-purple-400" : "text-zinc-400"} />
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
              href="/dashboard/coupons"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold shadow-lg shadow-purple-500/20 transition-all active:scale-95"
            >
              <Ticket size={16} />
              <span>ໄປໜ້າໂປຣໂມຊັ່ນ</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Coupons */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຄູປອງທັງໝົດ</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Ticket size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">{stats.totalCoupons.toLocaleString()}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ລະຫັດໂປຣໂມຊັ່ນໃນລະບົບ</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Coupons */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ເປີດໃຊ້ງານຢູ່ (Active)</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {stats.activeCount}{" "}
              <span className="text-sm font-semibold text-zinc-400 font-mono">({stats.activePerc}%)</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, stats.activePerc)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Total Usage Count */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຈຳນວນຄັ້ງທີ່ໃຊ້ແລ້ວ</span>
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Coins size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-pink-400 tracking-tight">{stats.totalUsages.toLocaleString()} <span className="text-sm font-semibold text-zinc-400">ຄັ້ງ</span></div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ລູກຄ້ານຳໃຊ້ສ່ວນຫຼຸດ</span>
            </div>
          </div>
        </div>

        {/* Card 4: Percentage Coupons */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ແບບເປີເຊັນ (%)</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Percent size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">{stats.percentCount} <span className="text-sm font-semibold text-zinc-400">ລາຍການ</span></div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ສ່ວນຫຼຸດຕາມເປີເຊັນຍອດບິນ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── VISUAL COUPONS BREAKDOWN CHART ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl backdrop-blur-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2.5">
              <BarChart3 size={18} className="text-purple-400" />
              <span>ກາບສະແດງສັດສ່ວນຄູປອງ (Visual Coupons Status Chart)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              ສັດສ່ວນຄູປອງທີ່ເປີດໃຊ້ງານຢູ່ (Active) ທຽບກັບຄູປອງທີ່ປິດການໃຊ້ງານ (Inactive)
            </p>
          </div>
          <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-3.5 py-1.5 rounded-full border border-purple-500/20 font-mono">
            {data.length} ລາຍການ (ໜ້ານີ້)
          </span>
        </div>

        {/* Multi-segment visual progress bar */}
        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          <div
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
            style={{ width: `${Math.max(stats.activePerc, 2)}%` }}
            title={`ເປີດໃຊ້ງານ: ${stats.activePerc}%`}
          />
          <div
            className="h-full bg-zinc-600 rounded-r-full transition-all duration-500"
            style={{ width: `${Math.max(stats.inactivePerc, 2)}%` }}
            title={`ປິດໃຊ້ງານ: ${stats.inactivePerc}%`}
          />
        </div>

        {/* 2 Summary metric pills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                ເປີດໃຊ້ງານຢູ່ (ACTIVE)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.activeCount} ຄູປອງ ({stats.activePerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.activePerc)}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-500" />
                ປິດການໃຊ້ງານ (INACTIVE)
              </span>
              <span className="text-white font-bold font-mono">
                {data.length - stats.activeCount} ຄູປອງ ({stats.inactivePerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.inactivePerc)}%` }}
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
            <Filter size={13} /> ຕົວກັ່ນຕອງ:
          </span>
          {[
            { id: "ALL", label: "ທັງໝົດ" },
            { id: "ACTIVE", label: "ເປີດໃຊ້ງານ (Active)" },
            { id: "INACTIVE", label: "ປິດໃຊ້ງານ (Inactive)" },
            { id: "PERCENTAGE", label: "ແບບເປີເຊັນ (%)" },
            { id: "FIXED", label: "ມູນຄ່າຄົງທີ່ (Fixed)" },
          ].map((tab) => {
            const active = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  active
                    ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20"
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
              placeholder="ຄົ້ນຫາລະຫັດຄູປອງ..."
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all uppercase"
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
                className="appearance-none pl-3.5 pr-8 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 hover:border-zinc-700 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
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

      {/* ── COUPONS DATA TABLE ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                <th className="px-5 py-4 font-semibold">ລະຫັດຄູປອງ (Code)</th>
                <th className="px-5 py-4 font-semibold">ປະເພດ (Type)</th>
                <th className="px-5 py-4 font-semibold text-right">ມູນຄ່າສ່ວນຫຼຸດ</th>
                <th className="px-5 py-4 font-semibold text-right">ຍອດຂັ້ນຕ່ຳ</th>
                <th className="px-5 py-4 font-semibold text-right">ຫຼຸດສູງສຸດ</th>
                <th className="px-5 py-4 font-semibold text-center">ໃຊ້ແລ້ວ (ຄັ້ງ)</th>
                <th className="px-5 py-4 font-semibold text-center">ສະຖານະ (1-Click)</th>
                <th className="px-5 py-4 font-semibold text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-purple-500" size={32} />
                    <p className="text-zinc-500 text-sm mt-3 font-medium">ກຳລັງໂຫຼດຂໍ້ມູນຄູປອງ...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-600 mb-3 border border-zinc-700/50">
                      <Ticket size={32} />
                    </div>
                    <p className="text-zinc-300 font-medium">ບໍ່ພົບຂໍ້ມູນຄູປອງທີ່ຄົ້ນຫາ</p>
                    <p className="text-zinc-500 text-xs mt-1">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ລ້າງຕົວກັ່ນຕອງເພື່ອເບິ່ງລາຍການອື່ນ</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const isEditing = editingId === item.id;
                  const isPercent = item.type === "PERCENTAGE";

                  return (
                    <tr
                      key={item.id}
                      className={`group transition-colors ${
                        isEditing
                          ? "bg-purple-500/10 border-l-4 border-l-purple-500"
                          : "hover:bg-zinc-800/40"
                      }`}
                    >
                      {/* Column 1: Code */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.code}
                            onChange={(e) => setEditValues({ ...editValues, code: e.target.value.toUpperCase() })}
                            className="w-32 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono font-bold text-xs focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                            placeholder="ລະຫັດ..."
                            autoFocus
                          />
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 font-mono font-extrabold text-xs tracking-wider">
                            <Ticket size={13} className="text-purple-400" />
                            {item.code}
                          </div>
                        )}
                      </td>

                      {/* Column 2: Type */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editValues.type}
                            onChange={(e) => setEditValues({ ...editValues, type: e.target.value })}
                            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                          >
                            <option value="PERCENTAGE">PERCENTAGE (%)</option>
                            <option value="FIXED">FIXED (₭)</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              isPercent
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {isPercent ? <Percent size={11} /> : <Coins size={11} />}
                            {item.type}
                          </span>
                        )}
                      </td>

                      {/* Column 3: Discount Value */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.value}
                            onChange={(e) => setEditValues({ ...editValues, value: e.target.value })}
                            className="w-24 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-right text-emerald-400 font-mono font-bold text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                          />
                        ) : (
                          <span className="font-extrabold text-emerald-400 font-mono text-sm">
                            {isPercent ? `${item.value}%` : fmt(item.value)}
                          </span>
                        )}
                      </td>

                      {/* Column 4: Min Order Value */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.minOrderVal}
                            onChange={(e) => setEditValues({ ...editValues, minOrderVal: e.target.value })}
                            className="w-28 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-right text-zinc-200 font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                          />
                        ) : (
                          <span className="font-mono text-zinc-300 text-xs">
                            {fmt(item.minOrderVal || 0)}
                          </span>
                        )}
                      </td>

                      {/* Column 5: Max Discount */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.maxDiscount}
                            onChange={(e) => setEditValues({ ...editValues, maxDiscount: e.target.value })}
                            className="w-28 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-right text-zinc-200 font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                          />
                        ) : (
                          <span className="font-mono text-zinc-300 text-xs">
                            {Number(item.maxDiscount) > 0 ? fmt(item.maxDiscount!) : "ບໍ່ຈຳກັດ"}
                          </span>
                        )}
                      </td>

                      {/* Column 6: Usage Count */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-zinc-800 text-zinc-200 border border-zinc-700/60">
                          {Number(item.usageCount) || 0}
                        </span>
                      </td>

                      {/* Column 7: Status Toggle */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                            item.isActive
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700/60 hover:bg-zinc-750"
                          }`}
                          title="ຄລິກເພື່ອປ່ຽນສະຖານະ"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.isActive ? "bg-emerald-400" : "bg-zinc-500"
                            }`}
                          />
                          {item.isActive ? "ເປີດໃຊ້ງານ" : "ປິດໃຊ້ງານ"}
                        </button>
                      </td>

                      {/* Column 8: Actions */}
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
                              className="p-2 rounded-xl text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-all active:scale-95"
                              title="ແກ້ໄຂຂໍ້ມູນ (Edit)"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              onClick={() => setDeleteConfirm(item)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-95"
                              title="ລຶບຄູປອງ (Delete)"
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
                <h3 className="text-lg font-bold text-white">ຢືນຢັນການລຶບຄູປອງ</h3>
                <p className="text-zinc-400 text-xs mt-0.5 font-mono">
                  ລະຫັດ: {deleteConfirm.code}
                </p>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>ປະເພດສ່ວນຫຼຸດ:</span>
                <span className="font-semibold text-white">{deleteConfirm.type}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>ມູນຄ່າ:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {deleteConfirm.type === "PERCENTAGE" ? `${deleteConfirm.value}%` : fmt(deleteConfirm.value)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>ຈຳນວນທີ່ໃຊ້ແລ້ວ:</span>
                <span className="font-semibold text-zinc-200">{deleteConfirm.usageCount || 0} ຄັ້ງ</span>
              </div>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed">
              ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຄູປອງນີ້? ລູກຄ້າຈະບໍ່ສາມາດນຳໃຊ້ລະຫັດນີ້ໄດ້ອີກຕໍ່ໄປ.
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
