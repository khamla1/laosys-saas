"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Truck,
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
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Contact,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/excel";
import { PaginationControls } from "@/components/PaginationControls";

interface SupplierItem {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export default function EditSuppliersPage() {
  const [data, setData] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    name: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
  }>({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState<SupplierItem | null>(null);

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

        const res = await fetch(`/api/data-editor/suppliers?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
          setTotal(json.total || 0);
          if (isManualRefresh) {
            toast.success("ອັບເດດຂໍ້ມູນຜູ້ສະໜອງລ່າສຸດແລ້ວ");
          }
        } else {
          toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນຜູ້ສະໜອງໄດ້");
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
    const totalSuppliers = total;
    const withPhone = data.filter((item) => Boolean(item.phone && item.phone.trim())).length;
    const withEmail = data.filter((item) => Boolean(item.email && item.email.trim())).length;
    const withAddress = data.filter((item) => Boolean(item.address && item.address.trim())).length;

    const sampleTotal = Math.max(data.length, 1);
    const phonePerc = Math.round((withPhone / sampleTotal) * 100);
    const emailPerc = Math.round((withEmail / sampleTotal) * 100);
    const addressPerc = Math.round((withAddress / sampleTotal) * 100);

    return {
      totalSuppliers,
      withPhone,
      withEmail,
      withAddress,
      phonePerc,
      emailPerc,
      addressPerc,
    };
  }, [data, total]);

  const handleEdit = (item: SupplierItem) => {
    setEditingId(item.id);
    setEditValues({
      name: item.name || "",
      contactName: item.contactName || "",
      email: item.email || "",
      phone: item.phone || "",
      address: item.address || "",
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/data-editor/suppliers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          updates: {
            name: editValues.name.trim(),
            contactName: editValues.contactName.trim() || null,
            email: editValues.email.trim() || null,
            phone: editValues.phone.trim() || null,
            address: editValues.address.trim() || null,
          },
        }),
      });

      if (res.ok) {
        toast.success("ບັນທຶກການແກ້ໄຂຂໍ້ມູນຜູ້ສະໜອງສຳເລັດແລ້ວ");
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
      const res = await fetch(`/api/data-editor/suppliers?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("ລຶບຜູ້ສະໜອງອອກຈາກລະບົບຮຽບຮ້ອຍ");
        fetchData();
      } else {
        toast.error("ບໍ່ສາມາດລຶບຜູ້ສະໜອງໄດ້");
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
      filename: `Suppliers_Report_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Suppliers",
      title: "ລາຍງານຂໍ້ມູນຜູ້ສະໜອງສິນຄ້າທັງໝົດ (SUPPLIERS DIRECTORY REPORT)",
      subtitle: `ລວມທັງໝົດ ${data.length} ບໍລິສັດ | ວັນທີສ້າງ: ${new Date().toLocaleDateString("lo-LA")}`,
      headers: ["ລຳດັບ", "ຊື່ບໍລິສັດຜູ້ສະໜອງ", "ຜູ້ຕິດຕໍ່ປະສານງານ", "ອີເມລ", "ເບີໂທລະສັບ", "ທີ່ຢູ່"],
      data: data.map((item, idx) => [
        idx + 1,
        item.name || "-",
        item.contactName || "-",
        item.email || "-",
        item.phone || "-",
        item.address || "-",
      ]),
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        `${data.length} ບໍລິສັດ`,
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
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles size={13} />
              <span>ລະບົບຈັດການຂໍ້ມູນຜູ້ສະໜອງ (Data Editor)</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              ແກ້ໄຂຂໍ້ມູນຜູ້ສະໜອງ
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-mono">
                {total.toLocaleString()} ບໍລິສັດ
              </span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed">
              ຈັດການ, ຕິດຕາມ ແລະ ດັດແກ້ຂໍ້ມູນບໍລິສັດຄູ່ຄ້າ ແລະ ຜູ້ສະໜອງ — ແກ້ໄຂຊື່ບໍລິສັດ, ຜູ້ຕິດຕໍ່, ເບີໂທ, ອີເມລ ແລະ ທີ່ຢູ່ໄດ້ທັນທີ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-sm font-medium border border-zinc-700/70 hover:border-zinc-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="ໂຫຼດຂໍ້ມູນໃໝ່"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin text-amber-400" : "text-zinc-400"} />
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
              href="/dashboard/inventory/suppliers"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-semibold shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Truck size={16} />
              <span>ໄປໜ້າຈັດການຜູ້ສະໜອງ</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Suppliers */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຜູ້ສະໜອງທັງໝົດ</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Building2 size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">{stats.totalSuppliers.toLocaleString()}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span>ບໍລິສັດຄູ່ຄ້າໃນລະບົບ</span>
            </div>
          </div>
        </div>

        {/* Card 2: With Phone */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ມີເບີໂທລະສັບ</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Phone size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {stats.withPhone}{" "}
              <span className="text-sm font-semibold text-zinc-400 font-mono">({stats.phonePerc}%)</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, stats.phonePerc)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: With Email */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ມີອີເມລຕິດຕໍ່</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Mail size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-blue-400 tracking-tight">
              {stats.withEmail}{" "}
              <span className="text-sm font-semibold text-zinc-400 font-mono">({stats.emailPerc}%)</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, stats.emailPerc)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: With Address */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ມີທີ່ຢູ່ລະບຸ</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <MapPin size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-purple-400 tracking-tight">
              {stats.withAddress}{" "}
              <span className="text-sm font-semibold text-zinc-400 font-mono">({stats.addressPerc}%)</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, stats.addressPerc)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── VISUAL DATA COMPLETENESS CHART ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl backdrop-blur-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2.5">
              <BarChart3 size={18} className="text-amber-400" />
              <span>ກາບສະແດງຄວາມສົມບູນຂອງຂໍ້ມູນຜູ້ສະໜອງ (Data Completeness Overview)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              ສັດສ່ວນຄວາມຄົບຖ້ວນຂອງຊ່ອງທາງຕິດຕໍ່: ເບີໂທລະສັບ, ອີເມລ, ແລະ ທີ່ຢູ່ບໍລິສັດ
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/20 font-mono">
            {data.length} ບໍລິສັດ (ໜ້ານີ້)
          </span>
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                ມີເບີໂທລະສັບ (Phone)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.withPhone} / {data.length} ({stats.phonePerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.phonePerc)}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                ມີອີເມລ (Email)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.withEmail} / {data.length} ({stats.emailPerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.emailPerc)}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-purple-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-400" />
                ມີທີ່ຢູ່ລະບຸ (Address)
              </span>
              <span className="text-white font-bold font-mono">
                {stats.withAddress} / {data.length} ({stats.addressPerc}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, stats.addressPerc)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH & CONTROLS ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm">
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
              placeholder="ຄົ້ນຫາຊື່ບໍລິສັດຜູ້ສະໜອງ..."
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
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
                className="appearance-none pl-3.5 pr-8 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 hover:border-zinc-700 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
              >
                <option value={20}>20 ບໍລິສັດ / ໜ້າ</option>
                <option value={50}>50 ບໍລິສັດ / ໜ້າ</option>
                <option value={100}>100 ບໍລິສັດ / ໜ້າ</option>
              </select>
              <SlidersHorizontal size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── SUPPLIERS DATA TABLE ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                <th className="px-5 py-4 font-semibold">ບໍລິສັດຜູ້ສະໜອງ (Supplier)</th>
                <th className="px-5 py-4 font-semibold">ຜູ້ຕິດຕໍ່ປະສານງານ</th>
                <th className="px-5 py-4 font-semibold">ອີເມລ (Email)</th>
                <th className="px-5 py-4 font-semibold">ເບີໂທລະສັບ (Phone)</th>
                <th className="px-5 py-4 font-semibold">ທີ່ຢູ່ (Address)</th>
                <th className="px-5 py-4 font-semibold text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-amber-500" size={32} />
                    <p className="text-zinc-500 text-sm mt-3 font-medium">ກຳລັງໂຫຼດຂໍ້ມູນຜູ້ສະໜອງ...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-600 mb-3 border border-zinc-700/50">
                      <Truck size={32} />
                    </div>
                    <p className="text-zinc-300 font-medium">ບໍ່ພົບຂໍ້ມູນຜູ້ສະໜອງທີ່ຄົ້ນຫາ</p>
                    <p className="text-zinc-500 text-xs mt-1">ລອງປ່ຽນຄຳຄົ້ນຫາເພື່ອເບິ່ງລາຍການອື່ນ</p>
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const isEditing = editingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`group transition-colors ${
                        isEditing
                          ? "bg-amber-500/10 border-l-4 border-l-amber-500"
                          : "hover:bg-zinc-800/40"
                      }`}
                    >
                      {/* Column 1: Company Name */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.name}
                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="ຊື່ບໍລິສັດ..."
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                              <Building2 size={15} />
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-200">{item.name}</p>
                              <p className="text-[11px] text-zinc-500 font-mono">ID: #{item.id.slice(-6).toUpperCase()}</p>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Column 2: Contact Person */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.contactName}
                            onChange={(e) => setEditValues({ ...editValues, contactName: e.target.value })}
                            className="w-40 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="ຊື່ຜູ້ຕິດຕໍ່..."
                          />
                        ) : item.contactName ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300">
                            <User size={12} className="text-zinc-500" />
                            {item.contactName}
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
                            className="w-48 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
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

                      {/* Column 4: Phone */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.phone}
                            onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                            className="w-36 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono"
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

                      {/* Column 5: Address */}
                      <td className="px-5 py-4 max-w-[200px]">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.address}
                            onChange={(e) => setEditValues({ ...editValues, address: e.target.value })}
                            className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
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
                              className="p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all active:scale-95"
                              title="ແກ້ໄຂຂໍ້ມູນ (Edit)"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              onClick={() => setDeleteConfirm(item)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-95"
                              title="ລຶບຜູ້ສະໜອງ (Delete)"
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
                <h3 className="text-lg font-bold text-white">ຢືນຢັນການລຶບຜູ້ສະໜອງ</h3>
                <p className="text-zinc-400 text-xs mt-0.5 font-mono">
                  ບໍລິສັດ: {deleteConfirm.name}
                </p>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>ຜູ້ຕິດຕໍ່:</span>
                <span className="font-semibold text-white">{deleteConfirm.contactName || "—"}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>ເບີໂທ:</span>
                <span className="font-semibold text-zinc-200">{deleteConfirm.phone || "—"}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>ອີເມລ:</span>
                <span className="font-semibold text-zinc-300">{deleteConfirm.email || "—"}</span>
              </div>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed">
              ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຂໍ້ມູນຜູ້ສະໜອງນີ້? ການກະທຳນີ້ບໍ່ສາມາດຍ້ອນກັບໄດ້.
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
