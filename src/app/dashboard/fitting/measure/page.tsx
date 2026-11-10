"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useMemo } from "react";
import {
  Ruler,
  User,
  Phone,
  Settings2,
  Printer,
  Search,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Activity,
  Check,
  X,
  Loader2,
  Filter,
  Sparkles,
  Clock,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronRight,
  ClipboardList,
  Layers,
  Tag,
  Calendar,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface FittingProfile {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  sportType: string;
  equipmentName: string;
  specifications: Record<string, any> | null;
  notes?: string | null;
  price?: number | null;
  status: "ACTIVE" | "INACTIVE" | string;
  createdAt: string;
  updatedAt: string;
}

const SPORT_CONFIGS: Record<string, { label: string; badgeColor: string; dotColor: string }> = {
  Golf: {
    label: "ກ໊ອຟ (Golf)",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    dotColor: "bg-emerald-400"
  },
  Badminton: {
    label: "ດອກປີກໄກ່ (Badminton)",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25",
    dotColor: "bg-cyan-400"
  },
  Tennis: {
    label: "ເທັນນິສ (Tennis)",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    dotColor: "bg-amber-400"
  },
  Cycling: {
    label: "ລົດຖີບ (Cycling)",
    badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/25",
    dotColor: "bg-violet-400"
  },
  Other: {
    label: "ອື່ນໆ (Other)",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
    dotColor: "bg-indigo-400"
  }
};

export default function FittingMeasurePage() {
  const [profiles, setProfiles] = useState<FittingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal State (Add / Edit)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Print Slip Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printProfile, setPrintProfile] = useState<FittingProfile | null>(null);

  // Form Basic Fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [sportType, setSportType] = useState("Badminton");
  const [equipmentName, setEquipmentName] = useState("");
  const [price, setPrice] = useState<string | number>("");
  const [status, setStatus] = useState("ACTIVE");
  const [notes, setNotes] = useState("");

  // Sport-specific Specs State
  // Badminton
  const [badmintonTension, setBadmintonTension] = useState("");
  const [badmintonString, setBadmintonString] = useState("");
  const [badmintonGrip, setBadmintonGrip] = useState("");
  const [badmintonWeight, setBadmintonWeight] = useState("");
  const [badmintonPreStretch, setBadmintonPreStretch] = useState("");

  // Tennis
  const [tennisTension, setTennisTension] = useState("");
  const [tennisStringMain, setTennisStringMain] = useState("");
  const [tennisStringCross, setTennisStringCross] = useState("");
  const [tennisGrip, setTennisGrip] = useState("");
  const [tennisPattern, setTennisPattern] = useState("");

  // Golf
  const [golfLoft, setGolfLoft] = useState("");
  const [golfShaft, setGolfShaft] = useState("");
  const [golfGrip, setGolfGrip] = useState("");
  const [golfSwingWeight, setGolfSwingWeight] = useState("");
  const [golfLength, setGolfLength] = useState("");
  const [golfLieAngle, setGolfLieAngle] = useState("");

  // Cycling
  const [saddleHeight, setSaddleHeight] = useState("");
  const [saddleSetback, setSaddleSetback] = useState("");
  const [reachDrop, setReachDrop] = useState("");
  const [crankLength, setCrankLength] = useState("");
  const [cleatSetting, setCleatSetting] = useState("");

  // Other Custom Specs
  const [customSpec1Key, setCustomSpec1Key] = useState("");
  const [customSpec1Val, setCustomSpec1Val] = useState("");
  const [customSpec2Key, setCustomSpec2Key] = useState("");
  const [customSpec2Val, setCustomSpec2Val] = useState("");

  // Quick Add Category State
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [showQuickAddCatModal, setShowQuickAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isSavingCat, setIsSavingCat] = useState(false);

  useEffect(() => {
    fetchProfiles();
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
      return toast.error("ກະລຸນາປ້ອນຊື່ໝວດໝູ່ / ປະເພດກິລາໃໝ່");
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
        setSportType(catTitle);
        setShowQuickAddCatModal(false);
        setNewCatName("");
        toast.success(`ເພີ່ມປະເພດກິລາ "${catTitle}" ສຳເລັດ`);
      } else {
        toast.error("ບໍ່ສາມາດບັນທຶກໝວດໝູ່ໃໝ່ໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSavingCat(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await fetch("/api/dashboard/fitting");
      const data = await res.json();
      if (res.ok) {
        setProfiles(Array.isArray(data) ? data : []);
      } else {
        toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໂປຣໄຟລ໌ຟິດຕິ້ງໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ຂໍ້ມູນ");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setSportType("Badminton");
    setEquipmentName("");
    setPrice("");
    setStatus("ACTIVE");
    setNotes("");

    // Badminton
    setBadmintonTension("");
    setBadmintonString("");
    setBadmintonGrip("");
    setBadmintonWeight("");
    setBadmintonPreStretch("");

    // Tennis
    setTennisTension("");
    setTennisStringMain("");
    setTennisStringCross("");
    setTennisGrip("");
    setTennisPattern("");

    // Golf
    setGolfLoft("");
    setGolfShaft("");
    setGolfGrip("");
    setGolfSwingWeight("");
    setGolfLength("");
    setGolfLieAngle("");

    // Cycling
    setSaddleHeight("");
    setSaddleSetback("");
    setReachDrop("");
    setCrankLength("");
    setCleatSetting("");

    // Other
    setCustomSpec1Key("");
    setCustomSpec1Val("");
    setCustomSpec2Key("");
    setCustomSpec2Val("");

    setIsEditing(false);
    setSelectedId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (profile: FittingProfile) => {
    resetForm();
    setIsEditing(true);
    setSelectedId(profile.id);
    setCustomerName(profile.customerName || "");
    setCustomerPhone(profile.customerPhone || "");
    setSportType(profile.sportType || "Badminton");
    setEquipmentName(profile.equipmentName || "");
    setPrice(profile.price !== null && profile.price !== undefined ? profile.price : "");
    setStatus(profile.status || "ACTIVE");
    setNotes(profile.notes || "");

    const specs = profile.specifications || {};

    if (profile.sportType === "Badminton") {
      setBadmintonTension(specs.tension || specs.badmintonTension || "");
      setBadmintonString(specs.string || specs.badmintonString || "");
      setBadmintonGrip(specs.grip || specs.badmintonGrip || "");
      setBadmintonWeight(specs.weightBalance || "");
      setBadmintonPreStretch(specs.preStretch || "");
    } else if (profile.sportType === "Tennis") {
      setTennisTension(specs.tension || specs.tennisTension || "");
      setTennisStringMain(specs.stringMain || specs.string || "");
      setTennisStringCross(specs.stringCross || "");
      setTennisGrip(specs.grip || specs.tennisGrip || "");
      setTennisPattern(specs.pattern || "");
    } else if (profile.sportType === "Golf") {
      setGolfLoft(specs.loft || "");
      setGolfShaft(specs.shaft || specs.string || "");
      setGolfGrip(specs.grip || specs.golfGrip || "");
      setGolfSwingWeight(specs.swingWeight || "");
      setGolfLength(specs.length || "");
      setGolfLieAngle(specs.lieAngle || "");
    } else if (profile.sportType === "Cycling") {
      setSaddleHeight(specs.saddleHeight || "");
      setSaddleSetback(specs.saddleSetback || "");
      setReachDrop(specs.reachDrop || "");
      setCrankLength(specs.crankLength || "");
      setCleatSetting(specs.cleatSetting || "");
    } else {
      // General / Other specs
      const keys = Object.keys(specs);
      if (keys.length > 0) {
        setCustomSpec1Key(keys[0] || "");
        setCustomSpec1Val(String(specs[keys[0]] || ""));
      }
      if (keys.length > 1) {
        setCustomSpec2Key(keys[1] || "");
        setCustomSpec2Val(String(specs[keys[1]] || ""));
      }
    }

    setShowModal(true);
  };

  const buildSpecificationsPayload = () => {
    if (sportType === "Badminton") {
      return {
        tension: badmintonTension,
        string: badmintonString,
        grip: badmintonGrip,
        weightBalance: badmintonWeight,
        preStretch: badmintonPreStretch
      };
    }
    if (sportType === "Tennis") {
      return {
        tension: tennisTension,
        stringMain: tennisStringMain,
        stringCross: tennisStringCross,
        grip: tennisGrip,
        pattern: tennisPattern
      };
    }
    if (sportType === "Golf") {
      return {
        loft: golfLoft,
        shaft: golfShaft,
        grip: golfGrip,
        swingWeight: golfSwingWeight,
        length: golfLength,
        lieAngle: golfLieAngle
      };
    }
    if (sportType === "Cycling") {
      return {
        saddleHeight,
        saddleSetback,
        reachDrop,
        crankLength,
        cleatSetting
      };
    }

    // Other
    const custom: Record<string, any> = {};
    if (customSpec1Key.trim()) custom[customSpec1Key.trim()] = customSpec1Val.trim();
    if (customSpec2Key.trim()) custom[customSpec2Key.trim()] = customSpec2Val.trim();
    return custom;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !equipmentName.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ລູກຄ້າ ແລະ ຊື່ອຸປະກອນໃຫ້ຄົບຖ້ວນ");
    }

    setIsSubmitting(true);
    const specifications = buildSpecificationsPayload();

    const payload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || null,
      sportType,
      equipmentName: equipmentName.trim(),
      specifications,
      notes: notes.trim() || null,
      price: price !== "" ? Number(price) : null,
      status
    };

    try {
      const url = isEditing && selectedId
        ? `/api/dashboard/fitting/${selectedId}`
        : "/api/dashboard/fitting";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(isEditing ? "ບັນທຶກການແກ້ໄຂໂປຣໄຟລ໌ສຳເລັດ" : "ເພີ່ມໂປຣໄຟລ໌ຟິດຕິ້ງໃໝ່ສຳເລັດ");
        setShowModal(false);
        resetForm();
        fetchProfiles();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (profile: FittingProfile) => {
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການລຶບໂປຣໄຟລ໌ຟິດຕິ້ງຂອງ "${profile.customerName}" (${profile.equipmentName}) ແທ້ບໍ່?`,
      {
        title: "ຢືນຢັນການລຶບໂປຣໄຟລ໌ຟິດຕິ້ງ",
        subMessage: "ຂໍ້ມູນການຟິດຕິ້ງ ແລະ ຄ່າສະເປັກທັງໝົດຈະຖືກລຶບຖາວອນ ແລະ ບໍ່ສາມາດກູ້ຄືນໄດ້.",
        confirmText: "ຢືນຢັນລຶບ",
        cancelText: "ຍົກເລີກ"
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/fitting/${profile.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບໂປຣໄຟລ໌ຟິດຕິ້ງສຳເລັດ");
        setProfiles(prev => prev.filter(p => p.id !== profile.id));
      } else {
        toast.error("ບໍ່ສາມາດລຶບໂປຣໄຟລ໌ໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບ");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    // Optimistic update
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));

    try {
      const res = await fetch(`/api/dashboard/fitting/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        setProfiles(prev => prev.map(p => p.id === id ? { ...p, status: currentStatus } : p));
        toast.error("ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້");
      } else {
        toast.success(newStatus === "ACTIVE" ? "ເປີດໃຊ້ງານໂປຣໄຟລ໌ແລ້ວ" : "ປິດການໃຊ້ງານໂປຣໄຟລ໌ແລ້ວ");
      }
    } catch (err) {
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, status: currentStatus } : p));
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບເດດສະຖານະ");
    }
  };

  const openPrintDialog = (profile: FittingProfile) => {
    setPrintProfile(profile);
    setShowPrintModal(true);
  };

  // Filtered list
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const q = search.toLowerCase();
      const matchSearch =
        p.customerName.toLowerCase().includes(q) ||
        (p.customerPhone && p.customerPhone.toLowerCase().includes(q)) ||
        p.equipmentName.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q));

      const matchSport = sportFilter === "ALL" || p.sportType === sportFilter;
      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;

      return matchSearch && matchSport && matchStatus;
    });
  }, [profiles, search, sportFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = profiles.length;
    const active = profiles.filter(p => p.status === "ACTIVE").length;
    const revenue = profiles.reduce((sum, p) => sum + (p.price || 0), 0);
    const countsBySport: Record<string, number> = {};
    profiles.forEach(p => {
      countsBySport[p.sportType] = (countsBySport[p.sportType] || 0) + 1;
    });

    let topSport = "ຍັງບໍ່ມີຂໍ້ມູນ";
    let maxCount = 0;
    Object.entries(countsBySport).forEach(([s, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topSport = SPORT_CONFIGS[s]?.label || s;
      }
    });

    return { total, active, revenue, topSport, countsBySport };
  }, [profiles]);

  // Helper to render specs chips neatly
  const renderSpecChips = (profile: FittingProfile) => {
    const specs = profile.specifications;
    if (!specs || typeof specs !== "object" || Object.keys(specs).length === 0) {
      return <span className="text-xs text-zinc-500 italic">ບໍ່ມີຂໍ້ມູນສະເປັກເພີ່ມເຕີມ</span>;
    }

    const items: { label: string; value: any }[] = [];

    if (profile.sportType === "Badminton") {
      if (specs.tension) items.push({ label: "ຄວາມຕຶງ", value: specs.tension });
      if (specs.string) items.push({ label: "ເອັນ", value: specs.string });
      if (specs.grip) items.push({ label: "ດ້າມ/ກິບ", value: specs.grip });
      if (specs.weightBalance) items.push({ label: "ນ້ຳໜັກ", value: specs.weightBalance });
      if (specs.preStretch) items.push({ label: "Pre-stretch", value: specs.preStretch });
    } else if (profile.sportType === "Tennis") {
      if (specs.tension) items.push({ label: "ຄວາມຕຶງ", value: specs.tension });
      if (specs.stringMain) items.push({ label: "Main", value: specs.stringMain });
      if (specs.stringCross) items.push({ label: "Cross", value: specs.stringCross });
      if (specs.grip) items.push({ label: "ດ້າມ", value: specs.grip });
      if (specs.pattern) items.push({ label: "Pattern", value: specs.pattern });
    } else if (profile.sportType === "Golf") {
      if (specs.loft) items.push({ label: "Loft", value: specs.loft });
      if (specs.shaft) items.push({ label: "Shaft", value: specs.shaft });
      if (specs.grip) items.push({ label: "Grip", value: specs.grip });
      if (specs.swingWeight) items.push({ label: "Swing Wt", value: specs.swingWeight });
      if (specs.length) items.push({ label: "Length", value: specs.length });
    } else if (profile.sportType === "Cycling") {
      if (specs.saddleHeight) items.push({ label: "Saddle", value: specs.saddleHeight });
      if (specs.saddleSetback) items.push({ label: "Setback", value: specs.saddleSetback });
      if (specs.reachDrop) items.push({ label: "Reach/Drop", value: specs.reachDrop });
      if (specs.crankLength) items.push({ label: "Crank", value: specs.crankLength });
    } else {
      Object.entries(specs).forEach(([k, v]) => {
        if (v) items.push({ label: k, value: String(v) });
      });
    }

    // Fallback if specific sports matched but old fields were stored differently
    if (items.length === 0) {
      Object.entries(specs).forEach(([k, v]) => {
        if (v) items.push({ label: k, value: String(v) });
      });
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-xs text-zinc-300"
          >
            <span className="text-zinc-500 font-medium">{it.label}:</span>
            <span className="text-white font-semibold">{it.value}</span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 shadow-xl shadow-indigo-500/20 flex items-center justify-center border border-indigo-400/30">
            <Ruler className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-white tracking-tight">ບໍລິການຟິດຕິ້ງ & ວັດຂະໜາດ</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                Equipment Fitting
              </span>
            </div>
            <p className="text-zinc-400 text-sm mt-0.5">
              ບັນທຶກຄ່າສະເປັກ, ຄວາມຕຶງເອັນ, ຂະໜາດດ້າມ ແລະ ປັບແຕ່ງອຸປະກອນກິລາສະເພາະບຸກຄົນ
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>ເພີ່ມໂປຣໄຟລ໌ໃໝ່</span>
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ໂປຣໄຟລ໌ທັງໝົດ</span>
            <div className="text-2xl font-bold text-white tracking-tight">{stats.total}</div>
            <span className="text-[11px] text-zinc-500">ລາຍການທີ່ບັນທຶກໃນລະບົບ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-zinc-800/70 border border-zinc-700/50 flex items-center justify-center text-indigo-400">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ກຳລັງໃຊ້ງານຢູ່</span>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">{stats.active}</div>
            <span className="text-[11px] text-zinc-500">ສະຖານະພ້ອມໃຫ້ບໍລິການ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Revenue */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ຍອດລາຍຮັບຄ່າຟິດຕິ້ງ</span>
            <div className="text-2xl font-bold text-indigo-300 tracking-tight">
              {stats.revenue.toLocaleString()} ₭
            </div>
            <span className="text-[11px] text-zinc-500">ຄ່າບໍລິການລວມທັງໝົດ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Top Sport */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ກິລາຍອດນິຍົມ</span>
            <div className="text-lg font-bold text-purple-300 tracking-tight truncate max-w-[150px]">
              {stats.topSport}
            </div>
            <span className="text-[11px] text-zinc-500">ມີການຟິດຕິ້ງຫຼາຍທີ່ສຸດ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Toolbar & Filters ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="ຄົ້ນຫາຊື່ລູກຄ້າ, ເບີໂທ, ຊື່ອຸປະກອນ ຫຼື ໝາຍເຫດ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center bg-zinc-950/70 border border-zinc-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  statusFilter === "ALL"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ສະຖານະທັງໝົດ
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  statusFilter === "ACTIVE"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ໃຊ້ງານຢູ່
              </button>
              <button
                onClick={() => setStatusFilter("INACTIVE")}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  statusFilter === "INACTIVE"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ປິດໃຊ້ງານ
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-950/70 border border-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                title="ມຸມມອງກາດ (Grid View)"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "grid" ? "bg-zinc-800 text-indigo-400" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                title="ມຸມມອງຕາຕະລາງ (Table View)"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "table" ? "bg-zinc-800 text-indigo-400" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sport Type Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-zinc-800/60 pt-3">
          <button
            onClick={() => setSportFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              sportFilter === "ALL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-zinc-950/50 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:bg-zinc-800/50"
            }`}
          >
            <span>ທຸກປະເພດກິລາ</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-zinc-300">
              {profiles.length}
            </span>
          </button>

          {Object.entries(SPORT_CONFIGS).map(([key, config]) => {
            const count = stats.countsBySport[key] || 0;
            const isSelected = sportFilter === key;
            return (
              <button
                key={key}
                onClick={() => setSportFilter(key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-zinc-100 text-zinc-950 shadow-md font-semibold"
                    : "bg-zinc-950/50 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:bg-zinc-800/50"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                <span>{config.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? "bg-zinc-300 text-zinc-900" : "bg-zinc-800/80 text-zinc-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content View (Grid or Table) ── */}
      {isLoading ? (
        <div className="p-16 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/60">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
          <p className="text-zinc-400 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນໂປຣໄຟລ໌ຟິດຕິ້ງ...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="p-16 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/60 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-zinc-800/60 rounded-2xl flex items-center justify-center mb-4 text-zinc-500 border border-zinc-700/40">
            <Ruler className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">ບໍ່ພົບຂໍ້ມູນໂປຣໄຟລ໌ຟິດຕິ້ງ</h3>
          <p className="text-zinc-400 text-xs max-w-sm mb-5">
            {search || sportFilter !== "ALL" || statusFilter !== "ALL"
              ? "ບໍ່ພົບຂໍ້ມູນທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ ລອງປັບຕົວກອງໃໝ່"
              : "ຍັງບໍ່ທັນມີການບັນທຶກຂໍ້ມູນໂປຣໄຟລ໌ຟິດຕິ້ງ ກົດປຸ່ມດ້ານລຸ່ມເພື່ອເລີ່ມຕົ້ນ"}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>ເພີ່ມໂປຣໄຟລ໌ໃໝ່</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map(profile => {
            const sportCfg = SPORT_CONFIGS[profile.sportType] || SPORT_CONFIGS.Other;
            const isActive = profile.status === "ACTIVE";

            return (
              <div
                key={profile.id}
                className="bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between group backdrop-blur-xl"
              >
                <div>
                  {/* Top: Customer & Sport Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-sm border border-zinc-700/50">
                        <User className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base leading-tight group-hover:text-indigo-300 transition-colors">
                          {profile.customerName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{profile.customerPhone || "ບໍ່ມີເບີໂທ"}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${sportCfg.badgeColor} whitespace-nowrap`}
                    >
                      {sportCfg.label.split(" ")[0]}
                    </span>
                  </div>

                  {/* Equipment Name */}
                  <div className="bg-zinc-950/60 rounded-xl p-3 border border-zinc-800/80 mb-3.5">
                    <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider mb-0.5">
                      ອຸປະກອນທີ່ປັບແຕ່ງ
                    </div>
                    <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="truncate">{profile.equipmentName}</span>
                    </div>
                  </div>

                  {/* Specifications Preview */}
                  <div className="space-y-1.5 mb-3.5">
                    <div className="text-[11px] font-medium text-zinc-400">ຄ່າສະເປັກ (Specs):</div>
                    {renderSpecChips(profile)}
                  </div>

                  {/* Notes if available */}
                  {profile.notes && (
                    <div className="text-xs text-zinc-400 bg-zinc-950/40 rounded-lg p-2.5 border border-zinc-800/60 mb-3.5 italic">
                      &ldquo;{profile.notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Price, Status Toggle, Actions */}
                <div className="border-t border-zinc-800/80 pt-3.5 mt-2 flex items-center justify-between gap-3">
                  {/* Price */}
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-medium">ຄ່າບໍລິການ</span>
                    <span className="text-sm font-bold text-indigo-400">
                      {profile.price ? `${profile.price.toLocaleString()} ₭` : "ຟຣີ / ບໍ່ມີຄ່າ"}
                    </span>
                  </div>

                  {/* Status Switch & Actions */}
                  <div className="flex items-center gap-2">
                    {/* Status Pill / Switch */}
                    <button
                      onClick={() => handleToggleStatus(profile.id, profile.status)}
                      title={isActive ? "ຄລິກເພື່ອປິດການໃຊ້ງານ" : "ຄລິກເພື່ອເປີດໃຊ້ງານ"}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-zinc-800/60 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-zinc-500"}`} />
                      <span>{isActive ? "ໃຊ້ງານ" : "ປິດ"}</span>
                    </button>

                    {/* Print Slip */}
                    <button
                      onClick={() => openPrintDialog(profile)}
                      title="ພິມໃບສະເປັກ (Print Spec Slip)"
                      className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors border border-transparent hover:border-indigo-500/30"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEditModal(profile)}
                      title="ແກ້ໄຂໂປຣໄຟລ໌"
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(profile)}
                      title="ລຶບໂປຣໄຟລ໌"
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950/60 text-xs text-zinc-400 uppercase font-semibold border-b border-zinc-800/80">
                <tr>
                  <th className="py-3.5 px-4">ລູກຄ້າ</th>
                  <th className="py-3.5 px-4">ປະເພດກິລາ</th>
                  <th className="py-3.5 px-4">ອຸປະກອນ</th>
                  <th className="py-3.5 px-4">ລາຍລະອຽດສະເປັກ</th>
                  <th className="py-3.5 px-4 text-right">ຄ່າບໍລິການ</th>
                  <th className="py-3.5 px-4 text-center">ສະຖານະ</th>
                  <th className="py-3.5 px-4 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredProfiles.map(profile => {
                  const sportCfg = SPORT_CONFIGS[profile.sportType] || SPORT_CONFIGS.Other;
                  const isActive = profile.status === "ACTIVE";

                  return (
                    <tr key={profile.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{profile.customerName}</div>
                        <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          <span>{profile.customerPhone || "-"}</span>
                        </div>
                      </td>

                      {/* Sport */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${sportCfg.badgeColor}`}>
                          {sportCfg.label.split(" ")[0]}
                        </span>
                      </td>

                      {/* Equipment */}
                      <td className="py-3.5 px-4 font-medium text-zinc-100 max-w-[180px] truncate">
                        {profile.equipmentName}
                      </td>

                      {/* Specs */}
                      <td className="py-3.5 px-4 max-w-[300px]">
                        {renderSpecChips(profile)}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right font-bold text-indigo-400">
                        {profile.price ? `${profile.price.toLocaleString()} ₭` : "ຟຣີ"}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(profile.id, profile.status)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border inline-flex items-center gap-1.5 ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700/50"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-zinc-500"}`} />
                          <span>{isActive ? "ໃຊ້ງານ" : "ປິດ"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openPrintDialog(profile)}
                            title="ພິມໃບສະເປັກ"
                            className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(profile)}
                            title="ແກ້ໄຂ"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(profile)}
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {isEditing ? "ແກ້ໄຂໂປຣໄຟລ໌ຟິດຕິ້ງ" : "ເພີ່ມໂປຣໄຟລ໌ຟິດຕິ້ງໃໝ່"}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {isEditing ? "ປັບປຸງຂໍ້ມູນຄ່າສະເປັກ ແລະ ອຸປະກອນ" : "ກະລຸນາຕື່ມຂໍ້ມູນລູກຄ້າ ແລະ ສະເປັກອຸປະກອນ"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <form id="fitting-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* ── Section 1: Customer Info ── */}
                <div>
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>1. ຂໍ້ມູນລູກຄ້າ (Customer Information)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ຊື່ ແລະ ນາມສະກຸນລູກຄ້າ <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="ຕົວຢ່າງ: ສົມສັກ ໄຊຍະວົງ"
                        required
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ເບີໂທລະສັບຕິດຕໍ່
                      </label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="ຕົວຢ່າງ: 020 5555 1234"
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Equipment & Sport ── */}
                <div className="border-t border-zinc-800/80 pt-5">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>2. ປະເພດກິລາ & ອຸປະກອນ (Sport & Equipment)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-zinc-300">
                          ປະເພດກິລາ <span className="text-red-400">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowQuickAddCatModal(true)}
                            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-500/30 transition-all"
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
                        value={sportType}
                        onChange={e => {
                          if (e.target.value === "__ADD_NEW__") {
                            setShowQuickAddCatModal(true);
                          } else {
                            setSportType(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Badminton">ດອກປີກໄກ່ (Badminton)</option>
                        <option value="Golf">ກ໊ອຟ (Golf)</option>
                        <option value="Tennis">ເທັນນິສ (Tennis)</option>
                        <option value="Cycling">ລົດຖີບ (Cycling)</option>
                        {dbCategories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="Other">ອື່ນໆ (Other)</option>
                        <option value="__ADD_NEW__" className="text-indigo-400 font-bold bg-zinc-900">
                          + ເພີ່ມປະເພດ / ໝວດໝູ່ໃໝ່...
                        </option>
                      </select>

                      <div className="mt-1.5 p-2 bg-zinc-950/80 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-2">
                        <span className="text-[11px] text-zinc-400">ບໍ່ມີປະເພດກິລາໃນລາຍການ?</span>
                        <button
                          type="button"
                          onClick={() => setShowQuickAddCatModal(true)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm shadow-indigo-600/30 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ ເພີ່ມປະເພດໃໝ່</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ຊື່ອຸປະກອນ / ລຸ້ນ <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={equipmentName}
                        onChange={e => setEquipmentName(e.target.value)}
                        required
                        placeholder={
                          sportType === "Golf"
                            ? "ຕົວຢ່າງ: Driver Ping G430 Max"
                            : sportType === "Badminton"
                            ? "ຕົວຢ່າງ: Yonex Astrox 100ZZ"
                            : sportType === "Tennis"
                            ? "ຕົວຢ່າງ: Wilson Blade 98"
                            : "ຕົວຢ່າງ: Trek Madone SLR 7"
                        }
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Sport Specifications (Dynamic) ── */}
                <div className="border-t border-zinc-800/80 pt-5">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Ruler className="w-3.5 h-3.5" />
                      <span>3. ລາຍລະອຽດສະເປັກຟິດຕິ້ງ ({SPORT_CONFIGS[sportType]?.label || sportType})</span>
                    </span>
                    <span className="text-[11px] text-zinc-500 font-normal">ປັບປ່ຽນຕາມປະເພດກິລາ</span>
                  </h3>

                  {/* Badminton Form Fields */}
                  {sportType === "Badminton" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/80">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ຄວາມຕຶງເອັນ (Tension)
                        </label>
                        <input
                          type="text"
                          value={badmintonTension}
                          onChange={e => setBadmintonTension(e.target.value)}
                          placeholder="ຕົວຢ່າງ: 26 lbs ຫຼື 27x29"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ລຸ້ນເອັນ (String Model)
                        </label>
                        <input
                          type="text"
                          value={badmintonString}
                          onChange={e => setBadmintonString(e.target.value)}
                          placeholder="ຕົວຢ່າງ: Yonex BG80"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ຂະໜາດດ້າມ & ກິບ (Grip)
                        </label>
                        <input
                          type="text"
                          value={badmintonGrip}
                          onChange={e => setBadmintonGrip(e.target.value)}
                          placeholder="ຕົວຢ່າງ: G5 / Super Grap"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ນ້ຳໜັກ & ຈຸດບາລານສ໌
                        </label>
                        <input
                          type="text"
                          value={badmintonWeight}
                          onChange={e => setBadmintonWeight(e.target.value)}
                          placeholder="ຕົວຢ່າງ: 4U / 305mm Head Heavy"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Pre-stretch
                        </label>
                        <input
                          type="text"
                          value={badmintonPreStretch}
                          onChange={e => setBadmintonPreStretch(e.target.value)}
                          placeholder="ຕົວຢ່າງ: 10% ຫຼື ບໍ່ມີ"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tennis Form Fields */}
                  {sportType === "Tennis" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/80">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ຄວາມຕຶງເອັນ (Tension)
                        </label>
                        <input
                          type="text"
                          value={tennisTension}
                          onChange={e => setTennisTension(e.target.value)}
                          placeholder="ຕົວຢ່າງ: 52 lbs"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ເອັນຫຼັກ (Main String)
                        </label>
                        <input
                          type="text"
                          value={tennisStringMain}
                          onChange={e => setTennisStringMain(e.target.value)}
                          placeholder="ຕົວຢ່າງ: Alu Power 1.25"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ເອັນຂວາງ (Cross String)
                        </label>
                        <input
                          type="text"
                          value={tennisStringCross}
                          onChange={e => setTennisStringCross(e.target.value)}
                          placeholder="ຕົວຢ່າງ: Sensation 1.30"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ຂະໜາດດ້າມ (Grip Size)
                        </label>
                        <input
                          type="text"
                          value={tennisGrip}
                          onChange={e => setTennisGrip(e.target.value)}
                          placeholder="ຕົວຢ່າງ: 4 3/8 (L3)"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ຮູບແບບຂຶ້ນເອັນ (Pattern)
                        </label>
                        <input
                          type="text"
                          value={tennisPattern}
                          onChange={e => setTennisPattern(e.target.value)}
                          placeholder="ຕົວຢ່າງ: 16x19"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Golf Form Fields */}
                  {sportType === "Golf" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/80">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ອົງສາໜ້າໄມ້ (Loft Angle)
                        </label>
                        <input
                          type="text"
                          value={golfLoft}
                          onChange={e => setGolfLoft(e.target.value)}
                          placeholder="ຕົວຢ່າງ: 10.5°"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ກ້ານ & ຄວາມແຂງ (Shaft & Flex)
                        </label>
                        <input
                          type="text"
                          value={golfShaft}
                          onChange={e => setGolfShaft(e.target.value)}
                          placeholder="ຕົວຢ່າງ: Ventus Blue 6S (Stiff)"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ຂະໜາດກິບ (Grip Size)
                        </label>
                        <input
                          type="text"
                          value={golfGrip}
                          onChange={e => setGolfGrip(e.target.value)}
                          placeholder="ຕົວຢ່າງ: Golf Pride Midsize"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ນ້ຳໜັກສະວິງ (Swing Weight)
                        </label>
                        <input
                          type="text"
                          value={golfSwingWeight}
                          onChange={e => setGolfSwingWeight(e.target.value)}
                          placeholder="ຕົວຢ່າງ: D2 ຫຼື D3"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ຄວາມຍາວໄມ້ (Club Length)
                        </label>
                        <input
                          type="text"
                          value={golfLength}
                          onChange={e => setGolfLength(e.target.value)}
                          placeholder="ຕົວຢ່າງ: 45.75 ນິ້ວ"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ມຸມ Lie (Lie Angle)
                        </label>
                        <input
                          type="text"
                          value={golfLieAngle}
                          onChange={e => setGolfLieAngle(e.target.value)}
                          placeholder="ຕົວຢ່າງ: Standard ຫຼື 1° Up"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Cycling Form Fields */}
                  {sportType === "Cycling" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/80">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ຄວາມສູງເບາະ (Saddle Height)
                        </label>
                        <input
                          type="text"
                          value={saddleHeight}
                          onChange={e => setSaddleHeight(e.target.value)}
                          placeholder="ຕົວຢ່າງ: 73.5 cm"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ໄລຍະຖອຍເບາະ (Saddle Setback)
                        </label>
                        <input
                          type="text"
                          value={saddleSetback}
                          onChange={e => setSaddleSetback(e.target.value)}
                          placeholder="ຕົວຢ່າງ: 6.2 cm"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Reach & Drop
                        </label>
                        <input
                          type="text"
                          value={reachDrop}
                          onChange={e => setReachDrop(e.target.value)}
                          placeholder="ຕົວຢ່າງ: Reach 54cm / Drop -7cm"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ຄວາມຍາວຂາຈານ (Crank Length)
                        </label>
                        <input
                          type="text"
                          value={crankLength}
                          onChange={e => setCrankLength(e.target.value)}
                          placeholder="ຕົວຢ່າງ: 172.5 mm"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          ຕຳແໜ່ງຄຣີດເກີບ (Cleat Setup)
                        </label>
                        <input
                          type="text"
                          value={cleatSetting}
                          onChange={e => setCleatSetting(e.target.value)}
                          placeholder="ຕົວຢ່າງ: Float 6° Neutral"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Other Sport Form Fields */}
                  {sportType === "Other" && (
                    <div className="space-y-3 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/80">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={customSpec1Key}
                          onChange={e => setCustomSpec1Key(e.target.value)}
                          placeholder="ຊື່ຄ່າວັດ 1 (ຕົວຢ່າງ: ຄວາມຍາວ)"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          value={customSpec1Val}
                          onChange={e => setCustomSpec1Val(e.target.value)}
                          placeholder="ຄ່າວັດ 1 (ຕົວຢ່າງ: 105 cm)"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={customSpec2Key}
                          onChange={e => setCustomSpec2Key(e.target.value)}
                          placeholder="ຊື່ຄ່າວັດ 2 (ຕົວຢ່າງ: ນ້ຳໜັກ)"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          value={customSpec2Val}
                          onChange={e => setCustomSpec2Val(e.target.value)}
                          placeholder="ຄ່າວັດ 2 (ຕົວຢ່າງ: 85 g)"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Section 4: Pricing & Status & Notes ── */}
                <div className="border-t border-zinc-800/80 pt-5">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" />
                    <span>4. ຄ່າບໍລິການ & ໝາຍເຫດ (Pricing & Notes)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ຄ່າບໍລິການຟິດຕິ້ງ (ກີບ / ₭)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                          placeholder="0"
                          min="0"
                          className="w-full pl-4 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">
                          ₭
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ສະຖານະໂປຣໄຟລ໌
                      </label>
                      <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="ACTIVE">ເປີດໃຊ້ງານ (ACTIVE)</option>
                        <option value="INACTIVE">ປິດການໃຊ້ງານ (INACTIVE)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ໝາຍເຫດ ຫຼື ຄຳຂໍພິເສດຈາກລູກຄ້າ
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="ຕົວຢ່າງ: ລູກຄ້າມັກຂຶ້ນເອັນແບບ 4 ປົມ, ຂໍໃຫ້ລະວັງສີດ້າມ..."
                        rows={2}
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
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold transition-colors"
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                form="fitting-form"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isEditing ? "ບັນທຶກການແກ້ໄຂ" : "ບັນທຶກໂປຣໄຟລ໌"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Printable Fitting Spec Slip Modal ── */}
      {showPrintModal && printProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Printer className="w-4 h-4 text-indigo-400" />
                <span>ຕົວຢ່າງໃບສະເປັກຟິດຕິ້ງ (Fitting Spec Slip)</span>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Slip Paper Preview */}
            <div className="p-6 overflow-y-auto flex-1 bg-zinc-950/40">
              <div
                id="printable-spec-slip"
                className="bg-white text-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-200 space-y-5"
              >
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-zinc-950">
                      ໃບວຽກຟິດຕິ້ງ & ປັບແຕ່ງອຸປະກອນ
                    </h2>
                    <p className="text-xs text-zinc-600 font-medium">
                      Equipment Fitting & Customization Job Slip
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded bg-zinc-900 text-white text-[11px] font-bold">
                      #{printProfile.id.slice(-6).toUpperCase()}
                    </span>
                    <div className="text-[10px] text-zinc-500 mt-1">
                      {new Date(printProfile.createdAt || Date.now()).toLocaleDateString("lo-LA")}
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 text-xs">
                  <div>
                    <div className="text-zinc-500 text-[10px] uppercase font-semibold">ຊື່ລູກຄ້າ</div>
                    <div className="font-bold text-zinc-900 text-sm mt-0.5">{printProfile.customerName}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-[10px] uppercase font-semibold">ເບີໂທຕິດຕໍ່</div>
                    <div className="font-bold text-zinc-900 text-sm mt-0.5">{printProfile.customerPhone || "-"}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-[10px] uppercase font-semibold">ປະເພດກິລາ</div>
                    <div className="font-bold text-indigo-700 mt-0.5">
                      {SPORT_CONFIGS[printProfile.sportType]?.label || printProfile.sportType}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-[10px] uppercase font-semibold">ອຸປະກອນ / ລຸ້ນ</div>
                    <div className="font-bold text-zinc-900 mt-0.5">{printProfile.equipmentName}</div>
                  </div>
                </div>

                {/* Specification Table */}
                <div>
                  <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2 border-b border-zinc-300 pb-1">
                    ຄ່າສະເປັກທີ່ກຳນົດ (Technical Specifications)
                  </div>
                  <table className="w-full text-xs text-left border-collapse">
                    <tbody>
                      {printProfile.specifications && Object.keys(printProfile.specifications).length > 0 ? (
                        Object.entries(printProfile.specifications).map(([key, val], idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-zinc-100/60" : "bg-white"}>
                            <td className="py-2 px-3 font-semibold text-zinc-600 border border-zinc-200 w-1/2 capitalize">
                              {key}
                            </td>
                            <td className="py-2 px-3 font-bold text-zinc-900 border border-zinc-200">
                              {String(val)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="py-3 text-center text-zinc-500 italic">
                            ບໍ່ມີຂໍ້ມູນສະເປັກລະອຽດ
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Notes if available */}
                {printProfile.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                    <strong className="font-bold">ໝາຍເຫດພິເສດ:</strong> {printProfile.notes}
                  </div>
                )}

                {/* Price & Summary */}
                <div className="flex justify-between items-center border-t-2 border-zinc-900 pt-3 text-sm">
                  <div className="text-xs text-zinc-600 font-medium">
                    ສະຖານະ: <span className="font-bold text-zinc-900">{printProfile.status === "ACTIVE" ? "ພ້ອມສົ່ງມອບ" : "ປິດ"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-500 block">ຄ່າບໍລິການລວມ:</span>
                    <span className="text-lg font-black text-zinc-950">
                      {printProfile.price ? `${printProfile.price.toLocaleString()} ₭` : "ຟຣີ"}
                    </span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-zinc-300 text-center text-xs text-zinc-500">
                  <div>
                    <div className="h-10 border-b border-zinc-400 mx-auto w-3/4 mb-1" />
                    <div>ລາຍເຊັນຊ່າງເຕັກນິກຜູ້ຟິດຕິ້ງ</div>
                  </div>
                  <div>
                    <div className="h-10 border-b border-zinc-400 mx-auto w-3/4 mb-1" />
                    <div>ລາຍເຊັນລູກຄ້າຜູ້ຮັບເຄື່ອງ</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex justify-end gap-3">
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
                <span>ພິມໃບສະເປັກ (Print Slip)</span>
              </button>
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
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>ເພີ່ມປະເພດກິລາ / ໝວດໝູ່ໃໝ່</span>
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
                  ຊື່ປະເພດກິລາ / ໝວດໝູ່ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ບານບ້ວງ, ຍິງທະນູ, ໂຍຄະ..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
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
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {isSavingCat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>ບັນທຶກ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Global Print Styles ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-spec-slip,
          #printable-spec-slip * {
            visibility: visible !important;
          }
          #printable-spec-slip {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 30px !important;
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
