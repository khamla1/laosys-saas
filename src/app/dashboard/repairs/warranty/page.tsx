"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit3,
  Loader2,
  Phone,
  User,
  Package,
  Layers,
  LayoutGrid,
  List,
  Printer,
  History,
  Tag,
  Calendar,
  Hash,
  AlertTriangle,
  Check,
  Copy,
  RotateCcw,
  X,
  Wrench,
  FileText,
  Camera
} from "lucide-react";
import { toast } from "sonner";
import { CameraScannerModal } from "@/components/CameraScannerModal";
import {
  BillVerifyResultCard,
  BillVerifyResultData,
  formatTimeDiffLao,
  formatDateTimeLaoStandard,
} from "@/components/BillVerifyResultCard";

interface ClaimEntry {
  id: string;
  claimDate: string;
  issue: string;
  resolution?: string;
  status: "IN_PROGRESS" | "RESOLVED" | "REJECTED" | string;
  cost?: number;
  handledBy?: string;
  notes?: string;
}

interface StatusHistoryEntry {
  id: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  note?: string;
  changedBy: {
    id?: string | null;
    name: string;
    email?: string;
    role?: string;
  };
  changedAt: string;
}

interface WarrantyRecord {
  id: string;
  warrantyNo: string;
  customerName: string;
  customerPhone?: string | null;
  productName: string;
  category?: string | null;
  serialNumber?: string | null;
  purchaseDate: string;
  warrantyPeriodMonths?: number | null;
  expiryDate: string;
  status: "ACTIVE" | "CLAIM_IN_PROGRESS" | "CLAIM_RESOLVED" | "EXPIRED" | "VOID" | string;
  claimHistory?: ClaimEntry[] | null;
  statusHistory?: StatusHistoryEntry[] | null;
  termsAndConditions?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIGS: Record<string, { label: string; badgeColor: string; dotColor: string; icon: any }> = {
  ACTIVE: {
    label: "ຢູ່ໃນໄລຍະຮັບປະກັນ",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    dotColor: "bg-emerald-400",
    icon: ShieldCheck
  },
  CLAIM_IN_PROGRESS: {
    label: "ກຳລັງເຄລມ / ສ້ອມແປງ",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    dotColor: "bg-amber-400",
    icon: ShieldAlert
  },
  CLAIM_RESOLVED: {
    label: "ເຄລມສຳເລັດ",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/25",
    dotColor: "bg-sky-400",
    icon: ShieldCheck
  },
  EXPIRED: {
    label: "ໝົດອາຍຸຮັບປະກັນ",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/25",
    dotColor: "bg-rose-400",
    icon: ShieldX
  },
  VOID: {
    label: "ຍົກເລີກການຮັບປະກັນ",
    badgeColor: "bg-zinc-800 text-zinc-400 border-zinc-700",
    dotColor: "bg-zinc-500",
    icon: Shield
  }
};

const CATEGORIES = [
  "ໄມ້ແບັດມິນຕັນ",
  "ລົດຖີບ",
  "ໄມ້ກ໊ອຟ",
  "ໄມ້ເທັນນິສ",
  "ເກີບກິລາ",
  "ອຸປະກອນ Smart Device",
  "ອຸປະກອນຟິດເນສ",
  "ອື່ນໆ"
];

export default function WarrantyPage() {
  const [records, setRecords] = useState<WarrantyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"board" | "table">("board");

  // Modal State (Create / Edit)
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WarrantyRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [warrantyNo, setWarrantyNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("ໄມ້ແບັດມິນຕັນ");
  const [serialNumber, setSerialNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyPeriodMonths, setWarrantyPeriodMonths] = useState("12");
  const [expiryDate, setExpiryDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [notes, setNotes] = useState("");

  // Claim Modal State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimTarget, setClaimTarget] = useState<WarrantyRecord | null>(null);
  const [claimIssue, setClaimIssue] = useState("");
  const [claimResolution, setClaimResolution] = useState("ສ້ອມແປງຟຣີພາຍໃຕ້ປະກັນ");
  const [claimCost, setClaimCost] = useState("0");
  const [claimNotes, setClaimNotes] = useState("");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Status Change Dialog
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState<WarrantyRecord | null>(null);
  const [statusChoice, setStatusChoice] = useState("ACTIVE");
  const [statusNote, setStatusNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<WarrantyRecord | null>(null);

  // Print Slip Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTarget, setPrintTarget] = useState<WarrantyRecord | null>(null);

  // Quick Copy State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/dashboard/warranty");
      const data = await res.json();
      if (res.ok) {
        setRecords(Array.isArray(data) ? data : []);
      } else {
        toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນບັດຮັບປະກັນໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ຂໍ້ມູນ");
    } finally {
      setIsLoading(false);
    }
  };

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const calculateExpiry = (pDateStr: string, months: number) => {
    if (!pDateStr) return "";
    const pDate = new Date(pDateStr);
    if (isNaN(pDate.getTime())) return "";
    const exp = new Date(pDate);
    exp.setMonth(exp.getMonth() + months);
    return getLocalDateString(exp);
  };

  const handlePeriodChange = (months: number) => {
    setWarrantyPeriodMonths(String(months));
    if (purchaseDate) {
      setExpiryDate(calculateExpiry(purchaseDate, months));
    }
  };

  const handlePurchaseDateChange = (dateVal: string) => {
    setPurchaseDate(dateVal);
    const months = Number(warrantyPeriodMonths) || 12;
    setExpiryDate(calculateExpiry(dateVal, months));
  };

  const resetForm = () => {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const randPart = Math.floor(1000 + Math.random() * 9000);
    setWarrantyNo(`WN-${datePart}-${randPart}`);
    setCustomerName("");
    setCustomerPhone("");
    setProductName("");
    setCategory("ໄມ້ແບັດມິນຕັນ");
    setSerialNumber("");
    const today = getLocalDateString();
    setPurchaseDate(today);
    setWarrantyPeriodMonths("12");
    setExpiryDate(calculateExpiry(today, 12));
    setStatus("ACTIVE");
    setTermsAndConditions("ຮັບປະກັນຄວາມເສຍຫາຍຈາກໂຮງງານຜະລິດ. ບໍ່ຮັບປະກັນກໍລະນີຕົກແຕກ, ດັດແປງ ຫຼື ຖືກນ້ຳ.");
    setNotes("");
    setEditingItem(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (rec: WarrantyRecord) => {
    setEditingItem(rec);
    setWarrantyNo(rec.warrantyNo);
    setCustomerName(rec.customerName);
    setCustomerPhone(rec.customerPhone || "");
    setProductName(rec.productName);
    setCategory(rec.category || "ໄມ້ແບັດມິນຕັນ");
    setSerialNumber(rec.serialNumber || "");
    setPurchaseDate(rec.purchaseDate ? getLocalDateString(new Date(rec.purchaseDate)) : getLocalDateString());
    setWarrantyPeriodMonths(String(rec.warrantyPeriodMonths || 12));
    setExpiryDate(rec.expiryDate ? getLocalDateString(new Date(rec.expiryDate)) : getLocalDateString());
    setStatus(rec.status);
    setTermsAndConditions(rec.termsAndConditions || "");
    setNotes(rec.notes || "");
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !productName.trim() || !purchaseDate || !expiryDate) {
      return toast.error("ກະລຸນາປ້ອນຊື່ລູກຄ້າ, ຊື່ສິນຄ້າ, ວັນທີຊື້ ແລະ ວັນໝົດອາຍຸ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        warrantyNo: warrantyNo.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        productName: productName.trim(),
        category,
        serialNumber: serialNumber.trim() || null,
        purchaseDate: new Date(purchaseDate).toISOString(),
        warrantyPeriodMonths: Number(warrantyPeriodMonths) || 12,
        expiryDate: new Date(expiryDate).toISOString(),
        status,
        termsAndConditions: termsAndConditions.trim() || null,
        notes: notes.trim() || null
      };

      const url = editingItem
        ? `/api/dashboard/warranty/${editingItem.id}`
        : "/api/dashboard/warranty";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingItem ? "ແກ້ໄຂບັດຮັບປະກັນສຳເລັດ" : "ລົງທະບຽນບັດຮັບປະກັນໃໝ່ສຳເລັດ");
        setShowAddModal(false);
        resetForm();
        fetchRecords();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openClaimDialog = (rec: WarrantyRecord) => {
    setClaimTarget(rec);
    setClaimIssue("");
    setClaimResolution("ສ້ອມແປງຟຣີພາຍໃຕ້ປະກັນ");
    setClaimCost("0");
    setClaimNotes("");
    setShowClaimModal(true);
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimTarget || !claimIssue.trim()) {
      return toast.error("ກະລຸນາປ້ອນລາຍລະອຽດອາການ ຫຼື ບັນຫາທີ່ແຈ້ງເຄລມ");
    }

    setIsSubmittingClaim(true);
    try {
      const res = await fetch(`/api/dashboard/warranty/${claimTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CLAIM_IN_PROGRESS",
          newClaim: {
            issue: claimIssue.trim(),
            resolution: claimResolution.trim(),
            status: "IN_PROGRESS",
            cost: Number(claimCost) || 0,
            notes: claimNotes.trim() || null
          },
          actionNote: `ແຈ້ງເຄລມສິນຄ້າ: ${claimIssue.trim()}`
        })
      });

      if (res.ok) {
        toast.success(`ບັນທຶກການແຈ້ງເຄລມສຳລັບ "${claimTarget.productName}" ສຳເລັດ`);
        setShowClaimModal(false);
        setClaimTarget(null);
        fetchRecords();
      } else {
        toast.error("ບໍ່ສາມາດບັນທຶກການເຄລມໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const openStatusDialog = (rec: WarrantyRecord) => {
    setStatusTarget(rec);
    setStatusChoice(rec.status);
    setStatusNote(`ປ່ຽນສະຖານະເປັນ ${STATUS_CONFIGS[rec.status]?.label || rec.status}`);
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return;

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/dashboard/warranty/${statusTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusChoice,
          actionNote: statusNote.trim()
        })
      });

      if (res.ok) {
        toast.success(`ປ່ຽນສະຖານະເປັນ "${STATUS_CONFIGS[statusChoice]?.label || statusChoice}" ແລ້ວ`);
        setShowStatusModal(false);
        setStatusTarget(null);
        fetchRecords();
      } else {
        toast.error("ປ່ຽນສະຖານະບໍ່ສຳເລັດ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async (rec: WarrantyRecord) => {
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການລຶບບັດຮັບປະກັນ "${rec.warrantyNo}" (${rec.productName}) ແທ້ບໍ່?`,
      {
        title: "ຢືນຢັນການລຶບບັດຮັບປະກັນ",
        subMessage: "ຂໍ້ມູນບັດຮັບປະກັນ ແລະ ປະຫວັດການເຄລມຈະຖືກລຶບອອກຈາກລະບົບຖາວອນ.",
        confirmText: "ຢືນຢັນລຶບ",
        cancelText: "ຍົກເລີກ"
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/warranty/${rec.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບບັດຮັບປະກັນສຳເລັດ");
        setRecords(prev => prev.filter(r => r.id !== rec.id));
      } else {
        toast.error("ບໍ່ສາມາດລຶບບັດຮັບປະກັນໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບ");
    }
  };

  const openHistoryDialog = (rec: WarrantyRecord) => {
    setHistoryTarget(rec);
    setShowHistoryModal(true);
  };

  const openPrintDialog = (rec: WarrantyRecord) => {
    setPrintTarget(rec);
    setShowPrintModal(true);
  };

  const handleCopyWarrantyNo = (num: string, id: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    toast.success(`ຄັດລອກເລກທີບັດຮັບປະກັນ ${num} ແລ້ວ`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to check validity
  const getWarrantyHealth = (rec: WarrantyRecord) => {
    const now = new Date();
    const exp = new Date(rec.expiryDate);
    const diffMs = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (rec.status === "VOID") return { text: "ຍົກເລີກແລ້ວ", isExpired: true, color: "text-zinc-500" };
    if (diffDays < 0 || rec.status === "EXPIRED") {
      return { text: "ໝົດອາຍຸແລ້ວ", isExpired: true, color: "text-rose-400" };
    }
    if (diffDays <= 30) {
      return { text: `ໃກ້ໝົດອາຍຸ (ເຫຼືອ ${diffDays} ມື້)`, isExpired: false, color: "text-amber-400 font-bold" };
    }
    return { text: `ເຫຼືອອີກ ${diffDays} ມື້`, isExpired: false, color: "text-emerald-400" };
  };

  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [inspectedWarrantyResult, setInspectedWarrantyResult] = useState<BillVerifyResultData | null>(null);

  const matchWarrantyBySearchTerm = (r: WarrantyRecord, query: string) => {
    const q = query.trim().toLowerCase().replace(/^#/, "");
    if (!q) return true;
    return (
      r.warrantyNo.toLowerCase().includes(q) ||
      (r.serialNumber && r.serialNumber.toLowerCase().includes(q)) ||
      r.customerName.toLowerCase().includes(q) ||
      (r.customerPhone && r.customerPhone.toLowerCase().includes(q)) ||
      r.productName.toLowerCase().includes(q)
    );
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch = matchWarrantyBySearchTerm(r, search);

      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchCategory = categoryFilter === "ALL" || r.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [records, search, statusFilter, categoryFilter]);

  const buildWarrantyInspectionResult = (rec: WarrantyRecord): BillVerifyResultData => {
    const expDt = new Date(rec.expiryDate);
    const now = new Date();
    const diff = formatTimeDiffLao(expDt, now);

    if (rec.status === "VOID") {
      return {
        code: rec.warrantyNo,
        typeLabel: "ໃບຮັບປະກັນສິນຄ້າ (Warranty Certificate)",
        status: "CANCELLED",
        statusTitle: "ບັດຮັບປະກັນນີ້ຖືກຍົກເລີກແລ້ວ (VOID)",
        expiryMessage: `ບັດຮັບປະກັນເລກທີ ${rec.warrantyNo} (${rec.productName}) ຖືກຍົກເລີກການຄຸ້ມຄອງແລ້ວ.`,
        customerName: `${rec.customerName}${rec.customerPhone ? ` (${rec.customerPhone})` : ""}`,
        itemName: `${rec.productName}${rec.serialNumber ? ` (S/N: ${rec.serialNumber})` : ""}`,
        startDateFormatted: formatDateTimeLaoStandard(rec.purchaseDate),
        endDateFormatted: formatDateTimeLaoStandard(rec.expiryDate),
        onViewReceipt: () => openPrintDialog(rec),
      };
    }

    if (diff.isPast || rec.status === "EXPIRED") {
      return {
        code: rec.warrantyNo,
        typeLabel: "ໃບຮັບປະກັນສິນຄ້າ (Warranty Certificate)",
        status: "EXPIRED",
        statusTitle: "ໃບຮັບປະກັນນີ້ໝົດອາຍຸແລ້ວ! (ພົ້ນໄລຍະຄຸ້ມຄອງ)",
        expiryMessage: `ບັດຮັບປະກັນ ${rec.warrantyNo} (${rec.productName}) ໝົດອາຍຸມາແລ້ວ ${diff.text} (ວັນໝົດອາຍຸ: ${formatDateTimeLaoStandard(rec.expiryDate)}).`,
        customerName: `${rec.customerName}${rec.customerPhone ? ` (${rec.customerPhone})` : ""}`,
        itemName: `${rec.productName}${rec.serialNumber ? ` (S/N: ${rec.serialNumber})` : ""}`,
        startDateFormatted: formatDateTimeLaoStandard(rec.purchaseDate),
        endDateFormatted: formatDateTimeLaoStandard(rec.expiryDate),
        extraBadgeText: `ໝົດອາຍຸມາແລ້ວ ${diff.text}`,
        onViewReceipt: () => openPrintDialog(rec),
      };
    }

    return {
      code: rec.warrantyNo,
      typeLabel: "ໃບຮັບປະກັນສິນຄ້າ (Warranty Certificate)",
      status: "VALID",
      statusTitle: "ຍັງບໍ່ໝົດອາຍຸ • ຢູ່ໃນໄລຍະຮັບປະກັນສິນຄ້າ (ໃຊ້ສິດເຄລມໄດ້)",
      expiryMessage: `ບັດຮັບປະກັນ ${rec.warrantyNo} ຍັງຄຸ້ມຄອງປົກກະຕິ — ຍັງເຫຼືອເວລາຮັບປະກັນອີກ ${diff.text} (ສິ້ນສຸດ ${formatDateTimeLaoStandard(rec.expiryDate)}).`,
      customerName: `${rec.customerName}${rec.customerPhone ? ` (${rec.customerPhone})` : ""}`,
      itemName: `${rec.productName}${rec.serialNumber ? ` (S/N: ${rec.serialNumber})` : ""}`,
      startDateFormatted: formatDateTimeLaoStandard(rec.purchaseDate),
      endDateFormatted: formatDateTimeLaoStandard(rec.expiryDate),
      extraBadgeText: `ເຫຼືອປະກັນ ${diff.text}`,
      onViewReceipt: () => openPrintDialog(rec),
    };
  };

  const handleInspectWarrantyByQuery = (rawQuery: string) => {
    const raw = rawQuery.trim();
    if (!raw) return;
    setSearch(raw);

    const match = records.find((r) => matchWarrantyBySearchTerm(r, raw));
    if (match) {
      const result = buildWarrantyInspectionResult(match);
      setInspectedWarrantyResult(result);
      if (result.status === "EXPIRED") {
        toast.error(`${result.statusTitle} (${result.code})`);
      } else if (result.status === "VALID") {
        toast.success(`${result.statusTitle} (${result.code})`);
      } else {
        toast.info(`${result.statusTitle} (${result.code})`);
      }
    } else {
      setInspectedWarrantyResult({
        code: raw.toUpperCase(),
        typeLabel: "ໃບຮັບປະກັນສິນຄ້າ (Warranty Certificate)",
        status: "NOT_FOUND",
        statusTitle: "ບໍ່ພົບເລກທີບັດຮັບປະກັນ ຫຼື Serial Number ນີ້ໃນລະບົບ",
        expiryMessage: `ບໍ່ພົບບັດຮັບປະກັນທີ່ກົງກັບ "${raw}" — ກະລຸນາກວດສອບເລກທີ WRT-... ຫຼື Serial Number ອີກຄັ້ງ.`,
      });
      toast.error(`ບໍ່ພົບບັດຮັບປະກັນ: "${raw}"`);
    }
  };

  // KPIs
  const activeCount = records.filter(r => r.status === "ACTIVE" && new Date(r.expiryDate) >= new Date()).length;
  const claimCount = records.filter(r => r.status === "CLAIM_IN_PROGRESS").length;
  const expiringSoonCount = records.filter(r => {
    if (r.status !== "ACTIVE") return false;
    const diff = (new Date(r.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }).length;
  const expiredCount = records.filter(r => r.status === "EXPIRED" || new Date(r.expiryDate) < new Date()).length;

  const kanbanColumns = [
    { key: "ACTIVE", title: "ຢູ່ໃນໄລຍະຮັບປະກັນ", count: activeCount, color: "text-emerald-400", border: "border-emerald-500/30" },
    { key: "CLAIM_IN_PROGRESS", title: "ກຳລັງເຄລມສິນຄ້າ", count: claimCount, color: "text-amber-400", border: "border-amber-500/30" },
    { key: "CLAIM_RESOLVED", title: "ເຄລມສຳເລັດ", count: records.filter(r => r.status === "CLAIM_RESOLVED").length, color: "text-sky-400", border: "border-sky-500/30" },
    { key: "EXPIRED", title: "ໝົດອາຍຸແລ້ວ", count: expiredCount, color: "text-rose-400", border: "border-rose-500/30" }
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* ── Top Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight">
                ລະບົບຮັບປະກັນສິນຄ້າ
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">
                Warranty & Claims
              </span>
            </div>
            <p className="text-zinc-400 text-xs mt-1">
              ລົງທະບຽນບັດຮັບປະກັນ, ຕິດຕາມວັນໝົດອາຍຸ, ຈັດການການເຄລມສິນຄ້າ ແລະ ພິມໃບຮັບປະກັນ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>ກ້ອງສະແກນ</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-amber-600/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>ລົງທະບຽນຮັບປະກັນໃໝ່</span>
          </button>
        </div>
      </div>

      {/* ── Summary Stats Cards (KPIs) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">ກຳລັງຄຸ້ມຄອງ</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">{activeCount}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">ຢູ່ໃນໄລຍະຮັບປະກັນ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">ກຳລັງເຄລມ</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{claimCount}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">ສົ່ງສ້ອມ / ປ່ຽນເຄື່ອງ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">ໃກ້ໝົດອາຍຸ</span>
            <span className="w-2 h-2 rounded-full bg-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400 mt-2">{expiringSoonCount}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">ເຫຼືອ $\le$ 30 ມື້</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">ໝົດອາຍຸແລ້ວ</span>
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2">{expiredCount}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">ພົ້ນໄລຍະຮັບປະກັນ</p>
        </div>

        <div className="bg-zinc-900/80 border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-zinc-900/80 rounded-2xl p-4 backdrop-blur-xl col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-medium">ບັດຮັບປະກັນລວມ</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{records.length}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">ທຸກລາຍການໃນລະບົບ</p>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ພິມເລກບັດ WRT-..., Serial Number, ຊື່ລູກຄ້າ ຫຼື ຊື່ສິນຄ້າ..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  if (!e.target.value.trim()) setInspectedWarrantyResult(null);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && search.trim()) {
                    e.preventDefault();
                    handleInspectWarrantyByQuery(search);
                  }
                }}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            {search.trim() && (
              <button
                type="button"
                onClick={() => handleInspectWarrantyByQuery(search)}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                ກວດສອບບັດ
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
              title="ສະແກນ QR / Barcode ບັດຮັບປະກັນ"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">ກ້ອງສະແກນ</span>
            </button>
          </div>

          {/* Right Filters & View Mode */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">ທຸກສະຖານະ ({records.length})</option>
              <option value="ACTIVE">ຢູ່ໃນປະກັນ ({activeCount})</option>
              <option value="CLAIM_IN_PROGRESS">ກຳລັງເຄລມ ({claimCount})</option>
              <option value="CLAIM_RESOLVED">ເຄລມສຳເລັດ</option>
              <option value="EXPIRED">ໝົດອາຍຸ ({expiredCount})</option>
            </select>

            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">ທຸກໝວດໝູ່</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode("board")}
                title="ມຸມມອງກະດານຂັ້ນຕອນ (Board View)"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "board" ? "bg-zinc-800 text-amber-400" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                title="ມຸມມອງຕາຕະລາງ (Table View)"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "table" ? "bg-zinc-800 text-amber-400" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* -- Scanned / Searched Warranty Certificate Verification Banner -- */}
      {(inspectedWarrantyResult ||
        (search.trim().length >= 3 && filteredRecords.length === 1)) && (
        <BillVerifyResultCard
          data={
            inspectedWarrantyResult ||
            buildWarrantyInspectionResult(filteredRecords[0])
          }
          onClose={() => {
            setInspectedWarrantyResult(null);
            setSearch("");
          }}
        />
      )}

      {/* ── Content View (Board vs Table) ── */}
      {isLoading ? (
        <div className="p-16 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
          <p className="text-zinc-400 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນບັດຮັບປະກັນສິນຄ້າ...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-16 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-4 text-zinc-500 border border-zinc-700/50">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">ບໍ່ພົບຂໍ້ມູນບັດຮັບປະກັນ</h3>
          <p className="text-zinc-400 text-xs max-w-sm mb-5">
            {search || statusFilter !== "ALL" || categoryFilter !== "ALL"
              ? "ບໍ່ພົບຂໍ້ມູນທີ່ກົງກັບເງື່ອນໄຂຄົ້ນຫາ ລອງປັບຕົວກອງໃໝ່"
              : "ຍັງບໍ່ທັນມີການລົງທະບຽນບັດຮັບປະກັນ ກົດປຸ່ມດ້ານລຸ່ມເພື່ອເພີ່ມ"}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>ລົງທະບຽນບັດຮັບປະກັນໃໝ່</span>
          </button>
        </div>
      ) : viewMode === "board" ? (
        /* ── Kanban Board View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map(col => {
            const colRecords = filteredRecords.filter(r => {
              if (col.key === "EXPIRED") {
                return r.status === "EXPIRED" || new Date(r.expiryDate) < new Date();
              }
              if (col.key === "ACTIVE") {
                return r.status === "ACTIVE" && new Date(r.expiryDate) >= new Date();
              }
              return r.status === col.key;
            });

            return (
              <div
                key={col.key}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl"
              >
                {/* Column Header */}
                <div className={`p-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60 ${col.border}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{col.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-zinc-800 ${col.color}`}>
                      {colRecords.length}
                    </span>
                  </div>
                </div>

                {/* Column Records List */}
                <div className="p-2.5 space-y-2.5 min-h-[320px] max-h-[75vh] overflow-y-auto custom-scrollbar">
                  {colRecords.length === 0 ? (
                    <div className="py-12 text-center text-zinc-600 text-xs">
                      ບໍ່ມີລາຍການໃນຂັ້ນຕອນນີ້
                    </div>
                  ) : (
                    colRecords.map(rec => {
                      const health = getWarrantyHealth(rec);
                      const isExpired = health.isExpired;

                      return (
                        <div
                          key={rec.id}
                          className={`bg-zinc-950/80 border ${isExpired ? 'border-rose-500/30' : 'border-zinc-800/80 hover:border-zinc-700/80'} rounded-xl p-3 space-y-2.5 transition-all group shadow-sm`}
                        >
                          {/* Warranty No & Copy */}
                          <div className="flex items-center justify-between gap-1.5">
                            <button
                              onClick={() => handleCopyWarrantyNo(rec.warrantyNo, rec.id)}
                              title="ຄລິກເພື່ອຄັດລອກເລກທີ"
                              className="font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 hover:border-amber-500/40 flex items-center gap-1"
                            >
                              <span>{rec.warrantyNo}</span>
                              {copiedId === rec.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-zinc-500" />
                              )}
                            </button>

                            {rec.category && (
                              <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                                {rec.category}
                              </span>
                            )}
                          </div>

                          {/* Product Name */}
                          <div>
                            <h4 className="font-bold text-white text-sm leading-snug line-clamp-1 group-hover:text-amber-300 transition-colors">
                              {rec.productName}
                            </h4>
                            {rec.serialNumber && (
                              <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1 mt-0.5">
                                <Hash className="w-3 h-3 text-zinc-600" />
                                <span>S/N: {rec.serialNumber}</span>
                              </div>
                            )}
                          </div>

                          {/* Customer Details */}
                          <div className="bg-zinc-900/70 rounded-lg p-2 border border-zinc-800/60 text-xs space-y-1">
                            <div className="flex items-center justify-between text-zinc-300">
                              <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                                <User className="w-3 h-3 text-amber-400" />
                                <span className="line-clamp-1 font-medium">{rec.customerName}</span>
                              </span>
                              {rec.customerPhone && (
                                <span className="text-[11px] text-zinc-400 font-mono">
                                  {rec.customerPhone}
                                </span>
                              )}
                            </div>

                            {/* Dates */}
                            <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/40 pt-1">
                              <span className="text-zinc-500">ວັນທີຊື້:</span>
                              <span>{new Date(rec.purchaseDate).toLocaleDateString("lo-LA")}</span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] border-t border-zinc-800/40 pt-1">
                              <span className="text-zinc-500">ໝົດອາຍຸ:</span>
                              <span className={`font-semibold ${health.color}`}>
                                {new Date(rec.expiryDate).toLocaleDateString("lo-LA")}
                              </span>
                            </div>

                            <div className="text-[10px] text-right font-medium text-zinc-500">
                              ({health.text})
                            </div>
                          </div>

                          {/* Action Footer */}
                          <div className="pt-1.5 border-t border-zinc-800/60 flex items-center justify-between gap-1">
                            {/* File claim or resolve claim */}
                            {!isExpired && rec.status === "ACTIVE" ? (
                              <button
                                onClick={() => openClaimDialog(rec)}
                                className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                              >
                                <Wrench className="w-2.5 h-2.5" />
                                <span>ແຈ້ງເຄລມ</span>
                              </button>
                            ) : rec.status === "CLAIM_IN_PROGRESS" ? (
                              <button
                                onClick={() => openStatusDialog(rec)}
                                className="px-2 py-1 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 rounded-lg text-[10px] font-bold transition-colors"
                              >
                                ອັບເດດເຄລມ
                              </button>
                            ) : (
                              <span className="text-[10px] text-zinc-500">
                                {isExpired ? "ໝົດປະກັນ" : rec.status}
                              </span>
                            )}

                            {/* Utility actions */}
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => openPrintDialog(rec)}
                                title="ພິມໃບບັດຮັບປະກັນ"
                                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openHistoryDialog(rec)}
                                title="ປະຫວັດການປ່ຽນສະຖານະ"
                                className="p-1 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal(rec)}
                                title="ແກ້ໄຂ"
                                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(rec)}
                                title="ລຶບ"
                                className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950/70 text-xs text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4">ເລກທີບັດ & S/N</th>
                  <th className="py-3.5 px-4">ລູກຄ້າ</th>
                  <th className="py-3.5 px-4">ສິນຄ້າ & ໝວດໝູ່</th>
                  <th className="py-3.5 px-4 text-center">ໄລຍະເວລາ (ຊື້ - ໝົດອາຍຸ)</th>
                  <th className="py-3.5 px-4 text-center">ສະຖານະ</th>
                  <th className="py-3.5 px-4 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredRecords.map(rec => {
                  const statusCfg = STATUS_CONFIGS[rec.status] || STATUS_CONFIGS.ACTIVE;
                  const health = getWarrantyHealth(rec);

                  return (
                    <tr key={rec.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Warranty No */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleCopyWarrantyNo(rec.warrantyNo, rec.id)}
                          className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 hover:border-amber-500/40 inline-flex items-center gap-1"
                        >
                          <span>{rec.warrantyNo}</span>
                          {copiedId === rec.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-zinc-500" />
                          )}
                        </button>
                        {rec.serialNumber && (
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            S/N: {rec.serialNumber}
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white text-sm">{rec.customerName}</div>
                        {rec.customerPhone && (
                          <div className="text-xs text-zinc-400 font-mono mt-0.5">{rec.customerPhone}</div>
                        )}
                      </td>

                      {/* Product & Category */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm line-clamp-1">{rec.productName}</div>
                        {rec.category && (
                          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800 inline-block mt-0.5">
                            {rec.category}
                          </span>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4 text-center">
                        <div className="text-xs text-zinc-300">
                          {new Date(rec.purchaseDate).toLocaleDateString("lo-LA")} - {new Date(rec.expiryDate).toLocaleDateString("lo-LA")}
                        </div>
                        <div className={`text-[11px] font-semibold mt-0.5 ${health.color}`}>
                          {health.text}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${statusCfg.badgeColor}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                          <span>{statusCfg.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openPrintDialog(rec)}
                            title="ພິມໃບບັດຮັບປະກັນ"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openClaimDialog(rec)}
                            title="ແຈ້ງເຄລມສິນຄ້າ"
                            className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openHistoryDialog(rec)}
                            title="ປະຫວັດການປ່ຽນສະຖານະ"
                            className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(rec)}
                            title="ແກ້ໄຂ"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rec)}
                            title="ລຶບ"
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ── Add / Edit Warranty Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {editingItem ? "ແກ້ໄຂບັດຮັບປະກັນສິນຄ້າ" : "ລົງທະບຽນບັດຮັບປະກັນໃໝ່"}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {editingItem ? `ເລກທີ: ${editingItem.warrantyNo}` : "ບັນທຶກຂໍ້ມູນການຊື້, ກຳນົດໄລຍະເວລາ ແລະ ເງື່ອນໄຂການຮັບປະກັນ"}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              <form id="warranty-form" onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Warranty No & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ເລກທີບັດຮັບປະກັນ (Warranty No)
                    </label>
                    <input
                      type="text"
                      value={warrantyNo}
                      onChange={e => setWarrantyNo(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ສະຖານະການຮັບປະກັນ
                    </label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="ACTIVE">ຢູ່ໃນໄລຍະຮັບປະກັນ (Active)</option>
                      <option value="CLAIM_IN_PROGRESS">ກຳລັງເຄລມ / ສ້ອມແປງ (In Claim)</option>
                      <option value="CLAIM_RESOLVED">ເຄລມສຳເລັດ (Resolved)</option>
                      <option value="EXPIRED">ໝົດອາຍຸຮັບປະກັນ (Expired)</option>
                      <option value="VOID">ຍົກເລີກການຮັບປະກັນ (Void)</option>
                    </select>
                  </div>
                </div>

                {/* 2. Customer Info */}
                <div className="border-t border-zinc-800/80 pt-4">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>ຂໍ້ມູນລູກຄ້າ (Customer Details)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ຊື່ລູກຄ້າ <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        required
                        placeholder="ຕົວຢ່າງ: ທ່ານ ຄຳຫຼ້າ ໄຊຍະວົງ"
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ເບີໂທຕິດຕໍ່
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="020 5511 2233"
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Product Info */}
                <div className="border-t border-zinc-800/80 pt-4">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    <span>ຂໍ້ມູນສິນຄ້າ (Product Details)</span>
                  </h3>
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          ຊື່ສິນຄ້າ / ລຸ້ນອຸປະກອນ <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={productName}
                          onChange={e => setProductName(e.target.value)}
                          required
                          placeholder="ຕົວຢ່າງ: ໄມ້ແບັດ Yonex Nanoflare 1000Z, ລົດຖີບ Trek Madone"
                          className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          ໝວດໝູ່
                        </label>
                        <select
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                        >
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ໝາຍເລກຊີຣຽວ (Serial Number / S/N)
                      </label>
                      <input
                        type="text"
                        value={serialNumber}
                        onChange={e => setSerialNumber(e.target.value)}
                        placeholder="ຕົວຢ່າງ: YNX-2026-987654"
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Warranty Period & Dates */}
                <div className="border-t border-zinc-800/80 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>ໄລຍະເວລາຮັບປະກັນ (Warranty Period)</span>
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-zinc-500">ໄລຍະ:</span>
                      <button
                        type="button"
                        onClick={() => handlePeriodChange(3)}
                        className={`px-2 py-0.5 rounded ${warrantyPeriodMonths === "3" ? "bg-amber-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
                      >
                        3 ເດືອນ
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePeriodChange(6)}
                        className={`px-2 py-0.5 rounded ${warrantyPeriodMonths === "6" ? "bg-amber-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
                      >
                        6 ເດືອນ
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePeriodChange(12)}
                        className={`px-2 py-0.5 rounded ${warrantyPeriodMonths === "12" ? "bg-amber-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
                      >
                        1 ປີ (12 ເດືອນ)
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePeriodChange(24)}
                        className={`px-2 py-0.5 rounded ${warrantyPeriodMonths === "24" ? "bg-amber-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
                      >
                        2 ປີ (24 ເດືອນ)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ວັນທີຊື້ສິນຄ້າ <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="date"
                        value={purchaseDate}
                        onChange={e => handlePurchaseDateChange(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ວັນທີໝົດອາຍຸຮັບປະກັນ <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={e => setExpiryDate(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Terms & Conditions */}
                <div className="border-t border-zinc-800/80 pt-4">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ເງື່ອນໄຂ ແລະ ຂໍ້ຕົກລົງການຮັບປະກັນ (Terms & Conditions)
                  </label>
                  <textarea
                    value={termsAndConditions}
                    onChange={e => setTermsAndConditions(e.target.value)}
                    rows={2}
                    placeholder="ຕົວຢ່າງ: ຮັບປະກັນຄວາມເສຍຫາຍຈາກໂຮງງານ. ບໍ່ຮັບປະກັນກໍລະນີຕົກແຕກ ຫຼື ດັດແປງເອງ..."
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* 6. Notes */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ໝາຍເຫດເພີ່ມເຕີມ
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="ຕົວຢ່າງ: ແຖມກຣິບຢາງ 1 ອັນ, ລູກຄ້າມີໃບເຊັດຊື້..."
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-zinc-800 bg-zinc-950/70 flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold transition-colors"
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                form="warranty-form"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{editingItem ? "ບັນທຶກການແກ້ໄຂ" : "ລົງທະບຽນບັດຮັບປະກັນ"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── File Claim Modal (ແຈ້ງເຄລມສິນຄ້າ) ── */}
      {showClaimModal && claimTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800 bg-zinc-950/70 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ແຈ້ງເຄລມສິນຄ້າ (File Claim)</h3>
                  <p className="text-xs text-zinc-400">
                    ບັດ: {claimTarget.warrantyNo} ({claimTarget.productName})
                  </p>
                </div>
              </div>
              <button onClick={() => setShowClaimModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ອາການ / ບັນຫາທີ່ແຈ້ງເຄລມ <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={claimIssue}
                  onChange={e => setClaimIssue(e.target.value)}
                  required
                  rows={2}
                  placeholder="ຕົວຢ່າງ: ຫົວໄມ້ແຕກຈາກການຕີປົກກະຕິ, ໂຄງລົດມີຮອຍຮ້າວ..."
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ແນວທາງການແກ້ໄຂ / ຜົນການກວດສອບ
                </label>
                <select
                  value={claimResolution}
                  onChange={e => setClaimResolution(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="ສ້ອມແປງຟຣີພາຍໃຕ້ປະກັນ">ສ້ອມແປງຟຣີພາຍໃຕ້ປະກັນ</option>
                  <option value="ປ່ຽນສິນຄ້າໃໝ່ (Replace with New)">ປ່ຽນສິນຄ້າໃໝ່ (Replace with New)</option>
                  <option value="ປ່ຽນອາໄຫຼ່ຟຣີ">ປ່ຽນອາໄຫຼ່ຟຣີ</option>
                  <option value="ສົ່ງໂຮງງານກວດສອບເພີ່ມເຕີມ">ສົ່ງໂຮງງານກວດສອບເພີ່ມເຕີມ</option>
                  <option value="ປະຕິເສດການເຄລມ (ຫຼຸດເງື່ອນໄຂ)">ປະຕິເສດການເຄລມ (ຫຼຸດເງື່ອນໄຂ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ມູນຄ່າທີ່ຮ້ານຄ້າຮັບຜິດຊອບ (₭)
                </label>
                <input
                  type="number"
                  min="0"
                  value={claimCost}
                  onChange={e => setClaimCost(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ໝາຍເຫດເພີ່ມເຕີມ
                </label>
                <textarea
                  value={claimNotes}
                  onChange={e => setClaimNotes(e.target.value)}
                  rows={2}
                  placeholder="ຕົວຢ່າງ: ສົ່ງຕໍ່ໄປສູນສ້ອມແປງ, ກຳນົດແລ້ວ 3 ມື້..."
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClaim}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/30"
                >
                  {isSubmittingClaim && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>ຢືນຢັນເປີດໃບເຄລມ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Status Change Dialog ── */}
      {showStatusModal && statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800 bg-zinc-950/70 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">ປ່ຽນສະຖານະການຮັບປະກັນ</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {statusTarget.warrantyNo} ({statusTarget.productName})
                </p>
              </div>
              <button onClick={() => setShowStatusModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ສະຖານະໃໝ່
                </label>
                <select
                  value={statusChoice}
                  onChange={e => setStatusChoice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="ACTIVE">ຢູ່ໃນໄລຍະຮັບປະກັນ (Active)</option>
                  <option value="CLAIM_IN_PROGRESS">ກຳລັງເຄລມ / ສ້ອມແປງ (In Claim)</option>
                  <option value="CLAIM_RESOLVED">ເຄລມສຳເລັດ (Resolved)</option>
                  <option value="EXPIRED">ໝົດອາຍຸຮັບປະກັນ (Expired)</option>
                  <option value="VOID">ຍົກເລີກການຮັບປະກັນ (Void)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ໝາຍເຫດ (ຈະຖືກບັນທຶກເຂົ້າປະຫວັດ)
                </label>
                <textarea
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={isUpdatingStatus}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                {isUpdatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>ຢືນຢັນປ່ຽນສະຖານະ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status History Audit Trail Modal ── */}
      {showHistoryModal && historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ປະຫວັດການປ່ຽນສະຖານະ & ການເຄລມ</h3>
                  <p className="text-xs text-zinc-400">
                    ບັດ: {historyTarget.warrantyNo} ({historyTarget.productName})
                  </p>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              {/* Claim Records if any */}
              {historyTarget.claimHistory && historyTarget.claimHistory.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>ປະຫວັດການແຈ້ງເຄລມ ({historyTarget.claimHistory.length} ຄັ້ງ)</span>
                  </h4>
                  <div className="space-y-2">
                    {historyTarget.claimHistory.map(c => (
                      <div key={c.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-white">
                          <span>{c.issue}</span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {new Date(c.claimDate).toLocaleDateString("lo-LA")}
                          </span>
                        </div>
                        <div className="text-zinc-400">
                          ຜົນການແກ້ໄຂ: <strong className="text-emerald-400">{c.resolution}</strong>
                        </div>
                        {c.cost ? (
                          <div className="text-zinc-500 text-[11px]">
                            ມູນຄ່າທີ່ຮ້ານຄຸ້ມຄອງ: {c.cost.toLocaleString()} ₭
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Audit Trail */}
              <div>
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>ປະຫວັດການປ່ຽນແປງ & ຜູ້ດຳເນີນການ</span>
                </h4>
                {!historyTarget.statusHistory || historyTarget.statusHistory.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-xs">
                    ຍັງບໍ່ມີປະຫວັດການປ່ຽນສະຖານະ
                  </div>
                ) : (
                  <div className="relative border-l-2 border-zinc-800 ml-3 space-y-5">
                    {historyTarget.statusHistory.map((h, idx) => (
                      <div key={h.id || idx} className="relative pl-6">
                        <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-zinc-900 border-2 border-indigo-500" />
                        <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-indigo-400">
                              {STATUS_CONFIGS[h.toStatus]?.label || h.toStatus}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              {new Date(h.changedAt).toLocaleString("lo-LA")}
                            </span>
                          </div>

                          {h.note && (
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              {h.note}
                            </p>
                          )}

                          <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60 flex items-center justify-between">
                            <span>ຜູ້ດຳເນີນການ:</span>
                            <span className="text-white font-medium flex items-center gap-1">
                              <User className="w-3 h-3 text-indigo-400" />
                              {h.changedBy?.name || h.changedBy?.email || "Staff"}
                              {h.changedBy?.role && (
                                <span className="text-[10px] text-zinc-500">({h.changedBy.role})</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold"
              >
                ປິດ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Printable Warranty Certificate Modal (ໃບບັດຮັບປະກັນສິນຄ້າ) ── */}
      {showPrintModal && printTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/80">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white text-sm">ຕົວຢ່າງໃບບັດຮັບປະກັນ (Warranty Certificate Preview)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>ສັ່ງພິມບັດຮັບປະກັນ</span>
                </button>
                <button onClick={() => setShowPrintModal(false)} className="text-zinc-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Paper Area */}
            <div className="p-6 overflow-y-auto bg-zinc-950/90 text-zinc-900 custom-scrollbar">
              <div className="bg-white text-black p-8 rounded-2xl shadow-xl border-2 border-amber-600 font-sans space-y-5 max-w-xl mx-auto text-xs relative">
                {/* Decorative border stamp */}
                <div className="text-center border-b-2 border-amber-600 pb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-800 mb-2 border border-amber-300">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-wider text-black">
                    ໃບບັດຮັບປະກັນສິນຄ້າ
                  </h2>
                  <p className="text-[11px] text-zinc-600 tracking-wide">
                    OFFICIAL PRODUCT WARRANTY CERTIFICATE
                  </p>
                  <div className="inline-block mt-2 px-3 py-1 bg-black text-white font-mono font-bold text-sm rounded">
                    ເລກທີບັດ: {printTarget.warrantyNo}
                  </div>
                </div>

                {/* Customer and Product Details */}
                <div className="grid grid-cols-2 gap-4 border-b pb-4 border-zinc-200">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">ຂໍ້ມູນຜູ້ຖືບັດຮັບປະກັນ:</span>
                    <div className="font-bold text-sm text-black">{printTarget.customerName}</div>
                    <div className="font-mono text-xs text-zinc-700">{printTarget.customerPhone || "ບໍ່ມີເບີໂທ"}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">ສິນຄ້າ / ອຸປະກອນ:</span>
                    <div className="font-bold text-sm text-black">{printTarget.productName}</div>
                    {printTarget.serialNumber && (
                      <div className="font-mono text-xs text-zinc-700">S/N: {printTarget.serialNumber}</div>
                    )}
                  </div>
                </div>

                {/* Warranty Duration */}
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 grid grid-cols-2 gap-3 text-center">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">ວັນທີເລີ່ມຄຸ້ມຄອງ:</span>
                    <div className="font-bold text-sm text-black mt-0.5">
                      {new Date(printTarget.purchaseDate).toLocaleDateString("lo-LA")}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">ວັນທີໝົດອາຍຸ:</span>
                    <div className="font-bold text-sm text-amber-800 mt-0.5">
                      {new Date(printTarget.expiryDate).toLocaleDateString("lo-LA")}
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="text-[10px] text-zinc-600 leading-relaxed border-b pb-4 border-zinc-200 space-y-1">
                  <div className="font-bold text-black uppercase text-[11px]">ເງື່ອນໄຂການຮັບປະກັນ:</div>
                  <p>1. {printTarget.termsAndConditions || "ຮັບປະກັນຄວາມເສຍຫາຍທີ່ເກີດຈາກຂະບວນການຜະລິດຂອງໂຮງງານ."}</p>
                  <p>2. ບັດຮັບປະກັນນີ້ບໍ່ກວມເອົາຄວາມເສຍຫາຍຈາກອຸບັດຕິເຫດ, ການຕົກແຕກ, ຖືກນ້ຳ ຫຼື ດັດແປງໂດຍບໍ່ໄດ້ຮັບອະນຸຍາດ.</p>
                  <p>3. ກະລຸນາເກັບຮັກສາໃບບັດຮັບປະກັນນີ້ໄວ້ເພື່ອສະແດງຕໍ່ເຈົ້າໜ້າທີ່ໃນກໍລະນີຂໍໃຊ້ສິດເຄລມ.</p>
                </div>

                {/* Signatures & Seal */}
                <div className="grid grid-cols-2 pt-2 text-center text-xs">
                  <div>
                    <div className="h-10 border-b border-dashed border-zinc-400 mx-6 mb-1" />
                    <span className="text-zinc-600">ລາຍເຊັນລູກຄ້າ</span>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-zinc-400 mx-6 mb-1" />
                    <span className="text-zinc-600">ກາປະທັບ ແລະ ລາຍເຊັນຮ້ານຄ້າ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={(code) => {
          handleInspectWarrantyByQuery(code);
          setIsCameraScannerOpen(false);
        }}
        title="ສະແກນກວດສອບໃບຮັບປະກັນ (Scan Warranty)"
        subtitle="ສ່ອງກ້ອງໃສ່ບາໂຄດ ຫຼື QR Code ໃບຮັບປະກັນ / Serial Number ເພື່ອກວດສອບວັນໝົດອາຍຸ"
        placeholder="ຍິງເຄື່ອງສະແກນ ຫຼື ພິມເລກທີ WRT-..."
      />
    </div>
  );
}
