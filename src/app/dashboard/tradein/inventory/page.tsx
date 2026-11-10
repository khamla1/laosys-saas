"use client";

import React, { useState, useEffect, useMemo } from "react";
import { askConfirm } from "@/components/ConfirmModal";
import {
  PackageOpen,
  Plus,
  Search,
  Trash2,
  Edit2,
  ShoppingCart,
  Undo2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  Boxes,
  Sparkles,
  X,
  Save,
  LayoutGrid,
  List,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface SecondHandItem {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  image?: string | null;
  description?: string | null;
  condition: "NEW" | "SLIGHTLY_USED" | "USED" | "DEFECTIVE" | string;
  buyPrice: number;
  sellPrice: number;
  receiveDate?: string;
  status: "AVAILABLE" | "SOLD" | string;
}

const PRESET_IMAGE_SUGGESTIONS = [
  { label: "ໄມ້ຕີແບດ", url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&auto=format&fit=crop&q=80" },
  { label: "ລົດຖີບ", url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&auto=format&fit=crop&q=80" },
  { label: "ດໍາເບວ/ຟິດເນສ", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80" },
  { label: "ເກີບແລ່ນ", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80" },
  { label: "ໂທລະສັບ/ໄອທີ", url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80" },
  { label: "ກ້ອງຖ່າຍຮູບ", url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80" }
];

export default function SecondHandPage() {
  const [items, setItems] = useState<SecondHandItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "SOLD">("ALL");
  const [conditionFilter, setConditionFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");

  // Lightbox Image Zoom
  const [zoomedImage, setZoomedImage] = useState<{ url: string; name: string } | null>(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SecondHandItem | null>(null);
  const [isSeedingPresets, setIsSeedingPresets] = useState(false);

  // Form State
  const [itemCode, setItemCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("ອຸປະກອນກິລາ");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("SLIGHTLY_USED");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [status, setStatus] = useState("AVAILABLE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dashboard/second-hand");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setItems(data);
      } else {
        toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນຄັງສິນຄ້າມືສອງໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Seed Presets
  const handleSeedPresets = async () => {
    setIsSeedingPresets(true);
    try {
      const res = await fetch("/api/dashboard/second-hand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEED_PRESETS" })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`ເພີ່ມສິນຄ້າມືສອງຍອດນິຍົມສຳເລັດ +${data.count} ລາຍການ`);
        fetchItems();
      } else {
        toast.error(data.error || "ເກີດຂໍ້ຜິດພາດໃນການສ້າງຂໍ້ມູນຕົວຢ່າງ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setIsSeedingPresets(false);
    }
  };

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !buyPrice || !sellPrice) {
      return toast.error("ກະລຸນາປ້ອນຊື່ສິນຄ້າ, ລາຄາຮັບຊື້, ແລະ ລາຄາຂາຍໃຫ້ຄົບຖ້ວນ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        itemCode: itemCode.trim() || undefined,
        name: name.trim(),
        category: category.trim() || "ທົ່ວໄປ",
        image: image.trim() || undefined,
        description: description.trim() || undefined,
        condition,
        buyPrice: parseFloat(buyPrice),
        sellPrice: parseFloat(sellPrice),
        status
      };

      const url = editingItem
        ? `/api/dashboard/second-hand/${editingItem.id}`
        : "/api/dashboard/second-hand";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(
          editingItem ? "ອັບເດດຂໍ້ມູນສິນຄ້າມືສອງສຳເລັດ" : "ເພີ່ມສິນຄ້າມືສອງໃໝ່ສຳເລັດ"
        );
        setShowAddModal(false);
        resetForm();
        fetchItems();
      } else {
        const err = await res.json();
        toast.error(err.error || "ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status: AVAILABLE <-> SOLD
  const handleUpdateStatus = async (item: SecondHandItem, newStatus: string) => {
    const actionLabel = newStatus === "SOLD" ? "ປ່ຽນສະຖານະເປັນ 'ຂາຍແລ້ວ'" : "ປ່ຽນສະຖານະເປັນ 'ພ້ອມຂາຍ'";
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການ${actionLabel} ສຳລັບ "${item.name}" ແທ້ບໍ່?`,
      {
        title: "ຢືນຢັນການປັບປ່ຽນສະຖານະສິນຄ້າ",
        variant: newStatus === "SOLD" ? "info" : "warning",
        confirmText: "ຢືນຢັນ",
        cancelText: "ຍົກເລີກ"
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/second-hand/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`ອັບເດດສະຖານະເປັນ ${newStatus === "SOLD" ? "ຂາຍແລ້ວ" : "ພ້ອມຂາຍ"} ສຳເລັດ`);
        fetchItems();
      } else {
        toast.error("ບໍ່ສາມາດອັບເດດສະຖານະໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  // Delete
  const handleDelete = async (id: string, itemName: string) => {
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການລຶບສິນຄ້າມືສອງ "${itemName}" ອອກຈາກລະບົບແທ້ບໍ່?`,
      {
        title: "ຢືນຢັນການລຶບສິນຄ້າມືສອງ (Delete Item)",
        variant: "danger",
        confirmText: "ລຶບສິນຄ້າ",
        cancelText: "ຍົກເລີກ"
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/second-hand/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບສິນຄ້າມືສອງສຳເລັດແລ້ວ");
        fetchItems();
      } else {
        toast.error("ບໍ່ສາມາດລຶບສິນຄ້າໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  const resetForm = () => {
    setItemCode(`2ND-${Date.now().toString().slice(-6)}`);
    setName("");
    setCategory("ອຸປະກອນກິລາ");
    setImage("");
    setDescription("");
    setCondition("SLIGHTLY_USED");
    setBuyPrice("");
    setSellPrice("");
    setStatus("AVAILABLE");
    setEditingItem(null);
  };

  const openEdit = (item: SecondHandItem) => {
    setEditingItem(item);
    setItemCode(item.itemCode);
    setName(item.name);
    setCategory(item.category);
    setImage(item.image || "");
    setDescription(item.description || "");
    setCondition(item.condition);
    setBuyPrice(item.buyPrice.toString());
    setSellPrice(item.sellPrice.toString());
    setStatus(item.status);
    setShowAddModal(true);
  };

  // Condition Badge & Label
  const getConditionInfo = (cond: string) => {
    switch (cond) {
      case "NEW":
        return { label: "ໃໝ່ 100% (New)", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
      case "SLIGHTLY_USED":
        return { label: "ມືສອງ ສະພາບດີເລີດ 95%+", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" };
      case "USED":
        return { label: "ມືສອງ ສະພາບໃຊ້ງານປົກກະຕິ", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" };
      case "DEFECTIVE":
        return { label: "ມີຕຳໜິ / ຕ້ອງສ້ອມແປງ", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
      default:
        return { label: cond, color: "bg-zinc-800 text-zinc-300 border-zinc-700" };
    }
  };

  // KPI Calculations
  const totalCount = items.length;
  const availableItems = useMemo(() => items.filter((i) => i.status === "AVAILABLE"), [items]);
  const soldItems = useMemo(() => items.filter((i) => i.status === "SOLD"), [items]);

  const totalBuyValue = useMemo(
    () => availableItems.reduce((sum, i) => sum + (i.buyPrice || 0), 0),
    [availableItems]
  );
  const totalExpectedProfit = useMemo(
    () => availableItems.reduce((sum, i) => sum + Math.max(0, (i.sellPrice || 0) - (i.buyPrice || 0)), 0),
    [availableItems]
  );
  const totalSoldProfit = useMemo(
    () => soldItems.reduce((sum, i) => sum + Math.max(0, (i.sellPrice || 0) - (i.buyPrice || 0)), 0),
    [soldItems]
  );

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.itemCode.toLowerCase().includes(search.toLowerCase()) ||
        (r.category && r.category.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchCondition = conditionFilter === "ALL" || r.condition === conditionFilter;

      return matchSearch && matchStatus && matchCondition;
    });
  }, [items, search, statusFilter, conditionFilter]);

  // Fallback Image
  const getItemImage = (item: SecondHandItem) => {
    if (item.image) return item.image;
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-950/70 p-6 rounded-3xl border border-zinc-800/80 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-center shadow-inner shrink-0">
            <PackageOpen className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ຄັງສິນຄ້າມືສອງ (Second Hand Inventory)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                Trade-in & Refurbished
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              ຈັດການສະຕັອກສິນຄ້າມືສອງ, ປະເມີນສະພາບສິນຄ້າ, ຕົ້ນທຶນຮັບຊື້, ລາຄາຂາຍ ແລະ ຄຳນວນກຳໄລອັດຕະໂນມັດ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            type="button"
            onClick={handleSeedPresets}
            disabled={isSeedingPresets}
            className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 text-emerald-200 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSeedingPresets ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-400" />
            )}
            <span>+ ໃສ່ສິນຄ້າມືສອງຕົວຢ່າງ 1-Click</span>
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex-1 sm:flex-initial py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ ເພີ່ມສິນຄ້າມືສອງ</span>
          </button>
        </div>
      </div>

      {/* TOP KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">ສິນຄ້າມືສອງທັງໝົດ</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalCount}</span>
            <span className="text-xs text-zinc-500 font-medium">ລາຍການ</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">ບັນທຶກໃນລະບົບທັງໝົດ</p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">ພ້ອມຂາຍ (Available)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{availableItems.length}</span>
            <span className="text-xs text-zinc-500 font-medium">ລາຍການ</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">
            ມູນຄ່າຕົ້ນທຶນ ₭{totalBuyValue.toLocaleString()}
          </p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">ຂາຍອອກແລ້ວ (Sold)</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400">{soldItems.length}</span>
            <span className="text-xs text-zinc-500 font-medium">ລາຍການ</span>
          </div>
          <p className="text-[11px] text-cyan-400 mt-1 font-medium">
            ກຳໄລທີ່ໄດ້ຮັບ ₭{totalSoldProfit.toLocaleString()}
          </p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">ກຳໄລຄາດຄະເນ (Expected)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs text-amber-400 font-bold">₭</span>
            <span className="text-2xl font-black text-white truncate">
              {totalExpectedProfit.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">ຈາກສິນຄ້າທີ່ພ້ອມຂາຍ</p>
        </div>
      </div>

      {/* FILTER & TOOLBAR */}
      <div className="bg-zinc-950/70 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ, ລະຫັດສິນຄ້າ, ໝວດໝູ່..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Chips & View Mode */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-between sm:justify-end">
          {/* Status Tabs */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "ALL"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ທັງໝົດ ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("AVAILABLE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "AVAILABLE"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ພ້ອມຂາຍ ({availableItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("SOLD")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "SOLD"
                  ? "bg-zinc-700 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ຂາຍແລ້ວ ({soldItems.length})
            </button>
          </div>

          {/* Condition Select */}
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">ທຸກສະພາບສິນຄ້າ</option>
            <option value="NEW">ໃໝ່ 100%</option>
            <option value="SLIGHTLY_USED">ມືສອງ ສະພາບດີເລີດ 95%+</option>
            <option value="USED">ມືສອງ ສະພາບໃຊ້ງານປົກກະຕິ</option>
            <option value="DEFECTIVE">ມີຕຳໜິ / ຕ້ອງສ້ອມແປງ</option>
          </select>

          {/* View Toggle */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "GRID" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Grid View (ມຸມມອງກາດ)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("TABLE")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "TABLE" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Table View (ມຸມມອງຕາຕະລາງ)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT DISPLAY */}
      {isLoading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
          <p className="text-xs text-zinc-500 mt-2">ກຳລັງໂຫຼດຂໍ້ມູນຄັງສິນຄ້າມືສອງ...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/50 space-y-4">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-600 border border-zinc-800">
            <PackageOpen className="w-8 h-8" />
          </div>
          <div>
            <p className="text-white font-bold text-base">ບໍ່ພົບລາຍການສິນຄ້າມືສອງ</p>
            <p className="text-zinc-500 text-xs mt-1">
              ທ່ານສາມາດກົດປຸ່ມ "+ ໃສ່ສິນຄ້າມືສອງຕົວຢ່າງ 1-Click" ເພື່ອເລີ່ມຕົ້ນໄດ້ທັນທີ
            </p>
          </div>
          <button
            type="button"
            onClick={handleSeedPresets}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ ໃສ່ສິນຄ້າມືສອງຕົວຢ່າງ 1-Click</span>
          </button>
        </div>
      ) : viewMode === "GRID" ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const condInfo = getConditionInfo(item.condition);
            const isAvailable = item.status === "AVAILABLE";
            const profit = Math.max(0, (item.sellPrice || 0) - (item.buyPrice || 0));

            return (
              <div
                key={item.id}
                className="bg-zinc-950/70 border border-zinc-800/80 hover:border-emerald-500/50 rounded-3xl overflow-hidden group transition-all duration-300 flex flex-col relative shadow-lg backdrop-blur-xl"
              >
                {/* Image Banner */}
                <div className="h-48 w-full bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={getItemImage(item)}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                    onClick={() =>
                      setZoomedImage({
                        url: getItemImage(item),
                        name: item.name
                      })
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent pointer-events-none" />

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    {isAvailable ? (
                      <span className="px-2.5 py-1 bg-emerald-500/90 text-white text-[10px] font-bold rounded-full shadow-lg backdrop-blur-md">
                        ພ້ອມຂາຍ
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-zinc-800/90 text-zinc-300 text-[10px] font-bold rounded-full shadow-lg backdrop-blur-md">
                        ຂາຍແລ້ວ
                      </span>
                    )}
                  </div>

                  {/* Condition Tag */}
                  <div className="absolute bottom-2.5 left-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border backdrop-blur-md flex items-center gap-1 ${condInfo.color}`}>
                      <Tag className="w-3 h-3" />
                      <span>{condInfo.label}</span>
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-mono text-zinc-500">{item.itemCode}</span>
                      <span className="text-[11px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md font-medium">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-emerald-400 transition-colors" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1 min-h-[32px]">
                      {item.description || "ບໍ່ມີລາຍລະອຽດເພີ່ມເຕີມ"}
                    </p>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-2.5 rounded-2xl border border-zinc-800/80">
                    <div>
                      <div className="text-[10px] text-zinc-500 mb-0.5">ຕົ້ນທຶນຮັບຊື້:</div>
                      <div className="text-xs font-mono font-bold text-zinc-300">
                        ₭{item.buyPrice.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-emerald-400 mb-0.5">ລາຄາຕັ້ງຂາຍ:</div>
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        ₭{item.sellPrice.toLocaleString()}
                      </div>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-zinc-800/60 flex justify-between text-[11px]">
                      <span className="text-zinc-500">ກຳໄລຄາດຄະເນ:</span>
                      <span className="text-amber-400 font-bold font-mono">
                        +₭{profit.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="ແກ້ໄຂ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="ລຶບ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(item, "SOLD")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>ປ່ຽນເປັນຂາຍແລ້ວ</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(item, "AVAILABLE")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>ຄືນສະຖານະພ້ອມຂາຍ</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase">
                <tr>
                  <th className="px-5 py-3.5">ສິນຄ້າ (Product)</th>
                  <th className="px-5 py-3.5">ລະຫັດ (SKU)</th>
                  <th className="px-5 py-3.5">ໝວດໝູ່</th>
                  <th className="px-5 py-3.5">ສະພາບສິນຄ້າ</th>
                  <th className="px-5 py-3.5 text-right">ຕົ້ນທຶນຮັບຊື້</th>
                  <th className="px-5 py-3.5 text-right">ລາຄາຕັ້ງຂາຍ</th>
                  <th className="px-5 py-3.5 text-right">ກຳໄລຄາດຄະເນ</th>
                  <th className="px-5 py-3.5 text-center">ສະຖານະ</th>
                  <th className="px-5 py-3.5 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredItems.map((item) => {
                  const condInfo = getConditionInfo(item.condition);
                  const isAvailable = item.status === "AVAILABLE";
                  const profit = Math.max(0, (item.sellPrice || 0) - (item.buyPrice || 0));

                  return (
                    <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() =>
                              setZoomedImage({
                                url: getItemImage(item),
                                name: item.name
                              })
                            }
                            className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 cursor-pointer hover:border-emerald-500 transition-colors"
                          >
                            <img src={getItemImage(item)} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{item.name}</p>
                            <p className="text-[10px] text-zinc-500 line-clamp-1 max-w-xs">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-zinc-400">{item.itemCode}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${condInfo.color}`}>
                          {condInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-zinc-300">
                        ₭{item.buyPrice.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-emerald-400">
                        ₭{item.sellPrice.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-amber-400">
                        +₭{profit.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isAvailable
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {isAvailable ? "ພ້ອມຂາຍ" : "ຂາຍແລ້ວ"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAvailable ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item, "SOLD")}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              title="ປ່ຽນເປັນຂາຍແລ້ວ"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item, "AVAILABLE")}
                              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                              title="ຄືນສະຖານະພ້ອມຂາຍ"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                            title="ແກ້ໄຂ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                            title="ລຶບ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LIGHTBOX IMAGE ZOOM MODAL */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-4 text-center"
          >
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900/80 text-zinc-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-black mb-3">
              <img src={zoomedImage.url} alt={zoomedImage.name} className="w-full h-full object-contain" />
            </div>
            <h3 className="font-bold text-white text-base">{zoomedImage.name}</h3>
          </div>
        </div>
      )}

      {/* ADD / EDIT ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <PackageOpen className="w-5 h-5 text-emerald-400" />
                <span>{editingItem ? "ແກ້ໄຂສິນຄ້າມືສອງ" : "ເພີ່ມສິນຄ້າມືສອງໃໝ່"}</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="item-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-zinc-400">ລະຫັດສິນຄ້າ (Item Code) *</label>
                      <button
                        type="button"
                        onClick={() => setItemCode(`2ND-${Date.now().toString().slice(-6)}`)}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold"
                      >
                        ສ້າງລະຫັດອັດຕະໂນມັດ
                      </button>
                    </div>
                    <input
                      type="text"
                      value={itemCode}
                      onChange={(e) => setItemCode(e.target.value)}
                      required
                      placeholder="2ND-SPO-001"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">ໝວດໝູ່ (Category) *</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      placeholder="ເຊັ່ນ: ອຸປະກອນກິລາ, ໂທລະສັບ, ເກີບ..."
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">ຊື່ສິນຄ້າມືສອງ (Item Name) *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="ຕົວຢ່າງ: ໄມ້ຕີແບດ Yonex Astrox 99 Pro (ສະພາບ 95%)"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">ສະພາບສິນຄ້າ (Condition) *</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="NEW">ໃໝ່ 100% (New / Unopened)</option>
                      <option value="SLIGHTLY_USED">ມືສອງ ສະພາບດີເລີດ 95%+ (Slightly Used)</option>
                      <option value="USED">ມືສອງ ສະພາບໃຊ້ງານປົກກະຕິ (Good / Used)</option>
                      <option value="DEFECTIVE">ມີຕຳໜິ / ຕ້ອງສ້ອມແປງ (Defective)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">ສະຖານະສິນຄ້າ (Status)</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="AVAILABLE">ພ້ອມຂາຍ (AVAILABLE)</option>
                      <option value="SOLD">ຂາຍແລ້ວ (SOLD)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">ລາຄາຕົ້ນທຶນຮັບຊື້ (Buy Price ₭) *</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(e.target.value)}
                      required
                      placeholder="ເຊັ່ນ: 1500000"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">ລາຄາຕັ້ງຂາຍ (Sell Price ₭) *</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      required
                      placeholder="ເຊັ່ນ: 2400000"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {buyPrice && sellPrice && (
                  <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs flex justify-between items-center">
                    <span className="text-zinc-400">ກຳໄລຄາດຄະເນ:</span>
                    <span className="font-extrabold text-emerald-400 text-sm">
                      +₭{(Math.max(0, parseFloat(sellPrice) - parseFloat(buyPrice))).toLocaleString()}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">ຮູບພາບສິນຄ້າ (Image URL)</label>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  {/* Preset Image chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {PRESET_IMAGE_SUGGESTIONS.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImage(img.url)}
                        className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">ລາຍລະອຽດ & ຕຳໜິ (Description)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="ລາຍລະອຽດອຸປະກອນ, ຕຳໜິ, ປະຫວັດການໃຊ້ງານ, ອຸປະກອນແຖມ..."
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/30">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                form="item-form"
                disabled={isSubmitting}
                className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{editingItem ? "ບັນທຶກການແກ້ໄຂ" : "ບັນທຶກສິນຄ້າມືສອງ"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
