"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { askConfirm } from "@/components/ConfirmModal";
import {
  Tag,
  Plus,
  Search,
  Trash2,
  Edit2,
  Loader2,
  Package,
  CheckCircle2,
  Sparkles,
  X,
  Save,
  RefreshCw,
  LayoutGrid,
  List,
  Layers,
  ShoppingBag,
  ExternalLink,
  SlidersHorizontal,
  Image as ImageIcon,
  Check,
  Power
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  status: string;
  productCount?: number;
  createdAt?: string;
}

const PRESET_IMAGE_SUGGESTIONS = [
  { label: "ກາເຟ & ເຄື່ອງດື່ມ", url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80" },
  { label: "ຊາ & ເຄື່ອງດື່ມເຢັນ", url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80" },
  { label: "ອາຫານ & ຈານດຽວ", url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80" },
  { label: "ຂອງກິນຫຼິ້ນ / ອາຫານວ່າງ", url: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=80" },
  { label: "ຂອງຫວານ & ເບເກີຣີ", url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80" },
  { label: "ເຂົ້າໜົມ & ມິນິມາດ", url: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&auto=format&fit=crop&q=80" },
  { label: "ເສື້ອຜ້າ & ແຟຊັ່ນ", url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80" },
  { label: "ອຸປະກອນກິລາ & ຟິດເນສ", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80" },
  { label: "ໄອທີ & ເອເລັກໂຕຣນິກ", url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80" }
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [viewMode, setViewMode] = useState<"TABLE" | "GRID">("GRID");

  // Create Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [isUpdating, setIsUpdating] = useState(false);

  // Preset Seeder Modal
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/dashboard/categories");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCategories(data);
      } else {
        toast.error(data.error || "ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໝວດໝູ່ໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການດາວໂຫຼດຂໍ້ມູນ");
    } finally {
      setIsLoading(false);
    }
  };

  // Create Category
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("ກະລຸນາປ້ອນຊື່ໝວດໝູ່ (Category name is required)");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          image: imageUrl.trim() || undefined,
          status
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("ເພີ່ມໝວດໝູ່ໃໝ່ສຳເລັດແລ້ວ");
        setName("");
        setDescription("");
        setImageUrl("");
        setStatus("ACTIVE");
        fetchCategories();
      } else {
        toast.error(data.error || "ບໍ່ສາມາດເພີ່ມໝວດໝູ່ໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການສ້າງໝວດໝູ່");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
    setEditImageUrl(cat.image || "");
    setEditStatus(cat.status || "ACTIVE");
  };

  // Update Category
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editName.trim()) return toast.error("ກະລຸນາປ້ອນຊື່ໝວດໝູ່");

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/dashboard/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          image: editImageUrl.trim() || null,
          status: editStatus
        })
      });
      if (res.ok) {
        toast.success("ອັບເດດໝວດໝູ່ສຳເລັດແລ້ວ");
        setEditingCategory(null);
        fetchCategories();
      } else {
        toast.error("ບໍ່ສາມາດອັບເດດໝວດໝູ່ໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setIsUpdating(false);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (cat: Category) => {
    const nextStatus = cat.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/dashboard/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        toast.success(
          nextStatus === "ACTIVE"
            ? `ເປີດໃຊ້ງານໝວດໝູ່ "${cat.name}" ແລ້ວ`
            : `ປິດການໃຊ້ງານໝວດໝູ່ "${cat.name}" ແລ້ວ`
        );
        fetchCategories();
      } else {
        toast.error("ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  // Delete Category
  const handleDelete = async (id: string, catName: string) => {
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການລຶບໝວດໝູ່ "${catName}" ແທ້ບໍ່?`,
      {
        title: "ຢືນຢັນການລຶບໝວດໝູ່ (Delete Category)",
        variant: "danger",
        confirmText: "ລຶບໝວດໝູ່",
        cancelText: "ຍົກເລີກ"
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບໝວດໝູ່ສຳເລັດແລ້ວ");
        fetchCategories();
      } else {
        const data = await res.json();
        toast.error(data.error || "ບໍ່ສາມາດລຶບໝວດໝູ່ໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  // Seed Presets by Industry
  const handleSeedIndustry = async (industryKey: string, industryLabel: string) => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/dashboard/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEED_PRESETS",
          industry: industryKey
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`ເພີ່ມໝວດໝູ່ສຳເລັດ +${data.count} ລາຍການ (${industryLabel})`);
        setIsPresetModalOpen(false);
        fetchCategories();
      } else {
        toast.error(data.error || "ເກີດຂໍ້ຜິດພາດໃນການສ້າງຊຸດໝວດໝູ່");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSeeding(false);
    }
  };

  // KPI Calculations
  const totalCategories = categories.length;
  const activeCategories = useMemo(
    () => categories.filter((c) => c.status === "ACTIVE").length,
    [categories]
  );
  const totalCategorizedProducts = useMemo(
    () => categories.reduce((sum, c) => sum + (c.productCount || 0), 0),
    [categories]
  );
  const topCategory = useMemo(() => {
    if (categories.length === 0) return null;
    return [...categories].sort((a, b) => (b.productCount || 0) - (a.productCount || 0))[0];
  }, [categories]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (filterStatus === "ACTIVE") return c.status === "ACTIVE";
      if (filterStatus === "INACTIVE") return c.status !== "ACTIVE";
      return true;
    });
  }, [categories, search, filterStatus]);

  // Fallback Image
  const getCategoryImage = (cat: Category) => {
    if (cat.image) return cat.image;
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-950/70 p-6 rounded-3xl border border-zinc-800/80 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center shadow-inner shrink-0">
            <Tag className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ໝວດໝູ່ສິນຄ້າ (Categories)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold">
                Catalog & Classification
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              ຈັດການໝວດໝູ່ສິນຄ້າ, ຈັດລະບຽບລາຍການສິນຄ້າໃນຮ້ານ, ແລະ ເຊື່ອມຕໍ່ກັບລະບົບຂາຍໜ້າຮ້ານ POS
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setIsPresetModalOpen(true)}
            className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/50 hover:to-indigo-600/50 text-blue-200 border border-blue-500/30 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>+ ໃສ່ໝວດໝູ່ມາດຕະຖານ 1-Click</span>
          </button>

          <Link
            href="/dashboard/products/create"
            className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ ເພີ່ມສິນຄ້າໃໝ່</span>
          </Link>

          <Link
            href="/dashboard/pos"
            className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>ໜ້າຂາຍ POS</span>
          </Link>
        </div>
      </div>

      {/* TOP KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">ໝວດໝູ່ທັງໝົດ</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalCategories}</span>
            <span className="text-xs text-zinc-500 font-medium">ໝວດໝູ່</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">ໃຊ້ງານທົ່ວທຸກລະບົບໃນຮ້ານ</p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">ເປີດໃຊ້ງານ (Active)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{activeCategories}</span>
            <span className="text-xs text-zinc-500 font-medium">
              / {totalCategories} ໝວດໝູ່
            </span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">
            {totalCategories > 0 ? `${Math.round((activeCategories / totalCategories) * 100)}% ພ້ອມສະແດງໃນ POS` : "0%"}
          </p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">ສິນຄ້າທີ່ຈັດໝວດແລ້ວ</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalCategorizedProducts}</span>
            <span className="text-xs text-zinc-500 font-medium">ສິນຄ້າ</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">ລວມສິນຄ້າໃນທຸກໝວດໝູ່</p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">ໝວດໝູ່ຍອດນິຍົມ</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 truncate">
            <span className="text-base font-black text-white truncate block">
              {topCategory ? topCategory.name : "-"}
            </span>
          </div>
          <p className="text-[11px] text-amber-400 mt-1 font-medium">
            {topCategory ? `${topCategory.productCount || 0} ລາຍການສິນຄ້າ` : "ຍັງບໍ່ມີຂໍ້ມູນ"}
          </p>
        </div>
      </div>

      {/* MAIN 2-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CREATE CATEGORY FORM */}
        <div className="lg:col-span-4 bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-5">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              <span>ເພີ່ມໝວດໝູ່ໃໝ່ (New Category)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              ສ້າງໝວດໝູ່ສິນຄ້າສຳລັບຈັດໝວດໃນຄັງສິນຄ້າ ແລະ ປຸ່ມຂາຍໃນ POS
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                ຊື່ໝວດໝູ່ (Category Name) *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ຕົວຢ່າງ: ເຄື່ອງດື່ມກາເຟ, ອາຫານຈານດຽວ, ເສື້ອຜ້າ..."
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                ລາຍລະອຽດ (Description)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ລາຍລະອຽດເພີ່ມເຕີມ ຫຼື ໝາຍເຫດຂອງໝວດໝູ່ນີ້..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center justify-between">
                <span>ຮູບພາບປົກ / ໄອຄອນ (Image URL)</span>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-[10px] text-zinc-500 hover:text-red-400"
                  >
                    ລ້າງຮູບ
                  </button>
                )}
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />

              {/* Preset Image Picker Quick Chips */}
              <div className="mt-2">
                <span className="text-[10px] text-zinc-500 font-bold block mb-1.5">
                  ເລືອກຮູບພາບຕົວຢ່າງດ່ວນ:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_IMAGE_SUGGESTIONS.slice(0, 5).map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(img.url)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                        imageUrl === img.url
                          ? "bg-blue-600 text-white border-blue-400 shadow-sm"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
                      }`}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Image */}
              {imageUrl && (
                <div className="mt-3 w-full h-24 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-zinc-300">
                    Preview
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">ສະຖານະການໃຊ້ງານ</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("ACTIVE")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    status === "ACTIVE"
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ເປີດໃຊ້ (ACTIVE)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("INACTIVE")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    status === "INACTIVE"
                      ? "bg-rose-600 text-white border-rose-500 shadow-sm"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>ປິດໄວ້ (INACTIVE)</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>ບັນທຶກໝວດໝູ່ (Save Category)</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: CATEGORIES LIST & FILTER */}
        <div className="lg:col-span-8 bg-zinc-950/70 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
          {/* SEARCH & CONTROLS BAR */}
          <div className="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/30">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ຄົ້ນຫາໝວດໝູ່..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Filter Tabs & View Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setFilterStatus("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === "ALL"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  ທັງໝົດ ({categories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("ACTIVE")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === "ACTIVE"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  ເປີດ ({activeCategories})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("INACTIVE")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === "INACTIVE"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  ປິດ ({categories.length - activeCategories})
                </button>
              </div>

              {/* View Switcher */}
              <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setViewMode("GRID")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "GRID" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("TABLE")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "TABLE" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="p-5">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs text-zinc-500">ກຳລັງໂຫຼດຂໍ້ມູນໝວດໝູ່...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl p-8 space-y-4">
                <Tag className="w-12 h-12 mx-auto text-zinc-700" />
                <div>
                  <p className="font-bold text-sm text-zinc-400">ຍັງບໍ່ມີຂໍ້ມູນໝວດໝູ່ສິນຄ້າ</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    ກົດປຸ່ມດ້ານລຸ່ມເພື່ອໃສ່ຊຸດໝວດໝູ່ມາດຕະຖານຕາມປະເພດທຸລະກິດຂອງທ່ານໄດ້ທັນທີ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>+ ໃສ່ໝວດໝູ່ມາດຕະຖານ 1-Click</span>
                </button>
              </div>
            ) : viewMode === "GRID" ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.map((cat) => {
                  const isActive = cat.status === "ACTIVE";

                  return (
                    <div
                      key={cat.id}
                      className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 hover:bg-zinc-900 transition-all flex flex-col justify-between group shadow-sm"
                    >
                      {/* Image Banner */}
                      <div className="h-32 w-full bg-zinc-950 relative overflow-hidden">
                        <img
                          src={getCategoryImage(cat)}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                        {/* Status Toggle Badge */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cat)}
                          className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md transition-all ${
                            isActive
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          }`}
                        >
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </button>

                        {/* Product Count Pill */}
                        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-semibold text-zinc-300 border border-white/10">
                          <Package className="w-3 h-3 text-blue-400" />
                          <span>{cat.productCount || 0} ສິນຄ້າ</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-blue-400 transition-colors">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-zinc-400 line-clamp-2 mt-1 min-h-[32px]">
                            {cat.description || "ບໍ່ມີລາຍລະອຽດເພີ່ມເຕີມ"}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-zinc-800/60 mt-3 flex items-center justify-between gap-2">
                          <Link
                            href={`/dashboard/products/create?category=${encodeURIComponent(cat.name)}`}
                            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>ເພີ່ມສິນຄ້າ</span>
                          </Link>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(cat)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                              title="ແກ້ໄຂໝວດໝູ່"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cat.id, cat.name)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                              title="ລຶບໝວດໝູ່"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase">
                    <tr>
                      <th className="px-5 py-3">ໝວດໝູ່ (Category)</th>
                      <th className="px-5 py-3">ລາຍລະອຽດ (Description)</th>
                      <th className="px-5 py-3 text-center">ຈຳນວນສິນຄ້າ</th>
                      <th className="px-5 py-3 text-center">ສະຖານະ</th>
                      <th className="px-5 py-3 text-right">ຈັດການ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {filteredCategories.map((cat) => {
                      const isActive = cat.status === "ACTIVE";

                      return (
                        <tr key={cat.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-white">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                                <img
                                  src={getCategoryImage(cat)}
                                  alt={cat.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="font-bold text-sm text-white">{cat.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-zinc-400 max-w-xs truncate">
                            {cat.description || "-"}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <Link
                              href={`/dashboard/products?category=${encodeURIComponent(cat.name)}`}
                              className="px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                            >
                              <Package className="w-3 h-3 text-blue-400" />
                              <span>{cat.productCount || 0} ສິນຄ້າ</span>
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(cat)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                isActive
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                              }`}
                            >
                              {isActive ? "ACTIVE" : "INACTIVE"}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/dashboard/products/create?category=${encodeURIComponent(cat.name)}`}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white transition-colors"
                                title="ເພີ່ມສິນຄ້າໃນໝວດນີ້"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => openEditModal(cat)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                                title="ແກ້ໄຂໝວດໝູ່"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(cat.id, cat.name)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                                title="ລຶບໝວດໝູ່"
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
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EDIT CATEGORY MODAL */}
      {/* ========================================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-400" />
              <span>ແກ້ໄຂໝວດໝູ່ສິນຄ້າ</span>
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                  ຊື່ໝວດໝູ່ (Category Name) *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                  ລາຍລະອຽດ (Description)
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                  ຮູບພາບປົກ / ໄອຄອນ (Image URL)
                </label>
                <input
                  type="url"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRESET_IMAGE_SUGGESTIONS.slice(0, 5).map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditImageUrl(img.url)}
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">ສະຖານະ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus("ACTIVE")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      editStatus === "ACTIVE"
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ACTIVE (ເປີດໃຊ້)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus("INACTIVE")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      editStatus === "INACTIVE"
                        ? "bg-rose-600 text-white border-rose-500 shadow-sm"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>INACTIVE (ປິດໄວ້)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>ບັນທຶກການແກ້ໄຂ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1-CLICK INDUSTRY PRESETS MODAL */}
      {/* ========================================================================= */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsPresetModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-black text-white">ເລືອກຊຸດໝວດໝູ່ມາດຕະຖານ 1-Click</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                ເລືອກປະເພດທຸລະກິດຂອງທ່ານເພື່ອສ້າງໝວດໝູ່ສິນຄ້າຍອດນິຍົມອັດຕະໂນມັດໃນຄລິກດຽວ
              </p>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
              {/* Option 1: Restaurant & Cafe */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/50 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">ຮ້ານອາຫານ & ຄາເຟ່ (Restaurant & Cafe)</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      ກາເຟ, ຊາ, ອາຫານຈານດຽວ, ຂອງກິນຫຼິ້ນ, ຂອງຫວານ & ເບເກີຣີ (5 ໝວດໝູ່)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSeeding}
                  onClick={() => handleSeedIndustry("RESTAURANT_CAFE", "ຮ້ານອາຫານ & ຄາເຟ່")}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-colors disabled:opacity-50"
                >
                  {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : "+ ໃສ່ຊຸດນີ້"}
                </button>
              </div>

              {/* Option 2: Retail & Minimart */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/50 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">ຮ້ານຄ້າທົ່ວໄປ & ມິນິມາດ (Retail & Minimart)</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      ເຂົ້າໜົມ, ເຄື່ອງດື່ມຂວດ, ຂອງໃຊ້ປະຈຳວັນ, ອາຫານແຫ້ງ & ເຄື່ອງປຸງ (4 ໝວດໝູ່)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSeeding}
                  onClick={() => handleSeedIndustry("RETAIL_MINIMART", "ຮ້ານຄ້າທົ່ວໄປ & ມິນິມາດ")}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-colors disabled:opacity-50"
                >
                  {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : "+ ໃສ່ຊຸດນີ້"}
                </button>
              </div>

              {/* Option 3: Fashion & Apparel */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/50 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">ເສື້ອຜ້າ & ແຟຊັ່ນ (Fashion & Apparel)</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      ເສື້ອຍືດ, ໂສ້ງ & ກະໂປງ, ເກີບ & ຖົງຕີນ, ກະເປົາ & ເຄື່ອງປະດັບ (4 ໝວດໝູ່)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSeeding}
                  onClick={() => handleSeedIndustry("FASHION_APPAREL", "ເສື້ອຜ້າ & ແຟຊັ່ນ")}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-colors disabled:opacity-50"
                >
                  {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : "+ ໃສ່ຊຸດນີ້"}
                </button>
              </div>

              {/* Option 4: Sports & Fitness */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/50 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">ອຸປະກອນກິລາ & ຟິດເນສ (Sports & Fitness)</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      ອຸປະກອນອອກກຳລັງກາຍ, ຊຸດກິລາ, ໄມ້ຕີແບດ, ອາຫານເສີມ & ເວໂປຣຕິນ (4 ໝວດໝູ່)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSeeding}
                  onClick={() => handleSeedIndustry("SPORTS_FITNESS", "ອຸປະກອນກິລາ & ຟິດເນສ")}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-colors disabled:opacity-50"
                >
                  {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : "+ ໃສ່ຊຸດນີ້"}
                </button>
              </div>

              {/* Option 5: Tech & Electronics */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/50 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <SlidersHorizontal className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">ໄອທີ & ເອເລັກໂຕຣນິກ (Tech & Electronics)</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      ສະມາດໂຟນ, ອຸປະກອນເສີມໄອທີ, ຫູຟັງ & ລຳໂພງ (3 ໝວດໝູ່)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSeeding}
                  onClick={() => handleSeedIndustry("TECH_ELECTRONICS", "ໄອທີ & ເອເລັກໂຕຣນິກ")}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-colors disabled:opacity-50"
                >
                  {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : "+ ໃສ່ຊຸດນີ້"}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
              >
                ປິດໜ້າຕ່າງ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
