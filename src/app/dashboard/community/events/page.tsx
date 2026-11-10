"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Trophy,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  XCircle,
  Loader2,
  Image as ImageIcon,
  Phone,
  User,
  Users,
  Printer,
  X,
  ExternalLink,
  Shield,
  Activity,
  Award,
  Layers,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ClubItem {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  leaderName?: string | null;
  phone?: string | null;
  memberCount?: number | null;
  logo?: string | null;
  status: "ACTIVE" | "INACTIVE" | string;
  createdAt?: string;
}

export default function ClubPage() {
  const [items, setItems] = useState<ClubItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dbCategories, setDbCategories] = useState<string[]>([]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClubItem | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("ແບັດມິນຕັນ");
  const [leaderName, setLeaderName] = useState("");
  const [phone, setPhone] = useState("");
  const [memberCount, setMemberCount] = useState("10");
  const [logo, setLogo] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Add Category Modal
  const [showQuickAddCatModal, setShowQuickAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isSavingCat, setIsSavingCat] = useState(false);

  // Print Club Modal
  const [printClub, setPrintClub] = useState<ClubItem | null>(null);
  const [printFormat, setPrintFormat] = useState<"slip" | "a4">("slip");
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/dashboard/club");
      const data = await res.json();
      if (res.ok) {
        setItems(Array.isArray(data) ? data : []);
      } else {
        toast.error("ບໍ່ສາມາດໂຫລດລາຍຊື່ຊົມລົມ & ທີມກິລາໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/dashboard/categories");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDbCategories(data.map((c: any) => c.name || c));
      }
    } catch {
      // non-blocking
    }
  };

  const handleQuickSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ໝວດໝູ່ / ປະເພດກິລາໃໝ່");
    }
    setIsSavingCat(true);
    try {
      const res = await fetch("/api/dashboard/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        const catTitle = created.name || newCatName.trim();
        setDbCategories(prev => [...prev, catTitle]);
        setCategory(catTitle);
        setShowQuickAddCatModal(false);
        setNewCatName("");
        toast.success(`ເພີ່ມປະເພດກິລາ "${catTitle}" ສຳເລັດ`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "ບໍ່ສາມາດບັນທຶກໝວດໝູ່ໃໝ່ໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSavingCat(false);
    }
  };

  const allCategoryOptions = useMemo(() => {
    const defaultCats = ["ແບັດມິນຕັນ", "ລົດຖີບ", "ກອຟ", "ບານເຕະ", "ແລ່ນມາຣາທອນ", "ເທັນນິດ", "ແຄ້ມປິ້ງ", "ອື່ນໆ"];
    return Array.from(new Set([...defaultCats, ...dbCategories]));
  }, [dbCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ຊົມລົມ ຫຼື ທີມກິລາ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        category,
        leaderName: leaderName.trim() || null,
        phone: phone.trim() || null,
        memberCount: Number(memberCount) || 0,
        logo: logo.trim() || null,
        status,
      };

      const url = editingItem
        ? `/api/dashboard/club/${editingItem.id}`
        : "/api/dashboard/club";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingItem ? "ແກ້ໄຂຂໍ້ມູນຊົມລົມສຳເລັດ" : "ສ້າງຊົມລົມ / ທີມກິລາໃໝ່ສຳເລັດ");
        setShowAddModal(false);
        resetForm();
        fetchItems();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (item: ClubItem, newStatus: string) => {
    const isDeactivate = newStatus === "INACTIVE";
    const confirmed = await askConfirm(
      isDeactivate
        ? `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການປິດການເຄື່ອນໄຫວຂອງຊົມລົມ "${item.name}"?`
        : `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການເປີດໃຊ້ງານຊົມລົມ "${item.name}" ຄືນໃໝ່?`,
      {
        title: isDeactivate ? "ຢືນຢັນປິດການເຄື່ອນໄຫວ" : "ຢືນຢັນເປີດໃຊ້ງານ",
        confirmText: isDeactivate ? "ປິດໃຊ້ງານ" : "ເປີດໃຊ້ງານ",
        variant: isDeactivate ? "destructive" : "default",
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/club/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(isDeactivate ? "ປິດການເຄື່ອນໄຫວສຳເລັດ" : "ເປີດໃຊ້ງານຊົມລົມສຳເລັດ");
        fetchItems();
      } else {
        toast.error("ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    }
  };

  const handleDelete = async (item: ClubItem) => {
    const confirmed = await askConfirm(
      `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຊົມລົມ "${item.name}" ອອກຈາກລະບົບ? ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.`,
      {
        title: "ຢືນຢັນການລຶບຊົມລົມ",
        confirmText: "ລຶບຖາວອນ",
        variant: "destructive",
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/club/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບຊົມລົມສຳເລັດ");
        fetchItems();
      } else {
        toast.error("ບໍ່ສາມາດລຶບຊົມລົມໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("ແບັດມິນຕັນ");
    setLeaderName("");
    setPhone("");
    setMemberCount("10");
    setLogo("");
    setStatus("ACTIVE");
    setEditingItem(null);
  };

  const openEdit = (item: ClubItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || "");
    setCategory(item.category || "ແບັດມິນຕັນ");
    setLeaderName(item.leaderName || "");
    setPhone(item.phone || "");
    setMemberCount((item.memberCount || 10).toString());
    setLogo(item.logo || "");
    setStatus(item.status || "ACTIVE");
    setShowAddModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredItems = items.filter(r => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase())) ||
      (r.leaderName && r.leaderName.toLowerCase().includes(search.toLowerCase())) ||
      (r.phone && r.phone.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchCat = categoryFilter === "ALL" || r.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  // KPIs
  const totalClubs = items.length;
  const activeClubs = items.filter(i => i.status === "ACTIVE").length;
  const totalTeamMembers = items.reduce((sum, i) => sum + (i.memberCount || 0), 0);
  const uniqueSports = new Set(items.map(i => i.category).filter(Boolean)).size;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Print Styles ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden; }
              #club-print-wrapper, #club-print-wrapper * { visibility: visible; }
              #club-print-wrapper {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                color: black !important;
                padding: 10px;
              }
            }
          `,
        }}
      />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 shadow-lg shadow-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
              ຊົມລົມ &amp; ທີມກິລາ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Clubs &amp; Teams
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ຈັດການຊົມລົມກິລາ, ທີມແຂ່ງຂັນ, ສະໂມສອນພັນທະມິດ ແລະ ບັດຮັບຮອງທີມ
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>ເພີ່ມຊົມລົມ / ທີມກິລາໃໝ່</span>
        </button>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Link
          href="/dashboard/community/events"
          className="px-4 py-2 rounded-xl font-bold bg-amber-600 text-white shadow-md shadow-amber-600/20 whitespace-nowrap"
        >
          ຊົມລົມ &amp; ທີມກິລາ (Clubs &amp; Teams)
        </Link>
        <Link
          href="/dashboard/community/members"
          className="px-4 py-2 rounded-xl font-medium bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors whitespace-nowrap"
        >
          ສະມາຊິກຊຸມຊົນ (Members)
        </Link>
        <Link
          href="/dashboard/ambassadors/athletes"
          className="px-4 py-2 rounded-xl font-medium bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors whitespace-nowrap"
        >
          ຕົວແທນຈຳໜ່າຍ &amp; ນັກກິລາ (Dealers)
        </Link>
        <Link
          href="/dashboard/marketing/promotions"
          className="px-4 py-2 rounded-xl font-medium bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors whitespace-nowrap"
        >
          ຈັດການໂປຣໂມຊັ່ນ (Promotions)
        </Link>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ຊົມລົມ &amp; ທີມທັງໝົດ</span>
            <div className="text-2xl font-bold text-white tracking-tight">{totalClubs} ທີມ</div>
            <span className="text-[11px] text-zinc-500">ລົງທະບຽນໃນລະບົບຮ້ານ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ເຄື່ອນໄຫວປົກກະຕິ</span>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">{activeClubs} ທີມ</div>
            <span className="text-[11px] text-zinc-500">Active ໃນການແຂ່ງຂັນ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ນັກກິລາ &amp; ສະມາຊິກລວມ</span>
            <div className="text-2xl font-bold text-blue-400 tracking-tight">{totalTeamMembers} ຄົນ</div>
            <span className="text-[11px] text-zinc-500">ຈາກທຸກທີມລົງທະບຽນ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ປະເພດກິລາຫຼາກຫຼາຍ</span>
            <div className="text-2xl font-bold text-purple-400 tracking-tight">{uniqueSports} ປະເພດ</div>
            <span className="text-[11px] text-zinc-500">ຮອງຮັບຫຼາຍປະເພດກິລາ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ຊົມລົມ, ຫົວໜ້າທີມ, ເບີໂທ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">ທຸກປະເພດກິລາ (All Sports)</option>
            {allCategoryOptions.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">ສະຖານະທັງໝົດ</option>
            <option value="ACTIVE">ເຄື່ອນໄຫວປົກກະຕິ (Active)</option>
            <option value="INACTIVE">ປິດການເຄື່ອນໄຫວ (Inactive)</option>
          </select>
        </div>
      </div>

      {/* ── Content Grid ── */}
      {isLoading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
          <p className="text-zinc-500 text-sm mt-3">ກຳລັງໂຫລດຂໍ້ມູນຊົມລົມ &amp; ທີມກິລາ...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-16 h-16 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4 text-zinc-500">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">ບໍ່ພົບລາຍຊື່ຊົມລົມ ຫຼື ທີມກິລາ</h3>
          <p className="text-zinc-500 text-sm mt-1 max-w-sm">
            ຍັງບໍ່ມີຊົມລົມທີ່ກົງກັບເງື່ອນໄຂຄົ້ນຫາ ຄລິກປຸ່ມເພີ່ມຊົມລົມໃໝ່ເພື່ອເລີ່ມຕົ້ນ
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ເພີ່ມຊົມລົມທຳອິດ</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`bg-zinc-900/80 border ${
                item.status === "ACTIVE"
                  ? "border-zinc-800 hover:border-amber-500/40"
                  : "border-zinc-800/60 bg-zinc-950/40 opacity-75"
              } rounded-2xl p-5 transition-all duration-300 flex flex-col shadow-lg`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-lg flex-shrink-0">
                    {item.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.logo}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      item.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        {item.category || "ກິລາທົ່ວໄປ"}
                      </span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Users className="w-3 h-3 text-zinc-500" />
                        {item.memberCount || 0} ຄົນ
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    item.status === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  {item.status === "ACTIVE" ? "ເຄື່ອນໄຫວ" : "ປິດຊົ່ວຄາວ"}
                </span>
              </div>

              {item.description && (
                <p className="text-xs text-zinc-400 line-clamp-2 mb-3 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/60">
                  {item.description}
                </p>
              )}

              <div className="space-y-1.5 text-xs text-zinc-400 mb-4">
                {item.leaderName && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <User className="w-3 h-3" /> ຫົວໜ້າທີມ:
                    </span>
                    <span className="font-semibold text-zinc-200">{item.leaderName}</span>
                  </div>
                )}
                {item.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> ເບີໂທ:
                    </span>
                    <span className="font-mono text-zinc-300">{item.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 mt-auto">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(item)}
                    title="ແກ້ໄຂຂໍ້ມູນ"
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPrintClub(item)}
                    title="ພິມໃບຢັ້ງຢືນ / ບັດທີມ"
                    className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    title="ລຶບຊົມລົມ"
                    className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleUpdateStatus(item, item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    item.status === "ACTIVE"
                      ? "bg-zinc-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{item.status === "ACTIVE" ? "ປິດໃຊ້ງານ" : "ເປີດໃຊ້ງານ"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Club Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>{editingItem ? "ແກ້ໄຂຂໍ້ມູນຊົມລົມ / ທີມກິລາ" : "ເພີ່ມຊົມລົມ / ທີມກິລາໃໝ່"}</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ຊື່ຊົມລົມ / ທີມກິລາ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="ຕົວຢ່າງ: ຊົມລົມແບັດມິນຕັນ ນະຄອນຫຼວງ, ທີມລົດຖີບ Vientiane Riders"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Category / Sport with Quick Add Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    ປະເພດກິລາ / ໝວດໝູ່ <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCatModal(true)}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ເພີ່ມປະເພດກິລາໃໝ່</span>
                  </button>
                </div>
                <select
                  value={category}
                  onChange={e => {
                    if (e.target.value === "__ADD_NEW__") {
                      setShowQuickAddCatModal(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  {allCategoryOptions.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" className="text-amber-400 font-bold bg-zinc-900">
                    + ເພີ່ມປະເພດກິລາໃໝ່...
                  </option>
                </select>

                <div className="flex items-center justify-between mt-1.5 text-[11px] text-zinc-500">
                  <span>ຕ້ອງການຈັດການໝວດໝູ່ກິລາທັງໝົດ?</span>
                  <Link
                    href="/dashboard/categories"
                    target="_blank"
                    className="text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>ໄປໜ້າຈັດການໝວດໝູ່</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ຫົວໜ້າທີມ / ຜູ້ປະສານງານ
                  </label>
                  <input
                    type="text"
                    value={leaderName}
                    onChange={e => setLeaderName(e.target.value)}
                    placeholder="ຕົວຢ່າງ: ທ່ານ ສົມສັກ"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ເບີໂທລະສັບຕິດຕໍ່
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="020 5511 2233"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ຈຳນວນສະມາຊິກໃນທີມ (ຄົນ)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={memberCount}
                    onChange={e => setMemberCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ສະຖານະຊົມລົມ <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="ACTIVE">ເຄື່ອນໄຫວປົກກະຕິ (Active)</option>
                    <option value="INACTIVE">ປິດການເຄື່ອນໄຫວ (Inactive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ລິ້ງຄ໌ໂລໂກ້ / ຮູບພາບທີມ (Logo URL)
                </label>
                <input
                  type="url"
                  value={logo}
                  onChange={e => setLogo(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ລາຍລະອຽດຊົມລົມ / ສະຖານທີ່ຝຶກຊ້ອມ
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ຊ້ອມທຸກວັນເສົາ-ອາທິດ ທີ່ເດີ່ນກິລາແຫ່ງຊາດ..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="p-4 border-t border-zinc-800/80 -mx-6 -mb-6 mt-6 bg-zinc-950/60 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-600/30 active:scale-95"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? "ບັນທຶກການແກ້ໄຂ" : "ບັນທຶກຊົມລົມ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Quick Add Category Modal ── */}
      {showQuickAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>ເພີ່ມປະເພດກິລາ / ໝວດໝູ່ໃໝ່</span>
              </h3>
              <button
                onClick={() => setShowQuickAddCatModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickSaveCategory} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ຊື່ປະເພດກິລາ / ໝວດໝູ່ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ປິງປອງ, ສະກີ, ໂຍຄະ..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddCatModal(false)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSavingCat}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {isSavingCat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>ບັນທຶກ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Dual-Format Print Modal (80mm vs A4) ── */}
      {printClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">ພິມໃບຢັ້ງຢືນ / ບັດທີມ</h3>
                  <p className="text-[11px] text-zinc-400">{printClub.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPrintClub(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Format Selector */}
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">ເລືອກຮູບແບບການພິມ:</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintFormat("slip")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    printFormat === "slip"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  ບິນນ້ອຍ 80mm (Club Pass)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat("a4")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    printFormat === "a4"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  ໃບໃຫຍ່ A4 (Official Certificate)
                </button>
              </div>
            </div>

            {/* Print Preview Container */}
            <div className="p-6 overflow-y-auto bg-zinc-950 flex justify-center">
              <div
                id="club-print-wrapper"
                ref={printAreaRef}
                className={
                  printFormat === "slip"
                    ? "w-[80mm] p-4 bg-white text-black font-mono text-xs shadow-lg border border-zinc-300"
                    : "w-full max-w-[190mm] p-8 bg-white text-black font-sans shadow-lg border border-zinc-300"
                }
              >
                {printFormat === "slip" ? (
                  /* 80mm Club Pass */
                  <div className="space-y-3 text-center">
                    <div className="border-b border-dashed border-zinc-400 pb-2">
                      <h4 className="font-bold text-sm tracking-wide">SPORTS CLUB REGISTRATION</h4>
                      <p className="text-[10px] text-zinc-600">ບັດຮັບຮອງຊົມລົມ &amp; ທີມກິລາ</p>
                    </div>

                    <div className="text-left space-y-1.5 py-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ລະຫັດທີມ:</span>
                        <span className="font-bold font-mono">CLB-{printClub.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ຊື່ທີມ:</span>
                        <span className="font-bold">{printClub.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ປະເພດກິລາ:</span>
                        <span className="font-semibold">{printClub.category || "ທົ່ວໄປ"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ຫົວໜ້າທີມ:</span>
                        <span>{printClub.leaderName || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ເບີໂທ:</span>
                        <span>{printClub.phone || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ຈຳນວນນັກກິລາ:</span>
                        <span className="font-bold">{printClub.memberCount || 0} ຄົນ</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-zinc-400 pt-2 text-[10px] text-zinc-500">
                      <p>ໄດ້ຮັບສິດທິພິເສດລາຄາທີມສຳລັບອຸປະກອນ ແລະ ການສ້ອມແປງ</p>
                      <p className="font-mono text-[9px] mt-1">ພິມເມື່ອ: {new Date().toLocaleDateString("lo-LA")}</p>
                    </div>
                  </div>
                ) : (
                  /* A4 Official Certificate */
                  <div className="space-y-6">
                    <div className="flex justify-between items-start border-b-2 border-zinc-800 pb-4">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight">CERTIFICATE OF SPORTS CLUB AFFILIATION</h2>
                        <p className="text-xs text-zinc-600">ໃບຢັ້ງຢືນການຂຶ້ນທະບຽນຊົມລົມ &amp; ທີມກິລາພັນທະມິດປະຈຳຮ້ານ</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold">CLUB REG: CLB-{printClub.id.slice(-8).toUpperCase()}</p>
                        <p className="text-[11px] text-zinc-500">ວັນທີອອກໃບ: {new Date().toLocaleDateString("lo-LA")}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                      <div>
                        <p className="text-zinc-500">ຊື່ຊົມລົມ / ທີມກິລາ:</p>
                        <p className="text-base font-bold mt-0.5">{printClub.name}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ປະເພດກິລາຫຼັກ:</p>
                        <p className="text-base font-bold text-amber-700 mt-0.5">{printClub.category || "ກິລາທົ່ວໄປ"}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ຫົວໜ້າທີມ / ຜູ້ປະສານງານ:</p>
                        <p className="font-bold mt-0.5">{printClub.leaderName || "-"}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ເບີໂທລະສັບຕິດຕໍ່:</p>
                        <p className="font-mono font-bold mt-0.5">{printClub.phone || "-"}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ຈຳນວນນັກກິລາໃນສັງກັດ:</p>
                        <p className="font-bold mt-0.5">{printClub.memberCount || 0} ຄົນ</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ສະຖານະການເຄື່ອນໄຫວ:</p>
                        <p className="font-bold text-emerald-700 mt-0.5">
                          {printClub.status === "ACTIVE" ? "ເຄື່ອນໄຫວປົກກະຕິ (ACTIVE)" : "ປິດການເຄື່ອນໄຫວ"}
                        </p>
                      </div>
                    </div>

                    {printClub.description && (
                      <div className="text-xs p-3 rounded-lg border bg-zinc-50">
                        <p className="text-zinc-500 font-semibold mb-1">ລາຍລະອຽດ &amp; ຈຸດປະສົງຊົມລົມ:</p>
                        <p className="text-zinc-800 leading-relaxed">{printClub.description}</p>
                      </div>
                    )}

                    <div className="text-xs text-zinc-600 leading-relaxed border p-3 rounded-lg bg-zinc-50">
                      <p className="font-bold text-zinc-800 mb-1">ຂໍ້ຕົກລົງ &amp; ສິດທິປະໂຫຍດສະເພາະທີມ:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>ໄດ້ຮັບສ່ວນຫຼຸດພິເສດລາຄາທີມສຳລັບການສັ່ງຊື້ອຸປະກອນ, ຊຸດແຂ່ງຂັນ ແລະ ການສ້ອມແປງ.</li>
                        <li>ສິດທິພິເສດໃນການຈອງຄິວສ້ອມແປງດ່ວນ (Priority Repair Service) ກ່ອນການແຂ່ງຂັນ.</li>
                        <li>ສິດທິເຂົ້າຮ່ວມໂຄງການສະໜັບສະໜູນ ແລະ ກິດຈະກຳທົວຣ໌ນາເມັ້ນທີ່ຮ້ານຈັດຂຶ້ນ.</li>
                      </ul>
                    </div>

                    <div className="flex justify-between items-end pt-8 border-t border-zinc-200 text-xs">
                      <div>
                        <p className="text-zinc-500">ລາຍເຊັນຫົວໜ້າທີມ / ຜູ້ຕາງໜ້າ:</p>
                        <div className="h-10 border-b border-zinc-400 w-48 mt-2"></div>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500">ລາຍເຊັນຜູ້ຈັດການຮ້ານ / ຜູ້ຕາງໜ້າ:</p>
                        <div className="h-10 border-b border-zinc-400 w-48 mt-2 ml-auto"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex gap-2.5">
              <button
                type="button"
                onClick={() => setPrintClub(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                ປິດ
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/30"
              >
                <Printer className="w-4 h-4" />
                <span>ພິມອອກ (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
