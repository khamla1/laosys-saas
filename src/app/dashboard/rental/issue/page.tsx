"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Timer,
  Clock,
  CheckCircle2,
  AlertCircle,
  PackageOpen,
  Package,
  User,
  Phone,
  CreditCard,
  Calendar,
  Banknote,
  Undo2,
  Printer,
  Edit3,
  Trash2,
  Search,
  Plus,
  X,
  ChevronDown,
  Check,
  ExternalLink,
  Loader2,
  LayoutGrid,
  List,
  Kanban,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  FileText,
  BadgeAlert,
  RefreshCw,
  Receipt,
  ShieldCheck,
  ArrowDownLeft,
  Coins,
  ChevronRight,
  Barcode,
  Scan,
  QrCode,
  Camera
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { RentalCameraScannerModal } from "@/components/rental/RentalCameraScannerModal";
import {
  BillVerifyResultCard,
  BillVerifyResultData,
  formatTimeDiffLao,
} from "@/components/BillVerifyResultCard";

interface RentalOrder {
  id: string;
  orderId?: string | null;
  equipmentId?: string | null;
  paymentMethod?: string | null;
  statusHistory?: any[] | null;
  customerName: string;
  customerPhone?: string | null;
  customerIDCard?: string | null;
  itemName: string;
  quantity: number;
  rentDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: "ACTIVE" | "OVERDUE" | "RETURNED" | "CANCELLED" | string;
  rentalFee: number;
  depositAmount: number;
  fineAmount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    slug?: string | null;
    logo?: string | null;
    metadata?: any;
  } | null;
}

interface EquipmentOption {
  id: string;
  name: string;
  rentalPrice: number;
  depositPrice: number;
  stockQuantity: number;
  availableQuantity?: number | null;
  maintenanceQuantity?: number | null;
  rentedQuantity?: number | null;
  status?: string;
}

export default function RentalIssuePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" /></div>}>
      <RentalIssueContent />
    </Suspense>
  );
}

