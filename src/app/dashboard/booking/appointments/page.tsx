"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon, Clock, User, Phone, MapPin, CheckCircle,
  XCircle, Plus, Trash2, CalendarDays, Users, Search, Loader2,
  ChevronLeft, ChevronRight, Edit, Printer, AlertTriangle, Check,
  Filter, Sparkles, RefreshCw, LayoutGrid, ListFilter, Camera
} from "lucide-react";
import { toast } from "sonner";
import { CameraScannerModal } from "@/components/CameraScannerModal";
import {
  BillVerifyResultCard,
  BillVerifyResultData,
  formatTimeDiffLao,
  formatDateTimeLaoStandard,
} from "@/components/BillVerifyResultCard";

interface ServiceResource {
  id: string;
  name: string;
  type: "STAFF" | "ROOM";
  createdAt?: string;
}

interface Appointment {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  resourceId: string;
  resource: ServiceResource;
  createdAt?: string;
}

const HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

const DURATION_OPTIONS = [
  { label: "15 ນາທີ", value: "15" },
  { label: "30 ນາທີ", value: "30" },
  { label: "45 ນາທີ", value: "45" },
  { label: "1 ຊົ່ວໂມງ (60 ນາທີ)", value: "60" },
  { label: "1 ຊົ່ວໂມງ 30 ນາທີ (90 ນາທີ)", value: "90" },
  { label: "2 ຊົ່ວໂມງ (120 ນາທີ)", value: "120" },
  { label: "3 ຊົ່ວໂມງ (180 ນາທີ)", value: "180" },
];

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<"grid" | "kanban" | "table" | "resources">("grid");

  // Resources State
  const [resources, setResources] = useState<ServiceResource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [resName, setResName] = useState("");
  const [resType, setResType] = useState<"STAFF" | "ROOM">("STAFF");
  const [isSubmittingRes, setIsSubmittingRes] = useState(false);

  // Appointments State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppts, setIsLoadingAppts] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedResourceFilter, setSelectedResourceFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Calendar Date State (Default to today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  // Modal State (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Form State
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [aptDate, setAptDate] = useState("");
  const [aptTime, setAptTime] = useState("09:00");
  const [aptDuration, setAptDuration] = useState("60");
  const [selectedResId, setSelectedResId] = useState("");
  const [aptStatus, setAptStatus] = useState<"SCHEDULED" | "COMPLETED" | "CANCELLED">("SCHEDULED");
  const [isSubmittingApt, setIsSubmittingApt] = useState(false);

  // Print Slip Modal State
  const [printAppt, setPrintAppt] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchResources();
    fetchAppointments();
  }, []);

  const fetchResources = async () => {
    setIsLoadingResources(true);
    try {
      const res = await fetch("/api/dashboard/resources");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setResources(data);
      }
    } catch {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນຊັບພະຍາກອນໄດ້");
    } finally {
      setIsLoadingResources(false);
    }
  };

  const fetchAppointments = async () => {
    setIsLoadingAppts(true);
    try {
      const res = await fetch("/api/dashboard/appointments");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAppointments(data);
      }
    } catch {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນນັດໝາຍໄດ້");
    } finally {
      setIsLoadingAppts(false);
    }
  };

  // --- Resource Handlers ---
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resName.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ພະນັກງານ ຫຼື ຫ້ອງບໍລິການ");
    }
    setIsSubmittingRes(true);
    try {
      const res = await fetch("/api/dashboard/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: resName.trim(), type: resType }),
      });
      if (res.ok) {
        toast.success("ເພີ່ມຊັບພະຍາກອນສຳເລັດແລ້ວ!");
        setResName("");
        fetchResources();
      } else {
        const err = await res.json();
        toast.error(err.error || "ການເພີ່ມຊັບພະຍາກອນລົ້ມເຫຼວ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການສ້າງຊັບພະຍາກອນ");
    } finally {
      setIsSubmittingRes(false);
    }
  };

  const handleDeleteResource = async (id: string, name: string) => {
    if (!(await askConfirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບ "${name}"? ນັດໝາຍທັງໝົດທີ່ກ່ຽວຂ້ອງຈະຖືກລົບໄປພ້ອມ.`))) {
      return;
    }
    try {
      const res = await fetch(`/api/dashboard/resources/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລົບຊັບພະຍາກອນສຳເລັດແລ້ວ!");
        fetchResources();
        fetchAppointments();
      } else {
        toast.error("ບໍ່ສາມາດລົບຊັບພະຍາກອນໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລົບຊັບພະຍາກອນ");
    }
  };

  // --- Date Navigation Handlers ---
  const handlePrevDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() - 1);
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, "0");
    const dd = String(cur.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleNextDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + 1);
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, "0");
    const dd = String(cur.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // Open Modal Helpers
  const openCreateModal = (resId?: string, timeSlot?: string, dateStr?: string) => {
    setEditingAppointment(null);
    setCustName("");
    setCustPhone("");
    setAptDate(dateStr || selectedDate);
    setAptTime(timeSlot || "09:00");
    setAptDuration("60");
    setSelectedResId(resId || (resources[0]?.id || ""));
    setAptStatus("SCHEDULED");
    setShowModal(true);
  };

  const openEditModal = (apt: Appointment) => {
    setEditingAppointment(apt);
    setCustName(apt.customerName);
    setCustPhone(apt.customerPhone || "");

    const start = new Date(apt.startTime);
    const end = new Date(apt.endTime);
    const yyyy = start.getFullYear();
    const mm = String(start.getMonth() + 1).padStart(2, "0");
    const dd = String(start.getDate()).padStart(2, "0");
    const hh = String(start.getHours()).padStart(2, "0");
    const min = String(start.getMinutes()).padStart(2, "0");

    const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

    setAptDate(`${yyyy}-${mm}-${dd}`);
    setAptTime(`${hh}:${min}`);
    setAptDuration(String(diffMinutes > 0 ? diffMinutes : 60));
    setSelectedResId(apt.resourceId);
    setAptStatus(apt.status);
    setShowModal(true);
  };

  // Check Conflict in Real Time
  const hasConflict = useMemo(() => {
    if (!aptDate || !aptTime || !selectedResId) return false;
    const [hh, mm] = aptTime.split(":").map(Number);
    const start = new Date(aptDate);
    start.setHours(hh, mm, 0, 0);
    const end = new Date(start.getTime() + parseInt(aptDuration, 10) * 60000);

    return appointments.some((apt) => {
      if (apt.resourceId !== selectedResId) return false;
      if (apt.status === "CANCELLED") return false;
      if (editingAppointment && apt.id === editingAppointment.id) return false;

      const existingStart = new Date(apt.startTime);
      const existingEnd = new Date(apt.endTime);

      return start < existingEnd && end > existingStart;
    });
  }, [aptDate, aptTime, aptDuration, selectedResId, appointments, editingAppointment]);

  // Handle Save Appointment
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !aptDate || !aptTime || !selectedResId) {
      return toast.error("ກະລຸນາຕື່ມຂໍ້ມູນທີ່ຈຳເປັນໃຫ້ຄົບຖ້ວນ");
    }

    const [hh, mm] = aptTime.split(":").map(Number);
    const startDateTime = new Date(aptDate);
    startDateTime.setHours(hh, mm, 0, 0);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(aptDuration, 10) * 60000);

    setIsSubmittingApt(true);
    try {
      if (editingAppointment) {
        const res = await fetch(`/api/dashboard/appointments/${editingAppointment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: custName.trim(),
            customerPhone: custPhone.trim() || null,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            resourceId: selectedResId,
            status: aptStatus,
          }),
        });

        if (res.ok) {
          toast.success("ອັບເດດນັດໝາຍສຳເລັດແລ້ວ!");
          setShowModal(false);
          fetchAppointments();
        } else {
          const err = await res.json();
          toast.error(err.error || "ການອັບເດດນັດໝາຍລົ້ມເຫຼວ");
        }
      } else {
        const res = await fetch("/api/dashboard/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: custName.trim(),
            customerPhone: custPhone.trim() || null,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            resourceId: selectedResId,
            status: aptStatus,
          }),
        });

        if (res.ok) {
          toast.success("ສ້າງນັດໝາຍໃໝ່ສຳເລັດແລ້ວ!");
          setShowModal(false);
          fetchAppointments();
        } else {
          const err = await res.json();
          toast.error(err.error || "ການສ້າງນັດໝາຍລົ້ມເຫຼວ");
        }
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກນັດໝາຍ");
    } finally {
      setIsSubmittingApt(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "SCHEDULED" | "COMPLETED" | "CANCELLED") => {
    try {
      const res = await fetch(`/api/dashboard/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`ປ່ຽນສະຖານະເປັນ "${status === "COMPLETED" ? "ສຳເລັດແລ້ວ" : status === "CANCELLED" ? "ຍົກເລີກ" : "ລໍຖ້າຮັບບໍລິການ"}" ສຳເລັດ!`);
        fetchAppointments();
      } else {
        toast.error("ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການປ່ຽນສະຖານະ");
    }
  };

  const handleDeleteAppointment = async (id: string, name: string) => {
    if (!(await askConfirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບນັດໝາຍຂອງ "${name}"?`))) {
      return;
    }
    try {
      const res = await fetch(`/api/dashboard/appointments/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລົບນັດໝາຍສຳເລັດແລ້ວ!");
        fetchAppointments();
      } else {
        toast.error("ບໍ່ສາມາດລົບນັດໝາຍໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລົບນັດໝາຍ");
    }
  };

  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [inspectedApptResult, setInspectedApptResult] = useState<BillVerifyResultData | null>(null);

  const matchApptBySearchTerm = (apt: Appointment, query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const cleanCode = q.replace(/^#/, "").replace(/^(apt|bkg)-/, "");
    return (
      apt.customerName.toLowerCase().includes(q) ||
      (apt.customerPhone && apt.customerPhone.toLowerCase().includes(q)) ||
      (apt.resource?.name && apt.resource.name.toLowerCase().includes(q)) ||
      apt.id.toLowerCase().includes(q) ||
      (cleanCode.length >= 2 && apt.id.toLowerCase().includes(cleanCode))
    );
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchSearch = matchApptBySearchTerm(apt, search);

      const matchResource =
        selectedResourceFilter === "ALL" || apt.resourceId === selectedResourceFilter;

      const matchStatus =
        selectedStatusFilter === "ALL" || apt.status === selectedStatusFilter;

      return matchSearch && matchResource && matchStatus;
    });
  }, [appointments, search, selectedResourceFilter, selectedStatusFilter]);

  const buildApptInspectionResult = (apt: Appointment): BillVerifyResultData => {
    const shortId = `#APT-${apt.id.slice(-6).toUpperCase()}`;
    const startDt = new Date(apt.startTime);
    const endDt = new Date(apt.endTime);
    const now = new Date();

    if (apt.status === "CANCELLED") {
      return {
        code: shortId,
        typeLabel: "ໃບຈອງນັດໝາຍ (Appointment Ticket)",
        status: "CANCELLED",
        statusTitle: "ໃບນັດໝາຍນີ້ຖືກຍົກເລີກແລ້ວ",
        expiryMessage: `ໃບນັດໝາຍ ${shortId} ຂອງລູກຄ້າ "${apt.customerName}" ຖືກຍົກເລີກແລ້ວ.`,
        customerName: `${apt.customerName}${apt.customerPhone ? ` (${apt.customerPhone})` : ""}`,
        itemName: apt.resource?.name || "ບໍ່ລະບຸຊັບພະຍາກອນ",
        startDateFormatted: formatDateTimeLaoStandard(apt.startTime),
        endDateFormatted: formatDateTimeLaoStandard(apt.endTime),
        onViewReceipt: () => setPrintAppt(apt),
      };
    }

    if (apt.status === "COMPLETED") {
      return {
        code: shortId,
        typeLabel: "ໃບຈອງນັດໝາຍ (Appointment Ticket)",
        status: "COMPLETED",
        statusTitle: "ຮັບບໍລິການຕາມນັດໝາຍສຳເລັດແລ້ວ",
        expiryMessage: `ໃບນັດໝາຍ ${shortId} ຂອງລູກຄ້າ "${apt.customerName}" ດຳເນີນການສຳເລັດຮຽບຮ້ອຍແລ້ວ.`,
        customerName: `${apt.customerName}${apt.customerPhone ? ` (${apt.customerPhone})` : ""}`,
        itemName: apt.resource?.name || "ບໍ່ລະບຸຊັບພະຍາກອນ",
        startDateFormatted: formatDateTimeLaoStandard(apt.startTime),
        endDateFormatted: formatDateTimeLaoStandard(apt.endTime),
        onViewReceipt: () => setPrintAppt(apt),
      };
    }

    const endDiff = formatTimeDiffLao(endDt, now);
    const startDiff = formatTimeDiffLao(startDt, now);

    if (endDiff.isPast) {
      return {
        code: shortId,
        typeLabel: "ໃບຈອງນັດໝາຍ (Appointment Ticket)",
        status: "EXPIRED",
        statusTitle: "ໃບນັດໝາຍນີ້ໝົດອາຍຸ / ກາຍເວລານັດໝາຍແລ້ວ!",
        expiryMessage: `ກາຍເວລານັດໝາຍມາແລ້ວ ${endDiff.text} (ກຳນົດສິ້ນສຸດ ${formatDateTimeLaoStandard(apt.endTime)}).`,
        customerName: `${apt.customerName}${apt.customerPhone ? ` (${apt.customerPhone})` : ""}`,
        itemName: apt.resource?.name || "ບໍ່ລະບຸຊັບພະຍາກອນ",
        startDateFormatted: formatDateTimeLaoStandard(apt.startTime),
        endDateFormatted: formatDateTimeLaoStandard(apt.endTime),
        extraBadgeText: `ກາຍເວລາ ${endDiff.text}`,
        onPrimaryAction: () => handleUpdateStatus(apt.id, "COMPLETED"),
        primaryActionLabel: "ໝາຍວ່າຮັບບໍລິການສຳເລັດ",
        onViewReceipt: () => setPrintAppt(apt),
      };
    }

    if (now < startDt) {
      return {
        code: shortId,
        typeLabel: "ໃບຈອງນັດໝາຍ (Appointment Ticket)",
        status: "UPCOMING",
        statusTitle: "ຍັງບໍ່ໝົດອາຍຸ • ໃບນັດໝາຍລ່ວງໜ້າ (ໃຊ້ງານໄດ້)",
        expiryMessage: `ໃບນັດໝາຍນີ້ຍັງບໍ່ໝົດອາຍຸ — ອີກ ${startDiff.text} ຈະຮອດເວລານັດໝາຍ (${formatDateTimeLaoStandard(apt.startTime)}).`,
        customerName: `${apt.customerName}${apt.customerPhone ? ` (${apt.customerPhone})` : ""}`,
        itemName: apt.resource?.name || "ບໍ່ລະບຸຊັບພະຍາກອນ",
        startDateFormatted: formatDateTimeLaoStandard(apt.startTime),
        endDateFormatted: formatDateTimeLaoStandard(apt.endTime),
        extraBadgeText: `ເລີ່ມໃນອີກ ${startDiff.text}`,
        onPrimaryAction: () => handleUpdateStatus(apt.id, "COMPLETED"),
        primaryActionLabel: "ໝາຍວ່າຮັບບໍລິການສຳເລັດ",
        onViewReceipt: () => setPrintAppt(apt),
      };
    }

    return {
      code: shortId,
      typeLabel: "ໃບຈອງນັດໝາຍ (Appointment Ticket)",
      status: "VALID",
      statusTitle: "ຍັງບໍ່ໝົດອາຍຸ • ກຳລັງຢູ່ໃນຊ່ວງເວລານັດໝາຍ",
      expiryMessage: `ຍັງເຫຼືອເວລານັດໝາຍອີກ ${endDiff.text} (ສິ້ນສຸດ ${formatDateTimeLaoStandard(apt.endTime)}).`,
      customerName: `${apt.customerName}${apt.customerPhone ? ` (${apt.customerPhone})` : ""}`,
      itemName: apt.resource?.name || "ບໍ່ລະບຸຊັບພະຍາກອນ",
      startDateFormatted: formatDateTimeLaoStandard(apt.startTime),
      endDateFormatted: formatDateTimeLaoStandard(apt.endTime),
      extraBadgeText: `ເຫຼືອເວລາ ${endDiff.text}`,
      onPrimaryAction: () => handleUpdateStatus(apt.id, "COMPLETED"),
      primaryActionLabel: "ໝາຍວ່າຮັບບໍລິການສຳເລັດ",
      onViewReceipt: () => setPrintAppt(apt),
    };
  };

  const handleInspectAppointmentByQuery = (rawQuery: string) => {
    const raw = rawQuery.trim();
    if (!raw) return;
    setSearch(raw);

    const match = appointments.find((apt) => matchApptBySearchTerm(apt, raw));
    if (match) {
      const result = buildApptInspectionResult(match);
      setInspectedApptResult(result);
      if (result.status === "EXPIRED") {
        toast.error(`${result.statusTitle} (${result.code})`);
      } else if (result.status === "VALID" || result.status === "UPCOMING") {
        toast.success(`${result.statusTitle} (${result.code})`);
      } else {
        toast.info(`${result.statusTitle} (${result.code})`);
      }
    } else {
      setInspectedApptResult({
        code: raw.toUpperCase(),
        typeLabel: "ໃບຈອງນັດໝາຍ (Appointment Ticket)",
        status: "NOT_FOUND",
        statusTitle: "ບໍ່ພົບລະຫັດໃບນັດໝາຍນີ້ໃນລະບົບ",
        expiryMessage: `ບໍ່ພົບຂໍ້ມູນນັດໝາຍທີ່ກົງກັບ "${raw}" — ກະລຸນາກວດສອບລະຫັດ ຫຼື ຊື່ລູກຄ້າອີກຄັ້ງ.`,
      });
      toast.error(`ບໍ່ພົບຂໍ້ມູນນັດໝາຍ: "${raw}"`);
    }
  };

  // Appointments on Selected Day for the Grid
  const dayAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const aptD = new Date(apt.startTime);
      const yyyy = aptD.getFullYear();
      const mm = String(aptD.getMonth() + 1).padStart(2, "0");
      const dd = String(aptD.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      return dateStr === selectedDate;
    });
  }, [appointments, selectedDate]);

  // Summary Metrics
  const todayStr = useMemo(() => {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const todayCount = appointments.filter((apt) => {
    const d = new Date(apt.startTime);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}` === todayStr;
  }).length;

  const scheduledCount = appointments.filter((a) => a.status === "SCHEDULED").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const cancelledCount = appointments.filter((a) => a.status === "CANCELLED").length;

  // Format Lao readable date
  const formattedSelectedDate = useMemo(() => {
    try {
      const parts = selectedDate.split("-");
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayNames = ["ວັນອາທິດ", "ວັນຈັນ", "ວັນອັງຄານ", "ວັນພຸດ", "ວັນພະຫັດ", "ວັນສຸກ", "ວັນເສົາ"];
      const monthNames = [
        "ມັງກອນ", "ກຸມພາ", "ມີນາ", "ເມສາ", "ພຶດສະພາ", "ມິຖຸນາ",
        "ກໍລະກົດ", "ສິງຫາ", "ກັນຍາ", "ຕຸລາ", "ພະຈິກ", "ທັນວາ"
      ];
      return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-16">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-600 to-blue-700 shadow-xl shadow-cyan-500/20 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                ປະຕິທິນຈອງນັດໝາຍ
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                Booking Calendar
              </span>
            </div>
            <p className="text-zinc-400 mt-1 text-xs sm:text-sm">
              ຈັດການຕາຕະລາງນັດໝາຍລູກຄ້າ, ແບ່ງຕາມພະນັກງານ ແລະ ຫ້ອງບໍລິການ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 active:scale-95"
            title="ສະແກນກວດສອບໃບນັດໝາຍ"
          >
            <Camera className="w-4 h-4 stroke-[2]" />
            <span>ກ້ອງສະແກນ</span>
          </button>
          <button
            onClick={() => openCreateModal()}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>ສ້າງນັດໝາຍໃໝ່</span>
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
            title="ຈັດການພະນັກງານ ແລະ ຫ້ອງ"
          >
            <Users className="w-4 h-4 stroke-[1.75]" />
            <span className="hidden md:inline">ຊັບພະຍາກອນ</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ນັດໝາຍມື້ນີ້</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1.5 font-mono">
                {todayCount} <span className="text-xs font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
              <CalendarDays className="w-5 h-5 stroke-[1.75]" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">ນັດໝາຍທັງໝົດໃນວັນທີປັດຈຸບັນ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ລໍຖ້າຮັບບໍລິການ</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-1.5 font-mono">
                {scheduledCount} <span className="text-xs font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <Clock className="w-5 h-5 stroke-[1.75]" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">ຄິວທີ່ລໍຖ້າໃຫ້ບໍລິການ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ສຳເລັດແລ້ວ</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1.5 font-mono">
                {completedCount} <span className="text-xs font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-5 h-5 stroke-[1.75]" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">ບໍລິການສຳເລັດຮຽບຮ້ອຍ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຊັບພະຍາກອນ</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1.5 font-mono">
                {resources.length} <span className="text-xs font-normal text-zinc-500">ຄົນ/ຫ້ອງ</span>
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <Users className="w-5 h-5 stroke-[1.75]" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            ພະນັກງານ: {resources.filter((r) => r.type === "STAFF").length} • ຫ້ອງ: {resources.filter((r) => r.type === "ROOM").length}
          </p>
        </div>
      </div>

      {/* ── View Switcher Bar & Filters ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 w-full md:w-auto overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab("grid")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "grid"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>ຕາຕະລາງເວລາ (Time Grid)</span>
          </button>
          <button
            onClick={() => setActiveTab("kanban")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "kanban"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>ບອດສະຖານະ (Kanban)</span>
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "table"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>ລາຍການທັງໝົດ (List)</span>
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "resources"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <Users className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>ຊັບພະຍາກອນ (Resources)</span>
          </button>
        </div>

        {/* Global Search and Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
            <input
              type="text"
              placeholder="ພິມລະຫັດບິນນັດໝາຍ, ຊື່, ເບີໂທ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!e.target.value.trim()) setInspectedApptResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim()) {
                  e.preventDefault();
                  handleInspectAppointmentByQuery(search);
                }
              }}
              className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {search.trim() && (
            <button
              type="button"
              onClick={() => handleInspectAppointmentByQuery(search)}
              className="px-2.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
            >
              ກວດສອບບິນ
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-colors shrink-0"
            title="ສະແກນ QR / ບາໂຄດໃບນັດໝາຍ"
          >
            <Camera className="w-4 h-4 stroke-[1.75]" />
          </button>

          <button
            onClick={() => {
              fetchAppointments();
              fetchResources();
              toast.success("ໂຫຼດຂໍ້ມູນໃໝ່ຮຽບຮ້ອຍແລ້ວ");
            }}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors shrink-0"
            title="ໂຫຼດຂໍ້ມູນໃໝ່"
          >
            <RefreshCw className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>
      </div>

      {/* -- Scanned / Searched Appointment Expiry Banner -- */}
      {(inspectedApptResult ||
        (search.trim().length >= 3 && filteredAppointments.length === 1)) && (
        <BillVerifyResultCard
          data={
            inspectedApptResult ||
            buildApptInspectionResult(filteredAppointments[0])
          }
          onClose={() => {
            setInspectedApptResult(null);
            setSearch("");
          }}
        />
      )}

      {/* ── TAB 1: TIME GRID VIEW ── */}
      {activeTab === "grid" && (
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl space-y-4 p-4 sm:p-5">
          {/* Day Navigation Controller */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handlePrevDay}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                title="ວັນກ່ອນໜ້າ"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2]" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/30 text-xs font-bold transition-colors"
              >
                ມື້ນີ້
              </button>
              <button
                onClick={handleNextDay}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                title="ວັນຖັດໄປ"
              >
                <ChevronRight className="w-4 h-4 stroke-[2]" />
              </button>

              <div className="ml-2">
                <span className="text-sm sm:text-base font-extrabold text-white block">
                  {formattedSelectedDate}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-zinc-400">ເລືອກວັນທີ:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Time Slot Matrix */}
          {resources.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Users className="w-12 h-12 text-zinc-600 mb-3 stroke-[1.5]" />
              <h3 className="text-base font-bold text-white">ຍັງບໍ່ມີຊັບພະຍາກອນ (ພະນັກງານ ຫຼື ຫ້ອງບໍລິການ)</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                ກະລຸນາເພີ່ມພະນັກງານ ຫຼື ຫ້ອງບໍລິການກ່ອນ ເພື່ອເລີ່ມຕົ້ນຈັດຕາຕະລາງນັດໝາຍ
              </p>
              <button
                onClick={() => setActiveTab("resources")}
                className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                + ເພີ່ມຊັບພະຍາກອນທຳອິດ
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar border border-zinc-800/80 rounded-xl">
              <table className="w-full border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-800 text-left">
                    <th className="p-3 w-24 text-center text-xs font-bold text-zinc-400 border-r border-zinc-800">
                      ເວລາ
                    </th>
                    {resources.map((res) => (
                      <th key={res.id} className="p-3 text-left border-r border-zinc-800/60 min-w-[180px]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                res.type === "STAFF"
                                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              }`}
                            >
                              {res.type === "STAFF" ? <User className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <span className="font-bold text-white text-xs block truncate">{res.name}</span>
                              <span className="text-[10px] text-zinc-400 block font-normal">
                                {res.type === "STAFF" ? "ພະນັກງານ" : "ຫ້ອງບໍລິການ"}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => openCreateModal(res.id, "09:00", selectedDate)}
                            className="p-1 rounded-md text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                            title={`ຈອງນັດໝາຍສຳລັບ ${res.name}`}
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {HOURS.map((hourStr) => {
                    const currentHourNum = parseInt(hourStr.split(":")[0], 10);

                    return (
                      <tr key={hourStr} className="hover:bg-zinc-950/30 transition-colors">
                        {/* Time Label Column */}
                        <td className="p-3 text-center text-xs font-mono font-bold text-zinc-400 border-r border-zinc-800 bg-zinc-950/40 select-none">
                          {hourStr}
                        </td>

                        {/* Resource Columns for this hour */}
                        {resources.map((res) => {
                          // Find appointments for this resource that fall in this hour
                          const slotApts = dayAppointments.filter((apt) => {
                            if (apt.resourceId !== res.id) return false;
                            const startH = new Date(apt.startTime).getHours();
                            return startH === currentHourNum;
                          });

                          return (
                            <td
                              key={res.id}
                              className="p-1.5 border-r border-zinc-800/60 align-top relative min-h-[56px] group"
                            >
                              {slotApts.length > 0 ? (
                                <div className="space-y-1.5">
                                  {slotApts.map((apt) => {
                                    const start = new Date(apt.startTime);
                                    const end = new Date(apt.endTime);
                                    const timeRange = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")} - ${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;

                                    const isCompleted = apt.status === "COMPLETED";
                                    const isCancelled = apt.status === "CANCELLED";

                                    return (
                                      <div
                                        key={apt.id}
                                        className={`p-2.5 rounded-xl border text-xs transition-all shadow-md group/card relative ${
                                          isCompleted
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                            : isCancelled
                                            ? "bg-zinc-800/40 border-zinc-700/50 text-zinc-500 line-through"
                                            : "bg-cyan-500/15 border-cyan-500/40 text-cyan-200 hover:border-cyan-400"
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-1">
                                          <div className="min-w-0">
                                            <span className="font-extrabold text-white block truncate">
                                              {apt.customerName}
                                            </span>
                                            {apt.customerPhone && (
                                              <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono mt-0.5">
                                                <Phone className="w-2.5 h-2.5 shrink-0" />
                                                {apt.customerPhone}
                                              </span>
                                            )}
                                            <span className="text-[10px] text-zinc-300 font-mono block mt-1">
                                              {timeRange}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1 shrink-0">
                                            <button
                                              onClick={() => openEditModal(apt)}
                                              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                              title="ແກ້ໄຂນັດໝາຍ"
                                            >
                                              <Edit className="w-3 h-3 stroke-[2]" />
                                            </button>
                                            <button
                                              onClick={() => setPrintAppt(apt)}
                                              className="p-1 rounded text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                                              title="ພິມໃບນັດໝາຍ"
                                            >
                                              <Printer className="w-3 h-3 stroke-[2]" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Status quick toggle */}
                                        <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between">
                                          <span
                                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                              isCompleted
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : isCancelled
                                                ? "bg-zinc-700 text-zinc-400"
                                                : "bg-cyan-500/20 text-cyan-300"
                                            }`}
                                          >
                                            {isCompleted ? "ສຳເລັດ" : isCancelled ? "ຍົກເລີກ" : "ລໍຖ້າ"}
                                          </span>

                                          {!isCompleted && !isCancelled && (
                                            <div className="flex gap-1">
                                              <button
                                                onClick={() => handleUpdateStatus(apt.id, "COMPLETED")}
                                                className="px-1.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded text-[9px] font-bold transition-colors"
                                              >
                                                ຈົບງານ
                                              </button>
                                              <button
                                                onClick={() => handleUpdateStatus(apt.id, "CANCELLED")}
                                                className="px-1.5 py-0.5 bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 rounded text-[9px] font-bold transition-colors"
                                              >
                                                ຍົກເລີກ
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <button
                                  onClick={() => openCreateModal(res.id, hourStr, selectedDate)}
                                  className="w-full h-11 rounded-lg border border-transparent hover:border-dashed hover:border-zinc-700 hover:bg-zinc-800/30 flex items-center justify-center text-[10px] text-transparent group-hover:text-zinc-500 transition-all font-medium"
                                >
                                  + ຈອງເວລານີ້
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: KANBAN BOARD VIEW ── */}
      {activeTab === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: SCHEDULED */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 backdrop-blur-xl flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="font-bold text-white text-sm">ລໍຖ້າຮັບບໍລິການ (Scheduled)</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">
                {filteredAppointments.filter((a) => a.status === "SCHEDULED").length}
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar max-h-[650px] pr-1">
              {filteredAppointments
                .filter((a) => a.status === "SCHEDULED")
                .map((apt) => (
                  <AppointmentKanbanCard
                    key={apt.id}
                    apt={apt}
                    onEdit={openEditModal}
                    onStatusChange={handleUpdateStatus}
                    onDelete={handleDeleteAppointment}
                    onPrint={(item) => setPrintAppt(item)}
                  />
                ))}

              {filteredAppointments.filter((a) => a.status === "SCHEDULED").length === 0 && (
                <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500 text-xs">
                  ບໍ່ມີລາຍການລໍຖ້າຮັບບໍລິການ
                </div>
              )}
            </div>
          </div>

          {/* Column 2: COMPLETED */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 backdrop-blur-xl flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h3 className="font-bold text-white text-sm">ສຳເລັດແລ້ວ (Completed)</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                {filteredAppointments.filter((a) => a.status === "COMPLETED").length}
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar max-h-[650px] pr-1">
              {filteredAppointments
                .filter((a) => a.status === "COMPLETED")
                .map((apt) => (
                  <AppointmentKanbanCard
                    key={apt.id}
                    apt={apt}
                    onEdit={openEditModal}
                    onStatusChange={handleUpdateStatus}
                    onDelete={handleDeleteAppointment}
                    onPrint={(item) => setPrintAppt(item)}
                  />
                ))}

              {filteredAppointments.filter((a) => a.status === "COMPLETED").length === 0 && (
                <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500 text-xs">
                  ຍັງບໍ່ມີລາຍການທີ່ສຳເລັດ
                </div>
              )}
            </div>
          </div>

          {/* Column 3: CANCELLED */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 backdrop-blur-xl flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <h3 className="font-bold text-white text-sm">ຍົກເລີກແລ້ວ (Cancelled)</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-xs font-bold">
                {filteredAppointments.filter((a) => a.status === "CANCELLED").length}
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar max-h-[650px] pr-1">
              {filteredAppointments
                .filter((a) => a.status === "CANCELLED")
                .map((apt) => (
                  <AppointmentKanbanCard
                    key={apt.id}
                    apt={apt}
                    onEdit={openEditModal}
                    onStatusChange={handleUpdateStatus}
                    onDelete={handleDeleteAppointment}
                    onPrint={(item) => setPrintAppt(item)}
                  />
                ))}

              {filteredAppointments.filter((a) => a.status === "CANCELLED").length === 0 && (
                <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500 text-xs">
                  ບໍ່ມີລາຍການທີ່ຖືກຍົກເລີກ
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: TABLE LIST VIEW ── */}
      {activeTab === "table" && (
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">ກັ່ນຕອງຊັບພະຍາກອນ:</span>
              <select
                value={selectedResourceFilter}
                onChange={(e) => setSelectedResourceFilter(e.target.value)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">ທັງໝົດ (All Resources)</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type === "STAFF" ? "ພະນັກງານ" : "ຫ້ອງ"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">ສະຖານະ:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">ທັງໝົດ (All Status)</option>
                <option value="SCHEDULED">ລໍຖ້າຮັບບໍລິການ (Scheduled)</option>
                <option value="COMPLETED">ສຳເລັດແລ້ວ (Completed)</option>
                <option value="CANCELLED">ຍົກເລີກແລ້ວ (Cancelled)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 text-zinc-400 font-bold border-b border-zinc-800">
                  <th className="p-3.5">ຊື່ລູກຄ້າ</th>
                  <th className="p-3.5">ເບີໂທ</th>
                  <th className="p-3.5">ຊັບພະຍາກອນ</th>
                  <th className="p-3.5">ວັນທີ & ເວລາ</th>
                  <th className="p-3.5">ໄລຍະເວລາ</th>
                  <th className="p-3.5 text-center">ສະຖານະ</th>
                  <th className="p-3.5 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-500">
                      ບໍ່ພົບຂໍ້ມູນນັດໝາຍທີ່ກົງກັບເງື່ອນໄຂ
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt) => {
                    const start = new Date(apt.startTime);
                    const end = new Date(apt.endTime);
                    const durationMins = Math.round((end.getTime() - start.getTime()) / 60000);

                    return (
                      <tr key={apt.id} className="hover:bg-zinc-800/25 transition-colors">
                        <td className="p-3.5 font-bold text-white">{apt.customerName}</td>
                        <td className="p-3.5 font-mono text-zinc-300">{apt.customerPhone || "-"}</td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200">
                            {apt.resource?.type === "STAFF" ? (
                              <User className="w-3 h-3 text-purple-400" />
                            ) : (
                              <MapPin className="w-3 h-3 text-orange-400" />
                            )}
                            {apt.resource?.name || "ບໍ່ລະບຸ"}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-zinc-200">{start.toLocaleDateString()}</div>
                          <div className="text-[11px] text-cyan-400 font-mono">
                            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                            {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-zinc-300">{durationMins} ນາທີ</td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                              apt.status === "COMPLETED"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : apt.status === "CANCELLED"
                                ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                : "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                            }`}
                          >
                            {apt.status === "COMPLETED"
                              ? "ສຳເລັດ"
                              : apt.status === "CANCELLED"
                              ? "ຍົກເລີກ"
                              : "ລໍຖ້າຮັບບໍລິການ"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPrintAppt(apt)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                              title="ພິມໃບນັດໝາຍ"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(apt)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="ແກ້ໄຂ"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAppointment(apt.id, apt.customerName)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="ລົບ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: RESOURCES MANAGEMENT ── */}
      {activeTab === "resources" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-right-4 duration-300">
          {/* Add Resource Form (4 cols) */}
          <div className="lg:col-span-4 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Users className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">ເພີ່ມຊັບພະຍາກອນໃໝ່</h3>
                <p className="text-xs text-zinc-400">ພະນັກງານ, ຊ່າງ, ທ່ານໝໍ ຫຼື ຫ້ອງບໍລິການ</p>
              </div>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  ຊື່ຊັບພະຍາກອນ (Name) *
                </label>
                <input
                  type="text"
                  required
                  value={resName}
                  onChange={(e) => setResName(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ທ່ານໝໍ ສົມສັກ, ຊ່າງ ໄຊຍະສິດ, ຫ້ອງ VIP 1..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  ປະເພດຊັບພະຍາກອນ (Type) *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setResType("STAFF")}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      resType === "STAFF"
                        ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-md shadow-purple-500/10"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <User className="w-4 h-4 stroke-[1.75]" />
                    <span>ພະນັກງານ / ບຸກຄະລາກອນ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResType("ROOM")}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      resType === "ROOM"
                        ? "bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-md shadow-orange-500/10"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <MapPin className="w-4 h-4 stroke-[1.75]" />
                    <span>ຫ້ອງ / ສະຖານທີ່</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingRes}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isSubmittingRes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>ບັນທຶກຊັບພະຍາກອນ</span>
                </button>
              </div>
            </form>
          </div>

          {/* Resource List (8 cols) */}
          <div className="lg:col-span-8 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-base">ລາຍການຊັບພະຍາກອນທັງໝົດ</h3>
                <p className="text-xs text-zinc-400">ຈຳນວນທັງໝົດ: {resources.length} ລາຍການ</p>
              </div>
            </div>

            <div className="p-4 divide-y divide-zinc-800/50 overflow-y-auto custom-scrollbar max-h-[600px]">
              {isLoadingResources ? (
                <div className="p-12 text-center text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500 mb-2" />
                  <span>ກຳລັງໂຫຼດຂໍ້ມູນ...</span>
                </div>
              ) : resources.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 text-sm">
                  ຍັງບໍ່ມີຊັບພະຍາກອນໃດໆ. ກະລຸນາເພີ່ມໃນຟອມດ້ານຊ້າຍ.
                </div>
              ) : (
                resources.map((res) => {
                  const aptCount = appointments.filter((a) => a.resourceId === res.id).length;

                  return (
                    <div key={res.id} className="py-3.5 flex items-center justify-between hover:bg-zinc-800/20 px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            res.type === "STAFF"
                              ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                              : "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                          }`}
                        >
                          {res.type === "STAFF" ? (
                            <User className="w-5 h-5 stroke-[1.75]" />
                          ) : (
                            <MapPin className="w-5 h-5 stroke-[1.75]" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm leading-tight">{res.name}</h4>
                          <span className="text-[11px] text-zinc-400">
                            {res.type === "STAFF" ? "ພະນັກງານ (Staff)" : "ຫ້ອງບໍລິການ (Room)"} • {aptCount} ນັດໝາຍ
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openCreateModal(res.id, "09:00", selectedDate)}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-600/15 hover:bg-cyan-600/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3 stroke-[2]" />
                          <span>ຈອງ</span>
                        </button>
                        <button
                          onClick={() => handleDeleteResource(res.id, res.name)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="ລົບຊັບພະຍາກອນ"
                        >
                          <Trash2 className="w-4 h-4 stroke-[1.75]" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT APPOINTMENT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <CalendarIcon className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {editingAppointment ? "ແກ້ໄຂນັດໝາຍ" : "ສ້າງນັດໝາຍໃໝ່"}
                  </h2>
                  <p className="text-xs text-zinc-400">ກະລຸນາປ້ອນຂໍ້ມູນລູກຄ້າ ແລະ ຊ່ວງເວລາທີ່ຕ້ອງການຈອງ</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1"
              >
                <XCircle className="w-6 h-6 stroke-[1.75]" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAppointment} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
              {/* Conflict Alert Warning */}
              {hasConflict && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 stroke-[1.75]" />
                  <span>
                    <strong>ແຈ້ງເຕືອນ:</strong> ຊັບພະຍາກອນນີ້ມີນັດໝາຍຊ້ອນກັນໃນຊ່ວງເວລາດັ່ງກ່າວແລ້ວ! ກະລຸນາກວດສອບ ຫຼື ປ່ຽນເວລາ.
                  </span>
                </div>
              )}

              {/* Resource Select */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  ຊັບພະຍາກອນ (ພະນັກງານ / ຫ້ອງບໍລິການ) *
                </label>
                <select
                  required
                  value={selectedResId}
                  onChange={(e) => setSelectedResId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="">-- ເລືອກຊັບພະຍາກອນ --</option>
                  {resources.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.name} ({res.type === "STAFF" ? "ພະນັກງານ" : "ຫ້ອງ"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    ຊື່ລູກຄ້າ (Customer Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="ຕົວຢ່າງ: ທ້າວ ຄຳຫຼ້າ ວົງສາ..."
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    ເບີໂທຕິດຕໍ່ (Phone)
                  </label>
                  <input
                    type="tel"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="020 xxxx xxxx"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    ວັນທີນັດໝາຍ *
                  </label>
                  <input
                    type="date"
                    required
                    value={aptDate}
                    onChange={(e) => setAptDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    ເວລາເລີ່ມຕົ້ນ *
                  </label>
                  <input
                    type="time"
                    required
                    value={aptTime}
                    onChange={(e) => setAptTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Duration and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    ໄລຍະເວລາ (Duration)
                  </label>
                  <select
                    value={aptDuration}
                    onChange={(e) => setAptDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    ສະຖານະ (Status)
                  </label>
                  <select
                    value={aptStatus}
                    onChange={(e) => setAptStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="SCHEDULED">ລໍຖ້າຮັບບໍລິການ (Scheduled)</option>
                    <option value="COMPLETED">ສຳເລັດແລ້ວ (Completed)</option>
                    <option value="CANCELLED">ຍົກເລີກແລ້ວ (Cancelled)</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-zinc-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                >
                  ຍົກເລີກ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApt}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingApt && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingAppointment ? "ບັນທຶກການແກ້ໄຂ" : "ຢືນຢັນການຈອງ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PRINT APPOINTMENT SLIP MODAL ── */}
      {printAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-cyan-400 stroke-[1.75]" />
                <span>ໃບນັດໝາຍລູກຄ້າ</span>
              </h3>
              <button onClick={() => setPrintAppt(null)} className="text-zinc-500 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Paper Box */}
            <div id="print-slip" className="p-6 bg-white text-zinc-950 space-y-4 m-4 rounded-2xl shadow-inner">
              <div className="text-center pb-3 border-b-2 border-dashed border-zinc-300">
                <h2 className="text-base font-extrabold uppercase tracking-wide">ໃບນັດໝາຍການບໍລິການ</h2>
                <p className="text-[11px] text-zinc-500">APPOINTMENT CONFIRMATION SLIP</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">ຊື່ລູກຄ້າ:</span>
                  <strong className="text-zinc-900">{printAppt.customerName}</strong>
                </div>
                {printAppt.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">ເບີໂທ:</span>
                    <span className="font-mono">{printAppt.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">ຊັບພະຍາກອນ / ຜູ້ໃຫ້ບໍລິການ:</span>
                  <strong>{printAppt.resource?.name || "-"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">ວັນທີນັດໝາຍ:</span>
                  <span className="font-bold">{new Date(printAppt.startTime).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">ເວລາ:</span>
                  <span className="font-mono font-bold">
                    {new Date(printAppt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {new Date(printAppt.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">ສະຖານະ:</span>
                  <span className="font-bold text-cyan-700">
                    {printAppt.status === "COMPLETED" ? "ສຳເລັດແລ້ວ" : printAppt.status === "CANCELLED" ? "ຍົກເລີກ" : "ຢືນຢັນນັດໝາຍແລ້ວ"}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-dashed border-zinc-300 text-center text-[10px] text-zinc-500">
                <p>ກະລຸນາມາຮອດກ່ອນເວລານັດໝາຍ 10-15 ນາທີ</p>
                <p className="font-mono mt-1">ID: {printAppt.id.slice(-6).toUpperCase()}</p>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 flex gap-2.5 bg-zinc-950/60">
              <button
                type="button"
                onClick={() => setPrintAppt(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
              >
                ປິດ
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 stroke-[2]" />
                <span>ພິມໃບນັດ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={(code) => {
          handleInspectAppointmentByQuery(code);
          setIsCameraScannerOpen(false);
        }}
        title="ສະແກນກວດສອບໃບນັດໝາຍ (Scan Appointment)"
        subtitle="ສ່ອງກ້ອງໃສ່ QR Code / ບາໂຄດໃບນັດໝາຍ ເພື່ອກວດສອບວ່າໝົດອາຍຸ ຫຼື ຍັງ"
        placeholder="ຍິງເຄື່ອງສະແກນ ຫຼື ພິມລະຫັດ #APT-..."
      />
    </div>
  );
}

// ─── Sub-component: Kanban Card ───
function AppointmentKanbanCard({
  apt,
  onEdit,
  onStatusChange,
  onDelete,
  onPrint,
}: {
  apt: Appointment;
  onEdit: (apt: Appointment) => void;
  onStatusChange: (id: string, status: "SCHEDULED" | "COMPLETED" | "CANCELLED") => void;
  onDelete: (id: string, name: string) => void;
  onPrint: (apt: Appointment) => void;
}) {
  const start = new Date(apt.startTime);
  const end = new Date(apt.endTime);
  const isPast = end < new Date() && apt.status === "SCHEDULED";

  return (
    <div
      className={`bg-zinc-950/70 border ${
        isPast
          ? "border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
          : "border-zinc-800/90"
      } rounded-2xl p-4 shadow-sm hover:border-cyan-500/50 transition-all group relative`}
    >
      {isPast && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[9px] font-black tracking-wider uppercase shadow">
          ກາຍເວລາ
        </span>
      )}

      {/* Card Header */}
      <div className="flex justify-between items-start mb-2.5">
        <div>
          <h4 className="font-extrabold text-white text-sm leading-snug">{apt.customerName}</h4>
          {apt.customerPhone && (
            <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3 text-cyan-400 stroke-[1.75]" />
              <span>{apt.customerPhone}</span>
            </div>
          )}
        </div>

        <div className="text-right">
          <span className="text-xs font-extrabold text-cyan-300 font-mono block">
            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="text-[10px] text-zinc-500 block font-mono">{start.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Resource badge */}
      <div className="bg-zinc-900 rounded-xl p-2 mb-3 flex items-center gap-2 border border-zinc-800/80">
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
            apt.resource?.type === "STAFF"
              ? "bg-purple-500/20 text-purple-400"
              : "bg-orange-500/20 text-orange-400"
          }`}
        >
          {apt.resource?.type === "STAFF" ? (
            <User className="w-3.5 h-3.5 stroke-[1.75]" />
          ) : (
            <MapPin className="w-3.5 h-3.5 stroke-[1.75]" />
          )}
        </div>
        <span className="text-xs font-semibold text-zinc-200 truncate">
          {apt.resource?.name || "ບໍ່ລະບຸຊັບພະຍາກອນ"}
        </span>
      </div>

      {/* Card Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
        <div className="flex items-center gap-1">
          {apt.status === "SCHEDULED" && (
            <>
              <button
                onClick={() => onStatusChange(apt.id, "COMPLETED")}
                className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3 stroke-[2]" /> ສຳເລັດ
              </button>
              <button
                onClick={() => onStatusChange(apt.id, "CANCELLED")}
                className="px-2 py-1 bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 rounded-lg text-[10px] font-bold transition-colors"
              >
                ຍົກເລີກ
              </button>
            </>
          )}

          {apt.status === "COMPLETED" && (
            <span className="text-[10px] font-bold text-emerald-400/70 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 stroke-[2]" /> ສຳເລັດແລ້ວ
            </span>
          )}

          {apt.status === "CANCELLED" && (
            <button
              onClick={() => onStatusChange(apt.id, "SCHEDULED")}
              className="px-2 py-1 bg-zinc-800 hover:bg-cyan-500/20 text-zinc-400 hover:text-cyan-300 rounded-lg text-[10px] font-bold transition-colors"
            >
              ຄືນສະຖານະ
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPrint(apt)}
            className="p-1.5 text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 rounded-lg transition-colors"
            title="ພິມໃບນັດ"
          >
            <Printer className="w-3.5 h-3.5 stroke-[1.75]" />
          </button>
          <button
            onClick={() => onEdit(apt)}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="ແກ້ໄຂ"
          >
            <Edit className="w-3.5 h-3.5 stroke-[1.75]" />
          </button>
          <button
            onClick={() => onDelete(apt.id, apt.customerName)}
            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="ລົບ"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[1.75]" />
          </button>
        </div>
      </div>
    </div>
  );
}
