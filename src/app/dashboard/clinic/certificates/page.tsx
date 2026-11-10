"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, Award, Calendar, User, Stethoscope, Printer, Search, 
  Plus, Trash2, Edit3, Clock, ShieldAlert, History, Sparkles, 
  BadgeCheck, CheckCircle2, XCircle, Loader2, Phone, AlertCircle, ChevronRight, Filter
} from "lucide-react";
import { toast } from "sonner";
import { askConfirm } from "@/components/ConfirmModal";

interface AuditEntry {
  id: string;
  action: string;
  note?: string;
  changedBy: {
    id?: string | null;
    name: string;
    email?: string;
    role?: string;
  };
  changedAt: string;
}

interface MedicalCert {
  id: string;
  certificateNo: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone?: string;
  diagnosis: string;
  symptoms?: string;
  doctorAdvice?: string;
  doctorName: string;
  doctorLicense?: string;
  fitnessStatus: string;
  status: string;
  leaveDays?: number;
  leaveStartDate?: string;
  leaveEndDate?: string;
  hospitalName?: string;
  issueDate: string;
  statusHistory?: AuditEntry[];
}

export default function CertificatesPage() {
  const [records, setRecords] = useState<MedicalCert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCert, setEditingCert] = useState<MedicalCert | null>(null);
  const [selectedCert, setSelectedCert] = useState<MedicalCert | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Form State
  const [certificateNo, setCertificateNo] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("ຊາຍ");
  const [patientPhone, setPatientPhone] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [doctorAdvice, setDoctorAdvice] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorLicense, setDoctorLicense] = useState("");
  const [fitnessStatus, setFitnessStatus] = useState("FIT");
  const [status, setStatus] = useState("SPORTS_CLEARANCE");
  const [leaveDays, setLeaveDays] = useState("");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [hospitalName, setHospitalName] = useState("Sports Complex Medical & Sports Rehab Center");
  const [auditNote, setAuditNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/dashboard/certificates");
      const data = await res.json();
      if (res.ok) {
        setRecords(data);
        if (selectedCert) {
          const fresh = data.find((c: MedicalCert) => c.id === selectedCert.id);
          if (fresh) setSelectedCert(fresh);
        }
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໃບຢັ້ງຢືນການແພດໄດ້");
    } finally {
      setIsLoading(false);
    }
  };

  const generateCertNo = () => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `MC-${todayStr}-${rand}`;
  };

  const resetForm = () => {
    setCertificateNo(generateCertNo());
    setPatientName("");
    setPatientAge("");
    setPatientGender("ຊາຍ");
    setPatientPhone("");
    setDiagnosis("");
    setSymptoms("");
    setDoctorAdvice("");
    setDoctorName("ນາຍແພດ ປະຈຳສູນກິລາ");
    setDoctorLicense("MD-LAO-2024/098");
    setFitnessStatus("FIT");
    setStatus("SPORTS_CLEARANCE");
    setLeaveDays("");
    setLeaveStartDate("");
    setLeaveEndDate("");
    setHospitalName("Sports Complex Medical & Sports Rehab Center");
    setAuditNote("");
    setEditingCert(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (cert: MedicalCert) => {
    setEditingCert(cert);
    setCertificateNo(cert.certificateNo);
    setPatientName(cert.patientName);
    setPatientAge(cert.patientAge ? cert.patientAge.toString() : "");
    setPatientGender(cert.patientGender || "ຊາຍ");
    setPatientPhone(cert.patientPhone || "");
    setDiagnosis(cert.diagnosis || "");
    setSymptoms(cert.symptoms || "");
    setDoctorAdvice(cert.doctorAdvice || "");
    setDoctorName(cert.doctorName || "");
    setDoctorLicense(cert.doctorLicense || "");
    setFitnessStatus(cert.fitnessStatus || "FIT");
    setStatus(cert.status || "STANDARD");
    setLeaveDays(cert.leaveDays ? cert.leaveDays.toString() : "");
    setLeaveStartDate(cert.leaveStartDate ? new Date(cert.leaveStartDate).toISOString().slice(0, 10) : "");
    setLeaveEndDate(cert.leaveEndDate ? new Date(cert.leaveEndDate).toISOString().slice(0, 10) : "");
    setHospitalName(cert.hospitalName || "Sports Complex Medical & Sports Rehab Center");
    setAuditNote("");
    setShowAddModal(true);
  };

  // Quick Preset Handlers
  const applyPreset = (preset: 'SPORTS' | 'SICK_LEAVE' | 'INJURY') => {
    if (preset === 'SPORTS') {
      setStatus("SPORTS_CLEARANCE");
      setFitnessStatus("FIT");
      setDiagnosis("ຮ່າງກາຍແຂງແຮງສົມບູນ, ບໍ່ພົບພະຍາດຕິດຕໍ່ ຫຼື ອາການບາດເຈັບທີ່ເປັນອຸປະສັກ");
      setSymptoms("ສຸຂະພາບທົ່ວໄປປົກກະຕິ, ຜົນກວດສັນຍານຊີບຢູ່ໃນເກນມາດຕະຖານ");
      setDoctorAdvice("ພ້ອມເຂົ້າຮ່ວມການຝຶກຊ້ອມ ແລະ ລົງແຂ່ງຂັນກິລາທຸກປະເພດໄດ້");
      setLeaveDays("");
      setLeaveStartDate("");
      setLeaveEndDate("");
    } else if (preset === 'SICK_LEAVE') {
      setStatus("SICK_LEAVE");
      setFitnessStatus("SICK_LEAVE");
      setDiagnosis("ໄຂ້ຫວັດໃຫຍ່ (Upper Respiratory Tract Infection / Influenza)");
      setSymptoms("ມີອາການໄຂ້, ໄອ, ເຈັບຄໍ, ເມື່ອຍລ້າ ແລະ ອ່ອນເພຍ");
      setDoctorAdvice("ເຫັນຄວນໃຫ້ພັກຜ່ອນ, ດື່ມນ້ຳຫຼາຍໆ ແລະ ງົດກິດຈະກຳກິລາໜັກຊົ່ວຄາວ");
      setLeaveDays("3");
      const today = new Date();
      setLeaveStartDate(today.toISOString().slice(0, 10));
      const end = new Date(today);
      end.setDate(today.getDate() + 2);
      setLeaveEndDate(end.toISOString().slice(0, 10));
    } else if (preset === 'INJURY') {
      setStatus("INJURY_REPORT");
      setFitnessStatus("RESTRICTED");
      setDiagnosis("ກ້າມຊີ້ນຂາອັກເສບ / ຂໍ້ຕີນເຄັດ (Moderate Muscle Strain / Joint Sprain)");
      setSymptoms("ມີອາການບວມ ແລະ ເຈັບປວດບໍລິເວນຂໍ້ຕໍ່ເວລາລົງນ້ຳໜັກ");
      setDoctorAdvice("ຫຼີກລ່ຽງການແລ່ນ ຫຼື ລົງນ້ຳໜັກໜັກ, ແນະນຳເຮັດກາຍະພາບບຳບັດເບົາໆ");
      setLeaveDays("7");
      const today = new Date();
      setLeaveStartDate(today.toISOString().slice(0, 10));
      const end = new Date(today);
      end.setDate(today.getDate() + 6);
      setLeaveEndDate(end.toISOString().slice(0, 10));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !diagnosis.trim() || !doctorName.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ຄົນເຈັບ, ການວິນິດໄສ ແລະ ຊື່ແພດຜູ້ກວດ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        certificateNo,
        patientName,
        patientAge: parseInt(patientAge) || 0,
        patientGender,
        patientPhone,
        diagnosis,
        symptoms,
        doctorAdvice,
        doctorName,
        doctorLicense,
        fitnessStatus,
        status,
        leaveDays: leaveDays ? parseInt(leaveDays) : null,
        leaveStartDate: leaveStartDate || null,
        leaveEndDate: leaveEndDate || null,
        hospitalName,
        auditNote: auditNote.trim() || (editingCert ? "ອັບເດດຂໍ້ມູນໃບຢັ້ງຢືນການແພດ" : `ອອກໃບຢັ້ງຢືນການແພດເລກທີ ${certificateNo}`)
      };

      const url = editingCert ? `/api/dashboard/certificates/${editingCert.id}` : "/api/dashboard/certificates";
      const method = editingCert ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingCert ? "ອັບເດດໃບຢັ້ງຢືນສຳເລັດ" : "ອອກໃບຢັ້ງຢືນການແພດສຳເລັດ");
        setShowAddModal(false);
        resetForm();
        fetchRecords();
      } else {
        const err = await res.json();
        toast.error(err.error || "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
      }
    } catch (err) {
      toast.error("ເຊື່ອມຕໍ່ລະບົບບໍ່ສຳເລັດ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບໃບຢັ້ງຢືນການແພດນີ້? ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້."))) return;
    try {
      const res = await fetch(`/api/dashboard/certificates/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລົບໃບຢັ້ງຢືນສຳເລັດ");
        if (selectedCert?.id === id) setSelectedCert(null);
        fetchRecords();
      } else {
        toast.error("ບໍ່ສາມາດລົບຂໍ້ມູນໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລົບ");
    }
  };

  // Filter & Search
  const filteredRecords = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = 
      r.patientName.toLowerCase().includes(q) ||
      r.certificateNo.toLowerCase().includes(q) ||
      (r.patientPhone && r.patientPhone.includes(q)) ||
      r.diagnosis.toLowerCase().includes(q) ||
      r.doctorName.toLowerCase().includes(q);

    const matchType = typeFilter === "ALL" || r.status === typeFilter;
    return matchSearch && matchType;
  });

  // KPIs
  const totalCerts = records.length;
  const sportsClearanceCount = records.filter(r => r.status === "SPORTS_CLEARANCE").length;
  const sickLeaveCount = records.filter(r => r.status === "SICK_LEAVE").length;
  const thisMonthCount = records.filter(r => {
    const d = new Date(r.issueDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <FileText className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
              ອອກໃບຮັບຮອງແພດ (Medical Certificates)
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ໃບຢັ້ງຢືນສຸຂະພາບແຂ່ງຂັນກິລາ, ໃບລາພັກປິ່ນປົວ & ໃບຢັ້ງຢືນການບາດເຈັບ
            </p>
          </div>
        </div>
        <button 
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 
          ອອກໃບຢັ້ງຢືນໃໝ່
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-zinc-400 font-medium">ໃບຢັ້ງຢືນທັງໝົດ</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalCerts}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-zinc-400 font-medium">ຢັ້ງຢືນແຂ່ງຂັນກິລາ</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{sportsClearanceCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <BadgeCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-zinc-400 font-medium">ໃບລາພັກປິ່ນປົວ</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{sickLeaveCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-zinc-400 font-medium">ອອກໃນເດືອນນີ້</p>
            <h3 className="text-2xl font-bold text-sky-400 mt-1">{thisMonthCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: List of Certificates */}
        <div className={`lg:col-span-${selectedCert ? '6' : '12'} transition-all duration-300`}>
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
            
            {/* Search & Filter Tabs */}
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/60 space-y-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="ຄົ້ນຫາເລກທີໃບຢັ້ງຢືນ, ຊື່ຄົນເຈັບ, ການວິນິດໄສ..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                {[
                  { key: "ALL", label: "ທັງໝົດ" },
                  { key: "SPORTS_CLEARANCE", label: "ແຂ່ງຂັນກິລາ" },
                  { key: "SICK_LEAVE", label: "ລາພັກປິ່ນປົວ" },
                  { key: "INJURY_REPORT", label: "ບາດເຈັບກິລາ" },
                  { key: "STANDARD", label: "ທົ່ວໄປ" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setTypeFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      typeFilter === tab.key 
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-zinc-800/40 max-h-[720px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                  <p className="text-zinc-500 text-xs mt-2">ກຳລັງໂຫຼດໃບຢັ້ງຢືນ...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-400 text-base font-semibold">ບໍ່ພົບໃບຢັ້ງຢືນການແພດ</p>
                  <p className="text-zinc-600 text-xs mt-1">ກົດປຸ່ມ "ອອກໃບຢັ້ງຢືນໃໝ່" ເພື່ອເລີ່ມຕົ້ນສ້າງໃບຢັ້ງຢືນ</p>
                </div>
              ) : (
                filteredRecords.map(record => {
                  const isSelected = selectedCert?.id === record.id;
                  return (
                    <div 
                      key={record.id}
                      onClick={() => setSelectedCert(record)}
                      className={`p-4 cursor-pointer transition-all hover:bg-zinc-800/40 flex items-center justify-between group border-l-4 ${
                        isSelected 
                          ? 'bg-indigo-500/10 border-l-indigo-500' 
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 overflow-hidden">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'
                        }`}>
                          <Award className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors truncate">
                              {record.patientName}
                            </h3>
                            <span className="font-mono text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                              {record.certificateNo}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              record.status === "SPORTS_CLEARANCE" ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              record.status === "SICK_LEAVE" ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                              record.status === "INJURY_REPORT" ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                              'bg-zinc-800 text-zinc-300 border-zinc-700'
                            }`}>
                              {record.status === "SPORTS_CLEARANCE" ? "ຢັ້ງຢືນແຂ່ງຂັນກິລາ" :
                               record.status === "SICK_LEAVE" ? `ລາພັກ (${record.leaveDays || 0} ວັນ)` :
                               record.status === "INJURY_REPORT" ? "ບາດເຈັບກິລາ" : "ທົ່ວໄປ"}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-400 truncate max-w-sm">
                            ການບົ່ງມະຕິ: {record.diagnosis}
                          </p>

                          <div className="text-[11px] text-zinc-500 flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-zinc-400" />
                              {new Date(record.issueDate).toLocaleDateString()}
                            </span>
                            <span>ແພດ: {record.doctorName}</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-transform ${
                        isSelected ? 'text-indigo-500 translate-x-1' : 'text-zinc-600 group-hover:text-zinc-400'
                      }`} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Certificate Preview & Controls */}
        {selectedCert && (
          <div className="lg:col-span-6 animate-in slide-in-from-right-6 duration-300">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl sticky top-6">
              
              {/* Header Action Bar */}
              <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/60 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <h2 className="font-bold text-white text-base">ລາຍລະອຽດໃບຢັ້ງຢືນການແພດ</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowAuditModal(true)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors text-xs flex items-center gap-1 border border-zinc-800"
                    title="ປະຫວັດການບັນທຶກ"
                  >
                    <History className="w-4 h-4 text-indigo-400" />
                    <span className="hidden sm:inline">ປະຫວັດ</span>
                  </button>

                  <button 
                    onClick={() => setShowPrintModal(true)}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors text-xs flex items-center gap-1.5 font-bold shadow-md shadow-indigo-500/20"
                    title="ພິມໃບຢັ້ງຢືນສະບັບທາງການ"
                  >
                    <Printer className="w-4 h-4" />
                    <span>ພິມໃບຢັ້ງຢືນ</span>
                  </button>

                  <button 
                    onClick={() => openEditModal(selectedCert)}
                    className="p-2 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-xs flex items-center gap-1"
                    title="ແກ້ໄຂ"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => setSelectedCert(null)}
                    className="p-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Certificate Details View */}
              <div className="p-6 space-y-6">
                
                {/* Meta Header */}
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-indigo-400 font-bold block mb-1">
                      {selectedCert.certificateNo}
                    </span>
                    <h3 className="text-xl font-bold text-white">{selectedCert.patientName}</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      ອາຍຸ: {selectedCert.patientAge} ປີ • ເພດ: {selectedCert.patientGender} 
                      {selectedCert.patientPhone ? ` • ໂທ: ${selectedCert.patientPhone}` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold border ${
                      selectedCert.fitnessStatus === "FIT" ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      selectedCert.fitnessStatus === "RESTRICTED" ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      selectedCert.fitnessStatus === "SICK_LEAVE" ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {selectedCert.fitnessStatus === "FIT" ? "ແຂງແຮງດີ (FIT)" :
                       selectedCert.fitnessStatus === "RESTRICTED" ? "ຈຳກັດການຝຶກຊ້ອມ" :
                       selectedCert.fitnessStatus === "SICK_LEAVE" ? "ລາພັກປິ່ນປົວ" : "ບໍ່ພ້ອມແຂ່ງຂັນ (UNFIT)"}
                    </span>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      ວັນທີອອກ: {new Date(selectedCert.issueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Medical Details */}
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-zinc-500 font-medium uppercase tracking-wider block mb-1.5">
                      ຜົນການກວດວິນິດໄສ (Diagnosis)
                    </span>
                    <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm font-semibold">
                      {selectedCert.diagnosis}
                    </div>
                  </div>

                  {selectedCert.symptoms && (
                    <div>
                      <span className="text-zinc-500 font-medium uppercase tracking-wider block mb-1.5">
                        ອາການທີ່ພົບເຫັນ (Symptoms)
                      </span>
                      <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 leading-relaxed">
                        {selectedCert.symptoms}
                      </div>
                    </div>
                  )}

                  {selectedCert.doctorAdvice && (
                    <div>
                      <span className="text-zinc-500 font-medium uppercase tracking-wider block mb-1.5">
                        ຄຳແນະນຳ ແລະ ຄວາມເຫັນຂອງແພດ (Doctor's Advice)
                      </span>
                      <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 leading-relaxed">
                        {selectedCert.doctorAdvice}
                      </div>
                    </div>
                  )}

                  {/* Sick Leave Days */}
                  {selectedCert.status === "SICK_LEAVE" && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-amber-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <div>
                          <strong className="block text-sm">ອະນຸຍາດໃຫ້ລາພັກຜ່ອນ {selectedCert.leaveDays || 0} ວັນ</strong>
                          <span className="text-[11px] text-amber-400/80">
                            {selectedCert.leaveStartDate ? `ຕັ້ງແຕ່ວັນທີ ${new Date(selectedCert.leaveStartDate).toLocaleDateString()}` : ''}
                            {selectedCert.leaveEndDate ? ` ເຖິງວັນທີ ${new Date(selectedCert.leaveEndDate).toLocaleDateString()}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Doctor Info Box */}
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">ແພດຜູ້ອອກໃບຢັ້ງຢືນ:</span>
                      <strong className="text-white text-sm">{selectedCert.doctorName}</strong>
                    </div>
                    {selectedCert.doctorLicense && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-500">ເລກທະບຽນວິຊາຊີບແພດ:</span>
                        <span className="text-indigo-400 font-mono">{selectedCert.doctorLicense}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500">ສະຖານພະຍາບານ:</span>
                      <span className="text-zinc-300">{selectedCert.hospitalName}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Delete Action */}
                <div className="flex justify-end pt-2 border-t border-zinc-800/80">
                  <button 
                    onClick={() => handleDelete(selectedCert.id)}
                    className="px-3.5 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> ລົບໃບຢັ້ງຢືນນີ້
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: Issue or Edit Certificate */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingCert ? "ແກ້ໄຂໃບຢັ້ງຢືນການແພດ" : "ອອກໃບຢັ້ງຢືນການແພດໃໝ່"}
                  </h2>
                  <p className="text-xs text-zinc-400">ລະບົບອອກໃບຢັ້ງຢືນສຸຂະພາບກິລາ ແລະ ໃບລາພັກປິ່ນປົວ</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Quick Presets Bar */}
            {!editingCert && (
              <div className="p-3 bg-zinc-950/90 border-b border-zinc-800/80 flex items-center gap-2 overflow-x-auto custom-scrollbar flex-shrink-0">
                <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 pl-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> ເລືອກແບບດ່ວນ:
                </span>
                <button
                  type="button"
                  onClick={() => applyPreset('SPORTS')}
                  className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  ຢັ້ງຢືນແຂ່ງຂັນກິລາ (Fit for Sports)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('SICK_LEAVE')}
                  className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  ໃບລາພັກປິ່ນປົວ (Sick Leave)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('INJURY')}
                  className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  ໃບຢັ້ງຢືນບາດເຈັບ (Injury Assessment)
                </button>
              </div>
            )}

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <form id="cert-form" onSubmit={handleSave} className="space-y-6">
                
                {/* 1. Patient & Cert Meta */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider pb-2 border-b border-zinc-800 flex items-center gap-2">
                    <User className="w-4 h-4" /> 1. ຂໍ້ມູນຄົນເຈັບ & ເລກທີໃບຢັ້ງຢືນ
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        ເລກທີໃບຢັ້ງຢືນ (Certificate No.)
                      </label>
                      <input 
                        type="text" 
                        required
                        value={certificateNo}
                        onChange={e => setCertificateNo(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        ຊື່ ແລະ ນາມສະກຸນຄົນເຈັບ <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="ຕົວຢ່າງ: ທ້າວ ຄຳຫຼ້າ ວົງສະຫວັນ"
                        value={patientName}
                        onChange={e => setPatientName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        ອາຍຸ (ປີ) <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="number" 
                        required
                        placeholder="22"
                        value={patientAge}
                        onChange={e => setPatientAge(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">ເພດ</label>
                      <select 
                        value={patientGender}
                        onChange={e => setPatientGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="ຊາຍ">ຊາຍ (Male)</option>
                        <option value="ຍິງ">ຍິງ (Female)</option>
                        <option value="ອື່ນໆ">ອື່ນໆ (Other)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">ເບີໂທລະສັບ</label>
                      <input 
                        type="text" 
                        placeholder="020 xxxxxxxx"
                        value={patientPhone}
                        onChange={e => setPatientPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Certificate Type & Fitness Status */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider pb-2 border-b border-zinc-800 flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4" /> 2. ປະເພດໃບຢັ້ງຢືນ & ຄວາມພ້ອມດ້ານຮ່າງກາຍ
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">ປະເພດໃບຢັ້ງຢືນ</label>
                      <select 
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="SPORTS_CLEARANCE">ໃບຢັ້ງຢືນຄວາມພ້ອມແຂ່ງຂັນກິລາ (Sports Clearance)</option>
                        <option value="SICK_LEAVE">ໃບລາພັກປິ່ນປົວ (Sick Leave Certificate)</option>
                        <option value="INJURY_REPORT">ໃບລາຍງານການບາດເຈັບ (Sports Injury Report)</option>
                        <option value="STANDARD">ໃບຢັ້ງຢືນສຸຂະພາບທົ່ວໄປ (General Health Certificate)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        ສະພາບຄວາມພ້ອມດ້ານຮ່າງກາຍ (Fitness Status)
                      </label>
                      <select 
                        value={fitnessStatus}
                        onChange={e => setFitnessStatus(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="FIT">ແຂງແຮງສົມບູນດີ - ພ້ອມແຂ່ງຂັນກິລາ (Fit for Competition)</option>
                        <option value="RESTRICTED">ຝຶກຊ້ອມແບບຈຳກັດ / ຫ້າມລົງແຂ່ງຂັນ (Restricted Training)</option>
                        <option value="SICK_LEAVE">ເຫັນຄວນໃຫ້ພັກຜ່ອນຮັກສາອາການ (Sick Leave Recommended)</option>
                        <option value="UNFIT">ຮ່າງກາຍບໍ່ພ້ອມແຂ່ງຂັນ (Unfit for Competition)</option>
                      </select>
                    </div>
                  </div>

                  {status === "SICK_LEAVE" && (
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">ຈຳນວນວັນທີ່ລາພັກ</label>
                        <input 
                          type="number" 
                          placeholder="3"
                          value={leaveDays}
                          onChange={e => setLeaveDays(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">ຕັ້ງແຕ່ວັນທີ</label>
                        <input 
                          type="date" 
                          value={leaveStartDate}
                          onChange={e => setLeaveStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">ເຖິງວັນທີ</label>
                        <input 
                          type="date" 
                          value={leaveEndDate}
                          onChange={e => setLeaveEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Clinical Assessment */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider pb-2 border-b border-zinc-800 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" /> 3. ຜົນການວິນິດໄສ & ຄຳແນະນຳຂອງແພດ
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      ຜົນການບົ່ງມະຕິພະຍາດ (Clinical Diagnosis) <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="ຕົວຢ່າງ: Normal Physical Examination, No contraindication for sports"
                      value={diagnosis}
                      onChange={e => setDiagnosis(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      ອາການ ແລະ ຜົນກວດຮ່າງກາຍ (Symptoms & Findings)
                    </label>
                    <textarea 
                      rows={2}
                      placeholder="ລະບຸອາການ ຫຼື ຜົນການກວດສັນຍານຊີບ, ລະບົບຫົວໃຈ, ກະດູກ ແລະ ກ້າມຊີ້ນ..."
                      value={symptoms}
                      onChange={e => setSymptoms(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      ຄຳແນະນຳ ແລະ ຄວາມເຫັນຂອງແພດ (Doctor's Advice & Remarks)
                    </label>
                    <textarea 
                      rows={2}
                      placeholder="ຕົວຢ່າງ: ພ້ອມເຂົ້າຮ່ວມການຝຶກຊ້ອມ ແລະ ແຂ່ງຂັນກິລາທຸກປະເພດ / ງົດກິລາກະທົບໜັກ 1 ອາທິດ..."
                      value={doctorAdvice}
                      onChange={e => setDoctorAdvice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                </div>

                {/* 4. Doctor Info & Clinic Name */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider pb-2 border-b border-zinc-800 flex items-center gap-2">
                    <Award className="w-4 h-4" /> 4. ຂໍ້ມູນແພດຜູ້ກວດ & ສະຖານພະຍາບານ
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        ຊື່ແພດຜູ້ກວດ <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="ນາຍແພດ ປະຈຳສູນ"
                        value={doctorName}
                        onChange={e => setDoctorName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        ເລກທະບຽນວິຊາຊີບແພດ (Medical License No.)
                      </label>
                      <input 
                        type="text" 
                        placeholder="MD-LAO-2024/098"
                        value={doctorLicense}
                        onChange={e => setDoctorLicense(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        ຊື່ສະຖານພະຍາບານ / ສູນກິລາ
                      </label>
                      <input 
                        type="text" 
                        value={hospitalName}
                        onChange={e => setHospitalName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {editingCert && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        ເຫດຜົນໃນການແກ້ໄຂ (ບັນທຶກເຂົ້າ Audit Log)
                      </label>
                      <input 
                        type="text" 
                        placeholder="ຕົວຢ່າງ: ແກ້ໄຂວັນທີລາພັກ ແລະ ປັບປຸງຄຳແນະນຳ..."
                        value={auditNote}
                        onChange={e => setAuditNote(e.target.value)}
                        className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex justify-end gap-3 flex-shrink-0">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-sm font-semibold transition-colors"
              >
                ຍົກເລີກ
              </button>
              <button 
                type="submit"
                form="cert-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingCert ? "ອັບເດດໃບຢັ້ງຢືນ" : "ອອກໃບຢັ້ງຢືນ"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Official Printable Medical Certificate */}
      {showPrintModal && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center print:hidden">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-400" /> ຕົວຢ່າງໃບຢັ້ງຢືນການແພດສະບັບທາງການ (Print Preview)
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> ພິມໃບຢັ້ງຢືນ
                </button>
                <button 
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Printable Sheet Area (Classic Lao Formal Layout) */}
            <div className="p-10 overflow-y-auto flex-1 bg-white text-zinc-900 font-sans" id="printable-medical-cert">
              
              {/* National Header */}
              <div className="text-center mb-6">
                <h2 className="text-xs font-bold tracking-widest text-zinc-900 uppercase">
                  ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
                </h2>
                <h3 className="text-xs text-zinc-800 mt-0.5">
                  ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
                </h3>
                <div className="w-24 h-0.5 bg-zinc-900 mx-auto mt-2 mb-4"></div>
                <p className="text-[11px] text-zinc-600 font-medium">
                  {selectedCert.hospitalName || "ສູນການແພດກິລາ ແລະ ຟື້ນຟູສະມັດຖະພາບ Sports Complex"}
                </p>
              </div>

              {/* Document Reference Bar */}
              <div className="flex justify-between items-center text-xs border-b border-zinc-300 pb-3 mb-6">
                <div>
                  <span>ເລກທີ / No: </span>
                  <strong className="font-mono">{selectedCert.certificateNo}</strong>
                </div>
                <div>
                  <span>ວັນທີ / Date: </span>
                  <strong>{new Date(selectedCert.issueDate).toLocaleDateString()}</strong>
                </div>
              </div>

              {/* Certificate Title */}
              <div className="text-center my-6">
                <h1 className="text-xl font-bold tracking-wider text-zinc-900 uppercase">
                  ໃບຢັ້ງຢືນການແພດ
                </h1>
                <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mt-0.5">
                  MEDICAL CERTIFICATE
                </p>
                <div className="mt-2 inline-block px-3 py-1 rounded border border-zinc-400 text-xs font-bold uppercase">
                  {selectedCert.status === "SPORTS_CLEARANCE" ? "ໃບຢັ້ງຢືນສຸຂະພາບແຂ່ງຂັນກິລາ (SPORTS CLEARANCE)" :
                   selectedCert.status === "SICK_LEAVE" ? "ໃບລາພັກປິ່ນປົວ (SICK LEAVE CERTIFICATE)" :
                   selectedCert.status === "INJURY_REPORT" ? "ໃບລາຍງານການບາດເຈັບກິລາ (SPORTS INJURY REPORT)" :
                   "ໃບຢັ້ງຢືນສຸຂະພາບທົ່ວໄປ (GENERAL HEALTH)"}
                </div>
              </div>

              {/* Formal Text Body */}
              <div className="space-y-4 text-xs leading-relaxed text-zinc-800 my-6">
                <p>
                  ຂ້າພະເຈົ້າ ນາຍແພດ <strong>{selectedCert.doctorName}</strong>, 
                  ເລກທະບຽນວິຊາຊີບແພດ <strong>{selectedCert.doctorLicense || "-"}</strong>, 
                  ປະຈຳສະຖານພະຍາບານ <strong>{selectedCert.hospitalName}</strong>, 
                  ຂໍຢັ້ງຢືນວ່າ ໄດ້ທຳການກວດຮ່າງກາຍຂອງ:
                </p>

                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
                  <div>
                    <span className="text-zinc-500 block">ຊື່ ແລະ ນາມສະກຸນ:</span>
                    <strong className="text-zinc-900 text-sm">{selectedCert.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">ອາຍຸ:</span>
                    <strong className="text-zinc-900">{selectedCert.patientAge} ປີ</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">ເພດ:</span>
                    <strong className="text-zinc-900">{selectedCert.patientGender}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">ເບີໂທລະສັບ:</span>
                    <strong className="text-zinc-900">{selectedCert.patientPhone || "-"}</strong>
                  </div>
                </div>

                <p>
                  ກວດຮ່າງກາຍເມື່ອວັນທີ <strong>{new Date(selectedCert.issueDate).toLocaleDateString()}</strong> 
                  ພົບວ່າມີຜົນການວິນິດໄສ ແລະ ອາການດັ່ງລຸ່ມນີ້:
                </p>

                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
                  <div>
                    <strong className="text-zinc-900">ຜົນການບົ່ງມະຕິ (Diagnosis): </strong>
                    <span className="text-zinc-900 font-semibold">{selectedCert.diagnosis}</span>
                  </div>
                  {selectedCert.symptoms && (
                    <div>
                      <strong className="text-zinc-900">ອາການ ແລະ ຜົນກວດ (Findings): </strong>
                      <span className="text-zinc-700">{selectedCert.symptoms}</span>
                    </div>
                  )}
                </div>

                {/* Fitness Assessment Block */}
                <div className="p-4 bg-zinc-100 border border-zinc-300 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <strong className="text-zinc-900">ສະພາບຄວາມພ້ອມດ້ານຮ່າງກາຍ (Physical Fitness):</strong>
                    <span className="font-bold underline text-zinc-900">
                      {selectedCert.fitnessStatus === "FIT" ? "ແຂງແຮງສົມບູນດີ ພ້ອມເຂົ້າຮ່ວມການຝຶກຊ້ອມ ແລະ ລົງແຂ່ງຂັນກິລາ" :
                       selectedCert.fitnessStatus === "RESTRICTED" ? "ຝຶກຊ້ອມແບບຈຳກັດ / ຫ້າມລົງແຂ່ງຂັນກິລາທີ່ມີການປະທະ" :
                       selectedCert.fitnessStatus === "SICK_LEAVE" ? "ເຫັນຄວນໃຫ້ລາພັກຜ່ອນຮັກສາອາການເຈັບປ່ວຍ" : "ຮ່າງກາຍບໍ່ພ້ອມລົງແຂ່ງຂັນ"}
                    </span>
                  </div>

                  {selectedCert.status === "SICK_LEAVE" && (
                    <p className="text-zinc-900">
                      ເຫັນຄວນໃຫ້ລາພັກຜ່ອນຮັກສາອາການເປັນເວລາ <strong>{selectedCert.leaveDays || 0}</strong> ວັນ 
                      {selectedCert.leaveStartDate ? ` ນັບຕັ້ງແຕ່ວັນທີ ${new Date(selectedCert.leaveStartDate).toLocaleDateString()}` : ''}
                      {selectedCert.leaveEndDate ? ` ເຖິງວັນທີ ${new Date(selectedCert.leaveEndDate).toLocaleDateString()}` : ''}
                    </p>
                  )}

                  {selectedCert.doctorAdvice && (
                    <div>
                      <strong className="text-zinc-900">ຄຳແນະນຳເພີ່ມເຕີມ: </strong>
                      <span className="text-zinc-800">{selectedCert.doctorAdvice}</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-zinc-500 italic pt-2">
                  ໃບຢັ້ງຢືນການແພດສະບັບນີ້ ອອກໃຫ້ເພື່ອຢັ້ງຢືນສະພາບສຸຂະພາບຕາມຄວາມເປັນຈິງໃນວັນທີກວດ ແລະ ສາມາດນຳໃຊ້ເປັນຫຼັກຖານທາງການໄດ້.
                </p>
              </div>

              {/* Seal & Signatures Area */}
              <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-zinc-200 text-xs">
                
                {/* Official Seal Graphic */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-2 border-red-600 border-dashed flex flex-col items-center justify-center text-red-600 rotate-[-8deg] p-2 text-center opacity-85 select-none">
                    <span className="text-[8px] font-bold uppercase">SPORTS COMPLEX</span>
                    <span className="text-[9px] font-extrabold uppercase">ຕາປະທັບທາງການ</span>
                    <span className="text-[7px]">CLINIC OFFICIAL SEAL</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-2">ຕາປະທັບສະຖານພະຍາບານ</span>
                </div>

                {/* Doctor Signature */}
                <div className="text-center flex flex-col items-center justify-end">
                  <div className="h-16 flex items-end justify-center">
                    <span className="text-zinc-300 font-mono text-xs">_______________________________</span>
                  </div>
                  <p className="font-bold text-zinc-900 mt-1">({selectedCert.doctorName})</p>
                  <p className="text-[10px] text-zinc-600">ແພດຜູ້ກວດກາ ແລະ ອອກໃບຢັ້ງຢືນ</p>
                  {selectedCert.doctorLicense && (
                    <p className="text-[9px] font-mono text-zinc-500">ເລກທະບຽນ: {selectedCert.doctorLicense}</p>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: Audit Trail Log */}
      {showAuditModal && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" /> ປະຫວັດການອອກ ແລະ ແກ້ໄຂໃບຢັ້ງຢືນ (Audit Log)
              </h3>
              <button onClick={() => setShowAuditModal(false)} className="text-zinc-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {Array.isArray(selectedCert.statusHistory) && selectedCert.statusHistory.length > 0 ? (
                <div className="relative border-l border-zinc-800 ml-3 pl-5 space-y-4">
                  {selectedCert.statusHistory.map((h, i) => (
                    <div key={i} className="relative group">
                      <span className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-500 ring-4 ring-zinc-900" />
                      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                        <div className="flex justify-between items-start text-xs">
                          <strong className="text-white font-medium">{h.action}</strong>
                          <span className="text-zinc-500 text-[10px]">{new Date(h.changedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-zinc-300">{h.note || "ບໍ່ມີໝາຍເຫດ"}</p>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 pt-1">
                          <span>ດຳເນີນການໂດຍ: <strong className="text-zinc-300">{h.changedBy?.name || "Doctor"}</strong></span>
                          {h.changedBy?.role && <span className="text-indigo-400 font-mono">[{h.changedBy.role}]</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-zinc-500 text-xs py-8">ບໍ່ມີປະຫວັດການປ່ຽນແປງ</p>
              )}
            </div>

            <div className="p-3 border-t border-zinc-800 bg-zinc-950 text-right">
              <button 
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold"
              >
                ປິດ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
