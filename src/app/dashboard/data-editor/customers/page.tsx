"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Pencil,
  Check,
  X,
  Loader2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  UserCheck,
  UserPlus,
  SlidersHorizontal,
  Filter,
  BarChart3,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/excel";
import { PaginationControls } from "@/components/PaginationControls";

interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  orderCount?: number;
}

export default function EditCustomersPage() {
  const [data, setData] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    name: string;
    phone: string;
    email: string;
    address: string;
  }>({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
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

        const res = await fetch(`/api/data-editor/customers?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
          setTotal(json.total || 0);
          if (isManualRefresh) {
            toast.success("ອັບເດດຂໍ້ມູນລູກຄ້າລ່າສຸດແລ້ວ");
          }
        } else {
          toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນລູກຄ້າໄດ້");
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
    const totalCustomers = total;
    const totalOrders = data.reduce((sum, item) => sum + (Number(item.orderCount) || 0), 0);
    const repeatBuyers = data.filter((item) => Number(item.orderCount) > 1).length;
    const newBuyers = data.filter((item) => Number(item.orderCount) <= 1).length;

    const sampleTotal = Math.max(data.length, 1);
    const repeatPerc = Math.round((repeatBuyers / sampleTotal) * 100);
    const newPerc = Math.round((newBuyers / sampleTotal) * 100);

    return {
      totalCustomers,
      totalOrders,
      repeatBuyers,
      newBuyers,
      repeatPerc,
      newPerc,
    };
  }, [data, total]);

  // Client-side Filter
  const filteredData = useMemo(() => {
    if (tierFilter === "REPEAT") {
      return data.filter((item) => Number(item.orderCount) > 1);
    }
    if (tierFilter === "NEW") {
      return data.filter((item) => Number(item.orderCount) <= 1);
    }
    return data;
  }, [data, tierFilter]);

  const handleEdit = (item: CustomerItem) => {
    setEditingId(item.id);
    setEditValues({
      name: item.name || "",
      phone: item.phone || "",
      email: item.email || "",
      address: item.address || "",
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/data-editor/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          updates: {
            name: editValues.name.trim(),
            phone: editValues.phone.trim(),
            email: editValues.email.trim(),
            address: editValues.address.trim(),
          },
        }),
      });

      if (res.ok) {
        toast.success("ບັນທຶກການແກ້ໄຂຂໍ້ມູນລູກຄ້າສຳເລັດແລ້ວ");
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

  const totalPages = Math.ceil(total / limit);

  const handleExportExcel = () => {
    exportToExcel({
      filename: `Customers_Report_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Customers",
      title: "ລາຍງານຂໍ້ມູນລູກຄ້າທັງໝົດ (CUSTOMERS DIRECTORY REPORT)",
      subtitle: `ລວມທັງໝົດ ${data.length} ຄົນ | ວັນທີສ້າງ: ${new Date().toLocaleDateString("lo-LA")}`,
      headers: ["ລຳດັບ", "ຊື່ລູກຄ້າ", "ເບີໂທລະສັບ", "ອີເມລ", "ທີ່ຢູ່", "ຈຳນວນອໍເດີ (ຄັ້ງ)", "ສະຖານະສະມາຊິກ"],
      data: data.map((item, idx) => [
        idx + 1,
        item.name || "ລູກຄ້າທົ່ວໄປ",
        item.phone || "-",
        item.email || "-",
        item.address || "-",
        item.orderCount || 0,
        Number(item.orderCount) > 1 ? "ລູກຄ້າປະຈຳ (VIP / LOYAL)" : "ລູກຄ້າໃໝ່ (NEW)",
      ]),
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        `${data.length} ຄົນ`,
        "",
        "",
        "",
        `${data.reduce((sum, c) => sum + (Number(c.orderCount) || 0), 0)} ອໍເດີ`,
        "",
      ],
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── TOP BANNER & ACTIONS ── */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles size={13} />
              <span>ລະບົບຈັດການຂໍ້ມູນລູກຄ້າ (Data Editor)</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              ແກ້ໄຂຂໍ້ມູນລູກຄ້າ
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-mono">
                {total.toLocaleString()} ຄົນ
              </span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed">
              ຈັດການ, ຕິດຕາມ ແລະ ດັດແກ້ຂໍ້ມູນລາຍລະອຽດລູກຄ້າ — ແກ້ໄຂຊື່, ເບີໂທລະສັບ, ອີເມລ, ທີ່ຢູ່ ແລະ ປະຫວັດການສັ່ງຊື້ໄດ້ທັນທີ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-sm font-medium border border-zinc-700/70 hover:border-zinc-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="ໂຫຼດຂໍ້ມູນໃໝ່"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin text-cyan-400" : "text-zinc-400"} />
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
              href="/dashboard/customers"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <Users size={16} />
              <span>ໄປໜ້າຈັດການ CRM</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Customers */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ລູກຄ້າທັງໝົດ</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">{stats.totalCustomers.toLocaleString()}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ຖານຂໍ້ມູນລູກຄ້າໃນລະບົບ</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders by Customers */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຍອດອໍເດີລວມ (ໜ້ານີ້)</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-blue-400 tracking-tight">{stats.totalOrders.toLocaleString()} <span className="text-sm font-semibold text-zinc-400">ອໍເດີ</span></div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ປະຫວັດການສັ່ງຊື້ສະສົມ</span>
            </div>
          </div>
        </div>

        {/* Card 3: Repeat Buyers */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ລູກຄ້າປະຈຳ (&gt; 1 ອໍເດີ)</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.repeatBuyers}{" "}
              <span className="text-sm font-semibold text-emerald-400 font-mono">({stats.repeatPerc}%)</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, stats.repeatPerc)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: New Buyers */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ລູກຄ້າໃໝ່ (1 ອໍເດີ)</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <UserPlus size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {stats.newBuyers}{" "}
              <span className="text-sm font-semibold text-zinc-400 font-mono">({stats.newPerc}%)</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ລູກຄ້າທີ່ເລີ່ມຊື້ຄັ້ງທຳອິດ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── VISUAL CUSTOMER LOYALTY CHART ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl backdrop-blur-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2.5">
              <BarChart3 size={18} className="text-cyan-400" />
              <span>ກາບສະແດງສັດສ່ວນລູກຄ້າ (Visual Customer Loyalty Breakdown)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              ສັດສ່ວນລູກຄ້າປະຈຳ (Repeat Buyers) ທຽບກັບລູກຄ້າໃໝ່ (First-time Buyers)
            </p>
          </div>
          <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-3.5 py-1.5 rounded-full border border-cyan-500/20 font-mono">
            {data.length} ຄົນ (ໜ້ານີ້)
          </span>
        </div>

        {/* Multi-segment visual progress bar */}
        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          <div
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
            style={{ width: `${Math.max(stats.repeatPerc, 2)}%` }}
            title={`ລູກຄ້າປະຈຳ: ${stats.repeatPerc}%`}
          />
          <div
            className="h-full bg-cyan-500 rounded-r-full transition-all duration-500"
            style={{ width: `${Math.max(stats.newPerc, 2)}%` }}
            title={`ລູກຄ້າໃໝ່: ${stats.newPerc}%`}
          />
        </div>

        {/* 2 Summary metric pills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                ລູກຄ້າປະຈຳ (Repeat Buyers &gt; 1 ອໍເດີ)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.repeatBuyers} ຄົນ ({stats.repeatPerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.repeatPerc)}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                ລູກຄ້າໃໝ່ (New / First-time 1 ອໍເດີ)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.newBuyers} ຄົນ ({stats.newPerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.newPerc)}%` }}
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
            <Filter size={13} /> ປະເພດລູກຄ້າ:
          </span>
          {[
            { id: "ALL", label: "ທັງໝົດ" },
            { id: "REPEAT", label: "ລູກຄ້າປະຈຳ (> 1 ອໍເດີ)" },
            { id: "NEW", label: "ລູກຄ້າໃໝ່ (1 ອໍເດີ)" },
          ].map((tab) => {
            const active = tierFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTierFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  active
                    ? "bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-500/20"
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
              placeholder="ຄົ້ນຫາຊື່ລູກຄ້າ ຫຼື ເບີໂທລະສັບ..."
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
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
                className="appearance-none pl-3.5 pr-8 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 hover:border-zinc-700 focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer"
              >
                <option value={20}>20 ຄົນ / ໜ້າ</option>
                <option value={50}>50 ຄົນ / ໜ້າ</option>
                <option value={100}>100 ຄົນ / ໜ້າ</option>
              </select>
              <SlidersHorizontal size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── CUSTOMERS DATA TABLE ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                <th className="px-5 py-4 font-semibold">ລູກຄ້າ (Customer)</th>
                <th className="px-5 py-4 font-semibold">ເບີໂທລະສັບ (Phone)</th>
                <th className="px-5 py-4 font-semibold">ອີເມລ (Email)</th>
                <th className="px-5 py-4 font-semibold">ທີ່ຢູ່ (Address)</th>
                <th className="px-5 py-4 font-semibold text-center">ຈຳນວນອໍເດີ</th>
                <th className="px-5 py-4 font-semibold">ສະຖານະສະມາຊິກ</th>
                <th className="px-5 py-4 font-semibold text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-cyan-500" size={32} />
                    <p className="text-zinc-500 text-sm mt-3 font-medium">ກຳລັງໂຫຼດຂໍ້ມູນລູກຄ້າ...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-600 mb-3 border border-zinc-700/50">
                      <Users size={32} />
                    </div>
                    <p className="text-zinc-300 font-medium">ບໍ່ພົບຂໍ້ມູນລູກຄ້າທີ່ຄົ້ນຫາ</p>
                    <p className="text-zinc-500 text-xs mt-1">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ລ້າງຕົວກັ່ນຕອງເພື່ອເບິ່ງລາຍການອື່ນ</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const isEditing = editingId === item.id;
                  const orders = Number(item.orderCount) || 0;
                  const isLoyal = orders > 1;

                  return (
                    <tr
                      key={item.id}
                      className={`group transition-colors ${
                        isEditing
                          ? "bg-cyan-500/10 border-l-4 border-l-cyan-500"
                          : "hover:bg-zinc-800/40"
                      }`}
                    >
                      {/* Column 1: Customer Name */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.name}
                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="ຊື່ລູກຄ້າ..."
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                              {item.name ? item.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-200">{item.name || "ລູກຄ້າທົ່ວໄປ"}</p>
                              {item.phone && (
                                <p className="text-[11px] text-zinc-500 font-mono">ID: {item.phone}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Column 2: Phone */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.phone}
                            onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                            className="w-36 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none font-mono"
                            placeholder="ເບີໂທ..."
                          />
                        ) : item.phone ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300 font-mono">
                            <Phone size={12} className="text-zinc-500" />
                            {item.phone}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Column 3: Email */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="email"
                            value={editValues.email}
                            onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                            className="w-48 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="ອີເມລ..."
                          />
                        ) : item.email ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300">
                            <Mail size={12} className="text-zinc-500" />
                            {item.email}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Column 4: Address */}
                      <td className="px-5 py-4 max-w-[200px]">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.address}
                            onChange={(e) => setEditValues({ ...editValues, address: e.target.value })}
                            className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="ທີ່ຢູ່..."
                          />
                        ) : item.address ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 truncate">
                            <MapPin size={12} className="text-zinc-500 shrink-0" />
                            <span className="truncate">{item.address}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Column 5: Orders Count */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-zinc-800 text-zinc-200 border border-zinc-700/60">
                          <ShoppingBag size={11} className="text-cyan-400" />
                          {orders}
                        </span>
                      </td>

                      {/* Column 6: Tier Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                            isLoyal
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {isLoyal ? <Award size={12} /> : <UserPlus size={12} />}
                          {isLoyal ? "ລູກຄ້າປະຈຳ (VIP)" : "ລູກຄ້າໃໝ່ (NEW)"}
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
                              className="p-2 rounded-xl text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all active:scale-95"
                              title="ແກ້ໄຂຂໍ້ມູນ (Edit)"
                            >
                              <Pencil size={15} />
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
    </div>
  );
}
