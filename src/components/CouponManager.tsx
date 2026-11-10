"use client";

import {
  askConfirm } from "@/components/ConfirmModal";
import React,
  { useState,
  useEffect,
  useMemo } from "react";
import {
  Ticket,
  Plus,
  Search,
  Percent,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  Loader2,
  Copy,
  Sparkles,
  Layers,
  LayoutGrid,
  List,
  Check,
  X,
  AlertCircle,
  Package,
  CheckSquare,
  Square,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Camera,
  Target,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { EditCouponDialog } from "@/components/EditCouponDialog";
import { CameraScannerModal } from "@/components/CameraScannerModal";
import {
  BillVerifyResultCard,
  BillVerifyResultData,
  formatTimeDiffLao,
  formatDateTimeLaoStandard,
} from "@/components/BillVerifyResultCard";

export type Coupon = {
  id: string;
  code: string;
  type: string; // PERCENTAGE, FIXED
  value: number;
  minOrderVal: number;
  maxDiscount: number | null;
  expiresAt: string | null;
  isActive: boolean;
  usageCount: number;
  maxUsage: number | null;
  applicableProductIds?: string[];
  createdAt: string;
  user?: { id: string; name: string | null };
};

interface ProductItem {
  id: string;
  name: string;
  price?: number;
  category?: string;
  images?: string[];
}

export function CouponManager({
  isAdmin,
  sellers,
  embedded = false,
}: {
  isAdmin?: boolean;
  sellers?: { id: string; name: string | null }[];
  embedded?: boolean;
}) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sellerFilter, setSellerFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [inspectedCouponResult, setInspectedCouponResult] = useState<BillVerifyResultData | null>(null);

  // Modal State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form State
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("10");
  const [minOrderVal, setMinOrderVal] = useState("0");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [maxUsage, setMaxUsage] = useState("");
  const [expiresAt, setExpiresAt] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [applyToAllProducts, setApplyToAllProducts] = useState(true);
  const [searchProduct, setSearchProduct] = useState("");

  useEffect(() => {
    fetchCouponsAndProducts();
  }, []);

  const fetchCouponsAndProducts = async () => {
    setLoading(true);
    try {
      const [couponsData, productsData] = await Promise.all([
        fetch("/api/coupons").then((res) => res.json()).catch(() => []),
        fetch("/api/products?includeAllStatuses=true&limit=200").then((res) => res.json()).catch(() => []),
      ]);

      if (Array.isArray(couponsData)) {
        setCoupons(couponsData);
      } else if (couponsData?.coupons && Array.isArray(couponsData.coupons)) {
        setCoupons(couponsData.coupons);
      }

      let pList: any[] = [];
      if (Array.isArray(productsData)) {
        pList = productsData;
      } else if (productsData?.products && Array.isArray(productsData.products)) {
        pList = productsData.products;
      } else if (productsData?.data && Array.isArray(productsData.data)) {
        pList = productsData.data;
      }

      // Fallback if empty
      if (pList.length === 0) {
        try {
          const fallback = await fetch("/api/products").then((r) => r.json());
          pList = Array.isArray(fallback) ? fallback : fallback?.products || fallback?.data || [];
        } catch {
          // ignore
        }
      }

      setProducts(
        pList.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          images: p.images,
        }))
      );
    } catch {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນຄູປອງ ຫຼື ສິນຄ້າໄດ້");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !currentStatus } : c))
        );
        toast.success(!currentStatus ? "ເປີດໃຊ້ງານຄູປອງແລ້ວ" : "ປິດໃຊ້ງານຄູປອງແລ້ວ");
      }
    } catch {
      toast.error("ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້");
    }
  };

  const handleDelete = async (id: string, codeName: string) => {
    if (
      !(await askConfirm(
        `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລະຫັດຄູປອງ "${codeName}" ອອກຈາກລະບົບ?`
      ))
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        toast.success(`ລຶບລະຫັດ "${codeName}" ສຳເລັດແລ້ວ`);
      }
    } catch {
      toast.error("ບໍ່ສາມາດລຶບຂໍ້ມູນໄດ້");
    }
  };

  const resetForm = () => {
    setCode("");
    setType("PERCENTAGE");
    setValue("10");
    setMinOrderVal("0");
    setMaxDiscount("");
    setMaxUsage("");
    setExpiresAt(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setSelectedProducts([]);
    setApplyToAllProducts(true);
    setSearchProduct("");
    setFormError("");
    setEditingCoupon(null);
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "SAVE";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const applyPreset = (presetCode: string, pType: "PERCENTAGE" | "FIXED", pVal: string, pMin: string) => {
    setCode(presetCode);
    setType(pType);
    setValue(pVal);
    setMinOrderVal(pMin);
  };

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setFormError("");

    if (!code.trim()) {
      setFormError("ກະລຸນາປ້ອນລະຫັດຄູປອງ (Promo Code)");
      return;
    }
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      setFormError("ກະລຸນາປ້ອນມູນຄ່າສ່ວນຫຼຸດທີ່ຖືກຕ້ອງ");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        minOrderVal: Number(minOrderVal) || 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        maxUsage: maxUsage ? Number(maxUsage) : null,
        expiresAt: expiresAt || null,
        applicableProductIds: applyToAllProducts ? [] : selectedProducts,
      };

      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`ສ້າງລະຫັດຄູປອງ "${payload.code}" ສຳເລັດແລ້ວ`);
        setDialogOpen(false);
        resetForm();
        fetchCouponsAndProducts();
      } else {
        setFormError(data.error || "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
      }
    } catch {
      setFormError("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = (cCode: string) => {
    navigator.clipboard.writeText(cCode);
    toast.success(`ຄັດລອກລະຫັດ "${cCode}" ແລ້ວ`);
  };

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return (coupons || []).filter((c) => {
      if (!c) return false;
      const codeStr = String(c.code || "");
      const matchSearch = codeStr.toLowerCase().includes((search || "").toLowerCase());
      const matchSeller = sellerFilter === "ALL" || c.user?.id === sellerFilter;

      const isExpired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false;
      let matchStatus = true;
      if (statusFilter === "ACTIVE") matchStatus = Boolean(c.isActive && !isExpired);
      if (statusFilter === "INACTIVE") matchStatus = !c.isActive;
      if (statusFilter === "EXPIRED") matchStatus = Boolean(isExpired);

      return matchSearch && matchSeller && matchStatus;
    });
  }, [coupons, search, sellerFilter, statusFilter]);

  // Statistics
  const totalCount = coupons.length;
  const activeCount = coupons.filter(
    (c) => c.isActive && (!c.expiresAt || new Date(c.expiresAt) >= new Date())
  ).length;
  const totalRedeemed = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
  const expiredCount = coupons.filter(
    (c) => c.expiresAt && new Date(c.expiresAt) < new Date()
  ).length;

  const buildCouponInspectionResult = (c: Coupon): BillVerifyResultData => {
    const now = new Date();
    const expDt = c.expiresAt ? new Date(c.expiresAt) : null;
    const diffMs = expDt && !isNaN(expDt.getTime()) ? expDt.getTime() - now.getTime() : 0;
    const isExpired = expDt && !isNaN(expDt.getTime()) ? diffMs < 0 : false;
    const isMaxedOut = c.maxUsage !== null && c.maxUsage > 0 && c.usageCount >= c.maxUsage;
    const discountStr =
      c.type === "PERCENTAGE"
        ? `ຫຼຸດ ${c.value}%`
        : `ຫຼຸດ ₭${Number(c.value || 0).toLocaleString()}`;

    if (!c.isActive) {
      return {
        billCode: c.code,
        billTypeLabel: "ຄູປອງສ່ວນຫຼຸດ (Coupon Code)",
        statusState: "CANCELLED",
        headline: "ຄູປອງນີ້ຖືກປິດໃຊ້ງານຢູ່! (Inactive)",
        subheadline: `ລະຫັດຄູປອງ ${c.code} (${discountStr}) ຖືກປິດໃຊ້ງານຊົ່ວຄາວ`,
        customerName: c.user?.name || "ສຳລັບລູກຄ້າທົ່ວໄປ",
        itemName: `${discountStr} • ຂັ້ນຕ່ຳ ₭${(c.minOrderVal || 0).toLocaleString()}`,
        startLabel: "ວັນທີສ້າງຄູປອງ",
        startValue: formatDateTimeLaoStandard(c.createdAt),
        endLabel: "ວັນໝົດອາຍຸຄູປອງ",
        endValue: expDt ? formatDateTimeLaoStandard(expDt) : "ບໍ່ມີວັນໝົດອາຍຸ",
        timeRemainingText: "ປິດໃຊ້ງານຊົ່ວຄາວ",
        amountLabel: "ຈຳນວນສິດທີ່ໃຊ້ແລ້ວ",
        amountValue: `${c.usageCount || 0} / ${c.maxUsage || "ບໍ່ຈຳກັດ"} ຄັ້ງ`,
        actions: [
          {
            label: "ເປີດໃຊ້ງານຄູປອງຄືນໃໝ່",
            onClick: () => handleToggleActive(c.id, c.isActive),
            variant: "emerald",
          },
        ],
      };
    }

    if (isExpired) {
      return {
        billCode: c.code,
        billTypeLabel: "ຄູປອງສ່ວນຫຼຸດ (Coupon Code)",
        statusState: "EXPIRED",
        headline: "ຄູປອງສ່ວນຫຼຸດນີ້ໝົດອາຍຸແລ້ວ!",
        subheadline: `ລະຫັດຄູປອງ ${c.code} (${discountStr}) ໝົດອາຍຸຕັ້ງແຕ່ ${formatDateTimeLaoStandard(expDt)}`,
        customerName: c.user?.name || "ສຳລັບລູກຄ້າທົ່ວໄປ",
        itemName: `${discountStr} • ຂັ້ນຕ່ຳ ₭${(c.minOrderVal || 0).toLocaleString()}`,
        startLabel: "ວັນທີສ້າງຄູປອງ",
        startValue: formatDateTimeLaoStandard(c.createdAt),
        endLabel: "ວັນໝົດອາຍຸຄູປອງ",
        endValue: formatDateTimeLaoStandard(expDt),
        timeRemainingText: `ໝົດອາຍຸມາແລ້ວ ${formatTimeDiffLao(diffMs)}`,
        amountLabel: "ຈຳນວນສິດທີ່ໃຊ້ແລ້ວ",
        amountValue: `${c.usageCount || 0} / ${c.maxUsage || "ບໍ່ຈຳກັດ"} ຄັ້ງ`,
        actions: [
          {
            label: "ແກ້ໄຂ / ຕໍ່ອາຍຸຄູປອງ",
            onClick: () => setEditingCoupon(c),
            variant: "danger",
          },
        ],
      };
    }

    if (isMaxedOut) {
      return {
        billCode: c.code,
        billTypeLabel: "ຄູປອງສ່ວນຫຼຸດ (Coupon Code)",
        statusState: "EXPIRED",
        headline: "ຄູປອງນີ້ຖືກໃຊ້ຄົບຈຳນວນສິດແລ້ວ! (Quota Full)",
        subheadline: `ລະຫັດຄູປອງ ${c.code} ຖືກໃຊ້ຄົບ ${c.usageCount}/${c.maxUsage} ຄັ້ງແລ້ວ`,
        customerName: c.user?.name || "ສຳລັບລູກຄ້າທົ່ວໄປ",
        itemName: `${discountStr} • ຂັ້ນຕ່ຳ ₭${(c.minOrderVal || 0).toLocaleString()}`,
        startLabel: "ວັນທີສ້າງຄູປອງ",
        startValue: formatDateTimeLaoStandard(c.createdAt),
        endLabel: "ວັນໝົດອາຍຸຄູປອງ",
        endValue: expDt ? formatDateTimeLaoStandard(expDt) : "ບໍ່ມີວັນໝົດອາຍຸ",
        timeRemainingText: "ສິດຄູປອງເຕັມແລ້ວ",
        amountLabel: "ຈຳນວນສິດທີ່ໃຊ້ແລ້ວ",
        amountValue: `${c.usageCount} / ${c.maxUsage} ຄັ້ງ`,
        actions: [
          {
            label: "ເພີ່ມຈຳນວນສິດ (Edit)",
            onClick: () => setEditingCoupon(c),
            variant: "primary",
          },
        ],
      };
    }

    return {
      billCode: c.code,
      billTypeLabel: "ຄູປອງສ່ວນຫຼຸດ (Coupon Code)",
      statusState: "VALID",
      headline: "ຄູປອງນີ້ຍັງບໍ່ໝົດອາຍຸ (ພ້ອມໃຊ້ງານປົກກະຕິ)",
      subheadline: `ລະຫັດຄູປອງ ${c.code} (${discountStr}) ສາມາດໃຊ້ຮັບສ່ວນຫຼຸດໄດ້ທັນທີ`,
      customerName: c.user?.name || "ສຳລັບລູກຄ້າທົ່ວໄປ",
      itemName: `${discountStr} • ຂັ້ນຕ່ຳ ₭${(c.minOrderVal || 0).toLocaleString()}`,
      startLabel: "ວັນທີສ້າງຄູປອງ",
      startValue: formatDateTimeLaoStandard(c.createdAt),
      endLabel: "ໃຊ້ໄດ້ຮອດວັນທີ",
      endValue: expDt ? formatDateTimeLaoStandard(expDt) : "ບໍ່ມີວັນໝົດອາຍຸ",
      timeRemainingText: expDt ? `ຍັງເຫຼືອເວລາອີກ ${formatTimeDiffLao(diffMs)}` : "ໃຊ້ໄດ້ຕະຫຼອດ (ບໍ່ມີວັນໝົດອາຍຸ)",
      amountLabel: "ຈຳນວນສິດທີ່ໃຊ້ແລ້ວ",
      amountValue: `${c.usageCount || 0} / ${c.maxUsage || "ບໍ່ຈຳກັດ"} ຄັ້ງ`,
      actions: [
        {
          label: "ຄັດລອກລະຫັດ",
          onClick: () => copyCode(c.code),
          variant: "emerald",
        },
        {
          label: "ແກ້ໄຂຄູປອງ",
          onClick: () => setEditingCoupon(c),
          variant: "secondary",
        },
      ],
    };
  };

  const handleInspectCouponByQuery = (rawQuery: string) => {
    const clean = rawQuery.trim();
    if (!clean) {
      toast.error("ກະລຸນາປ້ອນ ຫຼື ສະແກນລະຫັດຄູປອງ ເພື່ອກວດສອບວັນໝົດອາຍຸ");
      return;
    }
    setSearch(clean);
    setStatusFilter("ALL");
    const qLower = clean.toLowerCase();
    const matches = coupons.filter((c) => String(c.code || "").toLowerCase().includes(qLower));
    if (matches.length === 0) {
      setInspectedCouponResult(null);
      toast.error(`ບໍ່ພົບລະຫັດຄູປອງ "${clean}" ໃນລະບົບ`);
      return;
    }
    const exact = matches.find((c) => String(c.code || "").toLowerCase() === qLower) || matches[0];
    const result = buildCouponInspectionResult(exact);
    setInspectedCouponResult(result);
    if (result.statusState === "EXPIRED" || result.statusState === "CANCELLED") {
      toast.error(`${result.billCode}: ${result.headline}`);
    } else {
      toast.success(`${result.billCode}: ${result.headline}`);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* ── Toolbar: Action Bar & Search ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 backdrop-blur-xl">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="ພິມ ຫຼື ສະແກນລະຫັດຄູປອງ (ຕົວຢ່າງ: VIP, SUMMER)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!e.target.value.trim()) setInspectedCouponResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim()) {
                  e.preventDefault();
                  handleInspectCouponByQuery(search);
                }
              }}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => handleInspectCouponByQuery(search)}
            className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0"
          >
            ກວດສອບຄູປອງ
          </button>
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 whitespace-nowrap shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">ກ້ອງສະແກນ</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {isAdmin && sellers && sellers.length > 0 && (
            <select
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-300 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">ທຸກຮ້ານຄ້າ</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || `ຮ້ານ (${s.id.slice(-6)})`}
                </option>
              ))}
            </select>
          )}

          {/* View switcher */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                viewMode === "GRID"
                  ? "bg-blue-600/20 text-blue-400 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="ຮູບແບບກາດ (Grid)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">ກາດ</span>
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                viewMode === "TABLE"
                  ? "bg-blue-600/20 text-blue-400 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="ຮູບແບບຕາຕະລາງ (Table)"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">ຕາຕະລາງ</span>
            </button>
            <button
              onClick={fetchCouponsAndProducts}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
              title="ຣີເຟຣຊ"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>ສ້າງໂຄ໋ດໃໝ່</span>
          </button>
        </div>
      </div>

      {/* ── Coupon Status & Expiry Verification Banner ── */}
      {(() => {
        const activeResult =
          inspectedCouponResult ||
          (search.trim() && filteredCoupons.length === 1
            ? buildCouponInspectionResult(filteredCoupons[0])
            : null);
        if (!activeResult) return null;
        return (
          <BillVerifyResultCard
            data={activeResult}
            onClear={() => {
              setInspectedCouponResult(null);
              setSearch("");
            }}
          />
        );
      })()}

      {/* ── 4 KPI Summary Cards for Coupons ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer bg-zinc-900/80 border rounded-2xl p-4 backdrop-blur-xl transition-all ${
            statusFilter === "ALL"
              ? "border-blue-500/60 ring-2 ring-blue-500/20"
              : "border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                ຄູປອງທັງໝົດ
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                {totalCount} <span className="text-xs font-normal text-zinc-500">ໂຄ້ດ</span>
              </h3>
            </div>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("ACTIVE")}
          className={`cursor-pointer bg-zinc-900/80 border rounded-2xl p-4 backdrop-blur-xl transition-all ${
            statusFilter === "ACTIVE"
              ? "border-emerald-500/60 ring-2 ring-emerald-500/20"
              : "border-zinc-800 hover:border-emerald-500/30"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                ພ້ອມໃຊ້ງານ (Active)
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-400 mt-1.5">
                {activeCount} <span className="text-xs font-normal text-zinc-500">ໂຄ້ດ</span>
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                ຈຳນວນຄັ້ງທີ່ຖືກໃຊ້
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-amber-400 mt-1.5">
                {totalRedeemed} <span className="text-xs font-normal text-zinc-500">ຄັ້ງ</span>
              </h3>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("EXPIRED")}
          className={`cursor-pointer bg-zinc-900/80 border rounded-2xl p-4 backdrop-blur-xl transition-all ${
            statusFilter === "EXPIRED"
              ? "border-red-500/60 ring-2 ring-red-500/20"
              : "border-zinc-800 hover:border-red-500/30"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                ໝົດອາຍຸແລ້ວ
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-red-400 mt-1.5">
                {expiredCount} <span className="text-xs font-normal text-zinc-500">ໂຄ້ດ</span>
              </h3>
            </div>
            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      {loading ? (
        <div className="p-16 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
          <p className="text-zinc-400 text-xs sm:text-sm">ກຳລັງໂຫຼດຂໍ້ມູນຄູປອງສ່ວນຫຼຸດ...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="p-12 sm:p-16 text-center flex flex-col items-center border border-zinc-800 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-16 h-16 bg-zinc-800/60 rounded-2xl flex items-center justify-center mb-3 text-zinc-500">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-white text-base sm:text-lg font-bold">ບໍ່ພົບລະຫັດຄູປອງສ່ວນຫຼຸດ</h3>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-md">
            {search
              ? `ບໍ່ພົບຜົນການຄົ້ນຫາສຳລັບ "${search}". ກະລຸນາກວດສອບລະຫັດອີກຄັ້ງ.`
              : "ຍັງບໍ່ທັນມີລະຫັດຄູປອງໃນລະບົບ. ທ່ານສາມາດສ້າງໂຄ້ດໃໝ່ໄດ້ທັນທີ."}
          </p>
          <button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>ສ້າງໂຄ໋ດທຳອິດ</span>
          </button>
        </div>
      ) : viewMode === "GRID" ? (
        /* ── Ticket Cards Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon) => {
            const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
            const isLimitReached = coupon.maxUsage && coupon.usageCount >= coupon.maxUsage;
            const isAvailable = coupon.isActive && !isExpired && !isLimitReached;

            return (
              <div
                key={coupon.id}
                className="bg-zinc-900/90 border border-zinc-800/80 hover:border-blue-500/40 rounded-2xl overflow-hidden transition-all duration-300 group shadow-lg flex flex-col justify-between"
              >
                {/* Ticket Top Header */}
                <div className="p-4 border-b border-dashed border-zinc-800 bg-zinc-950/40 relative">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isAvailable
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : isExpired
                          ? "bg-red-500/15 text-red-400 border-red-500/30"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {isAvailable ? "ພ້ອມໃຊ້ງານ" : isExpired ? "ໝົດອາຍຸ" : "ປິດໃຊ້ງານ"}
                    </span>

                    <button
                      onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                      className={`text-xs font-semibold px-2 py-0.5 rounded-lg border transition-colors ${
                        coupon.isActive
                          ? "bg-zinc-800 text-zinc-300 hover:text-white"
                          : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {coupon.isActive ? "ປິດໂຄ້ດ" : "ເປີດໃຊ້"}
                    </button>
                  </div>

                  {/* Promo Code Box */}
                  <div className="mt-3 flex items-center justify-between bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-blue-400" />
                      <span className="font-mono text-base font-black text-white tracking-wider">
                        {coupon.code}
                      </span>
                    </div>
                    <button
                      onClick={() => copyCode(coupon.code)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      title="ຄັດລອກລະຫັດ"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Discount Value */}
                  <div className="mt-2.5 flex items-baseline justify-between">
                    <span className="text-xs text-zinc-400">ມູນຄ່າສ່ວນຫຼຸດ:</span>
                    <span className="text-lg font-black text-emerald-400">
                      {coupon.type === "PERCENTAGE"
                        ? `${coupon.value}% OFF`
                        : `₭${Number(coupon.value || 0).toLocaleString()}`}
                    </span>
                  </div>
                </div>

                {/* Ticket Details Body */}
                <div className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>ຍອດຊື້ຂັ້ນຕ່ຳ:</span>
                    <span className="font-semibold text-zinc-200">
                      {Number(coupon.minOrderVal || 0) > 0
                        ? `₭${Number(coupon.minOrderVal).toLocaleString()}`
                        : "ບໍ່ຈຳກັດ"}
                    </span>
                  </div>

                  {coupon.maxDiscount !== null && coupon.maxDiscount !== undefined && (
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>ຫຼຸດສູງສຸດ:</span>
                      <span className="font-semibold text-zinc-200">
                        ₭{Number(coupon.maxDiscount || 0).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-zinc-400">
                    <span>ຈຳນວນຄັ້ງທີ່ໃຊ້:</span>
                    <span className="font-bold text-blue-400 font-mono">
                      {coupon.usageCount} {coupon.maxUsage ? `/ ${coupon.maxUsage}` : "ຄັ້ງ (ບໍ່ຈຳກັດ)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-400">
                    <span>ຂອບເຂດສິນຄ້າ:</span>
                    {coupon.applicableProductIds && coupon.applicableProductIds.length > 0 ? (
                      <span className="font-bold text-blue-400 text-[11px] flex items-center gap-1">
                        <span>ສະເພາະ</span>
                        <span className="underline">{coupon.applicableProductIds.length} ສິນຄ້າ</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-400 text-[11px]">
                        ທຸກສິນຄ້າໃນຮ້ານ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-zinc-800/60">
                    <span>ວັນໝົດອາຍຸ:</span>
                    <span className="font-mono text-zinc-300 text-[11px]">
                      {coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "ບໍ່ມີກຳນົດ"}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3 bg-zinc-950/60 border-t border-zinc-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEditingCoupon(coupon)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="ແກ້ໄຂ"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id, coupon.code)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="ລຶບ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Compact Table View ── */
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-950/80 text-zinc-400 text-[11px] uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4">ລະຫັດໂຄ້ດ (Code)</th>
                  <th className="py-3.5 px-4">ປະເພດ & ມູນຄ່າ</th>
                  <th className="py-3.5 px-4">ຍອດຂັ້ນຕ່ຳ</th>
                  <th className="py-3.5 px-4">ໃຊ້ແລ້ວ / ສູງສຸດ</th>
                  <th className="py-3.5 px-4">ວັນໝົດອາຍຸ</th>
                  <th className="py-3.5 px-4">ສະຖານະ</th>
                  <th className="py-3.5 px-4 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredCoupons.map((c) => {
                  const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                  return (
                    <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{c.code}</span>
                          <button
                            onClick={() => copyCode(c.code)}
                            className="text-zinc-500 hover:text-white"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        {c.applicableProductIds && c.applicableProductIds.length > 0 ? (
                          <span className="text-[10px] text-blue-400 block font-sans font-medium mt-0.5">
                            ສະເພາະ {c.applicableProductIds.length} ສິນຄ້າ
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 block font-sans font-normal mt-0.5">
                            ທຸກສິນຄ້າ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        {c.type === "PERCENTAGE" ? `${c.value}%` : `₭${Number(c.value || 0).toLocaleString()}`}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {Number(c.minOrderVal || 0) > 0 ? `₭${Number(c.minOrderVal).toLocaleString()}` : "-"}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-300">
                        {c.usageCount} {c.maxUsage ? `/ ${c.maxUsage}` : ""}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400 text-xs">
                        {c.expiresAt ? String(c.expiresAt).slice(0, 10) : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(c.id, c.isActive)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            c.isActive && !isExpired
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          }`}
                        >
                          {c.isActive && !isExpired ? "ACTIVE" : "INACTIVE"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingCoupon(c)}
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.code)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg"
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

      {/* ── Modern Wide 2-Column Create Coupon Modal ── */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl lg:max-w-5xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    ສ້າງລະຫັດຄູປອງສ່ວນຫຼຸດໃໝ່ (Create Promo Code)
                  </h2>
                  <p className="text-xs text-zinc-400">
                    ກຳນົດລະຫັດ, ມູນຄ່າສ່ວນຫຼຸດ, ເງື່ອນໄຂຍອດຊື້ ແລະ ເລືອກສິນຄ້າທີ່ຮ່ວມລາຍການ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDialogOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body with 2-Column Grid */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1-Click Popular Preset Chips */}
              <div>
                <span className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1.5">
                  ໂຄ້ດຍອດນິຍົມ 1-Click (Presets)
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { label: "WELCOME10 (ຫຼຸດ 10%)", code: "WELCOME10", type: "PERCENTAGE" as const, val: "10", min: "50000" },
                    { label: "VIP20 (ຫຼຸດ 20%)", code: "VIP20", type: "PERCENTAGE" as const, val: "20", min: "100000" },
                    { label: "FLAT50K (ຫຼຸດ 50,000₭)", code: "FLAT50K", type: "FIXED" as const, val: "50000", min: "250000" },
                    { label: "FLASH15 (ຫຼຸດ 15%)", code: "FLASH15", type: "PERCENTAGE" as const, val: "15", min: "0" },
                  ].map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => applyPreset(p.code, p.type, p.val, p.min)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-blue-600/20 text-zinc-300 hover:text-blue-300 border border-zinc-700 hover:border-blue-500/40 text-xs font-semibold transition-all"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2-Column Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Code & Discount settings */}
                <div className="space-y-3.5 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>ຂໍ້ມູນລະຫັດ & ສ່ວນຫຼຸດ</span>
                  </h4>

                  {/* Promo Code input with random generator */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      ລະຫັດຄູປອງ (Promo Code) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="ຕົວຢ່າງ: SUMMER2026, VIP10"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={generateRandomCode}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold border border-zinc-700"
                        title="ສຸ່ມລະຫັດອັດຕະໂນມັດ"
                      >
                        ສຸ່ມໂຄ້ດ
                      </button>
                    </div>
                  </div>

                  {/* Type & Value */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        ປະເພດສ່ວນຫຼຸດ
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="PERCENTAGE">ເປີເຊັນ (%)</option>
                        <option value="FIXED">ຈຳນວນເງິນ (₭)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        ມູນຄ່າສ່ວນຫຼຸດ *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={type === "PERCENTAGE" ? "10" : "50000"}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Min order & Max discount */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        ຍອດຊື້ຂັ້ນຕ່ຳ (₭)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={minOrderVal}
                        onChange={(e) => setMinOrderVal(e.target.value)}
                        placeholder="0 = ບໍ່ຈຳກັດ"
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        ຫຼຸດສູງສຸດ (₭)
                      </label>
                      <input
                        type="number"
                        min="0"
                        disabled={type !== "PERCENTAGE"}
                        value={maxDiscount}
                        onChange={(e) => setMaxDiscount(e.target.value)}
                        placeholder="ຫວ່າງ = ບໍ່ຈຳກັດ"
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-mono disabled:opacity-40"
                      />
                    </div>
                  </div>

                  {/* Usage limit & Expiry */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        ຈຳນວນຄັ້ງທີ່ໃຊ້ໄດ້
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={maxUsage}
                        onChange={(e) => setMaxUsage(e.target.value)}
                        placeholder="ຫວ່າງ = ບໍ່ຈຳກັດ"
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        ວັນໝົດອາຍຸ
                      </label>
                      <input
                        type="date"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Applicable Products Selector */}
                <div className="space-y-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ສິນຄ້າທີ່ຮ່ວມລາຍການ</span>
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ({products.length} ລາຍການ)
                      </span>
                    </div>

                    {/* All Products vs Selected Products Radio */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setApplyToAllProducts(true);
                          setSelectedProducts([]);
                        }}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                          applyToAllProducts
                            ? "bg-blue-600/20 border-blue-500 text-blue-200"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <p className="font-bold">ທຸກສິນຄ້າໃນຮ້ານ</p>
                        <p className="text-[10px] text-zinc-500">Store-wide (ທຸກເມນູ)</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setApplyToAllProducts(false)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                          !applyToAllProducts
                            ? "bg-blue-600/20 border-blue-500 text-blue-200"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <p className="font-bold">ເລືອກສະເພາະບາງສິນຄ້າ</p>
                        <p className="text-[10px] text-zinc-500">
                          {selectedProducts.length} ລາຍການທີ່ເລືອກ
                        </p>
                      </button>
                    </div>

                    {/* Product search & list (Visible if NOT applyToAllProducts) */}
                    {!applyToAllProducts && (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                          <input
                            type="text"
                            placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ..."
                            value={searchProduct}
                            onChange={(e) => setSearchProduct(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5 bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                          {products.length === 0 ? (
                            <p className="text-zinc-500 text-xs p-3 text-center">ຍັງບໍ່ມີສິນຄ້າໃນລະບົບ</p>
                          ) : (
                            products
                              .filter((p) => String(p?.name || "").toLowerCase().includes(String(searchProduct || "").toLowerCase()))
                              .map((p) => {
                                const isChecked = selectedProducts.includes(p.id);
                                return (
                                  <label
                                    key={p.id}
                                    className={`flex items-center justify-between gap-2 p-2 rounded-xl cursor-pointer text-xs border transition-colors ${
                                      isChecked
                                        ? "bg-blue-500/15 border-blue-500/40 text-blue-100"
                                        : "bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/60"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                      <input
                                        type="checkbox"
                                        className="accent-blue-500 w-3.5 h-3.5 rounded"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedProducts((prev) => [...prev, p.id]);
                                          } else {
                                            setSelectedProducts((prev) =>
                                              prev.filter((id) => id !== p.id)
                                            );
                                          }
                                        }}
                                      />
                                      <span className="truncate select-none font-medium">
                                        {p.name}
                                      </span>
                                    </div>
                                    {p.price !== undefined && (
                                      <span className="text-[11px] font-mono text-emerald-400 font-bold shrink-0">
                                        ₭{Number(p.price).toLocaleString()}
                                      </span>
                                    )}
                                  </label>
                                );
                              })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary Footer of products */}
                  <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                    <span>ເງື່ອນໄຂ:</span>
                    <span className="font-bold text-blue-400">
                      {applyToAllProducts
                        ? "ໃຊ້ໄດ້ກັບທຸກສິນຄ້າໃນຮ້ານ"
                        : `ໃຊ້ໄດ້ສະເພາະ ${selectedProducts.length} ສິນຄ້າທີ່ເລືອກ`}
                    </span>
                  </div>
                </div>
              </div>
            </form>

            {/* STICKY NEVER-CUT-OFF FOOTER */}
            <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>ສ້າງໂຄ້ດສ່ວນຫຼຸດທັນທີ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Coupon Modal */}
      {editingCoupon && (
        <EditCouponDialog
          coupon={editingCoupon}
          products={products}
          onCouponUpdated={() => {
            setEditingCoupon(null);
            fetchCouponsAndProducts();
          }}
        />
      )}

      {/* Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={(code) => {
          setIsCameraScannerOpen(false);
          handleInspectCouponByQuery(code);
        }}
        title="ສະແກນ QR / ບາໂຄ້ດ ຄູປອງສ່ວນຫຼຸດ"
      />
    </div>
  );
}
