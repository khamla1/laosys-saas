"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useMemo } from "react";
import {
  Map,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  Loader2,
  User,
  AlertCircle,
  Building2,
  Check,
  Sparkles,
  Phone,
  Eye,
  Printer,
  ZoomIn,
  X,
  Layers,
  Activity,
  ArrowRight,
  RefreshCw,
  LayoutGrid,
  List,
  CreditCard,
  Filter,
  CheckCircle,
  Clock3,
  Barcode,
  QrCode,
  FileText,
  Archive,
  Receipt,
  MapPin,
  ShieldCheck,
  Share2,
  Camera
} from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { CameraScannerModal } from "@/components/CameraScannerModal";
import {
  BillVerifyResultCard,
  BillVerifyResultData,
  formatTimeDiffLao,
  formatDateTimeLaoStandard,
} from "@/components/BillVerifyResultCard";

interface FacilityBooking {
  id: string;
  facilityName: string;
  customerName: string;
  startTime: string;
  endTime: string;
  status: string; // CONFIRMED, IN_USE, COMPLETED, CANCELLED
}

interface FacilityPreset {
  id: string;
  name: string;
  category: "FOOTBALL" | "BADMINTON" | "TENNIS" | "BASKETBALL" | "FITNESS" | "SNOOKER";
  categoryLabel: string;
  ratePerHour: number;
  image: string;
  description: string;
}

// Preset facilities catalog with sports photos
const FACILITY_PRESETS: FacilityPreset[] = [
  {
    id: "futsal-1",
    name: "ສະໜາມບານເຕະ VIP 1 (ຫຍ້າທຽມໃນຮົ່ມ 7 ຄົນ)",
    category: "FOOTBALL",
    categoryLabel: "ບານເຕະ / ຟຸດຊໍ",
    ratePerHour: 200000,
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80",
    description: "ສະໜາມຫຍ້າທຽມມາດຕະຖານ ມີໄຟສະປອດໄລ້ ແລະ ພັດລົມໄອເຢັນ",
  },
  {
    id: "futsal-2",
    name: "ສະໜາມບານເຕະ VIP 2 (ມາດຕະຖານ 7 ຄົນ)",
    category: "FOOTBALL",
    categoryLabel: "ບານເຕະ / ຟຸດຊໍ",
    ratePerHour: 250000,
    image: "https://images.unsplash.com/photo-1529900244933-72c219662fc4?w=800&auto=format&fit=crop&q=80",
    description: "ສະໜາມກວ້າງພິເສດ ຫຍ້າຄຸນນະພາບສູງ ພ້ອມອັດສະຈັນເຊຍ",
  },
  {
    id: "badminton-1",
    name: "ຄອດຕີດອກປີກໄກ່ Court A1 (ພື້ນຢາງມາດຕະຖານ)",
    category: "BADMINTON",
    categoryLabel: "ດອກປີກໄກ່",
    ratePerHour: 60000,
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80",
    description: "ພື້ນຢາງສັງເຄາະກັນກະແທກ ໄຟ LED ຖະໜອມສາຍຕາ",
  },
  {
    id: "badminton-2",
    name: "ຄອດຕີດອກປີກໄກ່ Court A2 (ພື້ນຢາງມາດຕະຖານ)",
    category: "BADMINTON",
    categoryLabel: "ດອກປີກໄກ່",
    ratePerHour: 60000,
    image: "https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=800&auto=format&fit=crop&q=80",
    description: "ພື້ນຢາງມາດຕະຖານ BWF ຕາໜ່າງຄຸນນະພາບສູງ",
  },
  {
    id: "badminton-vip",
    name: "ຄອດຕີດອກປີກໄກ່ Court B1 (VIP ມີແອ)",
    category: "BADMINTON",
    categoryLabel: "ດອກປີກໄກ່ VIP",
    ratePerHour: 80000,
    image: "https://images.unsplash.com/photo-1544919982-b61976f0ba43?w=800&auto=format&fit=crop&q=80",
    description: "ຫ້ອງປັບອາກາດເຢັນສະບາຍ ພ້ອມໂຊນພັກຜ່ອນສ່ວນຕົວ",
  },
  {
    id: "tennis-1",
    name: "ສະໜາມເທັນນິດ Hard Court 1 (ສະໜາມກາງແຈ້ງ)",
    category: "TENNIS",
    categoryLabel: "ເທັນນິດ",
    ratePerHour: 120000,
    image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&auto=format&fit=crop&q=80",
    description: "ພື້ນສີຟ້າມາດຕະຖານສາກົນ ຕີໄດ້ທັງກາງເວັນ ແລະ ກາງຄືນ",
  },
  {
    id: "basketball-1",
    name: "ສະໜາມບານບ້ວງ Indoor VIP (ມາດຕະຖານ FIBA)",
    category: "BASKETBALL",
    categoryLabel: "ບານບ້ວງ",
    ratePerHour: 150000,
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80",
    description: "ພື້ນໄມ້ປາເກ້ຢ່າງດີ ແປ້ນບານມາດຕະຖານແຂ່ງຂັນ",
  },
  {
    id: "fitness-1",
    name: "ຫ້ອງສະຕູດີໂອໂຢຄະ & ຟິດເນັດ (Studio 1)",
    category: "FITNESS",
    categoryLabel: "ຟິດເນັດ & ໂຢຄະ",
    ratePerHour: 100000,
    image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80",
    description: "ຫ້ອງແວ່ນຮອບດ້ານ ພ້ອມເຄື່ອງສຽງ Bluetooth ແລະ ເສື່ອໂຢຄະ",
  },
  {
    id: "snooker-1",
    name: "ຫ້ອງ VIP ປິ່ງປ່ອງ & ສະນຸກເກີ (Lounge)",
    category: "SNOOKER",
    categoryLabel: "ສະນຸກເກີ / ປິ່ງປ່ອງ",
    ratePerHour: 70000,
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80",
    description: "ໂຕະສະນຸກເກີຫີນແກຣນິດ ແລະ ໂຕະປິ່ງປ່ອງແຂ່ງຂັນ",
  },
];

const CATEGORIES = [
  { id: "ALL", label: "ທັງໝົດ" },
  { id: "FOOTBALL", label: "ບານເຕະ" },
  { id: "BADMINTON", label: "ດອກປີກໄກ່" },
  { id: "TENNIS", label: "ເທັນນິດ" },
  { id: "BASKETBALL", label: "ບານບ້ວງ" },
  { id: "FITNESS", label: "ຟິດເນັດ / ໂຢຄະ" },
  { id: "SNOOKER", label: "ສະນຸກເກີ" },
];

