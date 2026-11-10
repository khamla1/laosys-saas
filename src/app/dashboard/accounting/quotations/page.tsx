"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Send,
  Trash2,
  Edit,
  XCircle,
  Loader2,
  User,
  Printer,
  Calendar,
  FileCheck,
  ShoppingCart,
  Phone,
  ArrowRight,
  Package,
  X,
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

interface QuotationItemLine {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuotationRecord {
  id: string;
  customerName: string;
  totalAmount: number;
  status: string; // DRAFT, SENT, ACCEPTED, REJECTED
  validUntil: string;
  items: any;
  createdAt: string;
}

export default function QuotationsPage() {
  const [items, setItems] = useState<QuotationRecord[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [inspectedQuotationResult, setInspectedQuotationResult] = useState<BillVerifyResultData | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<QuotationRecord | null>(null);
  const [printingQuotation, setPrintingQuotation] = useState<QuotationRecord | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [lineItems, setLineItems] = useState<QuotationItemLine[]>([
    { name: "", quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState<string | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchItems();
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/dashboard/quotations");
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("ບໍ່ສາມາດໂຫຼດໃບສະເໜີລາຄາໄດ້");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/data-editor/products?limit=100");
      if (res.ok) {
        const json = await res.json();
        setProducts(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/data-editor/customers?mode=leaderboard&limit=50");
      if (res.ok) {
        const json = await res.json();
        setCustomers(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCustomer = (name: string, phone?: string) => {
    setCustomerName(name);
    if (phone) setCustomerPhone(phone);
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { name: "", quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const updated = [...lineItems];
    updated[index] = {
      productId: prod.id,
      name: prod.name,
      quantity: updated[index].quantity || 1,
      unitPrice: prod.price || 0,
      total: (prod.price || 0) * (updated[index].quantity || 1),
    };
    setLineItems(updated);
  };

  const handleLineItemChange = (index: number, field: keyof QuotationItemLine, val: any) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = val;
    if (field === "quantity" || field === "unitPrice") {
      updated[index].total = (Number(updated[index].quantity) || 0) * (Number(updated[index].unitPrice) || 0);
    }
    setLineItems(updated);
  };

  const totalCalculated = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ລູກຄ້າ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerPhone ? `${customerName.trim()} (${customerPhone.trim()})` : customerName.trim(),
        totalAmount: totalCalculated,
        status,
        validUntil,
        items: JSON.stringify(lineItems.filter((i) => i.name.trim() !== "")),
      };

      const url = editingItem
        ? `/api/dashboard/quotations/${editingItem.id}`
        : "/api/dashboard/quotations";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingItem ? "ອັບເດດໃບສະເໜີລາຄາສຳເລັດ" : "ສ້າງໃບສະເໜີລາຄາສຳເລັດແລ້ວ");
        setShowAddModal(false);
        resetForm();
        fetchItems();
      } else {
        toast.error("ບັນທຶກບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (item: QuotationRecord, nextStatus: string) => {
    try {
      const res = await fetch(`/api/dashboard/quotations/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        toast.success(`ປ່ຽນສະຖານະເປັນ "${nextStatus}" ສຳເລັດ`);
        fetchItems();
      }
    } catch {
      toast.error("ປ່ຽນສະຖານະບໍ່ສຳເລັດ");
    }
  };

  const handleConvertToOrder = async (item: QuotationRecord) => {
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການປ່ຽນໃບສະເໜີລາຄາຂອງ "${item.customerName}" ເປັນອໍເດີ້ຂາຍ (Sales Order) ແທ້ບໍ່? ລະບົບຈະສ້າງອໍເດີ້ໃນລະບົບທັນທີ`,
      {
        title: "ຢືນຢັນການປ່ຽນເປັນອໍເດີ້ຂາຍ",
        confirmText: "ຢືນຢັນປ່ຽນເປັນອໍເດີ້",
      }
    );
    if (!confirmed) return;

    setIsConverting(item.id);
    try {
      const res = await fetch(`/api/dashboard/quotations/${item.id}/convert`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        toast.success("ປ່ຽນເປັນອໍເດີ້ຂາຍສຳເລັດຮຽບຮ້ອຍແລ້ວ!");
        fetchItems();
      } else {
        toast.error("ບໍ່ສາມາດປ່ຽນເປັນອໍເດີ້ໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setIsConverting(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await askConfirm("ທ່ານຕ້ອງການລຶບໃບສະເໜີລາຄານີ້ແທ້ບໍ່?", {
      title: "ຢືນຢັນການລຶບໃບສະເໜີລາຄາ",
      confirmText: "ລຶບໃບສະເໜີລາຄາ",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/quotations/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບໃບສະເໜີລາຄາສຳເລັດ");
        fetchItems();
      }
    } catch {
      toast.error("ລຶບໃບສະເໜີລາຄາບໍ່ສຳເລັດ");
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setStatus("DRAFT");
    setValidUntil(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setLineItems([{ name: "", quantity: 1, unitPrice: 0, total: 0 }]);
    setEditingItem(null);
  };

  const openEdit = (item: QuotationRecord) => {
    setEditingItem(item);
    setCustomerName(item.customerName);
    setStatus(item.status);
    setValidUntil(
      item.validUntil
        ? item.validUntil.slice(0, 10)
        : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    );
    try {
      const parsed = typeof item.items === "string" ? JSON.parse(item.items) : item.items;
      if (Array.isArray(parsed) && parsed.length > 0) {
        setLineItems(parsed);
      } else {
        setLineItems([{ name: typeof item.items === "string" ? item.items : "ລາຍການສິນຄ້າ", quantity: 1, unitPrice: item.totalAmount, total: item.totalAmount }]);
      }
    } catch {
      setLineItems([{ name: "ລາຍການສິນຄ້າ", quantity: 1, unitPrice: item.totalAmount, total: item.totalAmount }]);
    }
    setShowAddModal(true);
  };

  const handlePrint = (item: QuotationRecord) => {
    setPrintingQuotation(item);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const matchQuotationBySearchTerm = (item: QuotationRecord, rawQuery: string) => {
    const q = rawQuery.toLowerCase().trim();
    if (!q) return true;
    const cleanQ = q.replace(/^(#|qt-|qt|q-)/i, "").trim();
    const shortId = item.id.slice(-6).toLowerCase();
    const qtCode = `qt-${shortId}`;
    return (
      item.id.toLowerCase().includes(q) ||
      shortId.includes(cleanQ) ||
      qtCode.includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      (typeof item.items === "string" && item.items.toLowerCase().includes(q))
    );
  };

  const filteredItems = items.filter((item) => {
    const matchSearch = matchQuotationBySearchTerm(item, search);
    const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const buildQuotationInspectionResult = (item: QuotationRecord): BillVerifyResultData => {
    const now = new Date();
    const validDt = item.validUntil ? new Date(item.validUntil) : null;
    const qtCode = `QT-${item.id.slice(-6).toUpperCase()}`;
    const diffMs = validDt && !isNaN(validDt.getTime()) ? validDt.getTime() - now.getTime() : 0;
    const isExpired = validDt && !isNaN(validDt.getTime()) ? diffMs < 0 : false;

    let itemSummary = "ລາຍການສະເໜີລາຄາ";
    try {
      const parsed = typeof item.items === "string" ? JSON.parse(item.items) : item.items;
      if (Array.isArray(parsed) && parsed.length > 0) {
        itemSummary = parsed.map((x: any) => `${x.name} x${x.quantity || 1}`).join(", ");
      } else if (typeof item.items === "string" && item.items.trim()) {
        itemSummary = item.items;
      }
    } catch {
      if (typeof item.items === "string" && item.items.trim()) {
        itemSummary = item.items;
      }
    }

    if (item.status === "REJECTED") {
      return {
        billCode: qtCode,
        billTypeLabel: "ໃບສະເໜີລາຄາ (Quotation)",
        statusState: "CANCELLED",
        headline: "ໃບສະເໜີລາຄານີ້ຖືກປະຕິເສດ / ຍົກເລີກແລ້ວ",
        subheadline: `ໃບສະເໜີລາຄາ ${qtCode} ຂອງລູກຄ້າ ${item.customerName} ຢູ່ໃນສະຖານະ REJECTED`,
        customerName: item.customerName,
        itemName: itemSummary,
        startLabel: "ວັນທີອອກໃບສະເໜີລາຄາ",
        startValue: formatDateTimeLaoStandard(item.createdAt),
        endLabel: "ກຳນົດໃຊ້ໄດ້ຮອດວັນທີ",
        endValue: validDt ? formatDateTimeLaoStandard(validDt) : "-",
        timeRemainingText: "ຖືກປະຕິເສດແລ້ວ",
        amountLabel: "ມູນຄ່າສະເໜີລາຄາ",
        amountValue: `₭${(item.totalAmount || 0).toLocaleString()}`,
        actions: [
          {
            label: "ພິມໃບສະເໜີລາຄາ",
            onClick: () => handlePrint(item),
            variant: "secondary",
          },
        ],
      };
    }

    if (item.status === "ACCEPTED") {
      return {
        billCode: qtCode,
        billTypeLabel: "ໃບສະເໜີລາຄາ (Quotation)",
        statusState: "COMPLETED",
        headline: "ໃບສະເໜີລາຄານີ້ລູກຄ້າຕົກລົງຮັບແລ້ວ (Accepted)",
        subheadline: `ລູກຄ້າ ${item.customerName} ຢືນຢັນຕົກລົງໃບສະເໜີລາຄາ ${qtCode} ຮຽບຮ້ອຍແລ້ວ`,
        customerName: item.customerName,
        itemName: itemSummary,
        startLabel: "ວັນທີອອກໃບສະເໜີລາຄາ",
        startValue: formatDateTimeLaoStandard(item.createdAt),
        endLabel: "ກຳນົດໃຊ້ໄດ້ຮອດວັນທີ",
        endValue: validDt ? formatDateTimeLaoStandard(validDt) : "-",
        timeRemainingText: isExpired
          ? `ກາຍວັນໝົດອາຍຸມາແລ້ວ ${formatTimeDiffLao(diffMs)} (ແຕ່ລູກຄ້າຕົກລົງແລ້ວ)`
          : `ຍັງເຫຼືອເວລາ ${formatTimeDiffLao(diffMs)}`,
        amountLabel: "ມູນຄ່າສະເໜີລາຄາ",
        amountValue: `₭${(item.totalAmount || 0).toLocaleString()}`,
        actions: [
          {
            label: "ພິມໃບສະເໜີລາຄາ",
            onClick: () => handlePrint(item),
            variant: "primary",
          },
        ],
      };
    }

    if (isExpired) {
      return {
        billCode: qtCode,
        billTypeLabel: "ໃບສະເໜີລາຄາ (Quotation)",
        statusState: "EXPIRED",
        headline: "ໃບສະເໜີລາຄານີ້ໝົດອາຍຸແລ້ວ! (ກາຍກຳນົດຢືນລາຄາ)",
        subheadline: `ໃບສະເໜີລາຄາ ${qtCode} ໝົດກຳນົດຢືນລາຄາຕັ້ງແຕ່ ${formatDateTimeLaoStandard(validDt)}`,
        customerName: item.customerName,
        itemName: itemSummary,
        startLabel: "ວັນທີອອກໃບສະເໜີລາຄາ",
        startValue: formatDateTimeLaoStandard(item.createdAt),
        endLabel: "ວັນໝົດອາຍຸໃບສະເໜີລາຄາ",
        endValue: formatDateTimeLaoStandard(validDt),
        timeRemainingText: `ໝົດອາຍຸມາແລ້ວ ${formatTimeDiffLao(diffMs)}`,
        amountLabel: "ມູນຄ່າສະເໜີລາຄາ",
        amountValue: `₭${(item.totalAmount || 0).toLocaleString()}`,
        extraNote: "ທ່ານສາມາດກົດແກ້ໄຂເພື່ອຕໍ່ອາຍຸວັນທີຢືນລາຄາ ຫຼື ອອກໃບສະເໜີລາຄາໃໝ່ໃຫ້ລູກຄ້າໄດ້",
        actions: [
          {
            label: "ແກ້ໄຂ / ຕໍ່ອາຍຸ",
            onClick: () => openEdit(item),
            variant: "danger",
          },
          {
            label: "ພິມໃບສະເໜີລາຄາ",
            onClick: () => handlePrint(item),
            variant: "secondary",
          },
        ],
      };
    }

    return {
      billCode: qtCode,
      billTypeLabel: "ໃບສະເໜີລາຄາ (Quotation)",
      statusState: "VALID",
      headline: "ໃບສະເໜີລາຄານີ້ຍັງບໍ່ໝົດອາຍຸ (ຍັງຢູ່ໃນໄລຍະຢືນລາຄາ)",
      subheadline: `ໃບສະເໜີລາຄາ ${qtCode} ຂອງລູກຄ້າ ${item.customerName} ຍັງສາມາດໃຊ້ຢືນຢັນລາຄາໄດ້ປົກກະຕິ`,
      customerName: item.customerName,
      itemName: itemSummary,
      startLabel: "ວັນທີອອກໃບສະເໜີລາຄາ",
      startValue: formatDateTimeLaoStandard(item.createdAt),
      endLabel: "ໃຊ້ໄດ້ຮອດວັນທີ",
      endValue: validDt ? formatDateTimeLaoStandard(validDt) : "-",
      timeRemainingText: validDt ? `ຍັງເຫຼືອເວລາອີກ ${formatTimeDiffLao(diffMs)}` : "ຍັງບໍ່ໝົດອາຍຸ",
      amountLabel: "ມູນຄ່າສະເໜີລາຄາ",
      amountValue: `₭${(item.totalAmount || 0).toLocaleString()}`,
      actions: [
        {
          label: "ແກ້ໄຂໃບສະເໜີລາຄາ",
          onClick: () => openEdit(item),
          variant: "emerald",
        },
        {
          label: "ພິມໃບສະເໜີລາຄາ",
          onClick: () => handlePrint(item),
          variant: "secondary",
        },
      ],
    };
  };

  const handleInspectQuotationByQuery = (rawQuery: string) => {
    const clean = rawQuery.trim();
    if (!clean) {
      toast.error("ກະລຸນາປ້ອນລະຫັດໃບສະເໜີລາຄາ (QT-XXXXXX) ຫຼື ຊື່ລູກຄ້າ ເພື່ອກວດສອບ");
      return;
    }
    setSearch(clean);
    setStatusFilter("ALL");
    const matches = items.filter((item) => matchQuotationBySearchTerm(item, clean));
    if (matches.length === 0) {
      setInspectedQuotationResult(null);
      toast.error(`ບໍ່ພົບໃບສະເໜີລາຄາສຳລັບລະຫັດ "${clean}"`);
      return;
    }
    const target = matches[0];
    const result = buildQuotationInspectionResult(target);
    setInspectedQuotationResult(result);
    if (result.statusState === "EXPIRED") {
      toast.error(`${result.billCode}: ${result.headline}`);
    } else {
      toast.success(`${result.billCode}: ${result.headline}`);
    }
  };

  const totalValue = items.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const acceptedCount = items.filter((i) => i.status === "ACCEPTED").length;
  const sentCount = items.filter((i) => i.status === "SENT").length;
  const draftCount = items.filter((i) => i.status === "DRAFT").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Print Styles ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden; }
              #quotation-print-area, #quotation-print-area * { visibility: visible; }
              #quotation-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                color: black !important;
                padding: 24px;
              }
            }
          `,
        }}
      />

      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700 shadow-lg shadow-purple-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ອອກໃບສະເໜີລາຄາ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                Quotations
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ສ້າງໃບສະເໜີລາຄາໃຫ້ລູກຄ້າ, ພິມເອກະສານທາງການ ແລະ ປ່ຽນເປັນອໍເດີ້ຂາຍໄດ້ໃນຄລິກດຽວ
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>ສ້າງໃບສະເໜີລາຄາໃໝ່</span>
        </button>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ມູນຄ່າສະເໜີລາຄາລວມ</p>
          <h3 className="text-2xl font-extrabold text-purple-400 mt-2">₭{totalValue.toLocaleString()}</h3>
          <p className="text-xs text-zinc-500 mt-2">{items.length} ໃບສະເໜີລາຄາ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ລູກຄ້າຕົກລົງ (Accepted)</p>
          <h3 className="text-2xl font-extrabold text-emerald-400 mt-2">{acceptedCount} ໃບ</h3>
          <p className="text-xs text-emerald-400/80 mt-2">ພ້ອມປ່ຽນເປັນອໍເດີ້ຂາຍ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ສົ່ງແລ້ວ (Sent)</p>
          <h3 className="text-2xl font-extrabold text-blue-400 mt-2">{sentCount} ໃບ</h3>
          <p className="text-xs text-blue-400/80 mt-2">ລໍຖ້າລູກຄ້າຕອບຮັບ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຮ່າງ (Draft)</p>
          <h3 className="text-2xl font-extrabold text-zinc-300 mt-2">{draftCount} ໃບ</h3>
          <p className="text-xs text-zinc-500 mt-2">ກຳລັງກະກຽມ</p>
        </div>
      </div>

      {/* ── Toolbar & Filtering ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="ພິມ ຫຼື ສະແກນເລກໃບສະເໜີລາຄາ (QT-XXXXXX), ຊື່ລູກຄ້າ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!e.target.value.trim()) setInspectedQuotationResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim()) {
                  e.preventDefault();
                  handleInspectQuotationByQuery(search);
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => handleInspectQuotationByQuery(search)}
            className="px-3.5 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0"
          >
            ກວດສອບບິນ
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

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { label: "ທັງໝົດ", value: "ALL" },
            { label: "ຮ່າງ (Draft)", value: "DRAFT" },
            { label: "ສົ່ງແລ້ວ (Sent)", value: "SENT" },
            { label: "ຕົກລົງ (Accepted)", value: "ACCEPTED" },
            { label: "ປະຕິເສດ (Rejected)", value: "REJECTED" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === item.value
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bill Status & Expiry Verification Banner ── */}
      {(() => {
        const activeResult =
          inspectedQuotationResult ||
          (search.trim() && filteredItems.length === 1
            ? buildQuotationInspectionResult(filteredItems[0])
            : null);
        if (!activeResult) return null;
        return (
          <BillVerifyResultCard
            data={activeResult}
            onClear={() => {
              setInspectedQuotationResult(null);
              setSearch("");
            }}
          />
        );
      })()}

      {/* ── Table Section ── */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500 mb-2" />
            <p className="text-zinc-400 text-sm">ກຳລັງໂຫຼດໃບສະເໜີລາຄາ...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">ບໍ່ພົບໃບສະເໜີລາຄາ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800/80">
                  <th className="p-4 text-xs font-semibold text-zinc-400">ເລກທີ / ວັນທີ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400">ຊື່ລູກຄ້າ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-right">ມູນຄ່າລວມ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center">ກຳນົດຮອດວັນທີ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center">ສະຖານະ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center">ການເຊື່ອມຕໍ່</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-4">
                      <p className="text-xs font-mono font-bold text-purple-400">
                        QT-{item.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                        {item.customerName}
                      </p>
                    </td>
                    <td className="p-4 text-sm font-black text-emerald-400 text-right whitespace-nowrap">
                      ₭{item.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center text-xs text-zinc-300">
                      {new Date(item.validUntil).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === "ACCEPTED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : item.status === "SENT"
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : item.status === "REJECTED"
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {item.status === "ACCEPTED"
                          ? "ຕົກລົງແລ້ວ"
                          : item.status === "SENT"
                          ? "ສົ່ງແລ້ວ"
                          : item.status === "REJECTED"
                          ? "ປະຕິເສດ"
                          : "ຮ່າງ"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {item.status !== "ACCEPTED" ? (
                        <button
                          onClick={() => handleConvertToOrder(item)}
                          disabled={isConverting === item.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/30 text-xs font-semibold transition-all"
                          title="ປ່ຽນໃບສະເໜີລາຄານີ້ເປັນອໍເດີ້ຂາຍ"
                        >
                          {isConverting === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShoppingCart className="w-3.5 h-3.5" />
                          )}
                          <span>ປ່ຽນເປັນອໍເດີ້</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>ເປັນອໍເດີ້ແລ້ວ</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePrint(item)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                          title="ພິມໃບສະເໜີລາຄາ"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded-lg transition-colors"
                          title="ແກ້ໄຂ"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 bg-zinc-800 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                          title="ລຶບ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 sticky top-0 z-10">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-500" />
                <span>{editingItem ? "ແກ້ໄຂໃບສະເໜີລາຄາ" : "ສ້າງໃບສະເໜີລາຄາໃໝ່"}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ຍົກເລີກ
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Customer Selector */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ເລືອກລູກຄ້າຈາກລະບົບ ຫຼື ປ້ອນເອງ *
                </label>
                {customers.length > 0 && (
                  <select
                    onChange={(e) => {
                      const c = customers.find((item) => item.customerName === e.target.value);
                      if (c) handleSelectCustomer(c.customerName, c.customerPhone);
                    }}
                    className="w-full mb-2 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300"
                  >
                    <option value="">-- ເລືອກຈາກລາຍຊື່ລູກຄ້າທີ່ມີໃນລະບົບ --</option>
                    {customers.map((c, idx) => (
                      <option key={idx} value={c.customerName}>
                        {c.customerName} ({c.customerPhone || "ບໍ່ມີເບີໂທ"})
                      </option>
                    ))}
                  </select>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="ຊື່ລູກຄ້າ / ບໍລິສັດ *"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="ເບີໂທຕິດຕໍ່ (ຖ້າມີ)"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Status and Validity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">ສະຖານະ</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="DRAFT">ຮ່າງ (Draft)</option>
                    <option value="SENT">ສົ່ງແລ້ວ (Sent)</option>
                    <option value="ACCEPTED">ຕົກລົງແລ້ວ (Accepted)</option>
                    <option value="REJECTED">ປະຕິເສດ (Rejected)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    ກຳນົດຮອດວັນທີ (Valid Until)
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-zinc-300">
                    ລາຍການສິນຄ້າ / ບໍລິການທີ່ສະເໜີລາຄາ
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ເພີ່ມລາຍການ</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 space-y-2"
                    >
                      <div className="flex gap-2">
                        {products.length > 0 && (
                          <select
                            value={line.productId || ""}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            className="w-1/3 px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300"
                          >
                            <option value="">-- ເລືອກສິນຄ້າ --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          type="text"
                          value={line.name}
                          onChange={(e) => handleLineItemChange(idx, "name", e.target.value)}
                          placeholder="ຊື່ສິນຄ້າ / ບໍລິການ"
                          className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white"
                        />
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-zinc-500 block mb-1">ຈຳນວນ</span>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => handleLineItemChange(idx, "quantity", Number(e.target.value))}
                            className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <span className="text-zinc-500 block mb-1">ລາຄາຕໍ່ໜ່ວຍ (₭)</span>
                          <input
                            type="number"
                            value={line.unitPrice}
                            onChange={(e) => handleLineItemChange(idx, "unitPrice", Number(e.target.value))}
                            className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <span className="text-zinc-500 block mb-1">ລວມ (₭)</span>
                          <div className="py-1 px-2 font-bold text-emerald-400">
                            ₭{line.total.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand Total */}
              <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 flex justify-between items-center">
                <span className="text-sm font-bold text-white">ຍອດລວມທັງໝົດ (Grand Total):</span>
                <span className="text-2xl font-black text-emerald-400">
                  ₭{totalCalculated.toLocaleString()}
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? "ອັບເດດໃບສະເໜີລາຄາ" : "ສ້າງໃບສະເໜີລາຄາ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Official Printable Quotation Document ── */}
      {printingQuotation && (
        <div id="quotation-print-area" className="hidden">
          <div style={{ maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #333", paddingBottom: "16px" }}>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>ໃບສະເໜີລາຄາ (QUOTATION)</h1>
                <p style={{ margin: "4px 0 0 0", color: "#666" }}>ເລກທີ: QT-{printingQuotation.id.slice(-6).toUpperCase()}</p>
                <p style={{ margin: "2px 0 0 0", color: "#666" }}>ວັນທີອອກເອກະສານ: {new Date(printingQuotation.createdAt).toLocaleDateString()}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>ບໍລິສັດ / ຮ້ານຄ້າ</h2>
                <p style={{ margin: "4px 0 0 0", color: "#666" }}>ກຳນົດຮອດວັນທີ: {new Date(printingQuotation.validUntil).toLocaleDateString()}</p>
              </div>
            </div>

            <div style={{ margin: "24px 0", padding: "16px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 8px 0" }}>ຂໍ້ມູນລູກຄ້າ (CUSTOMER):</h3>
              <p style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>{printingQuotation.customerName}</p>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", margin: "24px 0" }}>
              <thead>
                <tr style={{ backgroundColor: "#eee", borderBottom: "1px solid #ccc" }}>
                  <th style={{ padding: "10px", textAlign: "left" }}>ລຳດັບ</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>ລາຍລະອຽດສິນຄ້າ / ບໍລິການ</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>ຈຳນວນ</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>ລາຄາຕໍ່ໜ່ວຍ (₭)</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>ລວມ (₭)</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  try {
                    const parsed = typeof printingQuotation.items === "string" ? JSON.parse(printingQuotation.items) : printingQuotation.items;
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      return parsed.map((item: any, i: number) => (
                        <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "10px" }}>{i + 1}</td>
                          <td style={{ padding: "10px" }}>{item.name}</td>
                          <td style={{ padding: "10px", textAlign: "right" }}>{item.quantity}</td>
                          <td style={{ padding: "10px", textAlign: "right" }}>₭{(item.unitPrice || 0).toLocaleString()}</td>
                          <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold" }}>₭{(item.total || 0).toLocaleString()}</td>
                        </tr>
                      ));
                    }
                  } catch {}
                  return (
                    <tr style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "10px" }}>1</td>
                      <td style={{ padding: "10px" }}>{typeof printingQuotation.items === "string" ? printingQuotation.items : "ລາຍການສິນຄ້າ"}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>1</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>₭{printingQuotation.totalAmount.toLocaleString()}</td>
                      <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold" }}>₭{printingQuotation.totalAmount.toLocaleString()}</td>
                    </tr>
                  );
                })()}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ padding: "12px 10px", textAlign: "right", fontWeight: "bold", fontSize: "16px" }}>ຍອດລວມທັງໝົດ:</td>
                  <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: "bold", fontSize: "18px", color: "#10b981" }}>
                    ₭{printingQuotation.totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div style={{ marginTop: "60px", display: "flex", justifyContent: "space-between" }}>
              <div style={{ textAlign: "center", width: "200px" }}>
                <div style={{ borderBottom: "1px solid #333", height: "60px" }}></div>
                <p style={{ marginTop: "8px", fontSize: "12px" }}>ລາຍເຊັນລູກຄ້າ / ຜູ້ຕາງໜ້າ</p>
              </div>
              <div style={{ textAlign: "center", width: "200px" }}>
                <div style={{ borderBottom: "1px solid #333", height: "60px" }}></div>
                <p style={{ marginTop: "8px", fontSize: "12px" }}>ລາຍເຊັນຜູ້ມີອຳນາດລົງນາມ</p>
              </div>
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
          handleInspectQuotationByQuery(code);
        }}
        title="ສະແກນ QR / ບາໂຄ້ດ ໃບສະເໜີລາຄາ (QT-XXXXXX)"
      />
    </div>
  );
}
