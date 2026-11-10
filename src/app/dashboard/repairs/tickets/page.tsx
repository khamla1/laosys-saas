"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useMemo } from "react";
import {
  Wrench,
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
  ShieldCheck,
  Tag,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Check,
  Copy,
  AlertTriangle,
  Banknote,
  DollarSign,
  Flame,
  Zap,
  RotateCcw,
  X,
  FileText,
  CreditCard,
  Eye,
  Kanban,
  Calendar,
  Filter,
  Camera
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { CameraScannerModal } from "@/components/CameraScannerModal";
import {
  BillVerifyResultCard,
  BillVerifyResultData,
  formatTimeDiffLao,
  formatDateTimeLaoStandard,
} from "@/components/BillVerifyResultCard";

interface PartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
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

interface RepairTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone?: string | null;
  itemName: string;
  issueDesc: string;
  status: "PENDING" | "IN_PROGRESS" | "WAITING_PARTS" | "COMPLETED" | "DELIVERED" | "CANCELLED" | string;
  priority?: "NORMAL" | "URGENT" | "EXPRESS" | string;
  technicianName?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  depositPaid?: number | null;
  partsUsed?: PartItem[] | null;
  statusHistory?: StatusHistoryEntry[] | null;
  notes?: string | null;
  completionDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIGS: Record<string, { label: string; badgeColor: string; dotColor: string; colBorder: string }> = {
  PENDING: {
    label: "ລໍຖ້າກວດເຊັກ",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    dotColor: "bg-amber-400",
    colBorder: "border-amber-500/30"
  },
  IN_PROGRESS: {
    label: "ກຳລັງສ້ອມແປງ",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    dotColor: "bg-blue-400",
    colBorder: "border-blue-500/30"
  },
  WAITING_PARTS: {
    label: "ລໍຖ້າອາໄຫຼ່",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/25",
    dotColor: "bg-purple-400",
    colBorder: "border-purple-500/30"
  },
  COMPLETED: {
    label: "ສ້ອມສຳເລັດ / ພ້ອມມອບ",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    dotColor: "bg-emerald-400",
    colBorder: "border-emerald-500/30"
  },
  DELIVERED: {
    label: "ມອບຄືນລູກຄ້າແລ້ວ",
    badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/25",
    dotColor: "bg-teal-400",
    colBorder: "border-teal-500/30"
  },
  CANCELLED: {
    label: "ຍົກເລີກການສ້ອມ",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/25",
    dotColor: "bg-rose-400",
    colBorder: "border-rose-500/30"
  }
};

const PRIORITY_CONFIGS: Record<string, { label: string; badgeColor: string; icon: any }> = {
  NORMAL: {
    label: "ປົກກະຕິ",
    badgeColor: "bg-zinc-800 text-zinc-300 border-zinc-700",
    icon: Clock
  },
  URGENT: {
    label: "ດ່ວນ (Urgent)",
    badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: Zap
  },
  EXPRESS: {
    label: "ດ່ວນພິເສດ (Express)",
    badgeColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    icon: Flame
  }
};

const COMMON_SPORTS = [
  "ແບັດມິນຕັນ (ຂຶ້ນເອັນ / ປ່ຽນກຣິບ)",
  "ກ໊ອຟ (ປ່ຽນກຣິບ / ປ່ຽນກ້ານ)",
  "ລົດຖີບ (ຈູນເກຍ / ຕັ້ງສູນລໍ້ / ປ່ຽນຢາງ)",
  "ເທັນນິສ (ຂຶ້ນເອັນ)",
  "ເກີບກິລາ / ຊຸດກິລາ",
  "ອຸປະກອນຟິດເນສ",
  "ອື່ນໆ"
];

export default function RepairTicketsPage() {
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "board" | "table">("grid");

  // Detail Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTargetTicket, setDetailTargetTicket] = useState<RepairTicket | null>(null);

  const openDetailDialog = (t: RepairTicket) => {
    setDetailTargetTicket(t);
    setShowDetailModal(true);
  };

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RepairTicket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [ticketNumber, setTicketNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("ແບັດມິນຕັນ (ຂຶ້ນເອັນ / ປ່ຽນກຣິບ)");
  const [issueDesc, setIssueDesc] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [priority, setPriority] = useState("NORMAL");
  const [technicianName, setTechnicianName] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("150000");
  const [actualCost, setActualCost] = useState("150000");
  const [depositPaid, setDepositPaid] = useState("0");
  const [notes, setNotes] = useState("");
  const [parts, setParts] = useState<PartItem[]>([]);

  // Fast Status Change Dialog
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatusTicket, setTargetStatusTicket] = useState<RepairTicket | null>(null);
  const [newStatusChoice, setNewStatusChoice] = useState<string>("IN_PROGRESS");
  const [statusChangeNote, setStatusChangeNote] = useState<string>("");
  const [statusActualCostInput, setStatusActualCostInput] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTargetTicket, setHistoryTargetTicket] = useState<RepairTicket | null>(null);

  // Print Claim Slip Modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTargetTicket, setPrintTargetTicket] = useState<RepairTicket | null>(null);
  const [printFormat, setPrintFormat] = useState<"SLIP" | "A4">("SLIP");

  // Copy Ticket No State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const getConvertedOrderId = (t: RepairTicket) => {
    if (t.notes) {
      try {
        const p = JSON.parse(t.notes);
        if (p.convertedOrderId) return p.convertedOrderId;
      } catch {}
    }
    const hist = Array.isArray(t.statusHistory) ? (t.statusHistory as any[]) : [];
    const found = hist.find((h: any) => h.action === "CONVERTED_TO_ORDER" || h.orderId);
    return found?.orderId || null;
  };

  // Quick Add Category State
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [showQuickAddCatModal, setShowQuickAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isSavingCat, setIsSavingCat] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/dashboard/categories");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDbCategories(data.map((c: any) => c.name || c));
      }
    } catch {}
  };

  const handleQuickSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ໝວດໝູ່ / ປະເພດອຸປະກອນໃໝ່");
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
        setItemCategory(catTitle);
        setShowQuickAddCatModal(false);
        setNewCatName("");
        toast.success(`ເພີ່ມປະເພດ "${catTitle}" ເຂົ້າລະບົບສຳເລັດ`);
      } else {
        toast.error("ບໍ່ສາມາດບັນທຶກໝວດໝູ່ໃໝ່ໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSavingCat(false);
    }
  };

  const allRepairCategories = useMemo(() => {
    const defaultRepairCats = [
      "ແບັດມິນຕັນ (ຂຶ້ນເອັນ / ປ່ຽນກຣິບ)",
      "ລົດຖີບ (ເຊັກໄລຍະ / ປ່ຽນຢາງ / ເບກ)",
      "ກອຟ (ປ່ຽນກຣິບ / ດັດກ້ານ)",
      "ເທັນນິດ (ຂຶ້ນເອັນ)",
      "ແຄ້ມປິ້ງ & ເຕັນ (ຊ້ອມຜ້າເຕັນ / ຊິບ)",
      "ຟິດເນັດ & ເຄື່ອງອອກກຳລັງກາຍ",
      "ອື່ນໆ"
    ];
    return Array.from(new Set([...defaultRepairCats, ...dbCategories]));
  }, [dbCategories]);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/dashboard/repairs");
      const data = await res.json();
      if (res.ok) {
        setTickets(Array.isArray(data) ? data : []);
      } else {
        toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໃບສ້ອມແປງໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ຂໍ້ມູນ");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const randPart = Math.floor(1000 + Math.random() * 9000);
    setTicketNumber(`REP-${datePart}-${randPart}`);
    setCustomerName("");
    setCustomerPhone("");
    setItemName("");
    setItemCategory("ແບັດມິນຕັນ (ຂຶ້ນເອັນ / ປ່ຽນກຣິບ)");
    setIssueDesc("");
    setStatus("PENDING");
    setPriority("NORMAL");
    setTechnicianName("");
    setEstimatedCost("150000");
    setActualCost("150000");
    setDepositPaid("0");
    setNotes("");
    setParts([]);
    setEditingItem(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (t: RepairTicket) => {
    setEditingItem(t);
    setTicketNumber(t.ticketNumber);
    setCustomerName(t.customerName);
    setCustomerPhone(t.customerPhone || "");
    setItemName(t.itemName);
    setIssueDesc(t.issueDesc);
    setStatus(t.status);
    setPriority(t.priority || "NORMAL");
    setTechnicianName(t.technicianName || "");
    setEstimatedCost(t.estimatedCost !== null && t.estimatedCost !== undefined ? String(t.estimatedCost) : "0");
    setActualCost(t.actualCost !== null && t.actualCost !== undefined ? String(t.actualCost) : "0");
    setDepositPaid(t.depositPaid !== null && t.depositPaid !== undefined ? String(t.depositPaid) : "0");
    setNotes(t.notes || "");
    setParts(Array.isArray(t.partsUsed) ? t.partsUsed : []);
    setShowAddModal(true);
  };

  const handleAddPartRow = () => {
    setParts(prev => [
      ...prev,
      { id: `part-${Date.now()}-${Math.random()}`, name: "", quantity: 1, unitPrice: 0 }
    ]);
  };

  const handleRemovePartRow = (id: string) => {
    setParts(prev => prev.filter(p => p.id !== id));
  };

  const handlePartChange = (id: string, field: keyof PartItem, value: any) => {
    setParts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        return { ...p, [field]: value };
      })
    );
  };

  // Recalculate estimated / actual cost when parts change
  const totalPartsCost = useMemo(() => {
    return parts.reduce((sum, p) => sum + (Number(p.quantity) || 1) * (Number(p.unitPrice) || 0), 0);
  }, [parts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !itemName.trim() || !issueDesc.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ລູກຄ້າ, ຊື່ອຸປະກອນ ແລະ ລາຍລະອຽດບັນຫາ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ticketNumber: ticketNumber.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        itemName: itemName.trim(),
        issueDesc: issueDesc.trim(),
        status,
        priority,
        technicianName: technicianName.trim() || null,
        estimatedCost: Number(estimatedCost) || 0,
        actualCost: Number(actualCost) || 0,
        depositPaid: Number(depositPaid) || 0,
        partsUsed: parts.filter(p => p.name.trim() !== ""),
        notes: notes.trim() || null
      };

      const url = editingItem
        ? `/api/dashboard/repairs/${editingItem.id}`
        : "/api/dashboard/repairs";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingItem ? "ແກ້ໄຂໃບສ້ອມແປງສຳເລັດ" : "ເປີດໃບສ້ອມແປງໃໝ່ສຳເລັດ");
        setShowAddModal(false);
        resetForm();
        fetchTickets();
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

  const openQuickStatusDialog = (ticket: RepairTicket, nextStatus: string) => {
    setTargetStatusTicket(ticket);
    setNewStatusChoice(nextStatus);
    setStatusChangeNote(`ປ່ຽນສະຖານະເປັນ ${STATUS_CONFIGS[nextStatus]?.label || nextStatus}`);
    setStatusActualCostInput(String(ticket.actualCost || ticket.estimatedCost || 0));
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!targetStatusTicket) return;

    if (newStatusChoice === "CANCELLED") {
      const confirmed = await askConfirm(
        `ທ່ານຕ້ອງການຍົກເລີກໃບສ້ອມແປງ "${targetStatusTicket.ticketNumber}" ແທ້ບໍ່?`,
        {
          title: "ຢືນຢັນການຍົກເລີກງານສ້ອມແປງ",
          subMessage: "ສະຖານະຈະຖືກປ່ຽນເປັນ 'ຍົກເລີກການສ້ອມ' ແລະ ບັນທຶກປະຫວັດໄວ້ໃນລະບົບ.",
          confirmText: "ຢືນຢັນຍົກເລີກ",
          cancelText: "ປິດ"
        }
      );
      if (!confirmed) return;
    } else if (newStatusChoice === "DELIVERED") {
      const remainingPay = Math.max(0, (Number(statusActualCostInput) || targetStatusTicket.actualCost || 0) - (targetStatusTicket.depositPaid || 0));
      const confirmed = await askConfirm(
        `ຢືນຢັນການມອບອຸປະກອນຄືນໃຫ້ລູກຄ້າ "${targetStatusTicket.customerName}"?`,
        {
          title: "ຢືນຢັນການມອບຄືນອຸປະກອນ",
          subMessage: remainingPay > 0
            ? `ກະລຸນາກວດສອບການຮັບເງິນຍອດຄ້າງຊຳລະ ${remainingPay.toLocaleString()} ₭ ໃຫ້ຄົບຖ້ວນກ່ອນມອບ.`
            : "ອຸປະກອນຈະຖືກບັນທຶກວ່າໄດ້ມອບຄືນລູກຄ້າຮຽບຮ້ອຍແລ້ວ.",
          confirmText: "ຢືນຢັນມອບຄືນ",
          cancelText: "ຍົກເລີກ"
        }
      );
      if (!confirmed) return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/dashboard/repairs/${targetStatusTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatusChoice,
          actualCost: statusActualCostInput ? Number(statusActualCostInput) : targetStatusTicket.actualCost,
          actionNote: statusChangeNote.trim(),
          completionDate: newStatusChoice === "COMPLETED" || newStatusChoice === "DELIVERED" ? new Date().toISOString() : null
        })
      });

      if (res.ok) {
        toast.success(`ປ່ຽນສະຖານະເປັນ "${STATUS_CONFIGS[newStatusChoice]?.label || newStatusChoice}" ແລ້ວ`);
        setShowStatusModal(false);
        setTargetStatusTicket(null);
        fetchTickets();
      } else {
        toast.error("ປ່ຽນສະຖານະບໍ່ສຳເລັດ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async (ticket: RepairTicket) => {
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການລຶບໃບສ້ອມແປງ "${ticket.ticketNumber}" (${ticket.itemName}) ແທ້ບໍ່?`,
      {
        title: "ຢືນຢັນການລຶບໃບສ້ອມແປງ",
        subMessage: "ຂໍ້ມູນໃບສ້ອມ ແລະ ປະຫວັດທັງໝົດຈະຖືກລຶບອອກຈາກລະບົບຖາວອນ.",
        confirmText: "ຢືນຢັນລຶບ",
        cancelText: "ຍົກເລີກ"
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/repairs/${ticket.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບໃບສ້ອມແປງສຳເລັດ");
        setTickets(prev => prev.filter(t => t.id !== ticket.id));
      } else {
        toast.error("ບໍ່ສາມາດລຶບໃບສ້ອມແປງໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບ");
    }
  };

  const handleConvertToOrder = async (ticket: RepairTicket) => {
    const cost = Number(ticket.actualCost || ticket.estimatedCost || 0);
    if (cost <= 0) {
      return toast.error("ກະລຸນາກຳນົດມູນຄ່າສ້ອມແປງຕົວຈິງກ່ອນອອກບິນ");
    }

    const alreadyOrderId = getConvertedOrderId(ticket);
    if (alreadyOrderId) {
      return toast.error("ໃບສ້ອມແປງນີ້ໄດ້ອອກບິນຂາຍຮຽບຮ້ອຍແລ້ວ ບໍ່ສາມາດອອກບິນຊ້ຳຊ້ອນໄດ້");
    }

    const confirmed = await askConfirm(
      `ອອກບິນຂາຍ ແລະ ບັນທຶກລາຍຮັບຈຳນວນ ${cost.toLocaleString()} ₭ ສຳລັບ "${ticket.customerName}"?`,
      {
        title: "ຢືນຢັນການອອກບິນຂາຍ (Sales Order)",
        subMessage: "ລະບົບຈະສ້າງບິນ Order ໃນສະຖານະຊຳລະແລ້ວ, ສະສົມແຕ້ມລູກຄ້າ ແລະ ເຊື່ອມຕໍ່ເຂົ້າລາຍງານການເງິນອັດຕະໂນມັດ.",
        confirmText: "ອອກບິນດຽວນີ້",
        cancelText: "ຍົກເລີກ"
      }
    );
    if (!confirmed) return;

    setConvertingId(ticket.id);
    try {
      const res = await fetch(`/api/dashboard/repairs/${ticket.id}/convert`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`ອອກບິນຂາຍສຳເລັດແລ້ວ! (Order #${data.orderId.slice(-6).toUpperCase()})`);
        fetchTickets();
      } else {
        toast.error(data.error || "ອອກບິນບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setConvertingId(null);
    }
  };

  const openHistoryDialog = (ticket: RepairTicket) => {
    setHistoryTargetTicket(ticket);
    setShowHistoryModal(true);
  };

  const openPrintDialog = (ticket: RepairTicket) => {
    setPrintTargetTicket(ticket);
    setShowPrintModal(true);
  };

  const handleCopyTicketNo = (num: string, id: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    toast.success(`ຄັດລອກເລກທີໃບສ້ອມແປງ ${num} ແລ້ວ`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [inspectedTicketResult, setInspectedTicketResult] = useState<BillVerifyResultData | null>(null);

  const matchTicketBySearchTerm = (t: RepairTicket, query: string) => {
    const q = query.trim().toLowerCase().replace(/^#/, "");
    if (!q) return true;
    return (
      t.ticketNumber.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q) ||
      (t.customerPhone && t.customerPhone.toLowerCase().includes(q)) ||
      t.itemName.toLowerCase().includes(q) ||
      (t.technicianName && t.technicianName.toLowerCase().includes(q))
    );
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = matchTicketBySearchTerm(t, search);

      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
      const matchPriority = priorityFilter === "ALL" || t.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const buildTicketInspectionResult = (t: RepairTicket): BillVerifyResultData => {
    const cost = Number(t.actualCost || t.estimatedCost || 0);
    const createdDt = new Date(t.createdAt);
    const updatedDt = new Date(t.updatedAt || t.createdAt);
    // 30-day standard repair warranty after completion/delivery
    const warrantyEndDt = new Date(updatedDt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (t.status === "CANCELLED") {
      return {
        code: t.ticketNumber,
        typeLabel: "ໃບຮັບສ້ອມແປງອຸປະກອນ (Repair Ticket)",
        status: "CANCELLED",
        statusTitle: "ໃບສ້ອມແປງນີ້ຖືກຍົກເລີກແລ້ວ",
        expiryMessage: `ໃບສ້ອມແປງເລກທີ ${t.ticketNumber} (${t.itemName}) ຖືກຍົກເລີກການສ້ອມແປງແລ້ວ.`,
        customerName: `${t.customerName}${t.customerPhone ? ` (${t.customerPhone})` : ""}`,
        itemName: t.itemName,
        startDateFormatted: formatDateTimeLaoStandard(createdDt),
        amountFormatted: `₭${cost.toLocaleString()}`,
        onViewReceipt: () => openPrintDialog(t),
      };
    }

    if (t.status === "DELIVERED" || t.status === "COMPLETED") {
      const warrantyDiff = formatTimeDiffLao(warrantyEndDt, now);
      if (warrantyDiff.isPast) {
        return {
          code: t.ticketNumber,
          typeLabel: "ໃບຮັບສ້ອມແປງອຸປະກອນ (Repair Ticket)",
          status: "EXPIRED",
          statusTitle: "ສ້ອມແປງສຳເລັດແລ້ວ • ໝົດອາຍຸປະກັນຫຼັງການສ້ອມແລ້ວ!",
          expiryMessage: `ໃບສ້ອມ ${t.ticketNumber} ສ້ອມສຳເລັດແລ້ວ ແຕ່ໄລຍະຮັບປະກັນງານສ້ອມ (30 ວັນ) ໝົດອາຍຸມາແລ້ວ ${warrantyDiff.text}.`,
          customerName: `${t.customerName}${t.customerPhone ? ` (${t.customerPhone})` : ""}`,
          itemName: t.itemName,
          startDateFormatted: formatDateTimeLaoStandard(createdDt),
          endDateFormatted: formatDateTimeLaoStandard(warrantyEndDt),
          amountFormatted: `₭${cost.toLocaleString()}`,
          extraBadgeText: `ໝົດປະກັນສ້ອມ ${warrantyDiff.text}`,
          onViewReceipt: () => openPrintDialog(t),
        };
      }

      return {
        code: t.ticketNumber,
        typeLabel: "ໃບຮັບສ້ອມແປງອຸປະກອນ (Repair Ticket)",
        status: t.status === "COMPLETED" ? "VALID" : "COMPLETED",
        statusTitle:
          t.status === "COMPLETED"
            ? "ສ້ອມແປງສຳເລັດ • ພ້ອມມອບຄືນລູກຄ້າ (ຍັງຢູ່ໃນປະກັນສ້ອມ)"
            : "ມອບຄືນອຸປະກອນແລ້ວ • ຍັງຢູ່ໃນໄລຍະປະກັນງານສ້ອມ!",
        expiryMessage: `ຍັງຢູ່ໃນໄລຍະຮັບປະກັນງານສ້ອມອີກ ${warrantyDiff.text} (ສິ້ນສຸດປະກັນ ${formatDateTimeLaoStandard(warrantyEndDt)}).`,
        customerName: `${t.customerName}${t.customerPhone ? ` (${t.customerPhone})` : ""}`,
        itemName: t.itemName,
        startDateFormatted: formatDateTimeLaoStandard(createdDt),
        endDateFormatted: formatDateTimeLaoStandard(warrantyEndDt),
        amountFormatted: `₭${cost.toLocaleString()}`,
        extraBadgeText: `ປະກັນສ້ອມເຫຼືອ ${warrantyDiff.text}`,
        onPrimaryAction:
          t.status === "COMPLETED"
            ? () => openQuickStatusDialog(t, "DELIVERED")
            : undefined,
        primaryActionLabel:
          t.status === "COMPLETED" ? "ມອບຄືນອຸປະກອນໃຫ້ລູກຄ້າ" : undefined,
        onViewReceipt: () => openPrintDialog(t),
      };
    }

    const statusLabel = STATUS_CONFIGS[t.status]?.label || t.status;
    return {
      code: t.ticketNumber,
      typeLabel: "ໃບຮັບສ້ອມແປງອຸປະກອນ (Repair Ticket)",
      status: "VALID",
      statusTitle: `ຍັງບໍ່ໝົດອາຍຸ • ສະຖານະປັດຈຸບັນ: ${statusLabel}`,
      expiryMessage: `ໃບຮັບສ້ອມ ${t.ticketNumber} ກຳລັງຢູ່ໃນຂັ້ນຕອນ "${statusLabel}" — ລູກຄ້າສາມາດໃຊ້ໃບບິນນີ້ຕິດຕາມ ແລະ ຮັບເຄື່ອງຄືນໄດ້.`,
      customerName: `${t.customerName}${t.customerPhone ? ` (${t.customerPhone})` : ""}`,
      itemName: t.itemName,
      startDateFormatted: formatDateTimeLaoStandard(createdDt),
      amountFormatted: `₭${cost.toLocaleString()}`,
      extraBadgeText: statusLabel,
      onPrimaryAction: () => openQuickStatusDialog(t, "COMPLETED"),
      primaryActionLabel: "ໝາຍວ່າສ້ອມສຳເລັດ",
      onViewReceipt: () => openPrintDialog(t),
    };
  };

  const handleInspectTicketByQuery = (rawQuery: string) => {
    const raw = rawQuery.trim();
    if (!raw) return;
    setSearch(raw);

    const match = tickets.find((t) => matchTicketBySearchTerm(t, raw));
    if (match) {
      const result = buildTicketInspectionResult(match);
      setInspectedTicketResult(result);
      if (result.status === "EXPIRED") {
        toast.error(`${result.statusTitle} (${result.code})`);
      } else {
        toast.success(`${result.statusTitle} (${result.code})`);
      }
    } else {
      setInspectedTicketResult({
        code: raw.toUpperCase(),
        typeLabel: "ໃບຮັບສ້ອມແປງອຸປະກອນ (Repair Ticket)",
        status: "NOT_FOUND",
        statusTitle: "ບໍ່ພົບເລກທີໃບຮັບສ້ອມແປງນີ້ໃນລະບົບ",
        expiryMessage: `ບໍ່ພົບໃບສ້ອມແປງທີ່ກົງກັບລະຫັດ "${raw}" — ກະລຸນາກວດສອບເລກທີ REP-... ອີກຄັ້ງ.`,
      });
      toast.error(`ບໍ່ພົບໃບສ້ອມແປງ: "${raw}"`);
    }
  };

  // KPIs
  const pendingCount = tickets.filter(t => t.status === "PENDING").length;
  const inProgressCount = tickets.filter(t => t.status === "IN_PROGRESS").length;
  const waitingPartsCount = tickets.filter(t => t.status === "WAITING_PARTS").length;
  const completedCount = tickets.filter(t => t.status === "COMPLETED").length;
  const deliveredCount = tickets.filter(t => t.status === "DELIVERED").length;

  const totalRevenue = tickets
    .filter(t => t.status === "COMPLETED" || t.status === "DELIVERED")
    .reduce((sum, t) => sum + (t.actualCost || t.estimatedCost || 0), 0);

  // Grouped for Kanban
  const kanbanColumns = [
    { key: "PENDING", title: "ລໍຖ້າກວດເຊັກ", count: pendingCount, color: "text-amber-400", border: "border-amber-500/30" },
    { key: "IN_PROGRESS", title: "ກຳລັງສ້ອມແປງ", count: inProgressCount, color: "text-blue-400", border: "border-blue-500/30" },
    { key: "WAITING_PARTS", title: "ລໍຖ້າອາໄຫຼ່", count: waitingPartsCount, color: "text-purple-400", border: "border-purple-500/30" },
    { key: "COMPLETED", title: "ສ້ອມສຳເລັດ", count: completedCount, color: "text-emerald-400", border: "border-emerald-500/30" },
    { key: "DELIVERED", title: "ມອບຄືນລູກຄ້າ", count: deliveredCount, color: "text-teal-400", border: "border-teal-500/30" }
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* ── Top Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
            <Wrench className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight">
                ສູນສ້ອມແປງອຸປະກອນ
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/25">
                Repair Center
              </span>
            </div>
            <p className="text-zinc-400 text-xs mt-1">
              ຈັດການຄິວສ້ອມແປງອຸປະກອນກິລາ, ຕິດຕາມສະຖານະ, ລາຍການອາໄຫຼ່ ແລະ ພິມໃບຮັບສ້ອມແປງ
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-orange-600/25 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>ເປີດໃບສ້ອມແປງໃໝ່</span>
        </button>
      </div>

      {/* ── Summary Stats Cards (KPIs) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div
          onClick={() => setStatusFilter(statusFilter === "PENDING" ? "ALL" : "PENDING")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-xl group ${
            statusFilter === "PENDING"
              ? "bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10"
              : "bg-zinc-900/80 border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900"
          }`}
          title="ຄລິກເພື່ອກັ່ນຕອງສະເພາະ ລໍຖ້າກວດເຊັກ"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium group-hover:text-amber-300 transition-colors">ລໍຖ້າກວດເຊັກ</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{pendingCount}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">ຄິວລໍຖ້າກວດເຊັກ</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-xl group ${
            statusFilter === "IN_PROGRESS"
              ? "bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10"
              : "bg-zinc-900/80 border-zinc-800/80 hover:border-blue-500/50 hover:bg-zinc-900"
          }`}
          title="ຄລິກເພື່ອກັ່ນຕອງສະເພາະ ກຳລັງສ້ອມແປງ"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium group-hover:text-blue-300 transition-colors">ກຳລັງສ້ອມ</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">{inProgressCount}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">ຊ່າງກຳລັງດຳເນີນການ</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "WAITING_PARTS" ? "ALL" : "WAITING_PARTS")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-xl group ${
            statusFilter === "WAITING_PARTS"
              ? "bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/10"
              : "bg-zinc-900/80 border-zinc-800/80 hover:border-purple-500/50 hover:bg-zinc-900"
          }`}
          title="ຄລິກເພື່ອກັ່ນຕອງສະເພາະ ລໍຖ້າອາໄຫຼ່"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium group-hover:text-purple-300 transition-colors">ລໍຖ້າອາໄຫຼ່</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-400 mt-2">{waitingPartsCount}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">ສັ່ງຊື້/ລໍຖ້າຊິ້ນສ່ວນ</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "COMPLETED" ? "ALL" : "COMPLETED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-xl group ${
            statusFilter === "COMPLETED"
              ? "bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
              : "bg-zinc-900/80 border-zinc-800/80 hover:border-emerald-500/50 hover:bg-zinc-900"
          }`}
          title="ຄລິກເພື່ອກັ່ນຕອງສະເພາະ ສ້ອມສຳເລັດ"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium group-hover:text-emerald-300 transition-colors">ສ້ອມສຳເລັດ</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">{completedCount}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">ພ້ອມແຈ້ງລູກຄ້າຮັບ</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "DELIVERED" ? "ALL" : "DELIVERED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-xl group ${
            statusFilter === "DELIVERED"
              ? "bg-teal-500/15 border-teal-500 ring-2 ring-teal-500/30 shadow-lg shadow-teal-500/10"
              : "bg-zinc-900/80 border-zinc-800/80 hover:border-teal-500/50 hover:bg-zinc-900"
          }`}
          title="ຄລິກເພື່ອກັ່ນຕອງສະເພາະ ມອບຄືນແລ້ວ"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium group-hover:text-teal-300 transition-colors">ມອບຄືນແລ້ວ</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-400 mt-2">{deliveredCount}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">ມອບ ແລະ ຮັບເງິນແລ້ວ</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "COMPLETED" || statusFilter === "DELIVERED" ? "ALL" : "COMPLETED")}
          className="bg-zinc-900/80 border border-orange-500/20 bg-gradient-to-br from-orange-950/20 to-zinc-900/80 rounded-2xl p-4 backdrop-blur-xl cursor-pointer hover:border-orange-500/50 transition-all group"
          title="ຄລິກເພື່ອກັ່ນຕອງລາຍການທີ່ມີລາຍຮັບ"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-orange-300 font-medium">ລາຍຮັບຄ່າສ້ອມ</span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-orange-400 mt-2 truncate">
            {totalRevenue.toLocaleString()} ₭
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">ສຳເລັດ & ມອບຄືນ</p>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 shadow-xl backdrop-blur-xl space-y-3.5">
        {/* Quick Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { key: "ALL", label: "ທັງໝົດ", count: tickets.length, color: "text-zinc-300", activeBg: "bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/25" },
            { key: "PENDING", label: "ລໍຖ້າກວດເຊັກ", count: pendingCount, color: "text-amber-400", activeBg: "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/25" },
            { key: "IN_PROGRESS", label: "ກຳລັງສ້ອມແປງ", count: inProgressCount, color: "text-blue-400", activeBg: "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/25" },
            { key: "WAITING_PARTS", label: "ລໍຖ້າອາໄຫຼ່", count: waitingPartsCount, color: "text-purple-400", activeBg: "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/25" },
            { key: "COMPLETED", label: "ສ້ອມສຳເລັດ", count: completedCount, color: "text-emerald-400", activeBg: "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/25" },
            { key: "DELIVERED", label: "ມອບຄືນແລ້ວ", count: deliveredCount, color: "text-teal-400", activeBg: "bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-600/25" }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap border ${
                statusFilter === tab.key
                  ? tab.activeBg
                  : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                statusFilter === tab.key ? "bg-black/30 text-white" : "bg-zinc-800 " + tab.color
              }`}>
                {tab.count}
              </span>
            </button>
          ))}

          {statusFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className="px-2.5 py-1 rounded-xl text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors whitespace-nowrap ml-1"
            >
              ລ້າງຕົວກອງ
            </button>
          )}
        </div>

        {/* Search & Extra Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between border-t border-zinc-800/60 pt-3">
          {/* Search Box & Camera Scan */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ພິມເລກທີໃບສ້ອມ REP-..., ຊື່ລູກຄ້າ, ເບີໂທ ຫຼື ຊື່ອຸປະກອນ..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  if (!e.target.value.trim()) setInspectedTicketResult(null);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && search.trim()) {
                    e.preventDefault();
                    handleInspectTicketByQuery(search);
                  }
                }}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            {search.trim() && (
              <button
                type="button"
                onClick={() => handleInspectTicketByQuery(search)}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                ກວດສອບບິນ
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="px-3 sm:px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/20 active:scale-95"
              title="ເປີດກ້ອງສະແກນບາໂຄດໃບສ້ອມ"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">ກ້ອງສະແກນ</span>
              <span className="sm:hidden">ສະແກນ</span>
            </button>
          </div>

          {/* Right Controls: Priority Select & View Mode Toggle */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            {/* Priority Select */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">ທຸກລະດັບຄວາມດ່ວນ</option>
              <option value="NORMAL">ປົກກະຕິ</option>
              <option value="URGENT">ດ່ວນ</option>
              <option value="EXPRESS">ດ່ວນພິເສດ</option>
            </select>

            {/* 3 View Mode Toggle Buttons */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="ມຸມມອງບັດຂໍ້ມູນ (Grid View - ອ່ານງ່າຍ & ສະບາຍຕາ)"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "grid" ? "bg-orange-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ບັດຂໍ້ມູນ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("board")}
                title="ມຸມມອງກະດານຂັ້ນຕອນ (Kanban Board)"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "board" ? "bg-orange-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ກະດານຂັ້ນຕອນ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="ມຸມມອງຕາຕະລາງ (Table View)"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "table" ? "bg-orange-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ຕາຕະລາງ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* -- Scanned / Searched Repair Ticket Verification Banner -- */}
      {(inspectedTicketResult ||
        (search.trim().length >= 3 && filteredTickets.length === 1)) && (
        <BillVerifyResultCard
          data={
            inspectedTicketResult ||
            buildTicketInspectionResult(filteredTickets[0])
          }
          onClose={() => {
            setInspectedTicketResult(null);
            setSearch("");
          }}
        />
      )}

      {/* ── Content View (Kanban Board vs Table) ── */}
      {isLoading ? (
        <div className="p-16 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
          <p className="text-zinc-400 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນໃບສ້ອມແປງອຸປະກອນ...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="p-16 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-4 text-zinc-500 border border-zinc-700/50">
            <Wrench className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">ບໍ່ພົບໃບສ້ອມແປງອຸປະກອນ</h3>
          <p className="text-zinc-400 text-xs max-w-sm mb-5">
            {search || statusFilter !== "ALL" || priorityFilter !== "ALL"
              ? "ບໍ່ພົບຂໍ້ມູນທີ່ກົງກັບເງື່ອນໄຂຄົ້ນຫາ ລອງປັບຕົວກອງໃໝ່"
              : "ຍັງບໍ່ທັນມີລາຍການໃບສ້ອມແປງ ກົດປຸ່ມດ້ານລຸ່ມເພື່ອເປີດໃບສ້ອມໃໝ່"}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-orange-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>ເປີດໃບສ້ອມແປງໃໝ່</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Spacious Responsive Card Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5 items-start">
          {filteredTickets.map(t => {
            const statusCfg = STATUS_CONFIGS[t.status] || STATUS_CONFIGS.PENDING;
            const priorityCfg = PRIORITY_CONFIGS[t.priority || "NORMAL"] || PRIORITY_CONFIGS.NORMAL;
            const PriorityIcon = priorityCfg.icon;
            const deposit = t.depositPaid || 0;
            const actualCost = t.actualCost ?? t.estimatedCost ?? 0;
            const remaining = Math.max(0, actualCost - deposit);
            const convertedOrderId = getConvertedOrderId(t);

            return (
              <div
                key={t.id}
                className="bg-zinc-950/90 border border-zinc-800 hover:border-orange-500/50 rounded-2xl p-4 space-y-3.5 transition-all duration-200 group shadow-md hover:shadow-2xl hover:shadow-black/60 backdrop-blur-xl flex flex-col justify-between"
              >
                {/* 1. Header Bar: Ticket Number, Badge, Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleCopyTicketNo(t.ticketNumber, t.id)}
                        title="ຄລິກເພື່ອຄັດລອກເລກທີໃບສ້ອມແປງ"
                        className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/20 flex items-center gap-1.5 transition-all"
                      >
                        <span>{t.ticketNumber}</span>
                        {copiedId === t.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
                        )}
                      </button>

                      {t.customerName?.startsWith("ອຸປະກອນເຊົ່າ") ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          ອຸປະກອນເຊົ່າ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          ລູກຄ້າທົ່ວໄປ
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 ${statusCfg.badgeColor}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                      <span>{statusCfg.label}</span>
                    </span>
                  </div>

                  {/* 2. Item Name: Bold, Large & Clickable to View Full Details */}
                  <div
                    onClick={() => openDetailDialog(t)}
                    className="cursor-pointer group/title pt-1"
                    title="ຄລິກເພື່ອເບິ່ງລາຍລະອຽດເຕັມ"
                  >
                    <h4 className="font-bold text-white text-base leading-snug break-words group-hover/title:text-orange-400 transition-colors">
                      {t.itemName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{new Date(t.createdAt).toLocaleDateString("lo-LA")}</span>
                      </span>
                      {t.priority && t.priority !== "NORMAL" && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${priorityCfg.badgeColor}`}
                        >
                          <PriorityIcon className="w-3 h-3" />
                          <span>{priorityCfg.label}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3. Issue Description Callout Strip: High Contrast */}
                  {t.issueDesc && (
                    <div className="bg-zinc-900/90 border-l-2 border-orange-500 rounded-r-xl px-3 py-2 text-xs text-zinc-200 break-words leading-relaxed font-medium">
                      <span className="text-orange-400 font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                        ອາການ / ບັນຫາ:
                      </span>
                      {t.issueDesc}
                    </div>
                  )}

                  {/* 4. Structured Info: Customer, Technician & Parts */}
                  <div className="bg-zinc-900/60 rounded-xl p-2.5 border border-zinc-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
                        <User className="w-3.5 h-3.5 text-zinc-400" />
                        <span>ລູກຄ້າ:</span>
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-zinc-100 block truncate max-w-[170px]">
                          {t.customerName}
                        </span>
                        {t.customerPhone && (
                          <span className="text-zinc-400 font-mono text-[10px] block">
                            {t.customerPhone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-zinc-800/50 pt-1.5">
                      <span className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
                        <Wrench className="w-3.5 h-3.5 text-blue-400" />
                        <span>ຊ່າງສ້ອມ:</span>
                      </span>
                      <span className="text-sky-300 font-medium text-right truncate max-w-[170px]">
                        {t.technicianName || <span className="text-zinc-600 italic">ຍັງບໍ່ກຳນົດຊ່າງ</span>}
                      </span>
                    </div>

                    {t.partsUsed && t.partsUsed.length > 0 && (
                      <div className="flex items-center justify-between gap-2 border-t border-zinc-800/50 pt-1.5 text-[11px]">
                        <span className="text-zinc-400 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-purple-400" />
                          <span>ອາໄຫຼ່ທີ່ໃຊ້:</span>
                        </span>
                        <span className="text-purple-300 font-semibold truncate max-w-[170px]">
                          {t.partsUsed.length} ລາຍການ
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 5. Cost Highlight Bar */}
                  <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 font-medium block">
                        {actualCost > 0 ? "ຄ່າສ້ອມຕົວຈິງ" : "ລາຄາປະເມີນ"}
                      </span>
                      <div className="text-base font-black text-emerald-400 font-mono leading-tight">
                        {(actualCost || t.estimatedCost || 0).toLocaleString()} ₭
                      </div>
                    </div>

                    {deposit > 0 && remaining > 0 ? (
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 block">ມັດຈຳ: {deposit.toLocaleString()} ₭</span>
                        <span className="text-xs font-bold text-amber-400 font-mono">ຄ້າງ: {remaining.toLocaleString()} ₭</span>
                      </div>
                    ) : deposit > 0 && remaining === 0 ? (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        ຊຳລະຄົບ
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* 6. Action Bar: Workflow Transitions & Utilities */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  {/* Workflow Step Transitions */}
                  <div className="flex items-center gap-1.5 flex-wrap flex-1">
                    {t.status === "PENDING" && (
                      <button
                        onClick={() => openQuickStatusDialog(t, "IN_PROGRESS")}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                      >
                        <span>ເລີ່ມສ້ອມ</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {t.status === "IN_PROGRESS" && (
                      <>
                        <button
                          onClick={() => openQuickStatusDialog(t, "WAITING_PARTS")}
                          className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold transition-all"
                        >
                          ລໍອາໄຫຼ່
                        </button>
                        <button
                          onClick={() => openQuickStatusDialog(t, "COMPLETED")}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                        >
                          <span>ສ້ອມແລ້ວ</span>
                          <Check className="w-3 h-3" />
                        </button>
                      </>
                    )}

                    {t.status === "WAITING_PARTS" && (
                      <button
                        onClick={() => openQuickStatusDialog(t, "IN_PROGRESS")}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <span>ໄດ້ອາໄຫຼ່ແລ້ວ</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {t.status === "COMPLETED" && (
                      <button
                        onClick={() => openQuickStatusDialog(t, "DELIVERED")}
                        className="px-2.5 py-1 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                      >
                        <span>ມອບເຄື່ອງ</span>
                        <Check className="w-3 h-3" />
                      </button>
                    )}

                    {/* Billed state or Bill button */}
                    {(t.status === "COMPLETED" || t.status === "DELIVERED") && (
                      convertedOrderId ? (
                        <Link
                          href="/dashboard/orders"
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 shadow-sm"
                          title="ອອກບິນຂາຍແລ້ວ ຄລິກເພື່ອເບິ່ງໃນລາຍການ Order"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>ອອກບິນແລ້ວ</span>
                        </Link>
                      ) : actualCost > 0 ? (
                        <button
                          disabled={convertingId === t.id}
                          onClick={() => handleConvertToOrder(t)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                          title="ອອກບິນຂາຍ ແລະ ບັນທຶກລາຍຮັບເຂົ້າການເງິນ"
                        >
                          {convertingId === t.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CreditCard className="w-3 h-3" />
                          )}
                          <span>ອອກບິນ</span>
                        </button>
                      ) : null
                    )}
                  </div>

                  {/* Utility actions: Detail Modal, Print Slip, History, Edit, Delete */}
                  <div className="flex items-center gap-0.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80">
                    <button
                      onClick={() => openDetailDialog(t)}
                      title="ເບິ່ງລາຍລະອຽດຄົບຖ້ວນ"
                      className="p-1.5 text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openPrintDialog(t)}
                      title="ພິມໃບຮັບສ້ອມແປງ (Print Slip)"
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openHistoryDialog(t)}
                      title="ປະຫວັດການປ່ຽນສະຖານະ & ໃຜເປັນຄົນປ່ຽນ"
                      className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(t)}
                      title="ແກ້ໄຂໃບສ້ອມແປງ"
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      title="ລຶບໃບສ້ອມແປງ"
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === "board" ? (
        /* ── Kanban Board View ── */
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {kanbanColumns.map(col => {
            const colTickets = filteredTickets.filter(t => t.status === col.key);

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
                      {colTickets.length}
                    </span>
                  </div>
                </div>

                {/* Column Tickets List */}
                <div className="p-2.5 space-y-2.5 min-h-[320px] max-h-[75vh] overflow-y-auto custom-scrollbar">
                  {colTickets.length === 0 ? (
                    <div className="py-12 text-center text-zinc-600 text-xs">
                      ບໍ່ມີໃບສ້ອມແປງໃນຂັ້ນຕອນນີ້
                    </div>
                  ) : (
                    colTickets.map(t => {
                      const priorityCfg = PRIORITY_CONFIGS[t.priority || "NORMAL"] || PRIORITY_CONFIGS.NORMAL;
                      const PriorityIcon = priorityCfg.icon;
                      const deposit = t.depositPaid || 0;
                      const actualCost = t.actualCost ?? t.estimatedCost ?? 0;
                      const remaining = Math.max(0, actualCost - deposit);
                      const convertedOrderId = getConvertedOrderId(t);

                      return (
                        <div
                          key={t.id}
                          className="bg-zinc-950 border border-zinc-800 hover:border-orange-500/40 rounded-2xl p-3.5 space-y-3 transition-all duration-200 group shadow-md hover:shadow-xl backdrop-blur-xl"
                        >
                          {/* ── 1. Top Bar: Ticket Number, Type Badge, Priority ── */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleCopyTicketNo(t.ticketNumber, t.id)}
                                title="ຄລິກເພື່ອຄັດລອກເລກທີໃບສ້ອມແປງ"
                                className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/20 flex items-center gap-1.5 transition-all"
                              >
                                <span>{t.ticketNumber}</span>
                                {copiedId === t.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
                                )}
                              </button>

                              {t.customerName?.startsWith("ອຸປະກອນເຊົ່າ") ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                  ອຸປະກອນເຊົ່າ
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                  ລູກຄ້າທົ່ວໄປ
                                </span>
                              )}
                            </div>

                            {t.priority && t.priority !== "NORMAL" && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${priorityCfg.badgeColor}`}
                              >
                                <PriorityIcon className="w-3 h-3" />
                                <span>{priorityCfg.label}</span>
                              </span>
                            )}
                          </div>

                          {/* ── 2. Item Name: Bold, Large & Full (Clear, No Truncation) ── */}
                          <div>
                            <h4 className="font-bold text-white text-sm leading-snug break-words group-hover:text-orange-300 transition-colors">
                              {t.itemName}
                            </h4>
                          </div>

                          {/* ── 3. Issue Description Callout Strip ── */}
                          {t.issueDesc && (
                            <div className="bg-zinc-900/90 border-l-2 border-orange-500 rounded-r-xl px-2.5 py-1.5 text-xs text-zinc-300 break-words leading-relaxed">
                              <span className="text-zinc-500 font-semibold block text-[10px] uppercase tracking-wider mb-0.5">
                                ອາການ / ບັນຫາ:
                              </span>
                              {t.issueDesc}
                            </div>
                          )}

                          {/* ── 4. Structured Info: Customer, Technician & Cost ── */}
                          <div className="bg-zinc-900/60 rounded-xl p-2.5 border border-zinc-800/80 space-y-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-zinc-500 flex items-center gap-1.5 text-[11px]">
                                <User className="w-3.5 h-3.5 text-zinc-400" />
                                <span>ລູກຄ້າ / ລະຫັດ:</span>
                              </span>
                              <span className="font-semibold text-zinc-200 text-right truncate max-w-[160px]">
                                {t.customerName}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 border-t border-zinc-800/50 pt-1.5">
                              <span className="text-zinc-500 flex items-center gap-1.5 text-[11px]">
                                <Wrench className="w-3.5 h-3.5 text-blue-400" />
                                <span>ຊ່າງສ້ອມແປງ:</span>
                              </span>
                              <span className="text-sky-300 font-medium text-right truncate max-w-[160px]">
                                {t.technicianName || <span className="text-zinc-600 italic">ຍັງບໍ່ກຳນົດຊ່າງ</span>}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 border-t border-zinc-800/50 pt-1.5">
                              <span className="text-zinc-500 flex items-center gap-1.5 text-[11px]">
                                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                                <span>ຄ່າໃຊ້ຈ່າຍຕົວຈິງ:</span>
                              </span>
                              <div className="text-right">
                                {actualCost > 0 ? (
                                  <span className="text-emerald-400 font-extrabold text-sm">
                                    {actualCost.toLocaleString()} ₭
                                  </span>
                                ) : (
                                  <span className="text-zinc-400 font-medium text-xs bg-zinc-800/80 px-2 py-0.5 rounded">
                                    0 ₭ (ບໍ່ມີຄ່າສ້ອມ)
                                  </span>
                                )}
                              </div>
                            </div>

                            {deposit > 0 && remaining > 0 && (
                              <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/40 pt-1">
                                <span>ມັດຈຳແລ້ວ: {deposit.toLocaleString()} ₭</span>
                                <span className="text-amber-400 font-semibold">ຄ້າງ: {remaining.toLocaleString()} ₭</span>
                              </div>
                            )}
                          </div>

                          {/* ── 5. Action Bar: Workflow Transitions & Utilities ── */}
                          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                            {/* Workflow Step Transitions */}
                            <div className="flex items-center gap-1.5 flex-wrap flex-1">
                              {t.status === "PENDING" && (
                                <button
                                  onClick={() => openQuickStatusDialog(t, "IN_PROGRESS")}
                                  className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                                >
                                  <span>ເລີ່ມສ້ອມ</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

                              {t.status === "IN_PROGRESS" && (
                                <>
                                  <button
                                    onClick={() => openQuickStatusDialog(t, "WAITING_PARTS")}
                                    className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold transition-all"
                                  >
                                    ລໍອາໄຫຼ່
                                  </button>
                                  <button
                                    onClick={() => openQuickStatusDialog(t, "COMPLETED")}
                                    className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                                  >
                                    <span>ສ້ອມແລ້ວ</span>
                                    <Check className="w-3 h-3" />
                                  </button>
                                </>
                              )}

                              {t.status === "WAITING_PARTS" && (
                                <button
                                  onClick={() => openQuickStatusDialog(t, "IN_PROGRESS")}
                                  className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                                >
                                  <span>ໄດ້ອາໄຫຼ່ແລ້ວ</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

                              {t.status === "COMPLETED" && (
                                <button
                                  onClick={() => openQuickStatusDialog(t, "DELIVERED")}
                                  className="px-2.5 py-1 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                                >
                                  <span>ມອບເຄື່ອງ</span>
                                  <Check className="w-3 h-3" />
                                </button>
                              )}

                              {/* Billed state or Bill button */}
                              {(t.status === "COMPLETED" || t.status === "DELIVERED") && (
                                convertedOrderId ? (
                                  <Link
                                    href="/dashboard/orders"
                                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 shadow-sm"
                                    title="ອອກບິນຂາຍແລ້ວ ຄລິກເພື່ອເບິ່ງໃນລາຍການ Order"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>ອອກບິນແລ້ວ</span>
                                  </Link>
                                ) : actualCost > 0 ? (
                                  <button
                                    disabled={convertingId === t.id}
                                    onClick={() => handleConvertToOrder(t)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                                    title="ອອກບິນຂາຍ ແລະ ບັນທຶກລາຍຮັບເຂົ້າການເງິນ"
                                  >
                                    {convertingId === t.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CreditCard className="w-3 h-3" />
                                    )}
                                    <span>ອອກບິນ</span>
                                  </button>
                                ) : null
                              )}
                            </div>

                            {/* Utility actions: Detail Modal, Print Slip, History, Edit, Delete */}
                            <div className="flex items-center gap-0.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80">
                              <button
                                onClick={() => openDetailDialog(t)}
                                title="ເບິ່ງລາຍລະອຽດເຕັມ"
                                className="p-1.5 text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openPrintDialog(t)}
                                title="ພິມໃບຮັບສ້ອມແປງ (Print Slip)"
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openHistoryDialog(t)}
                                title="ປະຫວັດການປ່ຽນສະຖານະ & ໃຜເປັນຄົນປ່ຽນ"
                                className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal(t)}
                                title="ແກ້ໄຂໃບສ້ອມແປງ"
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(t)}
                                title="ລຶບໃບສ້ອມແປງ"
                                className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
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
                  <th className="py-3.5 px-4">ເລກທີ & ວັນທີ</th>
                  <th className="py-3.5 px-4">ລູກຄ້າ</th>
                  <th className="py-3.5 px-4">ອຸປະກອນ & ບັນຫາ</th>
                  <th className="py-3.5 px-4">ຊ່າງ & ຄວາມດ່ວນ</th>
                  <th className="py-3.5 px-4 text-right">ຄ່າສ້ອມ & ມັດຈຳ</th>
                  <th className="py-3.5 px-4 text-center">ສະຖານະ</th>
                  <th className="py-3.5 px-4 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredTickets.map(t => {
                  const statusCfg = STATUS_CONFIGS[t.status] || STATUS_CONFIGS.PENDING;
                  const priorityCfg = PRIORITY_CONFIGS[t.priority || "NORMAL"] || PRIORITY_CONFIGS.NORMAL;
                  const PriorityIcon = priorityCfg.icon;
                  const actualCost = t.actualCost ?? t.estimatedCost ?? 0;
                  const deposit = t.depositPaid || 0;
                  const convertedOrderId = getConvertedOrderId(t);

                  return (
                    <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Ticket No & Date */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleCopyTicketNo(t.ticketNumber, t.id)}
                          className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 hover:border-orange-500/40 inline-flex items-center gap-1"
                        >
                          <span>{t.ticketNumber}</span>
                          {copiedId === t.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-zinc-500" />
                          )}
                        </button>
                        <div className="text-[11px] text-zinc-500 mt-1">
                          {new Date(t.createdAt).toLocaleDateString("lo-LA")}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white text-sm">{t.customerName}</div>
                        {t.customerPhone && (
                          <div className="text-xs text-zinc-400 font-mono mt-0.5">{t.customerPhone}</div>
                        )}
                      </td>

                      {/* Item & Issue */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {t.customerName?.startsWith("ອຸປະກອນເຊົ່າ") && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              ອຸປະກອນເຊົ່າ
                            </span>
                          )}
                          <span className="font-bold text-white text-sm line-clamp-1">{t.itemName}</span>
                        </div>
                        <div className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{t.issueDesc}</div>
                      </td>

                      {/* Technician & Priority */}
                      <td className="py-3 px-4">
                        <div className="text-xs text-blue-300 font-medium">
                          {t.technicianName || <span className="text-zinc-600">- ຍັງບໍ່ກຳນົດ -</span>}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 mt-1 ${priorityCfg.badgeColor}`}
                        >
                          <PriorityIcon className="w-3 h-3" />
                          <span>{priorityCfg.label}</span>
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-emerald-400 text-sm">
                          {actualCost.toLocaleString()} ₭
                        </div>
                        {deposit > 0 && (
                          <div className="text-[11px] text-zinc-500">
                            ມັດຈຳ: {deposit.toLocaleString()} ₭
                          </div>
                        )}
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
                          {(t.status === "COMPLETED" || t.status === "DELIVERED") && (
                            convertedOrderId ? (
                              <Link
                                href="/dashboard/orders"
                                title="ອອກບິນຂາຍແລ້ວ ຄລິກເພື່ອເບິ່ງໃນ Order"
                                className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors inline-flex items-center"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Link>
                            ) : actualCost > 0 ? (
                              <button
                                disabled={convertingId === t.id}
                                onClick={() => handleConvertToOrder(t)}
                                title="ອອກບິນຂາຍ (Create Sales Order)"
                                className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {convertingId === t.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CreditCard className="w-4 h-4" />
                                )}
                              </button>
                            ) : null
                          )}
                           <button
                            onClick={() => openDetailDialog(t)}
                            title="ເບິ່ງລາຍລະອຽດເຕັມ"
                            className="p-1.5 text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openPrintDialog(t)}
                            title="ພິມໃບຮັບສ້ອມ"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openHistoryDialog(t)}
                            title="ປະຫວັດການປ່ຽນສະຖານະ"
                            className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(t)}
                            title="ແກ້ໄຂ"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
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

      {/* ── Add / Edit Repair Ticket Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {editingItem ? "ແກ້ໄຂໃບສ້ອມແປງອຸປະກອນ" : "ເປີດໃບສ້ອມແປງອຸປະກອນໃໝ່"}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {editingItem ? `ເລກທີ: ${editingItem.ticketNumber}` : "ສ້າງໃບຮັບສ້ອມ, ປະເມີນຄ່າໃຊ້ຈ່າຍ ແລະ ມອບໝາຍຊ່າງ"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              <form id="repair-ticket-form" onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Ticket Number, Status & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ເລກທີໃບສ້ອມ (Ticket No)
                    </label>
                    <input
                      type="text"
                      value={ticketNumber}
                      onChange={e => setTicketNumber(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-orange-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ສະຖານະການສ້ອມ
                    </label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                    >
                      <option value="PENDING">ລໍຖ້າກວດເຊັກ (Pending)</option>
                      <option value="IN_PROGRESS">ກຳລັງສ້ອມແປງ (In Progress)</option>
                      <option value="WAITING_PARTS">ລໍຖ້າອາໄຫຼ່ (Waiting Parts)</option>
                      <option value="COMPLETED">ສ້ອມສຳເລັດ (Completed)</option>
                      <option value="DELIVERED">ມອບຄືນລູກຄ້າແລ້ວ (Delivered)</option>
                      <option value="CANCELLED">ຍົກເລີກການສ້ອມ (Cancelled)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      ລະດັບຄວາມດ່ວນ (Priority)
                    </label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                    >
                      <option value="NORMAL">ປົກກະຕິ (Normal)</option>
                      <option value="URGENT">ດ່ວນ (Urgent)</option>
                      <option value="EXPRESS">ດ່ວນພິເສດ (Express)</option>
                    </select>
                  </div>
                </div>

                {/* 2. Customer Section */}
                <div className="border-t border-zinc-800/80 pt-4">
                  <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
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
                        placeholder="ຕົວຢ່າງ: ທ່ານ ສົມສັກ ວົງສາ"
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
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
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Equipment & Problem Description */}
                <div className="border-t border-zinc-800/80 pt-4">
                  <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    <span>ອຸປະກອນ & ອາການບັນຫາ (Equipment & Issue)</span>
                  </h3>
                  <div className="space-y-3.5">
                    {/* Category Selector with Quick Add Button */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-zinc-300">
                          ປະເພດອຸປະກອນ / ໝວດໝູ່ການສ້ອມ <span className="text-rose-400">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowQuickAddCatModal(true)}
                            className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-0.5 rounded-lg border border-orange-500/30 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ ເພີ່ມປະເພດໃໝ່</span>
                          </button>
                          <Link
                            href="/dashboard/categories"
                            target="_blank"
                            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-0.5"
                          >
                            <span>ຈັດການ</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      <select
                        value={itemCategory}
                        onChange={e => {
                          if (e.target.value === "__ADD_NEW__") {
                            setShowQuickAddCatModal(true);
                          } else {
                            setItemCategory(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                      >
                        {allRepairCategories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="__ADD_NEW__" className="text-orange-400 font-bold bg-zinc-900">
                          + ເພີ່ມປະເພດ / ໝວດໝູ່ໃໝ່...
                        </option>
                      </select>

                      <div className="mt-2 p-2 bg-zinc-950/80 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-2">
                        <span className="text-[11px] text-zinc-400">ບໍ່ມີປະເພດອຸປະກອນໃນລາຍການ?</span>
                        <button
                          type="button"
                          onClick={() => setShowQuickAddCatModal(true)}
                          className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm shadow-orange-600/30 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ ເພີ່ມປະເພດໃໝ່</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          ຊື່ອຸປະກອນ / ສິນຄ້າທີ່ສົ່ງສ້ອມ <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={itemName}
                          onChange={e => setItemName(e.target.value)}
                          required
                          placeholder="ຕົວຢ່າງ: Yonex Astrox 88D Pro, ລົດຖີບ Trek Domane, ໄມ້ກ໊ອຟ Ping G425"
                          className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          ຊ່າງຜູ້ຮັບຜິດຊອບ
                        </label>
                        <input
                          type="text"
                          value={technicianName}
                          onChange={e => setTechnicianName(e.target.value)}
                          placeholder="ຕົວຢ່າງ: ຊ່າງ ບຸນມີ"
                          className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ລາຍລະອຽດບັນຫາ / ອາການຊຳລຸດ <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        value={issueDesc}
                        onChange={e => setIssueDesc(e.target.value)}
                        required
                        rows={2}
                        placeholder="ຕົວຢ່າງ: ສາຍເອັນຂາດ ຂຶ້ນເອັນ 27 lbs, ປ່ຽນຢາງໃນລົດຖີບ, ປ່ຽນກຣິບໄມ້ກ໊ອຟ..."
                        className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Parts & Materials Used (Dynamic List) */}
                <div className="border-t border-zinc-800/80 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>ລາຍການອາໄຫຼ່ & ອຸປະກອນທີ່ປ່ຽນ (Parts & Materials)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddPartRow}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>ເພີ່ມລາຍການອາໄຫຼ່</span>
                    </button>
                  </div>

                  {parts.length === 0 ? (
                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center text-xs text-zinc-500">
                      ຍັງບໍ່ມີລາຍການອາໄຫຼ່ ກົດປຸ່ມ "ເພີ່ມລາຍການອາໄຫຼ່" ຖ້າມີການປ່ຽນຊິ້ນສ່ວນ
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {parts.map((p, idx) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="ຊື່ອາໄຫຼ່ (ເຊັ່ນ: ສາຍເອັນ BG80, ຢາງໃນ 700c)"
                            value={p.name}
                            onChange={e => handlePartChange(p.id, "name", e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="ຈຳນວນ"
                            value={p.quantity}
                            onChange={e => handlePartChange(p.id, "quantity", Number(e.target.value) || 1)}
                            className="w-16 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 text-center"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="ລາຄາ/ໜ່ວຍ (₭)"
                            value={p.unitPrice}
                            onChange={e => handlePartChange(p.id, "unitPrice", Number(e.target.value) || 0)}
                            className="w-28 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 text-right font-mono"
                          />
                          <span className="text-xs text-emerald-400 font-mono w-24 text-right">
                            {((p.quantity || 1) * (p.unitPrice || 0)).toLocaleString()} ₭
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePartRow(p.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="text-right text-xs text-zinc-400 font-medium pt-1">
                        ລວມຄ່າອາໄຫຼ່: <strong className="text-emerald-400 font-bold">{totalPartsCost.toLocaleString()} ₭</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Pricing & Settlement */}
                <div className="border-t border-zinc-800/80 pt-4">
                  <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5" />
                    <span>ຄ່າໃຊ້ຈ່າຍ & ເງິນມັດຈຳ (Cost & Deposit)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ປະເມີນລາຄາ (₭)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={estimatedCost}
                        onChange={e => setEstimatedCost(e.target.value)}
                        placeholder="150000"
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-200 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ຄ່າສ້ອມແປງຕົວຈິງ (₭)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={actualCost}
                        onChange={e => setActualCost(e.target.value)}
                        placeholder="150000"
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-bold font-mono text-emerald-400 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ເງິນມັດຈຳທີ່ຮັບ (₭)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={depositPaid}
                        onChange={e => setDepositPaid(e.target.value)}
                        placeholder="0"
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-200 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Notes */}
                <div className="border-t border-zinc-800/80 pt-4">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ໝາຍເຫດ ຫຼື ຂໍ້ຕົກລົງເພີ່ມເຕີມ
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="ຕົວຢ່າງ: ລູກຄ້າເອົາເອັນມາເອງ, ກວດເຊັກລູກປືນຄໍເພີ່ມເຕີມ..."
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
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
                form="repair-ticket-form"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{editingItem ? "ບັນທຶກການແກ້ໄຂ" : "ເປີດໃບສ້ອມແປງ"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Status Advance Dialog ── */}
      {showStatusModal && targetStatusTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800 bg-zinc-950/70 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">ປ່ຽນສະຖານະການສ້ອມແປງ</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {targetStatusTicket.ticketNumber} ({targetStatusTicket.itemName})
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
                  value={newStatusChoice}
                  onChange={e => setNewStatusChoice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="PENDING">ລໍຖ້າກວດເຊັກ (Pending)</option>
                  <option value="IN_PROGRESS">ກຳລັງສ້ອມແປງ (In Progress)</option>
                  <option value="WAITING_PARTS">ລໍຖ້າອາໄຫຼ່ (Waiting Parts)</option>
                  <option value="COMPLETED">ສ້ອມສຳເລັດ (Completed)</option>
                  <option value="DELIVERED">ມອບຄືນລູກຄ້າແລ້ວ (Delivered)</option>
                  <option value="CANCELLED">ຍົກເລີກ (Cancelled)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ຄ່າສ້ອມແປງຕົວຈິງ (₭)
                </label>
                <input
                  type="number"
                  min="0"
                  value={statusActualCostInput}
                  onChange={e => setStatusActualCostInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-bold text-emerald-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ໝາຍເຫດການປ່ຽນແປງ (ຈະຖືກບັນທຶກເຂົ້າປະຫວັດ)
                </label>
                <textarea
                  value={statusChangeNote}
                  onChange={e => setStatusChangeNote(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
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
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                {isUpdatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>ຢືນຢັນປ່ຽນສະຖານະ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status History Audit Trail Modal ── */}
      {showHistoryModal && historyTargetTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ປະຫວັດການປ່ຽນສະຖານະ</h3>
                  <p className="text-xs text-zinc-400">
                    ໃບສ້ອມແປງ: {historyTargetTicket.ticketNumber} ({historyTargetTicket.itemName})
                  </p>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {!historyTargetTicket.statusHistory || historyTargetTicket.statusHistory.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  ຍັງບໍ່ມີປະຫວັດການປ່ຽນສະຖານະ
                </div>
              ) : (
                <div className="relative border-l-2 border-zinc-800 ml-3 space-y-6">
                  {historyTargetTicket.statusHistory.map((h, idx) => (
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

      {/* ── Dual-Format Printable Repair Claim Slip Modal (ບິນນ້ອຍ 80mm vs ບິນໃຫຍ່ A4) ── */}
      {showPrintModal && printTargetTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            
            {/* Header & Format Toggle */}
            <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-950/80">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-orange-400" />
                <span className="font-bold text-white text-sm">ຕົວຢ່າງໃບຮັບສ້ອມແປງ & ໃບຮັບປະກັນ</span>
              </div>

              {/* Format Toggle Buttons */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPrintFormat("SLIP")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    printFormat === "SLIP"
                      ? "bg-orange-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>ບິນນ້ອຍ 80mm (Claim Slip)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat("A4")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    printFormat === "A4"
                      ? "bg-orange-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>ບິນໃຫຍ່ A4 (Job Sheet)</span>
                </button>
              </div>

              <button onClick={() => setShowPrintModal(false)} className="text-zinc-400 hover:text-white p-1 self-end sm:self-auto">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Paper Area */}
            <div className="p-6 overflow-y-auto bg-zinc-950/90 text-zinc-900 custom-scrollbar flex-1">
              
              {/* ── FORMAT 1: THERMAL SLIP 80MM ── */}
              {printFormat === "SLIP" ? (
                <div
                  id="printable-repair-slip"
                  className="bg-white text-zinc-950 p-5 rounded-2xl shadow-xl border border-zinc-300 font-mono text-xs max-w-[320px] mx-auto space-y-3 leading-tight"
                >
                  {/* Shop Header */}
                  <div className="text-center border-b border-dashed border-zinc-400 pb-3 space-y-1">
                    <h2 className="text-sm font-black uppercase tracking-wider">
                      ສູນສ້ອມແປງອຸປະກອນກິລາ
                    </h2>
                    <p className="text-[10px] text-zinc-600 font-sans uppercase">
                      SPORTS REPAIR SERVICE CENTER
                    </p>
                    <div className="text-[11px] font-bold text-zinc-800 pt-1">
                      ໃບຮັບສ້ອມແປງ (CLAIM SLIP)
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-300 pb-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">ເລກທີໃບສ້ອມ:</span>
                      <strong className="font-bold">{printTargetTicket.ticketNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">ວັນທີຮັບເຄື່ອງ:</span>
                      <span>{new Date(printTargetTicket.createdAt).toLocaleDateString("lo-LA")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">ຊ່າງຮັບຜິດຊອບ:</span>
                      <span>{printTargetTicket.technicianName || "ສູນສ້ອມແປງ"}</span>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-300 pb-2">
                    <div>
                      <span className="text-zinc-500">ລູກຄ້າ: </span>
                      <strong className="text-zinc-950">{printTargetTicket.customerName}</strong>
                    </div>
                    {printTargetTicket.customerPhone && (
                      <div>
                        <span className="text-zinc-500">ເບີໂທ: </span>
                        <span>{printTargetTicket.customerPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Equipment & Issue */}
                  <div className="space-y-1.5 border-b border-dashed border-zinc-300 pb-2 font-sans">
                    <div className="flex justify-between font-bold text-xs">
                      <span>ອຸປະກອນ:</span>
                      <span className="text-right">{printTargetTicket.itemName}</span>
                    </div>
                    <div className="text-[11px] text-zinc-700">
                      <span className="text-zinc-500 block text-[10px]">ອາການຊຳລຸດ:</span>
                      <span>{printTargetTicket.issueDesc}</span>
                    </div>
                    {printTargetTicket.partsUsed && printTargetTicket.partsUsed.length > 0 && (
                      <div className="pt-1 text-[10px] text-zinc-600 space-y-0.5">
                        <span className="font-bold text-zinc-800 block">ອາໄຫຼ່ທີ່ໃຊ້:</span>
                        {printTargetTicket.partsUsed.map((p, idx) => (
                          <div key={p.id || idx} className="flex justify-between font-mono">
                            <span>- {p.name} (x{p.quantity})</span>
                            <span>{((p.quantity || 1) * (p.unitPrice || 0)).toLocaleString()} ₭</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Financials */}
                  <div className="space-y-1 pt-1 border-b border-dashed border-zinc-400 pb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-600">ຄ່າສ້ອມແປງ:</span>
                      <span>{(printTargetTicket.actualCost || printTargetTicket.estimatedCost || 0).toLocaleString()} ₭</span>
                    </div>
                    {(printTargetTicket.depositPaid || 0) > 0 && (
                      <div className="flex justify-between text-xs text-zinc-600">
                        <span>ມັດຈຳທີ່ຮັບແລ້ວ:</span>
                        <span>{(printTargetTicket.depositPaid || 0).toLocaleString()} ₭</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black pt-1 border-t border-zinc-300">
                      <span>ຍອດຄ້າງຊຳລະມື້ຮັບເຄື່ອງ:</span>
                      <span className="text-rose-700">
                        {Math.max(0, (printTargetTicket.actualCost || printTargetTicket.estimatedCost || 0) - (printTargetTicket.depositPaid || 0)).toLocaleString()} ₭
                      </span>
                    </div>
                  </div>

                  {/* Barcode Graphic */}
                  <div className="text-center pt-1 space-y-1">
                    <div className="flex justify-center items-center gap-[2px] h-8 overflow-hidden">
                      {[2, 3, 1, 4, 2, 1, 3, 1, 4, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2].map((w, i) => (
                        <div
                          key={i}
                          className="bg-black h-full"
                          style={{ width: `${w}px` }}
                        />
                      ))}
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono tracking-widest">
                      *{printTargetTicket.ticketNumber}*
                    </div>
                  </div>

                  {/* Return Notice */}
                  <div className="text-[9px] text-zinc-500 font-sans text-center leading-tight pt-1">
                    <p>1. ກະລຸນານຳໃບຮັບສ້ອມນີ້ມາຍື່ນທຸກຄັ້ງທີ່ມາຮັບເຄື່ອງ.</p>
                    <p>2. ຮັບປະກັນງານສ້ອມແປງ 14 ວັນ (ພາຍໃຕ້ການໃຊ້ງານປົກກະຕິ).</p>
                    <p className="font-bold text-zinc-800 mt-1">ຂໍຂອບໃຈທີ່ໃຊ້ບໍລິການ!</p>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-zinc-400 text-center text-[10px] font-sans">
                    <div>
                      <div className="h-7 border-b border-dashed border-zinc-400 mx-2 mb-1" />
                      <span>ລາຍເຊັນລູກຄ້າ</span>
                    </div>
                    <div>
                      <div className="h-7 border-b border-dashed border-zinc-400 mx-2 mb-1" />
                      <span>ຊ່າງ / ຜູ້ຮັບສ້ອມ</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── FORMAT 2: FORMAL A4 JOB SHEET & WARRANTY ── */
                <div
                  id="printable-repair-slip"
                  className="bg-white text-zinc-950 p-8 rounded-2xl shadow-xl border border-zinc-300 font-sans space-y-6 max-w-2xl mx-auto text-xs"
                >
                  {/* Formal Letterhead */}
                  <div className="flex justify-between items-start border-b-2 border-zinc-950 pb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-black text-sm">
                          SR
                        </div>
                        <h2 className="text-lg font-black tracking-tight uppercase text-zinc-950">
                          ສູນສ້ອມແປງ ແລະ ບຳລຸງຮັກສາອຸປະກອນກິລາ
                        </h2>
                      </div>
                      <p className="text-[11px] text-zinc-600 font-medium">
                        SPORTS EQUIPMENT REPAIR & MAINTENANCE CENTER
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        ໂທ: +856 20 5555 9999 • ນະຄອນຫຼວງວຽງຈັນ, ສປປ ລາວ
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="inline-block px-3 py-1 rounded bg-zinc-950 text-white text-xs font-mono font-bold">
                        {printTargetTicket.ticketNumber}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        ວັນທີຮັບເຄື່ອງ: {new Date(printTargetTicket.createdAt).toLocaleDateString("lo-LA")}
                      </div>
                      <div className="text-[11px] font-bold text-orange-600">
                        ສະຖານະ: {STATUS_CONFIGS[printTargetTicket.status]?.label || printTargetTicket.status}
                      </div>
                    </div>
                  </div>

                  {/* Title Banner */}
                  <div className="text-center py-2 bg-zinc-100 rounded-xl border border-zinc-200">
                    <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide">
                      ໃບຮັບສ້ອມແປງອຸປະກອນ ແລະ ໃບຮັບປະກັນ (REPAIR JOB SHEET & WARRANTY)
                    </h3>
                  </div>

                  {/* 2 Copies Header */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                        ຂໍ້ມູນລູກຄ້າ (Customer Details)
                      </span>
                      <div className="font-bold text-sm text-zinc-950">{printTargetTicket.customerName}</div>
                      <div className="font-mono text-zinc-600 text-xs">ເບີໂທ: {printTargetTicket.customerPhone || "ບໍ່ມີເບີໂທ"}</div>
                    </div>
                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                        ຂໍ້ມູນການສ້ອມແປງ (Service Details)
                      </span>
                      <div className="text-zinc-700 text-xs font-medium">
                        ຊ່າງຮັບຜິດຊອບ: <strong className="text-zinc-950">{printTargetTicket.technicianName || "ສູນສ້ອມແປງ"}</strong>
                      </div>
                      <div className="text-zinc-700 text-xs">
                        ລະດັບຄວາມດ່ວນ: <strong className="text-orange-600">{PRIORITY_CONFIGS[printTargetTicket.priority || "NORMAL"]?.label || "ປົກກະຕິ"}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Repair Details Table */}
                  <div className="border border-zinc-300 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
                        <tr>
                          <th className="py-2.5 px-3 border-r border-zinc-300">ລາຍການອຸປະກອນ & ວຽກສ້ອມ</th>
                          <th className="py-2.5 px-3 border-r border-zinc-300 text-center w-24">ຈຳນວນອາໄຫຼ່</th>
                          <th className="py-2.5 px-3 text-right w-36">ລາຄາປະເມີນ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        <tr>
                          <td className="py-3 px-3 border-r border-zinc-200">
                            <div className="font-bold text-zinc-950">{printTargetTicket.itemName}</div>
                            <div className="text-zinc-600 text-[11px] mt-0.5">
                              <strong>ອາການຊຳລຸດ:</strong> {printTargetTicket.issueDesc}
                            </div>
                            {printTargetTicket.notes && (
                              <div className="text-zinc-500 text-[10px] italic mt-0.5">
                                ໝາຍເຫດ: {printTargetTicket.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center border-r border-zinc-200 font-mono">
                            {printTargetTicket.partsUsed && printTargetTicket.partsUsed.length > 0
                              ? `${printTargetTicket.partsUsed.length} ລາຍການ`
                              : "ບໍ່ມີອາໄຫຼ່"}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-zinc-900">
                            {(printTargetTicket.estimatedCost || 0).toLocaleString()} ₭
                          </td>
                        </tr>

                        {/* Parts Used rows if any */}
                        {printTargetTicket.partsUsed && printTargetTicket.partsUsed.map((p, idx) => (
                          <tr key={p.id || idx} className="bg-zinc-50/50 text-[11px]">
                            <td className="py-2 px-3 border-r border-zinc-200 pl-6 text-zinc-600">
                              + ອາໄຫຼ່: {p.name}
                            </td>
                            <td className="py-2 px-3 text-center border-r border-zinc-200 font-mono">
                              x{p.quantity}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-zinc-700">
                              {((p.quantity || 1) * (p.unitPrice || 0)).toLocaleString()} ₭
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Breakdown Summary */}
                  <div className="flex justify-end">
                    <div className="w-72 bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2 text-xs">
                      <div className="flex justify-between text-zinc-600">
                        <span>ຄ່າສ້ອມແປງຕົວຈິງ:</span>
                        <strong className="text-zinc-900 font-mono">
                          {(printTargetTicket.actualCost || printTargetTicket.estimatedCost || 0).toLocaleString()} ₭
                        </strong>
                      </div>
                      {(printTargetTicket.depositPaid || 0) > 0 && (
                        <div className="flex justify-between text-zinc-600">
                          <span>ເງິນມັດຈຳທີ່ຮັບແລ້ວ:</span>
                          <strong className="text-zinc-900 font-mono">
                            {(printTargetTicket.depositPaid || 0).toLocaleString()} ₭
                          </strong>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t-2 border-zinc-900 font-black text-sm text-zinc-950">
                        <span>ຍອດຄ້າງຊຳລະມື້ຮັບເຄື່ອງ:</span>
                        <span className="font-mono text-rose-700">
                          {Math.max(0, (printTargetTicket.actualCost || printTargetTicket.estimatedCost || 0) - (printTargetTicket.depositPaid || 0)).toLocaleString()} ₭
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Terms and conditions */}
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-[10px] text-zinc-600 leading-relaxed space-y-1">
                    <div className="font-bold text-zinc-900 uppercase mb-1">
                      ເງື່ອນໄຂການບໍລິການ ແລະ ການຮັບປະກັນ (Warranty & Terms):
                    </div>
                    <p>1. ກະລຸນານຳໃບຮັບສ້ອມແປງນີ້ມາຍື່ນທຸກຄັ້ງທີ່ມາຮັບອຸປະກອນຄືນ.</p>
                    <p>2. ທາງຮ້ານຂໍສະຫງວນສິດບໍ່ຮັບຜິດຊອບຫາກບໍ່ມາຮັບອຸປະກອນພາຍໃນ 60 ວັນ ນັບແຕ່ວັນທີແຈ້ງສ້ອມສຳເລັດ.</p>
                    <p>3. ຮັບປະກັນງານສ້ອມແປງ ແລະ ອາໄຫຼ່ທີ່ປ່ຽນໃໝ່ເປັນເວລາ 14 ວັນ (ພາຍໃຕ້ເງື່ອນໄຂການໃຊ້ງານປົກກະຕິ).</p>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-12 pt-6 text-center text-xs">
                    <div>
                      <div className="h-16 border-b border-zinc-400 mx-4 mb-2 flex items-end justify-center pb-1 text-zinc-400 italic">
                        (ລາຍເຊັນລູກຄ້າ)
                      </div>
                      <div className="font-bold text-zinc-900">{printTargetTicket.customerName}</div>
                      <div className="text-[10px] text-zinc-500">ລູກຄ້າຜູ້ມອບສ້ອມ</div>
                    </div>
                    <div>
                      <div className="h-16 border-b border-zinc-400 mx-4 mb-2 flex items-end justify-center pb-1 text-zinc-400 italic">
                        (ລາຍເຊັນ ແລະ ກາປະທັບຮ້ານ)
                      </div>
                      <div className="font-bold text-zinc-900">
                        {printTargetTicket.technicianName || "ສູນສ້ອມແປງອຸປະກອນກິລາ"}
                      </div>
                      <div className="text-[10px] text-zinc-500">ຊ່າງຜູ້ຮັບຜິດຊອບ / ຜູ້ຕາງໜ້າສູນສ້ອມ</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex justify-between items-center gap-3">
              <span className="text-xs text-zinc-400 hidden sm:inline">
                ຮູບແບບການພິມ: <strong className="text-white">{printFormat === "SLIP" ? "ບິນນ້ອຍ 80mm (Claim Slip)" : "ບິນໃຫຍ່ A4 (Official Job Sheet)"}</strong>
              </span>
              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  ປິດໜ້າຕ່າງ
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-600/30 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>{printFormat === "SLIP" ? "ພິມບິນນ້ອຍ (Print 80mm)" : "ພິມບິນໃຫຍ່ (Print A4)"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Add Category Modal ── */}
      {showQuickAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-orange-400" />
                <span>ເພີ່ມປະເພດອຸປະກອນສ້ອມແປງໃໝ່</span>
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
                  ຊື່ປະເພດ / ໝວດໝູ່ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ສະເກັດບອດ, ປິງປອງ, ດຳນ້ຳ..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
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
                  className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {isSavingCat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>ບັນທຶກ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Ticket Detail View Modal ── */}
      {showDetailModal && detailTargetTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/80 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">ລາຍລະອຽດໃບສ້ອມແປງ</h2>
                    <button
                      onClick={() => handleCopyTicketNo(detailTargetTicket.ticketNumber, detailTargetTicket.id)}
                      className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/20 hover:border-orange-500/40 inline-flex items-center gap-1 transition-all"
                    >
                      <span>{detailTargetTicket.ticketNumber}</span>
                      {copiedId === detailTargetTicket.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-zinc-500" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    ວັນທີຮັບເຄື່ອງ: {new Date(detailTargetTicket.createdAt).toLocaleDateString("lo-LA")} ({new Date(detailTargetTicket.createdAt).toLocaleTimeString("lo-LA", { hour: "2-digit", minute: "2-digit" })})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-sm">
              {/* Status and Priority Banner */}
              <div className="flex items-center justify-between gap-3 p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-medium">ສະຖານະ:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${STATUS_CONFIGS[detailTargetTicket.status]?.badgeColor}`}>
                    <span className={`w-2 h-2 rounded-full ${STATUS_CONFIGS[detailTargetTicket.status]?.dotColor}`} />
                    <span>{STATUS_CONFIGS[detailTargetTicket.status]?.label || detailTargetTicket.status}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-medium">ຄວາມດ່ວນ:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${PRIORITY_CONFIGS[detailTargetTicket.priority || "NORMAL"]?.badgeColor}`}>
                    {PRIORITY_CONFIGS[detailTargetTicket.priority || "NORMAL"]?.label}
                  </span>
                </div>
              </div>

              {/* Customer & Equipment 2-column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer */}
                <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    ຂໍ້ມູນລູກຄ້າ / ຜູ້ສົ່ງສ້ອມ
                  </span>
                  <div className="font-bold text-white text-base">{detailTargetTicket.customerName}</div>
                  <div className="text-xs text-zinc-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{detailTargetTicket.customerPhone || "ບໍ່ມີເບີໂທ"}</span>
                  </div>
                  <div>
                    {detailTargetTicket.customerName?.startsWith("ອຸປະກອນເຊົ່າ") ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        ອຸປະກອນເຊົ່າຂອງສະໜາມ (Equipment Asset)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        ລູກຄ້າທົ່ວໄປ (Walk-in Customer)
                      </span>
                    )}
                  </div>
                </div>

                {/* Equipment & Tech */}
                <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    ອຸປະກອນ & ຊ່າງສ້ອມ
                  </span>
                  <div className="font-bold text-white text-base">{detailTargetTicket.itemName}</div>
                  <div className="text-xs text-zinc-300 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-blue-400" />
                    <span>ຊ່າງສ້ອມ: <strong className="text-zinc-100">{detailTargetTicket.technicianName || "ຍັງບໍ່ກຳນົດຊ່າງ"}</strong></span>
                  </div>
                </div>
              </div>

              {/* Problem description */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>ອາການຊຳລຸດ / ບັນຫາທີ່ແຈ້ງ</span>
                </span>
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-zinc-200 text-sm leading-relaxed font-medium">
                  {detailTargetTicket.issueDesc}
                </div>
              </div>

              {/* Notes if any */}
              {detailTargetTicket.notes && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    ໝາຍເຫດເພີ່ມເຕີມ
                  </span>
                  <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800 text-zinc-300 text-xs">
                    {detailTargetTicket.notes}
                  </div>
                </div>
              )}

              {/* Parts used table */}
              {detailTargetTicket.partsUsed && detailTargetTicket.partsUsed.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>ລາຍການອາໄຫຼ່ທີ່ໃຊ້ ({detailTargetTicket.partsUsed.length} ລາຍການ)</span>
                  </span>
                  <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/70">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">ຊື່ອາໄຫຼ່</th>
                          <th className="py-2.5 px-3 text-center">ຈຳນວນ</th>
                          <th className="py-2.5 px-3 text-right">ລາຄາ/ໜ່ວຍ</th>
                          <th className="py-2.5 px-3 text-right">ລວມ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {detailTargetTicket.partsUsed.map((p, idx) => (
                          <tr key={p.id || idx}>
                            <td className="py-2 px-3 text-zinc-200">{p.name}</td>
                            <td className="py-2 px-3 text-center text-zinc-400 font-mono">{p.quantity}</td>
                            <td className="py-2 px-3 text-right text-zinc-400 font-mono">{(p.unitPrice || 0).toLocaleString()} ₭</td>
                            <td className="py-2 px-3 text-right text-emerald-400 font-mono font-bold">
                              {((p.quantity || 1) * (p.unitPrice || 0)).toLocaleString()} ₭
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Cost & Payment Breakdown */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2.5">
                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <span>ລາຄາປະເມີນ:</span>
                  <span className="font-mono text-zinc-200 font-bold">
                    {(detailTargetTicket.estimatedCost || 0).toLocaleString()} ₭
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-white border-t border-zinc-800 pt-2">
                  <span>ຄ່າສ້ອມແປງຕົວຈິງ:</span>
                  <span className="font-mono text-emerald-400 text-base font-extrabold">
                    {(detailTargetTicket.actualCost || detailTargetTicket.estimatedCost || 0).toLocaleString()} ₭
                  </span>
                </div>
                {(detailTargetTicket.depositPaid || 0) > 0 && (
                  <div className="flex justify-between items-center text-xs text-zinc-400">
                    <span>ເງິນມັດຈຳທີ່ຮັບແລ້ວ:</span>
                    <span className="font-mono text-zinc-200">
                      {(detailTargetTicket.depositPaid || 0).toLocaleString()} ₭
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-black pt-2 border-t border-zinc-800 text-zinc-100">
                  <span>ຍອດຄ້າງຊຳລະມື້ຮັບເຄື່ອງ:</span>
                  <span className="font-mono text-rose-400 text-base">
                    {Math.max(0, (detailTargetTicket.actualCost || detailTargetTicket.estimatedCost || 0) - (detailTargetTicket.depositPaid || 0)).toLocaleString()} ₭
                  </span>
                </div>
              </div>

              {/* Converted Order Banner */}
              {(() => {
                const orderId = getConvertedOrderId(detailTargetTicket);
                if (orderId) {
                  return (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <div>
                          <div className="font-bold text-emerald-300 text-xs">ອອກບິນຂາຍຮຽບຮ້ອຍແລ້ວ</div>
                          <div className="text-[11px] text-zinc-400 font-mono">Order ID: #{orderId.slice(-6).toUpperCase()}</div>
                        </div>
                      </div>
                      <Link
                        href="/dashboard/orders"
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                      >
                        ເບິ່ງບິນ Order
                      </Link>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openPrintDialog(detailTargetTicket);
                  }}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>ພິມໃບຮັບສ້ອມ</span>
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openHistoryDialog(detailTargetTicket);
                  }}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <History className="w-4 h-4" />
                  <span>ປະຫວັດ</span>
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(detailTargetTicket);
                  }}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>ແກ້ໄຂ</span>
                </button>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold"
              >
                ປິດ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Print Styles for Repair Claim Slips ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-repair-slip,
          #printable-repair-slip * {
            visibility: visible !important;
          }
          #printable-repair-slip {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: ${printFormat === "SLIP" ? "80mm" : "100%"} !important;
            max-width: ${printFormat === "SLIP" ? "80mm" : "210mm"} !important;
            margin: 0 !important;
            padding: ${printFormat === "SLIP" ? "10px" : "20px"} !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 999999 !important;
          }
        }
      `}} />

      {/* Camera Barcode / QR Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={(code) => {
          handleInspectTicketByQuery(code);
          setIsCameraScannerOpen(false);
        }}
        title="ສະແກນບາໂຄດໃບສ້ອມ (Scan Repair Ticket)"
        subtitle="ສ່ອງກ້ອງໃສ່ເລກທີໃບສ້ອມ #REP-XXXXXX ຫຼື ບາໂຄດເຄື່ອງ"
        placeholder="ຍິງເຄື່ອງສະແກນ ຫຼື ພິມເລກທີໃບສ້ອມ..."
      />
    </div>
  );
}