// Helper to resolve facility image from name
function getFacilityImage(facilityName: string): string {
  const lower = (facilityName || "").toLowerCase();
  if (lower.includes("ບານເຕະ") || lower.includes("football") || lower.includes("futsal") || lower.includes("ຫຍ້າ")) {
    return "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80";
  }
  if (lower.includes("ດອກປີກໄກ່") || lower.includes("badminton") || lower.includes("ຄອດ")) {
    return "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80";
  }
  if (lower.includes("ເທັນນິດ") || lower.includes("tennis")) {
    return "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&auto=format&fit=crop&q=80";
  }
  if (lower.includes("ບານບ້ວງ") || lower.includes("basketball")) {
    return "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80";
  }
  if (lower.includes("ໂຢຄະ") || lower.includes("ຟິດເນັດ") || lower.includes("fitness") || lower.includes("studio")) {
    return "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80";
  }
  if (lower.includes("ສະນຸກເກີ") || lower.includes("ປິ່ງປ່ອງ") || lower.includes("snooker")) {
    return "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80";
}

// Calculate duration in hours
function getDurationHours(startIso: string, endIso: string): number {
  try {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const diff = (end - start) / (1000 * 60 * 60);
    return Math.max(0.5, Math.round(diff * 10) / 10);
  } catch {
    return 1;
  }
}

// Extract hourly rate from facility string if present
function parseHourlyRate(facilityName: string): number {
  const match = facilityName.match(/₭\s*([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ""), 10) || 60000;
  }
  return 60000;
}

export default function FacilitiesBookPage() {
  const [bookings, setBookings] = useState<FacilityBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [courtSearch, setCourtSearch] = useState("");
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState<string | null>(null);
  const [mainView, setMainView] = useState<"OPERATIONS" | "ARCHIVE">("OPERATIONS");
  const [rightTab, setRightTab] = useState<"ACTIVE" | "FORM">("ACTIVE");
  const [activeStatusFilter, setActiveStatusFilter] = useState<"ALL" | "CONFIRMED" | "IN_USE">("ALL");
  const [archiveStatusFilter, setArchiveStatusFilter] = useState<"ALL" | "COMPLETED" | "CANCELLED">("COMPLETED");

  // Camera Scanner Modal State
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<"SEARCH" | "FORM_CUSTOMER" | "MODAL_CUSTOMER" | "COURT_SEARCH">("SEARCH");

  // Selected preset for fast booking
  const [selectedPreset, setSelectedPreset] = useState<FacilityPreset>(FACILITY_PRESETS[0]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FacilityBooking | null>(null);
  const [previewReceiptBooking, setPreviewReceiptBooking] = useState<FacilityBooking | null>(null);
  const [printFormat, setPrintFormat] = useState<"SLIP" | "A4">("SLIP");
  const [storeInfo, setStoreInfo] = useState<{
    name: string;
    logo?: string | null;
    phone?: string | null;
    address?: string | null;
    tagline?: string | null;
  }>({
    name: "ສະໜາມກິລາ & ຄອດມາດຕະຖານ",
    logo: null,
    phone: null,
    address: null,
    tagline: "Sports Complex & Facility Booking",
  });
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  // Form states
  const [facilityName, setFacilityName] = useState(
    `${FACILITY_PRESETS[0].name} · ₭${FACILITY_PRESETS[0].ratePerHour.toLocaleString()}/ຊມ`
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [startTime, setStartTime] = useState(
    new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [status, setStatus] = useState("CONFIRMED");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Standard Code 39 1D Barcode SVG renderer
  const renderCode39SVG = (text: string, height: number = 36) => {
    const code39Map: Record<string, string> = {
      "0": "101001101101", "1": "110100101011", "2": "101100101011",
      "3": "110110010101", "4": "101001101011", "5": "110100110101",
      "6": "101100110101", "7": "101001011011", "8": "110100101101",
      "9": "101100101101", "A": "110101001011", "B": "101101001011",
      "C": "110110100101", "D": "101011001011", "E": "110101100101",
      "F": "101101100101", "G": "101010011011", "H": "110101001101",
      "I": "101101001101", "J": "101011001101", "K": "110101010011",
      "L": "101101010011", "M": "110110101001", "N": "101011010011",
      "O": "110101101001", "P": "101101101001", "Q": "101010110011",
      "R": "110101011001", "S": "101101011001", "T": "101011011001",
      "U": "110010101011", "V": "100110101011", "W": "110011010101",
      "X": "100101101011", "Y": "110010110101", "Z": "100110110101",
      "-": "100101011011", ".": "110010101101", " ": "100110101101",
      "$": "100100100101", "/": "100100101001", "+": "100101001001",
      "%": "101001001001", "*": "100101101101"
    };

    const sanitized = ("*" + text.toUpperCase().replace(/[^0-9A-Z\-.$/+% ]/g, "") + "*").slice(0, 16);
    const bars: { isBlack: boolean; width: number }[] = [];

    for (let i = 0; i < sanitized.length; i++) {
      const char = sanitized[i];
      const pattern = code39Map[char] || code39Map["-"];
      for (let j = 0; j < pattern.length; j++) {
        bars.push({
          isBlack: pattern[j] === "1",
          width: pattern[j] === "1" ? 1.5 : 1.2
        });
      }
      bars.push({ isBlack: false, width: 2.0 });
    }

    let totalWidth = 0;
    bars.forEach(b => { totalWidth += b.width; });

    let curX = 0;
    return (
      <svg viewBox={`0 0 ${totalWidth} ${height}`} className="w-full max-w-[220px] h-9 mx-auto" preserveAspectRatio="none">
        {bars.map((b, idx) => {
          const x = curX;
          curX += b.width;
          if (!b.isBlack) return null;
          return <rect key={idx} x={x} y={0} width={b.width} height={height} fill="#000" />;
        })}
      </svg>
    );
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/dashboard/facilities");
      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data) ? data : data.items || [];
        setBookings(list);
        if (data && data.store) {
          setStoreInfo(data.store);
        }
      }
    } catch {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນການຈອງສະໜາມໄດ້");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedPresets = async () => {
    if (
      !(await askConfirm(
        "ທ່ານຕ້ອງການໃສ່ຂໍ້ມູນຕົວຢ່າງສະໜາມ ແລະ ຄອດ (8 ລາຍການ) ເຂົ້າໃນລະບົບຫຼືບໍ່?"
      ))
    ) {
      return;
    }

    setIsSeeding(true);
    try {
      const res = await fetch("/api/dashboard/facilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEED_PRESETS" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`ໃສ່ຂໍ້ມູນຕົວຢ່າງສະໜາມ ${data.count || 8} ລາຍການສຳເລັດແລ້ວ`);
        fetchBookings();
      } else {
        toast.error(data.error || "ເກີດຂໍ້ຜິດພາດໃນການໃສ່ຂໍ້ມູນຕົວຢ່າງ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ລູກຄ້າ");
    }
    if (!facilityName.trim()) {
      return toast.error("ກະລຸນາເລືອກ ຫຼື ປ້ອນຊື່ສະໜາມ");
    }

    setIsSubmitting(true);
    try {
      const fullCustomerString = customerPhone.trim()
        ? `${customerName.trim()} (${customerPhone.trim()})`
        : customerName.trim();

      const payload = {
        facilityName: facilityName.trim(),
        customerName: fullCustomerString,
        startTime,
        endTime,
        status,
      };

      const url = editingItem
        ? `/api/dashboard/facilities/${editingItem.id}`
        : "/api/dashboard/facilities";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(
          editingItem ? "ອັບເດດຂໍ້ມູນການຈອງສຳເລັດ" : "ເພີ່ມການຈອງສະໜາມໃໝ່ສຳເລັດ"
        );
        setShowAddModal(false);
        resetForm();
        fetchBookings();
        setRightTab("ACTIVE");
      } else {
        const err = await res.json();
        toast.error(err.error || "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (item: FacilityBooking, nextStatus: string) => {
    try {
      const res = await fetch(`/api/dashboard/facilities/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        const statusMap: Record<string, string> = {
          CONFIRMED: "ຢືນຢັນແລ້ວ",
          IN_USE: "ກຳລັງນຳໃຊ້ສະໜາມ",
          COMPLETED: "ສຳເລັດການໃຊ້ງານ",
          CANCELLED: "ຍົກເລີກການຈອງ",
        };
        toast.success(`ປ່ຽນສະຖານະເປັນ "${statusMap[nextStatus] || nextStatus}" ແລ້ວ`);
        fetchBookings();
      }
    } catch {
      toast.error("ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້");
    }
  };

  const handleConvertToOrder = async (item: FacilityBooking) => {
    const confirmed = await askConfirm(
      `ອອກບິນຂາຍ ແລະ ຍ້າຍຂໍ້ມູນການຈອງ "${item.facilityName}" ຂອງ "${item.customerName}" ໄປເກັບໃນປະຫວັດບິນສຳເລັດ?`,
      {
        title: "ຢືນຢັນການອອກບິນຊຳລະເງິນ (Sales Order)",
        subMessage: "ລະບົບຈະສ້າງບິນ Order ໃນສະຖານະຊຳລະແລ້ວ, ສະສົມແຕ້ມລູກຄ້າ ແລະ ຍ້າຍອອກຈາກຄິວດຳເນີນງານໄປເກັບໃນປະຫວັດເພື່ອບໍ່ໃຫ້ສັບສົນ.",
        confirmText: "ອອກບິນ ແລະ ຍ້າຍໄປປະຫວັດ",
        cancelText: "ຍົກເລີກ",
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/facilities/${item.id}/convert`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `ອອກບິນຂາຍສຳເລັດ! ຍ້າຍຂໍ້ມູນໄປເກັບໃນປະຫວັດແລ້ວ ₭${data.totalAmount?.toLocaleString()} (Order #${data.orderId.slice(-6).toUpperCase()})`
        );
        fetchBookings();
      } else {
        toast.error(data.error || "ອອກບິນບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !(await askConfirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຂໍ້ມູນການຈອງນີ້ອອກຈາກລະບົບ?"))
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/dashboard/facilities/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("ລຶບຂໍ້ມູນການຈອງສຳເລັດແລ້ວ");
        fetchBookings();
      }
    } catch {
      toast.error("ບໍ່ສາມາດລຶບຂໍ້ມູນໄດ້");
    }
  };

  const resetForm = () => {
    setSelectedPreset(FACILITY_PRESETS[0]);
    setFacilityName(`${FACILITY_PRESETS[0].name} · ₭${FACILITY_PRESETS[0].ratePerHour.toLocaleString()}/ຊມ`);
    setCustomerName("");
    setCustomerPhone("");
    setStartTime(new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));
    setEndTime(new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16));
    setStatus("CONFIRMED");
    setEditingItem(null);
  };

  const openEdit = (item: FacilityBooking) => {
    setEditingItem(item);
    setFacilityName(item.facilityName);

    // Extract phone if formatted "Name (020 xxxx)"
    const phoneMatch = item.customerName.match(/\((020\s*[\d\s]+)\)/);
    if (phoneMatch) {
      setCustomerPhone(phoneMatch[1]);
      setCustomerName(item.customerName.replace(/\((020\s*[\d\s]+)\)/, "").trim());
    } else {
      setCustomerName(item.customerName);
      setCustomerPhone("");
    }

    setStartTime(item.startTime.slice(0, 16));
    setEndTime(item.endTime.slice(0, 16));
    setStatus(item.status);
    setShowAddModal(true);
  };

  const handleQuickBookCourt = (preset: FacilityPreset) => {
    setSelectedPreset(preset);
    setFacilityName(`${preset.name} · ₭${preset.ratePerHour.toLocaleString()}/ຊມ`);
    setRightTab("FORM");
  };

  const handleFilterCourtQueue = (preset: FacilityPreset) => {
    const baseName = preset.name.split("(")[0].trim();
    if (selectedFacilityFilter === baseName) {
      setSelectedFacilityFilter(null);
    } else {
      setSelectedFacilityFilter(baseName);
      setRightTab("ACTIVE");
    }
  };

  const setQuickDuration = (hours: number) => {
    try {
      const start = new Date(startTime).getTime();
      const end = new Date(start + hours * 60 * 60 * 1000);
      setEndTime(end.toISOString().slice(0, 16));
    } catch {
      // fallback
    }
  };

  // Helper to determine live status of a court
  const getCourtLiveStatus = (preset: FacilityPreset) => {
    const baseName = preset.name.split("(")[0].trim();
    const courtBookings = bookings.filter((b) =>
      b.facilityName.toLowerCase().includes(baseName.toLowerCase())
    );

    const activeCount = courtBookings.filter(
      (b) => b.status === "CONFIRMED" || b.status === "IN_USE"
    ).length;

    const inUse = courtBookings.find((b) => b.status === "IN_USE");
    if (inUse) {
      return {
        status: "IN_USE",
        label: "ກຳລັງນຳໃຊ້",
        badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        dotClass: "bg-amber-400 animate-pulse",
        activeBooking: inUse,
        activeBookingsCount: activeCount,
        totalBookings: courtBookings.length,
      };
    }

    const upcoming = courtBookings.filter((b) => b.status === "CONFIRMED");
    if (upcoming.length > 0) {
      return {
        status: "CONFIRMED",
        label: `ມີ ${upcoming.length} ຄິວຈອງ`,
        badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        dotClass: "bg-blue-400",
        activeBooking: upcoming[0],
        activeBookingsCount: activeCount,
        totalBookings: courtBookings.length,
      };
    }

    return {
      status: "AVAILABLE",
      label: "ວ່າງພ້ອມໃຊ້",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      dotClass: "bg-emerald-400",
      activeBooking: null,
      activeBookingsCount: activeCount,
      totalBookings: courtBookings.length,
    };
  };

  // Filtered facility presets based on category and courtSearch
  const filteredPresets = useMemo(() => {
    return FACILITY_PRESETS.filter((p) => {
      const matchCat = categoryFilter === "ALL" || p.category === categoryFilter;
      const matchSearch =
        courtSearch === "" ||
        p.name.toLowerCase().includes(courtSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(courtSearch.toLowerCase()) ||
        p.categoryLabel.toLowerCase().includes(courtSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [categoryFilter, courtSearch]);

  // Active bookings (CONFIRMED or IN_USE)
  const activeBookings = useMemo(() => {
    return bookings.filter((b) => b.status === "CONFIRMED" || b.status === "IN_USE");
  }, [bookings]);

  // Archive bookings (COMPLETED or CANCELLED)
  const archiveBookings = useMemo(() => {
    return bookings.filter((b) => b.status === "COMPLETED" || b.status === "CANCELLED");
  }, [bookings]);

  const [inspectedBookingResult, setInspectedBookingResult] = useState<BillVerifyResultData | null>(null);

  const matchBookingBySearchTerm = (b: FacilityBooking, query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const cleanCode = q.replace(/^#/, "").replace(/^bkg-/, "");
    return (
      b.customerName.toLowerCase().includes(q) ||
      b.facilityName.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      (cleanCode.length >= 2 && b.id.toLowerCase().includes(cleanCode))
    );
  };

  // Filtered active bookings
  const filteredActiveBookings = useMemo(() => {
    return activeBookings.filter((b) => {
      const matchSearch = matchBookingBySearchTerm(b, search);
      const matchStatus =
        activeStatusFilter === "ALL" || b.status === activeStatusFilter;
      const matchFacility =
        !selectedFacilityFilter ||
        b.facilityName.toLowerCase().includes(selectedFacilityFilter.toLowerCase());
      return matchSearch && matchStatus && matchFacility;
    });
  }, [activeBookings, search, activeStatusFilter, selectedFacilityFilter]);

  // Filtered archive bookings
  const filteredArchiveBookings = useMemo(() => {
    return archiveBookings.filter((b) => {
      const matchSearch = matchBookingBySearchTerm(b, search);
      const matchStatus =
        archiveStatusFilter === "ALL" || b.status === archiveStatusFilter;
      const matchFacility =
        !selectedFacilityFilter ||
        b.facilityName.toLowerCase().includes(selectedFacilityFilter.toLowerCase());
      return matchSearch && matchStatus && matchFacility;
    });
  }, [archiveBookings, search, archiveStatusFilter, selectedFacilityFilter]);

  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const inUseCount = bookings.filter((b) => b.status === "IN_USE").length;
  const activeCount = confirmedCount + inUseCount;
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;
  const cancelledCount = bookings.filter((b) => b.status === "CANCELLED").length;
  const archivedCount = completedCount + cancelledCount;
  const totalCount = bookings.length;

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "IN_USE":
        return {
          label: "ກຳລັງນຳໃຊ້",
          badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          dotClass: "bg-amber-400 animate-pulse",
        };
      case "COMPLETED":
        return {
          label: "ສຳເລັດແລ້ວ",
          badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          dotClass: "bg-emerald-400",
        };
      case "CANCELLED":
        return {
          label: "ຍົກເລີກແລ້ວ",
          badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
          dotClass: "bg-red-400",
        };
      default:
        return {
          label: "ຢືນຢັນແລ້ວ",
          badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          dotClass: "bg-blue-400",
        };
    }
  };

  const buildBookingInspectionResult = (match: FacilityBooking): BillVerifyResultData => {
    const shortId = `#BKG-${match.id.slice(-6).toUpperCase()}`;
    const startDt = new Date(match.startTime);
    const endDt = new Date(match.endTime);
    const now = new Date();
    const durationHrs = getDurationHours(match.startTime, match.endTime);
    const hourlyRate = parseHourlyRate(match.facilityName);
    const estTotal = durationHrs * hourlyRate;

    if (match.status === "CANCELLED") {
      return {
        code: shortId,
        typeLabel: "ບິນຈອງສະໜາມກິລາ (Facility Booking)",
        status: "CANCELLED",
        statusTitle: "ໃບບິນຈອງນີ້ຖືກຍົກເລີກແລ້ວ (ຍົກເລີກການໃຊ້ງານ)",
        expiryMessage: `ບິນຈອງ ${shortId} (${match.facilityName}) ຖືກຍົກເລີກແລ້ວ ບໍ່ສາມາດນຳໃຊ້ສະໜາມໄດ້.`,
        customerName: match.customerName,
        itemName: match.facilityName,
        startDateFormatted: formatDateTimeLaoStandard(match.startTime),
        endDateFormatted: formatDateTimeLaoStandard(match.endTime),
        amountFormatted: `₭${estTotal.toLocaleString()}`,
        onViewReceipt: () => setPreviewReceiptBooking(match),
      };
    }

    if (match.status === "COMPLETED") {
      return {
        code: shortId,
        typeLabel: "ບິນຈອງສະໜາມກິລາ (Facility Booking)",
        status: "COMPLETED",
        statusTitle: "ບິນນີ້ໃຊ້ບໍລິການສຳເລັດ ແລະ ອອກບິນຊຳລະເງິນແລ້ວ",
        expiryMessage: `ການຈອງ ${shortId} ຂອງລູກຄ້າ "${match.customerName}" ອອກບິນສຳເລັດ ແລະ ປິດຮອບການໃຊ້ສະໜາມຮຽບຮ້ອຍແລ້ວ.`,
        customerName: match.customerName,
        itemName: match.facilityName,
        startDateFormatted: formatDateTimeLaoStandard(match.startTime),
        endDateFormatted: formatDateTimeLaoStandard(match.endTime),
        amountFormatted: `₭${estTotal.toLocaleString()}`,
        onViewReceipt: () => setPreviewReceiptBooking(match),
      };
    }

    const endDiff = formatTimeDiffLao(endDt, now);
    const startDiff = formatTimeDiffLao(startDt, now);

    if (endDiff.isPast) {
      return {
        code: shortId,
        typeLabel: "ບິນຈອງສະໜາມກິລາ (Facility Booking)",
        status: "EXPIRED",
        statusTitle: "ໃບບິນຈອງສະໜາມນີ້ໝົດອາຍຸ / ໝົດເວລາໃຊ້ສະໜາມແລ້ວ!",
        expiryMessage: `ໝົດເວລາຈອງມາແລ້ວ ${endDiff.text} (ກຳນົດສິ້ນສຸດ ${formatDateTimeLaoStandard(match.endTime)}) — ກະລຸນາອອກບິນຊຳລະເງິນ ຫຼື ຕໍ່ເວລາ.`,
        customerName: match.customerName,
        itemName: match.facilityName,
        startDateFormatted: formatDateTimeLaoStandard(match.startTime),
        endDateFormatted: formatDateTimeLaoStandard(match.endTime),
        amountFormatted: `₭${estTotal.toLocaleString()}`,
        extraBadgeText: `ກາຍເວລາ ${endDiff.text}`,
        onPrimaryAction: () => handleConvertToOrder(match),
        primaryActionLabel: "ອອກບິນຊຳລະເງິນທັນທີ",
        onViewReceipt: () => setPreviewReceiptBooking(match),
      };
    }

    if (now < startDt && match.status !== "IN_USE") {
      return {
        code: shortId,
        typeLabel: "ບິນຈອງສະໜາມກິລາ (Facility Booking)",
        status: "UPCOMING",
        statusTitle: "ຍັງບໍ່ໝົດອາຍຸ • ບິນຈອງລ່ວງໜ້າ (ພ້ອມເປີດໃຊ້ສະໜາມ)",
        expiryMessage: `ໃບບິນນີ້ຍັງໃຊ້ງານໄດ້ປົກກະຕິ — ອີກ ${startDiff.text} ຈະຮອດເວລາເລີ່ມຈອງ (ສິ້ນສຸດ ${formatDateTimeLaoStandard(match.endTime)}).`,
        customerName: match.customerName,
        itemName: match.facilityName,
        startDateFormatted: formatDateTimeLaoStandard(match.startTime),
        endDateFormatted: formatDateTimeLaoStandard(match.endTime),
        amountFormatted: `₭${estTotal.toLocaleString()}`,
        extraBadgeText: `ເລີ່ມໃນອີກ ${startDiff.text}`,
        onPrimaryAction: () => handleUpdateStatus(match, "IN_USE"),
        primaryActionLabel: "ເປີດໃຊ້ສະໜາມ (Check-in)",
        onViewReceipt: () => setPreviewReceiptBooking(match),
      };
    }

    return {
      code: shortId,
      typeLabel: "ບິນຈອງສະໜາມກິລາ (Facility Booking)",
      status: "VALID",
      statusTitle: "ຍັງບໍ່ໝົດອາຍຸ • ກຳລັງຢູ່ໃນເວລາໃຊ້ສະໜາມ",
      expiryMessage: `ຍັງເຫຼືອເວລາໃຊ້ສະໜາມອີກ ${endDiff.text} (ສິ້ນສຸດເວລາ ${formatDateTimeLaoStandard(match.endTime)}).`,
      customerName: match.customerName,
      itemName: match.facilityName,
      startDateFormatted: formatDateTimeLaoStandard(match.startTime),
      endDateFormatted: formatDateTimeLaoStandard(match.endTime),
      amountFormatted: `₭${estTotal.toLocaleString()}`,
      extraBadgeText: `ເຫຼືອເວລາ ${endDiff.text}`,
      onPrimaryAction:
        match.status === "CONFIRMED"
          ? () => handleUpdateStatus(match, "IN_USE")
          : () => handleConvertToOrder(match),
      primaryActionLabel:
        match.status === "CONFIRMED" ? "ເປີດໃຊ້ສະໜາມ (Check-in)" : "ອອກບິນຊຳລະເງິນ",
      onViewReceipt: () => setPreviewReceiptBooking(match),
    };
  };

  const handleInspectBookingByQuery = (rawQuery: string) => {
    const raw = rawQuery.trim();
    if (!raw) return;

    let match: FacilityBooking | undefined;

    if (raw.startsWith("BKG:")) {
      const parts = raw.split(":");
      const bkgId = parts[1] || "";
      const custName = parts[2] || "";
      match = bookings.find(
        (b) =>
          b.id === bkgId ||
          (bkgId && b.id.toLowerCase().includes(bkgId.toLowerCase())) ||
          (custName && b.customerName.toLowerCase().includes(custName.toLowerCase()))
      );
    }

    if (!match) {
      const cleanBarcode = raw.replace(/^#/, "").toUpperCase();
      if (cleanBarcode.startsWith("BKG-")) {
        const suffix = cleanBarcode.replace("BKG-", "");
        match = bookings.find(
          (b) =>
            b.id.toUpperCase().endsWith(suffix) ||
            b.id.toUpperCase().includes(suffix)
        );
      }
    }

    if (!match) {
      match = bookings.find((b) => matchBookingBySearchTerm(b, raw));
    }

    if (match) {
      if (match.status === "COMPLETED" || match.status === "CANCELLED") {
        setMainView("ARCHIVE");
        setArchiveStatusFilter("ALL");
      } else {
        setMainView("OPERATIONS");
        setRightTab("ACTIVE");
        setActiveStatusFilter("ALL");
      }
      setSelectedFacilityFilter(null);
      setSearch(match.customerName || match.id);
      const result = buildBookingInspectionResult(match);
      setInspectedBookingResult(result);
      if (result.status === "EXPIRED") {
        toast.error(`${result.statusTitle} (${result.code})`);
      } else if (result.status === "VALID" || result.status === "UPCOMING") {
        toast.success(`${result.statusTitle} (${result.code})`);
      } else {
        toast.info(`${result.statusTitle} (${result.code})`);
      }
    } else {
      setSearch(raw);
      setInspectedBookingResult({
        code: raw.toUpperCase(),
        typeLabel: "ບິນຈອງສະໜາມກິລາ (Facility Booking)",
        status: "NOT_FOUND",
        statusTitle: "ບໍ່ພົບລະຫັດບິນຈອງສະໜາມນີ້ໃນລະບົບ",
        expiryMessage: `ບໍ່ພົບຂໍ້ມູນບິນຈອງສະໜາມທີ່ກົງກັບລະຫັດ "${raw}" — ກະລຸນາກວດສອບລະຫັດບິນອີກຄັ້ງ.`,
      });
      toast.error(`ບໍ່ພົບລະຫັດບິນຈອງ: "${raw}"`);
    }
  };

  const handleScanSuccess = (code: string) => {
    const raw = code.trim();
    if (!raw) return;

    if (scannerTarget === "FORM_CUSTOMER" || scannerTarget === "MODAL_CUSTOMER") {
      let resolvedName = raw;
      if (raw.startsWith("BKG:")) {
        const parts = raw.split(":");
        if (parts[2]) resolvedName = parts[2].trim();
      }
      setCustomerName(resolvedName);
      toast.success(`ສະແກນຂໍ້ມູນລູກຄ້າສຳເລັດ: ${resolvedName}`);
      setIsCameraScannerOpen(false);
      return;
    }

    if (scannerTarget === "COURT_SEARCH") {
      setCourtSearch(raw);
      toast.success(`ຄົ້ນຫາສະໜາມ: ${raw}`);
      setIsCameraScannerOpen(false);
      return;
    }

    handleInspectBookingByQuery(raw);
    setIsCameraScannerOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* -- Header & Quick Action Bar -- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-900/60 p-4 sm:p-5 rounded-3xl border border-zinc-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 shadow-xl shadow-emerald-500/20 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                ຈັດການສະໜາມ ແລະ ຄອດກິລາ
              </h1>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Split Screen 2 ສ່ວນ
              </span>
            </div>
            <p className="text-zinc-400 mt-0.5 text-xs">
              ເລືອກເບິ່ງສະໜາມພ້ອມສະຖານະ Live ຢູ່ເບື້ອງຊ້າຍ ແລະ ຈັດການຄິວຈອງ ຫຼື ຈອງດ່ວນຢູ່ເບື້ອງຂວາ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          <button
            onClick={handleSeedPresets}
            disabled={isSeeding}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-zinc-800/90 hover:bg-zinc-700/90 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
            title="ໃສ່ຂໍ້ມູນຕົວຢ່າງສະໜາມ 8 ລາຍການ"
          >
            {isSeeding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>ໃສ່ຕົວຢ່າງ 1-Click</span>
          </button>

          <button
            onClick={fetchBookings}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 rounded-xl transition-colors"
            title="ຣີເຟຣຊຂໍ້ມູນ"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setScannerTarget("SEARCH");
              setIsCameraScannerOpen(true);
            }}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 active:scale-95"
            title="ເປີດກ້ອງສະແກນ QR Code ຫຼື ບາໂຄດ (Camera Scanner)"
          >
            <Camera className="w-4 h-4" />
            <span>ກ້ອງສະແກນ</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setRightTab("FORM");
            }}
            className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold transition-all duration-200 shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ ຈອງສະໜາມໃໝ່</span>
          </button>
        </div>
      </div>

      {/* -- KPI Summary Stats (Compact Strip) -- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div
          onClick={() => {
            setMainView("OPERATIONS");
            setRightTab("ACTIVE");
            setActiveStatusFilter("ALL");
            setSelectedFacilityFilter(null);
          }}
          className={`cursor-pointer bg-zinc-900/80 border rounded-2xl p-3 sm:p-3.5 backdrop-blur-xl transition-all duration-200 ${
            mainView === "OPERATIONS" && rightTab === "ACTIVE" && activeStatusFilter === "ALL" && !selectedFacilityFilter
              ? "border-emerald-500/60 ring-2 ring-emerald-500/20"
              : "border-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                ຄິວດຳເນີນງານ
              </p>
              <h3 className="text-lg sm:text-2xl font-black text-white mt-0.5">
                {activeCount} <span className="text-[11px] font-normal text-zinc-500">ຄິວ</span>
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            setMainView("OPERATIONS");
            setRightTab("ACTIVE");
            setActiveStatusFilter("CONFIRMED");
            setSelectedFacilityFilter(null);
          }}
          className={`cursor-pointer bg-zinc-900/80 border rounded-2xl p-3 sm:p-3.5 backdrop-blur-xl transition-all duration-200 ${
            mainView === "OPERATIONS" && rightTab === "ACTIVE" && activeStatusFilter === "CONFIRMED"
              ? "border-blue-500/60 ring-2 ring-blue-500/20"
              : "border-zinc-800/80 hover:border-blue-500/30"
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                ລໍຖ້າໃຊ້ງານ
              </p>
              <h3 className="text-lg sm:text-2xl font-black text-blue-400 mt-0.5">
                {confirmedCount} <span className="text-[11px] font-normal text-zinc-500">ຄິວ</span>
              </h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            setMainView("OPERATIONS");
            setRightTab("ACTIVE");
            setActiveStatusFilter("IN_USE");
            setSelectedFacilityFilter(null);
          }}
          className={`cursor-pointer bg-zinc-900/80 border rounded-2xl p-3 sm:p-3.5 backdrop-blur-xl transition-all duration-200 ${
            mainView === "OPERATIONS" && rightTab === "ACTIVE" && activeStatusFilter === "IN_USE"
              ? "border-amber-500/60 ring-2 ring-amber-500/20"
              : "border-zinc-800/80 hover:border-amber-500/30"
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                ກຳລັງນຳໃຊ້
              </p>
              <h3 className="text-lg sm:text-2xl font-black text-amber-400 mt-0.5">
                {inUseCount} <span className="text-[11px] font-normal text-zinc-500">ສະໜາມ</span>
              </h3>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            setMainView("ARCHIVE");
            setArchiveStatusFilter("COMPLETED");
            setSelectedFacilityFilter(null);
          }}
          className={`cursor-pointer bg-zinc-900/80 border rounded-2xl p-3 sm:p-3.5 backdrop-blur-xl transition-all duration-200 ${
            mainView === "ARCHIVE" && archiveStatusFilter === "COMPLETED"
              ? "border-blue-500/60 ring-2 ring-blue-500/20"
              : "border-zinc-800/80 hover:border-blue-500/30"
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                ປະຫວັດອອກບິນແລ້ວ
              </p>
              <h3 className="text-lg sm:text-2xl font-black text-blue-400 mt-0.5">
                {completedCount} <span className="text-[11px] font-normal text-zinc-500">ບິນ</span>
              </h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* -- Top View Navigation Bar: Separate Operations from Archive -- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-1.5 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            onClick={() => {
              setMainView("OPERATIONS");
              setRightTab("ACTIVE");
            }}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              mainView === "OPERATIONS"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>ຈັດການສະໜາມ & ຄິວດຳເນີນງານ (Live Queue)</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => {
              setMainView("ARCHIVE");
              setArchiveStatusFilter("COMPLETED");
              setSelectedFacilityFilter(null);
            }}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              mainView === "ARCHIVE"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>ປະຫວັດອອກບິນແລ້ວ (Billed History)</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
              {completedCount}
            </span>
          </button>
        </div>

        {mainView === "ARCHIVE" ? (
          <button
            onClick={() => setMainView("OPERATIONS")}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>← ກັບຄືນໜ້າສະໜາມ & ຄິວດຳເນີນງານ</span>
          </button>
        ) : (
          <Link
            href="/dashboard/orders"
            className="px-3.5 py-2 bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>ເບິ່ງບິນໃນ Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* -- Scanned / Searched Bill Expiry & Status Verification Banner -- */}
      {(inspectedBookingResult ||
        (search.trim().length >= 3 &&
          bookings.filter((b) => matchBookingBySearchTerm(b, search)).length === 1)) && (
        <BillVerifyResultCard
          data={
            inspectedBookingResult ||
            buildBookingInspectionResult(
              bookings.filter((b) => matchBookingBySearchTerm(b, search))[0]
            )
          }
          onClose={() => {
            setInspectedBookingResult(null);
            setSearch("");
          }}
        />
      )}

      {/* ============================================================ */}
      {/* -- DEDICATED TOP-LEVEL ARCHIVE & BILLED HISTORY VIEW -- */}
      {/* ============================================================ */}
      {mainView === "ARCHIVE" ? (
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-3xl p-4 sm:p-6 backdrop-blur-xl shadow-xl space-y-5">
          {/* Info Banner with link to Orders */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="text-sm font-bold text-blue-200">
                  ປະຫວັດການອອກບິນ & ສຳເລັດແລ້ວ (Billed & Completed History)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold">
                  {completedCount} ບິນ
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                ລາຍການຈອງທີ່ອອກບິນແລ້ວ ຖືກຍ້າຍມາເກັບແຍກໄວ້ບ່ອນນີ້ ແລະ ບັນທຶກລາຍຮັບເຂົ້າລະບົບ Orders ອັດຕະໂນມັດ ບໍ່ປົນກັບຄິວດຳເນີນງານ
              </p>
            </div>
            <Link
              href="/dashboard/orders"
              className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all shrink-0"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>ເບິ່ງໃນ Orders ທັງໝົດ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="ພິມລະຫັດບິນ #BKG-..., ຊື່ລູກຄ້າ ຫຼື ສະແກນ QR..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (!e.target.value.trim()) setInspectedBookingResult(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && search.trim()) {
                    e.preventDefault();
                    handleInspectBookingByQuery(search);
                  }
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  setScannerTarget("SEARCH");
                  setIsCameraScannerOpen(true);
                }}
                className="absolute right-2.5 text-zinc-400 hover:text-blue-400 p-1.5 rounded-md transition-colors"
                title="ສະແກນ QR ບິນ ຫຼື ບາໂຄດ"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
              {[
                { label: "ອອກບິນແລ້ວ", value: "COMPLETED", count: completedCount },
                { label: "ຍົກເລີກແລ້ວ", value: "CANCELLED", count: cancelledCount },
                { label: "ທັງໝົດໃນປະຫວັດ", value: "ALL", count: archivedCount },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setArchiveStatusFilter(tab.value as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    archiveStatusFilter === tab.value
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                      : "bg-zinc-950/80 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] opacity-80">({tab.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Court Filter Active Badge */}
          {selectedFacilityFilter && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs">
              <span className="text-blue-400 font-semibold truncate">
                ສະແດງປະຫວັດສະເພາະ: {selectedFacilityFilter}
              </span>
              <button
                onClick={() => setSelectedFacilityFilter(null)}
                className="text-zinc-400 hover:text-white ml-2 shrink-0 p-0.5 rounded hover:bg-blue-500/20"
                title="ລຶບການກັ່ນຕອງ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Archive Cards Grid (Wide Multi-Column on Desktop) */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
                <p className="text-zinc-400 text-sm">ກຳລັງໂຫຼດປະຫວັດການອອກບິນ...</p>
              </div>
            ) : filteredArchiveBookings.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/60 space-y-2">
                <Archive className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                <p className="text-base font-bold text-white">ບໍ່ມີລາຍການໃນປະຫວັດ</p>
                <p className="text-xs text-zinc-500">
                  {search || selectedFacilityFilter
                    ? "ບໍ່ພົບຂໍ້ມູນທີ່ກົງກັບເງື່ອນໄຂຄົ້ນຫາ"
                    : "ຍັງບໍ່ມີລາຍການທີ່ອອກບິນ ຫຼື ສຳເລັດແລ້ວ"}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setMainView("OPERATIONS")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-md"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>ກັບຄືນໜ້າສະໜາມ & ຄິວດຳເນີນງານ</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArchiveBookings.map((booking) => {
                  const badge = getStatusBadge(booking.status);
                  const durationHrs = getDurationHours(booking.startTime, booking.endTime);
                  const hourlyRate = parseHourlyRate(booking.facilityName);
                  const estTotal = durationHrs * hourlyRate;

                  return (
                    <div
                      key={booking.id}
                      className="bg-zinc-950/90 border border-zinc-800/90 hover:border-zinc-700 rounded-2xl p-4 space-y-3 transition-all shadow-md hover:shadow-lg"
                    >
                      {/* Top: Facility name + Status badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate" title={booking.facilityName}>
                            {booking.facilityName}
                          </h4>
                          <p className="text-[11px] font-mono text-zinc-500">
                            ID: #{booking.id.slice(-6).toUpperCase()}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${badge.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      {/* Customer & Time Info */}
                      <div className="p-3 bg-zinc-900/90 rounded-xl space-y-2 text-xs border border-zinc-850">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold truncate">
                            <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{booking.customerName}</span>
                          </div>
                          <span className="text-xs font-extrabold text-emerald-400 shrink-0 font-mono">
                            ₭{estTotal.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-1.5 border-t border-zinc-800">
                          <Calendar className="w-3 h-3 text-blue-400 shrink-0" />
                          <span>
                            {new Date(booking.startTime).toLocaleDateString("lo-LA", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          <span className="text-zinc-600">·</span>
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="font-mono">
                            {booking.startTime.replace("T", " ").slice(11, 16)} -{" "}
                            {booking.endTime.replace("T", " ").slice(11, 16)}
                          </span>
                          <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                            {durationHrs} ຊມ
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions Bar */}
                      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-zinc-800/60">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {booking.status === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                              <Check className="w-3 h-3" />
                              <span>ອອກບິນແລ້ວ</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-[11px] font-bold">
                              <X className="w-3 h-3" />
                              <span>ຍົກເລີກ</span>
                            </span>
                          )}

                          <button
                            onClick={() => setPreviewReceiptBooking(booking)}
                            className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                            title="ເບິ່ງໃບບິນການຈອງ"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>ເບິ່ງບິນ</span>
                          </button>

                          <button
                            onClick={() => setPreviewReceiptBooking(booking)}
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                            title="ພິມໃບບິນຄືນ (Reprint)"
                          >
                            <Printer className="w-3 h-3" />
                            <span>ພິມບິນ</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => openEdit(booking)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            title="ແກ້ໄຂ"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="ລຶບອອກຈາກປະຫວັດ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        {/* ========================================================= */}
        {/* -- PART 1: LEFT SIDE (7 Cols) - COURTS CATALOG & LIVE STATUS -- */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-3xl p-4 sm:p-5 backdrop-blur-xl space-y-4">
            {/* Catalog Top bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm sm:text-base font-bold text-white">
                  ລາຍການສະໜາມ ແລະ ຄອດ (Courts Catalog)
                </h2>
                <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">
                  {filteredPresets.length} ສະໜາມ
                </span>
              </div>

              {/* Court Search input */}
              <div className="relative w-full sm:w-64 flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="ຄົ້ນຫາຊື່ສະໜາມ..."
                  value={courtSearch}
                  onChange={(e) => setCourtSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    setScannerTarget("COURT_SEARCH");
                    setIsCameraScannerOpen(true);
                  }}
                  className="absolute right-2 text-zinc-400 hover:text-emerald-400 p-1 rounded-md transition-colors"
                  title="ສະແກນ QR / ບາໂຄດ ຊື່ສະໜາມ"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    categoryFilter === cat.id
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                      : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Courts Grid (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {filteredPresets.map((preset) => {
                const liveStatus = getCourtLiveStatus(preset);
                const isSelectedForFilter =
                  selectedFacilityFilter === preset.name.split("(")[0].trim();

                return (
                  <div
                    key={preset.id}
                    className={`bg-zinc-950/80 border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between group hover:shadow-lg hover:shadow-emerald-500/5 ${
                      isSelectedForFilter
                        ? "border-emerald-500 ring-2 ring-emerald-500/30"
                        : "border-zinc-800/80 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      {/* Image + Badges */}
                      <div className="relative h-32 overflow-hidden bg-zinc-900">
                        <img
                          src={preset.image}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-black/40" />

                        {/* Category tag */}
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-semibold text-zinc-300 border border-white/10">
                          {preset.categoryLabel}
                        </div>

                        {/* Live availability badge */}
                        <div
                          className={`absolute top-2 right-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-md ${liveStatus.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${liveStatus.dotClass}`} />
                          <span>{liveStatus.label}</span>
                        </div>

                        {/* Zoom Button */}
                        <button
                          onClick={() => setZoomImage({ url: preset.image, title: preset.name })}
                          className="absolute bottom-2 right-2 p-1 bg-black/60 hover:bg-black/90 text-zinc-400 hover:text-white rounded-md backdrop-blur-md border border-white/10 transition-colors"
                          title="ຂະຫຍາຍຮູບພາບ"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                            {preset.name}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-emerald-400 text-sm">
                            ₭{preset.ratePerHour.toLocaleString()}
                            <span className="text-[10px] font-normal text-zinc-500">/ຊມ</span>
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              liveStatus.activeBookingsCount > 0 ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {liveStatus.activeBookingsCount > 0
                              ? `${liveStatus.activeBookingsCount} ຄິວດຳເນີນງານ`
                              : "ວ່າງພ້ອມໃຊ້"}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>

                        {/* Active playing info if in use */}
                        {liveStatus.activeBooking && (
                          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] space-y-1">
                            <div className="flex items-center gap-1.5 text-zinc-300 font-medium truncate">
                              <User className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">{liveStatus.activeBooking.customerName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[10px]">
                              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>
                                {liveStatus.activeBooking.startTime.replace("T", " ").slice(11, 16)} -{" "}
                                {liveStatus.activeBooking.endTime.replace("T", " ").slice(11, 16)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions on Court Card */}
                    <div className="p-3 pt-0 flex items-center gap-2">
                      <button
                        onClick={() => handleFilterCourtQueue(preset)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-colors border flex items-center justify-center gap-1 ${
                          isSelectedForFilter
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border-zinc-800"
                        }`}
                        title="ກັ່ນຕອງຄິວຂອງສະໜາມນີ້ຢູ່ເບື້ອງຂວາ"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isSelectedForFilter ? "ກຳລັງເບິ່ງຄິວ" : "ເບິ່ງຄິວ"}</span>
                      </button>

                      <button
                        onClick={() => handleQuickBookCourt(preset)}
                        className="flex-1 py-1.5 px-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 flex items-center justify-center gap-1"
                        title="ເປີດຟອມຈອງສະໜາມນີ້ທັນທີ"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ ຈອງດ່ວນ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* -- PART 2: RIGHT SIDE (5 Cols) - BOOKING QUEUE & FAST FORM -- */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-xl space-y-4">
            
            {/* Tabs Switcher: Active Queue vs Fast Booking Form (Archive moved to top) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-2xl border border-zinc-800">
              <button
                onClick={() => setRightTab("ACTIVE")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  rightTab === "ACTIVE"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                }`}
              >
                <List className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">ຄິວດຳເນີນງານ ({activeCount})</span>
              </button>

              <button
                onClick={() => setRightTab("FORM")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  rightTab === "FORM"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">+ ຟອມຈອງ</span>
              </button>
            </div>

            {/* TAB CONTENT 1: ACTIVE BOOKINGS QUEUE */}
            {rightTab === "ACTIVE" && (
              <div className="space-y-3.5">
                {/* Search & Status Filters */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1 flex items-center">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="ພິມລະຫັດບິນ #BKG-..., ຊື່ລູກຄ້າ ຫຼື ສະແກນ QR..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          if (!e.target.value.trim()) setInspectedBookingResult(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && search.trim()) {
                            e.preventDefault();
                            handleInspectBookingByQuery(search);
                          }
                        }}
                        className="w-full pl-8 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setScannerTarget("SEARCH");
                          setIsCameraScannerOpen(true);
                        }}
                        className="absolute right-2 text-zinc-400 hover:text-emerald-400 p-1 rounded-md transition-colors"
                        title="ສະແກນ QR ບິນ ຫຼື ບາໂຄດ"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    {search.trim() && (
                      <button
                        type="button"
                        onClick={() => handleInspectBookingByQuery(search)}
                        className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold transition-colors shrink-0"
                      >
                        ກວດສອບບິນ
                      </button>
                    )}
                  </div>

                  {/* Status Pills */}
                  <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                    {[
                      { label: "ທັງໝົດທີ່ດຳເນີນງານ", value: "ALL", count: activeCount },
                      { label: "ລໍຖ້າໃຊ້", value: "CONFIRMED", count: confirmedCount },
                      { label: "ກຳລັງໃຊ້", value: "IN_USE", count: inUseCount },
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setActiveStatusFilter(tab.value as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                          activeStatusFilter === tab.value
                            ? "bg-zinc-800 text-white border border-zinc-700"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className="text-[10px] text-zinc-500">({tab.count})</span>
                      </button>
                    ))}
                  </div>

                  {/* Court Filter Active Badge */}
                  {selectedFacilityFilter && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                      <span className="text-emerald-400 font-semibold truncate">
                        ສະແດງຄິວສະເພາະ: {selectedFacilityFilter}
                      </span>
                      <button
                        onClick={() => setSelectedFacilityFilter(null)}
                        className="text-zinc-400 hover:text-white ml-2 shrink-0 p-0.5 rounded hover:bg-emerald-500/20"
                        title="ລຶບການກັ່ນຕອງ"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Queue Cards List */}
                <div className="space-y-3 max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                      <p className="text-zinc-400 text-xs">ກຳລັງໂຫຼດຂໍ້ມູນຄິວຈອງ...</p>
                    </div>
                  ) : filteredActiveBookings.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/60 space-y-2">
                      <Building2 className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                      <p className="text-sm font-bold text-white">ບໍ່ມີຄິວທີ່ກຳລັງດຳເນີນງານ</p>
                      <p className="text-xs text-zinc-500">
                        {search || selectedFacilityFilter
                          ? "ບໍ່ພົບຂໍ້ມູນທີ່ກົງກັບເງື່ອນໄຂຄົ້ນຫາ"
                          : "ລາຍການທີ່ອອກບິນແລ້ວຖືກຍ້າຍໄປເກັບໃນປະຫວັດແລ້ວ"}
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                        {completedCount > 0 && (
                          <button
                            onClick={() => {
                              setMainView("ARCHIVE");
                              setArchiveStatusFilter("COMPLETED");
                            }}
                            className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>ເບິ່ງປະຫວັດອອກບິນດ້ານເທິງ ({completedCount})</span>
                          </button>
                        )}
                        <button
                          onClick={() => setRightTab("FORM")}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>ເພີ່ມການຈອງໃໝ່</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    filteredActiveBookings.map((booking) => {
                      const badge = getStatusBadge(booking.status);
                      const durationHrs = getDurationHours(booking.startTime, booking.endTime);
                      const hourlyRate = parseHourlyRate(booking.facilityName);
                      const estTotal = durationHrs * hourlyRate;

                      return (
                        <div
                          key={booking.id}
                          className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-3.5 space-y-2.5 transition-all shadow-sm"
                        >
                          {/* Top: Facility name + Status badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                                {booking.facilityName}
                              </h4>
                              <p className="text-[10px] font-mono text-zinc-500">
                                ID: #{booking.id.slice(-6).toUpperCase()}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.badgeClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                              <span>{badge.label}</span>
                            </span>
                          </div>

                          {/* Customer & Time Info */}
                          <div className="p-2.5 bg-zinc-900/90 rounded-xl space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-zinc-200 font-semibold truncate">
                                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="truncate">{booking.customerName}</span>
                              </div>
                              <span className="text-[11px] font-extrabold text-emerald-400 shrink-0">
                                ₭{estTotal.toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
                              <Calendar className="w-3 h-3 text-blue-400 shrink-0" />
                              <span>
                                {new Date(booking.startTime).toLocaleDateString("lo-LA", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                              <span className="text-zinc-600">·</span>
                              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="font-mono">
                                {booking.startTime.replace("T", " ").slice(11, 16)} -{" "}
                                {booking.endTime.replace("T", " ").slice(11, 16)}
                              </span>
                              <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-bold">
                                {durationHrs} ຊມ
                              </span>
                            </div>
                          </div>

                          {/* Quick Actions Bar */}
                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-800/60">
                            {/* Workflow status buttons */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {booking.status === "CONFIRMED" && (
                                <button
                                  onClick={() => handleUpdateStatus(booking, "IN_USE")}
                                  className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                                  title="ເລີ່ມນຳໃຊ້ສະໜາມ"
                                >
                                  <Activity className="w-3 h-3" />
                                  <span>ເລີ່ມໃຊ້</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleUpdateStatus(booking, "COMPLETED")}
                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                                title="ໝາຍວ່າສຳເລັດ"
                              >
                                <Check className="w-3 h-3" />
                                <span>ສຳເລັດ</span>
                              </button>

                              <button
                                onClick={() => handleConvertToOrder(booking)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                                title="ອອກບິນຊຳລະເງິນ (Sales Order) ແລະ ຍ້າຍໄປເກັບໃນປະຫວັດ"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>ອອກບິນ</span>
                              </button>

                              <button
                                onClick={() => setPreviewReceiptBooking(booking)}
                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                                title="ພິມໃບບິນການຈອງສະໜາມ"
                              >
                                <Printer className="w-3 h-3" />
                                <span>ພິມບິນ</span>
                              </button>
                            </div>

                            {/* Secondary actions */}
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => openEdit(booking)}
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                title="ແກ້ໄຂ"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(booking.id)}
                                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="ລຶບ"
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
            )}

            {/* TAB CONTENT 2: FAST INLINE BOOKING FORM */}
            {rightTab === "FORM" && (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Selected Court Banner */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center gap-3">
                  <img
                    src={selectedPreset.image}
                    alt={selectedPreset.name}
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                      {selectedPreset.categoryLabel}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate mt-0.5">
                      {selectedPreset.name}
                    </h4>
                    <p className="text-[11px] font-extrabold text-emerald-400">
                      ₭{selectedPreset.ratePerHour.toLocaleString()}/ຊມ
                    </p>
                  </div>
                </div>

                {/* Facility Name input / selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                    ສະໜາມທີ່ເລືອກ *
                  </label>
                  <select
                    value={facilityName}
                    onChange={(e) => {
                      setFacilityName(e.target.value);
                      const found = FACILITY_PRESETS.find((p) =>
                        e.target.value.includes(p.name.split("(")[0].trim())
                      );
                      if (found) setSelectedPreset(found);
                    }}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {FACILITY_PRESETS.map((p) => (
                      <option
                        key={p.id}
                        value={`${p.name} · ₭${p.ratePerHour.toLocaleString()}/ຊມ`}
                      >
                        {p.name} (₭{p.ratePerHour.toLocaleString()}/ຊມ)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-zinc-400 uppercase">
                        ຊື່ລູກຄ້າ / ທີມ *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setScannerTarget("FORM_CUSTOMER");
                          setIsCameraScannerOpen(true);
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        title="ສະແກນບັດສະມາຊິກ ຫຼື QR ລູກຄ້າ"
                      >
                        <Camera className="w-3 h-3" />
                        <span>ສະແກນບັດ</span>
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        placeholder="ເຊັ່ນ: ທີມ Lao Star FC..."
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setScannerTarget("FORM_CUSTOMER");
                          setIsCameraScannerOpen(true);
                        }}
                        className="absolute right-2 text-zinc-500 hover:text-indigo-400 p-1"
                        title="ສະແກນບັດສະມາຊິກ / QR"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                      ເບີໂທຕິດຕໍ່
                    </label>
                    <input
                      type="text"
                      placeholder="ເຊັ່ນ: 020 5555 1234"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Time Selection */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                        ເວລາເລີ່ມຕົ້ນ *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                        ເວລາສິ້ນສຸດ *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Quick duration buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-zinc-500">ປັບເວລາ:</span>
                    {[1, 1.5, 2, 3].map((hrs) => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => setQuickDuration(hrs)}
                        className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-semibold text-zinc-300"
                      >
                        +{hrs} ຊມ
                      </button>
                    ))}
                    <span className="ml-auto text-[11px] font-bold text-emerald-400">
                      {getDurationHours(startTime, endTime)} ຊມ
                    </span>
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                    ສະຖານະການຈອງ
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CONFIRMED">ຢືນຢັນແລ້ວ (CONFIRMED) - ລໍຖ້າໃຊ້ງານ</option>
                    <option value="IN_USE">ກຳລັງນຳໃຊ້ (IN_USE) - ຢູ່ໃນສະໜາມ</option>
                    <option value="COMPLETED">ສຳເລັດແລ້ວ (COMPLETED) - ຫຼິ້ນສຳເລັດ</option>
                  </select>
                </div>

                {/* Price Box */}
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">ຄ່າເຊົ່າປະມານການ:</span>
                  <span className="text-sm font-black text-emerald-400">
                    ₭
                    {(
                      getDurationHours(startTime, endTime) *
                      parseHourlyRate(facilityName)
                    ).toLocaleString()}
                  </span>
                </div>

                {/* Submit button */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setRightTab("ACTIVE");
                    }}
                    className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    ຍົກເລີກ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>ຢືນຢັນເພີ່ມການຈອງ</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      )}

      {/* -- Add / Edit Booking Modal (For Editing existing items) -- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {editingItem ? "ແກ້ໄຂຂໍ້ມູນການຈອງສະໜາມ" : "ເພີ່ມການຈອງສະໜາມ ແລະ ຄອດໃໝ່"}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    ກະລຸນາປ້ອນຂໍ້ມູນລູກຄ້າ ແລະ ກຳນົດເວລາຈອງ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
              {/* Quick Preset Selector Chips */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">
                  ເລືອກສະໜາມຈາກລາຍການມາດຕະຖານ (Quick Pick)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto custom-scrollbar p-1 bg-zinc-950/60 rounded-xl border border-zinc-800">
                  {FACILITY_PRESETS.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() =>
                        setFacilityName(
                          `${p.name} · ₭${p.ratePerHour.toLocaleString()}/ຊມ`
                        )
                      }
                      className="text-left p-2 rounded-lg bg-zinc-900/80 hover:bg-emerald-500/10 border border-zinc-800 hover:border-emerald-500/30 transition-all text-xs"
                    >
                      <p className="font-semibold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-emerald-400 font-bold">
                        ₭{p.ratePerHour.toLocaleString()}/ຊມ
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Facility Name input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ຊື່ສະໜາມ ຫຼື ຄອດ *
                </label>
                <input
                  type="text"
                  required
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ສະໜາມບານເຕະ VIP 1, ຄອດດອກປີກໄກ່ A1..."
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase">
                      ຊື່ລູກຄ້າ / ທີມ *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget("MODAL_CUSTOMER");
                        setIsCameraScannerOpen(true);
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      title="ສະແກນບັດສະມາຊິກ ຫຼື QR ລູກຄ້າ"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>ສະແກນບັດ</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      placeholder="ຕົວຢ່າງ: ທີມ Lao Star FC, ທ່ານ ສົມສັກ..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-4 pr-9 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget("MODAL_CUSTOMER");
                        setIsCameraScannerOpen(true);
                      }}
                      className="absolute right-2.5 text-zinc-500 hover:text-indigo-400 p-1"
                      title="ສະແກນບັດສະມາຊິກ / QR"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    ເບີໂທຕິດຕໍ່
                  </label>
                  <input
                    type="text"
                    placeholder="ຕົວຢ່າງ: 020 5555 1234"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Date & Time with quick duration buttons */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                      ເວລາເລີ່ມຕົ້ນ *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                      ເວລາສິ້ນສຸດ *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Quick duration buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-zinc-500">ກຳນົດໄລຍະເວລາ:</span>
                  {[1, 1.5, 2, 3, 4].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setQuickDuration(hrs)}
                      className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-300"
                    >
                      +{hrs} ຊມ
                    </button>
                  ))}
                  <span className="ml-auto text-xs font-bold text-emerald-400">
                    ລວມ: {getDurationHours(startTime, endTime)} ຊມ
                  </span>
                </div>
              </div>

              {/* Status selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ສະຖານະການຈອງ
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="CONFIRMED">ຢືນຢັນແລ້ວ (CONFIRMED) - ລໍຖ້າໃຊ້ງານ</option>
                  <option value="IN_USE">ກຳລັງນຳໃຊ້ (IN_USE) - ຢູ່ໃນສະໜາມ</option>
                  <option value="COMPLETED">ສຳເລັດແລ້ວ (COMPLETED) - ຫຼິ້ນສຳເລັດ</option>
                  <option value="CANCELLED">ຍົກເລີກ (CANCELLED) - ຍົກເລີກການຈອງ</option>
                </select>
              </div>

              {/* Price estimation box */}
              <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-zinc-400">ຄ່າເຊົ່າປະມານການ:</span>
                <span className="text-sm font-black text-emerald-400">
                  ₭
                  {(
                    getDurationHours(startTime, endTime) *
                    parseHourlyRate(facilityName)
                  ).toLocaleString()}
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? "ບັນທຶກການແກ້ໄຂ" : "ຢືນຢັນເພີ່ມການຈອງ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Professional Printable Facility Booking Receipt & Voucher Modal ── */}
      {previewReceiptBooking && (() => {
        const effectiveStoreName = storeInfo.name || "ສະໜາມກິລາ & ຄອດມາດຕະຖານ";
        const effectiveStorePhone = storeInfo.phone || null;
        const effectiveStoreAddress = storeInfo.address || null;
        const effectiveStoreLogo = storeInfo.logo || null;
        const barcodeCode = "BKG-" + previewReceiptBooking.id.slice(-8).toUpperCase();
        const durationHours = getDurationHours(previewReceiptBooking.startTime, previewReceiptBooking.endTime);
        const hourlyRate = parseHourlyRate(previewReceiptBooking.facilityName);
        const totalAmount = durationHours * hourlyRate;
        const cleanCustomerName = previewReceiptBooking.customerName.replace(/\(.*?\)/g, "").trim() || previewReceiptBooking.customerName;
        const extractedPhone = previewReceiptBooking.customerName.match(/\(([^)]+)\)/)?.[1] || customerPhone || "-";
        const startDate = new Date(previewReceiptBooking.startTime);
        const formattedDate = startDate.toLocaleDateString("lo-LA", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const startTimeStr = previewReceiptBooking.startTime.replace("T", " ").slice(11, 16);
        const endTimeStr = previewReceiptBooking.endTime.replace("T", " ").slice(11, 16);
        const timeSlotStr = `${startTimeStr} - ${endTimeStr}`;
        const issueTimeStr = new Date().toLocaleString("lo-LA", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const statusLao: Record<string, { label: string; color: string; border: string }> = {
          CONFIRMED: { label: "ຢືນຢັນການຈອງ (CONFIRMED)", color: "text-blue-700 bg-blue-50", border: "border-blue-200" },
          IN_USE: { label: "ກຳລັງນຳໃຊ້ສະໜາມ (IN USE)", color: "text-amber-700 bg-amber-50", border: "border-amber-200" },
          COMPLETED: { label: "ຊຳລະເງິນ & ສຳເລັດ (PAID)", color: "text-emerald-700 bg-emerald-50", border: "border-emerald-200" },
          CANCELLED: { label: "ຍົກເລີກແລ້ວ (CANCELLED)", color: "text-rose-700 bg-rose-50", border: "border-rose-200" },
        };
        const currentStatus = statusLao[previewReceiptBooking.status] || {
          label: previewReceiptBooking.status,
          color: "text-zinc-700 bg-zinc-50",
          border: "border-zinc-200"
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
              {/* Modal Top Control Bar */}
              <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-wrap justify-between items-center gap-3 bg-zinc-950/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>ໃບບິນການຈອງສະໜາມກິລາ & ຄອດ</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Official Slip
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      ລະຫັດບິນ: #{barcodeCode}
                    </p>
                  </div>
                </div>

                {/* Format Switcher */}
                <div className="flex items-center gap-2">
                  <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setPrintFormat("SLIP")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                        printFormat === "SLIP"
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>ບິນນ້ອຍ 80mm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintFormat("A4")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                        printFormat === "A4"
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>ບິນໃຫຍ່ A4</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewReceiptBooking(null)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                    title="ປິດໜ້າຕ່າງ"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Preview Scrollable Viewport */}
              <div className="p-4 sm:p-6 overflow-y-auto bg-zinc-950/50 flex-1">
                {printFormat === "SLIP" ? (
                  /* ── THERMAL RECEIPT SLIP (80mm) ── */
                  <div
                    id="printable-facility-booking-slip"
                    className="bg-white text-zinc-950 rounded-2xl p-6 shadow-2xl border border-zinc-200 max-w-sm mx-auto space-y-4 font-sans text-xs"
                  >
                    {/* Store Header */}
                    <div className="text-center space-y-1.5 pb-3 border-b-2 border-dashed border-zinc-300">
                      {effectiveStoreLogo ? (
                        <img
                          src={effectiveStoreLogo}
                          alt={effectiveStoreName}
                          className="w-12 h-12 object-contain mx-auto rounded-lg mb-1"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-zinc-950 text-white mx-auto flex items-center justify-center font-black text-sm">
                          {effectiveStoreName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <h4 className="font-black text-base uppercase tracking-tight text-zinc-950">
                        {effectiveStoreName}
                      </h4>
                      {effectiveStoreAddress && (
                        <p className="text-[10px] text-zinc-600 leading-snug">
                          {effectiveStoreAddress}
                        </p>
                      )}
                      {effectiveStorePhone && (
                        <p className="text-[11px] font-bold text-zinc-700">
                          ໂທ: {effectiveStorePhone}
                        </p>
                      )}
                      <div className="pt-1">
                        <span className="inline-block px-2.5 py-0.5 rounded bg-zinc-100 border border-zinc-300 text-[10px] font-bold uppercase text-zinc-700">
                          ໃບຢັ້ງຢືນການຈອງສະໜາມ & ບິນຮັບເງິນ
                        </span>
                      </div>
                    </div>

                    {/* Barcode & Reference */}
                    <div className="text-center py-1 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                      <div className="py-1">
                        {renderCode39SVG(barcodeCode, 34)}
                      </div>
                      <div className="font-mono text-xs font-bold tracking-widest text-zinc-900">
                        #{barcodeCode}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        ວັນທີອອກບິນ: {issueTimeStr}
                      </div>
                    </div>

                    {/* Booking Details Grid */}
                    <div className="space-y-2 py-1 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-zinc-500 shrink-0">ລູກຄ້າຜູ້ຈອງ:</span>
                        <span className="font-bold text-zinc-900 text-right">
                          {cleanCustomerName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-zinc-500 shrink-0">ເບີໂທລະສັບ:</span>
                        <span className="font-mono font-bold text-zinc-800 text-right">
                          {extractedPhone}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2 pt-1 border-t border-dashed border-zinc-200">
                        <span className="text-zinc-500 shrink-0">ສະໜາມ / ຄອດ:</span>
                        <span className="font-bold text-zinc-900 text-right">
                          {previewReceiptBooking.facilityName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-zinc-500 shrink-0">ວັນທີຫຼິ້ນ:</span>
                        <span className="font-semibold text-zinc-800 text-right">
                          {formattedDate}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-zinc-500 shrink-0">ຊ່ວງເວລາ:</span>
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-right">
                          {timeSlotStr} ({durationHours} ຊົ່ວໂມງ)
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-zinc-500 shrink-0">ອັດຕາຄ່າສະໜາມ:</span>
                        <span className="font-mono text-zinc-800 text-right">
                          ₭{hourlyRate.toLocaleString()} / ຊມ
                        </span>
                      </div>
                    </div>

                    {/* Financial Summary Box */}
                    <div className="bg-zinc-100 p-3.5 rounded-xl border border-zinc-300 space-y-2">
                      <div className="flex justify-between items-center text-xs text-zinc-600">
                        <span>ຄ່າສະໜາມ ({durationHours} x ₭{hourlyRate.toLocaleString()}):</span>
                        <span className="font-mono font-semibold">₭{totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-zinc-600">
                        <span>ສ່ວນຫຼຸດ (Discount):</span>
                        <span className="font-mono font-semibold">₭0</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t-2 border-zinc-900 text-sm font-black text-zinc-950">
                        <span>ຍອດລວມທັງໝົດ:</span>
                        <span className="font-mono text-base text-emerald-700">
                          ₭{totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="pt-1 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${currentStatus.color} ${currentStatus.border}`}>
                          {currentStatus.label}
                        </span>
                      </div>
                    </div>

                    {/* Scannable Check-in QR Code */}
                    <div className="pt-2 pb-1 border-t border-dashed border-zinc-300 flex flex-col items-center justify-center text-center space-y-1.5">
                      <div className="p-2 bg-white border border-zinc-200 rounded-xl shadow-sm inline-block">
                        <QRCodeSVG
                          value={`BKG:${previewReceiptBooking.id}:${cleanCustomerName}:${totalAmount}`}
                          size={96}
                          level="M"
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-zinc-600">
                        ສະແກນ QR Code ເພື່ອກວດເຊັກເຂົ້າສະໜາມ
                      </span>
                    </div>

                    {/* Facility Rules */}
                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-[10px] text-zinc-600 space-y-1">
                      <div className="font-bold text-zinc-800 uppercase">
                        ລະບຽບການໃຊ້ສະໜາມ (Facility Rules):
                      </div>
                      <p>1. ກະລຸນາມາຮອດສະໜາມກ່ອນເວລາ 10-15 ນາທີ.</p>
                      <p>2. ກະລຸນາສະແດງໃບບິນ ຫຼື QR Code ນີ້ຕໍ່ເຈົ້າໜ້າທີ່ໜ້າສະໜາມ.</p>
                      <p>3. ໃສ່ເກີບກິລາໃຫ້ຖືກຕາມປະເພດມາດຕະຖານຂອງສະໜາມ.</p>
                    </div>

                    {/* Footer */}
                    <div className="text-center pt-2 border-t border-dashed border-zinc-300 text-[10px] text-zinc-500">
                      ຂອບໃຈທີ່ໃຊ້ບໍລິການ · ຂໍໃຫ້ມ່ວນຊື່ນກັບການຫຼິ້ນກິລາ!
                    </div>
                  </div>
                ) : (
                  /* ── FORMAL A4 FACILITY BOOKING VOUCHER & INVOICE ── */
                  <div
                    id="printable-facility-booking-slip"
                    className="bg-white text-zinc-950 rounded-2xl p-8 shadow-2xl border border-zinc-200 max-w-2xl mx-auto space-y-6 font-sans text-xs"
                  >
                    {/* Formal Header */}
                    <div className="flex justify-between items-start border-b-2 border-zinc-950 pb-5">
                      <div className="flex items-center gap-3">
                        {effectiveStoreLogo ? (
                          <img
                            src={effectiveStoreLogo}
                            alt={effectiveStoreName}
                            className="w-14 h-14 object-contain"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-black text-xl shrink-0">
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
                        <div className="text-[10px] text-zinc-500">
                          ວັນທີອອກບິນ: {issueTimeStr}
                        </div>
                        <div>
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${currentStatus.color} ${currentStatus.border}`}>
                            {currentStatus.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Document Title Banner */}
                    <div className="text-center py-2.5 bg-zinc-100 rounded-xl border border-zinc-200">
                      <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide">
                        ໃບຢັ້ງຢືນການຈອງສະໜາມກິລາ ແລະ ໃບຮັບເງິນ (FACILITY BOOKING VOUCHER & INVOICE)
                      </h3>
                    </div>

                    {/* 2-Column Parties Info */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Facility Provider */}
                      <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                          ຜູ້ໃຫ້ບໍລິການສະໜາມ (Facility / Provider)
                        </span>
                        <div className="font-bold text-zinc-900 text-sm">
                          {effectiveStoreName}
                        </div>
                        {effectiveStorePhone && (
                          <div className="text-zinc-600 text-xs">
                            ເບີໂທ: {effectiveStorePhone}
                          </div>
                        )}
                        {effectiveStoreAddress && (
                          <div className="text-zinc-500 text-[11px]">
                            ທີ່ຕັ້ງ: {effectiveStoreAddress}
                          </div>
                        )}
                      </div>

                      {/* Customer Info */}
                      <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                          ລູກຄ້າຜູ້ຈອງ (Customer / Lessee)
                        </span>
                        <div className="font-bold text-zinc-900 text-sm">
                          {cleanCustomerName}
                        </div>
                        <div className="text-zinc-600 text-xs">
                          ເບີໂທລະສັບ: {extractedPhone}
                        </div>
                        <div className="text-zinc-500 text-[11px]">
                          ວັນທີຫຼິ້ນ: {formattedDate}
                        </div>
                      </div>
                    </div>

                    {/* Booking Item Table */}
                    <div>
                      <table className="w-full text-xs text-left border-collapse border border-zinc-300">
                        <thead>
                          <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
                            <th className="py-2.5 px-3 border-r border-zinc-300 text-center w-12">ລ/ດ</th>
                            <th className="py-2.5 px-3 border-r border-zinc-300">ລາຍລະອຽດສະໜາມ / ຄອດ</th>
                            <th className="py-2.5 px-3 border-r border-zinc-300 text-center">ວັນທີ & ຊ່ວງເວລາ</th>
                            <th className="py-2.5 px-3 border-r border-zinc-300 text-center w-24">ໄລຍະເວລາ</th>
                            <th className="py-2.5 px-3 border-r border-zinc-300 text-right w-28">ລາຄາ/ຊົ່ວໂມງ</th>
                            <th className="py-2.5 px-3 text-right w-32">ຍອດລວມ</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-zinc-200">
                            <td className="py-3 px-3 border-r border-zinc-200 text-center font-bold">1</td>
                            <td className="py-3 px-3 border-r border-zinc-200 font-bold text-zinc-900">
                              {previewReceiptBooking.facilityName}
                            </td>
                            <td className="py-3 px-3 border-r border-zinc-200 text-center font-mono">
                              {timeSlotStr}
                            </td>
                            <td className="py-3 px-3 border-r border-zinc-200 text-center font-bold">
                              {durationHours} ຊົ່ວໂມງ
                            </td>
                            <td className="py-3 px-3 border-r border-zinc-200 text-right font-mono">
                              ₭{hourlyRate.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-zinc-950">
                              ₭{totalAmount.toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Calculations Summary */}
                    <div className="flex justify-between items-start gap-6 pt-2">
                      <div className="flex items-center gap-4 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                        <QRCodeSVG
                          value={`BKG:${previewReceiptBooking.id}:${cleanCustomerName}:${totalAmount}`}
                          size={70}
                          level="M"
                        />
                        <div className="space-y-0.5">
                          <div className="font-mono text-xs font-bold text-zinc-900">
                            #{barcodeCode}
                          </div>
                          <p className="text-[10px] text-zinc-500">
                            ສະແກນ QR Code ເພື່ອກວດກາການຈອງ ແລະ ເຊັກອິນໜ້າສະໜາມ
                          </p>
                        </div>
                      </div>

                      <div className="w-64 space-y-1.5 text-xs">
                        <div className="flex justify-between text-zinc-600">
                          <span>ມູນຄ່າລວມ (Subtotal):</span>
                          <span className="font-mono">₭{totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-zinc-600">
                          <span>ສ່ວນຫຼຸດ (Discount):</span>
                          <span className="font-mono">₭0</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t-2 border-zinc-900 font-black text-sm text-zinc-950">
                          <span>ຍອດຊຳລະສຸດທິ:</span>
                          <span className="font-mono text-base text-emerald-700">
                            ₭{totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Facility Terms */}
                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-[10px] text-zinc-600 space-y-1 leading-relaxed">
                      <div className="font-bold text-zinc-900 uppercase mb-1">
                        ຂໍ້ກຳນົດ ແລະ ລະບຽບການນຳໃຊ້ສະໜາມ (Terms & Conditions):
                      </div>
                      <p>1. ໃບຢັ້ງຢືນການຈອງສະບັບນີ້ ຖືເປັນຫຼັກຖານການຈອງ ແລະ ຊຳລະເງິນຢ່າງເປັນທາງການ.</p>
                      <p>2. ຜູ້ເຊົ່າຕ້ອງເຂົ້າໃຊ້ສະໜາມຕາມເວລາທີ່ກຳນົດ ຫາກເກີນເວລາໂດຍບໍ່ແຈ້ງລ່ວງໜ້າ ອາດມີຄ່າບໍລິການເພີ່ມເຕີມ.</p>
                      <p>3. ຫ້າມນຳສິ່ງເສບຕິດ, ອາວຸດ, ຫຼື ສັດລ້ຽງ ເຂົ້າບໍລິເວນສະໜາມ ແລະ ກະລຸນາຮັກສາຄວາມສະອາດ.</p>
                    </div>

                    {/* Formal Signatures */}
                    <div className="grid grid-cols-2 gap-12 pt-6 text-center text-xs">
                      <div>
                        <div className="h-16 border-b border-zinc-400 mx-4 mb-2 flex items-end justify-center pb-1 text-zinc-400 italic">
                          (ລາຍເຊັນລູກຄ້າຜູ້ຈອງ)
                        </div>
                        <div className="font-bold text-zinc-900">{cleanCustomerName}</div>
                        <div className="text-[10px] text-zinc-500">ຜູ້ຈອງສະໜາມ</div>
                      </div>
                      <div>
                        <div className="h-16 border-b border-zinc-400 mx-4 mb-2 flex items-end justify-center pb-1 text-zinc-400 italic">
                          (ລາຍເຊັນ ແລະ ກາປະທັບ)
                        </div>
                        <div className="font-bold text-zinc-900">{effectiveStoreName}</div>
                        <div className="text-[10px] text-zinc-500">ຜູ້ຈັດການ / ຜູ້ຮັບຜິດຊອບສະໜາມ</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Bottom Footer Actions */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex justify-between items-center gap-3">
                <span className="text-xs text-zinc-400 hidden sm:inline">
                  ຮູບແບບການພິມ: <strong className="text-white">{printFormat === "SLIP" ? "ບິນນ້ອຍ 80mm (Thermal Slip)" : "ບິນໃຫຍ່ A4 (Official Voucher)"}</strong>
                </span>
                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setPreviewReceiptBooking(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                  >
                    ປິດໜ້າຕ່າງ
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95"
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

      {/* ── Global Print Styles for Facility Booking Slip ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-facility-booking-slip,
          #printable-facility-booking-slip * {
            visibility: visible !important;
          }
          #printable-facility-booking-slip {
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

      {/* -- Lightbox Image Zoom Modal -- */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl"
          >
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h4 className="font-bold text-white text-sm truncate">
                {zoomImage.title}
              </h4>
              <button
                onClick={() => setZoomImage(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-video bg-black">
              <img
                src={zoomImage.url}
                alt={zoomImage.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode / QR Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title={
          scannerTarget === "FORM_CUSTOMER" || scannerTarget === "MODAL_CUSTOMER"
            ? "ສະແກນບັດສະມາຊິກ / QR ລູກຄ້າ (Scan Member Card)"
            : scannerTarget === "COURT_SEARCH"
            ? "ສະແກນຄົ້ນຫາສະໜາມ (Scan Court QR)"
            : "ກ້ອງສະແກນໃບບິນຈອງສະໜາມ (Scan Booking Receipt / QR)"
        }
        subtitle={
          scannerTarget === "FORM_CUSTOMER" || scannerTarget === "MODAL_CUSTOMER"
            ? "ສ່ອງກ້ອງໃສ່ບັດສະມາຊິກ ຫຼື QR ຂອງລູກຄ້າເພື່ອປ້ອນຂໍ້ມູນດ່ວນ"
            : scannerTarget === "COURT_SEARCH"
            ? "ສ່ອງກ້ອງໃສ່ QR Code ປະຈຳສະໜາມເພື່ອຄົ້ນຫາດ່ວນ"
            : "ສ່ອງກ້ອງໃສ່ QR Code ຫຼື ບາໂຄດໃບບິນຈອງ ເພື່ອຄົ້ນຫາຂໍ້ມູນອັດຕະໂນມັດ"
        }
        placeholder="ຍິງເຄື່ອງສະແກນ ຫຼື ພິມລະຫັດ..."
      />
    </div>
  );
}
