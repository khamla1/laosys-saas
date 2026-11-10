"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useRef } from "react";
import {
  Gift,
  Plus,
  Search,
  Award,
  Crown,
  Star,
  Trash2,
  Edit2,
  XCircle,
  Loader2,
  TrendingUp,
  Users,
  Sparkles,
  Phone,
  Printer,
  X,
  CreditCard,
  CheckCircle2,
  Coins
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface LoyaltyMember {
  id: string;
  customerName: string;
  phone?: string | null;
  points: number;
  tier: string;
  createdAt: string;
}

export default function LoyaltyPage() {
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LoyaltyMember | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState<LoyaltyMember | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [points, setPoints] = useState("0");
  const [tier, setTier] = useState("BRONZE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Print Modal
  const [printMember, setPrintMember] = useState<LoyaltyMember | null>(null);
  const [printFormat, setPrintFormat] = useState<"slip" | "a4">("slip");
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/dashboard/loyalty");
      const data = await res.json();
      if (res.ok) {
        setMembers(Array.isArray(data) ? data : []);
      } else {
        toast.error("ໂຫລດຂໍ້ມູນສະມາຊິກບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ບໍ່ສາມາດເຊື່ອມຕໍ່ server ໄດ້");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      return toast.error("ກະລຸນາໃສ່ຊື່ລູກຄ້າ / ສະມາຊິກ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        phone: phone.trim() || null,
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
        toast.success(editingItem ? "ອັບເດດສະມາຊິກສຳເລັດ" : "ເພີ່ມສະມາຊິກໃໝ່ສຳເລັດ");
        setShowAddModal(false);
        resetForm();
        fetchMembers();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່");
      }
    } catch {
      toast.error("ບໍ່ສາມາດເຊື່ອມຕໍ່ server ໄດ້");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustPoints = async (id: string, currentPoints: number, delta: number) => {
    if (delta < 0) {
      const confirmed = await askConfirm(
        `ທ່ານຕ້ອງການຫັກແຕ້ມ ${Math.abs(delta)} ແຕ້ມ ແທ້ບໍ່?`,
        {
          title: "ຢືນຢັນການຫັກແຕ້ມສະສົມ",
          confirmText: "ຫັກແຕ້ມ",
          variant: "destructive",
        }
      );
      if (!confirmed) return;
    }

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
            ? `ເພີ່ມ +${delta} ແຕ້ມສຳເລັດ`
            : `ຫັກ ${delta} ແຕ້ມສຳເລັດ`
        );
        fetchMembers();
      } else {
        toast.error("ອັບເດດແຕ້ມບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ບໍ່ສາມາດເຊື່ອມຕໍ່ server ໄດ້");
    }
  };

  const handleRedeemReward = async (member: LoyaltyMember, cost: number, rewardName: string) => {
    if (member.points < cost) {
      return toast.error(`ແຕ້ມບໍ່ພໍ! ຕ້ອງການ ${cost} ແຕ້ມ`);
    }

    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການແລກ "${rewardName}" ໂດຍຫັກ ${cost} ແຕ້ມ ຈາກ ${member.customerName} ແທ້ບໍ່?`,
      {
        title: "ຢືນຢັນການແລກຂອງລາງວັນ",
        confirmText: "ຢືນຢັນແລກ",
        variant: "default",
      }
    );
    if (!confirmed) return;

    try {
      const newPoints = member.points - cost;
      const res = await fetch(`/api/dashboard/loyalty/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: newPoints }),
      });

      if (res.ok) {
        toast.success(`ແລກ "${rewardName}" ສຳເລັດ! ຫັກ -${cost} ແຕ້ມ`);
        setShowRedeemModal(null);
        fetchMembers();
      } else {
        toast.error("ແລກຂອງລາງວັນບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ບໍ່ສາມາດເຊື່ອມຕໍ່ server ໄດ້");
    }
  };

  const handleDelete = async (member: LoyaltyMember) => {
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການລົບສະມາຊິກ "${member.customerName}" ນີ້ແທ້ບໍ່? ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.`,
      {
        title: "ຢືນຢັນການລຶບສະມາຊິກ Loyalty",
        confirmText: "ລຶບຖາວອນ",
        variant: "destructive",
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/loyalty/${member.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລົບສະມາຊິກສຳເລັດ");
        fetchMembers();
      } else {
        toast.error("ລົບສະມາຊິກບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ບໍ່ສາມາດເຊື່ອມຕໍ່ server ໄດ້");
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

  const handlePrint = () => {
    window.print();
  };

  const filteredMembers = members.filter((m) => {
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    const name = (m.customerName || "").toLowerCase();
    const phone = (m.phone || "").toLowerCase();
    const phoneDigits = phone.replace(/\D/g, "");
    const matchSearch =
      !q ||
      name.includes(q) ||
      phone.includes(q) ||
      (qDigits.length >= 3 && phoneDigits.includes(qDigits));
    const matchTier = tierFilter === "ALL" || m.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const totalMembers = members.length;
  const totalPoints = members.reduce((sum, m) => sum + (m.points || 0), 0);
  const vipCount = members.filter((m) => m.tier === "GOLD" || m.tier === "PLATINUM").length;

  const getTierColor = (t: string) => {
    switch (t) {
      case "PLATINUM":
        return "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/40";
      case "GOLD":
        return "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-400 border-yellow-500/40";
      case "SILVER":
        return "bg-gradient-to-r from-zinc-400/20 to-slate-400/20 text-zinc-300 border-zinc-400/40";
      default:
        return "bg-gradient-to-r from-orange-700/20 to-amber-700/20 text-orange-400 border-orange-700/40";
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
              #loyalty-print-wrapper, #loyalty-print-wrapper * { visibility: visible; }
              #loyalty-print-wrapper {
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

      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-600 shadow-lg shadow-pink-500/20 flex items-center justify-center flex-shrink-0">
            <Gift className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
              ລູກຄ້າສະມາຊິກ &amp; ສະສົມແຕ້ມ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30">
                CRM Loyalty
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ຈັດການໂປຣແກຣມສ້າງຄວາມສັດຊື່, ລະດັບ Tier, ແລກຂອງລາງວັນ ແລະ ບັດສະມາຊິກ
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
          href="/dashboard/customers/loyalty"
          className="px-4 py-2 rounded-xl font-bold bg-pink-600 text-white shadow-md shadow-pink-600/20 whitespace-nowrap"
        >
          ສະສົມແຕ້ມ (Loyalty)
        </Link>
        <Link
          href="/dashboard/customers"
          className="px-4 py-2 rounded-xl font-medium bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors whitespace-nowrap"
        >
          ລູກຄ້າທັງໝົດ (Customers)
        </Link>
        <Link
          href="/dashboard/marketing/promotions"
          className="px-4 py-2 rounded-xl font-medium bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors whitespace-nowrap"
        >
          ໂປຣໂມຊັ່ນ (Promotions)
        </Link>
        <Link
          href="/dashboard/coupons"
          className="px-4 py-2 rounded-xl font-medium bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors whitespace-nowrap"
        >
          ຄູປ໋ອງສ່ວນຫຼຸດ (Coupons)
        </Link>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-pink-500/40 transition-all duration-300 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ສະມາຊິກທັງໝົດ
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                {totalMembers.toLocaleString()} <span className="text-sm font-normal text-zinc-500">ຄົນ</span>
              </h3>
            </div>
            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>ລົງທະບຽນໃນລະບົບຮ້ານ</span>
          </p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-yellow-500/40 transition-all duration-300 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ແຕ້ມສະສົມທັງໝົດ</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-yellow-400 mt-2">
                {totalPoints.toLocaleString()} <span className="text-sm font-normal text-zinc-400">pts</span>
              </h3>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400 border border-yellow-500/20">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span>ພ້ອມແລກຮັບສິດທິພິເສດ</span>
          </p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ສະມາຊິກ VIP &amp; Gold
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-2">
                {vipCount.toLocaleString()} <span className="text-sm font-normal text-zinc-500">ຄົນ</span>
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <Crown className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Tier ສູງສຸດຂອງຮ້ານ</span>
          </p>
        </div>
      </div>

      {/* ── Toolbar & Filtering ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80 md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ສະມາຊິກ, ເບີໂທ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-pink-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: "ທັງໝົດ", value: "ALL" },
            { label: "BRONZE", value: "BRONZE" },
            { label: "SILVER", value: "SILVER" },
            { label: "GOLD", value: "GOLD" },
            { label: "PLATINUM", value: "PLATINUM" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setTierFilter(item.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                tierFilter === item.value
                  ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-500/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Members List Grid ── */}
      {isLoading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500 mb-2" />
          <p className="text-zinc-500 text-sm">ກຳລັງໂຫລດຂໍ້ມູນສະມາຊິກ...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-16 h-16 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4 text-zinc-500">
            <Gift className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">ຍັງບໍ່ມີຂໍ້ມູນສະມາຊິກ</h3>
          <p className="text-zinc-500 text-sm mt-1 max-w-sm">
            ກົດປຸ່ມ &ldquo;ເພີ່ມສະມາຊິກໃໝ່&rdquo; ເພື່ອເລີ່ມຕົ້ນໂປຣແກຣມສະສົມແຕ້ມ
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-zinc-900/90 border border-zinc-800/80 hover:border-pink-500/40 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700 flex items-center justify-center font-bold text-lg text-white shadow-inner flex-shrink-0">
                      {member.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-base leading-tight group-hover:text-pink-400 transition-colors truncate">
                        {member.customerName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                        {member.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-zinc-500" />
                            {member.phone}
                          </span>
                        )}
                        <span className="text-zinc-500 font-mono text-[11px]">
                          ID: {member.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getTierColor(
                      member.tier
                    )} flex items-center gap-1 shadow-sm flex-shrink-0`}
                  >
                    {member.tier === "PLATINUM" || member.tier === "GOLD" ? (
                      <Crown className="w-3 h-3" />
                    ) : (
                      <Star className="w-3 h-3" />
                    )}
                    <span>{member.tier}</span>
                  </span>
                </div>

                {/* Points counter card */}
                <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3.5 my-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      ແຕ້ມສະສົມປັດຈຸບັນ
                    </span>
                    <div className="text-2xl font-black text-yellow-400 flex items-center gap-1.5 mt-0.5">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <span>{member.points.toLocaleString()}</span>
                      <span className="text-xs font-normal text-zinc-500">pts</span>
                    </div>
                  </div>

                  {/* Quick Adjust Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAdjustPoints(member.id, member.points, -100)}
                      title="ຫັກ 100 ແຕ້ມ"
                      className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 flex items-center justify-center text-xs font-bold transition-colors"
                    >
                      -100
                    </button>
                    <button
                      onClick={() => handleAdjustPoints(member.id, member.points, 100)}
                      title="ເພີ່ມ 100 ແຕ້ມ"
                      className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 flex items-center justify-center text-xs font-bold transition-colors"
                    >
                      +100
                    </button>
                  </div>
                </div>
              </div>

              {/* Action footer */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 mt-2">
                <button
                  onClick={() => setShowRedeemModal(member)}
                  className="px-3 py-1.5 bg-gradient-to-r from-pink-500/15 to-rose-500/15 hover:from-pink-500/25 hover:to-rose-500/25 text-pink-400 border border-pink-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>ແລກຂອງລາງວັນ</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPrintMember(member)}
                    className="p-2 text-zinc-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors"
                    title="ພິມບັດສະມາຊິກ / ໃບແຈ້ງແຕ້ມ"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(member)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="ແກ້ໄຂສະມາຊິກ"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member)}
                    className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="ລົບສະມາຊິກ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-400" />
                <span>{editingItem ? "ແກ້ໄຂສະມາຊິກ Loyalty" : "ເພີ່ມສະມາຊິກ Loyalty ໃໝ່"}</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ຊື່ລູກຄ້າ / ສະມາຊິກ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ຕົວຢ່າງ: ທ່ານ ສົມສະນິດ ວົງສາ"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ເບີໂທລະສັບຕິດຕໍ່
                </label>
                <input
                  type="tel"
                  placeholder="020 5511 2233"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ແຕ້ມເລີ່ມຕົ້ນ
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-yellow-400 font-bold focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ລະດັບ Tier
                  </label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="BRONZE">BRONZE (0+)</option>
                    <option value="SILVER">SILVER (1,000+)</option>
                    <option value="GOLD">GOLD (2,500+)</option>
                    <option value="PLATINUM">PLATINUM (5,000+)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2.5">
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
                  className="flex-1 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-pink-600/30 active:scale-95"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? "ບັນທຶກການແກ້ໄຂ" : "ບັນທຶກສະມາຊິກ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Redeem Rewards Modal ── */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-pink-400" />
                  <span>ແລກຂອງລາງວັນ / ສ່ວນຫຼຸດ</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {showRedeemModal.customerName} (ມີ {showRedeemModal.points.toLocaleString()} ແຕ້ມ)
                </p>
              </div>
              <button
                onClick={() => setShowRedeemModal(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {[
                { name: "ສ່ວນຫຼຸດ 50,000 ກີບ (Voucher)", cost: 500 },
                { name: "ສ່ວນຫຼຸດ 100,000 ກີບ (Voucher)", cost: 1000 },
                { name: "ຟຣີ ຄ່າແຮງຂຶ້ນເອັນໄມ້ແບັດ / ເທັນນິດ 1 ຄັ້ງ", cost: 350 },
                { name: "ຟຣີ ປ່ຽນຢາງໃນລົດຖີບ / ເຊັກໄລຍະ 1 ຄັ້ງ", cost: 400 },
                { name: "ເສື້ອກິລາທີ່ລະນຶກຂອງຮ້ານ", cost: 1500 },
              ].map((reward, idx) => {
                const canAfford = showRedeemModal.points >= reward.cost;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      canAfford
                        ? "bg-zinc-950/80 border-zinc-800 hover:border-pink-500/40"
                        : "bg-zinc-950/40 border-zinc-800/40 opacity-50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-xs text-white">{reward.name}</p>
                      <p className="text-[11px] text-yellow-400 font-bold mt-0.5">
                        {reward.cost.toLocaleString()} ແຕ້ມ
                      </p>
                    </div>

                    <button
                      disabled={!canAfford}
                      onClick={() => handleRedeemReward(showRedeemModal, reward.cost, reward.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        canAfford
                          ? "bg-pink-600 hover:bg-pink-500 text-white shadow-sm shadow-pink-600/30 active:scale-95"
                          : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      ແລກລາງວັນ
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRedeemModal(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                ປິດ
              </button>
            </div>
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
                  <h3 className="text-sm font-bold text-white">ພິມບັດສະມາຊິກ / ໃບແຈ້ງແຕ້ມ</h3>
                  <p className="text-[11px] text-zinc-400">{printMember.customerName}</p>
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
                  ບິນນ້ອຍ 80mm (Loyalty Slip)
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
                  ໃບໃຫຍ່ A4 (Membership Pass)
                </button>
              </div>
            </div>

            {/* Print Preview Container */}
            <div className="p-6 overflow-y-auto bg-zinc-950 flex justify-center">
              <div
                id="loyalty-print-wrapper"
                ref={printAreaRef}
                className={
                  printFormat === "slip"
                    ? "w-[80mm] p-4 bg-white text-black font-mono text-xs shadow-lg border border-zinc-300"
                    : "w-full max-w-[190mm] p-8 bg-white text-black font-sans shadow-lg border border-zinc-300"
                }
              >
                {printFormat === "slip" ? (
                  /* 80mm Loyalty Points Slip */
                  <div className="space-y-3 text-center">
                    <div className="border-b border-dashed border-zinc-400 pb-2">
                      <h4 className="font-bold text-sm tracking-wide">SPORTS REWARDS &amp; LOYALTY</h4>
                      <p className="text-[10px] text-zinc-600">ໃບແຈ້ງຍອດແຕ້ມສະສົມສະມາຊິກ</p>
                    </div>

                    <div className="text-left space-y-1.5 py-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ລະຫັດສະມາຊິກ:</span>
                        <span className="font-bold font-mono">LY-{printMember.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ຊື່ສະມາຊິກ:</span>
                        <span className="font-bold">{printMember.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ເບີໂທ:</span>
                        <span>{printMember.phone || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ລະດັບ Tier:</span>
                        <span className="font-bold">{printMember.tier}</span>
                      </div>
                    </div>

                    <div className="py-2.5 border-y border-zinc-300 my-1 bg-zinc-50">
                      <p className="text-[10px] text-zinc-600">ແຕ້ມສະສົມຄົງເຫຼືອທັງໝົດ</p>
                      <p className="font-black text-2xl text-black">
                        {printMember.points.toLocaleString()} PTS
                      </p>
                    </div>

                    <div className="border-t border-dashed border-zinc-400 pt-2 text-[10px] text-zinc-500">
                      <p>ແຈ້ງເບີໂທລະສັບທຸກຄັ້ງທີ່ຊື້ສິນຄ້າເພື່ອສະສົມແຕ້ມ</p>
                      <p className="font-mono text-[9px] mt-1">ພິມເມື່ອ: {new Date().toLocaleDateString("lo-LA")}</p>
                    </div>
                  </div>
                ) : (
                  /* A4 Membership Certificate */
                  <div className="space-y-6">
                    <div className="flex justify-between items-start border-b-2 border-zinc-800 pb-4">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight">VIP &amp; LOYALTY MEMBERSHIP CERTIFICATE</h2>
                        <p className="text-xs text-zinc-600">ໃບຢັ້ງຢືນການເປັນສະມາຊິກຄົນສຳຄັນປະຈຳຮ້ານອຸປະກອນກິລາ</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold">MEMBER ID: LY-{printMember.id.slice(-8).toUpperCase()}</p>
                        <p className="text-[11px] text-zinc-500">ວັນທີອອກໃບ: {new Date().toLocaleDateString("lo-LA")}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                      <div>
                        <p className="text-zinc-500">ຊື່ສະມາຊິກ:</p>
                        <p className="text-base font-bold mt-0.5">{printMember.customerName}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ເບີໂທລະສັບ:</p>
                        <p className="text-base font-bold font-mono mt-0.5">{printMember.phone || "-"}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ລະດັບສະມາຊິກ (Tier):</p>
                        <p className="text-base font-black text-pink-700 mt-0.5">{printMember.tier}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ແຕ້ມສະສົມປັດຈຸບັນ:</p>
                        <p className="text-base font-black text-yellow-700 mt-0.5">{printMember.points.toLocaleString()} PTS</p>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-600 leading-relaxed border p-4 rounded-lg bg-zinc-50">
                      <p className="font-bold text-zinc-800 mb-1">ສິດທິປະໂຫຍດສະເພາະລະດັບ {printMember.tier}:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>ຮັບແຕ້ມສະສົມທຸກໆ 10,000 ກີບ ຂອງການໃຊ້ຈ່າຍໃນຮ້ານ.</li>
                        <li>ສິດທິພິເສດໃນການແລກຮັບສ່ວນຫຼຸດ ແລະ ບໍລິການຂຶ້ນເອັນ / ສ້ອມແປງອຸປະກອນກິລາຟຣີ.</li>
                        <li>ໄດ້ຮັບຂອງຂວັນວັນເກີດ ແລະ ສ່ວນຫຼຸດພິເສດໃນເດືອນເກີດສູງສຸດ 15%.</li>
                      </ul>
                    </div>

                    <div className="flex justify-between items-end pt-8 border-t border-zinc-200 text-xs">
                      <div>
                        <p className="text-zinc-500">ລາຍເຊັນສະມາຊິກ:</p>
                        <div className="h-10 border-b border-zinc-400 w-48 mt-2"></div>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500">ລາຍເຊັນຜູ້ຈັດການຮ້ານ / ຜູ້ຮັບຮອງ:</p>
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
