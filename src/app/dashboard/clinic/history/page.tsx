"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, Heart, Thermometer, User, ClipboardList, Stethoscope, 
  Droplet, CheckCircle, XCircle, Trash2, Calendar, FileText, ChevronRight, 
  Loader2, Plus, Search, Edit3, Printer, Phone, AlertTriangle, Pill, 
  Clock, History, Shield, Scale, Ruler, Sparkles, Filter, UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { askConfirm } from "@/components/ConfirmModal";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  days: string;
  notes?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string;
  note?: string;
  changedBy: {
    id?: string | null;
    name: string;
    email?: string;
    role?: string;
  };
  changedAt: string;
}

interface ClinicRecord {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender?: string;
  patientPhone?: string;
  bloodType?: string;
  allergies?: string;
  weight?: number;
  height?: number;
  visitDate: string;
  chiefComplaint: string;
  diagnosis?: string;
  treatment?: string;
  medications?: Medication[];
  bloodPressure?: string;
  temperature?: string;
  pulse?: string;
  oxygenSat?: string;
  doctorNotes?: string;
  doctorName?: string;
  followUpDate?: string;
  cost?: number;
  status: string;
  statusHistory?: AuditEntry[];
}

export default function ClinicHistoryPage() {
  const [records, setRecords] = useState<ClinicRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ClinicRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ClinicRecord | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Form State
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("ຊາຍ");
  const [patientPhone, setPatientPhone] = useState("");
  const [bloodType, setBloodType] = useState("O");
  const [allergies, setAllergies] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", days: "", notes: "" }
  ]);
  const [bloodPressure, setBloodPressure] = useState("");
  const [temperature, setTemperature] = useState("");
  const [pulse, setPulse] = useState("");
  const [oxygenSat, setOxygenSat] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [cost, setCost] = useState("");
  const [status, setStatus] = useState("COMPLETED");
  const [auditNote, setAuditNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/dashboard/clinic");
      const data = await res.json();
      if (res.ok) {
        setRecords(data);
        if (selectedRecord) {
          const fresh = data.find((r: ClinicRecord) => r.id === selectedRecord.id);
          if (fresh) setSelectedRecord(fresh);
        }
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນປະຫວັດການປິ່ນປົວໄດ້");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPatientName("");
    setPatientAge("");
    setPatientGender("ຊາຍ");
    setPatientPhone("");
    setBloodType("O");
    setAllergies("");
    setWeight("");
    setHeight("");
    setChiefComplaint("");
    setDiagnosis("");
    setTreatment("");
    setMedications([{ name: "", dosage: "", frequency: "", days: "", notes: "" }]);
    setBloodPressure("");
    setTemperature("");
    setPulse("");
    setOxygenSat("");
    setDoctorNotes("");
    setDoctorName("");
    setFollowUpDate("");
    setCost("");
    setStatus("COMPLETED");
    setAuditNote("");
    setEditingRecord(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (rec: ClinicRecord) => {
    setEditingRecord(rec);
    setPatientName(rec.patientName);
    setPatientAge(rec.patientAge ? rec.patientAge.toString() : "");
    setPatientGender(rec.patientGender || "ຊາຍ");
    setPatientPhone(rec.patientPhone || "");
    setBloodType(rec.bloodType || "O");
    setAllergies(rec.allergies || "");
    setWeight(rec.weight ? rec.weight.toString() : "");
    setHeight(rec.height ? rec.height.toString() : "");
    setChiefComplaint(rec.chiefComplaint || "");
    setDiagnosis(rec.diagnosis || "");
    setTreatment(rec.treatment || "");
    setMedications(Array.isArray(rec.medications) && rec.medications.length > 0 ? rec.medications : [{ name: "", dosage: "", frequency: "", days: "", notes: "" }]);
    setBloodPressure(rec.bloodPressure || "");
    setTemperature(rec.temperature || "");
    setPulse(rec.pulse || "");
    setOxygenSat(rec.oxygenSat || "");
    setDoctorNotes(rec.doctorNotes || "");
    setDoctorName(rec.doctorName || "");
    setFollowUpDate(rec.followUpDate ? new Date(rec.followUpDate).toISOString().slice(0, 10) : "");
    setCost(rec.cost ? rec.cost.toString() : "0");
    setStatus(rec.status || "COMPLETED");
    setAuditNote("");
    setShowAddModal(true);
  };

  const handleAddMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", days: "", notes: "" }]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index: number, field: keyof Medication, val: string) => {
    const updated = [...medications];
    updated[index][field] = val;
    setMedications(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientAge || !chiefComplaint.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ຄົນເຈັບ, ອາຍຸ ແລະ ອາການສຳຄັນໃຫ້ຄົບຖ້ວນ");
    }

    setIsSubmitting(true);
    const cleanedMeds = medications.filter(m => m.name.trim() !== "");

    try {
      const payload = {
        patientName,
        patientAge: parseInt(patientAge),
        patientGender,
        patientPhone,
        bloodType,
        allergies,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        chiefComplaint,
        diagnosis,
        treatment,
        medications: cleanedMeds,
        bloodPressure,
        temperature,
        pulse,
        oxygenSat,
        doctorNotes,
        doctorName,
        followUpDate: followUpDate || null,
        cost: cost ? parseFloat(cost) : 0,
        status,
        auditNote: auditNote.trim() || (editingRecord ? "ອັບເດດຂໍ້ມູນການປິ່ນປົວ" : "ບັນທຶກປະຫວັດການກວດໃໝ່")
      };

      const url = editingRecord ? `/api/dashboard/clinic/${editingRecord.id}` : "/api/dashboard/clinic";
      const method = editingRecord ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingRecord ? "ອັບເດດປະຫວັດສຳເລັດ" : "ບັນທຶກປະຫວັດການກວດໃໝ່ສຳເລັດ");
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
    if (!(await askConfirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບປະຫວັດການປິ່ນປົວນີ້? ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້."))) return;
    try {
      const res = await fetch(`/api/dashboard/clinic/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລົບປະຫວັດການປິ່ນປົວສຳເລັດ");
        if (selectedRecord?.id === id) setSelectedRecord(null);
        fetchRecords();
      } else {
        toast.error("ບໍ່ສາມາດລົບຂໍ້ມູນໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລົບຂໍ້ມູນ");
    }
  };

  // BMI Calculation
  const calculateBMI = (w?: number, h?: number) => {
    if (!w || !h || h <= 0) return null;
    const heightInMeters = h / 100;
    const bmi = w / (heightInMeters * heightInMeters);
    let statusText = "ປົກກະຕິ (Normal)";
    let colorClass = "text-emerald-400";
    if (bmi < 18.5) {
      statusText = "ນ້ຳໜັກຕ່ຳກວ່າເກນ (Underweight)";
      colorClass = "text-amber-400";
    } else if (bmi >= 23 && bmi < 25) {
      statusText = "ນ້ຳໜັກເກີນ (Overweight)";
      colorClass = "text-amber-400";
    } else if (bmi >= 25) {
      statusText = "ຕຸ້ຍ / ອ້ວນ (Obese)";
      colorClass = "text-rose-400";
    }
    return { val: bmi.toFixed(1), statusText, colorClass };
  };

  // Filter & Search
  const filteredRecords = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = 
      r.patientName.toLowerCase().includes(q) ||
      (r.patientPhone && r.patientPhone.includes(q)) ||
      r.chiefComplaint.toLowerCase().includes(q) ||
      (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
      (r.doctorName && r.doctorName.toLowerCase().includes(q));

    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // KPIs
  const totalVisits = records.length;
  const todayVisits = records.filter(r => new Date(r.visitDate).toDateString() === new Date().toDateString()).length;
  const followUpCount = records.filter(r => r.status === "FOLLOW_UP").length;
  const totalRevenue = records.reduce((sum, r) => sum + (r.cost || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/20 flex items-center justify-center">
            <Activity className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
              ປະຫວັດການປິ່ນປົວ (Clinic)
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              Sports Clinic, Physical Therapy & Patient Medical Chart
            </p>
          </div>
        </div>
        <button 
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 
          ເພີ່ມປະຫວັດການກວດໃໝ່
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-zinc-400 font-medium">ຜູ້ປ່ວຍທັງໝົດ</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalVisits}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-zinc-400 font-medium">ກວດມື້ນີ້</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{todayVisits}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-zinc-400 font-medium">ນັດຕິດຕາມອາການ</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{followUpCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-zinc-400 font-medium">ລາຍຮັບຄ່າປິ່ນປົວລວມ</p>
            <h3 className="text-2xl font-bold text-white mt-1">₭ {totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: List of Records */}
        <div className={`lg:col-span-${selectedRecord ? '5' : '12'} transition-all duration-300`}>
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
            
            {/* Search & Status Filters */}
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/60 space-y-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="ຄົ້ນຫາຊື່ຄົນເຈັບ, ເບີໂທ, ອາການ, ການບົ່ງມະຕິ..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                {[
                  { key: "ALL", label: "ທັງໝົດ" },
                  { key: "COMPLETED", label: "ສຳເລັດແລ້ວ" },
                  { key: "FOLLOW_UP", label: "ນັດກວດຄືນ" },
                  { key: "IN_TREATMENT", label: "ກຳລັງປິ່ນປົວ" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      statusFilter === tab.key 
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' 
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Records List */}
            <div className="divide-y divide-zinc-800/40 max-h-[720px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-500" />
                  <p className="text-zinc-500 text-xs mt-2">ກຳລັງໂຫຼດຂໍ້ມູນ...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                    <ClipboardList className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-400 text-base font-semibold">ບໍ່ພົບປະຫວັດການປິ່ນປົວ</p>
                  <p className="text-zinc-600 text-xs mt-1">ກົດປຸ່ມ "ເພີ່ມປະຫວັດການກວດໃໝ່" ເພື່ອເລີ່ມຕົ້ນບັນທຶກ</p>
                </div>
              ) : (
                filteredRecords.map(record => {
                  const isSelected = selectedRecord?.id === record.id;
                  return (
                    <div 
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className={`p-4 cursor-pointer transition-all hover:bg-zinc-800/40 flex items-center justify-between group border-l-4 ${
                        isSelected 
                          ? 'bg-sky-500/10 border-l-sky-500' 
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 overflow-hidden">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-sky-500 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'
                        }`}>
                          <User className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-white text-sm group-hover:text-sky-400 transition-colors truncate">
                              {record.patientName}
                            </h3>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {record.patientAge} ປີ ({record.patientGender || "ຊາຍ"})
                            </span>
                            {record.bloodType && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                ໝວດເລືອດ {record.bloodType}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-zinc-400 truncate max-w-xs">
                            {record.diagnosis ? `ວິນິດໄສ: ${record.diagnosis}` : record.chiefComplaint}
                          </p>
                          
                          <div className="text-[11px] text-zinc-500 flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-zinc-400" />
                              {new Date(record.visitDate).toLocaleDateString()}
                            </span>
                            {record.status === "FOLLOW_UP" && (
                              <span className="text-amber-400 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" /> ນັດຕິດຕາມ
                              </span>
                            )}
                            {record.cost && record.cost > 0 ? (
                              <span className="text-emerald-400 font-medium">
                                ₭ {record.cost.toLocaleString()}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-transform ${
                        isSelected ? 'text-sky-500 translate-x-1' : 'text-zinc-600 group-hover:text-zinc-400'
                      }`} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Patient Chart */}
        {selectedRecord && (
          <div className="lg:col-span-7 animate-in slide-in-from-right-6 duration-300">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl sticky top-6">
              
              {/* Header Actions */}
              <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/60 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <h2 className="font-bold text-white text-base">ແຟ້ມປະຫວັດການປິ່ນປົວ</h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowAuditModal(true)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors text-xs flex items-center gap-1 border border-zinc-800"
                    title="ເບິ່ງປະຫວັດການບັນທຶກ"
                  >
                    <History className="w-4 h-4 text-sky-400" />
                    <span className="hidden sm:inline">ປະຫວັດບັນທຶກ</span>
                  </button>

                  <button 
                    onClick={() => setShowPrintModal(true)}
                    className="p-2 text-zinc-300 hover:text-white bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 rounded-xl transition-colors text-xs flex items-center gap-1.5 border border-sky-500/30"
                    title="ພິມໃບສະຫຼຸບການປິ່ນປົວ"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline font-semibold">ພິມໃບສະຫຼຸບ</span>
                  </button>

                  <button 
                    onClick={() => openEditModal(selectedRecord)}
                    className="p-2 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-xs flex items-center gap-1"
                    title="ແກ້ໄຂຂໍ້ມູນ"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="hidden sm:inline">ແກ້ໄຂ</span>
                  </button>

                  <button 
                    onClick={() => setSelectedRecord(null)}
                    className="p-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Patient Info Card */}
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                      <User className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedRecord.patientName}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-400">
                        <span>ອາຍຸ: <strong className="text-zinc-200">{selectedRecord.patientAge}</strong> ປີ</span>
                        <span>ເພດ: <strong className="text-zinc-200">{selectedRecord.patientGender || "ຊາຍ"}</strong></span>
                        {selectedRecord.patientPhone && (
                          <span className="flex items-center gap-1 text-zinc-300">
                            <Phone className="w-3.5 h-3.5 text-sky-400" />
                            {selectedRecord.patientPhone}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                          <Droplet className="w-3 h-3 text-rose-500" /> ໝວດເລືອດ: {selectedRecord.bloodType || "-"}
                        </span>
                        {selectedRecord.allergies ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500" /> ປະຫວັດແພ້: {selectedRecord.allergies}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ບໍ່ມີປະຫວັດແພ້ຢາ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      selectedRecord.status === "COMPLETED" ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      selectedRecord.status === "FOLLOW_UP" ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      selectedRecord.status === "IN_TREATMENT" ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                      'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {selectedRecord.status === "COMPLETED" ? "ກວດສຳເລັດ" :
                       selectedRecord.status === "FOLLOW_UP" ? "ນັດຕິດຕາມອາການ" :
                       selectedRecord.status === "IN_TREATMENT" ? "ກຳລັງປິ່ນປົວ" : selectedRecord.status}
                    </span>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      {new Date(selectedRecord.visitDate).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Vitals Grid */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-sky-400" /> ສັນຍານຊີບ & ຄ່າຮ່າງກາຍ (Vital Signs)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mb-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500" /> ຄວາມດັນ (BP)
                      </div>
                      <div className="text-base font-bold text-white">{selectedRecord.bloodPressure || "-"}</div>
                      <div className="text-[10px] text-zinc-500">mmHg</div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mb-1">
                        <Thermometer className="w-3.5 h-3.5 text-amber-500" /> ອຸນຫະພູມ (Temp)
                      </div>
                      <div className="text-base font-bold text-white">{selectedRecord.temperature ? `${selectedRecord.temperature} °C` : "-"}</div>
                      <div className="text-[10px] text-zinc-500">ອົງສາເຊລຊຽດ</div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mb-1">
                        <Activity className="w-3.5 h-3.5 text-sky-500" /> ຊີບພະຈອນ (Pulse)
                      </div>
                      <div className="text-base font-bold text-white">{selectedRecord.pulse ? `${selectedRecord.pulse} bpm` : "-"}</div>
                      <div className="text-[10px] text-zinc-500">ຄັ້ງ/ນາທີ</div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-teal-400" /> ອົກຊີເຈນ (SpO2)
                      </div>
                      <div className="text-base font-bold text-white">{selectedRecord.oxygenSat ? `${selectedRecord.oxygenSat} %` : "-"}</div>
                      <div className="text-[10px] text-zinc-500">ຄວາມອີ່ມໂຕໃນເລືອດ</div>
                    </div>
                  </div>

                  {/* Body Mass (Weight / Height / BMI) */}
                  {(selectedRecord.weight || selectedRecord.height) && (
                    <div className="mt-3 p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <span>ນ້ຳໜັກ: <strong className="text-white">{selectedRecord.weight || "-"}</strong> kg</span>
                        <span>ສ່ວນສູງ: <strong className="text-white">{selectedRecord.height || "-"}</strong> cm</span>
                      </div>
                      {(() => {
                        const bmiInfo = calculateBMI(selectedRecord.weight, selectedRecord.height);
                        if (!bmiInfo) return null;
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500">BMI:</span>
                            <span className="font-bold text-white">{bmiInfo.val}</span>
                            <span className={`text-[11px] font-semibold ${bmiInfo.colorClass}`}>({bmiInfo.statusText})</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Clinical Notes & Diagnosis */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      ອາການສຳຄັນທີ່ມາພົບແພດ (Chief Complaint)
                    </h4>
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 leading-relaxed">
                      {selectedRecord.chiefComplaint}
                    </div>
                  </div>

                  {selectedRecord.diagnosis && (
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-sky-400" /> ຜົນການບົ່ງມະຕິພະຍາດ (Clinical Diagnosis)
                      </h4>
                      <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-900/40 text-sm text-sky-200 font-medium">
                        {selectedRecord.diagnosis}
                      </div>
                    </div>
                  )}

                  {selectedRecord.treatment && (
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        ການປິ່ນປົວ & ຫັດຖະການ (Treatment & Procedures)
                      </h4>
                      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {selectedRecord.treatment}
                      </div>
                    </div>
                  )}

                  {/* Prescribed Medications */}
                  {Array.isArray(selectedRecord.medications) && selectedRecord.medications.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-emerald-400" /> ລາຍການຢາ & ເວດຊະພັນທີ່ສັ່ງຈ່າຍ (Prescriptions)
                      </h4>
                      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-zinc-900/80 text-zinc-400 uppercase border-b border-zinc-800 font-semibold">
                            <tr>
                              <th className="p-2.5">ລາຍການຢາ</th>
                              <th className="p-2.5">ຂະໜາດ</th>
                              <th className="p-2.5">ວິທີກິນ / ໃຊ້</th>
                              <th className="p-2.5">ຈຳນວນວັນ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/40 text-zinc-300">
                            {selectedRecord.medications.map((m, idx) => (
                              <tr key={idx} className="hover:bg-zinc-900/40">
                                <td className="p-2.5 font-medium text-white">{m.name}</td>
                                <td className="p-2.5 text-zinc-400">{m.dosage || "-"}</td>
                                <td className="p-2.5 text-sky-300">{m.frequency || "-"}</td>
                                <td className="p-2.5 text-zinc-400">{m.days ? `${m.days} ວັນ` : "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {selectedRecord.doctorNotes && (
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        ຄຳແນະນຳເພີ່ມເຕີມຈາກແພດ (Doctor's Notes & Advice)
                      </h4>
                      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {selectedRecord.doctorNotes}
                      </div>
                    </div>
                  )}

                  {/* Footer Meta */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500">ທ່ານໝໍຜູ້ກວດ: </span>
                      <strong className="text-white">{selectedRecord.doctorName || "ທ່ານໝໍປະຈຳສູນ"}</strong>
                    </div>

                    {selectedRecord.followUpDate && (
                      <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                        <Calendar className="w-4 h-4" />
                        <span>ວັນນັດຕິດຕາມ: {new Date(selectedRecord.followUpDate).toLocaleDateString()}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-zinc-500">ຄ່າປິ່ນປົວ & ຢາ: </span>
                      <strong className="text-emerald-400 font-bold text-sm">
                        ₭ {(selectedRecord.cost || 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Danger Action */}
                <div className="flex justify-end pt-2 border-t border-zinc-800/80">
                  <button 
                    onClick={() => handleDelete(selectedRecord.id)}
                    className="px-3.5 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> ລົບປະຫວັດການປິ່ນປົວ
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: Add or Edit Medical Chart */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingRecord ? "ແກ້ໄຂປະຫວັດການປິ່ນປົວ" : "ບັນທຶກປະຫວັດການປິ່ນປົວໃໝ່"}
                  </h2>
                  <p className="text-xs text-zinc-400">ກະລຸນາປ້ອນຂໍ້ມູນທາງການແພດໃຫ້ຄົບຖ້ວນ ແລະ ຖືກຕ້ອງ</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              <form id="clinic-form" onSubmit={handleSave} className="space-y-6">
                
                {/* Section 1: Patient Demographics */}
                <div>
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3 pb-2 border-b border-zinc-800 flex items-center gap-2">
                    <User className="w-4 h-4" /> 1. ຂໍ້ມູນທົ່ວໄປຂອງຄົນເຈັບ (Patient Information)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        ຊື່ ແລະ ນາມສະກຸນຄົນເຈັບ <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="ຕົວຢ່າງ: ສົມພອນ ແກ້ວມະນີ"
                        value={patientName}
                        onChange={e => setPatientName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        ອາຍຸ (ປີ) <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        max="120"
                        placeholder="25"
                        value={patientAge}
                        onChange={e => setPatientAge(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">ເພດ</label>
                      <select 
                        value={patientGender}
                        onChange={e => setPatientGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-sky-500"
                      >
                        <option value="ຊາຍ">ຊາຍ (Male)</option>
                        <option value="ຍິງ">ຍິງ (Female)</option>
                        <option value="ອື່ນໆ">ອື່ນໆ (Other)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">ເບີໂທລະສັບຕິດຕໍ່</label>
                      <input 
                        type="text" 
                        placeholder="020 xxxxxxxx"
                        value={patientPhone}
                        onChange={e => setPatientPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">ໝວດເລືອດ</label>
                      <select 
                        value={bloodType}
                        onChange={e => setBloodType(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-sky-500"
                      >
                        <option value="A">ໝວດເລືອດ A</option>
                        <option value="B">ໝວດເລືອດ B</option>
                        <option value="AB">ໝວດເລືອດ AB</option>
                        <option value="O">ໝວດເລືອດ O</option>
                        <option value="Unknown">ບໍ່ລະບຸ (Unknown)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-rose-300 mb-1.5">
                        ປະຫວັດການແພ້ຢາ ຫຼື ອາຫານ (Allergies)
                      </label>
                      <input 
                        type="text" 
                        placeholder="ຕົວຢ່າງ: ແພ້ຢາ Penicillin, ແພ້ອາຫານທະເລ (ຖ້າບໍ່ມີໃຫ້ເວັ້ນວ່າງ)"
                        value={allergies}
                        onChange={e => setAllergies(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-rose-950/20 border border-rose-900/50 rounded-xl text-sm text-rose-200 placeholder:text-rose-900/60 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Vitals & Physical Measurements */}
                <div>
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3 pb-2 border-b border-zinc-800 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> 2. ສັນຍານຊີບ & ຄ່າຮ່າງກາຍ (Vital Signs & Body Metrics)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">ຄວາມດັນ (BP)</label>
                      <input 
                        type="text" 
                        placeholder="120/80"
                        value={bloodPressure}
                        onChange={e => setBloodPressure(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 text-center focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">ອຸນຫະພູມ (°C)</label>
                      <input 
                        type="text" 
                        placeholder="36.8"
                        value={temperature}
                        onChange={e => setTemperature(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 text-center focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">ຊີບພະຈອນ (bpm)</label>
                      <input 
                        type="text" 
                        placeholder="78"
                        value={pulse}
                        onChange={e => setPulse(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 text-center focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">SpO2 (%)</label>
                      <input 
                        type="text" 
                        placeholder="99"
                        value={oxygenSat}
                        onChange={e => setOxygenSat(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 text-center focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">ນ້ຳໜັກ (kg)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        placeholder="65"
                        value={weight}
                        onChange={e => setWeight(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 text-center focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">ສ່ວນສູງ (cm)</label>
                      <input 
                        type="number" 
                        step="0.5"
                        placeholder="172"
                        value={height}
                        onChange={e => setHeight(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 text-center focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Diagnosis & Treatment */}
                <div>
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3 pb-2 border-b border-zinc-800 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" /> 3. ຜົນການກວດ & ການປິ່ນປົວ (Clinical Assessment)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        ອາການສຳຄັນທີ່ມາພົບແພດ (Chief Complaint) <span className="text-rose-500">*</span>
                      </label>
                      <textarea 
                        required
                        rows={2}
                        placeholder="ລະບຸອາການເຈັບປ່ວຍ, ໄລຍະເວລາທີ່ເລີ່ມເປັນ, ບໍລິເວນທີ່ເຈັບ..."
                        value={chiefComplaint}
                        onChange={e => setChiefComplaint(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                          ການບົ່ງມະຕິພະຍາດ (Clinical Diagnosis)
                        </label>
                        <input 
                          type="text" 
                          placeholder="ຕົວຢ່າງ: Ankle Sprain Grade 2 (ຂໍ້ຕີນພິກ), Muscle Strain"
                          value={diagnosis}
                          onChange={e => setDiagnosis(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                          ສະຖານະການປິ່ນປົວ
                        </label>
                        <select 
                          value={status}
                          onChange={e => setStatus(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-sky-500"
                        >
                          <option value="COMPLETED">ສຳເລັດແລ້ວ (Completed)</option>
                          <option value="FOLLOW_UP">ນັດຕິດຕາມອາການ (Follow-Up Scheduled)</option>
                          <option value="IN_TREATMENT">ກຳລັງປິ່ນປົວ (In Treatment)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        ວິທີການປິ່ນປົວ & ຫັດຖະການ (Treatment & Procedures)
                      </label>
                      <textarea 
                        rows={2}
                        placeholder="ຕົວຢ່າງ: ປະຄົບເຢັນ, ພັນຜ້າຢືດ Elastic Bandage, Ultrasound Therapy, ກາຍະພາບບຳບັດ..."
                        value={treatment}
                        onChange={e => setTreatment(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Prescriptions & Fees */}
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
                    <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                      <Pill className="w-4 h-4" /> 4. ໃບສັ່ງຢາ & ເວດຊະພັນ (Medications)
                    </h3>
                    <button 
                      type="button"
                      onClick={handleAddMedication}
                      className="px-2.5 py-1 text-xs bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 rounded-lg font-medium transition-colors flex items-center gap-1 border border-sky-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" /> ເພີ່ມລາຍການຢາ
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {medications.map((med, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                        <div className="col-span-12 sm:col-span-4">
                          <input 
                            type="text" 
                            placeholder="ຊື່ຢາ (Drug Name)"
                            value={med.name}
                            onChange={e => handleMedicationChange(idx, "name", e.target.value)}
                            className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-2">
                          <input 
                            type="text" 
                            placeholder="ຂະໜາດ (500mg)"
                            value={med.dosage}
                            onChange={e => handleMedicationChange(idx, "dosage", e.target.value)}
                            className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <input 
                            type="text" 
                            placeholder="1 ເມັດ ຫຼັງອາຫານ ເຊົ້າ-ແລງ"
                            value={med.frequency}
                            onChange={e => handleMedicationChange(idx, "frequency", e.target.value)}
                            className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="col-span-10 sm:col-span-2">
                          <input 
                            type="text" 
                            placeholder="ຈຳນວນວັນ (5)"
                            value={med.days}
                            onChange={e => handleMedicationChange(idx, "days", e.target.value)}
                            className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1 text-right">
                          <button 
                            type="button"
                            onClick={() => handleRemoveMedication(idx)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Doctor notes, fees & follow-up */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">ຊື່ແພດຜູ້ກວດ</label>
                      <input 
                        type="text" 
                        placeholder="ນາຍແພດ ສົມໃຈ"
                        value={doctorName}
                        onChange={e => setDoctorName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">ວັນນັດຕິດຕາມອາການ</label>
                      <input 
                        type="date" 
                        value={followUpDate}
                        onChange={e => setFollowUpDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-emerald-400 mb-1">ຄ່າປິ່ນປົວ & ຢາ (₭)</label>
                      <input 
                        type="number" 
                        placeholder="0"
                        value={cost}
                        onChange={e => setCost(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-emerald-500/40 rounded-xl text-sm text-emerald-300 focus:outline-none focus:border-emerald-500 font-bold"
                      />
                    </div>
                  </div>

                  {editingRecord && (
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        ເຫດຜົນໃນການແກ້ໄຂ (ບັນທຶກເຂົ້າ Audit Log)
                      </label>
                      <input 
                        type="text" 
                        placeholder="ຕົວຢ່າງ: ປັບປ່ຽນຢາ ແລະ ແກ້ໄຂຜົນວິນິດໄສ..."
                        value={auditNote}
                        onChange={e => setAuditNote(e.target.value)}
                        className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
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
                form="clinic-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingRecord ? "ອັບເດດຂໍ້ມູນ" : "ບັນທຶກປະຫວັດ"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Printable Medical Summary / Slip */}
      {showPrintModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center print:hidden">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-sky-400" /> ຕົວຢ່າງໃບສະຫຼຸບການປິ່ນປົວ & ໃບສັ່ງຢາ
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> ພິມເອກະສານ
                </button>
                <button 
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Paper Area (Pure White / Black print format) */}
            <div className="p-8 overflow-y-auto flex-1 bg-white text-zinc-900 font-sans" id="printable-clinic-slip">
              {/* Header Letterhead */}
              <div className="border-b-2 border-zinc-900 pb-4 mb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-zinc-900 uppercase">
                    SPORTS COMPLEX CLINIC & REHABILITATION
                  </h1>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    ສູນການແພດກິລາ & ກາຍະພາບບຳບັດ ນະຄອນຫຼວງວຽງຈັນ
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    ໂທລະສັບ: 020 5555-xxxx • ອີເມວ: clinic@sportscomplex.la
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block border border-zinc-800 px-3 py-1 rounded text-xs font-mono font-bold">
                    REF: MED-{selectedRecord.id.slice(-6).toUpperCase()}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">
                    ວັນທີ: {new Date(selectedRecord.visitDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center my-4">
                <h2 className="text-lg font-bold text-zinc-900 uppercase tracking-wide">
                  ໃບສະຫຼຸບການກວດປິ່ນປົວ & ໃບສັ່ງຢາ
                </h2>
                <p className="text-xs text-zinc-500">MEDICAL SUMMARY & PRESCRIPTION SLIP</p>
              </div>

              {/* Patient Details */}
              <div className="border border-zinc-300 rounded-lg p-4 mb-5 bg-zinc-50/50 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-zinc-500 block">ຊື່ຄົນເຈັບ:</span>
                  <strong className="text-zinc-900 text-sm">{selectedRecord.patientName}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">ອາຍຸ / ເພດ:</span>
                  <strong className="text-zinc-900">{selectedRecord.patientAge} ປີ / {selectedRecord.patientGender || "ຊາຍ"}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">ເບີໂທລະສັບ:</span>
                  <strong className="text-zinc-900">{selectedRecord.patientPhone || "-"}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">ໝວດເລືອດ / ປະຫວັດແພ້:</span>
                  <strong className="text-zinc-900">
                    {selectedRecord.bloodType || "-"} / {selectedRecord.allergies ? `ແພ້: ${selectedRecord.allergies}` : "ບໍ່ມີ"}
                  </strong>
                </div>
              </div>

              {/* Vitals Summary */}
              <div className="mb-5 border border-zinc-200 rounded-lg p-3 text-xs flex flex-wrap justify-between gap-2 bg-zinc-50">
                <span>ຄວາມດັນ: <strong>{selectedRecord.bloodPressure || "-"} mmHg</strong></span>
                <span>ອຸນຫະພູມ: <strong>{selectedRecord.temperature ? `${selectedRecord.temperature} °C` : "-"}</strong></span>
                <span>ຊີບພະຈອນ: <strong>{selectedRecord.pulse ? `${selectedRecord.pulse} bpm` : "-"}</strong></span>
                <span>SpO2: <strong>{selectedRecord.oxygenSat ? `${selectedRecord.oxygenSat} %` : "-"}</strong></span>
                {selectedRecord.weight && <span>ນ້ຳໜັກ: <strong>{selectedRecord.weight} kg</strong></span>}
                {selectedRecord.height && <span>ສ່ວນສູງ: <strong>{selectedRecord.height} cm</strong></span>}
              </div>

              {/* Diagnosis & Findings */}
              <div className="space-y-3 mb-6 text-xs">
                <div>
                  <strong className="text-zinc-700 block mb-1">ອາການສຳຄັນ (Chief Complaint):</strong>
                  <p className="p-2.5 bg-zinc-100 rounded border border-zinc-200 text-zinc-900">
                    {selectedRecord.chiefComplaint}
                  </p>
                </div>

                {selectedRecord.diagnosis && (
                  <div>
                    <strong className="text-zinc-700 block mb-1">ການບົ່ງມະຕິພະຍາດ (Diagnosis):</strong>
                    <p className="p-2.5 bg-zinc-100 rounded border border-zinc-200 text-zinc-900 font-semibold">
                      {selectedRecord.diagnosis}
                    </p>
                  </div>
                )}

                {selectedRecord.treatment && (
                  <div>
                    <strong className="text-zinc-700 block mb-1">ການປິ່ນປົວ & ຫັດຖະການ (Treatment & Management):</strong>
                    <p className="p-2.5 bg-zinc-100 rounded border border-zinc-200 text-zinc-900">
                      {selectedRecord.treatment}
                    </p>
                  </div>
                )}
              </div>

              {/* Prescriptions */}
              {Array.isArray(selectedRecord.medications) && selectedRecord.medications.length > 0 && (
                <div className="mb-6">
                  <strong className="text-zinc-700 text-xs block mb-2">ລາຍການຢາ & ວິທີໃຊ້ (Prescriptions):</strong>
                  <table className="w-full text-xs text-left border border-zinc-300">
                    <thead className="bg-zinc-100 border-b border-zinc-300">
                      <tr>
                        <th className="p-2 border-r border-zinc-300">ລາຍການຢາ</th>
                        <th className="p-2 border-r border-zinc-300">ຂະໜາດ</th>
                        <th className="p-2 border-r border-zinc-300">ວິທີຮັບປະທານ / ໃຊ້</th>
                        <th className="p-2">ຈຳນວນ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {selectedRecord.medications.map((m, i) => (
                        <tr key={i}>
                          <td className="p-2 font-semibold border-r border-zinc-300">{m.name}</td>
                          <td className="p-2 border-r border-zinc-300">{m.dosage || "-"}</td>
                          <td className="p-2 border-r border-zinc-300">{m.frequency || "-"}</td>
                          <td className="p-2">{m.days ? `${m.days} ວັນ` : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Follow-up & Cost */}
              <div className="flex justify-between items-center border-t border-b border-zinc-200 py-3 text-xs mb-8">
                <div>
                  {selectedRecord.followUpDate ? (
                    <span>ວັນນັດຕິດຕາມອາການຄັ້ງຕໍ່ໄປ: <strong>{new Date(selectedRecord.followUpDate).toLocaleDateString()}</strong></span>
                  ) : (
                    <span className="text-zinc-500">ບໍ່ມີນັດຕິດຕາມອາການ</span>
                  )}
                </div>
                <div>
                  <span>ລວມຄ່າປິ່ນປົວ & ຢາ: </span>
                  <strong className="text-base text-zinc-900">₭ {(selectedRecord.cost || 0).toLocaleString()}</strong>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 text-center pt-4 text-xs">
                <div>
                  <div className="h-16 flex items-end justify-center">
                    <span className="text-zinc-300 font-mono text-[10px]">_________________________</span>
                  </div>
                  <p className="font-semibold text-zinc-900 mt-1">ລາຍເຊັນຄົນເຈັບ / ຜູ້ຮັບຢາ</p>
                  <p className="text-zinc-500 text-[10px]">({selectedRecord.patientName})</p>
                </div>
                <div>
                  <div className="h-16 flex items-end justify-center">
                    <span className="text-zinc-300 font-mono text-[10px]">_________________________</span>
                  </div>
                  <p className="font-semibold text-zinc-900 mt-1">ແພດຜູ້ກວດ / ຜູ້ສັ່ງຢາ</p>
                  <p className="text-zinc-500 text-[10px]">({selectedRecord.doctorName || "ທ່ານໝໍປະຈຳສູນ"})</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: Audit Trail Log */}
      {showAuditModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-sky-400" /> ປະຫວັດການບັນທຶກ & ການປ່ຽນແປງ (Audit Log)
              </h3>
              <button onClick={() => setShowAuditModal(false)} className="text-zinc-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {Array.isArray(selectedRecord.statusHistory) && selectedRecord.statusHistory.length > 0 ? (
                <div className="relative border-l border-zinc-800 ml-3 pl-5 space-y-4">
                  {selectedRecord.statusHistory.map((h, i) => (
                    <div key={i} className="relative group">
                      <span className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-sky-500 ring-4 ring-zinc-900" />
                      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                        <div className="flex justify-between items-start text-xs">
                          <strong className="text-white font-medium">{h.action}</strong>
                          <span className="text-zinc-500 text-[10px]">{new Date(h.changedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-zinc-300">{h.note || "ບໍ່ມີໝາຍເຫດ"}</p>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 pt-1">
                          <span>ບັນທຶກໂດຍ: <strong className="text-zinc-300">{h.changedBy?.name || "Staff"}</strong></span>
                          {h.changedBy?.role && <span className="text-sky-400 font-mono">[{h.changedBy.role}]</span>}
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
