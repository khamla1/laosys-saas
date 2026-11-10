"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useRef } from "react";
import {
  Tag,
  Plus,
  Search,
  BadgePercent,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Edit2,
  XCircle,
  Loader2,
  TrendingUp,
  Sparkles,
  Ticket,
  Copy,
  Layers,
  Printer,
  X,
  ExternalLink,
  Gift,
  Users,
  Camera
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { CouponManager } from "@/components/CouponManager";
import { CameraScannerModal } from "@/components/CameraScannerModal";
import {
  BillVerifyResultCard,
  BillVerifyResultData,
  formatTimeDiffLao,
  formatDateTimeLaoStandard,
} from "@/components/BillVerifyResultCard";

interface Promotion {
  id: string;
  name: string;
  code?: string | null;
  discountValue: number;
  type: string; // PERCENTAGE, FIXED
  startDate: string;
  endDate: string;
  status: string; // ACTIVE, INACTIVE, EXPIRED
  createdAt?: string;
  applicableProductIds?: string[];
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeHubTab, setActiveHubTab] = useState<"promotions" | "coupons">("coupons");
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [inspectedPromoResult, setInspectedPromoResult] = useState<BillVerifyResultData | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "promotions") {
        setActiveHubTab("promotions");
      } else {
        setActiveHubTab("coupons");
      }
    }
  }, []);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Promotion | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [discountValue, setDiscountValue] = useState("10");
  const [type, setType] = useState("PERCENTAGE");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product Scope Targeting
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [applyToAllProducts, setApplyToAllProducts] = useState(true);
  const [searchProduct, setSearchProduct] = useState("");

  // Real-time Code Validity Checker State
  const [checkCodeInput, setCheckCodeInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<any | null>(null);

  // Print Modal
  const [printPromo, setPrintPromo] = useState<Promotion | null>(null);
  const [printFormat, setPrintFormat] = useState<"slip" | "a4">("slip");
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?includeAllStatuses=true&limit=250");
      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data) ? data : data.products || [];
        setProducts(list);
      }
    } catch {
      // ignore
    }
  };

  const fetchPromotions = async () => {
    try {
      const res = await fetch("/api/dashboard/promotions");
      const data = await res.json();
      if (res.ok) {
        setPromotions(Array.isArray(data) ? data : []);
      } else {
        toast.error("ບໍ່ສາມາດໂຫລດລາຍການໂປຣໂມຊັ່ນໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomPromoCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "PROMO";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleCheckCode = async (overrideCode?: string) => {
    const q = (overrideCode || checkCodeInput).trim().toUpperCase();
    if (!q) {
      toast.error("ກະລຸນາປ້ອນລະຫັດທີ່ຕ້ອງການກວດສອບ");
      return;
    }
    if (overrideCode) setCheckCodeInput(overrideCode);
    setIsChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch(`/api/dashboard/promotions/check?code=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok) {
        setCheckResult(data);
        if (data.valid) {
          toast.success(`ລະຫັດ "${q}" ພ້ອມໃຊ້ງານໄດ້ປົກກະຕິ`);
        } else if (data.found) {
          toast.warning(`ລະຫັດ "${q}" ບໍ່ສາມາດໃຊ້ໄດ້: ${data.reason}`);
        } else {
          toast.error(data.reason || `ບໍ່ພົບລະຫັດ "${q}"`);
        }
      } else {
        toast.error(data.error || "ເກີດຂໍ້ຜິດພາດໃນການກວດສອບ");
      }
    } catch {
      toast.error("ບໍ່ສາມາດເຊື່ອມຕໍ່ລະບົບກວດສອບໄດ້");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ໂປຣໂມຊັ່ນ");
    }
    if (!applyToAllProducts && selectedProducts.length === 0) {
      return toast.error("ກະລຸນາເລືອກຢ່າງໜ້ອຍ 1 ສິນຄ້າ ຫຼື ເລືອກ 'ທຸກສິນຄ້າໃນຮ້ານ'");
    }

    setIsSubmitting(true);
    try {
      const cleanCode = code.trim() ? code.trim().toUpperCase() : name.replace(/\s+/g, "").toUpperCase().slice(0, 12);
      const payload = {
        name: name.trim(),
        code: cleanCode,
        discountValue: Number(discountValue) || 0,
        type,
        startDate,
        endDate,
        status,
        applicableProductIds: applyToAllProducts ? [] : selectedProducts,
      };

      const url = editingItem
        ? `/api/dashboard/promotions/${editingItem.id}`
        : "/api/dashboard/promotions";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingItem ? "ແກ້ໄຂໂປຣໂມຊັ່ນສຳເລັດ" : "ສ້າງໂປຣໂມຊັ່ນໃໝ່ສຳເລັດ");
        setShowAddModal(false);
        resetForm();
        fetchPromotions();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "ບໍ່ສາມາດບັນທຶກໂປຣໂມຊັ່ນໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: Promotion) => {
    const nextStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const isDeactivating = nextStatus === "INACTIVE";

    const confirmed = await askConfirm(
      isDeactivating
        ? `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການປິດໃຊ້ງານໂປຣໂມຊັ່ນ "${item.name}"?`
        : `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການເປີດໃຊ້ງານໂປຣໂມຊັ່ນ "${item.name}" ຄືນໃໝ່?`,
      {
        title: isDeactivating ? "ຢືນຢັນປິດໂປຣໂມຊັ່ນ" : "ຢືນຢັນເປີດໂປຣໂມຊັ່ນ",
        confirmText: isDeactivating ? "ປິດໃຊ້ງານ" : "ເປີດໃຊ້ງານ",
        variant: isDeactivating ? "destructive" : "default",
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/promotions/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        toast.success(
          nextStatus === "ACTIVE"
            ? `ເປີດໃຊ້ງານໂປຣໂມຊັ່ນ "${item.name}" ສຳເລັດ`
            : `ປິດໃຊ້ງານໂປຣໂມຊັ່ນ "${item.name}" ແລ້ວ`
        );
        fetchPromotions();
      } else {
        toast.error("ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    }
  };

  const handleDelete = async (item: Promotion) => {
    const confirmed = await askConfirm(
      `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບໂປຣໂມຊັ່ນ "${item.name}" ອອກຈາກລະບົບ? ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.`,
      {
        title: "ຢືນຢັນການລຶບໂປຣໂມຊັ່ນ",
        confirmText: "ລຶບຖາວອນ",
        variant: "destructive",
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/promotions/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບໂປຣໂມຊັ່ນສຳເລັດ");
        fetchPromotions();
      } else {
        toast.error("ບໍ່ສາມາດລຶບໂປຣໂມຊັ່ນໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    }
  };

  const resetForm = () => {
    setName("");
    setCode("");
    setDiscountValue("10");
    setType("PERCENTAGE");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setStatus("ACTIVE");
    setSelectedProducts([]);
    setApplyToAllProducts(true);
    setSearchProduct("");
    setEditingItem(null);
  };

  const openEdit = (item: Promotion) => {
    setEditingItem(item);
    setName(item.name);
    setCode(item.code || "");
    setDiscountValue(item.discountValue.toString());
    setType(item.type);
    setStartDate(item.startDate.slice(0, 10));
    setEndDate(item.endDate.slice(0, 10));
    setStatus(item.status);
    const prodIds = Array.isArray(item.applicableProductIds) ? item.applicableProductIds : [];
    setSelectedProducts(prodIds);
    setApplyToAllProducts(prodIds.length === 0);
    setSearchProduct("");
    setShowAddModal(true);
  };

  const copyCampaignCode = (codeName: string) => {
    const code = codeName.replace(/\s+/g, "").toUpperCase();
    navigator.clipboard.writeText(code);
    toast.success(`ຄັດລອກລະຫັດ "${code}" ສຳເລັດແລ້ວ!`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredPromotions = promotions.filter((p) => {
    const codeStr = String(p.code || p.name || "");
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      codeStr.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const buildPromoInspectionResult = (p: Promotion): BillVerifyResultData => {
    const now = new Date();
    const startDt = p.startDate ? new Date(p.startDate) : null;
    const endDt = p.endDate ? new Date(p.endDate) : null;
    const promoCode = (p.code || p.name.replace(/\s+/g, "")).toUpperCase();
    const diffEndMs = endDt && !isNaN(endDt.getTime()) ? endDt.getTime() - now.getTime() : 0;
    const isExpired = p.status === "EXPIRED" || (endDt && !isNaN(endDt.getTime()) ? diffEndMs < 0 : false);
    const isUpcoming = startDt && !isNaN(startDt.getTime()) ? startDt.getTime() > now.getTime() : false;
    const discountStr =
      p.type === "PERCENTAGE"
        ? `ຫຼຸດ ${p.discountValue}%`
        : `ຫຼຸດ ₭${Number(p.discountValue || 0).toLocaleString()}`;

    if (p.status === "INACTIVE") {
      return {
        billCode: promoCode,
        billTypeLabel: "ແຄມເປນໂປຣໂມຊັ່ນ (Promotion)",
        statusState: "CANCELLED",
        headline: "ໂປຣໂມຊັ່ນນີ້ຖືກປິດໃຊ້ງານຢູ່! (Inactive)",
        subheadline: `ແຄມເປນ "${p.name}" (${discountStr}) ຖືກປິດໃຊ້ງານຊົ່ວຄາວ`,
        customerName: "ສຳລັບລູກຄ້າທົ່ວໄປ",
        itemName: `${p.name} • ${discountStr}`,
        startLabel: "ວັນທີເລີ່ມໂປຣໂມຊັ່ນ",
        startValue: startDt ? formatDateTimeLaoStandard(startDt) : p.startDate,
        endLabel: "ວັນທີສິ້ນສຸດໂປຣໂມຊັ່ນ",
        endValue: endDt ? formatDateTimeLaoStandard(endDt) : p.endDate,
        timeRemainingText: "ປິດໃຊ້ງານຊົ່ວຄາວ",
        amountLabel: "ມູນຄ່າສ່ວນຫຼຸດ",
        amountValue: discountStr,
        actions: [
          {
            label: "ເປີດໃຊ້ງານຄືນໃໝ່",
            onClick: () => handleToggleStatus(p),
            variant: "emerald",
          },
        ],
      };
    }

    if (isExpired) {
      return {
        billCode: promoCode,
        billTypeLabel: "ແຄມເປນໂປຣໂມຊັ່ນ (Promotion)",
        statusState: "EXPIRED",
        headline: "ໂປຣໂມຊັ່ນນີ້ໝົດອາຍຸແລ້ວ! (ກາຍກຳນົດແຄມເປນ)",
        subheadline: `ແຄມເປນ "${p.name}" (${discountStr}) ໝົດກຳນົດຕັ້ງແຕ່ ${endDt ? formatDateTimeLaoStandard(endDt) : p.endDate}`,
        customerName: "ສຳລັບລູກຄ້າທົ່ວໄປ",
        itemName: `${p.name} • ${discountStr}`,
        startLabel: "ວັນທີເລີ່ມໂປຣໂມຊັ່ນ",
        startValue: startDt ? formatDateTimeLaoStandard(startDt) : p.startDate,
        endLabel: "ວັນໝົດອາຍຸໂປຣໂມຊັ່ນ",
        endValue: endDt ? formatDateTimeLaoStandard(endDt) : p.endDate,
        timeRemainingText: `ໝົດອາຍຸມາແລ້ວ ${formatTimeDiffLao(diffEndMs)}`,
        amountLabel: "ມູນຄ່າສ່ວນຫຼຸດ",
        amountValue: discountStr,
        actions: [
          {
            label: "ແກ້ໄຂ / ຕໍ່ອາຍຸແຄມເປນ",
            onClick: () => openEdit(p),
            variant: "danger",
          },
        ],
      };
    }

    if (isUpcoming && startDt) {
      return {
        billCode: promoCode,
        billTypeLabel: "ແຄມເປນໂປຣໂມຊັ່ນ (Promotion)",
        statusState: "UPCOMING",
        headline: "ໂປຣໂມຊັ່ນນີ້ຍັງບໍ່ເຖິງວັນເລີ່ມຕົ້ນ (ຍັງບໍ່ໝົດອາຍຸ)",
        subheadline: `ແຄມເປນ "${p.name}" (${discountStr}) ຈະເລີ່ມໃຊ້ໄດ້ໃນວັນທີ ${formatDateTimeLaoStandard(startDt)}`,
        customerName: "ສຳລັບລູກຄ້າທົ່ວໄປ",
        itemName: `${p.name} • ${discountStr}`,
        startLabel: "ວັນທີເລີ່ມໂປຣໂມຊັ່ນ",
        startValue: formatDateTimeLaoStandard(startDt),
        endLabel: "ວັນທີສິ້ນສຸດໂປຣໂມຊັ່ນ",
        endValue: endDt ? formatDateTimeLaoStandard(endDt) : p.endDate,
        timeRemainingText: `ອີກ ${formatTimeDiffLao(startDt.getTime() - now.getTime())} ຈະເລີ່ມແຄມເປນ`,
        amountLabel: "ມູນຄ່າສ່ວນຫຼຸດ",
        amountValue: discountStr,
        actions: [
          {
            label: "ແກ້ໄຂແຄມເປນ",
            onClick: () => openEdit(p),
            variant: "primary",
          },
        ],
      };
    }

    return {
      billCode: promoCode,
      billTypeLabel: "ແຄມເປນໂປຣໂມຊັ່ນ (Promotion)",
      statusState: "VALID",
      headline: "ໂປຣໂມຊັ່ນນີ້ຍັງບໍ່ໝົດອາຍຸ (ພ້ອມໃຊ້ງານປົກກະຕິ)",
      subheadline: `ແຄມເປນ "${p.name}" (${discountStr}) ຍັງຢູ່ໃນໄລຍະເວລາໂປຣໂມຊັ່ນ`,
      customerName: "ສຳລັບລູກຄ້າທົ່ວໄປ",
      itemName: `${p.name} • ${discountStr}`,
      startLabel: "ວັນທີເລີ່ມໂປຣໂມຊັ່ນ",
      startValue: startDt ? formatDateTimeLaoStandard(startDt) : p.startDate,
      endLabel: "ໃຊ້ໄດ້ຮອດວັນທີ",
      endValue: endDt ? formatDateTimeLaoStandard(endDt) : p.endDate,
      timeRemainingText: endDt ? `ຍັງເຫຼືອເວລາອີກ ${formatTimeDiffLao(diffEndMs)}` : "ຍັງບໍ່ໝົດອາຍຸ",
      amountLabel: "ມູນຄ່າສ່ວນຫຼຸດ",
      amountValue: discountStr,
      actions: [
        {
          label: "ຄັດລອກລະຫັດ",
          onClick: () => copyCampaignCode(promoCode),
          variant: "emerald",
        },
        {
          label: "ພິມໃບປິວ / ບັດຄູປອງ",
          onClick: () => setPrintPromo(p),
          variant: "secondary",
        },
      ],
    };
  };

  const handleInspectPromoByQuery = (rawQuery: string) => {
    const clean = rawQuery.trim();
    if (!clean) {
      toast.error("ກະລຸນາປ້ອນ ຫຼື ສະແກນລະຫັດໂປຣໂມຊັ່ນ ເພື່ອກວດສອບວັນໝົດອາຍຸ");
      return;
    }
    setSearch(clean);
    setStatusFilter("ALL");
    handleCheckCode(clean);
    const qLower = clean.toLowerCase();
    const matches = promotions.filter((p) => {
      const codeStr = String(p.code || p.name || "").replace(/\s+/g, "").toLowerCase();
      return p.name.toLowerCase().includes(qLower) || codeStr.includes(qLower);
    });
    if (matches.length > 0) {
      const result = buildPromoInspectionResult(matches[0]);
      setInspectedPromoResult(result);
    }
  };

  // Summary statistics
  const activeCount = promotions.filter((p) => p.status === "ACTIVE").length;
  const totalCount = promotions.length;
  const avgDiscount =
    totalCount > 0
      ? Math.round(
          promotions.reduce((sum, p) => sum + (p.discountValue || 0), 0) / totalCount
        )
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Print Styles ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden; }
              #promo-print-wrapper, #promo-print-wrapper * { visibility: visible; }
              #promo-print-wrapper {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 p-5 rounded-3xl border border-zinc-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 shadow-xl shadow-violet-500/20 flex items-center justify-center flex-shrink-0">
            <BadgePercent className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 flex-wrap">
              ສູນໂປຣໂມຊັ່ນ &amp; ຄູປອງສ່ວນຫຼຸດ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30">
                Marketing Hub
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-xs sm:text-sm">
              ສູນລວມການຈັດການແຄມເປນໂປຣໂມຊັ່ນຫຼຸດລາຄາທົ່ວຮ້ານ ແລະ ລະຫັດຄູປອງ (Promo Codes) ສຳລັບ POS &amp; ອອນລາຍ
            </p>
          </div>
        </div>

        {activeHubTab === "promotions" && (
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>ເພີ່ມໂປຣໂມຊັ່ນໃໝ່</span>
          </button>
        )}
      </div>

      {/* ── All-in-One Marketing Hub Main Switcher Tabs ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 overflow-x-auto pb-1 text-xs border-b border-zinc-800">
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Tab 1: Coupon Codes (With product selector & promo codes) */}
          <button
            onClick={() => {
              setActiveHubTab("coupons");
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.set("tab", "coupons");
                window.history.replaceState({}, "", url.toString());
              }
            }}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeHubTab === "coupons"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20"
                : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800"
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>ລະຫັດຄູປອງສ່ວນຫຼຸດ (Coupon Codes)</span>
          </button>

          {/* Tab 2: Store Promotions */}
          <button
            onClick={() => {
              setActiveHubTab("promotions");
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.set("tab", "promotions");
                window.history.replaceState({}, "", url.toString());
              }
            }}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeHubTab === "promotions"
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/20"
                : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800"
            }`}
          >
            <BadgePercent className="w-4 h-4" />
            <span>ແຄມເປນໂປຣໂມຊັ່ນ (Store Promotions)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
              {promotions.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <Link
            href="/dashboard/customers/loyalty"
            className="px-3.5 py-2 rounded-xl font-medium bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <Gift className="w-3.5 h-3.5 text-pink-400" />
            <span>ສະສົມແຕ້ມ (Loyalty)</span>
          </Link>
          <Link
            href="/dashboard/community/members"
            className="px-3.5 py-2 rounded-xl font-medium bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>ຊຸມຊົນກິລາ (Community)</span>
          </Link>
        </div>
      </div>

      {activeHubTab === "promotions" ? (
        <>
        {/* Feature Announcement: Both Promotions and Coupons now support specific products selection */}
        <div
          className="bg-gradient-to-r from-violet-950/50 via-purple-950/40 to-indigo-950/50 border border-violet-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-violet-500/20 text-violet-300 rounded-2xl border border-violet-500/40 shrink-0 shadow-lg shadow-violet-500/10">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-white">
                  ຮອງຮັບການເລືອກສິນຄ້າເຈາະຈົງໄດ້ທັງ ໂປຣໂມຊັ່ນ ແລະ ຄູປອງສ່ວນຫຼຸດ!
                </p>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ພ້ອມໃຊ້ງານແລ້ວ
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1">
                ທ່ານສາມາດກຳນົດສ່ວນຫຼຸດ <strong>"ທຸກສິນຄ້າໃນຮ້ານ"</strong> ຫຼື <strong>"ເລືອກສະເພາະບາງສິນຄ້າ"</strong> ໄດ້ທັງສອງລະບົບ ຕາມທີ່ຕ້ອງການ.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/25 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ສ້າງໂປຣໂມຊັ່ນ</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveHubTab("coupons");
                if (typeof window !== "undefined") {
                  const url = new URL(window.location.href);
                  url.searchParams.set("tab", "coupons");
                  window.history.replaceState({}, "", url.toString());
                }
              }}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all border border-zinc-800 flex items-center gap-1.5"
            >
              <Ticket className="w-3.5 h-3.5 text-blue-400" />
              <span>ສະຫຼັບໄປທີ່ຄູປອງ</span>
            </button>
          </div>
        </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/40 transition-all duration-300 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ໂປຣໂມຊັ່ນທີ່ກຳລັງໃຊ້ງານ
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                {activeCount} <span className="text-sm font-normal text-zinc-500">/ {totalCount} ແຄມເປນ</span>
              </h3>
            </div>
            <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Active ໃນລະບົບຂາຍ</span>
          </p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ສ່ວນຫຼຸດສະເລ່ຍ (Avg Discount)
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
                {avgDiscount}
                <span className="text-lg font-normal text-zinc-400"> % / ກີບ</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>ຊ່ວຍກະຕຸ້ນຍອດຂາຍສິນຄ້າ</span>
          </p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ໂປຣໂມຊັ່ນທັງໝົດໃນຮ້ານ
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-2">
                {totalCount} <span className="text-sm font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <Ticket className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>ປະຫວັດແຄມເປນທັງໝົດ</span>
          </p>
        </div>
      </div>

      {/* ── Real-time Code Validity Checker Widget ── */}
      <div className="bg-gradient-to-r from-zinc-900/90 via-violet-950/20 to-zinc-900/90 border border-violet-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>ກວດສອບສະຖານະລະຫັດແຄມເປນ (Check Code Validity)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  ເຊັກໄດ້ທັນທີ
                </span>
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                ປ້ອນລະຫັດແຄມເປນ ຫຼື ໂຄ້ດສ່ວນຫຼຸດ ເພື່ອກວດສອບວ່າ "ຍັງໃຊ້ໄດ້ຢູ່ບໍ່", ເຫຼືອຈັກວັນ, ແລະ ໄດ້ສ່ວນຫຼຸດເທົ່າໃດ
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="ປ້ອນ ຫຼື ສະແກນລະຫັດແຄມເປນ / ຄູປອງ... (ຕົວຢ່າງ: SUMMER2026, FLASH10)"
              value={checkCodeInput}
              onChange={(e) => setCheckCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleInspectPromoByQuery(checkCodeInput)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white font-mono uppercase placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => handleInspectPromoByQuery(checkCodeInput)}
            disabled={isChecking}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-violet-500/20 flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>ກວດສອບ</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/20 shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">ກ້ອງສະແກນ</span>
          </button>
        </div>

        {/* Check Result Card */}
        {checkResult && (
          <div
            className={`p-4 rounded-xl border animate-in fade-in duration-200 ${
              checkResult.valid
                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                : checkResult.found
                ? "bg-amber-950/30 border-amber-500/40 text-amber-200"
                : "bg-rose-950/30 border-rose-500/40 text-rose-200"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl border mt-0.5 shrink-0 ${
                    checkResult.valid
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : checkResult.found
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                      : "bg-rose-500/20 border-rose-500/40 text-rose-400"
                  }`}
                >
                  {checkResult.valid ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : checkResult.found ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-black/40 border border-white/10 text-white">
                      {checkResult.code || checkCodeInput}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        checkResult.valid
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      }`}
                    >
                      {checkResult.valid ? "ໃຊ້ໄດ້ປົກກະຕິ (Valid & Active)" : "ບໍ່ສາມາດໃຊ້ໄດ້ໃນຕອນນີ້"}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-white/90">
                    {checkResult.reason}
                  </p>

                  {checkResult.found && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 mt-2 border-t border-white/10 text-[11px]">
                      <div>
                        <span className="text-zinc-400 block">ຊື່ແຄມເປນ:</span>
                        <span className="font-bold text-white truncate block">{checkResult.name}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block">ມູນຄ່າສ່ວນຫຼຸດ:</span>
                        <span className="font-black text-emerald-400">
                          {checkResult.type === "PERCENTAGE"
                            ? `${checkResult.discountValue}% OFF`
                            : `₭${Number(checkResult.discountValue || 0).toLocaleString()}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block">ວັນທີສິ້ນສຸດ:</span>
                        <span className="text-white font-mono">
                          {checkResult.endDate ? checkResult.endDate.slice(0, 10) : "ບໍ່ມີກຳນົດ"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block">ອາຍຸການໃຊ້ງານ:</span>
                        <span className="font-bold text-violet-300">
                          {checkResult.daysRemaining !== null
                            ? `ຍັງເຫຼືອ ${checkResult.daysRemaining} ວັນ`
                            : "-"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCheckResult(null)}
                className="text-zinc-400 hover:text-white p-1"
                title="ປິດ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar & Filtering ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="ພິມ ຫຼື ສະແກນລະຫັດແຄມເປນ / ຊື່ໂປຣໂມຊັ່ນ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!e.target.value.trim()) setInspectedPromoResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim()) {
                  e.preventDefault();
                  handleInspectPromoByQuery(search);
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => handleInspectPromoByQuery(search)}
            className="px-3.5 py-2.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0"
          >
            ກວດສອບໂປຣ
          </button>
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 whitespace-nowrap shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">ກ້ອງສະແກນ</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: "ທັງໝົດ (All)", value: "ALL" },
            { label: "ກຳລັງໃຊ້ງານ (Active)", value: "ACTIVE" },
            { label: "ປິດໃຊ້ງານ (Inactive)", value: "INACTIVE" },
            { label: "ໝົດອາຍຸ (Expired)", value: "EXPIRED" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === item.value
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Promotion Status & Expiry Verification Banner ── */}
      {(() => {
        const activeResult =
          inspectedPromoResult ||
          (search.trim() && filteredPromotions.length === 1
            ? buildPromoInspectionResult(filteredPromotions[0])
            : null);
        if (!activeResult) return null;
        return (
          <BillVerifyResultCard
            data={activeResult}
            onClear={() => {
              setInspectedPromoResult(null);
              setSearch("");
            }}
          />
        );
      })()}

      {/* ── Promotions Grid ── */}
      {isLoading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-500 mb-2" />
          <p className="text-zinc-500 text-sm">ກຳລັງໂຫລດຂໍ້ມູນໂປຣໂມຊັ່ນ...</p>
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-16 h-16 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4 text-zinc-500">
            <BadgePercent className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">ບໍ່ພົບລາຍການໂປຣໂມຊັ່ນ</h3>
          <p className="text-zinc-500 text-sm mt-1 max-w-sm">
            ຍັງບໍ່ມີໂປຣໂມຊັ່ນທີ່ກົງກັບເງື່ອນໄຂ ຄລິກປຸ່ມເພີ່ມໂປຣໂມຊັ່ນໃໝ່ເພື່ອສ້າງສ່ວນຫຼຸດໃຫ້ລູກຄ້າ
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ສ້າງໂປຣໂມຊັ່ນທຳອິດ</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPromotions.map((promo) => {
            const now = new Date();
            const startDate = promo.startDate ? new Date(promo.startDate) : null;
            const endDate = promo.endDate ? new Date(promo.endDate) : null;
            const isStarted = !startDate || startDate <= now;
            const isExpired = Boolean(endDate && endDate < now);
            const isValid = promo.status === "ACTIVE" && isStarted && !isExpired;
            const promoCode = promo.code || promo.name.replace(/\s+/g, "").toUpperCase();

            let daysRemaining: number | null = null;
            if (endDate && endDate >= now) {
              daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            }

            return (
              <div
                key={promo.id}
                className={`bg-zinc-900/90 border ${
                  isValid
                    ? "border-zinc-800/80 hover:border-emerald-500/40"
                    : promo.status === "ACTIVE"
                    ? "border-zinc-800/80 hover:border-violet-500/40"
                    : "border-zinc-800/60 bg-zinc-950/40 opacity-75"
                } rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between group shadow-lg relative overflow-hidden`}
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isValid
                      ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500"
                      : isExpired
                      ? "bg-rose-600"
                      : promo.status === "ACTIVE"
                      ? "bg-amber-500"
                      : "bg-zinc-700"
                  }`}
                />

                <div>
                  {/* Top Status & Usability Row */}
                  <div className="flex items-center justify-between mb-3 mt-1">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border flex items-center gap-1.5 ${
                        isValid
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : isExpired
                          ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                          : !isStarted
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {isValid && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      <span>
                        {isValid
                          ? "ໃຊ້ໄດ້ (ພ້ອມໃຊ້ງານ)"
                          : isExpired
                          ? "ໝົດອາຍຸແລ້ວ"
                          : !isStarted
                          ? "ຍັງບໍ່ຮອດກຳນົດ"
                          : "ປິດໃຊ້ງານ"}
                      </span>
                    </span>

                    {daysRemaining !== null && (
                      <span className="text-[11px] font-mono text-zinc-400 font-semibold">
                        {daysRemaining === 0 ? "ໝົດອາຍຸມື້ນີ້" : `ຍັງເຫຼືອ ${daysRemaining} ວັນ`}
                      </span>
                    )}
                  </div>

                  {/* Promo Code Box */}
                  <div className="flex items-center justify-between bg-zinc-950/80 border border-zinc-800 rounded-xl p-2.5 mb-2.5">
                    <div className="flex items-center gap-2 truncate">
                      <Ticket className="w-4 h-4 text-violet-400 shrink-0" />
                      <span className="font-mono text-sm font-black text-white tracking-wider truncate">
                        {promoCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCheckCode(promoCode)}
                        className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-colors text-[10px] font-bold px-1.5 border border-zinc-800"
                        title="ກວດສອບສະຖານະລະຫັດນີ້"
                      >
                        ກວດສອບ
                      </button>
                      <button
                        onClick={() => copyCampaignCode(promoCode)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="ຄັດລອກລະຫັດ"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Campaign Name */}
                  <h3 className="font-bold text-white text-base leading-tight group-hover:text-violet-400 transition-colors">
                    {promo.name}
                  </h3>

                  {/* Product Scope Badge */}
                  <div className="mt-2">
                    {promo.applicableProductIds && promo.applicableProductIds.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/30 text-[11px] font-semibold">
                        <span>ສະເພາະ</span>
                        <span className="underline font-bold">{promo.applicableProductIds.length} ສິນຄ້າທີ່ເລືອກ</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold">
                        ທຸກສິນຄ້າໃນຮ້ານ (Store-wide)
                      </span>
                    )}
                  </div>

                  {/* Discount Badge */}
                  <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3.5 my-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        ມູນຄ່າສ່ວນຫຼຸດ
                      </span>
                      <div className="text-2xl font-black text-violet-400 flex items-baseline gap-1 mt-0.5">
                        {promo.type === "PERCENTAGE" ? (
                          <>
                            <span>{promo.discountValue}</span>
                            <span className="text-sm font-semibold">% OFF</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-normal">₭</span>
                            <span>{Number(promo.discountValue || 0).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
                      <Ticket className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Date range */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>
                      {promo.startDate ? promo.startDate.slice(0, 10) : "-"} ເຖິງ{" "}
                      {promo.endDate ? promo.endDate.slice(0, 10) : "-"}
                    </span>
                  </div>
                </div>

                {/* Action footer */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 mt-4">
                  <button
                    onClick={() => handleToggleStatus(promo)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      promo.status === "ACTIVE"
                        ? "bg-zinc-800 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400"
                        : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {promo.status === "ACTIVE" ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>ປິດໂປຣ</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ເປີດໂປຣ</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPrintPromo(promo)}
                      className="p-2 text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                      title="ພິມຄູປອງ / ໃບໂປຣໂມຊັ່ນ"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(promo)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      title="ແກ້ໄຂໂປຣໂມຊັ່ນ"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(promo)}
                      className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="ລຶບໂປຣໂມຊັ່ນ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      ) : (
        <CouponManager embedded={true} />
      )}

            {/* ── Add / Edit Modal (Wide 2-Column Layout) ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl lg:max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <BadgePercent className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>{editingItem ? "ແກ້ໄຂແຄມເປນໂປຣໂມຊັ່ນ" : "ສ້າງແຄມເປນໂປຣໂມຊັ່ນໃໝ່"}</span>
                    {editingItem && (
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {editingItem.code || editingItem.name}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    ກຳນົດລະຫັດ, ສ່ວນຫຼຸດ, ໄລຍະເວລາ ແລະ ເລືອກສິນຄ້າທີ່ຮ່ວມລາຍການ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
                title="ປິດ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left Column: Promotion Info */}
                <div className="space-y-4 bg-zinc-950/60 p-4 sm:p-5 rounded-2xl border border-zinc-800/80">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span>ຂໍ້ມູນແຄມເປນ & ສ່ວນຫຼຸດ</span>
                    </h4>
                    {editingItem && (
                      <span className="text-[11px] text-zinc-400 font-mono">
                        ID: {String(editingItem.id).slice(-6)}
                      </span>
                    )}
                  </div>

                  {/* Campaign Code */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-zinc-300">
                        ລະຫັດແຄມເປນ (Campaign Code)
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPromoCode}
                        className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>ສຸ່ມລະຫັດ</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="ຕົວຢ່າງ: SUMMER2026, FLASH10, VIP20"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white font-mono uppercase focus:outline-none focus:border-violet-500 font-bold"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      ຫາກບໍ່ປ້ອນ ລະບົບຈະສ້າງລະຫັດໃຫ້ອັດຕະໂນມັດຈາກຊື່ແຄມເປນ
                    </p>
                  </div>

                  {/* Campaign Name */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ຊື່ແຄມເປນ / ລາຍລະອຽດໂປຣໂມຊັ່ນ <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ຕົວຢ່າງ: ສ່ວນຫຼຸດເທສະການປີໃໝ່ 2026, ຫຼຸດພິເສດທົ່ວຮ້ານ"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ຮູບແບບສ່ວນຫຼຸດ
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
                      >
                        <option value="PERCENTAGE">ເປີເຊັນ (% OFF)</option>
                        <option value="FIXED">ຈຳນວນເງິນ (₭)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ມູນຄ່າສ່ວນຫຼຸດ <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-violet-400 font-bold focus:outline-none focus:border-violet-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ວັນທີເລີ່ມຕົ້ນ
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ວັນທີສິ້ນສຸດ
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ສະຖານະໂປຣໂມຊັ່ນ
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="ACTIVE">ເປີດໃຊ້ງານ (ACTIVE)</option>
                      <option value="INACTIVE">ປິດໃຊ້ງານ (INACTIVE)</option>
                      <option value="EXPIRED">ໝົດອາຍຸ (EXPIRED)</option>
                    </select>
                  </div>
                </div>

                {/* Right Column: Product Targeting */}
                <div className="space-y-3 bg-zinc-950/60 p-4 sm:p-5 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60 mb-3">
                      <label className="text-zinc-200 text-xs font-bold flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-violet-400" />
                        <span>ຂອບເຂດສິນຄ້າທີ່ຮອງຮັບໂປຣໂມຊັ່ນ</span>
                      </label>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        ({products.length} ສິນຄ້າໃນຮ້ານ)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setApplyToAllProducts(true);
                          setSelectedProducts([]);
                        }}
                        className={`p-3 rounded-2xl text-xs font-semibold border transition-all text-left ${
                          applyToAllProducts
                            ? "bg-violet-600/20 border-violet-500 text-violet-200 shadow-lg shadow-violet-500/10"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850"
                        }`}
                      >
                        <p className="font-bold text-sm">ທຸກສິນຄ້າໃນຮ້ານ</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Store-wide (ທຸກເມນູ)</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setApplyToAllProducts(false)}
                        className={`p-3 rounded-2xl text-xs font-semibold border transition-all text-left ${
                          !applyToAllProducts
                            ? "bg-violet-600/20 border-violet-500 text-violet-200 shadow-lg shadow-violet-500/10"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850"
                        }`}
                      >
                        <p className="font-bold text-sm">ເລືອກສະເພາະບາງສິນຄ້າ</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {selectedProducts.length} ລາຍການທີ່ເລືອກ
                        </p>
                      </button>
                    </div>

                    {/* Product search & list */}
                    {!applyToAllProducts && (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                              type="text"
                              placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ..."
                              value={searchProduct}
                              onChange={(e) => setSearchProduct(e.target.value)}
                              className="w-full pl-10 pr-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                            />
                          </div>
                          {products.filter((p) => String(p?.name || "").toLowerCase().includes(String(searchProduct || "").toLowerCase())).length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const filtered = products.filter((p) => String(p?.name || "").toLowerCase().includes(String(searchProduct || "").toLowerCase()));
                                const ids = filtered.map((p) => p.id);
                                setSelectedProducts((prev) => Array.from(new Set([...prev, ...ids])));
                              }}
                              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium shrink-0 transition-colors"
                            >
                              ເລືອກທັງໝົດ
                            </button>
                          )}
                          {selectedProducts.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedProducts([])}
                              className="px-3 py-2 bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 rounded-xl text-xs font-medium shrink-0 transition-colors"
                            >
                              ລ້າງອອກ
                            </button>
                          )}
                        </div>

                        <div className="max-h-[300px] sm:max-h-[340px] overflow-y-auto custom-scrollbar space-y-1.5 bg-zinc-900/90 p-2.5 rounded-2xl border border-zinc-800">
                          {products.length === 0 ? (
                            <p className="text-zinc-500 text-xs p-4 text-center">ຍັງບໍ່ມີສິນຄ້າໃນລະບົບ</p>
                          ) : (
                            (() => {
                              const filtered = products.filter((p) =>
                                String(p?.name || "").toLowerCase().includes(String(searchProduct || "").toLowerCase())
                              );
                              if (filtered.length === 0) {
                                return <p className="text-zinc-500 text-xs p-4 text-center">ບໍ່ພົບສິນຄ້າທີ່ກົງກັບຄຳຄົ້ນຫາ</p>;
                              }
                              return filtered.map((p) => {
                                const isChecked = selectedProducts.includes(p.id);
                                return (
                                  <label
                                    key={p.id}
                                    className={`flex items-center justify-between gap-3 p-2.5 rounded-xl cursor-pointer text-xs border transition-colors ${
                                      isChecked
                                        ? "bg-violet-500/15 border-violet-500/40 text-violet-100"
                                        : "bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/60"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                                      <input
                                        type="checkbox"
                                        className="accent-violet-500 w-4 h-4 rounded cursor-pointer shrink-0"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedProducts((prev) => [...prev, p.id]);
                                          } else {
                                            setSelectedProducts((prev) => prev.filter((id) => id !== p.id));
                                          }
                                        }}
                                      />
                                      <span className="truncate select-none font-medium text-xs">{p.name}</span>
                                    </div>
                                    {p.price !== undefined && (
                                      <span className="text-xs font-mono text-emerald-400 font-bold shrink-0">
                                        ₭{Number(p.price).toLocaleString()}
                                      </span>
                                    )}
                                  </label>
                                );
                              });
                            })()
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between mt-3">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-zinc-400" />
                      <span>ເງື່ອນໄຂການນຳໃຊ້:</span>
                    </span>
                    <span className="font-bold text-violet-400">
                      {applyToAllProducts
                        ? "ໃຊ້ໄດ້ກັບທຸກສິນຄ້າໃນຮ້ານ (Store-wide)"
                        : `ໃຊ້ໄດ້ສະເພາະ ${selectedProducts.length} ສິນຄ້າທີ່ເລືອກ`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="pt-5 flex gap-3 border-t border-zinc-800/80 mt-5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? "ບັນທຶກການແກ້ໄຂໂປຣໂມຊັ່ນ" : "ສ້າງໂປຣໂມຊັ່ນໃໝ່"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-violet-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">ພິມບັດໂປຣໂມຊັ່ນ / ໃບປະກາດ</h3>
                  <p className="text-[11px] text-zinc-400">{printPromo.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPrintPromo(null)}
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
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  ບິນນ້ອຍ 80mm (Promo Slip)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat("a4")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    printFormat === "a4"
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  ໃບໃຫຍ່ A4 (Store Poster)
                </button>
              </div>
            </div>

            {/* Print Preview Container */}
            <div className="p-6 overflow-y-auto bg-zinc-950 flex justify-center">
              <div
                id="promo-print-wrapper"
                ref={printAreaRef}
                className={
                  printFormat === "slip"
                    ? "w-[80mm] p-4 bg-white text-black font-mono text-xs shadow-lg border border-zinc-300"
                    : "w-full max-w-[190mm] p-8 bg-white text-black font-sans shadow-lg border border-zinc-300"
                }
              >
                {printFormat === "slip" ? (
                  /* 80mm Slip Voucher */
                  <div className="space-y-3 text-center">
                    <div className="border-b border-dashed border-zinc-400 pb-2">
                      <h4 className="font-bold text-sm tracking-wide">SPECIAL PROMOTION VOUCHER</h4>
                      <p className="text-[10px] text-zinc-600">ຄູປ໋ອງສ່ວນຫຼຸດພິເສດປະຈຳຮ້ານ</p>
                    </div>

                    <div className="py-2 border-y border-zinc-300 my-1 bg-zinc-50">
                      <p className="text-xs text-zinc-600">ລະຫັດໂປຣໂມຊັ່ນ</p>
                      <p className="font-black text-base tracking-widest text-violet-700">
                        {printPromo.name.replace(/\s+/g, "").toUpperCase()}
                      </p>
                    </div>

                    <div className="text-center py-1">
                      <p className="text-[10px] text-zinc-500 uppercase">ມູນຄ່າສ່ວນຫຼຸດ</p>
                      <p className="text-xl font-black text-black">
                        {printPromo.type === "PERCENTAGE"
                          ? `${printPromo.discountValue}% OFF`
                          : `₭${printPromo.discountValue.toLocaleString()} ສ່ວນຫຼຸດ`}
                      </p>
                    </div>

                    <div className="text-left space-y-1 py-1 text-[10px] border-t border-dashed border-zinc-400">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ໄລຍະເວລາ:</span>
                        <span>
                          {printPromo.startDate.slice(0, 10)} - {printPromo.endDate.slice(0, 10)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ສະຖານະ:</span>
                        <span className="font-bold">{printPromo.status === "ACTIVE" ? "ພ້ອມໃຊ້ງານ" : "ປິດໃຊ້"}</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-zinc-400 pt-2 text-[10px] text-zinc-500">
                      <p>ສະແດງບິນນີ້ທີ່ຈຸດຊຳລະເງິນເພື່ອຮັບສ່ວນຫຼຸດທັນທີ</p>
                      <p className="font-mono text-[9px] mt-1">ພິມເມື່ອ: {new Date().toLocaleDateString("lo-LA")}</p>
                    </div>
                  </div>
                ) : (
                  /* A4 Store Poster / Announcement */
                  <div className="space-y-6 text-center">
                    <div className="border-b-4 border-violet-600 pb-4">
                      <h1 className="text-3xl font-black tracking-tight text-violet-900 uppercase">
                        SPECIAL DISCOUNT PROMOTION
                      </h1>
                      <p className="text-sm text-zinc-600 font-semibold mt-1">
                        ໂປຣໂມຊັ່ນສ່ວນຫຼຸດພິເສດສຳລັບລູກຄ້າຮ້ານກິລາ
                      </p>
                    </div>

                    <div className="p-8 bg-violet-50 rounded-2xl border-2 border-violet-200 my-6">
                      <p className="text-sm font-bold text-violet-700 uppercase tracking-widest">
                        {printPromo.name}
                      </p>
                      <div className="text-5xl font-black text-violet-950 my-4">
                        {printPromo.type === "PERCENTAGE" ? (
                          <span>{printPromo.discountValue}% OFF</span>
                        ) : (
                          <span>₭{printPromo.discountValue.toLocaleString()} DISCOUNT</span>
                        )}
                      </div>
                      <div className="inline-block px-6 py-2 bg-white rounded-xl border border-violet-300 shadow-sm">
                        <span className="text-xs text-zinc-500 mr-2">ລະຫັດຄູປອງ:</span>
                        <span className="font-mono font-black text-lg tracking-widest text-violet-700">
                          {printPromo.name.replace(/\s+/g, "").toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-left bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                      <div>
                        <p className="text-zinc-500">ວັນທີເລີ່ມໂປຣໂມຊັ່ນ:</p>
                        <p className="text-sm font-bold mt-0.5">{printPromo.startDate.slice(0, 10)}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ວັນທີສິ້ນສຸດ:</p>
                        <p className="text-sm font-bold mt-0.5">{printPromo.endDate.slice(0, 10)}</p>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-600 text-left border p-4 rounded-lg bg-zinc-50">
                      <p className="font-bold text-zinc-800 mb-1">ເງື່ອນໄຂໂປຣໂມຊັ່ນ:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>ໂປຣໂມຊັ່ນນີ້ສາມາດໃຊ້ໄດ້ກັບສິນຄ້າ ແລະ ອຸປະກອນກິລາທີ່ຮ່ວມລາຍການ.</li>
                        <li>ບໍ່ສາມາດປ່ຽນເປັນເງິນສົດ ຫຼື ໂອນສິດໃຫ້ຜູ້ອື່ນໄດ້.</li>
                        <li>ສະຫງວນສິດໃນການປ່ຽນແປງເງື່ອນໄຂໂດຍບໍ່ຕ້ອງແຈ້ງໃຫ້ຊາບລ່ວງໜ້າ.</li>
                      </ul>
                    </div>

                    <div className="pt-6 border-t border-zinc-200 flex justify-between items-center text-xs text-zinc-500">
                      <span>SPORTS EQUIPMENT &amp; SERVICE SHOP</span>
                      <span className="font-mono">ພິມເມື່ອ: {new Date().toLocaleDateString("lo-LA")}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex gap-2.5">
              <button
                type="button"
                onClick={() => setPrintPromo(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                ປິດ
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/30"
              >
                <Printer className="w-4 h-4" />
                <span>ພິມອອກ (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={(code) => {
          setIsCameraScannerOpen(false);
          setCheckCodeInput(code.toUpperCase());
          handleInspectPromoByQuery(code);
        }}
        title="ສະແກນ QR / ບາໂຄ້ດ ໂປຣໂມຊັ່ນ & ຄູປອງ"
      />
    </div>
  );
}
