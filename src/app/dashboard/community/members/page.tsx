"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users,
  Plus,
  Search,
  MessageSquare,
  Shield,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  UserX,
  Phone,
  Mail,
  Printer,
  X,
  Award,
  Filter,
  ExternalLink,
  ChevronDown,
  Activity,
  HeartHandshake
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface CommunityMember {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: "MEMBER" | "MODERATOR" | "VIP" | "INSTRUCTOR" | string;
  status: "ACTIVE" | "BANNED" | string;
  category?: string | null;
  points?: number;
  joinedAt?: string;
  createdAt?: string;
}

export default function CommunityMemberPage() {
  const [items, setItems] = useState<CommunityMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dbCategories, setDbCategories] = useState<string[]>([]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CommunityMember | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [status, setStatus] = useState("ACTIVE");
  const [category, setCategory] = useState("ທົ່ວໄປ");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Add Category Modal
  const [showQuickAddCatModal, setShowQuickAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isSavingCat, setIsSavingCat] = useState(false);

  // Print Pass / Member Card Modal
  const [printMember, setPrintMember] = useState<CommunityMember | null>(null);
  const [printFormat, setPrintFormat] = useState<"slip" | "a4">("slip");
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/dashboard/community");
      const data = await res.json();
      if (res.ok) {
        setItems(Array.isArray(data) ? data : []);
      } else {
        toast.error("ບໍ່ສາມາດໂຫລດລາຍຊື່ສະມາຊິກຊຸມຊົນໄດ້");
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
        toast.success(`ເພີ່ມໝວດໝູ່ "${catTitle}" ເຂົ້າລະບົບສຳເລັດ`);
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
    const defaultCats = ["ທົ່ວໄປ", "ແບັດມິນຕັນ", "ລົດຖີບ", "ກອຟ", "ແລ່ນ", "ແຄ້ມປິ້ງ & ເຕັນ", "ຟິດເນັດ"];
    return Array.from(new Set([...defaultCats, ...dbCategories]));
  }, [dbCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ສະມາຊິກ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        role,
        status,
        category,
      };

      const url = editingItem
        ? `/api/dashboard/community/${editingItem.id}`
        : "/api/dashboard/community";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingItem ? "ແກ້ໄຂຂໍ້ມູນສະມາຊິກສຳເລັດ" : "ເພີ່ມສະມາຊິກຊຸມຊົນໃໝ່ສຳເລັດ");
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

  const handleUpdateStatus = async (item: CommunityMember, newStatus: string) => {
    const isBan = newStatus === "BANNED";
    const confirmed = await askConfirm(
      isBan
        ? `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລະງັບສະມາຊິກ "${item.name}"?`
        : `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການປົດລະງັບສະມາຊິກ "${item.name}"?`,
      {
        title: isBan ? "ຢືນຢັນການລະງັບສະມາຊິກ" : "ຢືນຢັນການປົດລະງັບ",
        confirmText: isBan ? "ລະງັບບັນຊີ" : "ເປີດໃຊ້ງານ",
        variant: isBan ? "destructive" : "default",
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/community/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(isBan ? "ລະງັບສະມາຊິກສຳເລັດ" : "ເປີດໃຊ້ງານສະມາຊິກສຳເລັດ");
        fetchItems();
      } else {
        toast.error("ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    }
  };

  const handleDelete = async (item: CommunityMember) => {
    const confirmed = await askConfirm(
      `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບສະມາຊິກ "${item.name}" ອອກຈາກລະບົບ? ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.`,
      {
        title: "ຢືນຢັນການລຶບສະມາຊິກ",
        confirmText: "ລຶບຖາວອນ",
        variant: "destructive",
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/community/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບສະມາຊິກສຳເລັດ");
        fetchItems();
      } else {
        toast.error("ບໍ່ສາມາດລຶບສະມາຊິກໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setRole("MEMBER");
    setStatus("ACTIVE");
    setCategory("ທົ່ວໄປ");
    setEditingItem(null);
  };

  const openEdit = (item: CommunityMember) => {
    setEditingItem(item);
    setName(item.name);
    setPhone(item.phone || "");
    setEmail(item.email || "");
    setRole(item.role || "MEMBER");
    setStatus(item.status || "ACTIVE");
    setCategory(item.category || "ທົ່ວໄປ");
    setShowAddModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered Items
  const filteredItems = items.filter(r => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.email && r.email.toLowerCase().includes(search.toLowerCase())) ||
      (r.phone && r.phone.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === "ALL" || r.role === roleFilter;
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  // KPI calculations
  const totalCount = items.length;
  const activeCount = items.filter(i => i.status === "ACTIVE").length;
  const modCount = items.filter(i => i.role === "MODERATOR" || i.role === "INSTRUCTOR").length;
  const bannedCount = items.filter(i => i.status === "BANNED").length;

  const getRoleBadge = (roleStr: string) => {
    switch (roleStr) {
      case "MODERATOR":
        return { label: "ຜູ້ດູແລ (Moderator)", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
      case "INSTRUCTOR":
        return { label: "ຄູເຝິກ / ໂຄ້ດ (Coach)", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
      case "VIP":
        return { label: "ສະມາຊິກ VIP", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
      default:
        return { label: "ສະມາຊິກທົ່ວໄປ", color: "bg-zinc-800 text-zinc-300 border-zinc-700" };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Print Styles ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden; }
              #community-print-wrapper, #community-print-wrapper * { visibility: visible; }
              #community-print-wrapper {
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
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-600 shadow-lg shadow-pink-500/20 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
              ຄອມມູນິຕີ້ &amp; ສະມາຊິກກິລາ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30">
                CRM Community
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ຈັດການສະມາຊິກຊຸມຊົນ, ຜູ້ດູແລກິດຈະກຳ, ຄູເຝິກ ແລະ ບັດສະມາຊິກ
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-pink-500/20 flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>ເພີ່ມສະມາຊິກໃໝ່</span>
        </button>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Link
          href="/dashboard/community/members"
          className="px-4 py-2 rounded-xl font-bold bg-pink-600 text-white shadow-md shadow-pink-600/20 whitespace-nowrap"
        >
          ສະມາຊິກຊຸມຊົນ (Members)
        </Link>
        <Link
          href="/dashboard/community/events"
          className="px-4 py-2 rounded-xl font-medium bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors whitespace-nowrap"
        >
          ຊົມລົມ &amp; ທີມກິລາ (Clubs &amp; Teams)
        </Link>
        <Link
          href="/dashboard/ambassadors/athletes"
          className="px-4 py-2 rounded-xl font-medium bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors whitespace-nowrap"
        >
          ຕົວແທນຈຳໜ່າຍ &amp; ນັກກິລາ (Dealers)
        </Link>
        <Link
          href="/dashboard/customers"
          className="px-4 py-2 rounded-xl font-medium bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors whitespace-nowrap"
        >
          ລູກຄ້າທັງໝົດ (Customers)
        </Link>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ສະມາຊິກທັງໝົດ</span>
            <div className="text-2xl font-bold text-white tracking-tight">{totalCount} ຄົນ</div>
            <span className="text-[11px] text-zinc-500">ລົງທະບຽນໃນຊຸມຊົນຮ້ານ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ສະຖານະປົກກະຕິ</span>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">{activeCount} ຄົນ</div>
            <span className="text-[11px] text-zinc-500">ພ້ອມເຂົ້າຮ່ວມກິດຈະກຳ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ຜູ້ດູແລ &amp; ຄູເຝິກ</span>
            <div className="text-2xl font-bold text-purple-400 tracking-tight">{modCount} ຄົນ</div>
            <span className="text-[11px] text-zinc-500">Moderator &amp; Coach</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ຖືກລະງັບຊົ່ວຄາວ</span>
            <div className="text-2xl font-bold text-rose-400 tracking-tight">{bannedCount} ຄົນ</div>
            <span className="text-[11px] text-zinc-500">Banned ບໍ່ສາມາດເຂົ້າຮ່ວມ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ສະມາຊິກ, ເບີໂທ, ອີເມວ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-pink-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:border-pink-500"
          >
            <option value="ALL">ບົດບາດທັງໝົດ (All Roles)</option>
            <option value="MEMBER">ສະມາຊິກທົ່ວໄປ (Member)</option>
            <option value="MODERATOR">ຜູ້ດູແລ (Moderator)</option>
            <option value="INSTRUCTOR">ຄູເຝິກ / ໂຄ້ດ (Coach)</option>
            <option value="VIP">ສະມາຊິກ VIP</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:border-pink-500"
          >
            <option value="ALL">ສະຖານະທັງໝົດ</option>
            <option value="ACTIVE">ປົກກະຕິ (Active)</option>
            <option value="BANNED">ຖືກລະງັບ (Banned)</option>
          </select>
        </div>
      </div>

      {/* ── Content Grid ── */}
      {isLoading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500" />
          <p className="text-zinc-500 text-sm mt-3">ກຳລັງໂຫລດຂໍ້ມູນສະມາຊິກ...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-16 h-16 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4 text-zinc-500">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">ບໍ່ພົບລາຍຊື່ສະມາຊິກ</h3>
          <p className="text-zinc-500 text-sm mt-1 max-w-sm">
            ຍັງບໍ່ມີຂໍ້ມູນສະມາຊິກທີ່ກົງກັບເງື່ອນໄຂຄົ້ນຫາ ຄລິກປຸ່ມເພີ່ມສະມາຊິກໃໝ່ເພື່ອເລີ່ມຕົ້ນ
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="mt-4 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ເພີ່ມສະມາຊິກຄົນທຳອິດ</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const roleInfo = getRoleBadge(item.role);
            return (
              <div
                key={item.id}
                className={`bg-zinc-900/80 border ${
                  item.status === "ACTIVE"
                    ? "border-zinc-800 hover:border-pink-500/40"
                    : "border-rose-900/40 bg-rose-950/10"
                } rounded-2xl p-5 transition-all duration-300 flex flex-col shadow-lg`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border ${
                        item.role === "MODERATOR"
                          ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                          : item.role === "INSTRUCTOR"
                          ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                          : "bg-zinc-800/80 text-zinc-300 border-zinc-700/60"
                      }`}
                    >
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                        {item.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-zinc-500" />
                            {item.phone}
                          </span>
                        )}
                        {item.category && (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] text-zinc-300">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                    {item.status === "BANNED" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        ລະງັບການໃຊ້ງານ
                      </span>
                    )}
                  </div>
                </div>

                {item.email && (
                  <div className="text-xs text-zinc-400 flex items-center gap-1.5 mb-3 bg-zinc-950/50 px-3 py-1.5 rounded-xl border border-zinc-800/60">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{item.email}</span>
                  </div>
                )}

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
                      onClick={() => setPrintMember(item)}
                      title="ພິມບັດສະມາຊິກ / ໃບຢັ້ງຢືນ"
                      className="p-2 text-zinc-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      title="ລຶບສະມາຊິກ"
                      className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {item.status === "ACTIVE" ? (
                    <button
                      onClick={() => handleUpdateStatus(item, "BANNED")}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 rounded-lg text-xs font-medium transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>ລະງັບບັນຊີ</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(item, "ACTIVE")}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ປົດລະງັບ</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Member Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                <span>{editingItem ? "ແກ້ໄຂຂໍ້ມູນສະມາຊິກ" : "ເພີ່ມສະມາຊິກຊຸມຊົນໃໝ່"}</span>
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
                  ຊື່ ແລະ ນາມສະກຸນ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="ຕົວຢ່າງ: ທ້າວ ສອນໄຊ ມະນີວົງ"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ເບີໂທລະສັບຕິດຕໍ່
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="020 5511 2233"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ອີເມວ (Email)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="member@sports.la"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Category / Sport with Quick Add Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    ປະເພດກິລາ / ຄວາມສົນໃຈ
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCatModal(true)}
                    className="text-[11px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 bg-pink-500/10 hover:bg-pink-500/20 px-2 py-0.5 rounded-lg border border-pink-500/30 transition-all"
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
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-pink-500"
                >
                  {allCategoryOptions.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" className="text-pink-400 font-bold bg-zinc-900">
                    + ເພີ່ມປະເພດກິລາໃໝ່...
                  </option>
                </select>

                <div className="flex items-center justify-between mt-1.5 text-[11px] text-zinc-500">
                  <span>ຕ້ອງການເພີ່ມປະເພດກິລາອື່ນໆ?</span>
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
                    ບົດບາດໃນຊຸມຊົນ (Role) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-pink-500"
                  >
                    <option value="MEMBER">ສະມາຊິກທົ່ວໄປ (Member)</option>
                    <option value="MODERATOR">ຜູ້ດູແລຊຸມຊົນ (Moderator)</option>
                    <option value="INSTRUCTOR">ຄູເຝິກ / ໂຄ້ດ (Coach)</option>
                    <option value="VIP">ສະມາຊິກ VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ສະຖານະບັນຊີ <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-pink-500"
                  >
                    <option value="ACTIVE">ປົກກະຕິ (Active)</option>
                    <option value="BANNED">ລະງັບຊົ່ວຄາວ (Banned)</option>
                  </select>
                </div>
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
                  className="flex-1 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-pink-600/30 active:scale-95"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? "ບັນທຶກການແກ້ໄຂ" : "ບັນທຶກສະມາຊິກ"}</span>
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
                <Plus className="w-4 h-4 text-pink-400" />
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
                  placeholder="ຕົວຢ່າງ: ບານເຕະ, ປິງປອງ, ໂຍຄະ..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500"
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
                  className="flex-1 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
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
      {printMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-pink-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">ພິມບັດສະມາຊິກ / ໃບຢັ້ງຢືນ</h3>
                  <p className="text-[11px] text-zinc-400">{printMember.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPrintMember(null)}
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
                      ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  ບິນນ້ອຍ 80mm (Member Card)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat("a4")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    printFormat === "a4"
                      ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  ໃບໃຫຍ່ A4 (Official Pass)
                </button>
              </div>
            </div>

            {/* Print Preview Container */}
            <div className="p-6 overflow-y-auto bg-zinc-950 flex justify-center">
              <div
                id="community-print-wrapper"
                ref={printAreaRef}
                className={
                  printFormat === "slip"
                    ? "w-[80mm] p-4 bg-white text-black font-mono text-xs shadow-lg border border-zinc-300"
                    : "w-full max-w-[190mm] p-8 bg-white text-black font-sans shadow-lg border border-zinc-300"
                }
              >
                {printFormat === "slip" ? (
                  /* 80mm Member Card / Slip */
                  <div className="space-y-3 text-center">
                    <div className="border-b border-dashed border-zinc-400 pb-2">
                      <h4 className="font-bold text-sm tracking-wide">SPORTS CLUB COMMUNITY</h4>
                      <p className="text-[10px] text-zinc-600">ບັດສະມາຊິກຊຸມຊົນກິລາ</p>
                    </div>

                    <div className="text-left space-y-1.5 py-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ລະຫັດ:</span>
                        <span className="font-bold font-mono">MB-{printMember.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ຊື່ສະມາຊິກ:</span>
                        <span className="font-bold">{printMember.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ເບີໂທ:</span>
                        <span>{printMember.phone || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ປະເພດກິລາ:</span>
                        <span className="font-semibold">{printMember.category || "ທົ່ວໄປ"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ບົດບາດ:</span>
                        <span className="font-bold">{printMember.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ສະຖານະ:</span>
                        <span className="font-bold">{printMember.status === "ACTIVE" ? "ປົກກະຕິ" : "ລະງັບ"}</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-zinc-400 pt-2 text-[10px] text-zinc-500">
                      <p>ສະແດງບັດນີ້ເພື່ອຮັບສິດທິພິເສດໃນຮ້ານ</p>
                      <p className="font-mono text-[9px] mt-1">ພິມເມື່ອ: {new Date().toLocaleDateString("lo-LA")}</p>
                    </div>
                  </div>
                ) : (
                  /* A4 Certificate / Official Pass */
                  <div className="space-y-6">
                    <div className="flex justify-between items-start border-b-2 border-zinc-800 pb-4">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight">SPORTS COMMUNITY MEMBERSHIP</h2>
                        <p className="text-xs text-zinc-600">ໃບຢັ້ງຢືນການເປັນສະມາຊິກຊຸມຊົນກິລາປະຈຳຮ້ານ</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold">MEMBER ID: MB-{printMember.id.slice(-8).toUpperCase()}</p>
                        <p className="text-[11px] text-zinc-500">ວັນທີອອກບັດ: {new Date().toLocaleDateString("lo-LA")}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                      <div>
                        <p className="text-zinc-500">ຊື່ສະມາຊິກ:</p>
                        <p className="text-base font-bold mt-0.5">{printMember.name}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ເບີໂທລະສັບຕິດຕໍ່:</p>
                        <p className="text-base font-bold mt-0.5 font-mono">{printMember.phone || "-"}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ອີເມວ:</p>
                        <p className="font-medium mt-0.5">{printMember.email || "-"}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ກິລາຫຼັກ / ໝວດໝູ່:</p>
                        <p className="font-bold text-pink-700 mt-0.5">{printMember.category || "ທົ່ວໄປ"}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ຕຳແໜ່ງ / ບົດບາດ:</p>
                        <p className="font-bold mt-0.5">{printMember.role}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ສະຖານະປັດຈຸບັນ:</p>
                        <p className="font-bold text-emerald-700 mt-0.5">{printMember.status === "ACTIVE" ? "ປົກກະຕິ (ACTIVE)" : "ຖືກລະງັບ"}</p>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-600 leading-relaxed border p-3 rounded-lg bg-zinc-50">
                      <p className="font-bold text-zinc-800 mb-1">ເງື່ອນໄຂ &amp; ສິດທິປະໂຫຍດ:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>ສາມາດເຂົ້າຮ່ວມກິດຈະກຳ, ທົວຣ໌ນາເມັ້ນ, ແລະ ການເຝິກຊ້ອມຂອງຊຸມຊົນ.</li>
                        <li>ໄດ້ຮັບສ່ວນຫຼຸດພິເສດສຳລັບອຸປະກອນກິລາ ແລະ ບໍລິການສ້ອມແປງຕາມລະດັບສະມາຊິກ.</li>
                        <li>ກະລຸນາຮັກສາກົດລະບຽບຄວາມປອດໄພ ແລະ ນ້ຳໃຈນັກກິລາຕະຫຼອດການເຂົ້າຮ່ວມ.</li>
                      </ul>
                    </div>

                    <div className="flex justify-between items-end pt-8 border-t border-zinc-200 text-xs">
                      <div>
                        <p className="text-zinc-500">ລາຍເຊັນສະມາຊິກ:</p>
                        <div className="h-10 border-b border-zinc-400 w-44 mt-2"></div>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500">ຜູ້ຈັດການຊຸມຊົນ / ຜູ້ຮັບຮອງ:</p>
                        <div className="h-10 border-b border-zinc-400 w-44 mt-2 ml-auto"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex gap-2.5">
              <button
                type="button"
                onClick={() => setPrintMember(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                ປິດ
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-pink-600/30"
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
