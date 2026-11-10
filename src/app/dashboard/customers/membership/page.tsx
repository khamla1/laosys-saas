"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Search,
  Award,
  Crown,
  Star,
  Trash2,
  Edit,
  Loader2,
  Users,
  Sparkles,
  Printer,
  QrCode,
  ScanLine,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Phone,
  Calendar,
  Gift,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { askConfirm } from "@/components/ConfirmModal";

interface LoyaltyMember {
  id: string;
  customerName: string;
  points: number;
  tier: string;
  createdAt: string;
  cardNumber?: string;
  phone?: string;
}

export default function MembershipCardsPage() {
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [selectedCardForPrint, setSelectedCardForPrint] = useState<LoyaltyMember | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LoyaltyMember | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [points, setPoints] = useState("0");
  const [tier, setTier] = useState("BRONZE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/dashboard/loyalty");
      if (res.ok) {
        const data = await res.json();
        // Enrich data with card numbers if missing
        const enriched = data.map((m: any, idx: number) => ({
          ...m,
          cardNumber: `CARD-${1000 + idx + 1}-${m.id.slice(-4).toUpperCase()}`
        }));
        setMembers(enriched);
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນບັດສະມາຊິກໄດ້ (Failed to load membership cards)");
    } finally {
      setIsLoading(false);
    }
  };

  const generateCardNumber = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `CARD-${random}-${suffix}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ລູກຄ້າ/ສະມາຊິກ (Customer name required)");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName,
        points: Number(points) || 0,
        tier,
      };

      const url = editingItem
        ? `/api/dashboard/loyalty/${editingItem.id}`
        : "/api/dashboard/loyalty";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingItem ? "ອັບເດດຂໍ້ມູນບັດສະມາຊິກສຳເລັດ" : "ອອກບັດສະມາຊິກໃໝ່ສຳເລັດແລ້ວ!");
        setShowAddModal(false);
        resetForm();
        fetchMembers();
      } else {
        const err = await res.json();
        toast.error(err.error || "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustPoints = async (id: string, currentPoints: number, delta: number) => {
    const newPoints = Math.max(0, currentPoints + delta);
    let autoTier = "BRONZE";
    if (newPoints >= 5000) autoTier = "PLATINUM";
    else if (newPoints >= 2500) autoTier = "GOLD";
    else if (newPoints >= 1000) autoTier = "SILVER";

    try {
      const res = await fetch(`/api/dashboard/loyalty/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: newPoints, tier: autoTier }),
      });

      if (res.ok) {
        toast.success(
          delta > 0
            ? `ເພີ່ມຄະແນນ +${delta} ແຕ້ມສຳເລັດ`
            : `ຫັກຄະແນນ ${delta} ແຕ້ມສຳເລັດ`
        );
        fetchMembers();
      }
    } catch (err) {
      toast.error("ປັບປຸງຄະແນນບໍ່ສຳເລັດ");
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm("ທ່ານຕ້ອງການລຶບສະມາຊິກນີ້ແທ້ບໍ່?"))) return;
    try {
      const res = await fetch(`/api/dashboard/loyalty/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບສະມາຊິກສຳເລັດແລ້ວ");
        fetchMembers();
      }
    } catch (err) {
      toast.error("ລຶບບໍ່ສຳເລັດ");
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setPhone("");
    setPoints("0");
    setTier("BRONZE");
    setEditingItem(null);
  };

  const openEdit = (item: LoyaltyMember) => {
    setEditingItem(item);
    setCustomerName(item.customerName);
    setPhone(item.phone || "");
    setPoints(item.points.toString());
    setTier(item.tier);
    setShowAddModal(true);
  };

  const filteredMembers = members.filter((m) => {
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    const name = (m.customerName || "").toLowerCase();
    const card = (m.cardNumber || "").toLowerCase();
    const phone = (m.phone || "").toLowerCase();
    const phoneDigits = phone.replace(/\D/g, "");
    const matchSearch =
      !q ||
      name.includes(q) ||
      card.includes(q) ||
      phone.includes(q) ||
      (qDigits.length >= 3 && phoneDigits.includes(qDigits)) ||
      m.id.toLowerCase().includes(q);
    const matchTier = tierFilter === "ALL" || m.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const getTierGradient = (t: string) => {
    switch (t) {
      case "PLATINUM":
        return "from-slate-900 via-indigo-950 to-purple-900 border-indigo-500/50 shadow-indigo-900/40 text-indigo-200";
      case "GOLD":
        return "from-amber-950 via-amber-900 to-yellow-800 border-amber-500/50 shadow-amber-900/40 text-amber-200";
      case "SILVER":
        return "from-slate-900 via-slate-800 to-zinc-900 border-slate-400/50 shadow-slate-900/40 text-slate-200";
      default: // BRONZE
        return "from-stone-900 via-orange-950 to-zinc-900 border-orange-700/50 shadow-orange-900/30 text-orange-200";
    }
  };

  const getTierBadge = (t: string) => {
    switch (t) {
      case "PLATINUM":
        return { label: "VIP PLATINUM (15% OFF)", icon: Crown, color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" };
      case "GOLD":
        return { label: "VIP GOLD (10% OFF)", icon: Award, color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
      case "SILVER":
        return { label: "SILVER MEMBER (5% OFF)", icon: Star, color: "bg-slate-400/20 text-slate-300 border-slate-400/40" };
      default:
        return { label: "BRONZE MEMBER (3% OFF)", icon: ShieldCheck, color: "bg-orange-500/20 text-orange-300 border-orange-500/40" };
    }
  };

  const handlePrintCard = (m: LoyaltyMember) => {
    setSelectedCardForPrint(m);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/40 border border-zinc-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Multi-Platform Digital Membership Cards</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 shrink-0" />
              <span>ລະບົບຈັດການບັດສະມາຊິກ (Membership Cards)</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-2xl">
              ສ້າງ ພິມ ແລະ ກວດສອບບັດສະມາຊິກດິຈິທັອບ ໃຊ້ງານໄດ້ທຸກແພລດຟອມ (Mobile, Tablet, Desktop) ພ້ອມສ່ວນຫຼຸດອັດຕະໂນມັດໃນໜ້າ POS ແລະ Cashier
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 border border-amber-400/30 transition-all text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ ออกบัตรใหม่ (Issue New Card)</span>
            </Button>

            <Button
              onClick={fetchMembers}
              variant="outline"
              className="border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2.5 rounded-xl text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" /> รีเฟรช
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>ສະມາຊິກທັງໝົດ</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{members.length}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Total Active Cards</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>ຄະແນນສະສົມລວມ</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400">
            {members.reduce((acc, m) => acc + (m.points || 0), 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Total Reward Points</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>ສະມາຊິກ VIP (Gold/Plat)</span>
            <Crown className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-yellow-400">
            {members.filter((m) => m.tier === "GOLD" || m.tier === "PLATINUM").length}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">High Tier Cardholders</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>ສ່ວນຫຼຸດສະມາຊິກ</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400">3% - 15%</p>
          <p className="text-[11px] text-zinc-500 mt-1">Auto POS Tier Discount</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <Input
            placeholder="ຄົ້ນຫາຊື່ສະມາຊິກ, ເລກບັດ, ຫຼື ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-950 border-zinc-800 text-white focus-visible:ring-amber-500 text-sm h-10 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <span className="text-xs text-zinc-400 font-bold shrink-0">ລະດັບບັດ:</span>
          {["ALL", "BRONZE", "SILVER", "GOLD", "PLATINUM"].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                tierFilter === t
                  ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20"
                  : "bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Responsive Display Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
          <p className="text-sm">ກຳລັງໂຫຼດບັດສະມາຊິກ...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6">
          <CreditCard className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">ບໍ່ພົບຂໍ້ມູນບັດສະມາຊິກ</h3>
          <p className="text-xs text-zinc-400 mb-4 max-w-sm mx-auto">
            {search ? `ບໍ່ມີບັດສະມາຊິກທີ່ກົງກັບ "${search}"` : "ຍັງບໍ່ມີຂໍ້ມູນບັດສະມາຊິກໃນລະບົບ ກະລຸນາກົດອອກບັດໃໝ່"}
          </p>
          <Button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs"
          >
            + ออกบัตรแรกของคุณ (Create First Card)
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const badge = getTierBadge(member.tier);
            const BadgeIcon = badge.icon;
            const cardBg = getTierGradient(member.tier);

            return (
              <div
                key={member.id}
                className="group relative flex flex-col justify-between rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 p-5 shadow-xl transition-all hover:shadow-2xl hover:shadow-amber-500/5 duration-300"
              >
                {/* Visual Digital VIP Card */}
                <div
                  className={`relative w-full aspect-[1.58/1] rounded-2xl bg-gradient-to-br ${cardBg} p-5 border shadow-lg overflow-hidden flex flex-col justify-between mb-4 group-hover:scale-[1.02] transition-transform duration-300`}
                >
                  {/* Glassmorphism shine line */}
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />

                  {/* Card Header */}
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest opacity-75">
                        DIGITAL MEMBER CARD
                      </span>
                      <h3 className="text-lg font-black tracking-tight text-white drop-shadow-md">
                        GEE SVN VIP
                      </h3>
                    </div>

                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 ${badge.color}`}>
                      <BadgeIcon className="w-3 h-3" />
                      <span>{member.tier}</span>
                    </div>
                  </div>

                  {/* Card Body: Chip & Card Number */}
                  <div className="relative z-10 my-auto">
                    <div className="flex items-center gap-2 mb-2">
                      {/* Sim Chip */}
                      <div className="w-8 h-6 rounded bg-amber-400/80 border border-amber-200/50 shadow-inner flex items-center justify-center">
                        <div className="w-5 h-3 border-t border-b border-amber-900/40" />
                      </div>
                      <QrCode className="w-5 h-5 opacity-60" />
                    </div>

                    <p className="font-mono text-base sm:text-lg font-bold tracking-wider text-white drop-shadow">
                      {member.cardNumber || `CARD-${member.id.slice(0, 8).toUpperCase()}`}
                    </p>
                  </div>

                  {/* Card Footer: Name & Points */}
                  <div className="flex items-end justify-between relative z-10 pt-2 border-t border-white/10">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-[9px] uppercase font-mono text-zinc-400">Cardholder</p>
                      <p className="text-sm font-black text-white truncate">{member.customerName}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[9px] uppercase font-mono text-zinc-400">Reward Points</p>
                      <p className="text-sm font-black text-amber-400">{member.points.toLocaleString()} PTS</p>
                    </div>
                  </div>
                </div>

                {/* Card Control Actions */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      ອອກມື້ນີ້: {new Date(member.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-emerald-400 font-bold">{badge.label.split("(")[1]?.replace(")", "") || ""}</span>
                  </div>

                  {/* Quick Point Adjust Buttons */}
                  <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80">
                    <span className="text-[11px] font-bold text-zinc-400 px-2">ແຕ້ມ:</span>
                    <button
                      type="button"
                      onClick={() => handleAdjustPoints(member.id, member.points, 100)}
                      className="flex-1 py-1 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-lg border border-emerald-500/30 transition-colors text-center"
                    >
                      +100
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustPoints(member.id, member.points, 500)}
                      className="flex-1 py-1 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs rounded-lg border border-amber-500/30 transition-colors text-center"
                    >
                      +500
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustPoints(member.id, member.points, -100)}
                      className="py-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-lg border border-rose-500/30 transition-colors text-center"
                    >
                      -100
                    </button>
                  </div>

                  {/* Action Toolbar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
                    <Button
                      onClick={() => handlePrintCard(member)}
                      variant="outline"
                      className="flex-1 h-9 text-xs font-bold border-zinc-700 bg-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-700 rounded-xl"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1 text-amber-400" />
                      ພິມບັດ (Print)
                    </Button>

                    <Button
                      onClick={() => openEdit(member)}
                      variant="outline"
                      className="h-9 px-3 text-xs font-bold border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-xl"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      onClick={() => handleDelete(member.id)}
                      variant="outline"
                      className="h-9 px-3 text-xs font-bold border-zinc-800 bg-zinc-900 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 rounded-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Member Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <span>{editingItem ? "ແກ້ໄຂຂໍ້ມູນບັດສະມາຊິກ" : "ອອກບັດສະມາຊິກໃໝ່ (Issue Card)"}</span>
            </h2>
            <p className="text-xs text-zinc-400 mb-6">
              ປ້ອນຊື່ ແລະ ລະດັບບັດເພື່ອຮັບສ່ວນຫຼຸດອັດຕະໂນມັດໃນລະບົບ
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">
                  ຊື່-ນາມສະກຸນ ສະມາຊິກ (Customer Name) *
                </label>
                <Input
                  required
                  placeholder="ປ້ອນຊື່ ແລະ ນາມສະກຸນ..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white text-sm h-11 rounded-xl focus-visible:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">
                  ເບີໂທຕິດຕໍ່ (Phone Number)
                </label>
                <Input
                  placeholder="020 XXXXXXXX..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white text-sm h-11 rounded-xl focus-visible:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 mb-1.5 block">
                    ຄະແນນເລີ່ມຕົ້ນ (Points)
                  </label>
                  <Input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-amber-400 font-bold text-sm h-11 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 mb-1.5 block">
                    ລະດັບບັດ (Tier)
                  </label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm h-11 rounded-xl px-3 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="BRONZE">BRONZE (3% Off)</option>
                    <option value="SILVER">SILVER (5% Off)</option>
                    <option value="GOLD">GOLD (10% Off)</option>
                    <option value="PLATINUM">PLATINUM (15% Off)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 h-11 rounded-xl text-sm font-bold"
                >
                  ຍົກເລີກ
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold h-11 rounded-xl text-sm shadow-lg shadow-amber-500/20"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "ບັນທຶກບັດ"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Print Card Badge Layout */}
      {selectedCardForPrint && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[9999]">
          <div className="max-w-md mx-auto border-2 border-black p-6 rounded-2xl text-center space-y-4">
            <h2 className="text-2xl font-black tracking-wider uppercase">GEE SVN VIP MEMBERSHIP</h2>
            <p className="text-xs font-mono">OFFICIAL DIGITAL MEMBER CARD</p>

            <div className="my-6 p-4 border border-black rounded-xl">
              <p className="text-xs font-bold uppercase">CARDHOLDER</p>
              <h3 className="text-xl font-bold">{selectedCardForPrint.customerName}</h3>
              <p className="text-sm font-mono mt-1 font-bold">
                {selectedCardForPrint.cardNumber || `CARD-${selectedCardForPrint.id.slice(0, 8).toUpperCase()}`}
              </p>
            </div>

            <div className="flex justify-between items-center text-sm font-bold border-t border-black pt-4">
              <span>TIER: {selectedCardForPrint.tier}</span>
              <span>POINTS: {selectedCardForPrint.points} PTS</span>
            </div>
            <p className="text-[10px] text-zinc-600 mt-4">Thank you for being a valued member!</p>
          </div>
        </div>
      )}
    </div>
  );
}
