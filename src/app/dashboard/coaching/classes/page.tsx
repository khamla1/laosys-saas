"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Search, Users, CalendarDays, UserSquare2, CheckCircle,
  XCircle, Trash2, Edit, UserPlus, CreditCard, LayoutGrid,
  Loader2, RefreshCw, ListFilter, UserMinus, Sparkles, GraduationCap,
  Clock, DollarSign, Check, Phone, Printer, QrCode, Copy, ExternalLink,
  Download, Share2, FileSpreadsheet, Eye, MessageCircle, ShieldCheck
} from "lucide-react";
import { OfficialEnrollmentReceipt } from "@/components/OfficialEnrollmentReceipt";
import { toast } from "sonner";

interface CoachingClass {
  id: string;
  name: string;
  description?: string | null;
  coachName: string;
  maxStudents: number;
  currentStudents: number;
  scheduleInfo: string;
  price: number;
  status: "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";
  createdAt?: string;
  updatedAt?: string;
}

export default function CoachingClassesPage() {
  const [classes, setClasses] = useState<CoachingClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<CoachingClass | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coachName, setCoachName] = useState("");
  const [maxStudents, setMaxStudents] = useState("10");
  const [scheduleInfo, setScheduleInfo] = useState("");
  const [price, setPrice] = useState("0");
  const [status, setStatus] = useState<"OPEN" | "FULL" | "COMPLETED" | "CANCELLED">("OPEN");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR Code & Self-Enrollment Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrClass, setQrClass] = useState<CoachingClass | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Student Roster & Bill Preview State
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<CoachingClass | null>(null);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("ALL");

  // Add Student Manually Modal State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentNote, setNewStudentNote] = useState("");
  const [newStudentPrice, setNewStudentPrice] = useState("");
  const [isSubmittingAddStudent, setIsSubmittingAddStudent] = useState(false);

  // Bill Preview Modal State
  const [showBillModal, setShowBillModal] = useState(false);
  const [previewBillData, setPreviewBillData] = useState<any | null>(null);

  // Enroll Student Modal State
  const [enrollModalClass, setEnrollModalClass] = useState<CoachingClass | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [enrollNote, setEnrollNote] = useState("");
  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState(false);

  // ── Student Roster & Official Bill Handlers ──
  const openStudentsRoster = async (c: CoachingClass) => {
    setSelectedClassForStudents(c);
    setStudentSearch("");
    setStudentStatusFilter("ALL");
    setShowStudentsModal(true);
    fetchClassStudents(c.id);
  };

  const fetchClassStudents = async (classId: string) => {
    setIsLoadingStudents(true);
    try {
      const res = await fetch(`/api/dashboard/classes/${classId}/enrollments`);
      const data = await res.json();
      if (res.ok && data.enrollments) {
        setStudentsList(data.enrollments);
      } else {
        setStudentsList([]);
      }
    } catch {
      toast.error("ບໍ່ສາມາດໂຫຼດລາຍຊື່ນັກຮຽນໄດ້");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleOpenAddStudent = () => {
    setNewStudentName("");
    setNewStudentPhone("");
    setNewStudentNote("");
    setNewStudentPrice(String(selectedClassForStudents?.price || 0));
    setShowAddStudentModal(true);
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForStudents) return;
    if (!newStudentName.trim() || !newStudentPhone.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ ແລະ ເບີໂທຕິດຕໍ່");
    }

    setIsSubmittingAddStudent(true);
    try {
      const res = await fetch(`/api/dashboard/classes/${selectedClassForStudents.id}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: newStudentName.trim(),
          studentPhone: newStudentPhone.trim(),
          note: newStudentNote.trim(),
          price: parseFloat(newStudentPrice) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`ເພີ່ມນັກຮຽນ "${newStudentName}" ເຂົ້າຄລາສຮຽນສຳເລັດ!`);
        setShowAddStudentModal(false);
        fetchClassStudents(selectedClassForStudents.id);
        fetchClasses();
      } else {
        toast.error(data.error || "ການເພີ່ມນັກຮຽນລົ້ມເຫຼວ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເພີ່ມນັກຮຽນ");
    } finally {
      setIsSubmittingAddStudent(false);
    }
  };

  const handleDeleteStudent = async (enrollmentId: string, studentName: string) => {
    if (!selectedClassForStudents) return;
    if (!(await askConfirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຖອນລາຍຊື່ "${studentName}" ອອກຈາກຄລາສຮຽນນີ້?`))) {
      return;
    }

    try {
      const res = await fetch(
        `/api/dashboard/classes/${selectedClassForStudents.id}/enrollments?enrollmentId=${enrollmentId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        toast.success(`ຖອນລາຍຊື່ "${studentName}" ສຳເລັດແລ້ວ!`);
        fetchClassStudents(selectedClassForStudents.id);
        fetchClasses();
      } else {
        toast.error("ບໍ່ສາມາດຖອນລາຍຊື່ໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການຖອນລາຍຊື່");
    }
  };

  const handleToggleStudentStatus = async (enrollmentId: string, currentStatus: string) => {
    if (!selectedClassForStudents) return;
    const nextStatus = currentStatus === "CONFIRMED" ? "ATTENDED" : "CONFIRMED";
    try {
      const res = await fetch(`/api/dashboard/classes/${selectedClassForStudents.id}/enrollments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          status: nextStatus,
        }),
      });

      if (res.ok) {
        toast.success(
          nextStatus === "ATTENDED"
            ? "ໝາຍວ່າ: ເຂົ້າຮຽນແລ້ວ (Attended)"
            : "ໝາຍວ່າ: ຢືນຢັນບ່ອນນັ່ງ (Confirmed)"
        );
        fetchClassStudents(selectedClassForStudents.id);
      }
    } catch {
      toast.error("ບໍ່ສາມາດອັບເດດສະຖານະໄດ້");
    }
  };

  const handleOpenStudentBill = (student: any) => {
    setPreviewBillData({
      receiptNo: `ENR-${student.id.slice(-6).toUpperCase()}`,
      enrolledAt: student.enrolledAt,
      studentName: student.studentName,
      studentPhone: student.studentPhone,
      note: student.note,
      className: selectedClassForStudents?.name || student.className || "ຄລາສຮຽນ",
      coachName: selectedClassForStudents?.coachName,
      scheduleInfo: selectedClassForStudents?.scheduleInfo,
      price: student.price ?? selectedClassForStudents?.price ?? 0,
      status: student.status || "CONFIRMED",
      organization: {
        name: "ສູນກິລາ ແລະ ສະຖາບັນຝຶກອົບຮົມ",
      },
      verificationUrl:
        typeof window !== "undefined"
          ? `${window.location.origin}/enroll/${selectedClassForStudents?.id}`
          : undefined,
    });
    setShowBillModal(true);
  };

  const handleExportCsv = () => {
    if (!selectedClassForStudents || studentsList.length === 0) {
      return toast.error("ບໍ່ມີຂໍ້ມູນນັກຮຽນສຳລັບສົ່ງອອກ");
    }

    const headers = ["No", "Student Name", "Phone", "Class", "Fee (LAK)", "Note", "Status", "Enrolled Date"];
    const rows = studentsList.map((st, i) => [
      i + 1,
      `"${st.studentName.replace(/"/g, '""')}"`,
      `"${st.studentPhone}"`,
      `"${(selectedClassForStudents.name || "").replace(/"/g, '""')}"`,
      st.price || 0,
      `"${(st.note || "").replace(/"/g, '""')}"`,
      st.status,
      new Date(st.enrolledAt).toLocaleDateString("lo-LA"),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Students_${selectedClassForStudents.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("ສົ່ງອອກໄຟລ໌ CSV ສຳເລັດແລ້ວ!");
  };

  const openQrModal = (c: CoachingClass) => {
    setQrClass(c);
    setCopiedLink(false);
    setShowQrModal(true);
  };

  const getEnrollUrl = (classId: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/enroll/${classId}`;
    }
    return `/enroll/${classId}`;
  };

  const handleCopyClassLink = (classId: string) => {
    const url = getEnrollUrl(classId);
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success("ຄັດລອກລິ້ງຄ໌ສະໝັກຮຽນສຳເລັດແລ້ວ!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDownloadQr = (c: CoachingClass) => {
    const url = getEnrollUrl(c.id);
    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=15&data=${encodeURIComponent(url)}`;
    const a = document.createElement("a");
    a.href = qrImg;
    a.download = `QR-${c.name.replace(/\s+/g, "_")}.png`;
    a.target = "_blank";
    a.click();
    toast.success("ກຳລັງດາວໂຫຼດຮູບ QR Code...");
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dashboard/classes");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setClasses(data);
      }
    } catch {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນຄລາສຮຽນໄດ້");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingClass(null);
    setName("");
    setDescription("");
    setCoachName("");
    setMaxStudents("10");
    setScheduleInfo("");
    setPrice("0");
    setStatus("OPEN");
    setShowModal(true);
  };

  const openEditModal = (c: CoachingClass) => {
    setEditingClass(c);
    setName(c.name);
    setDescription(c.description || "");
    setCoachName(c.coachName);
    setMaxStudents(String(c.maxStudents));
    setScheduleInfo(c.scheduleInfo);
    setPrice(String(c.price));
    setStatus(c.status);
    setShowModal(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !coachName.trim() || !maxStudents || !scheduleInfo.trim()) {
      return toast.error("ກະລຸນາຕື່ມຂໍ້ມູນທີ່ຈຳເປັນໃຫ້ຄົບຖ້ວນ");
    }

    setIsSubmitting(true);
    try {
      if (editingClass) {
        const res = await fetch(`/api/dashboard/classes/${editingClass.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            coachName: coachName.trim(),
            maxStudents: parseInt(maxStudents, 10),
            scheduleInfo: scheduleInfo.trim(),
            price: parseFloat(price) || 0,
            status,
          }),
        });

        if (res.ok) {
          toast.success("ອັບເດດຂໍ້ມູນຄລາສຮຽນສຳເລັດແລ້ວ!");
          setShowModal(false);
          fetchClasses();
        } else {
          const err = await res.json();
          toast.error(err.error || "ການອັບເດດຄລາສຮຽນລົ້ມເຫຼວ");
        }
      } else {
        const res = await fetch("/api/dashboard/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            coachName: coachName.trim(),
            maxStudents: parseInt(maxStudents, 10),
            scheduleInfo: scheduleInfo.trim(),
            price: parseFloat(price) || 0,
          }),
        });

        if (res.ok) {
          toast.success("ເປີດຄລາສຮຽນໃໝ່ສຳເລັດແລ້ວ!");
          setShowModal(false);
          fetchClasses();
        } else {
          const err = await res.json();
          toast.error(err.error || "ການສ້າງຄລາສຮຽນລົ້ມເຫຼວ");
        }
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຄລາສຮຽນ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickEnroll = async (c: CoachingClass) => {
    if (c.currentStudents >= c.maxStudents) {
      return toast.error("ຄລາສຮຽນນີ້ມີນັກຮຽນເຕັມແລ້ວ!");
    }

    try {
      const res = await fetch(`/api/dashboard/classes/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ENROLL" }),
      });

      if (res.ok) {
        toast.success(`ລົງທະບຽນນັກຮຽນເຂົ້າ "${c.name}" ສຳເລັດແລ້ວ! (+1 ຄົນ)`);
        fetchClasses();
      } else {
        const err = await res.json();
        toast.error(err.error || "ການລົງທະບຽນລົ້ມເຫຼວ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລົງທະບຽນ");
    }
  };

  const handleUnenroll = async (c: CoachingClass) => {
    if (c.currentStudents <= 0) return;
    if (!(await askConfirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຖອນລາຍຊື່ນັກຮຽນອອກຈາກ "${c.name}"? (-1 ຄົນ)`))) {
      return;
    }

    try {
      const res = await fetch(`/api/dashboard/classes/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UNENROLL" }),
      });

      if (res.ok) {
        toast.success(`ຖອນລາຍຊື່ນັກຮຽນອອກຈາກ "${c.name}" ສຳເລັດ! (-1 ຄົນ)`);
        fetchClasses();
      } else {
        toast.error("ບໍ່ສາມາດຖອນລາຍຊື່ໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການຖອນລາຍຊື່");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/dashboard/classes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success("ປ່ຽນສະຖານະຄລາສຮຽນສຳເລັດແລ້ວ!");
        fetchClasses();
      } else {
        toast.error("ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການປ່ຽນສະຖານະ");
    }
  };

  const handleDelete = async (id: string, className: string) => {
    if (!(await askConfirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບຄລາສຮຽນ "${className}"?`))) {
      return;
    }
    try {
      const res = await fetch(`/api/dashboard/classes/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລົບຄລາສຮຽນສຳເລັດແລ້ວ!");
        fetchClasses();
      } else {
        toast.error("ບໍ່ສາມາດລົບຄລາສຮຽນໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລົບຄລາສຮຽນ");
    }
  };

  // Filtered List
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.coachName.toLowerCase().includes(search.toLowerCase()) ||
        c.scheduleInfo.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [classes, search, statusFilter]);

  // Summary Metrics
  const totalClassesCount = classes.length;
  const openClassesCount = classes.filter((c) => c.status === "OPEN").length;
  const totalStudentsCount = classes.reduce((sum, c) => sum + (c.currentStudents || 0), 0);
  const totalTuitionRevenue = classes.reduce((sum, c) => sum + (c.currentStudents || 0) * (c.price || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-16">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-600 to-rose-600 shadow-xl shadow-fuchsia-500/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-white stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                ຫ້ອງຮຽນ & ໂຄດຊິ້ງ
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30">
                Classes & Coaching
              </span>
            </div>
            <p className="text-zinc-400 mt-1 text-xs sm:text-sm">
              ຈັດການຄລາສຮຽນ, ຄູຝຶກ/ໂຄດ, ຕາຕະລາງສອນ ແລະ ການລົງທະບຽນນັກຮຽນ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-fuchsia-500/25 flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>ເປີດຄລາສຮຽນໃໝ່</span>
          </button>
          <button
            onClick={() => {
              fetchClasses();
              toast.success("ໂຫຼດຂໍ້ມູນໃໝ່ຮຽບຮ້ອຍແລ້ວ");
            }}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors shrink-0"
            title="ໂຫຼດຂໍ້ມູນໃໝ່"
          >
            <RefreshCw className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden group hover:border-fuchsia-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຄລາສຮຽນທັງໝົດ</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 font-mono">
                {totalClassesCount} <span className="text-xs font-normal text-zinc-500">ຄລາສ</span>
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-fuchsia-500/10 rounded-xl text-fuchsia-400 border border-fuchsia-500/20">
              <GraduationCap className="w-5 h-5 stroke-[1.75]" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">ຫຼັກສູດທີ່ເປີດສອນທັງໝົດ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ກຳລັງເປີດຮັບສະໝັກ</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1.5 font-mono">
                {openClassesCount} <span className="text-xs font-normal text-zinc-500">ຄລາສ</span>
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-5 h-5 stroke-[1.75]" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">ພ້ອມໃຫ້ນັກຮຽນລົງທະບຽນ</p>
        </div>

        <div
          onClick={() => {
            if (classes.length > 0) openStudentsRoster(classes[0]);
          }}
          className="cursor-pointer bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/60 transition-all hover:scale-[1.01]"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>ນັກຮຽນທີ່ລົງທະບຽນ</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">ກົດເບິ່ງລາຍຊື່</span>
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-1.5 font-mono">
                {totalStudentsCount} <span className="text-xs font-normal text-zinc-500">ຄົນ</span>
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
              <Users className="w-5 h-5 stroke-[1.75]" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">ກົດເພື່ອເປີດລາຍຊື່ນັກຮຽນທັງໝົດ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຍອດລາຍຮັບຄ່າຮຽນ</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1.5 font-mono">
                ₭{totalTuitionRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <CreditCard className="w-5 h-5 stroke-[1.75]" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">ຄຳນວນຈາກນັກຮຽນ x ລາຄາຄລາສ</p>
        </div>
      </div>

      {/* ── Toolbar & Filters ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto custom-scrollbar">
          {[
            { id: "ALL", label: "ທັງໝົດ (All)" },
            { id: "OPEN", label: "ເປີດຮັບ (Open)" },
            { id: "FULL", label: "ເຕັມແລ້ວ (Full)" },
            { id: "COMPLETED", label: "ສຳເລັດ (Completed)" },
            { id: "CANCELLED", label: "ຍົກເລີກ (Cancelled)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30"
                  : "bg-zinc-950/80 text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
            <input
              type="text"
              placeholder="ຄົ້ນຫາຊື່ຄລາສ, ຄູຝຶກ, ຕາຕະລາງ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
            />
          </div>

          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="ມຸມມອງກາດ"
            >
              <LayoutGrid className="w-4 h-4 stroke-[1.75]" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="ມຸມມອງຕາຕະລາງ"
            >
              <ListFilter className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT: GRID OR TABLE ── */}
      {isLoading ? (
        <div className="p-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-fuchsia-500 mb-2" />
          <p className="text-zinc-500 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນຄລາສຮຽນ...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="p-12 sm:p-20 text-center flex flex-col items-center border border-zinc-800 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-16 h-16 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">ບໍ່ພົບຂໍ້ມູນຄລາສຮຽນ</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            ກະລຸນາກົດປຸ່ມ &quot;ເປີດຄລາສຮຽນໃໝ່&quot; ເພື່ອເລີ່ມຕົ້ນເພີ່ມຫຼັກສູດການສອນ
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            + ເປີດຄລາສຮຽນທຳອິດ
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((c) => {
            const isFull = c.currentStudents >= c.maxStudents;
            const progress = c.maxStudents > 0 ? (c.currentStudents / c.maxStudents) * 100 : 0;

            const isCompleted = c.status === "COMPLETED";
            const isCancelled = c.status === "CANCELLED";

            return (
              <div
                key={c.id}
                className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl overflow-hidden shadow-xl hover:border-fuchsia-500/40 transition-all flex flex-col group relative"
              >
                {/* Header Banner */}
                <div className="p-5 pb-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800/80 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        c.status === "OPEN" && !isFull
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : c.status === "OPEN" && isFull
                          ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                          : c.status === "FULL"
                          ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                          : c.status === "COMPLETED"
                          ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {c.status === "OPEN" && !isFull
                        ? "ເປີດຮັບສະໝັກ"
                        : isFull || c.status === "FULL"
                        ? "ເຕັມແລ້ວ"
                        : c.status === "COMPLETED"
                        ? "ຈົບຫຼັກສູດແລ້ວ"
                        : "ຍົກເລີກ"}
                    </span>

                    <span className="text-xs font-black text-amber-400 font-mono">
                      ₭{c.price ? Number(c.price).toLocaleString() : "0"} / ຄົນ
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white group-hover:text-fuchsia-400 transition-colors line-clamp-1">
                    {c.name}
                  </h3>
                  {c.description && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 min-h-[32px]">
                      {c.description}
                    </p>
                  )}
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 text-fuchsia-400 flex items-center justify-center shrink-0 border border-fuchsia-500/30">
                        <UserSquare2 className="w-3.5 h-3.5 stroke-[1.75]" />
                      </div>
                      <span className="truncate">
                        ຄູຝຶກ / ໂຄດ: <strong className="text-white">{c.coachName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                        <CalendarDays className="w-3.5 h-3.5 stroke-[1.75]" />
                      </div>
                      <span className="truncate">{c.scheduleInfo}</span>
                    </div>
                  </div>

                  {/* Student Capacity Progress Bar */}
                  <div onClick={() => openStudentsRoster(c)} className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80 space-y-1.5 cursor-pointer hover:border-blue-500/50 transition-all group/bar" title="ກົດເພື່ອເບິ່ງລາຍຊື່ນັກຮຽນທີ່ສະໝັກ">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-fuchsia-400 stroke-[1.75]" />
                        <span>ນັກຮຽນທີ່ລົງທະບຽນ</span>
                      </span>
                      <span className="font-mono">
                        <strong className={isFull ? "text-rose-400" : "text-fuchsia-400"}>
                          {c.currentStudents}
                        </strong>
                        <span className="text-zinc-500"> / {c.maxStudents} ຄົນ</span>
                      </span>
                    </div>

                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull
                            ? "bg-rose-500"
                            : "bg-gradient-to-r from-fuchsia-500 to-pink-500"
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                    {/* View Enrolled Students Roster Button */}
                    <button
                      onClick={() => openStudentsRoster(c)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md group/roster"
                    >
                      <Users className="w-4 h-4 text-blue-400 group-hover/roster:scale-110 transition-transform stroke-[2]" />
                      <span>ລາຍຊື່ນັກຮຽນທີ່ສະໝັກ ({c.currentStudents} ຄົນ)</span>
                    </button>

                    {/* QR Code & Self-Enrollment Link Button */}
                    <button
                      onClick={() => openQrModal(c)}
                      className="w-full py-2 px-3 rounded-xl bg-zinc-950 hover:bg-fuchsia-950/40 text-zinc-300 hover:text-fuchsia-300 border border-zinc-800 hover:border-fuchsia-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm group/qr"
                    >
                      <QrCode className="w-3.5 h-3.5 text-fuchsia-400 group-hover/qr:scale-110 transition-transform stroke-[2]" />
                      <span>QR & ລິ້ງຄ໌ສະໝັກອອນລາຍ</span>
                    </button>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1">
                        <button
                          onClick={() => handleQuickEnroll(c)}
                          disabled={isFull || c.status !== "OPEN"}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            isFull || c.status !== "OPEN"
                              ? "bg-zinc-800/70 text-zinc-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white shadow-md shadow-fuchsia-500/20 active:scale-95"
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5 stroke-[2]" />
                          <span>ລົງທະບຽນ (+1)</span>
                        </button>

                        {c.currentStudents > 0 && (
                          <button
                            onClick={() => handleUnenroll(c)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                            title="ຖອນນັກຮຽນ (-1)"
                          >
                            <UserMinus className="w-3.5 h-3.5 stroke-[1.75]" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="ແກ້ໄຂຄລາສຮຽນ"
                        >
                          <Edit className="w-4 h-4 stroke-[1.75]" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="ລົບຄລາສຮຽນ"
                        >
                          <Trash2 className="w-4 h-4 stroke-[1.75]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 text-zinc-400 font-bold border-b border-zinc-800">
                  <th className="p-3.5">ຊື່ຄລາສຮຽນ / ຫຼັກສູດ</th>
                  <th className="p-3.5">ຄູຝຶກ (Coach)</th>
                  <th className="p-3.5">ຕາຕະລາງຮຽນ</th>
                  <th className="p-3.5 text-center">ຈຳນວນນັກຮຽນ</th>
                  <th className="p-3.5">ຄ່າຮຽນ</th>
                  <th className="p-3.5 text-center">ສະຖານະ</th>
                  <th className="p-3.5 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredClasses.map((c) => {
                  const isFull = c.currentStudents >= c.maxStudents;

                  return (
                    <tr key={c.id} className="hover:bg-zinc-800/25 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-white block">{c.name}</span>
                        {c.description && (
                          <span className="text-[11px] text-zinc-400 truncate max-w-xs block">
                            {c.description}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-semibold text-zinc-200">{c.coachName}</td>
                      <td className="p-3.5 font-mono text-zinc-300">{c.scheduleInfo}</td>
                      <td className="p-3.5 text-center font-mono font-bold">
                        <span className={isFull ? "text-rose-400" : "text-fuchsia-400"}>
                          {c.currentStudents}
                        </span>
                        <span className="text-zinc-500"> / {c.maxStudents}</span>
                      </td>
                      <td className="p-3.5 font-bold text-amber-400 font-mono">
                        ₭{c.price ? Number(c.price).toLocaleString() : "0"}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            c.status === "OPEN" && !isFull
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : isFull || c.status === "FULL"
                              ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                              : c.status === "COMPLETED"
                              ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          }`}
                        >
                          {c.status === "OPEN" && !isFull
                            ? "ເປີດຮັບ"
                            : isFull || c.status === "FULL"
                            ? "ເຕັມແລ້ວ"
                            : c.status === "COMPLETED"
                            ? "ສຳເລັດ"
                            : "ຍົກເລີກ"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openStudentsRoster(c)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-all flex items-center gap-1.5 shadow-sm"
                            title="ເບິ່ງລາຍຊື່ນັກຮຽນທີ່ສະໝັກ"
                          >
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                            <span>{c.currentStudents} ນັກຮຽນ</span>
                          </button>

                          <button
                            onClick={() => openQrModal(c)}
                            className="p-1.5 rounded-lg text-fuchsia-400 hover:text-white hover:bg-fuchsia-500/20 border border-fuchsia-500/30 transition-colors"
                            title="QR Code & ລິ້ງຄ໌ສະໝັກ"
                          >
                            <QrCode className="w-4 h-4 stroke-[1.75]" />
                          </button>
                          <button
                            onClick={() => handleQuickEnroll(c)}
                            disabled={isFull || c.status !== "OPEN"}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              isFull || c.status !== "OPEN"
                                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                : "bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
                            }`}
                          >
                            +1 ລົງທະບຽນ
                          </button>
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="ແກ້ໄຂ"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="ລົບ"
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

      {/* ── CREATE / EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">
                  <GraduationCap className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {editingClass ? "ແກ້ໄຂຄລາສຮຽນ" : "ເປີດຄລາສຮຽນໃໝ່"}
                  </h2>
                  <p className="text-xs text-zinc-400">ກະລຸນາປ້ອນຂໍ້ມູນຫຼັກສູດ, ຄູຝຶກ ແລະ ຕາຕະລາງສອນ</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1"
              >
                <XCircle className="w-6 h-6 stroke-[1.75]" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveClass} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  ຊື່ຄລາສຮຽນ / ຫຼັກສູດ (Class Name) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ຄລາສໂຍຄະພື້ນຖານ, ສອນຕີເທນນິດຂັ້ນສູງ..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  ລາຍລະອຽດຫຼັກສູດ (Description)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ເນື້ອຫາຫຼັກສູດ, ອຸປະກອນທີ່ຕ້ອງກຽມ..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-fuchsia-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    ຊື່ຄູຝຶກ / ໂຄດ (Instructor) *
                  </label>
                  <input
                    type="text"
                    required
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    placeholder="ຕົວຢ່າງ: ໂຄດ ໄຊຍະສິດ..."
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    ຈຳນວນນັກຮຽນສູງສຸດ (Max Students) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-fuchsia-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  ຕາຕະລາງຮຽນ (Schedule) *
                </label>
                <input
                  type="text"
                  required
                  value={scheduleInfo}
                  onChange={(e) => setScheduleInfo(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ທຸກໆວັນເສົາ-ອາທິດ 10:00 - 12:00 ໂມງ"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    ລາຄາຄ່າຮຽນ (₭ / ຄົນ) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-fuchsia-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    ສະຖານະຄລາສ (Status)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                  >
                    <option value="OPEN">ເປີດຮັບສະໝັກ (Open)</option>
                    <option value="FULL">ເຕັມແລ້ວ (Full)</option>
                    <option value="COMPLETED">ຈົບຫຼັກສູດແລ້ວ (Completed)</option>
                    <option value="CANCELLED">ຍົກເລີກແລ້ວ (Cancelled)</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
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
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-fuchsia-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingClass ? "ບັນທຶກການແກ້ໄຂ" : "ເປີດຄລາສຮຽນ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ── ENROLLED STUDENTS ROSTER MODAL ── */}
      {showStudentsModal && selectedClassForStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
                  <Users className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-xl font-black text-white">
                      ລາຍຊື່ນັກຮຽນທີ່ສະໝັກ: {selectedClassForStudents.name}
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold border border-blue-500/30">
                      {studentsList.length} / {selectedClassForStudents.maxStudents} ຄົນ
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    ຄູຝຶກ: <strong className="text-zinc-200">{selectedClassForStudents.coachName}</strong> · ຕາຕະລາງ: <span className="text-zinc-300">{selectedClassForStudents.scheduleInfo}</span> · ຄ່າຮຽນ: <span className="text-amber-400 font-mono font-bold">₭{Number(selectedClassForStudents.price || 0).toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStudentsModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 stroke-[1.75]" />
              </button>
            </div>

            {/* Toolbar: Search, Filters & Action Buttons */}
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="ຄົ້ນຫາຊື່ນັກຮຽນ, ເບີໂທ, ໝາຍເຫດ..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                {[
                  { id: "ALL", label: `ທັງໝົດ (${studentsList.length})` },
                  {
                    id: "CONFIRMED",
                    label: `ຢືນຢັນແລ້ວ (${studentsList.filter((s) => s.status === "CONFIRMED").length})`,
                  },
                  {
                    id: "ATTENDED",
                    label: `ເຂົ້າຮຽນແລ້ວ (${studentsList.filter((s) => s.status === "ATTENDED").length})`,
                  },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setStudentStatusFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      studentStatusFilter === pill.id
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                        : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
                  title="ສົ່ງອອກເປັນ Excel / CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Excel / CSV</span>
                </button>

                <button
                  onClick={handleOpenAddStudent}
                  disabled={selectedClassForStudents.currentStudents >= selectedClassForStudents.maxStudents}
                  className="px-3.5 py-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-fuchsia-600/25 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ ເພີ່ມນັກຮຽນ</span>
                </button>
              </div>
            </div>

            {/* Students Table / List View */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
              {isLoadingStudents ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                  <p className="text-zinc-400 text-xs sm:text-sm">ກຳລັງໂຫຼດລາຍຊື່ນັກຮຽນ...</p>
                </div>
              ) : (() => {
                  const filtered = studentsList.filter((s) => {
                    const matchQuery =
                      s.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      s.studentPhone.includes(studentSearch) ||
                      (s.note && s.note.toLowerCase().includes(studentSearch.toLowerCase()));
                    const matchStatus =
                      studentStatusFilter === "ALL" || s.status === studentStatusFilter;
                    return matchQuery && matchStatus;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-16 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/40 space-y-3">
                        <Users className="w-12 h-12 mx-auto text-zinc-600" />
                        <h4 className="text-base font-bold text-white">ບໍ່ພົບລາຍຊື່ນັກຮຽນ</h4>
                        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                          {studentSearch || studentStatusFilter !== "ALL"
                            ? "ບໍ່ພົບຂໍ້ມູນທີ່ກົງກັບເງື່ອນໄຂຄົ້ນຫາ"
                            : "ຍັງບໍ່ມີນັກຮຽນລົງທະບຽນໃນຄລາສຮຽນນີ້ເທື່ອ"}
                        </p>
                        <button
                          onClick={handleOpenAddStudent}
                          className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>ເພີ່ມນັກຮຽນຄົນທຳອິດ</span>
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-zinc-800 bg-zinc-950/60">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800 text-[11px] text-zinc-400 uppercase tracking-wider bg-zinc-950">
                            <th className="p-3.5 w-12 text-center">#</th>
                            <th className="p-3.5">ຊື່ ແລະ ນາມສະກຸນ</th>
                            <th className="p-3.5">ເບີໂທຕິດຕໍ່ (WhatsApp)</th>
                            <th className="p-3.5">ວັນທີລົງທະບຽນ</th>
                            <th className="p-3.5">ຄ່າຮຽນ</th>
                            <th className="p-3.5">ໝາຍເຫດ/ສາຂາ</th>
                            <th className="p-3.5 text-center">ສະຖານະ</th>
                            <th className="p-3.5 text-right">ຈັດການ & ພິມບິນ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/80">
                          {filtered.map((st, idx) => (
                            <tr
                              key={st.id}
                              className="hover:bg-zinc-900/60 transition-colors group"
                            >
                              <td className="p-3.5 text-center font-mono text-zinc-500 font-bold">
                                {idx + 1}
                              </td>

                              <td className="p-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-fuchsia-500 to-pink-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                                    {st.studentName.slice(0, 1).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-white text-sm truncate">
                                      {st.studentName}
                                    </p>
                                    <p className="text-[10px] font-mono text-zinc-500">
                                      ID: #{st.id.slice(-6).toUpperCase()}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3.5">
                                <div className="flex items-center gap-1.5">
                                  <a
                                    href={`tel:${st.studentPhone}`}
                                    className="font-mono text-zinc-200 hover:text-white underline font-semibold"
                                  >
                                    {st.studentPhone}
                                  </a>
                                  <a
                                    href={`https://wa.me/${st.studentPhone.replace(/[^0-9]/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                    title="ສົ່ງຂໍ້ຄວາມ WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </td>

                              <td className="p-3.5 font-mono text-zinc-400 text-[11px]">
                                {new Date(st.enrolledAt).toLocaleDateString("lo-LA", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>

                              <td className="p-3.5 font-mono font-extrabold text-amber-400 text-xs">
                                ₭{Number(st.price || 0).toLocaleString()}
                              </td>

                              <td className="p-3.5 text-zinc-400 text-[11px] max-w-[140px] truncate" title={st.note}>
                                {st.note || "-"}
                              </td>

                              <td className="p-3.5 text-center">
                                <button
                                  onClick={() => handleToggleStudentStatus(st.id, st.status)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-transform active:scale-95 ${
                                    st.status === "ATTENDED"
                                      ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  }`}
                                  title="ກົດເພື່ອສະຫຼັບສະຖານະ"
                                >
                                  {st.status === "ATTENDED" ? "ເຂົ້າຮຽນແລ້ວ" : "ຢືນຢັນແລ້ວ"}
                                </button>
                              </td>

                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* View / Print Official Bill Button */}
                                  <button
                                    onClick={() => handleOpenStudentBill(st)}
                                    className="px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1 transition-all shadow-sm"
                                    title="ເບິ່ງ ແລະ ພິມໃບບິນທາງການ"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>ພິມບິນ</span>
                                  </button>

                                  {/* Unenroll / Remove */}
                                  <button
                                    onClick={() => handleDeleteStudent(st.id, st.studentName)}
                                    className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    title="ຖອນລາຍຊື່ນັກຮຽນ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>
      )}

      {/* ── MANUAL ADD STUDENT MODAL ── */}
      {showAddStudentModal && selectedClassForStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">
                  <UserPlus className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ເພີ່ມນັກຮຽນໃໝ່</h3>
                  <p className="text-[11px] text-zinc-400">ເຂົ້າຄລາສ "{selectedClassForStudents.name}"</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <XCircle className="w-6 h-6 stroke-[1.75]" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  ຊື່ ແລະ ນາມສະກຸນ (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ສົມສັກ ວົງສາ"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  ເບີໂທຕິດຕໍ່ (Phone / WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                  placeholder="ຕົວຢ່າງ: 020 99887766"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  ຄ່າຮຽນ (Tuition Fee - ກີບ)
                </label>
                <input
                  type="number"
                  value={newStudentPrice}
                  onChange={(e) => setNewStudentPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  ໝາຍເຫດ ຫຼື ສາຂາ (Note / Branch)
                </label>
                <input
                  type="text"
                  value={newStudentNote}
                  onChange={(e) => setNewStudentNote(e.target.value)}
                  placeholder="ເຊັ່ນ: ຊຳລະເງິນສົດແລ້ວ, ສາຂາ 1..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAddStudent}
                  className="flex-1 py-2.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-md shadow-fuchsia-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingAddStudent && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>ບັນທຶກນັກຮຽນ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── OFFICIAL BILL / RECEIPT PREVIEW MODAL ── */}
      {showBillModal && previewBillData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col my-auto print:bg-white print:border-none print:shadow-none print:max-w-none print:w-full print:m-0">
            {/* Modal Header (Screen Only) */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Printer className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ໃບຮັບເງິນ & ໃບຢືນຢັນການລົງທະບຽນຮຽນ</h3>
                  <p className="text-[11px] text-zinc-400">ເລກທີບິນ: #{previewBillData.receiptNo}</p>
                </div>
              </div>
              <button
                onClick={() => setShowBillModal(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <XCircle className="w-6 h-6 stroke-[1.75]" />
              </button>
            </div>

            {/* Modal Body: Official Receipt Component */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[85vh] print:p-0 print:max-h-none">
              <OfficialEnrollmentReceipt
                data={previewBillData}
                onPrint={() => window.print()}
                showPrintButton={true}
              />
            </div>
          </div>
        </div>
      )}


      {/* ── QR CODE & SHARE MODAL ── */}
      {showQrModal && qrClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[95vh] print:bg-white print:border-none print:shadow-none print:max-w-none print:w-full print:h-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">
                  <QrCode className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">QR Code & ລິ້ງຄ໌ສະໝັກຮຽນ</h2>
                  <p className="text-[11px] text-zinc-400">ໃຫ້ນັກຮຽນສະແກນ ຫຼື ເປີດລິ້ງຄ໌ເພື່ອລົງທະບຽນເອງ</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1"
              >
                <XCircle className="w-6 h-6 stroke-[1.75]" />
              </button>
            </div>

            {/* Modal Body / Printable Poster */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar text-center print:p-8 print:text-black">
              {/* Class Summary Badge */}
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 text-left space-y-2 print:bg-zinc-50 print:border-zinc-300 print:text-black">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      qrClass.status === "OPEN"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 print:text-black print:border-black"
                        : "bg-rose-500/15 text-rose-400 border-rose-500/30 print:text-black print:border-black"
                    }`}
                  >
                    {qrClass.status === "OPEN" ? "ເປີດຮັບສະໝັກ" : qrClass.status}
                  </span>
                  <span className="text-xs font-black text-amber-400 font-mono print:text-black">
                    ₭{qrClass.price ? Number(qrClass.price).toLocaleString() : "0"} / ທ່ານ
                  </span>
                </div>

                <h3 className="text-base font-black text-white print:text-black">
                  {qrClass.name}
                </h3>

                <div className="text-xs text-zinc-400 space-y-1 print:text-zinc-700">
                  <div className="flex items-center gap-2">
                    <UserSquare2 className="w-3.5 h-3.5 text-fuchsia-400 shrink-0 print:text-black" />
                    <span>ຄູຝຶກ: <strong className="text-zinc-200 print:text-black">{qrClass.coachName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-cyan-400 shrink-0 print:text-black" />
                    <span>ຕາຕະລາງ: <span className="font-mono text-zinc-200 print:text-black">{qrClass.scheduleInfo}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0 print:text-black" />
                    <span>
                      ບ່ອນນັ່ງ: <strong className="text-emerald-400 print:text-black">{qrClass.currentStudents} / {qrClass.maxStudents}</strong> (ຍັງເຫຼືອ {Math.max(qrClass.maxStudents - qrClass.currentStudents, 0)} ບ່ອນນັ່ງ)
                    </span>
                  </div>
                </div>
              </div>

              {/* High-Res QR Code */}
              <div className="py-2 flex flex-col items-center">
                <div className="p-3 bg-white rounded-3xl shadow-2xl border-2 border-zinc-700/50 inline-block print:border-black">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=8&data=${encodeURIComponent(
                      getEnrollUrl(qrClass.id)
                    )}`}
                    alt="Class Enrollment QR Code"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                </div>
                <p className="text-xs font-semibold text-zinc-300 mt-3 print:text-black">
                  ສະແກນ QR Code ນີ້ດ້ວຍກ້ອງມືຖືເພື່ອລົງທະບຽນ
                </p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5 print:text-zinc-600">
                  {getEnrollUrl(qrClass.id)}
                </p>
              </div>

              {/* Link Box & Copy (Hidden on Print) */}
              <div className="space-y-3 pt-2 border-t border-zinc-800/80 print:hidden">
                <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                  <input
                    type="text"
                    readOnly
                    value={getEnrollUrl(qrClass.id)}
                    className="w-full bg-transparent text-xs text-zinc-300 font-mono px-2 focus:outline-none truncate select-all"
                  />
                  <button
                    onClick={() => handleCopyClassLink(qrClass.id)}
                    className="px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all shadow"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "ຄັດລອກແລ້ວ" : "ຄັດລອກ"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => window.open(getEnrollUrl(qrClass.id), "_blank")}
                    className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-fuchsia-400 stroke-[1.75]" />
                    <span className="text-[10px]">ເປີດເບິ່ງໜ້າ</span>
                  </button>

                  <button
                    onClick={() => handleDownloadQr(qrClass)}
                    className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <Download className="w-4 h-4 text-cyan-400 stroke-[1.75]" />
                    <span className="text-[10px]">ດາວໂຫຼດ QR</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <Printer className="w-4 h-4 text-amber-400 stroke-[1.75]" />
                    <span className="text-[10px]">ພິມໂປສເຕີ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