function RentalIssueContent() {
  const searchParams = useSearchParams();
  const initialItemParam = searchParams.get("item");
  const initialStatusParam = searchParams.get("status");
  const initialFeeParam = searchParams.get("fee");
  const initialDepositParam = searchParams.get("deposit");
  const initialEquipIdParam = searchParams.get("equipId");

  const [records, setRecords] = useState<RentalOrder[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "board" | "table">("grid");

  // In-page active view tab: "issue" | "overdue" | "fines"
  const [activeSubTab, setActiveSubTab] = useState<"issue" | "overdue" | "fines">("issue");

  // Overdue-specific state
  const [overdueSeverityFilter, setOverdueSeverityFilter] = useState<"ALL" | "1-3" | "4-7" | "8+">("ALL");
  const [overdueViewMode, setOverdueViewMode] = useState<"grid" | "table">("grid");

  // Fines-specific state
  const [finesLedgerFilter, setFinesLedgerFilter] = useState<"ALL" | "HELD" | "FINES" | "RETURNED">("ALL");
  const [finesViewMode, setFinesViewMode] = useState<"table" | "grid">("table");

  // Add / Edit Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEditId, setSelectedEditId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Return & Settlement Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnTarget, setReturnTarget] = useState<RentalOrder | null>(null);
  const [returnFineInput, setReturnFineInput] = useState<string>("0");
  const [returnNotes, setReturnNotes] = useState<string>("");
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [autoPrintReturnSlip, setAutoPrintReturnSlip] = useState(true);

  // Send to Fines Modal State (Overdue -> Fines Queue)
  const [showSendToFinesModal, setShowSendToFinesModal] = useState(false);
  const [sendToFinesTarget, setSendToFinesTarget] = useState<RentalOrder | null>(null);
  const [sendToFinesAmount, setSendToFinesAmount] = useState<string>("0");
  const [sendToFinesNotes, setSendToFinesNotes] = useState<string>("");
  const [isProcessingFines, setIsProcessingFines] = useState(false);

  // Fines & Deposit Ledger Detail Modal State
  const [showFinesModal, setShowFinesModal] = useState(false);
  const [finesModalOrder, setFinesModalOrder] = useState<RentalOrder | null>(null);

  // Print Slip Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrder, setPrintOrder] = useState<RentalOrder | null>(null);
  const [printFormat, setPrintFormat] = useState<"SLIP" | "A4">("SLIP");
  const [printType, setPrintType] = useState<"RENTAL" | "RETURN">("RENTAL");

  // Dynamic Store & Tenant Info (Branding for individual stores)
  const [storeInfo, setStoreInfo] = useState<{
    id?: string;
    name: string;
    slug?: string;
    logo?: string | null;
    phone?: string;
    address?: string;
    tagline?: string;
  }>({
    name: "ຮ້ານຄ້າ"
  });

  // Dedicated Barcode Scanner Modal State
  const [isBarcodeScanModalOpen, setIsBarcodeScanModalOpen] = useState(false);
  const [scanInputValue, setScanInputValue] = useState("");
  const [inspectedBillResult, setInspectedBillResult] = useState<BillVerifyResultData | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerIDCard, setCustomerIDCard] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [rentDate, setRentDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [rentalFee, setRentalFee] = useState("");
  const [depositAmount, setDepositAmount] = useState("0");
  const [fineAmount, setFineAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [orderStatus, setOrderStatus] = useState("ACTIVE");

  const currentEquipInfo = useMemo(() => {
    if (!itemName.trim()) return null;
    const found = equipmentList.find(e => e.name.toLowerCase() === itemName.trim().toLowerCase());
    if (!found) return null;
    const avail = found.availableQuantity !== null && found.availableQuantity !== undefined
      ? found.availableQuantity
      : Math.max(0, found.stockQuantity - (found.maintenanceQuantity || 0) - (found.rentedQuantity || 0));
    return {
      equipment: found,
      availableQuantity: avail,
      isOutOfStock: avail <= 0,
      isExceeded: Number(quantity) > avail
    };
  }, [itemName, equipmentList, quantity]);

  useEffect(() => {
    fetchRecords();
    fetchEquipment();
  }, []);

  // Pre-fill from query param if available
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "overdue" || initialStatusParam === "OVERDUE") {
      setActiveSubTab("overdue");
    } else if (tabParam === "fines") {
      setActiveSubTab("fines");
    } else if (tabParam === "issue") {
      setActiveSubTab("issue");
    }

    if (initialItemParam) {
      setItemName(initialItemParam);
      openCreateModal(initialItemParam, initialFeeParam, initialDepositParam);
    }
    if (initialStatusParam) {
      setStatusFilter(initialStatusParam);
    }
  }, [searchParams, initialItemParam, initialStatusParam, initialFeeParam, initialDepositParam]);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/dashboard/rentals");
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data)) {
          setRecords(data);
          if (data.length > 0 && data[0].organization) {
            setStoreInfo({
              id: data[0].organization.id,
              name: data[0].organization.name || "ຮ້ານຄ້າ",
              slug: data[0].organization.slug || "",
              logo: data[0].organization.logo || null,
              phone: data[0].organization.metadata?.phone || "",
              address: data[0].organization.metadata?.address || "",
              tagline: data[0].organization.metadata?.tagline || ""
            });
          }
        } else if (data && Array.isArray(data.records)) {
          setRecords(data.records);
          if (data.store) {
            setStoreInfo(data.store);
          }
        }
      } else {
        toast.error("ບໍ່ສາມາດໂຫຼດລາຍການເຊົ່າໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ຂໍ້ມູນ");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const res = await fetch("/api/dashboard/equipment");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setEquipmentList(data);
        if (initialItemParam) {
          const found = data.find((e: EquipmentOption) => e.name.toLowerCase() === initialItemParam.trim().toLowerCase());
          if (found) {
            setRentalFee(prev => (prev && prev !== "0" && prev !== "") ? prev : String(found.rentalPrice));
            setDepositAmount(prev => (prev && prev !== "0" && prev !== "") ? prev : String(found.depositPrice));
          }
        }
      }
    } catch (err) {
      // Non-blocking
    }
  };

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateTimeLao = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const datePart = d.toLocaleDateString("lo-LA");
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${datePart} ${hours}:${mins}`;
  };

  const getOverdueDetails = (dueDateStr: string, refDate: Date = new Date()) => {
    const due = new Date(dueDateStr);
    const diffMs = refDate.getTime() - due.getTime();
    if (diffMs <= 0) {
      return {
        isLate: false,
        isOverdue: false,
        totalMinutes: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        label: "ຕາມກຳນົດ",
        shortLabel: "ປົກກະຕິ",
        fineUnits: 0
      };
    }
    const totalMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ມື້`);
    if (hours > 0) parts.push(`${hours} ຊົ່ວໂມງ`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} ນາທີ`);

    const shortParts: string[] = [];
    if (days > 0) shortParts.push(`${days} ມື້`);
    if (hours > 0) shortParts.push(`${hours} ຊມ`);
    shortParts.push(`${minutes} ນາທີ`);

    const fineUnits = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      isLate: true,
      isOverdue: true,
      totalMinutes,
      days,
      hours,
      minutes,
      label: parts.join(" "),
      shortLabel: shortParts.join(" "),
      fineUnits
    };
  };

  // Standard Code 39 Scannable 1D Barcode SVG Generator
  const renderCode39SVG = (text: string, height = 36) => {
    const clean = text.toUpperCase().replace(/[^0-9A-Z\-]/g, "");
    const full = `*${clean}*`;
    const CODE39: Record<string, string> = {
      '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
      '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
      '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
      'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
      'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
      'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
      'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
      'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
      'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
      '-': '010000101', '*': '010010100'
    };

    const bars: { isBlack: boolean; width: number }[] = [];
    for (let i = 0; i < full.length; i++) {
      const pattern = CODE39[full[i]];
      if (!pattern) continue;
      for (let j = 0; j < 9; j++) {
        const isBlack = j % 2 === 0;
        const isWide = pattern[j] === '1';
        bars.push({ isBlack, width: isWide ? 2.5 : 1 });
      }
      if (i < full.length - 1) {
        bars.push({ isBlack: false, width: 1 });
      }
    }

    const totalWidth = bars.reduce((sum, b) => sum + b.width, 0);
    let curX = 0;

    return (
      <svg viewBox={`0 0 ${totalWidth} ${height}`} className="w-full max-w-[240px] h-9 mx-auto" preserveAspectRatio="none">
        {bars.map((b, idx) => {
          const x = curX;
          curX += b.width;
          if (!b.isBlack) return null;
          return <rect key={idx} x={x} y={0} width={b.width} height={height} fill="#000" />;
        })}
      </svg>
    );
  };

  const buildRentalInspectionResult = (match: RentalOrder): BillVerifyResultData => {
    const now = new Date();
    const diff = formatTimeDiffLao(match.dueDate, now);
    const overdueInfo = getOverdueDetails(match.dueDate, now);
    const isOverdue =
      match.status === "OVERDUE" ||
      match.status === "FINES" ||
      (match.status === "ACTIVE" && overdueInfo.isOverdue);
    const billCode = `#RNT-${match.id.slice(-6).toUpperCase()}`;

    if (match.status === "RETURNED") {
      return {
        billCode,
        billType: "ໃບບິນເຊົ່າອຸປະກອນ (Equipment Rental)",
        expiryState: "COMPLETED",
        statusTitle: `ບິນ ${billCode} ສົ່ງຄືນອຸປະກອນ & ປິດບິນສຳເລັດແລ້ວ`,
        timeSummary: `ສົ່ງຄືນເມື່ອ: ${formatDateTimeLao(match.returnDate)} (ໝົດພັນທະສັນຍາເຊົ່າແລ້ວ)`,
        customerName: match.customerName,
        customerPhone: match.customerPhone,
        itemName: `${match.itemName} (x${match.quantity})`,
        startDateLabel: "ວັນທີເຊົ່າ",
        startDateValue: formatDateTimeLao(match.rentDate),
        dueDateLabel: "ກຳນົດສົ່ງຄືນ",
        dueDateValue: formatDateTimeLao(match.dueDate),
        amountLabel: "ຄ່າເຊົ່າ / ມັດຈຳ",
        amountValue: `₭${(match.rentalFee || 0).toLocaleString()} (ມັດຈຳ ₭${(match.depositAmount || 0).toLocaleString()})`,
        actions: [
          {
            label: "ພິມໃບບິນສົ່ງຄືນ",
            onClick: () => openPrintDialog(match, "RETURN"),
            variant: "secondary",
          },
        ],
      };
    }

    if (match.status === "CANCELLED") {
      return {
        billCode,
        billType: "ໃບບິນເຊົ່າອຸປະກອນ (Equipment Rental)",
        expiryState: "CANCELLED",
        statusTitle: `ບິນ ${billCode} ຖືກຍົກເລີກແລ້ວ`,
        timeSummary: "ບິນນີ້ຖືກຍົກເລີກໃນລະບົບ ບໍ່ສາມາດນຳໃຊ້ໄດ້",
        customerName: match.customerName,
        customerPhone: match.customerPhone,
        itemName: `${match.itemName} (x${match.quantity})`,
        startDateLabel: "ວັນທີເຊົ່າ",
        startDateValue: formatDateTimeLao(match.rentDate),
        dueDateLabel: "ກຳນົດສົ່ງຄືນ",
        dueDateValue: formatDateTimeLao(match.dueDate),
        amountLabel: "ຄ່າເຊົ່າ",
        amountValue: `₭${(match.rentalFee || 0).toLocaleString()}`,
      };
    }

    if (isOverdue) {
      const estFine =
        match.fineAmount > 0 ? match.fineAmount : Math.max(1, overdueInfo.fineUnits || 1) * 10000;
      return {
        billCode,
        billType: "ໃບບິນເຊົ່າອຸປະກອນ (Equipment Rental)",
        expiryState: "EXPIRED",
        statusTitle: `ບິນ ${billCode} ໝົດອາຍຸແລ້ວ / ກາຍກຳນົດສົ່ງຄືນ!`,
        timeSummary: `ໝົດອາຍຸ / ກາຍກຳນົດມາແລ້ວ ${overdueInfo.label} — ກະລຸນາຮັບຄືນອຸປະກອນ ແລະ ສະສາງຄ່າປັບໃໝ`,
        extraBadge: `ຄ່າປັບໃໝປະມານການ: ₭${estFine.toLocaleString()}`,
        customerName: match.customerName,
        customerPhone: match.customerPhone,
        itemName: `${match.itemName} (x${match.quantity})`,
        startDateLabel: "ວັນທີເຊົ່າ",
        startDateValue: formatDateTimeLao(match.rentDate),
        dueDateLabel: "ກຳນົດສົ່ງຄືນ (ໝົດອາຍຸ)",
        dueDateValue: formatDateTimeLao(match.dueDate),
        amountLabel: "ຄ່າເຊົ່າ / ມັດຈຳ",
        amountValue: `₭${(match.rentalFee || 0).toLocaleString()} (ມັດຈຳ ₭${(match.depositAmount || 0).toLocaleString()})`,
        actions: [
          {
            label: "ຮັບຄືນ & ສະສາງມັດຈຳ",
            onClick: () => openReturnModal(match),
            variant: "primary",
          },
          {
            label: "ຄິດໄລ່ຄ່າປັບໃໝ",
            onClick: () => openSendToFinesModal(match),
            variant: "danger",
          },
          {
            label: "ພິມໃບບິນ",
            onClick: () => openPrintDialog(match, "RENTAL"),
            variant: "secondary",
          },
        ],
      };
    }

    return {
      billCode,
      billType: "ໃບບິນເຊົ່າອຸປະກອນ (Equipment Rental)",
      expiryState: "VALID",
      statusTitle: `ບິນ ${billCode} ຍັງບໍ່ໝົດອາຍຸ • ກຳລັງເຊົ່າຢູ່ຕາມກຳນົດ`,
      timeSummary: `ຍັງບໍ່ໝົດອາຍຸ — ຍັງເຫຼືອເວລາເຊົ່າອີກ ${diff.durationText} ກ່ອນຮອດກຳນົດສົ່ງຄືນ`,
      extraBadge: `ມັດຈຳປະກັນ: ₭${(match.depositAmount || 0).toLocaleString()}`,
      customerName: match.customerName,
      customerPhone: match.customerPhone,
      itemName: `${match.itemName} (x${match.quantity})`,
      startDateLabel: "ວັນທີເຊົ່າ",
      startDateValue: formatDateTimeLao(match.rentDate),
      dueDateLabel: "ກຳນົດສົ່ງຄືນ",
      dueDateValue: formatDateTimeLao(match.dueDate),
      amountLabel: "ຄ່າເຊົ່າ / ມັດຈຳ",
      amountValue: `₭${(match.rentalFee || 0).toLocaleString()} (ມັດຈຳ ₭${(match.depositAmount || 0).toLocaleString()})`,
      actions: [
        {
          label: "ຮັບຄືນອຸປະກອນ & ຄືນມັດຈຳ",
          onClick: () => openReturnModal(match),
          variant: "primary",
        },
        {
          label: "ພິມໃບບິນເຊົ່າ",
          onClick: () => openPrintDialog(match, "RENTAL"),
          variant: "secondary",
        },
      ],
    };
  };

  // Smart Scanner Process for Quick Equipment Return / Inspection
  const handleProcessScannedCode = (rawInput: string) => {
    const rawQ = rawInput.trim();
    if (!rawQ) return;
    const cleanQ = rawQ.toLowerCase().replace(/^[#*]/, "").replace(/[*]$/, "");

    const match = enrichedRecords.find(r => {
      const idLower = r.id.toLowerCase();
      const idSuffix = idLower.slice(-6);
      return (
        idLower === cleanQ ||
        `rnt-${idLower}` === cleanQ ||
        idSuffix === cleanQ ||
        `rnt-${idSuffix}` === cleanQ ||
        `ret-${idSuffix}` === cleanQ ||
        (r.orderId && (r.orderId.toLowerCase() === cleanQ || r.orderId.toLowerCase().slice(-6) === cleanQ || `ord-${r.orderId.toLowerCase().slice(-6)}` === cleanQ)) ||
        (r.customerPhone && r.customerPhone.replace(/\s+/g, "") === cleanQ.replace(/\s+/g, "")) ||
        (r.customerIDCard && r.customerIDCard.toLowerCase() === cleanQ) ||
        r.customerName.toLowerCase() === rawQ.toLowerCase()
      );
    }) || (filteredRecords.length === 1 ? filteredRecords[0] : undefined);

    if (!match) {
      setInspectedBillResult({
        billCode: rawQ.toUpperCase(),
        billType: "ໃບບິນເຊົ່າອຸປະກອນ (Equipment Rental)",
        expiryState: "NOT_FOUND",
        statusTitle: `ບໍ່ພົບຂໍ້ມູນບິນເຊົ່າສຳລັບລະຫັດ "${rawInput}"`,
        timeSummary: "ກະລຸນາກວດສອບລະຫັດບິນ (#RNT-XXXXXX), ເບີໂທ ຫຼື ຊື່ລູກຄ້າອີກຄັ້ງ",
      });
      toast.error(`ບໍ່ພົບລາຍການບິນສຳລັບລະຫັດ: "${rawInput}"`);
      return;
    }

    setSearch(rawQ);
    setStatusFilter("ALL");
    const resultData = buildRentalInspectionResult(match);
    setInspectedBillResult(resultData);

    if (resultData.expiryState === "EXPIRED") {
      toast.warning(`${resultData.statusTitle} (${resultData.timeSummary})`);
    } else if (resultData.expiryState === "COMPLETED") {
      toast.info(`${resultData.statusTitle}`);
    } else {
      toast.success(`${resultData.statusTitle} — ${resultData.timeSummary}`);
    }
  };

  const setDueDatePreset = (days: number) => {
    const base = rentDate ? new Date(rentDate) : new Date();
    const target = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    setDueDate(getLocalDateString(target));
  };

  const setDueMinutesPreset = (minutes: number) => {
    const base = rentDate ? new Date(rentDate) : new Date();
    const target = new Date(base.getTime() + minutes * 60 * 1000);
    setDueDate(getLocalDateString(target));
  };

  const handleSelectEquipment = (equipName: string) => {
    setItemName(equipName);
    const found = equipmentList.find(e => e.name === equipName);
    if (found) {
      const avail = found.availableQuantity !== null && found.availableQuantity !== undefined
        ? found.availableQuantity
        : Math.max(0, found.stockQuantity - (found.maintenanceQuantity || 0) - (found.rentedQuantity || 0));
      if (avail <= 0) {
        toast.error(`ອຸປະກອນ "${found.name}" ໝົດຄັງແລ້ວ (ຍອດພ້ອມໃຫ້ເຊົ່າ: 0 ຊິ້ນ)`);
      }
      const qty = Math.max(1, Number(quantity) || 1);
      setRentalFee(String(found.rentalPrice * qty));
      setDepositAmount(String(found.depositPrice * qty));
    }
  };

  const handleQuantityChange = (newQty: string) => {
    setQuantity(newQty);
    const qtyNum = Math.max(1, Number(newQty) || 1);
    const equip = equipmentList.find(e => e.name.toLowerCase() === itemName.trim().toLowerCase());
    if (equip) {
      setRentalFee(String(equip.rentalPrice * qtyNum));
      setDepositAmount(String(equip.depositPrice * qtyNum));
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerIDCard("");
    setItemName("");
    setQuantity("1");
    setRentDate(getLocalDateString());
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setDueDate(getLocalDateString(tomorrow));
    setRentalFee("");
    setDepositAmount("0");
    setFineAmount("0");
    setPaymentMethod("CASH");
    setNotes("");
    setOrderStatus("ACTIVE");
    setIsEditing(false);
    setSelectedEditId(null);
  };

  const openCreateModal = (presetItemName?: string, presetFee?: string | null, presetDeposit?: string | null) => {
    resetForm();
    if (presetItemName) {
      setItemName(presetItemName);
      if (presetFee !== null && presetFee !== undefined && presetFee !== "") {
        setRentalFee(presetFee);
      }
      if (presetDeposit !== null && presetDeposit !== undefined && presetDeposit !== "") {
        setDepositAmount(presetDeposit);
      }
      const found = equipmentList.find(e => e.name.toLowerCase() === presetItemName.trim().toLowerCase());
      if (found) {
        const avail = found.availableQuantity !== null && found.availableQuantity !== undefined
          ? found.availableQuantity
          : Math.max(0, found.stockQuantity - (found.maintenanceQuantity || 0) - (found.rentedQuantity || 0));
        if (avail <= 0) {
          toast.error(`ອຸປະກອນ "${found.name}" ໝົດຄັງແລ້ວ (ຍອດພ້ອມໃຫ້ເຊົ່າ: 0)`);
        }
        if (!presetFee) setRentalFee(String(found.rentalPrice));
        if (!presetDeposit) setDepositAmount(String(found.depositPrice));
      }
    }
    setShowAddModal(true);
  };

  const openEditModal = (order: RentalOrder) => {
    resetForm();
    setIsEditing(true);
    setSelectedEditId(order.id);
    setCustomerName(order.customerName || "");
    setCustomerPhone(order.customerPhone || "");
    setCustomerIDCard(order.customerIDCard || "");
    setItemName(order.itemName || "");
    setQuantity(String(order.quantity || 1));
    setRentDate(order.rentDate ? getLocalDateString(new Date(order.rentDate)) : getLocalDateString());
    setDueDate(order.dueDate ? getLocalDateString(new Date(order.dueDate)) : getLocalDateString());
    setRentalFee(String(order.rentalFee || 0));
    setDepositAmount(String(order.depositAmount || 0));
    setFineAmount(String(order.fineAmount || 0));
    setPaymentMethod(order.paymentMethod || "CASH");
    setNotes(order.notes || "");
    setOrderStatus(order.status || "ACTIVE");
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !itemName.trim() || !rentDate || !dueDate || rentalFee === "") {
      return toast.error("ກະລຸນາຕື່ມຂໍ້ມູນລູກຄ້າ, ອຸປະກອນ, ວັນທີ ແລະ ຄ່າເຊົ່າໃຫ້ຄົບຖ້ວນ");
    }

    if (!isEditing && currentEquipInfo) {
      if (currentEquipInfo.isOutOfStock) {
        return toast.error(`ອຸປະກອນ "${currentEquipInfo.equipment.name}" ໝົດຄັງແລ້ວ (ຍອດພ້ອມໃຫ້ເຊົ່າ: 0 ຊິ້ນ) ບໍ່ສາມາດເປີດບິນເຊົ່າໄດ້`);
      }
      if (currentEquipInfo.isExceeded) {
        return toast.error(`ຈຳນວນທີ່ເຊົ່າ (${quantity} ຊິ້ນ) ເກີນຍອດພ້ອມໃຫ້ເຊົ່າໃນຄັງ (ຍັງເຫຼືອພຽງ ${currentEquipInfo.availableQuantity} ຊິ້ນ)`);
      }
    }

    if (isEditing && orderStatus === "CANCELLED") {
      const confirmed = await askConfirm(
        `ທ່ານຕ້ອງການຍົກເລີກບິນເຊົ່ານີ້ແທ້ບໍ່?`,
        {
          title: "ຢືນຢັນການຍົກເລີກບິນເຊົ່າ",
          subMessage: "ສະຖານະຈະຖືກປ່ຽນເປັນຍົກເລີກ ແລະ ອຸປະກອນຈະຖືກສົ່ງຄືນຄັງ.",
          confirmText: "ຢືນຢັນຍົກເລີກ",
          cancelText: "ປິດ"
        }
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        customerIDCard: customerIDCard.trim() || null,
        itemName: itemName.trim(),
        quantity: Number(quantity) || 1,
        rentDate: new Date(rentDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        rentalFee: Number(rentalFee) || 0,
        depositAmount: Number(depositAmount) || 0,
        fineAmount: Number(fineAmount) || 0,
        paymentMethod,
        notes: notes.trim() || null,
        status: orderStatus
      };

      const url = isEditing && selectedEditId
        ? `/api/dashboard/rentals/${selectedEditId}`
        : "/api/dashboard/rentals";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(isEditing ? "ແກ້ໄຂບິນເຊົ່າສຳເລັດ" : "ເປີດບິນເຊົ່າອຸປະກອນໃໝ່ສຳເລັດ (ບັນທຶກອໍເດີ້ໃນລະບົບກາງແລ້ວ)");
        setShowAddModal(false);
        resetForm();
        fetchRecords();
        fetchEquipment();
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

  // Open Return Settlement Dialog
  const openReturnModal = (order: RentalOrder) => {
    setReturnTarget(order);
    const now = new Date();
    const overdueInfo = getOverdueDetails(order.dueDate, now);
    const isLate = order.status === "OVERDUE" || overdueInfo.isOverdue;
    
    // Auto estimate suggested fine if late (e.g. 10,000 Kip / day overdue, counting hours & minutes)
    let suggestedFine = order.fineAmount || 0;
    if (isLate && suggestedFine === 0) {
      const fineUnits = Math.max(1, overdueInfo.fineUnits || 1);
      suggestedFine = fineUnits * 10000;
    }

    setReturnFineInput(String(suggestedFine));
    setReturnNotes(order.notes ? `${order.notes} [ສົ່ງຄືນເວລາ ${formatDateTimeLao(now)}]` : "");
    setShowReturnModal(true);
  };

  const handleConfirmReturn = async () => {
    if (!returnTarget) return;

    const confirmed = await askConfirm(
      `ຢືນຢັນການຮັບຄືນອຸປະກອນ "${returnTarget.itemName}" (x${returnTarget.quantity})?`,
      {
        title: "ຢືນຢັນການຮັບຄືນ & ສະສາງມັດຈຳ",
        subMessage: returnSettlement.fine > 0
          ? `ມີການຄິດໄລ່ຄ່າປັບໃໝ ${returnSettlement.fine.toLocaleString()} ₭. ຍອດຄືນມັດຈຳຕົວຈິງ: ${returnSettlement.netRefund.toLocaleString()} ₭.`
          : `ຍອດເງິນມັດຈຳທີ່ຈະສົ່ງຄືນໃຫ້ລູກຄ້າ: ${returnSettlement.deposit.toLocaleString()} ₭.`,
        confirmText: "ຢືນຢັນຮັບຄືນ",
        cancelText: "ຍົກເລີກ"
      }
    );
    if (!confirmed) return;

    setIsProcessingReturn(true);
    try {
      const res = await fetch(`/api/dashboard/rentals/${returnTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RETURNED",
          returnDate: new Date().toISOString(),
          fineAmount: Number(returnFineInput) || 0,
          notes: returnNotes.trim() || returnTarget.notes
        })
      });

      if (res.ok) {
        const returnedOrderSnapshot: RentalOrder = {
          ...returnTarget,
          status: "RETURNED",
          returnDate: new Date().toISOString(),
          fineAmount: Number(returnFineInput) || 0,
          notes: returnNotes.trim() || returnTarget.notes
        };
        toast.success(`ຮັບຄືນອຸປະກອນ "${returnTarget.itemName}" ສຳເລັດແລ້ວ ແລະ ເພີ່ມຍອດຄືນສູ່ຄັງຮຽບຮ້ອຍ`);
        setShowReturnModal(false);
        setReturnTarget(null);
        setStatusFilter("RETURNED");
        fetchRecords();
        fetchEquipment();
        if (autoPrintReturnSlip) {
          openPrintDialog(returnedOrderSnapshot, "RETURN");
        }
      } else {
        toast.error("ບໍ່ສາມາດດຳເນີນການຮັບຄືນໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const handleDelete = async (order: RentalOrder) => {
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການລຶບບິນເຊົ່າຂອງ "${order.customerName}" (${order.itemName}) ແທ້ບໍ່?`,
      {
        title: "ຢືນຢັນການລຶບບິນເຊົ່າ",
        subMessage: "ຂໍ້ມູນບິນເຊົ່າ ແລະ ປະຫວັດມັດຈຳຈະຖືກລຶບອອກຈາກລະບົບຖາວອນ.",
        confirmText: "ຢືນຢັນລຶບ",
        cancelText: "ຍົກເລີກ"
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/rentals/${order.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບບິນເຊົ່າສຳເລັດ");
        setRecords(prev => prev.filter(r => r.id !== order.id));
        fetchEquipment();
      } else {
        toast.error("ບໍ່ສາມາດລຶບບິນເຊົ່າໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບ");
    }
  };

  const openFinesModal = (order: RentalOrder) => {
    setFinesModalOrder(order);
    setShowFinesModal(true);
  };

  // Open Send to Fines Dialog
  const openSendToFinesModal = (order: RentalOrder) => {
    setSendToFinesTarget(order);
    const now = new Date();
    const overdueInfo = getOverdueDetails(order.dueDate, now);
    const fineUnits = Math.max(1, overdueInfo.fineUnits || 1);
    const calculatedFine = order.fineAmount > 0 ? order.fineAmount : fineUnits * 10000;
    setSendToFinesAmount(String(calculatedFine));
    setSendToFinesNotes(order.notes || "");
    setShowSendToFinesModal(true);
  };

  const handleConfirmSendToFines = async () => {
    if (!sendToFinesTarget) return;

    setIsProcessingFines(true);
    try {
      const fineVal = Number(sendToFinesAmount) || 0;
      const res = await fetch(`/api/dashboard/rentals/${sendToFinesTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "FINES",
          fineAmount: fineVal,
          notes: sendToFinesNotes.trim() || sendToFinesTarget.notes
        })
      });

      if (res.ok) {
        toast.success(`ຍ້າຍບິນ "${sendToFinesTarget.customerName}" ໄປທີ່ຊ່ອງ 'ຄ່າປັບໃໝ & ມັດຈຳ' ສຳເລັດແລ້ວ`);
        setShowSendToFinesModal(false);
        setSendToFinesTarget(null);
        setStatusFilter("FINES");
        fetchRecords();
      } else {
        toast.error("ບໍ່ສາມາດຍ້າຍໄປຊ່ອງຄ່າປັບໃໝໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsProcessingFines(false);
    }
  };

  const openPrintDialog = (order: RentalOrder, type: "RENTAL" | "RETURN" = "RENTAL") => {
    setPrintOrder(order);
    setPrintType(order.status === "RETURNED" || order.status === "FINES" ? "RETURN" : type);
    setShowPrintModal(true);
  };

  // Auto-flag overdue records in state
  const enrichedRecords = useMemo(() => {
    const now = new Date();
    return records.map(r => {
      // Once an order is transferred to FINES, RETURNED, or CANCELLED, preserve its status
      if (r.status === "FINES" || r.status === "RETURNED" || r.status === "CANCELLED") {
        return r;
      }
      if (r.status === "ACTIVE" && new Date(r.dueDate) < now) {
        return { ...r, status: "OVERDUE" };
      }
      return r;
    });
  }, [records]);

  // Filtered & Smart-Sorted (Supports barcode scanning of #RNT-..., RNT-..., #ORD-...)
  const filteredRecords = useMemo(() => {
    const rawQ = search.toLowerCase().trim();
    const cleanQ = rawQ.replace(/^[#*]/, "").replace(/[*]$/, "");

    const list = enrichedRecords.filter(r => {
      // 1. Search & Barcode filter
      let matchSearch = true;
      if (cleanQ) {
        const idLower = r.id.toLowerCase();
        const idSuffix = idLower.slice(-6);
        matchSearch =
          idLower.includes(cleanQ) ||
          `rnt-${idLower}`.includes(cleanQ) ||
          idSuffix.includes(cleanQ) ||
          `rnt-${idSuffix}`.includes(cleanQ) ||
          `ret-${idSuffix}`.includes(cleanQ) ||
          Boolean(r.orderId && (r.orderId.toLowerCase().includes(cleanQ) || `ord-${r.orderId.toLowerCase().slice(-6)}`.includes(cleanQ))) ||
          r.customerName.toLowerCase().includes(rawQ) ||
          Boolean(r.customerPhone && r.customerPhone.toLowerCase().includes(rawQ)) ||
          Boolean(r.customerIDCard && r.customerIDCard.toLowerCase().includes(cleanQ)) ||
          r.itemName.toLowerCase().includes(rawQ) ||
          Boolean(r.notes && r.notes.toLowerCase().includes(rawQ));
      }

      // 2. Strict status segregation
      let matchStatus = true;
      if (statusFilter === "ALL") {
        matchStatus = true;
      } else if (statusFilter === "ACTIVE") {
        matchStatus = r.status === "ACTIVE";
      } else if (statusFilter === "OVERDUE") {
        matchStatus = r.status === "OVERDUE";
      } else if (statusFilter === "FINES") {
        matchStatus = r.status === "FINES";
      } else if (statusFilter === "RETURNED") {
        matchStatus = r.status === "RETURNED";
      } else {
        matchStatus = r.status === statusFilter;
      }

      return matchSearch && matchStatus;
    });

    return [...list].sort((a, b) => {
      if (statusFilter === "ALL") {
        const priority: Record<string, number> = { OVERDUE: 0, FINES: 1, ACTIVE: 2, RETURNED: 3, CANCELLED: 4 };
        const pa = priority[a.status] ?? 9;
        const pb = priority[b.status] ?? 9;
        if (pa !== pb) return pa - pb;
      }
      const timeA = new Date(a.returnDate || a.updatedAt || a.rentDate).getTime();
      const timeB = new Date(b.returnDate || b.updatedAt || b.rentDate).getTime();
      return timeB - timeA;
    });
  }, [enrichedRecords, search, statusFilter]);

  // Handle Barcode Scanner Enter Key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const q = search.trim();
      if (!q) return;

      if (filteredRecords.length === 1) {
        const match = filteredRecords[0];
        handleProcessScannedCode(match.id);
      } else {
        handleProcessScannedCode(q);
      }
    }
  };

  // Summary Metrics
  const stats = useMemo(() => {
    const total = enrichedRecords.length;
    const active = enrichedRecords.filter(r => r.status === "ACTIVE").length;
    const overdue = enrichedRecords.filter(r => r.status === "OVERDUE").length;
    const finesCount = enrichedRecords.filter(r => r.status === "FINES").length;
    const returned = enrichedRecords.filter(r => r.status === "RETURNED").length;
    const totalHeldDeposit = enrichedRecords
      .filter(r => r.status === "ACTIVE" || r.status === "OVERDUE" || r.status === "FINES")
      .reduce((sum, r) => sum + (r.depositAmount || 0), 0);

    return { total, active, overdue, finesCount, returned, totalHeldDeposit };
  }, [enrichedRecords]);

  // Calculation for Return Settlement
  const returnSettlement = useMemo(() => {
    if (!returnTarget) return { deposit: 0, fine: 0, netRefund: 0, isNegative: false };
    const deposit = returnTarget.depositAmount || 0;
    const fine = Number(returnFineInput) || 0;
    const netRefund = deposit - fine;
    return {
      deposit,
      fine,
      netRefund: Math.abs(netRefund),
      isNegative: netRefund < 0
    };
  }, [returnTarget, returnFineInput]);

  // Computed Overdue Records & Metrics
  const overdueRecords = useMemo(() => {
    const now = new Date();
    return enrichedRecords
      .filter(r => {
        if (r.status === "RETURNED" || r.status === "CANCELLED" || r.status === "FINES") return false;
        const due = new Date(r.dueDate);
        return r.status === "OVERDUE" || (r.status === "ACTIVE" && now > due);
      })
      .map(r => {
        const now = new Date();
        const due = new Date(r.dueDate);
        const diffDays = Math.max(1, Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
        const estimatedFine = r.fineAmount > 0 ? r.fineAmount : diffDays * 10000;
        return {
          ...r,
          diffDays,
          estimatedFine
        };
      })
      .sort((a, b) => b.diffDays - a.diffDays);
  }, [enrichedRecords]);

  const filteredOverdueRecords = useMemo(() => {
    return overdueRecords.filter(r => {
      const q = search.toLowerCase();
      const matchSearch =
        r.customerName.toLowerCase().includes(q) ||
        (r.customerPhone && r.customerPhone.toLowerCase().includes(q)) ||
        (r.customerIDCard && r.customerIDCard.toLowerCase().includes(q)) ||
        r.itemName.toLowerCase().includes(q);

      let matchSeverity = true;
      if (overdueSeverityFilter === "1-3") matchSeverity = r.diffDays >= 1 && r.diffDays <= 3;
      if (overdueSeverityFilter === "4-7") matchSeverity = r.diffDays >= 4 && r.diffDays <= 7;
      if (overdueSeverityFilter === "8+") matchSeverity = r.diffDays >= 8;

      return matchSearch && matchSeverity;
    });
  }, [overdueRecords, search, overdueSeverityFilter]);

  const overdueMetrics = useMemo(() => {
    const totalCount = overdueRecords.length;
    const maxDays = totalCount > 0 ? Math.max(...overdueRecords.map(r => r.diffDays)) : 0;
    const totalEstimatedFines = overdueRecords.reduce((sum, r) => sum + r.estimatedFine, 0);
    const totalDepositsHeld = overdueRecords.reduce((sum, r) => sum + (r.depositAmount || 0), 0);
    return { totalCount, maxDays, totalEstimatedFines, totalDepositsHeld };
  }, [overdueRecords]);

  // Computed Fines Ledger Records & Metrics
  const finesMetrics = useMemo(() => {
    const totalDepositsHeld = enrichedRecords
      .filter(r => r.status === "ACTIVE" || r.status === "OVERDUE")
      .reduce((sum, r) => sum + (r.depositAmount || 0), 0);

    const totalFinesCollected = enrichedRecords
      .reduce((sum, r) => sum + (r.fineAmount || 0), 0);

    const totalRefundedDeposits = enrichedRecords
      .filter(r => r.status === "RETURNED")
      .reduce((sum, r) => sum + Math.max(0, (r.depositAmount || 0) - (r.fineAmount || 0)), 0);

    const totalRentalRevenue = enrichedRecords
      .reduce((sum, r) => sum + (r.rentalFee || 0) + (r.fineAmount || 0), 0);

    const heldCount = enrichedRecords.filter(r => (r.status === "ACTIVE" || r.status === "OVERDUE") && (r.depositAmount || 0) > 0).length;
    const finedCount = enrichedRecords.filter(r => (r.fineAmount || 0) > 0).length;
    const returnedCount = enrichedRecords.filter(r => r.status === "RETURNED").length;

    return {
      totalDepositsHeld,
      totalFinesCollected,
      totalRefundedDeposits,
      totalRentalRevenue,
      heldCount,
      finedCount,
      returnedCount
    };
  }, [enrichedRecords]);

  const filteredFinesRecords = useMemo(() => {
    return enrichedRecords.filter(r => {
      const q = search.toLowerCase();
      const matchSearch =
        r.customerName.toLowerCase().includes(q) ||
        (r.customerPhone && r.customerPhone.toLowerCase().includes(q)) ||
        r.itemName.toLowerCase().includes(q) ||
        (r.paymentMethod && r.paymentMethod.toLowerCase().includes(q));

      let matchFilter = true;
      if (finesLedgerFilter === "HELD") {
        matchFilter = (r.status === "ACTIVE" || r.status === "OVERDUE") && (r.depositAmount || 0) > 0;
      } else if (finesLedgerFilter === "FINES") {
        matchFilter = (r.fineAmount || 0) > 0;
      } else if (finesLedgerFilter === "RETURNED") {
        matchFilter = r.status === "RETURNED";
      }

      return matchSearch && matchFilter;
    });
  }, [enrichedRecords, search, finesLedgerFilter]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center border shrink-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 shadow-indigo-500/20 border-indigo-400/30">
            <Timer className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                ລາຍການເຊົ່າ & ສົ່ງຄືນອຸປະກອນ
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                Active Rentals
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium border bg-amber-500/10 text-amber-400 border-amber-500/30 hidden sm:inline-block">
                Overdue & Fines Integrated
              </span>
            </div>
            <p className="text-zinc-400 text-sm mt-0.5">
              ເປີດບິນເຊົ່າອຸປະກອນ, ຮັບເງິນມັດຈຳ, ຕິດຕາມກຳນົດສົ່ງຄືນ, ຄິດໄລ່ຄ່າປັບໃໝ ແລະ ຮັບຄືນອຸປະກອນຄົບວົງຈອນໃນໜ້າດຽວ
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              fetchRecords();
              fetchEquipment();
              toast.success("ຣີເຟຣຊຂໍ້ມູນຮຽບຮ້ອຍ");
            }}
            className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all border border-zinc-700/60"
            title="ຣີເຟຣຊຂໍ້ມູນ"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            href="/dashboard/rental/equipment"
            className="px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold transition-all border border-zinc-700/60 flex items-center gap-2"
          >
            <PackageOpen className="w-4 h-4 text-emerald-400" />
            <span>ຄັງອຸປະກອນ</span>
          </Link>

          <button
            onClick={() => openCreateModal()}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ ເປີດບິນເຊົ່າໃໝ່</span>
          </button>
        </div>
      </div>

      {/* ── Sub Navigation & Quick Access Buttons ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Link
          href="/dashboard/rental/equipment"
          className="px-4 py-2 rounded-xl font-medium bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <PackageOpen className="w-3.5 h-3.5 text-zinc-400" />
          <span>ຄັງອຸປະກອນໃຫ້ເຊົ່າ (Equipment)</span>
        </Link>

        {/* All Rentals */}
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === "ALL"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800"
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>ທັງໝົດ (All)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300">
            {enrichedRecords.length}
          </span>
        </button>

        {/* Active Rentals */}
        <button
          type="button"
          onClick={() => setStatusFilter("ACTIVE")}
          className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === "ACTIVE"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-400/40"
              : "bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-600 hover:text-white"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>ກຳລັງເຊົ່າ (Active)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-sky-950/80 text-sky-200 border border-sky-600/50">
            {stats.active}
          </span>
        </button>

        {/* Overdue Button */}
        <button
          type="button"
          onClick={() => setStatusFilter("OVERDUE")}
          className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === "OVERDUE"
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400/40"
              : "bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>ກາຍກຳນົດສົ່ງ (Overdue)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-950/80 text-rose-200 border border-rose-600/50">
            {stats.overdue}
          </span>
        </button>

        {/* Fines & Deposit Button */}
        <button
          type="button"
          onClick={() => setStatusFilter("FINES")}
          className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === "FINES"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/40"
              : "bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-600 hover:text-white"
          }`}
        >
          <Banknote className="w-3.5 h-3.5 text-amber-400" />
          <span>ຄ່າປັບໃໝ & ມັດຈຳ (Fines & Deposit)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/80 text-amber-200 border border-amber-600/50">
            {stats.finesCount}
          </span>
        </button>

        {/* Completed / Returned Rentals Button */}
        <button
          type="button"
          onClick={() => setStatusFilter("RETURNED")}
          className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === "RETURNED"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40"
              : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>ຂໍ້ມູນເຊົ່າສຳເລັດແລ້ວ (Returned)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/80 text-emerald-200 border border-emerald-600/50">
            {stats.returned}
          </span>
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Active */}
        <div
          onClick={() => setStatusFilter("ACTIVE")}
          className={`cursor-pointer p-4 rounded-2xl bg-zinc-900/80 border backdrop-blur-xl flex items-center justify-between shadow-lg transition-all duration-200 ${
            statusFilter === "ACTIVE"
              ? "border-sky-500/80 ring-2 ring-sky-500/20 bg-zinc-900"
              : "border-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ກຳລັງເຊົ່າຢູ່</span>
            <div className="text-xl sm:text-2xl font-black text-sky-400 tracking-tight">{stats.active} <span className="text-xs font-normal text-zinc-500">ລາຍການ</span></div>
            <span className="text-[11px] text-zinc-500">ອຸປະກອນຢູ່ກັບລູກຄ້າ</span>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 2: Overdue */}
        <div
          onClick={() => setStatusFilter("OVERDUE")}
          className={`cursor-pointer p-4 rounded-2xl bg-zinc-900/80 border backdrop-blur-xl flex items-center justify-between shadow-lg transition-all duration-200 ${
            statusFilter === "OVERDUE"
              ? "border-rose-500/80 ring-2 ring-rose-500/20 bg-zinc-900"
              : "border-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ກາຍກຳນົດສົ່ງ</span>
            <div className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight">{stats.overdue} <span className="text-xs font-normal text-zinc-500">ລາຍການ</span></div>
            <span className="text-[11px] text-zinc-500">ຮອດກຳນົດແຕ່ຍັງບໍ່ສົ່ງຄືນ</span>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 3: Fines & Deposit Queue */}
        <div
          onClick={() => setStatusFilter("FINES")}
          className={`cursor-pointer p-4 rounded-2xl bg-zinc-900/80 border backdrop-blur-xl flex items-center justify-between shadow-lg transition-all duration-200 ${
            statusFilter === "FINES"
              ? "border-amber-500/80 ring-2 ring-amber-500/20 bg-zinc-900"
              : "border-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ຄ່າປັບໃໝ & ມັດຈຳ</span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
              {stats.finesCount} <span className="text-xs font-normal text-zinc-500">ລາຍການ</span>
            </div>
            <span className="text-[11px] text-zinc-500">ລໍຖ້າອອກບິນ & ສະສາງ</span>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Banknote className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 4: Returned */}
        <div
          onClick={() => setStatusFilter("RETURNED")}
          className={`cursor-pointer p-4 rounded-2xl bg-zinc-900/80 border backdrop-blur-xl flex items-center justify-between shadow-lg transition-all duration-200 ${
            statusFilter === "RETURNED"
              ? "border-emerald-500/80 ring-2 ring-emerald-500/20 bg-zinc-900"
              : "border-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ຂໍ້ມູນເຊົ່າສຳເລັດແລ້ວ</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">{stats.returned} <span className="text-xs font-normal text-zinc-500">ລາຍການ</span></div>
            <span className="text-[11px] text-zinc-500">ສົ່ງຄືນ & ສຳເລັດສົມບູນ</span>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* ── Toolbar & Filter Controls ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search & Barcode Scanner */}
        <div className="flex items-center gap-2 flex-1 max-w-xl flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[200px]">
            <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
            <input
              type="text"
              placeholder="ພິມລະຫັດບິນ (#RNT-XXXXXX), ຊື່, ເບີໂທ ເພື່ອກວດວັນໝົດອາຍຸ..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                if (!e.target.value.trim()) setInspectedBillResult(null);
              }}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-8 py-2 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setInspectedBillResult(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleProcessScannedCode(search)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold border border-emerald-500/30 transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-600/20 active:scale-95"
            title="ກວດສອບສະຖານະບິນ ແລະ ວັນໝົດອາຍຸ"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ກວດສອບບິນ</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setScanInputValue("");
              setIsBarcodeScanModalOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/20 active:scale-95"
            title="ເປີດກ້ອງ ຫຼື ເຄື່ອງສະແກນບາໂຄດບິນເພື່ອກວດສອບ ຫຼື ຮັບຄືນດ່ວນ"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">ກ້ອງສະແກນບິນ</span>
            <span className="sm:hidden">ສະແກນ</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center bg-zinc-950/70 border border-zinc-800 rounded-xl p-1 text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-semibold whitespace-nowrap ${
                statusFilter === "ALL"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              ທັງໝົດ ({enrichedRecords.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-semibold whitespace-nowrap ${
                statusFilter === "ACTIVE"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              ກຳລັງເຊົ່າ ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter("OVERDUE")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-semibold whitespace-nowrap flex items-center gap-1 ${
                statusFilter === "OVERDUE"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-rose-400 hover:text-rose-200"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>ກາຍກຳນົດ ({stats.overdue})</span>
            </button>
            <button
              onClick={() => setStatusFilter("FINES")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-semibold whitespace-nowrap flex items-center gap-1 ${
                statusFilter === "FINES"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-amber-400 hover:text-amber-200"
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>ຄ່າປັບໃໝ & ມັດຈຳ ({stats.finesCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter("RETURNED")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-semibold whitespace-nowrap flex items-center gap-1 ${
                statusFilter === "RETURNED"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-400 hover:text-emerald-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ຂໍ້ມູນເຊົ່າສຳເລັດແລ້ວ ({stats.returned})</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-950/70 border border-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              title="ມຸມມອງກາດ (Grid Cards)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === "grid" ? "bg-zinc-800 text-indigo-400 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">ກາດ</span>
            </button>
            <button
              onClick={() => setViewMode("board")}
              title="ມຸມມອງກະດານ (Kanban Board)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === "board" ? "bg-zinc-800 text-indigo-400 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">ກະດານ</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="ມຸມມອງຕາຕະລາງ (Table View)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === "table" ? "bg-zinc-800 text-indigo-400 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">ຕາຕະລາງ</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Real-Time Bill Status & Expiry Verification Alert Card ── */}
      <BillVerifyResultCard
        result={
          inspectedBillResult ||
          (search.trim().length >= 3 && filteredRecords.length === 1
            ? buildRentalInspectionResult(filteredRecords[0])
            : null)
        }
        onClose={() => {
          setInspectedBillResult(null);
        }}
      />

      {/* Active Filter Indicator Banner */}
      {statusFilter !== "ALL" && !isLoading && (
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
          statusFilter === "OVERDUE"
            ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
            : statusFilter === "FINES"
            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
            : statusFilter === "RETURNED"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-sky-500/10 border-sky-500/30 text-sky-300"
        }`}>
          <div className="flex items-center gap-2 font-semibold">
            {statusFilter === "OVERDUE" && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {statusFilter === "FINES" && <Banknote className="w-4 h-4 text-amber-400 shrink-0" />}
            {statusFilter === "RETURNED" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {statusFilter === "ACTIVE" && <Clock className="w-4 h-4 text-sky-400 shrink-0" />}
            <span>
              {statusFilter === "OVERDUE" && `ກຳລັງສະແດງສະເພາະບິນທີ່ "ກາຍກຳນົດສົ່ງ" ທັງໝົດ (${filteredRecords.length} ລາຍການ)`}
              {statusFilter === "FINES" && `ກຳລັງສະແດງສະເພາະບິນທີ່ມີ "ເງິນມັດຈຳປະກັນ ຫຼື ຄ່າປັບໃໝ" (${filteredRecords.length} ລາຍການ)`}
              {statusFilter === "RETURNED" && `ກຳລັງສະແດງຂໍ້ມູນອຸປະກອນທີ່ "ເຊົ່າສຳເລັດແລ້ວ & ສົ່ງຄືນຮຽບຮ້ອຍ" (${filteredRecords.length} ລາຍການ)`}
              {statusFilter === "ACTIVE" && `ກຳລັງສະແດງສະເພາະບິນທີ່ "ກຳລັງເຊົ່າຢູ່" (${filteredRecords.length} ລາຍການ)`}
            </span>
          </div>
          <button
            onClick={() => setStatusFilter("ALL")}
            className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors text-[11px] font-medium"
          >
            ສະແດງທັງໝົດ
          </button>
        </div>
      )}

      {/* ── Content View (Grid, Board, or Table) ── */}
      {isLoading ? (
        <div className="p-16 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/60">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
          <p className="text-zinc-400 text-sm">ກຳລັງໂຫຼດລາຍການເຊົ່າອຸປະກອນ...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-16 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/60 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-zinc-800/60 rounded-2xl flex items-center justify-center mb-4 text-zinc-500 border border-zinc-700/40">
            <Timer className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">ບໍ່ພົບລາຍການເຊົ່າອຸປະກອນ</h3>
          <p className="text-zinc-400 text-xs max-w-sm mb-5">
            {search || statusFilter !== "ALL"
              ? "ບໍ່ພົບບິນເຊົ່າທີ່ກົງກັບເງື່ອນໄຂຄົ້ນຫາ ລອງປັບຕົວກອງໃໝ່"
              : "ຍັງບໍ່ທັນມີການເປີດບິນເຊົ່າອຸປະກອນ ກົດປຸ່ມດ້ານລຸ່ມເພື່ອເປີດບິນໃໝ່"}
          </p>
          <button
            onClick={() => openCreateModal()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>ເປີດບິນເຊົ່າໃໝ່</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Responsive Card Grid View (Full Width) ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredRecords.map(order => {
            const now = new Date();
            const due = new Date(order.dueDate);
            const overdueInfo = getOverdueDetails(order.dueDate, now);
            const isLate = order.status === "OVERDUE" || (order.status === "ACTIVE" && now > due);
            const diffDays = overdueInfo.fineUnits || Math.max(1, Math.ceil(Math.abs(due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

            const statusBadge =
              order.status === "ACTIVE" && !isLate
                ? { label: "ກຳລັງເຊົ່າ", bg: "bg-sky-500/10 text-sky-400 border-sky-500/30", dot: "bg-sky-400 animate-pulse" }
                : order.status === "OVERDUE"
                ? { label: `ກາຍກຳນົດ (${overdueInfo.shortLabel})`, bg: "bg-rose-500/10 text-rose-400 border-rose-500/30", dot: "bg-rose-400 animate-pulse" }
                : order.status === "FINES"
                ? { label: "ລໍຖ້າສະສາງຄ່າປັບໃໝ", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30", dot: "bg-amber-400 animate-pulse" }
                : { label: "ສົ່ງຄືນແລ້ວ", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" };

            return (
              <div
                key={order.id}
                className={`bg-zinc-900/90 hover:bg-zinc-900 border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between group shadow-lg ${
                  order.status === "OVERDUE"
                    ? "border-rose-500/40 hover:border-rose-500/60 shadow-rose-950/20"
                    : order.status === "FINES"
                    ? "border-amber-500/40 hover:border-amber-500/60 shadow-amber-950/20"
                    : order.status === "RETURNED"
                    ? "border-emerald-500/20 hover:border-emerald-500/40"
                    : "border-zinc-800/90 hover:border-zinc-700"
                }`}
              >
                <div>
                  {/* Top: Status Badge & ID */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                      <span>{statusBadge.label}</span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  {/* Equipment Name & Quantity */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 group-hover:text-indigo-400 transition-colors">
                      {order.itemName}
                    </h3>
                    <span className="text-xs font-extrabold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md shrink-0 border border-zinc-700/50">
                      x{order.quantity}
                    </span>
                  </div>

                  {/* Customer Information (Clean Card) */}
                  <div className="bg-zinc-950/70 rounded-xl p-2.5 border border-zinc-800/60 space-y-1.5 mb-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-200 font-semibold truncate">
                        <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{order.customerName}</span>
                      </div>
                      {order.orderId && (
                        <Link
                          href="/dashboard/orders"
                          className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 hover:bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/20 transition-colors"
                          title="ກວດສອບອໍເດີ້ໃນລະບົບກາງ"
                        >
                          #ORD-{order.orderId.slice(-6).toUpperCase()}
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-zinc-400 text-[11px] pt-1 border-t border-zinc-800/60">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span>{order.customerPhone || "ບໍ່ມີເບີໂທ"}</span>
                      </div>
                      {order.customerIDCard && (
                        <span className="text-[10px] text-zinc-500 font-mono">
                          ID: {order.customerIDCard}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dates Section (Side-by-Side Clean Grid with Minutes) */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                      <span className="text-[10px] text-zinc-500 block">ວັນທີ & ເວລາເຊົ່າ</span>
                      <span className="font-semibold text-zinc-300 text-[11px] font-mono">
                        {formatDateTimeLao(order.rentDate)}
                      </span>
                    </div>

                    <div className={`p-2 rounded-xl border ${
                      order.status === "OVERDUE"
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                        : order.status === "FINES"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        : "bg-zinc-950/60 border-zinc-800/60 text-zinc-300"
                    }`}>
                      <span className="text-[10px] text-zinc-500 block">ກຳນົດສົ່ງຄືນ</span>
                      <span className={`font-bold text-[11px] font-mono ${
                        order.status === "OVERDUE" ? "text-rose-400" : order.status === "FINES" ? "text-amber-400" : "text-zinc-200"
                      }`}>
                        {formatDateTimeLao(order.dueDate)}
                      </span>
                    </div>
                  </div>

                  {/* If returned: show rich settlement summary banner */}
                  {order.status === "RETURNED" ? (
                    <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-emerald-300 font-bold">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ສົ່ງຄືນຮຽບຮ້ອຍ</span>
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {formatDateTimeLao(order.returnDate)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-emerald-500/20 text-center">
                        <div>
                          <span className="text-[10px] text-zinc-400 block">ມັດຈຳທີ່ວາງ</span>
                          <span className="font-bold text-white text-xs">{order.depositAmount.toLocaleString()} ₭</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block">ຄ່າປັບໃໝ</span>
                          <span className={`font-bold text-xs ${order.fineAmount > 0 ? "text-rose-400" : "text-zinc-400"}`}>
                            {order.fineAmount > 0 ? `-${order.fineAmount.toLocaleString()} ₭` : "0 ₭"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block">ຍອດຄືນຕົວຈິງ</span>
                          <span className="font-bold text-emerald-400 text-xs font-mono">
                            {Math.max(0, order.depositAmount - order.fineAmount).toLocaleString()} ₭
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : order.status === "FINES" ? (
                    <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Banknote className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>ລໍຖ້າສະສາງຄ່າປັບໃໝ</span>
                      </span>
                      <span className="font-mono font-bold text-amber-200">
                        {order.fineAmount.toLocaleString()} ₭
                      </span>
                    </div>
                  ) : (
                    /* Active / Overdue: If late, show alert banner */
                    isLate && (
                      <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-pulse">
                        <span className="flex items-center gap-1.5 font-bold">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>ກາຍກຳນົດ {overdueInfo.shortLabel}</span>
                        </span>
                        <span className="font-mono font-bold text-rose-200">
                          ປັບໃໝ: {(diffDays * 10000).toLocaleString()} ₭
                        </span>
                      </div>
                    )
                  )}

                  {/* Financial Badges (Rental Fee, Deposit, Fine) */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60 mb-3 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">ຄ່າເຊົ່າ</span>
                      <span className="font-extrabold text-indigo-400 text-xs sm:text-sm">
                        {order.rentalFee ? `${order.rentalFee.toLocaleString()} ₭` : "ຟຣີ"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">ຄ່າມັດຈຳ</span>
                      <span className="font-bold text-zinc-300 text-xs">
                        {order.depositAmount ? `${order.depositAmount.toLocaleString()} ₭` : "0 ₭"}
                      </span>
                    </div>
                    {order.fineAmount > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] text-rose-500 block">ຄ່າປັບໃໝ</span>
                        <span className="font-bold text-rose-400 text-xs">
                          {order.fineAmount.toLocaleString()} ₭
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-1.5">
                  {order.status === "RETURNED" ? (
                    <div className="flex-1 flex items-center gap-1.5">
                      <button
                        onClick={() => openPrintDialog(order, "RETURN")}
                        className="flex-1 py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-all flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                        title="ພິມໃບບິນສົ່ງຄືນ ແລະ ສະສາງຄ່າປັບໃໝ/ມັດຈຳ"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>ໃບບິນຄ່າປັບໃໝ & ມັດຈຳ</span>
                      </button>
                      <button
                        onClick={() => openFinesModal(order)}
                        className="py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700/50 transition-all flex items-center gap-1"
                        title="ກວດສອບລາຍລະອຽດຍອດເງິນ"
                      >
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>ກວດສອບຍອດ</span>
                      </button>
                    </div>
                  ) : order.status === "FINES" ? (
                    /* ── In Fines Queue (Stage 3): Take Bill & Click Complete! ── */
                    <div className="flex-1 flex items-center gap-1.5">
                      {/* Button: Take the Bill (ພິມໃບບິນຄ່າປັບໃໝ) */}
                      <button
                        onClick={() => openPrintDialog(order, "RETURN")}
                        className="flex-1 py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-all flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                        title="ພິມໃບບິນຄ່າປັບໃໝ & ມັດຈຳ"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>ໃບບິນຄ່າປັບໃໝ</span>
                      </button>

                      {/* Button: Complete / Return (ກົດສຳເລັດ) */}
                      <button
                        onClick={() => openReturnModal(order)}
                        className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-95"
                        title="ກົດສຳເລັດ ແລະ ຍ້າຍໄປຂໍ້ມູນເຊົ່າສຳເລັດແລ້ວ"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ກົດສຳເລັດ</span>
                      </button>
                    </div>
                  ) : order.status === "OVERDUE" ? (
                    /* ── Overdue (Stage 2): Send to Fines ── */
                    <div className="flex-1 flex items-center gap-1.5">
                      <button
                        onClick={() => openSendToFinesModal(order)}
                        className="flex-1 py-1.5 px-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/25 flex items-center justify-center gap-1.5 active:scale-95 animate-pulse"
                        title="ຄິດໄລ່ຄ່າປັບໃໝ ແລະ ສົ່ງຂ້າມໄປຊ່ອງຄ່າປັບໃໝ"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-white" />
                        <span>ກາຍກຳນົດ • ສົ່ງໄປຄ່າປັບໃໝ</span>
                        <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                      </button>
                    </div>
                  ) : (
                    /* ── Active (Stage 1): Normal Return ── */
                    <div className="flex-1 flex items-center gap-1.5">
                      <button
                        onClick={() => openReturnModal(order)}
                        className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>ຮັບຄືນອຸປະກອນ</span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openPrintDialog(order)}
                      title="ພິມໃບບິນເຊົ່າ"
                      className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(order)}
                      title="ແກ້ໄຂ"
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(order)}
                      title="ລຶບ"
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === "board" ? (
        /* ── Kanban Board View ── */
        statusFilter === "ALL" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(["ACTIVE", "OVERDUE", "FINES", "RETURNED"] as const).map(columnStatus => {
              const columnOrders = filteredRecords.filter(r => r.status === columnStatus);

              const headerCfg =
                columnStatus === "ACTIVE"
                  ? { title: "ກຳລັງເຊົ່າຢູ່ (Active)", color: "text-sky-400", border: "border-sky-500/30", icon: Clock }
                  : columnStatus === "OVERDUE"
                  ? { title: "ກາຍກຳນົດສົ່ງ (Overdue)", color: "text-rose-400", border: "border-rose-500/30", icon: AlertCircle }
                  : columnStatus === "FINES"
                  ? { title: "ຄ່າປັບໃໝ & ມັດຈຳ (Fines)", color: "text-amber-400", border: "border-amber-500/30", icon: Banknote }
                  : { title: "ສົ່ງຄືນແລ້ວ (Returned)", color: "text-emerald-400", border: "border-emerald-500/30", icon: CheckCircle2 };

              const HeaderIcon = headerCfg.icon;

              return (
                <div
                  key={columnStatus}
                  className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col min-h-[500px] backdrop-blur-xl"
                >
                  {/* Column Header */}
                  <div className={`flex items-center justify-between pb-3 mb-3 border-b ${headerCfg.border}`}>
                    <div className="flex items-center gap-2">
                      <HeaderIcon className={`w-4 h-4 ${headerCfg.color}`} />
                      <h3 className={`font-bold text-sm tracking-wide ${headerCfg.color}`}>
                        {headerCfg.title}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300">
                      {columnOrders.length}
                    </span>
                  </div>

                  {/* Cards Stack */}
                  <div className="flex-1 space-y-3.5 overflow-y-auto custom-scrollbar pr-1 max-h-[700px]">
                    {columnOrders.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-500 italic">
                        ບໍ່ມີລາຍການໃນຂະນະນີ້
                      </div>
                    ) : (
                      columnOrders.map(order => {
                        const now = new Date();
                        const due = new Date(order.dueDate);
                        const overdueInfo = getOverdueDetails(order.dueDate, now);
                        const isLate = order.status === "OVERDUE" || (order.status === "ACTIVE" && now > due);

                        return (
                          <div
                            key={order.id}
                            className={`bg-zinc-950/80 rounded-xl p-3.5 border transition-all duration-200 hover:shadow-lg hover:border-zinc-700/80 ${
                              order.status === "OVERDUE"
                                ? "border-rose-500/40 shadow-rose-950/20"
                                : order.status === "FINES"
                                ? "border-amber-500/40 shadow-amber-950/20"
                                : order.status === "RETURNED"
                                ? "border-emerald-500/20"
                                : "border-zinc-800"
                            }`}
                          >
                            {/* Top: Equipment & Quantity */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="font-bold text-white text-sm line-clamp-1 flex items-center gap-1.5">
                                <Package className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                <span>{order.itemName}</span>
                              </span>
                              <span className="text-[11px] font-bold bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-300 flex-shrink-0">
                                x{order.quantity}
                              </span>
                            </div>

                            {/* Customer info */}
                            <div className="space-y-1 mb-2.5 text-xs text-zinc-300">
                              <div className="flex items-center gap-1.5 font-semibold text-zinc-100">
                                <User className="w-3.5 h-3.5 text-zinc-500" />
                                <span>{order.customerName}</span>
                              </div>
                              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-zinc-500" />
                                  <span>{order.customerPhone || "ບໍ່ມີເບີໂທ"}</span>
                                </span>
                                {order.customerIDCard && (
                                  <span className="font-mono text-zinc-500 text-[10px]">
                                    ID: {order.customerIDCard}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Dates */}
                            <div className="bg-zinc-900/90 rounded-lg p-2 border border-zinc-800/60 space-y-1 mb-2.5 text-[11px]">
                              <div className="flex justify-between items-center text-zinc-400">
                                <span>ວັນທີເຊົ່າ:</span>
                                <span className="text-zinc-200 font-medium font-mono">
                                  {formatDateTimeLao(order.rentDate)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-400">ກຳນົດສົ່ງ:</span>
                                <span className={`font-bold font-mono ${order.status === "OVERDUE" ? "text-rose-400" : order.status === "FINES" ? "text-amber-400" : "text-zinc-200"}`}>
                                  {formatDateTimeLao(order.dueDate)}
                                </span>
                              </div>
                              {order.returnDate && (
                                <div className="flex justify-between items-center text-emerald-400 font-medium pt-1 border-t border-zinc-800/60 font-mono">
                                  <span>ສົ່ງຄືນແລ້ວ:</span>
                                  <span>{formatDateTimeLao(order.returnDate)}</span>
                                </div>
                              )}
                            </div>

                            {/* Pricing Row */}
                            <div className="flex justify-between items-center text-xs mb-3 pt-1.5 border-t border-zinc-800/60">
                              <div>
                                <span className="text-[10px] text-zinc-500 block">ຄ່າເຊົ່າ</span>
                                <span className="font-bold text-indigo-400">
                                  {order.rentalFee ? `${order.rentalFee.toLocaleString()} ₭` : "ຟຣີ"}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-zinc-500 block">ຄ່າມັດຈຳ</span>
                                <span className="font-bold text-zinc-300">
                                  {order.depositAmount ? `${order.depositAmount.toLocaleString()} ₭` : "0 ₭"}
                                </span>
                              </div>
                              {order.fineAmount > 0 && (
                                <div className="text-right">
                                  <span className="text-[10px] text-rose-500 block">ຄ່າປັບໃໝ</span>
                                  <span className="font-bold text-rose-400">
                                    {order.fineAmount.toLocaleString()} ₭
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Footer Actions */}
                            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-zinc-800/80">
                              {order.status === "RETURNED" ? (
                                <div className="flex-1 flex items-center gap-1">
                                  <button
                                    onClick={() => openPrintDialog(order, "RETURN")}
                                    className="flex-1 py-1 px-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-[11px] font-bold border border-indigo-500/30 transition-all flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                                    title="ພິມໃບບິນສົ່ງຄືນ ແລະ ສະສາງຄ່າປັບໃໝ/ມັດຈຳ"
                                  >
                                    <Receipt className="w-3 h-3" />
                                    <span>ໃບບິນຄ່າປັບໃໝ & ມັດຈຳ</span>
                                  </button>
                                  <button
                                    onClick={() => openFinesModal(order)}
                                    className="py-1 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[11px] font-semibold border border-zinc-700/50 transition-all flex items-center gap-1"
                                    title="ກວດສອບລາຍລະອຽດຍອດເງິນ"
                                  >
                                    <Coins className="w-3 h-3 text-amber-400" />
                                    <span>ກວດສອບຍອດ</span>
                                  </button>
                                </div>
                              ) : order.status === "FINES" ? (
                                <div className="flex-1 flex items-center gap-1">
                                  <button
                                    onClick={() => openPrintDialog(order, "RETURN")}
                                    className="flex-1 py-1 px-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-[11px] font-bold border border-indigo-500/30 transition-all flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                                    title="ພິມໃບບິນຄ່າປັບໃໝ & ມັດຈຳ"
                                  >
                                    <Receipt className="w-3 h-3" />
                                    <span>ໃບບິນຄ່າປັບໃໝ</span>
                                  </button>
                                  <button
                                    onClick={() => openReturnModal(order)}
                                    className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1 active:scale-95"
                                    title="ກົດສຳເລັດ ແລະ ຍ້າຍໄປຂໍ້ມູນເຊົ່າສຳເລັດແລ້ວ"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>ກົດສຳເລັດ</span>
                                  </button>
                                </div>
                              ) : order.status === "OVERDUE" ? (
                                <div className="flex-1 flex items-center gap-1">
                                  <button
                                    onClick={() => openSendToFinesModal(order)}
                                    className="flex-1 py-1 px-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1 active:scale-95 animate-pulse"
                                    title="ຄິດໄລ່ຄ່າປັບໃໝ ແລະ ສົ່ງຂ້າມໄປຊ່ອງຄ່າປັບໃໝ"
                                  >
                                    <AlertCircle className="w-3 h-3 text-white" />
                                    <span>ສົ່ງໄປຄ່າປັບໃໝ</span>
                                    <ChevronRight className="w-3 h-3 text-white/80" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex-1 flex items-center gap-1">
                                  <button
                                    onClick={() => openReturnModal(order)}
                                    className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1 active:scale-95"
                                  >
                                    <Undo2 className="w-3 h-3" />
                                    <span>ຮັບຄືນ</span>
                                  </button>
                                </div>
                              )}

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openPrintDialog(order)}
                                  title="ພິມໃບບິນເຊົ່າ"
                                  className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openEditModal(order)}
                                  title="ແກ້ໄຂ"
                                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(order)}
                                  title="ລຶບ"
                                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
          /* When filtered in board mode, display full-width grid instead of leaving 67% black void */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredRecords.map(order => {
              const now = new Date();
              const due = new Date(order.dueDate);
              const overdueInfo = getOverdueDetails(order.dueDate, now);
              const isLate = order.status === "OVERDUE" || (order.status === "ACTIVE" && now > due);
              const diffDays = overdueInfo.fineUnits || Math.max(1, Math.ceil(Math.abs(due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

              const statusBadge =
                order.status === "ACTIVE" && !isLate
                  ? { label: "ກຳລັງເຊົ່າ", bg: "bg-sky-500/10 text-sky-400 border-sky-500/30", dot: "bg-sky-400 animate-pulse" }
                  : order.status === "OVERDUE"
                  ? { label: `ກາຍກຳນົດ (${overdueInfo.shortLabel})`, bg: "bg-rose-500/10 text-rose-400 border-rose-500/30", dot: "bg-rose-400 animate-pulse" }
                  : order.status === "FINES"
                  ? { label: "ລໍຖ້າສະສາງຄ່າປັບໃໝ", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30", dot: "bg-amber-400 animate-pulse" }
                  : { label: "ສົ່ງຄືນແລ້ວ", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" };

              return (
                <div
                  key={order.id}
                  className={`bg-zinc-900/90 hover:bg-zinc-900 border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between group shadow-lg ${
                    order.status === "OVERDUE"
                      ? "border-rose-500/40 hover:border-rose-500/60 shadow-rose-950/20"
                      : order.status === "FINES"
                      ? "border-amber-500/40 hover:border-amber-500/60 shadow-amber-950/20"
                      : order.status === "RETURNED"
                      ? "border-emerald-500/20 hover:border-emerald-500/40"
                      : "border-zinc-800/90 hover:border-zinc-700"
                  }`}
                >
                  <div>
                    {/* Top: Status Badge & ID */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                        <span>{statusBadge.label}</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    {/* Equipment Name & Quantity */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {order.itemName}
                      </h3>
                      <span className="text-xs font-extrabold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md shrink-0 border border-zinc-700/50">
                        x{order.quantity}
                      </span>
                    </div>

                    {/* Customer Information (Clean Card) */}
                    <div className="bg-zinc-950/70 rounded-xl p-2.5 border border-zinc-800/60 space-y-1.5 mb-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-zinc-200 font-semibold truncate">
                          <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{order.customerName}</span>
                        </div>
                        {order.orderId && (
                          <Link
                            href="/dashboard/orders"
                            className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 hover:bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/20 transition-colors"
                            title="ກວດສອບອໍເດີ້ໃນລະບົບກາງ"
                          >
                            #ORD-{order.orderId.slice(-6).toUpperCase()}
                          </Link>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-zinc-400 text-[11px] pt-1 border-t border-zinc-800/60">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span>{order.customerPhone || "ບໍ່ມີເບີໂທ"}</span>
                        </div>
                        {order.customerIDCard && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            ID: {order.customerIDCard}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dates Section (Side-by-Side Clean Grid with Minutes) */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                        <span className="text-[10px] text-zinc-500 block">ວັນທີ & ເວລາເຊົ່າ</span>
                        <span className="font-semibold text-zinc-300 text-[11px] font-mono">
                          {formatDateTimeLao(order.rentDate)}
                        </span>
                      </div>

                      <div className={`p-2 rounded-xl border ${
                        order.status === "OVERDUE"
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                          : order.status === "FINES"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          : "bg-zinc-950/60 border-zinc-800/60 text-zinc-300"
                      }`}>
                        <span className="text-[10px] text-zinc-500 block">ກຳນົດສົ່ງຄືນ</span>
                        <span className={`font-bold text-[11px] font-mono ${
                          order.status === "OVERDUE" ? "text-rose-400" : order.status === "FINES" ? "text-amber-400" : "text-zinc-200"
                        }`}>
                          {formatDateTimeLao(order.dueDate)}
                        </span>
                      </div>
                    </div>

                    {/* If returned: show rich settlement summary banner */}
                    {order.status === "RETURNED" ? (
                      <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-emerald-300 font-bold">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ສົ່ງຄືນຮຽບຮ້ອຍ</span>
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {formatDateTimeLao(order.returnDate)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-emerald-500/20 text-center">
                          <div>
                            <span className="text-[10px] text-zinc-400 block">ມັດຈຳທີ່ວາງ</span>
                            <span className="font-bold text-white text-xs">{order.depositAmount.toLocaleString()} ₭</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 block">ຄ່າປັບໃໝ</span>
                            <span className={`font-bold text-xs ${order.fineAmount > 0 ? "text-rose-400" : "text-zinc-400"}`}>
                              {order.fineAmount > 0 ? `-${order.fineAmount.toLocaleString()} ₭` : "0 ₭"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 block">ຍອດຄືນຕົວຈິງ</span>
                            <span className="font-bold text-emerald-400 text-xs font-mono">
                              {Math.max(0, order.depositAmount - order.fineAmount).toLocaleString()} ₭
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : order.status === "FINES" ? (
                      <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold">
                          <Banknote className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>ລໍຖ້າສະສາງຄ່າປັບໃໝ</span>
                        </span>
                        <span className="font-mono font-bold text-amber-200">
                          {order.fineAmount.toLocaleString()} ₭
                        </span>
                      </div>
                    ) : (
                      /* Active / Overdue: If late, show alert banner */
                      isLate && (
                        <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-pulse">
                          <span className="flex items-center gap-1.5 font-bold">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>ກາຍກຳນົດ {overdueInfo.shortLabel}</span>
                          </span>
                          <span className="font-mono font-bold text-rose-200">
                            ປັບໃໝ: {(diffDays * 10000).toLocaleString()} ₭
                          </span>
                        </div>
                      )
                    )}

                    {/* Financial Badges (Rental Fee, Deposit, Fine) */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60 mb-3 text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">ຄ່າເຊົ່າ</span>
                        <span className="font-extrabold text-indigo-400 text-xs sm:text-sm">
                          {order.rentalFee ? `${order.rentalFee.toLocaleString()} ₭` : "ຟຣີ"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 block">ຄ່າມັດຈຳ</span>
                        <span className="font-bold text-zinc-300 text-xs">
                          {order.depositAmount ? `${order.depositAmount.toLocaleString()} ₭` : "0 ₭"}
                        </span>
                      </div>
                      {order.fineAmount > 0 && (
                        <div className="text-right">
                          <span className="text-[10px] text-rose-500 block">ຄ່າປັບໃໝ</span>
                          <span className="font-bold text-rose-400 text-xs">
                            {order.fineAmount.toLocaleString()} ₭
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-1.5">
                    {order.status === "RETURNED" ? (
                      <div className="flex-1 flex items-center gap-1.5">
                        <button
                          onClick={() => openPrintDialog(order, "RETURN")}
                          className="flex-1 py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-all flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                          title="ພິມໃບບິນສົ່ງຄືນ ແລະ ສະສາງຄ່າປັບໃໝ/ມັດຈຳ"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>ໃບບິນຄ່າປັບໃໝ & ມັດຈຳ</span>
                        </button>
                        <button
                          onClick={() => openFinesModal(order)}
                          className="py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700/50 transition-all flex items-center gap-1"
                          title="ກວດສອບລາຍລະອຽດຍອດເງິນ"
                        >
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          <span>ກວດສອບຍອດ</span>
                        </button>
                      </div>
                    ) : order.status === "FINES" ? (
                      <div className="flex-1 flex items-center gap-1.5">
                        <button
                          onClick={() => openPrintDialog(order, "RETURN")}
                          className="flex-1 py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-all flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                          title="ພິມໃບບິນຄ່າປັບໃໝ & ມັດຈຳ"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>ໃບບິນຄ່າປັບໃໝ</span>
                        </button>
                        <button
                          onClick={() => openReturnModal(order)}
                          className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-95"
                          title="ກົດສຳເລັດ ແລະ ຍ້າຍໄປຂໍ້ມູນເຊົ່າສຳເລັດແລ້ວ"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ກົດສຳເລັດ</span>
                        </button>
                      </div>
                    ) : order.status === "OVERDUE" ? (
                      <div className="flex-1 flex items-center gap-1.5">
                        <button
                          onClick={() => openSendToFinesModal(order)}
                          className="flex-1 py-1.5 px-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/25 flex items-center justify-center gap-1.5 active:scale-95 animate-pulse"
                          title="ຄິດໄລ່ຄ່າປັບໃໝ ແລະ ສົ່ງຂ້າມໄປຊ່ອງຄ່າປັບໃໝ"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-white" />
                          <span>ກາຍກຳນົດ • ສົ່ງໄປຄ່າປັບໃໝ</span>
                          <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center gap-1.5">
                        <button
                          onClick={() => openReturnModal(order)}
                          className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1 active:scale-95"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>ຮັບຄືນອຸປະກອນ</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openPrintDialog(order)}
                        title="ພິມໃບບິນເຊົ່າ"
                        className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded-xl transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(order)}
                        title="ແກ້ໄຂ"
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(order)}
                        title="ລຶບ"
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ── Table View ── */
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950/70 text-xs text-zinc-400 uppercase font-semibold border-b border-zinc-800/80">
                <tr>
                  <th className="py-3.5 px-4">ລູກຄ້າ</th>
                  <th className="py-3.5 px-4">ອຸປະກອນ & ຈຳນວນ</th>
                  <th className="py-3.5 px-4">ວັນທີເຊົ່າ - ກຳນົດສົ່ງ (ລວມນາທີ)</th>
                  <th className="py-3.5 px-4 text-right">ຄ່າເຊົ່າ</th>
                  <th className="py-3.5 px-4 text-right">ຄ່າມັດຈຳ</th>
                  <th className="py-3.5 px-4 text-center">ສະຖານະ</th>
                  <th className="py-3.5 px-4 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredRecords.map(order => {
                  const now = new Date();
                  const due = new Date(order.dueDate);
                  const overdueInfo = getOverdueDetails(order.dueDate, now);
                  const isLate = order.status === "OVERDUE" || (order.status === "ACTIVE" && now > due);

                  return (
                    <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{order.customerName}</div>
                        <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          <span>{order.customerPhone || "-"}</span>
                        </div>
                        {order.orderId && (
                          <div className="mt-1">
                            <Link
                              href="/dashboard/orders"
                              className="inline-flex items-center gap-1 font-mono text-[10px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/25 transition-colors"
                              title="ກວດສອບອໍເດີ້ໃນລະບົບກາງ"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>#ORD-{order.orderId.slice(-6).toUpperCase()}</span>
                            </Link>
                          </div>
                        )}
                      </td>

                      {/* Equipment */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-100">{order.itemName}</div>
                        <span className="text-[11px] text-zinc-400 font-medium">ຈຳນວນ: {order.quantity} ຊິ້ນ</span>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 text-xs font-mono">
                        <div className="text-zinc-400">
                          ເຊົ່າ: {formatDateTimeLao(order.rentDate)}
                        </div>
                        <div className={`font-bold mt-0.5 ${isLate ? "text-rose-400" : "text-zinc-200"}`}>
                          ສົ່ງ: {formatDateTimeLao(order.dueDate)}
                          {isLate && ` (ກາຍ ${overdueInfo.shortLabel})`}
                        </div>
                        {order.returnDate && (
                          <div className="text-emerald-400 text-[11px] mt-0.5">
                            ສົ່ງຄືນ: {formatDateTimeLao(order.returnDate)}
                          </div>
                        )}
                      </td>

                      {/* Rental Fee */}
                      <td className="py-3.5 px-4 text-right font-bold text-indigo-400">
                        {order.rentalFee ? `${order.rentalFee.toLocaleString()} ₭` : "ຟຣີ"}
                      </td>

                      {/* Deposit */}
                      <td className="py-3.5 px-4 text-right font-medium text-zinc-300">
                        {order.depositAmount ? `${order.depositAmount.toLocaleString()} ₭` : "0 ₭"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${
                            order.status === "ACTIVE" && !isLate
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                              : order.status === "OVERDUE"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : order.status === "FINES"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              order.status === "ACTIVE" && !isLate
                                ? "bg-sky-400"
                                : order.status === "OVERDUE"
                                ? "bg-rose-400 animate-pulse"
                                : order.status === "FINES"
                                ? "bg-amber-400 animate-pulse"
                                : "bg-emerald-400"
                            }`}
                          />
                          <span>
                            {order.status === "ACTIVE" && !isLate
                              ? "ກຳລັງເຊົ່າ"
                              : order.status === "OVERDUE"
                              ? `ກາຍ (${overdueInfo.shortLabel})`
                              : order.status === "FINES"
                              ? "ລໍຖ້າສະສາງຄ່າປັບໃໝ"
                              : "ສົ່ງຄືນແລ້ວ"}
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === "RETURNED" ? (
                            <>
                              <button
                                onClick={() => openPrintDialog(order, "RETURN")}
                                title="ພິມໃບບິນສົ່ງຄືນ ແລະ ສະສາງຄ່າປັບໃໝ/ມັດຈຳ"
                                className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-indigo-500/30 flex items-center gap-1"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>ໃບບິນຄ່າປັບໃໝ & ມັດຈຳ</span>
                              </button>
                              <button
                                onClick={() => openFinesModal(order)}
                                title="ກວດສອບຍອດມັດຈຳ ແລະ ຄ່າປັບໃໝ"
                                className="p-1.5 text-amber-400 hover:text-white hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
                              >
                                <Coins className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : order.status === "FINES" ? (
                            <>
                              <button
                                onClick={() => openPrintDialog(order, "RETURN")}
                                title="ພິມໃບບິນຄ່າປັບໃໝ & ມັດຈຳ"
                                className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-indigo-500/30 flex items-center gap-1 shadow-sm"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>ໃບບິນຄ່າປັບໃໝ</span>
                              </button>
                              <button
                                onClick={() => openReturnModal(order)}
                                title="ກົດສຳເລັດ ແລະ ຍ້າຍໄປຂໍ້ມູນເຊົ່າສຳເລັດແລ້ວ"
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>ກົດສຳເລັດ</span>
                              </button>
                            </>
                          ) : order.status === "OVERDUE" ? (
                            <>
                              <button
                                onClick={() => openSendToFinesModal(order)}
                                title="ຄິດໄລ່ຄ່າປັບໃໝ ແລະ ສົ່ງຂ້າມໄປຊ່ອງຄ່າປັບໃໝ"
                                className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 animate-pulse"
                              >
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>ກາຍກຳນົດ • ສົ່ງໄປຄ່າປັບໃໝ</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openReturnModal(order)}
                                title="ຮັບຄືນອຸປະກອນ"
                                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold transition-all border border-emerald-500/30 flex items-center gap-1"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                                <span>ຮັບຄືນ</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openPrintDialog(order)}
                            title="ພິມໃບບິນເຊົ່າ"
                            className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(order)}
                            title="ແກ້ໄຂ"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(order)}
                            title="ລຶບ"
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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

      {/* ── Add / Edit Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {isEditing ? "ແກ້ໄຂບິນເຊົ່າອຸປະກອນ" : "ເປີດບິນເຊົ່າອຸປະກອນໃໝ່"}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {isEditing ? "ປັບປຸງລາຍລະອຽດ, ວັນທີ ແລະ ຄ່າບໍລິການ" : "ກະລຸນາຕື່ມຂໍ້ມູນການເຊົ່າ ແລະ ຮັບເງິນມັດຈຳ"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="rental-order-form" onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. Customer Section */}
                <div>
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>1. ຂໍ້ມູນລູກຄ້າຜູ້ເຊົ່າ (Customer Info)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ຊື່ ແລະ ນາມສະກຸນ <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        required
                        placeholder="ຕົວຢ່າງ: ສຸລິຍາ ມະນີວົງ"
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ເບີໂທຕິດຕໍ່
                      </label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="020 5511 2233"
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ເລກບັດປະຈຳຕົວ / Passport
                      </label>
                      <input
                        type="text"
                        value={customerIDCard}
                        onChange={e => setCustomerIDCard(e.target.value)}
                        placeholder="01-9876543"
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Equipment Section */}
                <div className="border-t border-zinc-800/80 pt-4">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      <span>2. ອຸປະກອນທີ່ເຊົ່າ (Equipment Selection)</span>
                    </span>
                    {equipmentList.length > 0 && (
                      <span className="text-[11px] text-zinc-500 font-normal">ເລືອກຈາກຄັງ ຫຼື ພິມເອງ</span>
                    )}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Equipment Select or Type */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ຊື່ອຸປະກອນ <span className="text-red-400">*</span>
                      </label>
                      {equipmentList.length > 0 ? (
                        <div className="space-y-2">
                          <select
                            value={equipmentList.some(e => e.name === itemName) ? itemName : ""}
                            onChange={e => {
                              if (e.target.value) handleSelectEquipment(e.target.value);
                            }}
                            className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">-- ເລືອກຈາກຄັງອຸປະກອນໃຫ້ເຊົ່າ --</option>
                            {equipmentList.map(eq => {
                              const avail = eq.availableQuantity !== null && eq.availableQuantity !== undefined
                                ? eq.availableQuantity
                                : Math.max(0, eq.stockQuantity - (eq.maintenanceQuantity || 0) - (eq.rentedQuantity || 0));
                              const isOut = avail <= 0;
                              return (
                                <option key={eq.id} value={eq.name} disabled={isOut && !isEditing}>
                                  {eq.name} — {isOut ? "[ໝົດຄັງ / 0 ຊິ້ນ]" : `[ພ້ອມເຊົ່າ: ${avail} ຊິ້ນ]`} (ຄ່າເຊົ່າ: {eq.rentalPrice.toLocaleString()} ₭ | ມັດຈຳ: {eq.depositPrice.toLocaleString()} ₭)
                                </option>
                              );
                            })}
                          </select>
                          <input
                            type="text"
                            value={itemName}
                            onChange={e => setItemName(e.target.value)}
                            required
                            placeholder="ຫຼື ພິມຊື່ອຸປະກອນເອງ..."
                            className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                          />
                          {currentEquipInfo && (
                            <div className="pt-1">
                              {currentEquipInfo.isOutOfStock ? (
                                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                                  <span>ອຸປະກອນນີ້ໝົດຄັງແລ້ວ (ຍອດພ້ອມໃຫ້ເຊົ່າ: 0 ຊິ້ນ). ບໍ່ສາມາດເປີດບິນເຊົ່າໄດ້.</span>
                                </div>
                              ) : currentEquipInfo.isExceeded ? (
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                                  <span>ຈຳນວນທີ່ເຊົ່າ ({quantity} ຊິ້ນ) ເກີນຍອດພ້ອມໃຫ້ເຊົ່າໃນຄັງ (ຍັງເຫຼືອ {currentEquipInfo.availableQuantity} ຊິ້ນ).</span>
                                </div>
                              ) : (
                                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>ພ້ອມໃຫ້ເຊົ່າ: <strong className="text-emerald-300 font-bold">{currentEquipInfo.availableQuantity} ຊິ້ນ</strong></span>
                                  </span>
                                  <span className="text-zinc-500 text-[11px]">
                                    (ສ້ອມແປງ: {currentEquipInfo.equipment.maintenanceQuantity || 0} | ຖືກເຊົ່າ: {currentEquipInfo.equipment.rentedQuantity || 0})
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={itemName}
                          onChange={e => setItemName(e.target.value)}
                          required
                          placeholder="ຕົວຢ່າງ: Yonex Astrox 88D Pro"
                          className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                        />
                      )}
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ຈຳນວນ (Quantity) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={e => handleQuantityChange(e.target.value)}
                        required
                        min="1"
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Rental Period & Due Date (With Minutes Precision) */}
                <div className="border-t border-zinc-800/80 pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>3. ກຳນົດເວລາເຊົ່າ & ຫຼັກນາທີ (Rental Period)</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-1 text-[11px]">
                      <span className="text-zinc-500 mr-0.5">ໄລຍະເວລາ:</span>
                      <button
                        type="button"
                        onClick={() => setDueMinutesPreset(15)}
                        className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white font-semibold transition-colors"
                      >
                        +15 ນາທີ
                      </button>
                      <button
                        type="button"
                        onClick={() => setDueMinutesPreset(30)}
                        className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white font-semibold transition-colors"
                      >
                        +30 ນາທີ
                      </button>
                      <button
                        type="button"
                        onClick={() => setDueMinutesPreset(60)}
                        className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white font-semibold transition-colors"
                      >
                        +1 ຊົ່ວໂມງ
                      </button>
                      <button
                        type="button"
                        onClick={() => setDueMinutesPreset(120)}
                        className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white font-semibold transition-colors"
                      >
                        +2 ຊົ່ວໂມງ
                      </button>
                      <button
                        type="button"
                        onClick={() => setDueDatePreset(1)}
                        className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                      >
                        +1 ມື້
                      </button>
                      <button
                        type="button"
                        onClick={() => setDueDatePreset(3)}
                        className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                      >
                        +3 ມື້
                      </button>
                      <button
                        type="button"
                        onClick={() => setDueDatePreset(7)}
                        className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                      >
                        +7 ມື້
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-zinc-300">
                          ວັນທີ & ເວລາເລີ່ມເຊົ່າ (ຊົ່ວໂມງ:ນາທີ) <span className="text-red-400">*</span>
                        </label>
                        {rentDate && (
                          <span className="text-[11px] font-mono font-bold text-indigo-400">
                            {formatDateTimeLao(rentDate)}
                          </span>
                        )}
                      </div>
                      <input
                        type="datetime-local"
                        step="60"
                        value={rentDate}
                        onChange={e => setRentDate(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-zinc-300">
                          ວັນທີ & ເວລາກຳນົດສົ່ງຄືນ (ຊົ່ວໂມງ:ນາທີ) <span className="text-red-400">*</span>
                        </label>
                        {dueDate && (
                          <span className="text-[11px] font-mono font-bold text-emerald-400">
                            {formatDateTimeLao(dueDate)}
                          </span>
                        )}
                      </div>
                      <input
                        type="datetime-local"
                        step="60"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 font-bold font-mono"
                      />
                    </div>
                  </div>

                  {/* Live Rental Duration & Minute Adjuster Bar */}
                  {rentDate && dueDate && (() => {
                    const startMs = new Date(rentDate).getTime();
                    const endMs = new Date(dueDate).getTime();
                    const diffMs = Math.max(0, endMs - startMs);
                    const totalMins = Math.floor(diffMs / (1000 * 60));
                    const dDays = Math.floor(totalMins / (60 * 24));
                    const dHours = Math.floor((totalMins % (60 * 24)) / 60);
                    const dMins = totalMins % 60;

                    return (
                      <div className="mt-2.5 px-3 py-2 rounded-xl bg-zinc-950/90 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>ລວມໄລຍະເວລາເຊົ່າ:</span>
                          <strong className="text-indigo-300 font-mono">
                            {dDays > 0 ? `${dDays} ມື້ ` : ""}
                            {dHours > 0 ? `${dHours} ຊົ່ວໂມງ ` : ""}
                            {`${dMins} ນາທີ`}
                            {` (ລວມ ${totalMins.toLocaleString()} ນາທີ)`}
                          </strong>
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-zinc-500">ເພີ່ມນາທີຕໍ່ທ້າຍ:</span>
                          {[5, 10, 15, 30].map(addMin => (
                            <button
                              key={addMin}
                              type="button"
                              onClick={() => {
                                const curDue = dueDate ? new Date(dueDate) : new Date();
                                setDueDate(getLocalDateString(new Date(curDue.getTime() + addMin * 60 * 1000)));
                              }}
                              className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-indigo-600 text-zinc-300 hover:text-white font-mono transition-colors"
                            >
                              +{addMin}ນ
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 4. Pricing & Deposits */}
                <div className="border-t border-zinc-800/80 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5" />
                      <span>4. ຄ່າເຊົ່າ & ເງິນມັດຈຳ (Pricing & Deposit)</span>
                    </h3>
                    <span className="text-[11px] text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/25">
                      ຄ່າປັບໃໝ: 10,000 ₭ / ມື້
                    </span>
                  </div>

                  {/* Fines & Deposit Live Summary */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-between text-xs text-amber-300 mb-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>
                        <strong>ຄ່າປັບໃໝ & ມັດຈຳ:</strong> ເງິນມັດຈຳທີ່ວາງໄວ້ {Number(depositAmount || 0).toLocaleString()} ₭ | ຄ່າປັບໃໝກາຍກຳນົດ 10,000 ₭/ມື້ (ຫັກອອກຈາກມັດຈຳຕອນສົ່ງຄືນ)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ຄ່າເຊົ່າ (ກີບ / ₭) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={rentalFee}
                          onChange={e => setRentalFee(e.target.value)}
                          required
                          min="0"
                          placeholder="0"
                          className="w-full pl-3.5 pr-8 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-indigo-400 font-bold focus:outline-none focus:border-indigo-500"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">
                          ₭
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ເງິນມັດຈຳທີ່ຮັບ (ກີບ / ₭)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={e => setDepositAmount(e.target.value)}
                          min="0"
                          placeholder="0"
                          className="w-full pl-3.5 pr-8 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 font-bold focus:outline-none focus:border-indigo-500"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">
                          ₭
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ຊ່ອງທາງຊຳລະເງິນ
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 font-medium"
                      >
                        <option value="CASH">ເງິນສົດ (Cash)</option>
                        <option value="BCEL_ONE">BCEL One / QR</option>
                        <option value="TRANSFER">ໂອນເງິນຜ່ານທະນາຄານ (Bank Transfer)</option>
                        <option value="CARD">ບັດເຄຣດິດ / ເດບິດ (Credit/Debit Card)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ສະຖານະບິນ
                      </label>
                      <select
                        value={orderStatus}
                        onChange={e => setOrderStatus(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="ACTIVE">ກຳລັງເຊົ່າ (Active)</option>
                        <option value="OVERDUE">ກາຍກຳນົດ (Overdue)</option>
                        <option value="RETURNED">ສົ່ງຄືນແລ້ວ (Returned)</option>
                        <option value="CANCELLED">ຍົກເລີກ (Cancelled)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 lg:col-span-4">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ໝາຍເຫດ ຫຼື ຂໍ້ຕົກລົງພິເສດ
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        placeholder="ຕົວຢ່າງ: ລູກຄ້າວາງບັດປະຈຳຕົວໄວ້, ກວດເຊັກສະພາບກ່ອນມອບ..."
                        className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                  </div>
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
                form="rental-order-form"
                disabled={isSubmitting || (!isEditing && !!currentEquipInfo?.isOutOfStock) || (!isEditing && !!currentEquipInfo?.isExceeded)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isEditing ? "ບັນທຶກການແກ້ໄຂ" : "ເປີດບິນເຊົ່າອຸປະກອນ"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send to Fines & Deposit Modal (Overdue -> Fines Queue) ── */}
      {showSendToFinesModal && sendToFinesTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <BadgeAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">ສົ່ງຕໍ່ໄປຊ່ອງ ຄ່າປັບໃໝ & ມັດຈຳ</h2>
                  <p className="text-xs text-zinc-400">ກວດສອບການກາຍກຳນົດ ແລະ ບັນທຶກຍອດຄ່າປັບໃໝກ່ອນອອກໃບບິນ</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSendToFinesModal(false);
                  setSendToFinesTarget(null);
                }}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              
              {/* Rental Summary Card */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-semibold">ອຸປະກອນທີ່ເຊົ່າ</span>
                    <span className="text-sm font-bold text-white">{sendToFinesTarget.itemName} (x{sendToFinesTarget.quantity})</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    #RNT-{sendToFinesTarget.id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-zinc-300">
                  <div>ລູກຄ້າ: <strong className="text-white">{sendToFinesTarget.customerName}</strong></div>
                  <div>ເບີໂທ: <strong className="text-white">{sendToFinesTarget.customerPhone || "-"}</strong></div>
                  <div>ກຳນົດສົ່ງ: <strong className="text-white">{formatDateTimeLao(sendToFinesTarget.dueDate)}</strong></div>
                  <div>ສະຖານະປັດຈຸບັນ: <strong className="text-amber-400">ກາຍກຳນົດສົ່ງ</strong></div>
                </div>
              </div>

              {/* Overdue Duration Warning */}
              {(() => {
                const now = new Date();
                const overdueInfo = getOverdueDetails(sendToFinesTarget.dueDate, now);
                return (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-300 font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>ກາຍກຳນົດສົ່ງ: {overdueInfo.label}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
                        {overdueInfo.fineUnits} ຮອບໄລຍະປັບໃໝ
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-200/80">
                      ລະບົບຄິດໄລ່ຄ່າປັບໃໝແນະນຳອັດຕະໂນມັດ 10,000 ₭ ຕໍ່ຮອບມື້/ຊົ່ວໂມງທີ່ກາຍກຳນົດ. ທ່ານສາມາດປັບປ່ຽນຍອດຕົວຈິງໄດ້ດ້ານລຸ່ມ.
                    </p>
                  </div>
                );
              })()}

              {/* Fine Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>ຍອດຄ່າປັບໃໝ (ກີບ / LAK)</span>
                  <span className="text-[11px] text-zinc-500">ລະບຸກ່ອນສົ່ງຕໍ່ໄປຊ່ອງຄ່າປັບໃໝ</span>
                </label>
                <div className="relative">
                  <Banknote className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={sendToFinesAmount}
                    onChange={(e) => setSendToFinesAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-10 pr-12 py-2.5 text-white font-bold text-sm focus:border-amber-500 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-semibold">₭</span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: "0 ₭ (ຍົກເວັ້ນ)", val: 0 },
                    { label: "+10,000", add: 10000 },
                    { label: "+20,000", add: 20000 },
                    { label: "+50,000", add: 50000 },
                    { label: "+100,000", add: 100000 }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (p.val !== undefined) {
                          setSendToFinesAmount(String(p.val));
                        } else if (p.add !== undefined) {
                          const current = Number(sendToFinesAmount) || 0;
                          setSendToFinesAmount(String(current + p.add));
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settlement Preview */}
              {(() => {
                const fineVal = Number(sendToFinesAmount) || 0;
                const deposit = sendToFinesTarget.depositAmount || 0;
                const netRefund = deposit - fineVal;
                return (
                  <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>ເງິນມັດຈຳທີ່ລູກຄ້າວາງໄວ້:</span>
                      <strong className="text-white">{deposit.toLocaleString()} ₭</strong>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>ຫັກຄ່າປັບໃໝ:</span>
                      <strong>- {fineVal.toLocaleString()} ₭</strong>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-800 font-bold">
                      <span className="text-zinc-300">ຍອດປະເມີນຄືນມັດຈຳ:</span>
                      <span className={netRefund >= 0 ? "text-emerald-400 text-sm" : "text-rose-400 text-sm"}>
                        {netRefund >= 0
                          ? `${netRefund.toLocaleString()} ₭ (ຄືນລູກຄ້າ)`
                          : `ຕ້ອງເກັບເພີ່ມ ${Math.abs(netRefund).toLocaleString()} ₭`}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Notes Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">ໝາຍເຫດການປັບໃໝ</label>
                <textarea
                  rows={2}
                  value={sendToFinesNotes}
                  onChange={(e) => setSendToFinesNotes(e.target.value)}
                  placeholder="ລະບຸເຫດຜົນການປັບໃໝ ຫຼື ຂໍ້ຕົກລົງເພີ່ມເຕີມ..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSendToFinesModal(false);
                  setSendToFinesTarget(null);
                }}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={handleConfirmSendToFines}
                disabled={isProcessingFines}
                className="flex-[2] py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
              >
                {isProcessingFines ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeAlert className="w-4 h-4" />}
                <span>ຢືນຢັນສົ່ງໄປ ຄ່າປັບໃໝ & ມັດຈຳ</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Return & Settlement Modal ── */}
      {showReturnModal && returnTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Undo2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">ຮັບຄືນອຸປະກອນ & ສະສາງມັດຈຳ</h2>
                  <p className="text-xs text-zinc-400">ກວດສອບສະພາບ, ຄິດໄລ່ຄ່າປັບໃໝ ແລະ ຄືນເງິນມັດຈຳ</p>
                </div>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              
              {/* Rental Summary Card */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-semibold">ອຸປະກອນທີ່ເຊົ່າ</span>
                    <span className="text-sm font-bold text-white">{returnTarget.itemName} (x{returnTarget.quantity})</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    #RNT-{returnTarget.id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-zinc-300">
                  <div>ລູກຄ້າ: <strong className="text-white">{returnTarget.customerName}</strong></div>
                  <div>ເບີໂທ: <strong className="text-white">{returnTarget.customerPhone || "-"}</strong></div>
                  <div>ກຳນົດສົ່ງ: <strong className="text-white">{formatDateTimeLao(returnTarget.dueDate)}</strong></div>
                  <div>ເວລາສົ່ງຕົວຈິງ: <strong className="text-emerald-400">{formatDateTimeLao(new Date())}</strong></div>
                </div>
              </div>

              {/* Overdue Inspection Alert Block */}
              {(() => {
                const now = new Date();
                const overdueInfo = getOverdueDetails(returnTarget.dueDate, now);
                const isLate = returnTarget.status === "OVERDUE" || overdueInfo.isOverdue;
                const fineUnits = Math.max(1, overdueInfo.fineUnits || 1);
                const suggestedFine = isLate ? fineUnits * 10000 : 0;

                if (isLate) {
                  return (
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-rose-300 font-bold">
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                          <span>ອຸປະກອນນີ້ກາຍກຳນົດສົ່ງ ({overdueInfo.label || "ກາຍກຳນົດ"})!</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                          ກາຍກຳນົດ
                        </span>
                      </div>
                      <p className="text-zinc-300 text-[11px]">
                        ກຳນົດສົ່ງ: {formatDateTimeLao(returnTarget.dueDate)} • ສົ່ງຕົວຈິງ: {formatDateTimeLao(now)}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-rose-500/20">
                        <span className="text-zinc-400 text-[11px]">ຄິດໄລ່ຄ່າປັບໃໝ ({overdueInfo.shortLabel || `${fineUnits} ມື້`} • {fineUnits} x 10,000 ₭):</span>
                        <button
                          type="button"
                          onClick={() => setReturnFineInput(String(suggestedFine))}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1 active:scale-95"
                        >
                          <span>ໃສ່ຄ່າປັບ {suggestedFine.toLocaleString()} ₭</span>
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between text-emerald-300">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>ສົ່ງຄືນກົງຕາມກຳນົດເວລາ (ບໍ່ມີຄ່າປັບໃໝກາຍກຳນົດ)</span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono">0 ₭</span>
                    </div>
                  );
                }
              })()}

              {/* Settlement Calculator */}
              <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  ການຄິດໄລ່ເງິນມັດຈຳ & ຄ່າປັບໃໝ
                </div>

                {/* Deposit Held */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">ເງິນມັດຈຳທີ່ລູກຄ້າວາງໄວ້:</span>
                  <span className="font-bold text-white text-sm">
                    {returnTarget.depositAmount.toLocaleString()} ₭
                  </span>
                </div>

                {/* Fine Input */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-zinc-400">ຄ່າປັບໃໝ (ກາຍກຳນົດ / ຊຳລຸດ):</span>
                    <span className="text-[11px] text-rose-400 font-semibold">ປ້ອນ 0 ຖ້າບໍ່ມີ</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={returnFineInput}
                      onChange={e => setReturnFineInput(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold">
                      ₭
                    </span>
                  </div>
                </div>

                {/* Net Settlement Result */}
                <div className={`p-3 rounded-xl border flex justify-between items-center ${
                  returnSettlement.isNegative
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                }`}>
                  <div className="text-xs">
                    <span className="block font-bold">
                      {returnSettlement.isNegative ? "ລູກຄ້າຕ້ອງຈ່າຍເພີ່ມ (ຄ່າປັບໃໝເກີນມັດຈຳ):" : "ຍອດເງິນທີ່ຕ້ອງຄືນໃຫ້ລູກຄ້າ (Net Refund):"}
                    </span>
                    <span className="text-[10px] opacity-80">
                      ມັດຈຳ ({returnSettlement.deposit.toLocaleString()}) - ປັບໃໝ ({returnSettlement.fine.toLocaleString()})
                    </span>
                  </div>
                  <div className="text-lg font-black">
                    {returnSettlement.netRefund.toLocaleString()} ₭
                  </div>
                </div>
              </div>

              {/* Condition & Return Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  ບັນທຶກສະພາບອຸປະກອນຕອນສົ່ງຄືນ
                </label>
                <textarea
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ອຸປະກອນສະພາບສົມບູນ, ຄືນເງິນມັດຈຳຄົບຖ້ວນ..."
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Auto print return slip checkbox */}
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={autoPrintReturnSlip}
                  onChange={e => setAutoPrintReturnSlip(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-zinc-900 border-zinc-700"
                />
                <span className="font-medium">ພິມໃບບິນສົ່ງຄືນ & ຄ່າປັບໃໝ/ມັດຈຳ ທັນທີຫຼັງຢືນຢັນ</span>
              </label>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                disabled={isProcessingReturn}
                onClick={handleConfirmReturn}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5"
              >
                {isProcessingReturn && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>ຢືນຢັນການຮັບຄືນ & ສົ່ງມອບມັດຈຳ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fines & Deposit Ledger Detail Modal ── */}
      {showFinesModal && finesModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">ລາຍລະອຽດຄ່າປັບໃໝ & ເງິນມັດຈຳ</h2>
                  <p className="text-xs text-zinc-400">ກວດສອບສະຖານະການເງິນ ແລະ ຍອດມັດຈຳຖືຄອງ</p>
                </div>
              </div>
              <button
                onClick={() => setShowFinesModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Order Info */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-semibold">ອຸປະກອນ</span>
                    <span className="text-sm font-bold text-white">{finesModalOrder.itemName} (x{finesModalOrder.quantity})</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
                    #RNT-{finesModalOrder.id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-zinc-300">
                  <div>ລູກຄ້າ: <strong className="text-white">{finesModalOrder.customerName}</strong></div>
                  <div>ເບີໂທ: <strong className="text-white">{finesModalOrder.customerPhone || "-"}</strong></div>
                  <div>ວັນທີເຊົ່າ: <strong className="text-zinc-300">{formatDateTimeLao(finesModalOrder.rentDate)}</strong></div>
                  <div>ກຳນົດສົ່ງ: <strong className="text-zinc-300">{formatDateTimeLao(finesModalOrder.dueDate)}</strong></div>
                </div>
              </div>

              {/* Overdue Check */}
              {(() => {
                const refDate = finesModalOrder.returnDate ? new Date(finesModalOrder.returnDate) : new Date();
                const overdueInfo = getOverdueDetails(finesModalOrder.dueDate, refDate);
                const isLate = finesModalOrder.status === "OVERDUE" || (finesModalOrder.status !== "RETURNED" && overdueInfo.isOverdue);
                const fineUnits = Math.max(1, overdueInfo.fineUnits || 1);

                return isLate ? (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-1 text-rose-300">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>ກາຍກຳນົດສົ່ງ ({overdueInfo.label || "ກາຍກຳນົດ"})</span>
                      </span>
                      <span className="font-mono text-rose-200">
                        ປັບໃໝປະມານ: {(fineUnits * 10000).toLocaleString()} ₭
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      ອັດຕາຄິດໄລ່ຄ່າປັບໃໝມາດຕະຖານ: 10,000 ₭ / ມື້ (ລວມເສດຊົ່ວໂມງ-ນາທີ)
                    </p>
                  </div>
                ) : finesModalOrder.status === "RETURNED" ? (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between text-emerald-300">
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>ສົ່ງຄືນຮຽບຮ້ອຍແລ້ວ</span>
                    </span>
                    <span>{finesModalOrder.returnDate ? formatDateTimeLao(finesModalOrder.returnDate) : "-"}</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs flex items-center justify-between text-sky-300">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-4 h-4 text-sky-400" />
                      <span>ກຳລັງເຊົ່າ (ຍັງບໍ່ທັນຮອດກຳນົດ)</span>
                    </span>
                    <span>ກຳນົດ: {formatDateTimeLao(finesModalOrder.dueDate)}</span>
                  </div>
                );
              })()}

              {/* Financial Breakdown Table */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2.5 text-xs">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  ສະຫຼຸບບັນຊີເງິນມັດຈຳ & ຄ່າປັບໃໝ
                </div>
                <div className="flex justify-between items-center text-zinc-300">
                  <span>ຄ່າເຊົ່າທີ່ຊຳລະແລ້ວ:</span>
                  <strong className="text-white font-mono">{finesModalOrder.rentalFee.toLocaleString()} ₭</strong>
                </div>
                <div className="flex justify-between items-center text-zinc-300">
                  <span>ເງິນມັດຈຳປະກັນທີ່ວາງໄວ້:</span>
                  <strong className="text-amber-400 font-mono text-sm">{finesModalOrder.depositAmount.toLocaleString()} ₭</strong>
                </div>
                <div className="flex justify-between items-center text-zinc-300">
                  <span>ຄ່າປັບໃໝທີ່ບັນທຶກ:</span>
                  <strong className={`font-mono text-sm ${finesModalOrder.fineAmount > 0 ? "text-rose-400" : "text-zinc-500"}`}>
                    {finesModalOrder.fineAmount > 0 ? `-${finesModalOrder.fineAmount.toLocaleString()} ₭` : "0 ₭"}
                  </strong>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-800 font-bold text-emerald-400 text-sm">
                  <span>ຍອດເງິນມັດຈຳສຸດທິ (Net Deposit):</span>
                  <span className="font-mono text-base">
                    {Math.max(0, finesModalOrder.depositAmount - finesModalOrder.fineAmount).toLocaleString()} ₭
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowFinesModal(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                ປິດໜ້າຕ່າງ
              </button>
              {finesModalOrder.status !== "RETURNED" ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowFinesModal(false);
                    openReturnModal(finesModalOrder);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Undo2 className="w-4 h-4" />
                  <span>ຮັບຄືນ & ສະສາງມັດຈຳ</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowFinesModal(false);
                    openPrintDialog(finesModalOrder, "RETURN");
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>ພິມໃບບິນຄ່າປັບໃໝ & ມັດຈຳ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Live Camera & Barcode Scanner Modal ── */}
      <RentalCameraScannerModal
        isOpen={isBarcodeScanModalOpen}
        onClose={() => setIsBarcodeScanModalOpen(false)}
        onScanSuccess={(decodedText) => handleProcessScannedCode(decodedText)}
      />

      {/* ── Dual-Format Printable Rental Receipt Modal (ບິນນ້ອຍ 80mm vs ບິນໃຫຍ່ A4 & ບິນເຊົ່າ vs ບິນສົ່ງຄືນ) ── */}
      {showPrintModal && printOrder && (() => {
        const isOrderReturned = printOrder.status === "RETURNED" || Boolean(printOrder.returnDate);
        const returnDateObj = printOrder.returnDate ? new Date(printOrder.returnDate) : new Date();
        const overdueInfo = getOverdueDetails(printOrder.dueDate, returnDateObj);
        const overdueDays = overdueInfo.isOverdue ? Math.max(1, overdueInfo.fineUnits) : 0;
        const overdueLabel = overdueInfo.label || `${overdueDays} ມື້`;
        const effectiveFine = Number(printOrder.fineAmount) || 0;
        const effectiveDeposit = Number(printOrder.depositAmount) || 0;
        const netRefund = Math.max(0, effectiveDeposit - effectiveFine);
        const extraDue = Math.max(0, effectiveFine - effectiveDeposit);

        const effectiveStoreName = storeInfo.name || printOrder.organization?.name || "ຮ້ານຄ້າ";
        const effectiveStorePhone = storeInfo.phone || (printOrder.organization?.metadata as any)?.phone || "";
        const effectiveStoreAddress = storeInfo.address || (printOrder.organization?.metadata as any)?.address || "";
        const effectiveStoreLogo = storeInfo.logo || printOrder.organization?.logo || null;
        const barcodeCode = `RNT-${printOrder.id.slice(-6).toUpperCase()}`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
              
              {/* Header & Format/Type Switcher */}
              <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-950/80">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Printer className="w-4 h-4 text-indigo-400" />
                  <span>
                    {printType === "RETURN"
                      ? "ໃບບິນສົ່ງຄືນອຸປະກອນ & ສະສາງຄ່າປັບໃໝ/ມັດຈຳ"
                      : "ໃບບິນເຊົ່າອຸປະກອນ & ສັນຍາເຊົ່າ"}
                  </span>
                </div>

                {/* Print Type & Format Toggles */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Bill Type Toggle (Return Settlement vs Original Rental Bill) */}
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setPrintType("RETURN")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                        printType === "RETURN"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>ບິນສົ່ງຄືນ/ປັບໃໝ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintType("RENTAL")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                        printType === "RENTAL"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>ບິນເຊົ່າຕົ້ນສະບັບ</span>
                    </button>
                  </div>

                  {/* Format Toggle Buttons */}
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setPrintFormat("SLIP")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                        printFormat === "SLIP"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>80mm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintFormat("A4")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                        printFormat === "A4"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>A4</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Paper Content */}
              <div className="p-6 overflow-y-auto flex-1 bg-zinc-950/50 custom-scrollbar">
                
                {/* ── FORMAT 1: THERMAL SLIP 80MM ── */}
                {printFormat === "SLIP" ? (
                  printType === "RETURN" ? (
                    /* ── 80mm RETURN SETTLEMENT SLIP ── */
                    <div
                      id="printable-rental-slip"
                      className="bg-white text-zinc-950 rounded-2xl p-5 shadow-2xl border border-zinc-200 max-w-[320px] mx-auto text-xs font-mono space-y-3 leading-tight"
                    >
                      {/* Shop Header */}
                      <div className="text-center space-y-1 border-b border-dashed border-zinc-400 pb-3">
                        {effectiveStoreLogo ? (
                          <img src={effectiveStoreLogo} alt={effectiveStoreName} className="h-10 mx-auto object-contain mb-1" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-950 text-white font-black text-sm flex items-center justify-center mx-auto mb-1">
                            {effectiveStoreName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <h2 className="text-base font-black tracking-tight uppercase text-zinc-950">
                          {effectiveStoreName}
                        </h2>
                        {effectiveStorePhone && (
                          <p className="text-[10px] text-zinc-600 font-sans">
                            ໂທ: {effectiveStorePhone}
                          </p>
                        )}
                        {effectiveStoreAddress && (
                          <p className="text-[9px] text-zinc-500 font-sans leading-tight">
                            {effectiveStoreAddress}
                          </p>
                        )}
                        <div className="text-[11px] font-bold text-zinc-900 pt-1 uppercase border-t border-dotted border-zinc-300 mt-1">
                          ໃບບິນສົ່ງຄືນ & ສະສາງຄ່າປັບໃໝ/ມັດຈຳ
                        </div>
                        <div className="text-[9px] text-zinc-500 font-sans">
                          (RETURN & FINES SETTLEMENT SLIP)
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-300 pb-2">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">ເລກທີໃບຮັບຄືນ:</span>
                          <strong className="font-bold">#RET-{printOrder.id.slice(-6).toUpperCase()}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">ອ້າງອີງບິນເຊົ່າ:</span>
                          <strong className="font-bold">#{barcodeCode}</strong>
                        </div>
                        {printOrder.orderId && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">ອໍເດີ້ກາງ:</span>
                            <strong className="font-bold">#ORD-{printOrder.orderId.slice(-6).toUpperCase()}</strong>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-zinc-500">ວັນທີຮັບຄືນ:</span>
                          <span>
                            {printOrder.returnDate
                              ? formatDateTimeLao(printOrder.returnDate)
                              : formatDateTimeLao(new Date())}
                          </span>
                        </div>
                      </div>

                      {/* Customer */}
                      <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-300 pb-2">
                        <div>
                          <span className="text-zinc-500">ຜູ້ສົ່ງຄືນ: </span>
                          <strong className="text-zinc-950">{printOrder.customerName}</strong>
                        </div>
                        {printOrder.customerPhone && (
                          <div>
                            <span className="text-zinc-500">ເບີໂທ: </span>
                            <span>{printOrder.customerPhone}</span>
                          </div>
                        )}
                        {printOrder.customerIDCard && (
                          <div>
                            <span className="text-zinc-500">ເລກບັດ ID: </span>
                            <span>{printOrder.customerIDCard}</span>
                          </div>
                        )}
                      </div>

                      {/* Returned Equipment Item Details Card */}
                      <div className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-300 text-zinc-950 space-y-1.5 font-sans">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase font-bold block">ອຸປະກອນທີ່ສົ່ງຄືນ</span>
                            <span className="text-sm font-black text-zinc-950">{printOrder.itemName}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-black text-xs">
                            x{printOrder.quantity}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-zinc-200 text-[10px]">
                          <div>
                            <span className="text-zinc-500 block">ວັນທີເລີ່ມເຊົ່າ:</span>
                            <span className="font-semibold text-zinc-800">{formatDateTimeLao(printOrder.rentDate)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-zinc-500 block">ກຳນົດສົ່ງຄືນ:</span>
                            <span className="font-bold text-zinc-800">{formatDateTimeLao(printOrder.dueDate)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-zinc-200 text-[10px] font-bold">
                          <span className="text-zinc-600">ສະຖານະກຳນົດ:</span>
                          {overdueInfo.isOverdue ? (
                            <span className="text-rose-700 font-black">ກາຍກຳນົດ ({overdueLabel})</span>
                          ) : (
                            <span className="text-emerald-700 font-bold">ສົ່ງຕາມກຳນົດ (ປົກກະຕິ)</span>
                          )}
                        </div>
                      </div>

                      {/* Deposit & Fines Financial Settlement */}
                      <div className="space-y-1.5 pt-1 border-b border-dashed border-zinc-400 pb-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-600">ເງິນມັດຈຳທີ່ຮັບໄວ້:</span>
                          <span className="font-bold">+{effectiveDeposit.toLocaleString()} ₭</span>
                        </div>
                        <div className="flex justify-between text-xs text-rose-700">
                          <span>ຫັກຄ່າປັບໃໝ (Fines):</span>
                          <span className="font-bold">-{effectiveFine.toLocaleString()} ₭</span>
                        </div>
                        {effectiveFine > 0 && (
                          <div className="text-[9px] text-zinc-500 font-sans italic text-right">
                            {overdueInfo.isOverdue ? `(ຄິດໄລ່ກາຍກຳນົດ ${overdueLabel})` : `(ຄ່າປັບໃໝ/ຄ່າເສຍຫາຍ)`}
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-black pt-2 border-t border-zinc-400">
                          <span>{extraDue > 0 ? "ຍອດລູກຄ້າຊຳລະເພີ່ມ:" : "ຍອດມັດຈຳສົ່ງຄືນ:"}</span>
                          <span className={`text-base font-black ${extraDue > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                            {(extraDue > 0 ? extraDue : netRefund).toLocaleString()} ₭
                          </span>
                        </div>
                      </div>

                      {/* Dual Scannable Barcode & QR Code */}
                      <div className="pt-2 pb-1 border-b border-dashed border-zinc-400 text-center space-y-2">
                        <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-wide">
                          ລະຫັດກວດສອບບິນສົ່ງຄືນ
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <div className="bg-white p-1 rounded-lg border border-zinc-200">
                            <QRCodeSVG value={`RET-${printOrder.id.slice(-6).toUpperCase()}`} size={64} level="M" />
                          </div>
                          <div className="flex-1 max-w-[160px]">
                            {renderCode39SVG(`RET-${printOrder.id.slice(-6).toUpperCase()}`, 32)}
                            <div className="text-[10px] font-mono font-black tracking-widest text-zinc-900 mt-1">
                              *RET-{printOrder.id.slice(-6).toUpperCase()}*
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Return Notice */}
                      <div className="text-[9px] text-zinc-500 font-sans text-center leading-tight pt-1">
                        <p>ໄດ້ກວດກາອຸປະກອນ ແລະ ສະສາງເງິນມັດຈຳຮຽບຮ້ອຍແລ້ວ</p>
                        <p className="font-bold text-zinc-800 mt-1">ຂໍຂອບໃຈທີ່ໃຊ້ບໍລິການ {effectiveStoreName}!</p>
                      </div>

                      {/* Signatures */}
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-dashed border-zinc-400 text-center text-[10px] font-sans">
                        <div>
                          <div className="h-7 border-b border-dashed border-zinc-400 mx-2 mb-1" />
                          <span>ຜູ້ຮັບເງິນມັດຈຳຄືນ</span>
                        </div>
                        <div>
                          <div className="h-7 border-b border-dashed border-zinc-400 mx-2 mb-1" />
                          <span>ພະນັກງານ {effectiveStoreName}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── 80mm ORIGINAL RENTAL SLIP ── */
                    <div
                      id="printable-rental-slip"
                      className="bg-white text-zinc-950 rounded-2xl p-5 shadow-2xl border border-zinc-200 max-w-[320px] mx-auto text-xs font-mono space-y-3 leading-tight"
                    >
                      {/* Shop Header */}
                      <div className="text-center space-y-1 border-b border-dashed border-zinc-400 pb-3">
                        {effectiveStoreLogo ? (
                          <img src={effectiveStoreLogo} alt={effectiveStoreName} className="h-10 mx-auto object-contain mb-1" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-950 text-white font-black text-sm flex items-center justify-center mx-auto mb-1">
                            {effectiveStoreName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <h2 className="text-base font-black tracking-tight uppercase text-zinc-950">
                          {effectiveStoreName}
                        </h2>
                        {effectiveStorePhone && (
                          <p className="text-[10px] text-zinc-600 font-sans">
                            ໂທ: {effectiveStorePhone}
                          </p>
                        )}
                        {effectiveStoreAddress && (
                          <p className="text-[9px] text-zinc-500 font-sans leading-tight">
                            {effectiveStoreAddress}
                          </p>
                        )}
                        <div className="text-[11px] font-bold text-zinc-900 pt-1 uppercase border-t border-dotted border-zinc-300 mt-1">
                          ໃບບິນເຊົ່າອຸປະກອນ & ສັນຍາເຊົ່າ
                        </div>
                        <div className="text-[9px] text-zinc-500 font-sans">
                          (EQUIPMENT RENTAL RECEIPT)
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-300 pb-2">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">ເລກທີບິນ:</span>
                          <strong className="font-bold text-zinc-950">#{barcodeCode}</strong>
                        </div>
                        {printOrder.orderId && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">ອໍເດີ້ກາງ:</span>
                            <strong className="font-bold">#ORD-{printOrder.orderId.slice(-6).toUpperCase()}</strong>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-zinc-500">ວັນທີອອກບິນ:</span>
                          <span>{formatDateTimeLao(printOrder.createdAt || printOrder.rentDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">ວິທີຊຳລະ:</span>
                          <span className="font-semibold">{printOrder.paymentMethod || "CASH"}</span>
                        </div>
                      </div>

                      {/* Customer */}
                      <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-300 pb-2">
                        <div>
                          <span className="text-zinc-500">ຜູ້ເຊົ່າ: </span>
                          <strong className="text-zinc-950">{printOrder.customerName}</strong>
                        </div>
                        {printOrder.customerPhone && (
                          <div>
                            <span className="text-zinc-500">ເບີໂທ: </span>
                            <span>{printOrder.customerPhone}</span>
                          </div>
                        )}
                        {printOrder.customerIDCard && (
                          <div>
                            <span className="text-zinc-500">ເລກບັດ ID: </span>
                            <span>{printOrder.customerIDCard}</span>
                          </div>
                        )}
                      </div>

                      {/* Equipment Item Badge Card (Easy Return Inspection) */}
                      <div className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-300 text-zinc-950 space-y-1.5 font-sans">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase font-bold block">ອຸປະກອນທີ່ເຊົ່າ</span>
                            <span className="text-sm font-black text-zinc-950">{printOrder.itemName}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-black text-xs">
                            x{printOrder.quantity}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-zinc-200 text-[10px]">
                          <div>
                            <span className="text-zinc-500 block">ວັນທີເລີ່ມເຊົ່າ:</span>
                            <span className="font-semibold text-zinc-800">{formatDateTimeLao(printOrder.rentDate)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-rose-600 block font-bold">ກຳນົດສົ່ງຄືນ:</span>
                            <span className="font-black text-rose-700">{formatDateTimeLao(printOrder.dueDate)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Item Fees */}
                      <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-300 pb-2">
                        <div className="flex justify-between text-zinc-600">
                          <span>ຄ່າເຊົ່າອຸປະກອນ:</span>
                          <span className="font-bold text-zinc-900">{(printOrder.rentalFee || 0).toLocaleString()} ₭</span>
                        </div>
                        <div className="flex justify-between text-zinc-600">
                          <span>ເງິນມັດຈຳປະກັນ:</span>
                          <span className="font-bold text-zinc-900">{(printOrder.depositAmount || 0).toLocaleString()} ₭</span>
                        </div>
                      </div>

                      {/* Financial Total */}
                      <div className="space-y-1 pt-1 border-b border-dashed border-zinc-400 pb-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-600">ລວມຄ່າເຊົ່າ:</span>
                          <span>{(printOrder.rentalFee || 0).toLocaleString()} ₭</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-600">ມັດຈຳທີ່ຮັບແລ້ວ:</span>
                          <span>{(printOrder.depositAmount || 0).toLocaleString()} ₭</span>
                        </div>
                        <div className="flex justify-between text-sm font-black pt-1 border-t border-zinc-300">
                          <span>ຍອດຮັບຕົວຈິງ:</span>
                          <span className="font-black text-indigo-700">
                            {((printOrder.rentalFee || 0) + (printOrder.depositAmount || 0)).toLocaleString()} ₭
                          </span>
                        </div>
                      </div>

                      {/* Dual Scannable Barcode & QR Code Section */}
                      <div className="pt-2 pb-1 border-b border-dashed border-zinc-400 text-center space-y-2">
                        <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-wide">
                          ສະແກນລະຫັດນີ້ຕອນສົ່ງຄືນອຸປະກອນ
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <div className="bg-white p-1 rounded-lg border border-zinc-200">
                            <QRCodeSVG value={barcodeCode} size={64} level="M" />
                          </div>
                          <div className="flex-1 max-w-[160px]">
                            {renderCode39SVG(barcodeCode, 32)}
                            <div className="text-[10px] font-mono font-black tracking-widest text-zinc-900 mt-1">
                              *{barcodeCode}*
                            </div>
                          </div>
                        </div>
                        <div className="text-[9px] text-zinc-500 font-sans leading-tight">
                          ກະລຸນານຳໃບບິນນີ້ ຫຼື ຮູບຖ່າຍບິນ ມາຍື່ນສະແກນຕອນສົ່ງຄືນອຸປະກອນ
                        </div>
                      </div>

                      {/* Return Policy Notice */}
                      <div className="text-[9px] text-zinc-500 font-sans text-center leading-tight pt-1">
                        <p>ກະລຸນາສົ່ງຄືນຕາມກຳນົດເວລາເພື່ອຮັບເງິນມັດຈຳຄືນເຕັມຈຳນວນ</p>
                        <p>ຫາກສົ່ງກາຍກຳນົດມີຄ່າປັບໃໝຕາມອັດຕາຮ້ານ</p>
                        <p className="font-bold text-zinc-800 mt-1">ຂໍຂອບໃຈທີ່ໃຊ້ບໍລິການ {effectiveStoreName}!</p>
                      </div>

                      {/* Signatures */}
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-dashed border-zinc-400 text-center text-[10px] font-sans">
                        <div>
                          <div className="h-7 border-b border-dashed border-zinc-400 mx-2 mb-1" />
                          <span>ລາຍເຊັນຜູ້ເຊົ່າ</span>
                        </div>
                        <div>
                          <div className="h-7 border-b border-dashed border-zinc-400 mx-2 mb-1" />
                          <span>ພະນັກງານ {effectiveStoreName}</span>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  /* ── FORMAT 2: FORMAL A4 AGREEMENT & INVOICE ── */
                  printType === "RETURN" ? (
                    /* ── A4 FORMAL RETURN SETTLEMENT INVOICE ── */
                    <div
                      id="printable-rental-slip"
                      className="bg-white text-zinc-950 rounded-2xl p-8 shadow-2xl border border-zinc-200 max-w-2xl mx-auto space-y-6 font-sans text-xs"
                    >
                      {/* Formal Header */}
                      <div className="flex justify-between items-start border-b-2 border-zinc-950 pb-5">
                        <div className="flex items-center gap-3">
                          {effectiveStoreLogo ? (
                            <img src={effectiveStoreLogo} alt={effectiveStoreName} className="w-12 h-12 object-contain" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-base shrink-0">
                              {effectiveStoreName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h2 className="text-xl font-black tracking-tight uppercase text-zinc-950">
                              {effectiveStoreName}
                            </h2>
                            {effectiveStorePhone && (
                              <p className="text-[11px] text-zinc-600 font-medium">
                                ໂທ: {effectiveStorePhone}
                              </p>
                            )}
                            {effectiveStoreAddress && (
                              <p className="text-[10px] text-zinc-500 mt-0.5">
                                {effectiveStoreAddress}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="inline-block px-3 py-1 rounded bg-zinc-950 text-white text-xs font-mono font-bold">
                            #RET-{printOrder.id.slice(-6).toUpperCase()}
                          </div>
                          <div className="text-[11px] font-mono font-bold text-zinc-600">
                            ອ້າງອີງບິນເຊົ່າ: #{barcodeCode}
                          </div>
                          {printOrder.orderId && (
                            <div className="text-[11px] font-mono font-bold text-indigo-700">
                              ເລກທີອໍເດີ້: #ORD-{printOrder.orderId.slice(-6).toUpperCase()}
                            </div>
                          )}
                          <div className="text-[10px] text-zinc-500">
                            ວັນທີຮັບຄືນ: {printOrder.returnDate ? formatDateTimeLao(printOrder.returnDate) : formatDateTimeLao(new Date())}
                          </div>
                        </div>
                      </div>

                      {/* Title Banner */}
                      <div className="text-center py-2.5 bg-zinc-100 rounded-xl border border-zinc-200">
                        <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide">
                          ໃບຢັ້ງຢືນການສົ່ງຄືນອຸປະກອນ ແລະ ສະສາງເງິນມັດຈຳ (EQUIPMENT RETURN & SETTLEMENT INVOICE)
                        </h3>
                      </div>

                      {/* 2-Column Parties Info */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Shop Info */}
                        <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                            ຂໍ້ມູນຜູ້ກວດຮັບອຸປະກອນ (Receiver / Shop)
                          </span>
                          <div className="font-bold text-zinc-900 text-sm">{effectiveStoreName}</div>
                          {effectiveStorePhone && <div className="text-zinc-600 text-xs">ໂທ: {effectiveStorePhone}</div>}
                          <div className="text-zinc-600 text-xs">ສະຖານະ: ຮັບເຂົ້າຄັງສຳເລັດ</div>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                            ຂໍ້ມູນຜູ້ສົ່ງຄືນ (Returner / Customer)
                          </span>
                          <div className="font-bold text-zinc-900 text-sm">{printOrder.customerName}</div>
                          <div className="text-zinc-600 text-xs">ເບີໂທ: {printOrder.customerPhone || "-"}</div>
                          <div className="text-zinc-600 text-xs font-mono">ເລກບັດ ID: {printOrder.customerIDCard || "-"}</div>
                        </div>
                      </div>

                      {/* Returned Items Table */}
                      <div>
                        <table className="w-full text-xs text-left border-collapse border border-zinc-300">
                          <thead>
                            <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
                              <th className="py-2.5 px-3 border-r border-zinc-300 text-center w-12">ລ/ດ</th>
                              <th className="py-2.5 px-3 border-r border-zinc-300">ລາຍການອຸປະກອນ</th>
                              <th className="py-2.5 px-3 border-r border-zinc-300 text-center w-20">ຈຳນວນ</th>
                              <th className="py-2.5 px-3 border-r border-zinc-300 text-center">ໄລຍະເວລາເຊົ່າ</th>
                              <th className="py-2.5 px-3 border-r border-zinc-300 text-center">ວັນທີສົ່ງຄືນຕົວຈິງ</th>
                              <th className="py-2.5 px-3 text-center">ຜົນກວດສອບກຳນົດ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            <tr>
                              <td className="py-3 px-3 text-center border-r border-zinc-200 font-mono">1</td>
                              <td className="py-3 px-3 border-r border-zinc-200">
                                <div className="font-bold text-zinc-950">{printOrder.itemName}</div>
                                {printOrder.notes && (
                                  <div className="text-[10px] text-zinc-500 italic mt-0.5">ໝາຍເຫດ: {printOrder.notes}</div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center border-r border-zinc-200 font-bold">{printOrder.quantity}</td>
                              <td className="py-3 px-3 text-center border-r border-zinc-200 text-[11px]">
                                <div>{formatDateTimeLao(printOrder.rentDate)}</div>
                                <div className="text-zinc-500 font-semibold">ຮອດ {formatDateTimeLao(printOrder.dueDate)}</div>
                              </td>
                              <td className="py-3 px-3 text-center border-r border-zinc-200 text-[11px] font-bold">
                                {printOrder.returnDate ? formatDateTimeLao(printOrder.returnDate) : formatDateTimeLao(new Date())}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {overdueInfo.isOverdue ? (
                                  <span className="inline-block px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-black text-[11px]">
                                    ກາຍກຳນົດ ({overdueLabel})
                                  </span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                    ສົ່ງຄືນຕາມກຳນົດ
                                  </span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Financial Settlement Summary & Barcode Block */}
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center space-y-1.5">
                          <span className="text-[10px] font-bold text-zinc-600 block uppercase">ລະຫັດບາໂຄດບິນສົ່ງຄືນ</span>
                          <div className="flex justify-center items-center gap-3">
                            <QRCodeSVG value={`RET-${printOrder.id.slice(-6).toUpperCase()}`} size={56} level="M" />
                            <div className="max-w-[150px]">
                              {renderCode39SVG(`RET-${printOrder.id.slice(-6).toUpperCase()}`, 28)}
                              <div className="text-[9px] font-mono font-bold tracking-widest text-zinc-800 mt-0.5">
                                *RET-{printOrder.id.slice(-6).toUpperCase()}*
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2 text-xs">
                          <div className="flex justify-between text-zinc-600">
                            <span>ເງິນມັດຈຳທີ່ຮັບໄວ້ເບື້ອງຕົ້ນ:</span>
                            <strong className="text-zinc-900 font-mono">+{effectiveDeposit.toLocaleString()} ₭</strong>
                          </div>
                          <div className="flex justify-between text-rose-700">
                            <span>ຫັກຄ່າປັບໃໝ (ກາຍກຳນົດ/ຊຳລຸດ):</span>
                            <strong className="font-mono">-{effectiveFine.toLocaleString()} ₭</strong>
                          </div>
                          {overdueInfo.isOverdue && (
                            <div className="text-[10px] text-zinc-500 italic text-right">
                              ຄິດໄລ່ກາຍກຳນົດ {overdueLabel} (ອັດຕາຕາມລະບຽບຮ້ານ)
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t-2 border-zinc-900 font-black text-sm text-zinc-950">
                            <span>{extraDue > 0 ? "ຍອດເງິນທີ່ລູກຄ້າຕ້ອງຊຳລະເພີ່ມ:" : "ຍອດເງິນມັດຈຳສົ່ງຄືນລູກຄ້າ:"}</span>
                            <span className={`font-mono text-base ${extraDue > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                              {(extraDue > 0 ? extraDue : netRefund).toLocaleString()} ₭
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Return Acknowledgment */}
                      <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-[10px] text-zinc-600 space-y-1 leading-relaxed">
                        <div className="font-bold text-zinc-900 uppercase mb-1">
                          ຂໍ້ຄວາມຢັ້ງຢືນການຮັບຄືນ (Return Acknowledgment):
                        </div>
                        <p>1. ທາງຮ້ານໄດ້ກວດກາ ແລະ ຮັບຄືນອຸປະກອນຕາມລາຍການຂ້າງເທິງເຂົ້າສູ່ຄັງຮຽບຮ້ອຍແລ້ວ.</p>
                        <p>2. ທັງສອງຝ່າຍໄດ້ເຫັນດີນຳການສະສາງເງິນມັດຈຳ ແລະ ຄ່າປັບໃໝ (ຖ້າມີ) ຕາມຍອດທີ່ລະບຸໄວ້ຂ້າງເທິງຢ່າງຖືກຕ້ອງ.</p>
                        <p>3. ໃບຢັ້ງຢືນນີ້ຖືເປັນຫຼັກຖານການສິ້ນສຸດພັນທະສັນຍາເຊົ່າສຳລັບບິນສະບັບນີ້.</p>
                      </div>

                      {/* Signatures */}
                      <div className="grid grid-cols-2 gap-12 pt-6 text-center text-xs">
                        <div>
                          <div className="h-16 border-b border-zinc-400 mx-4 mb-2 flex items-end justify-center pb-1 text-zinc-400 italic">
                            (ລາຍເຊັນລູກຄ້າຜູ້ຮັບເງິນມັດຈຳຄືນ)
                          </div>
                          <div className="font-bold text-zinc-900">{printOrder.customerName}</div>
                          <div className="text-[10px] text-zinc-500">ຜູ້ສົ່ງຄືນອຸປະກອນ</div>
                        </div>
                        <div>
                          <div className="h-16 border-b border-zinc-400 mx-4 mb-2 flex items-end justify-center pb-1 text-zinc-400 italic">
                            (ລາຍເຊັນ ແລະ ກາປະທັບຮ້ານ)
                          </div>
                          <div className="font-bold text-zinc-900">{effectiveStoreName}</div>
                          <div className="text-[10px] text-zinc-500">ຜູ້ກວດຮັບອຸປະກອນ</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── A4 FORMAL RENTAL AGREEMENT ── */
                    <div
                      id="printable-rental-slip"
                      className="bg-white text-zinc-950 rounded-2xl p-8 shadow-2xl border border-zinc-200 max-w-2xl mx-auto space-y-6 font-sans text-xs"
                    >
                      {/* Formal Header */}
                      <div className="flex justify-between items-start border-b-2 border-zinc-950 pb-5">
                        <div className="flex items-center gap-3">
                          {effectiveStoreLogo ? (
                            <img src={effectiveStoreLogo} alt={effectiveStoreName} className="w-12 h-12 object-contain" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-base shrink-0">
                              {effectiveStoreName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h2 className="text-xl font-black tracking-tight uppercase text-zinc-950">
                              {effectiveStoreName}
                            </h2>
                            {effectiveStorePhone && (
                              <p className="text-[11px] text-zinc-600 font-medium">
                                ໂທ: {effectiveStorePhone}
                              </p>
                            )}
                            {effectiveStoreAddress && (
                              <p className="text-[10px] text-zinc-500 mt-0.5">
                                {effectiveStoreAddress}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="inline-block px-3 py-1 rounded bg-zinc-950 text-white text-xs font-mono font-bold">
                            #{barcodeCode}
                          </div>
                          {printOrder.orderId && (
                            <div className="text-[11px] font-mono font-bold text-indigo-700">
                              ເລກທີອໍເດີ້: #ORD-{printOrder.orderId.slice(-6).toUpperCase()}
                            </div>
                          )}
                          <div className="text-[10px] text-zinc-500">
                            ວັນທີ: {formatDateTimeLao(printOrder.createdAt || printOrder.rentDate)}
                          </div>
                        </div>
                      </div>

                      {/* Title Banner */}
                      <div className="text-center py-2 bg-zinc-100 rounded-xl border border-zinc-200">
                        <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide">
                          ສັນຍາເຊົ່າອຸປະກອນ ແລະ ໃບຮັບເງິນມັດຈຳ (RENTAL AGREEMENT & RECEIPT)
                        </h3>
                      </div>

                      {/* 2-Column Parties Info */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Lessor */}
                        <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                            ຂໍ້ມູນຜູ້ໃຫ້ເຊົ່າ (Lessor / Shop)
                          </span>
                          <div className="font-bold text-zinc-900 text-sm">{effectiveStoreName}</div>
                          {effectiveStorePhone && <div className="text-zinc-600 text-xs">ໂທ: {effectiveStorePhone}</div>}
                          <div className="text-zinc-600 text-xs">ຊ່ອງທາງຊຳລະ: {printOrder.paymentMethod || "CASH"}</div>
                        </div>

                        {/* Lessee */}
                        <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                            ຂໍ້ມູນຜູ້ເຊົ່າ (Lessee / Customer)
                          </span>
                          <div className="font-bold text-zinc-900 text-sm">{printOrder.customerName}</div>
                          <div className="text-zinc-600 text-xs">ເບີໂທ: {printOrder.customerPhone || "-"}</div>
                          <div className="text-zinc-600 text-xs font-mono">ເລກບັດ ID: {printOrder.customerIDCard || "-"}</div>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div>
                        <table className="w-full text-xs text-left border-collapse border border-zinc-300">
                          <thead>
                            <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
                              <th className="py-2.5 px-3 border-r border-zinc-300 text-center w-12">ລ/ດ</th>
                              <th className="py-2.5 px-3 border-r border-zinc-300">ລາຍການອຸປະກອນ</th>
                              <th className="py-2.5 px-3 border-r border-zinc-300 text-center w-20">ຈຳນວນ</th>
                              <th className="py-2.5 px-3 border-r border-zinc-300 text-center">ໄລຍະເວລາເຊົ່າ</th>
                              <th className="py-2.5 px-3 border-r border-zinc-300 text-right">ຄ່າເຊົ່າ</th>
                              <th className="py-2.5 px-3 text-right">ເງິນມັດຈຳ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            <tr>
                              <td className="py-3 px-3 text-center border-r border-zinc-200 font-mono">1</td>
                              <td className="py-3 px-3 border-r border-zinc-200">
                                <div className="font-bold text-zinc-950">{printOrder.itemName}</div>
                                {printOrder.notes && (
                                  <div className="text-[10px] text-zinc-500 italic mt-0.5">ໝາຍເຫດ: {printOrder.notes}</div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center border-r border-zinc-200 font-bold">{printOrder.quantity}</td>
                              <td className="py-3 px-3 text-center border-r border-zinc-200 text-[11px]">
                                <div>{formatDateTimeLao(printOrder.rentDate)}</div>
                                <div className="text-rose-700 font-bold">ຮອດ {formatDateTimeLao(printOrder.dueDate)}</div>
                              </td>
                              <td className="py-3 px-3 text-right border-r border-zinc-200 font-bold">
                                {(printOrder.rentalFee || 0).toLocaleString()} ₭
                              </td>
                              <td className="py-3 px-3 text-right font-bold">
                                {(printOrder.depositAmount || 0).toLocaleString()} ₭
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Financial Breakdown & Barcode Block */}
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center space-y-1.5">
                          <span className="text-[10px] font-bold text-zinc-600 block uppercase">ລະຫັດສະແກນບິນຕອນສົ່ງຄືນ (Scan for Return)</span>
                          <div className="flex justify-center items-center gap-3">
                            <QRCodeSVG value={barcodeCode} size={56} level="M" />
                            <div className="max-w-[150px]">
                              {renderCode39SVG(barcodeCode, 28)}
                              <div className="text-[9px] font-mono font-bold tracking-widest text-zinc-800 mt-0.5">
                                *{barcodeCode}*
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2 text-xs">
                          <div className="flex justify-between text-zinc-600">
                            <span>ຄ່າເຊົ່າລວມ:</span>
                            <strong className="text-zinc-900 font-mono">{(printOrder.rentalFee || 0).toLocaleString()} ₭</strong>
                          </div>
                          <div className="flex justify-between text-zinc-600">
                            <span>ເງິນມັດຈຳປະກັນ:</span>
                            <strong className="text-zinc-900 font-mono">{(printOrder.depositAmount || 0).toLocaleString()} ₭</strong>
                          </div>
                          <div className="flex justify-between text-zinc-600">
                            <span>ວິທີການຊຳລະ:</span>
                            <span className="font-semibold">{printOrder.paymentMethod || "CASH"}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t-2 border-zinc-900 font-black text-sm text-zinc-950">
                            <span>ຍອດເງິນທີ່ໄດ້ຮັບຕົວຈິງ:</span>
                            <span className="font-mono text-indigo-700">
                              {((printOrder.rentalFee || 0) + (printOrder.depositAmount || 0)).toLocaleString()} ₭
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Legal Terms & Conditions */}
                      <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-[10px] text-zinc-600 space-y-1 leading-relaxed">
                        <div className="font-bold text-zinc-900 uppercase mb-1">
                          ເງື່ອນໄຂ ແລະ ຂໍ້ກຳນົດສັນຍາເຊົ່າ (Terms & Conditions):
                        </div>
                        <p>1. ຜູ້ເຊົ່າໄດ້ກວດກາ ແລະ ຮັບອຸປະກອນໃນສະພາບສົມບູນ 100% ພ້ອມໃຊ້ງານ ແລະ ຕົກລົງຮັກສາອຸປະກອນຢ່າງດີ.</p>
                        <p>2. ຜູ້ເຊົ່າຕົກລົງສົ່ງຄືນອຸປະກອນຕາມວັນທີກຳນົດສົ່ງຄືນ. ຫາກສົ່ງກາຍກຳນົດ ຍິນຍອມໃຫ້ປັບໃໝຕາມອັດຕາທີ່ຮ້ານກຳນົດຕໍ່ມື້.</p>
                        <p>3. ກໍລະນີອຸປະກອນຊຳລຸດ, ເປ່ເພ ຫຼື ສູນຫາຍ ຜູ້ເຊົ່າຕ້ອງຮັບຜິດຊອບຄ່າສ້ອມແປງ ຫຼື ຊົດໃຊ້ຕາມມູນຄ່າສິນຄ້າຕົວຈິງ.</p>
                        <p>4. ເງິນມັດຈຳປະກັນຈະຖືກສົ່ງຄືນໃຫ້ແກ່ຜູ້ເຊົ່າຄົບຖ້ວນ ເມື່ອມີການກວດກາອຸປະກອນຕອນສົ່ງຄືນແລ້ວບໍ່ມີການຊຳລຸດເສຍຫາຍ.</p>
                      </div>

                      {/* Formal Signatures and Company Stamp */}
                      <div className="grid grid-cols-2 gap-12 pt-6 text-center text-xs">
                        <div>
                          <div className="h-16 border-b border-zinc-400 mx-4 mb-2 flex items-end justify-center pb-1 text-zinc-400 italic">
                            (ລາຍເຊັນລູກຄ້າ)
                          </div>
                          <div className="font-bold text-zinc-900">{printOrder.customerName}</div>
                          <div className="text-[10px] text-zinc-500">ຜູ້ເຊົ່າອຸປະກອນ</div>
                        </div>
                        <div>
                          <div className="h-16 border-b border-zinc-400 mx-4 mb-2 flex items-end justify-center pb-1 text-zinc-400 italic">
                            (ລາຍເຊັນ ແລະ ກາປະທັບຮ້ານ)
                          </div>
                          <div className="font-bold text-zinc-900">{effectiveStoreName}</div>
                          <div className="text-[10px] text-zinc-500">ຜູ້ຕາງໜ້າຮ້ານ / ຜູ້ໃຫ້ເຊົ່າ</div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex justify-between items-center gap-3">
                <span className="text-xs text-zinc-400 hidden sm:inline">
                  ປະເພດບິນ: <strong className="text-white">{printType === "RETURN" ? "ໃບບິນສົ່ງຄືນ & ຄ່າປັບໃໝ" : "ໃບບິນເຊົ່າອຸປະກອນ"}</strong> • ຮູບແບບ: <strong className="text-white">{printFormat === "SLIP" ? "ບິນນ້ອຍ 80mm" : "ບິນໃຫຍ່ A4"}</strong>
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
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{printFormat === "SLIP" ? "ພິມບິນນ້ອຍ (Print 80mm)" : "ພິມບິນໃຫຍ່ (Print A4)"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Global Print Styles ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-rental-slip,
          #printable-rental-slip * {
            visibility: visible !important;
          }
          #printable-rental-slip {
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
    </div>
  );
}
