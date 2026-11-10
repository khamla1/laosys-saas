"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Pencil,
  Check,
  X,
  Loader2,
  Trash2,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  BarChart3,
  Filter,
  Layers,
  Box,
  ArrowUpRight,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/excel";
import { PaginationControls } from "@/components/PaginationControls";

const fmt = (n: number) => "₭" + new Intl.NumberFormat("en").format(n || 0);

interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export default function EditProductsPage() {
  const [data, setData] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    name: string;
    category: string;
    price: string | number;
    stock: string | number;
    status: string;
  }>({
    name: "",
    category: "",
    price: 0,
    stock: 0,
    status: "ACTIVE",
  });
  const [saving, setSaving] = useState(false);

  // Search & Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState<ProductItem | null>(null);

  // Image load error tracking
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

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

        const res = await fetch(`/api/data-editor/products?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
          setTotal(json.total || 0);
          if (isManualRefresh) {
            toast.success("ອັບເດດຂໍ້ມູນສິນຄ້າລ່າສຸດແລ້ວ");
          }
        } else {
          setData([]);
          setTotal(0);
          toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນສິນຄ້າໄດ້");
        }
      } catch {
        setData([]);
        setTotal(0);
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
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

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    data.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [data]);

  // Filtered by Category locally if selected
  const displayData = useMemo(() => {
    if (selectedCategory === "ALL") return data;
    return data.filter((p) => (p.category || "").trim() === selectedCategory);
  }, [data, selectedCategory]);

  // Statistics
  const activeCount = useMemo(() => data.filter((p) => p.status === "ACTIVE").length, [data]);
  const inactiveCount = useMemo(() => data.filter((p) => p.status !== "ACTIVE").length, [data]);
  const lowStockCount = useMemo(() => data.filter((p) => (p.stock || 0) <= 10).length, [data]);
  const totalStockValue = useMemo(
    () => data.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0), 0),
    [data]
  );
  const activePercentage = data.length > 0 ? Math.round((activeCount / data.length) * 100) : 0;

  const handleEdit = (item: ProductItem) => {
    setEditingId(item.id);
    setEditValues({
      name: item.name || "",
      category: item.category || "",
      price: item.price ?? 0,
      stock: item.stock ?? 0,
      status: item.status || "ACTIVE",
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    if (!editValues.name.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ສິນຄ້າ");
    }

    setSaving(true);
    try {
      const res = await fetch("/api/data-editor/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          updates: {
            name: editValues.name.trim(),
            category: editValues.category.trim(),
            price: Number(editValues.price) || 0,
            stock: Number(editValues.stock) || 0,
            status: editValues.status,
          },
        }),
      });

      if (res.ok) {
        toast.success("ບັນທຶກການແກ້ໄຂສິນຄ້າສຳເລັດແລ້ວ!");
        setEditingId(null);
        fetchData();
      } else {
        const e = await res.json();
        toast.error(e.error || "ບັນທຶກບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
    } finally {
      setSaving(false);
    }
  };

  // Quick 1-click status toggle directly from row
  const handleQuickToggleStatus = async (item: ProductItem) => {
    const newStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch("/api/data-editor/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          updates: { status: newStatus },
        }),
      });

      if (res.ok) {
        toast.success(
          `ປ່ຽນສະຖານະ "${item.name}" ເປັນ ${newStatus === "ACTIVE" ? "ເປີດຂາຍ (Active)" : "ປິດການຂາຍ (Inactive)"} ແລ້ວ`
        );
        setData((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: newStatus } : p))
        );
      } else {
        toast.error("ປ່ຽນສະຖານະບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການປ່ຽນສະຖານະ");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/data-editor/products?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("ລຶບສິນຄ້າອອກຈາກລະບົບສຳເລັດແລ້ວ");
        fetchData();
      } else {
        toast.error("ລຶບສິນຄ້າບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບ");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleExportExcel = () => {
    if (data.length === 0) {
      return toast.error("ບໍ່ມີຂໍ້ມູນສິນຄ້າສຳລັບດາວໂຫຼດ");
    }

    exportToExcel({
      filename: "Products_Data_Report",
      sheetName: "ສິນຄ້າ",
      title: "ລາຍງານຂໍ້ມູນສິນຄ້າໃນຮ້ານ (PRODUCTS INVENTORY REPORT)",
      subtitle: `ລວມທັງໝົດ ${data.length} ລາຍການ | ມູນຄ່າສະຕັອກ: ₭${totalStockValue.toLocaleString()}`,
      headers: ["ລຳດັບ", "ຊື່ສິນຄ້າ", "ໝວດໝູ່", "ລາຄາຂາຍ (₭)", "ສະຕັອກ (ຊິ້ນ)", "ສະຖານະ"],
      data: data.map((p, idx) => [
        idx + 1,
        p.name || "-",
        p.category || "-",
        p.price ? Number(p.price).toLocaleString() : "0",
        p.stock !== undefined ? p.stock : 0,
        p.status || "-",
      ]),
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        "",
        "",
        `₭${data.reduce((sum, p) => sum + (Number(p.price) || 0), 0).toLocaleString()}`,
        `${data.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)} ຊິ້ນ`,
        "",
      ],
    });
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30">
      {/* ── TOP HEADER BANNER ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-950 p-6 md:p-8 rounded-3xl border border-zinc-800/80 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  ແກ້ໄຂສິນຄ້າ ແລະ ລາຄາ
                </h1>
                <span className="text-xs text-zinc-400 font-medium">
                  (Products & Inventory Price Editor)
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800/80 text-zinc-300 border border-zinc-700">
                {total} ລາຍການ
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              ຈັດການຂໍ້ມູນ, ປັບປຸງລາຄາຂາຍ, ອັບເດດສະຕັອກຄັງ ແລະ ເປີດ/ປິດການຂາຍສິນຄ້າໄດ້ຢ່າງວ່ອງໄວໃນໜ້າດຽວ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="h-10 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
              title="ຣີເຟຣຊຂໍ້ມູນ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
              <span>ຣີເຟຣຊ</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="h-10 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-950/40"
              title="ດາວໂຫຼດລາຍງານ Excel"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>ດາວໂຫຼດ Excel</span>
            </button>

            <Link
              href="/dashboard/products/create"
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>ເພີ່ມສິນຄ້າໃໝ່</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI METRIC SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {/* Total Products */}
        <div className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 transition-all shadow-md relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400">ສິນຄ້າທັງໝົດ</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {total} <span className="text-xs font-normal text-zinc-500">ລາຍການ</span>
          </h3>
          <p className="text-[11px] text-zinc-500 mt-1">ລວມທຸກໝວດໝູ່ໃນຮ້ານ</p>
        </div>

        {/* Total Inventory Value */}
        <div className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 transition-all shadow-md relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-400">ມູນຄ່າສະຕັອກລວມ</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight truncate">
            ₭{totalStockValue.toLocaleString()}
          </h3>
          <p className="text-[11px] text-zinc-500 mt-1">ຄິດໄລ່ຈາກ (ລາຄາ x ສະຕັອກ)</p>
        </div>

        {/* Active Products */}
        <div className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 transition-all shadow-md relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-teal-400">ເປີດຂາຍຢູ່ (Active)</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {activeCount} <span className="text-xs font-normal text-zinc-500">ລາຍການ</span>
          </h3>
          <p className="text-[11px] text-teal-400/80 mt-1">{activePercentage}% ຂອງສິນຄ້າພ້ອມຂາຍ</p>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 transition-all shadow-md relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-400">ສະຕັອກໜ້ອຍ (&le; 10)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {lowStockCount} <span className="text-xs font-normal text-zinc-500">ລາຍການ</span>
          </h3>
          <p className="text-[11px] text-zinc-500 mt-1">
            {lowStockCount > 0 ? "ຄວນສັ່ງຊື້ສິນຄ້າເພີ່ມ" : "ສະຕັອກຢູ່ໃນເກນປົກກະຕິ"}
          </p>
        </div>
      </div>

      {/* ── VISUAL HEALTH & BREAKDOWN PROGRESS BAR ── */}
      <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              ສະຫຼຸບສະຖານະ ແລະ ລະດັບສິນຄ້າໃນຄັງ (Inventory Health Overview)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              ສັດສ່ວນສິນຄ້າເປີດຂາຍ (Active), ປິດການຂາຍ (Inactive) ແລະ ລະດັບສະຕັອກໃນຮ້ານ
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {activeCount} / {data.length} ເປີດຂາຍຢູ່ ({activePercentage}%)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Active Status Progress */}
          <div className="bg-zinc-950/70 border border-zinc-800/70 p-4 rounded-xl space-y-2.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                ເປີດຂາຍຢູ່ (ACTIVE)
              </span>
              <span className="text-white font-black">
                {activeCount} ລາຍການ ({activePercentage}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-zinc-800/80 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${Math.max(4, activePercentage)}%` }}
              />
            </div>
          </div>

          {/* Inactive Status Progress */}
          <div className="bg-zinc-950/70 border border-zinc-800/70 p-4 rounded-xl space-y-2.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                ປິດການຂາຍ (INACTIVE)
              </span>
              <span className="text-white font-black">
                {inactiveCount} ລາຍການ ({100 - activePercentage}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-zinc-800/80 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-zinc-600 rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${Math.max(4, 100 - activePercentage)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── FAST TABS, SEARCH & FILTER CONTROLS ── */}
      <div className="space-y-3.5">
        {/* Fast Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { id: "ALL", label: "ທັງໝົດ", count: total },
            { id: "ACTIVE", label: "ເປີດຂາຍ (Active)", count: activeCount },
            { id: "INACTIVE", label: "ປິດການຂາຍ (Inactive)", count: inactiveCount },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40"
                    : "bg-zinc-900/80 text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Dropdowns */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ, ລາຍລະອຽດ..."
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all shadow-inner"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
            >
              <option value="ALL">ທຸກໝວດໝູ່ ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Rows Per Page */}
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value={10}>10 ແຖວ/ໜ້າ</option>
            <option value={20}>20 ແຖວ/ໜ້າ</option>
            <option value={50}>50 ແຖວ/ໜ້າ</option>
            <option value={100}>100 ແຖວ/ໜ້າ</option>
          </select>
        </div>
      </div>

      {/* ── PRODUCTS TABLE (ELEGANT & SLEEK) ── */}
      <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 text-xs font-extrabold uppercase tracking-wider">
                <th className="py-4 px-4 w-16 text-center">ຮູບ</th>
                <th className="py-4 px-4 min-w-[220px]">ຊື່ສິນຄ້າ (Product Name)</th>
                <th className="py-4 px-4 min-w-[140px]">ໝວດໝູ່ (Category)</th>
                <th className="py-4 px-4 text-right min-w-[140px]">ລາຄາຂາຍ (Price)</th>
                <th className="py-4 px-4 text-center min-w-[130px]">ສະຕັອກ (Stock)</th>
                <th className="py-4 px-4 text-center min-w-[130px]">ສະຖານະ (Status)</th>
                <th className="py-4 px-4 text-center w-28">ຈັດການ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
                    <p className="text-xs text-zinc-400">ກຳລັງໂຫຼດຂໍ້ມູນສິນຄ້າ...</p>
                  </td>
                </tr>
              ) : displayData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto mb-3 text-zinc-500">
                      <Box className="w-7 h-7 text-zinc-400" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">ບໍ່ພົບລາຍການສິນຄ້າ</h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      {search ? `ບໍ່ມີສິນຄ້າທີ່ກົງກັບ "${search}"` : "ຍັງບໍ່ມີຂໍ້ມູນສິນຄ້າໃນລະບົບ"}
                    </p>
                  </td>
                </tr>
              ) : (
                displayData.map((item) => {
                  const isEditing = editingId === item.id;
                  const stock = Number(item.stock) || 0;
                  const hasImage = item.images && item.images[0] && !imageErrors[item.id];

                  return (
                    <tr
                      key={item.id}
                      className={`transition-all duration-200 ${
                        isEditing
                          ? "bg-blue-950/20 border-y-2 border-blue-500/50"
                          : "hover:bg-zinc-800/30"
                      }`}
                    >
                      {/* Product Thumbnail */}
                      <td className="py-3 px-4 text-center">
                        <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 overflow-hidden flex items-center justify-center relative shrink-0 shadow-sm mx-auto">
                          {hasImage ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.images![0]}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={() => setImageErrors((prev) => ({ ...prev, [item.id]: true }))}
                            />
                          ) : (
                            <Box className="w-5 h-5 text-zinc-500" />
                          )}
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.name}
                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-zinc-950 border border-blue-500/80 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="ຊື່ສິນຄ້າ"
                            autoFocus
                          />
                        ) : (
                          <div className="space-y-0.5">
                            <span className="font-bold text-white text-sm leading-tight block">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              ID: #{item.id.slice(-6)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.category}
                            onChange={(e) =>
                              setEditValues({ ...editValues, category: e.target.value })
                            }
                            className="w-full px-3 py-1.5 bg-zinc-950 border border-blue-500/80 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="ໝວດໝູ່"
                          />
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/70">
                            {item.category || "ທົ່ວໄປ"}
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={editValues.price}
                            onChange={(e) =>
                              setEditValues({ ...editValues, price: e.target.value })
                            }
                            className="w-32 px-3 py-1.5 bg-zinc-950 border border-blue-500/80 rounded-xl text-emerald-400 font-bold text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        ) : (
                          <span className="font-black text-emerald-400 text-sm">
                            {fmt(item.price)}
                          </span>
                        )}
                      </td>

                      {/* Stock Badge */}
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editValues.stock}
                            onChange={(e) =>
                              setEditValues({ ...editValues, stock: e.target.value })
                            }
                            className="w-24 px-3 py-1.5 bg-zinc-950 border border-blue-500/80 rounded-xl text-white font-bold text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        ) : stock > 20 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {stock} ຊິ້ນ
                          </span>
                        ) : stock > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            ເຫຼືອ {stock} ຊິ້ນ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            ໝົດສະຕັອກ
                          </span>
                        )}
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <select
                            value={editValues.status}
                            onChange={(e) =>
                              setEditValues({ ...editValues, status: e.target.value })
                            }
                            className="px-2.5 py-1.5 bg-zinc-950 border border-blue-500/80 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                          </select>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickToggleStatus(item)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${
                              item.status === "ACTIVE"
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white"
                            }`}
                            title="ກົດເພື່ອເປີດ/ປິດການຂາຍທັນທີ"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                item.status === "ACTIVE" ? "bg-emerald-400" : "bg-zinc-500"
                              }`}
                            />
                            <span>{item.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleSave}
                              disabled={saving}
                              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95"
                              title="ບັນທຶກ (Save)"
                            >
                              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-95"
                              title="ຍົກເລີກ (Cancel)"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-blue-600 hover:text-white text-zinc-400 transition-all active:scale-95 shadow-sm"
                              title="ແກ້ໄຂດ່ວນ"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(item)}
                              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-red-600 hover:text-white text-zinc-400 transition-all active:scale-95 shadow-sm"
                              title="ລຶບສິນຄ້າ"
                            >
                              <Trash2 size={14} />
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
        <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-950/40">
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

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">ຢືນຢັນການລຶບສິນຄ້າ</h3>
                <p className="text-xs text-zinc-400 mt-0.5">ການດຳເນີນການນີ້ບໍ່ສາມາດຍົກເລີກໄດ້</p>
              </div>
            </div>

            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800/80">
              <span className="text-xs text-zinc-400">ຊື່ສິນຄ້າ:</span>
              <p className="text-sm font-bold text-white mt-0.5 truncate">{deleteConfirm.name}</p>
              <span className="text-xs text-emerald-400 font-mono mt-1 block">
                {fmt(deleteConfirm.price)}
              </span>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-950/40 transition-all"
              >
                ຢືນຢັນລຶບ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
