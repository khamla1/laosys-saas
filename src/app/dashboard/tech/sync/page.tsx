"use client";

import React, { useState, useEffect } from "react";
import { 
  Watch, Cpu, Wifi, WifiOff, AlertTriangle, Activity, RefreshCw, 
  Battery, BatteryCharging, BatteryWarning, Radio, MapPin, User, 
  Plus, Search, Trash2, Edit3, History, Sparkles, ShieldCheck, 
  CheckCircle2, XCircle, Loader2, Layers, HeartPulse, DoorClosed, 
  Camera, Filter, LayoutGrid, Table, ArrowUpDown
} from "lucide-react";
import { toast } from "sonner";
import { askConfirm } from "@/components/ConfirmModal";

interface SyncRecord {
  id: string;
  syncedAt: string;
  dataPoints: number;
  status: string;
  syncedBy: string;
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

interface SmartDeviceItem {
  id: string;
  deviceCode: string;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  image?: string;
  status: string;
  batteryLevel?: number;
  firmwareVer?: string;
  lastSync?: string;
  location?: string;
  assignedAthlete?: string;
  syncHistory?: SyncRecord[];
  statusHistory?: AuditEntry[];
  createdAt: string;
}

export default function SmartDevicePage() {
  const [items, setItems] = useState<SmartDeviceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Sync state
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingDeviceId, setSyncingDeviceId] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SmartDeviceItem | null>(null);
  const [selectedDeviceForHistory, setSelectedDeviceForHistory] = useState<SmartDeviceItem | null>(null);

  // Form State
  const [deviceCode, setDeviceCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("SMARTWATCH");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [location, setLocation] = useState("");
  const [assignedAthlete, setAssignedAthlete] = useState("");
  const [batteryLevel, setBatteryLevel] = useState("100");
  const [firmwareVer, setFirmwareVer] = useState("v1.0.0");
  const [status, setStatus] = useState("ONLINE");
  const [auditNote, setAuditNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/dashboard/smart-device");
      const data = await res.json();
      if (res.ok) {
        setItems(data);
        if (selectedDeviceForHistory) {
          const fresh = data.find((d: SmartDeviceItem) => d.id === selectedDeviceForHistory.id);
          if (fresh) setSelectedDeviceForHistory(fresh);
        }
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດໂຫຼດລາຍການອຸປະກອນອັດສະລິຍະໄດ້");
    } finally {
      setIsLoading(false);
    }
  };

  const generateDeviceCode = (devType: string) => {
    const prefix = devType.slice(0, 3).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `DEV-${prefix}-${rand}`;
  };

  const generateSerialNumber = () => {
    const timePart = Date.now().toString(36).toUpperCase();
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SN-${timePart}-${randPart}`;
  };

  const resetForm = () => {
    setType("SMARTWATCH");
    setDeviceCode(generateDeviceCode("SMARTWATCH"));
    setName("");
    setModel("Garmin Forerunner 965");
    setSerialNumber(generateSerialNumber());
    setLocation("ຫ້ອງຟິດເນສ ແລະ ແລ່ນ");
    setAssignedAthlete("");
    setBatteryLevel("100");
    setFirmwareVer("v2.4.1");
    setStatus("ONLINE");
    setAuditNote("");
    setEditingItem(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (item: SmartDeviceItem) => {
    setEditingItem(item);
    setDeviceCode(item.deviceCode);
    setName(item.name);
    setType(item.type);
    setModel(item.model || "");
    setSerialNumber(item.serialNumber);
    setLocation(item.location || "");
    setAssignedAthlete(item.assignedAthlete || "");
    setBatteryLevel(item.batteryLevel !== undefined ? item.batteryLevel.toString() : "100");
    setFirmwareVer(item.firmwareVer || "v1.0.0");
    setStatus(item.status);
    setAuditNote("");
    setShowAddModal(true);
  };

  // Bulk Sync All
  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const res = await fetch("/api/dashboard/smart-device/sync-all", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`ຊິງຄ໌ຂໍ້ມູນອຸປະກອນທັງໝົດ ${data.syncedCount} ເຄື່ອງ ສຳເລັດແລ້ວ`);
        fetchItems();
      } else {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການຊິງຄ໌ຂໍ້ມູນລວມ");
      }
    } catch (err) {
      toast.error("ເຊື່ອມຕໍ່ລະບົບຊິງຄ໌ບໍ່ສຳເລັດ");
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Single Device Force Sync
  const handleSingleSync = async (id: string, devName: string) => {
    setSyncingDeviceId(id);
    try {
      const res = await fetch(`/api/dashboard/smart-device/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SYNC" })
      });
      if (res.ok) {
        toast.success(`ຊິງຄ໌ຂໍ້ມູນ ${devName} ສຳເລັດແລ້ວ`);
        fetchItems();
      } else {
        toast.error("ຊິງຄ໌ຂໍ້ມູນອຸປະກອນບໍ່ສຳເລັດ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການຊິງຄ໌");
    } finally {
      setSyncingDeviceId(null);
    }
  };

  // Quick Status Change
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/dashboard/smart-device/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          auditNote: `ປ່ຽນສະຖານະການເຮັດວຽກເປັນ ${newStatus}` 
        })
      });
      if (res.ok) {
        toast.success(`ປ່ຽນສະຖານະເປັນ ${newStatus} ສຳເລັດ`);
        fetchItems();
      } else {
        toast.error("ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການປັບປ່ຽນສະຖານະ");
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type) {
      return toast.error("ກະລຸນາປ້ອນຊື່ອຸປະກອນ ແລະ ປະເພດອຸປະກອນ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        deviceCode,
        name,
        type,
        model,
        serialNumber,
        location,
        assignedAthlete,
        batteryLevel: parseInt(batteryLevel) || 100,
        firmwareVer,
        status,
        auditNote: auditNote.trim() || (editingItem ? "ອັບເດດຂໍ້ມູນອຸປະກອນ" : `ລົງທະບຽນອຸປະກອນ ${name}`)
      };

      const url = editingItem ? `/api/dashboard/smart-device/${editingItem.id}` : "/api/dashboard/smart-device";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingItem ? "ອັບເດດຂໍ້ມູນອຸປະກອນສຳເລັດ" : "ລົງທະບຽນອຸປະກອນໃໝ່ສຳເລັດ");
        setShowAddModal(false);
        resetForm();
        fetchItems();
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

  const handleDelete = async (id: string, devName: string) => {
    if (!(await askConfirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບອຸປະກອນ "${devName}"? ຂໍ້ມູນການເຊື່ອມຕໍ່ທັງໝົດຈະຖືກລຶບອອກ.`))) return;
    try {
      const res = await fetch(`/api/dashboard/smart-device/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລົບອຸປະກອນສຳເລັດແລ້ວ");
        fetchItems();
      } else {
        toast.error("ບໍ່ສາມາດລົບອຸປະກອນໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລົບ");
    }
  };

  // Filter & Search
  const filteredItems = items.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = 
      r.name.toLowerCase().includes(q) ||
      r.deviceCode.toLowerCase().includes(q) ||
      r.serialNumber.toLowerCase().includes(q) ||
      (r.model && r.model.toLowerCase().includes(q)) ||
      (r.location && r.location.toLowerCase().includes(q)) ||
      (r.assignedAthlete && r.assignedAthlete.toLowerCase().includes(q));

    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchType = typeFilter === "ALL" || r.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // KPIs
  const totalCount = items.length;
  const onlineCount = items.filter(i => i.status === "ONLINE").length;
  const offlineCount = items.filter(i => i.status === "OFFLINE" || i.status === "ERROR").length;
  const lowBatteryCount = items.filter(i => (i.batteryLevel || 100) < 25).length;

  const getTypeIcon = (t: string) => {
    switch (t) {
      case "SMARTWATCH": return <Watch className="w-5 h-5 text-cyan-400" />;
      case "HEART_RATE": return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case "SENSOR_COURT": return <Radio className="w-5 h-5 text-amber-400" />;
      case "GATE_TURNSTILE": return <DoorClosed className="w-5 h-5 text-emerald-400" />;
      case "CAMERA_TRACKER": return <Camera className="w-5 h-5 text-purple-400" />;
      default: return <Cpu className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getTypeNameLao = (t: string) => {
    switch (t) {
      case "SMARTWATCH": return "ໂມງອັດສະລິຍະ (Smartwatch)";
      case "HEART_RATE": return "ສາຍຮັດວັດກຳມະຈອນ (HR Strap)";
      case "SENSOR_COURT": return "ເຊັນເຊີສະໜາມ (Court Sensor)";
      case "GATE_TURNSTILE": return "ປະຕູ Turnstile RFID";
      case "CAMERA_TRACKER": return "ກ້ອງ AI ວິເຄາະການເຄື່ອນໄຫວ";
      default: return t;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <Cpu className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
              ອຸປະກອນອັດສະລິຍະ (Smart Devices & IoT)
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ເຊື່ອມຕໍ່ Wearables, ເຊັນເຊີສະໜາມ, ປະຕູ Turnstile & ຊິງຄ໌ຂໍ້ມູນ telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isSyncingAll ? "ກຳລັງຊິງຄ໌ຂໍ້ມູນ..." : "ຊິງຄ໌ຂໍ້ມູນທັງໝົດ"}</span>
          </button>

          <button 
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> 
            ເພີ່ມອຸປະກອນໃໝ່
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-zinc-400 font-medium">ອຸປະກອນທັງໝົດ</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-zinc-400 font-medium">ອອນລາຍພ້ອມໃຊ້ງານ</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{onlineCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Wifi className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-zinc-400 font-medium">ອອບລາຍ / ຂັດຂ້ອງ</p>
            <h3 className="text-2xl font-bold text-rose-400 mt-1">{offlineCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <WifiOff className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-zinc-400 font-medium">ແບັດເຕີຣີຕ່ຳ (&lt;25%)</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{lowBatteryCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <BatteryWarning className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="ຄົ້ນຫາຊື່ອຸປະກອນ, ລະຫັດ, SN, ສະຖານທີ່..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Category & Status Filter Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          
          {/* Status Filters */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {[
              { key: "ALL", label: "ທັງໝົດ" },
              { key: "ONLINE", label: "ONLINE" },
              { key: "OFFLINE", label: "OFFLINE" },
              { key: "ERROR", label: "ERROR" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === tab.key 
                    ? tab.key === "ONLINE" ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                      tab.key === "ERROR" ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                      tab.key === "OFFLINE" ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' :
                      'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 ml-auto md:ml-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "table" ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Grid or Table Display */}
      {isLoading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500" />
          <p className="text-zinc-500 text-xs mt-2">ກຳລັງໂຫຼດລາຍການອຸປະກອນ...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center flex flex-col items-center border border-zinc-800 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-16 h-16 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4">
            <Cpu className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-zinc-300 text-base font-semibold">ບໍ່ພົບອຸປະກອນອັດສະລິຍະ</p>
          <p className="text-zinc-500 text-xs mt-1">ກົດປຸ່ມ "ເພີ່ມອຸປະກອນໃໝ່" ເພື່ອເລີ່ມຕົ້ນເຊື່ອມຕໍ່ລະບົບ IoT</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map(item => {
            const isOnline = item.status === "ONLINE";
            const isError = item.status === "ERROR";
            const isSyncing = syncingDeviceId === item.id;
            const bat = item.batteryLevel !== undefined ? item.batteryLevel : 100;

            return (
              <div 
                key={item.id} 
                className="bg-zinc-900/90 border border-zinc-800/80 hover:border-cyan-500/50 rounded-2xl overflow-hidden group transition-all duration-300 flex flex-col relative shadow-lg"
              >
                {/* Header Status Bar */}
                <div className={`p-3 flex justify-between items-center border-b ${
                  isOnline ? 'bg-emerald-500/10 border-emerald-500/20' : 
                  isError ? 'bg-rose-500/10 border-rose-500/20' : 
                  'bg-zinc-950/60 border-zinc-800'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> :
                     isError ? <AlertTriangle className="w-4 h-4 text-rose-400" /> :
                     <WifiOff className="w-4 h-4 text-zinc-500" />}
                    
                    <span className={`text-xs font-bold ${
                      isOnline ? 'text-emerald-400' : isError ? 'text-rose-400' : 'text-zinc-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Battery & Signal Indicator */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[11px] font-mono">
                      {bat > 50 ? <Battery className="w-4 h-4 text-emerald-400" /> :
                       bat > 20 ? <Battery className="w-4 h-4 text-amber-400" /> :
                       <BatteryWarning className="w-4 h-4 text-rose-400 animate-pulse" />}
                      <span className={bat <= 20 ? "text-rose-400 font-bold" : "text-zinc-400"}>{bat}%</span>
                    </div>

                    <span className="relative flex h-2 w-2">
                      {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        isOnline ? 'bg-emerald-500' : isError ? 'bg-rose-500' : 'bg-zinc-600'
                      }`}></span>
                    </span>
                  </div>
                </div>

                {/* Content Box */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[11px] font-mono text-zinc-500">{item.deviceCode}</span>
                    <span className="text-[10px] text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 rounded-md font-semibold">
                      {item.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center flex-shrink-0">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-white text-base truncate group-hover:text-cyan-400 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-zinc-400 truncate">{item.model || "General IoT"}</p>
                    </div>
                  </div>

                  {/* Specs & Location Box */}
                  <div className="space-y-1.5 my-3 text-xs text-zinc-400 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">S/N:</span>
                      <span className="font-mono text-zinc-300 text-[11px]">{item.serialNumber}</span>
                    </div>
                    {item.location && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" /> ສະຖານທີ່:
                        </span>
                        <span className="text-zinc-200 font-medium truncate max-w-[130px]">{item.location}</span>
                      </div>
                    )}
                    {item.assignedAthlete && (
                      <div className="flex justify-between items-center border-t border-zinc-800/50 pt-1.5 mt-1.5">
                        <span className="text-zinc-500 flex items-center gap-1">
                          <User className="w-3 h-3 text-indigo-400" /> ນັກກິລາ/ຜູ້ໃຊ້:
                        </span>
                        <span className="text-indigo-300 font-semibold truncate max-w-[120px]">{item.assignedAthlete}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1">
                      <span>ເຟີມແວຣ໌: {item.firmwareVer || "v1.0.0"}</span>
                      <span>
                        ຊິງຄ໌: {item.lastSync ? new Date(item.lastSync).toLocaleTimeString() : "ຍັງບໍ່ໄດ້ຊິງຄ໌"}
                      </span>
                    </div>
                  </div>

                  {/* Quick Bottom Control Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 mt-auto gap-2">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="ແກ້ໄຂ"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedDeviceForHistory(item)}
                        className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="ປະຫວັດການຊິງຄ໌"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="ລົບ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Force Sync button */}
                      <button 
                        onClick={() => handleSingleSync(item.id, item.name)}
                        disabled={isSyncing}
                        className="px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        title="ບັງຄັບຊິງຄ໌ຂໍ້ມູນດຽວນີ້"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? "..." : "ຊິງຄ໌"}</span>
                      </button>

                      {/* Status toggle dropdown */}
                      <div className="relative group/status">
                        <button className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-full right-0 mb-1 w-28 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-20">
                          <button 
                            onClick={() => handleStatusChange(item.id, 'ONLINE')} 
                            className="block w-full text-left px-3 py-1.5 text-xs text-emerald-400 hover:bg-zinc-700 rounded-t-xl"
                          >
                            ONLINE
                          </button>
                          <button 
                            onClick={() => handleStatusChange(item.id, 'OFFLINE')} 
                            className="block w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
                          >
                            OFFLINE
                          </button>
                          <button 
                            onClick={() => handleStatusChange(item.id, 'ERROR')} 
                            className="block w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-zinc-700 rounded-b-xl"
                          >
                            ERROR
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase border-b border-zinc-800 font-semibold">
              <tr>
                <th className="p-3.5">ລະຫັດ / ອຸປະກອນ</th>
                <th className="p-3.5">ປະເພດ</th>
                <th className="p-3.5">ສະຖານທີ່</th>
                <th className="p-3.5">ຜູ້ຖືຄອງ/ນັກກິລາ</th>
                <th className="p-3.5">ແບັດເຕີຣີ</th>
                <th className="p-3.5">ສະຖານະ</th>
                <th className="p-3.5">ຊິງຄ໌ຫຼ້າສຸດ</th>
                <th className="p-3.5 text-right">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-white text-sm">{item.name}</div>
                    <div className="text-[10px] font-mono text-zinc-500">{item.deviceCode} • {item.serialNumber}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {item.type}
                    </span>
                  </td>
                  <td className="p-3.5 text-zinc-300">{item.location || "-"}</td>
                  <td className="p-3.5 text-indigo-300 font-medium">{item.assignedAthlete || "-"}</td>
                  <td className="p-3.5 font-mono">
                    <span className={(item.batteryLevel || 100) <= 20 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                      {item.batteryLevel !== undefined ? `${item.batteryLevel}%` : "100%"}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                      item.status === "ONLINE" ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      item.status === "ERROR" ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                      'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-zinc-400 text-[11px]">
                    {item.lastSync ? new Date(item.lastSync).toLocaleString() : "ຍັງບໍ່ໄດ້ຊິງຄ໌"}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => handleSingleSync(item.id, item.name)}
                        className="px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded-lg text-xs font-semibold hover:bg-cyan-600/30"
                      >
                        ຊິງຄ໌
                      </button>
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
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

      {/* MODAL 1: Add or Edit Device */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingItem ? "ແກ້ໄຂອຸປະກອນອັດສະລິຍະ" : "ລົງທະບຽນອຸປະກອນໃໝ່ (Register Device)"}
                  </h2>
                  <p className="text-xs text-zinc-400">ກະລຸນາປ້ອນຂໍ້ມູນອຸປະກອນ IoT ແລະ Wearables</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="device-form" onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      ລະຫັດອຸປະກອນ (Device Code)
                    </label>
                    <input 
                      type="text" 
                      required
                      value={deviceCode}
                      onChange={e => setDeviceCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      ປະເພດອຸປະກອນ <span className="text-rose-500">*</span>
                    </label>
                    <select 
                      value={type}
                      onChange={e => {
                        setType(e.target.value);
                        if (!editingItem) setDeviceCode(generateDeviceCode(e.target.value));
                      }}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="SMARTWATCH">ໂມງອັດສະລິຍະ (Smartwatch)</option>
                      <option value="HEART_RATE">ສາຍຮັດວັດກຳມະຈອນ (Heart Rate Strap)</option>
                      <option value="SENSOR_COURT">ເຊັນເຊີສະໜາມ (Court Sensor)</option>
                      <option value="GATE_TURNSTILE">ປະຕູ Turnstile RFID</option>
                      <option value="CAMERA_TRACKER">ກ້ອງ AI ວິເຄາະການເຄື່ອນໄຫວ</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      ຊື່ອຸປະກອນ <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="ຕົວຢ່າງ: Garmin Forerunner 965 #01, Polar H10 Chest Strap"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">ລຸ້ນ / Model</label>
                    <input 
                      type="text" 
                      placeholder="Forerunner 965, Polar H10"
                      value={model}
                      onChange={e => setModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">ເລກ Serial Number</label>
                    <input 
                      type="text" 
                      required
                      value={serialNumber}
                      onChange={e => setSerialNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">ສະຖານທີ່ຕິດຕັ້ງ / ນຳໃຊ້</label>
                    <input 
                      type="text" 
                      placeholder="ສະໜາມ 1, ຫ້ອງຟິດເນສ, ປະຕູທາງເຂົ້າຫຼັກ"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">ນັກກິລາ / ຜູ້ຮັບຜິດຊອບ</label>
                    <input 
                      type="text" 
                      placeholder="ຊື່ນັກກິລາ ຫຼື ຄູເຝິກ"
                      value={assignedAthlete}
                      onChange={e => setAssignedAthlete(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">ແບັດເຕີຣີເລີ່ມຕົ້ນ (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={batteryLevel}
                      onChange={e => setBatteryLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">ສະຖານະເລີ່ມຕົ້ນ</label>
                    <select 
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="ONLINE">ONLINE (ພ້ອມໃຊ້ງານ)</option>
                      <option value="OFFLINE">OFFLINE (ປິດໃຊ້ງານ)</option>
                      <option value="ERROR">ERROR (ຂັດຂ້ອງ)</option>
                    </select>
                  </div>
                </div>

                {editingItem && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      ເຫດຜົນໃນການແກ້ໄຂ (Audit Note)
                    </label>
                    <input 
                      type="text" 
                      placeholder="ຕົວຢ່າງ: ປ່ຽນແປງຜູ້ຖືຄອງ ແລະ ສະຖານທີ່..."
                      value={auditNote}
                      onChange={e => setAuditNote(e.target.value)}
                      className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

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
                form="device-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingItem ? "ອັບເດດອຸປະກອນ" : "ລົງທະບຽນອຸປະກອນ"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Telemetry Sync Log & Audit Trail */}
      {selectedDeviceForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" /> ປະຫວັດການຊິງຄ໌ & Telemetry ({selectedDeviceForHistory.name})
                </h3>
                <p className="text-[11px] font-mono text-zinc-500">{selectedDeviceForHistory.deviceCode}</p>
              </div>
              <button onClick={() => setSelectedDeviceForHistory(null)} className="text-zinc-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              
              {/* Sync History */}
              <div>
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> ປະຫວັດການຊິງຄ໌ຂໍ້ມູນ (Sync History)
                </h4>
                {Array.isArray(selectedDeviceForHistory.syncHistory) && selectedDeviceForHistory.syncHistory.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDeviceForHistory.syncHistory.map((s, i) => (
                      <div key={i} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-medium text-white">+{s.dataPoints.toLocaleString()} data points</span>
                          <span className="text-[10px] text-zinc-500 block">ໂດຍ: {s.syncedBy}</span>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {s.status}
                          </span>
                          <span className="text-[10px] text-zinc-500 block mt-0.5">{new Date(s.syncedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-xs italic py-2">ຍັງບໍ່ມີປະຫວັດການຊິງຄ໌ຂໍ້ມູນ</p>
                )}
              </div>

              {/* Status History / Audit */}
              <div className="pt-3 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> ປະຫວັດສະຖານະ (Audit Trail)
                </h4>
                {Array.isArray(selectedDeviceForHistory.statusHistory) && selectedDeviceForHistory.statusHistory.length > 0 ? (
                  <div className="relative border-l border-zinc-800 ml-2 pl-4 space-y-3">
                    {selectedDeviceForHistory.statusHistory.map((h, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-500 ring-4 ring-zinc-900" />
                        <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs space-y-0.5">
                          <div className="flex justify-between items-center">
                            <strong className="text-white text-[11px]">{h.action}</strong>
                            <span className="text-[10px] text-zinc-500">{new Date(h.changedAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-zinc-300 text-[11px]">{h.note}</p>
                          <p className="text-zinc-500 text-[10px]">ໂດຍ: {h.changedBy?.name || "System"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-xs italic py-2">ບໍ່ມີປະຫວັດການປ່ຽນແປງສະຖານະ</p>
                )}
              </div>

            </div>

            <div className="p-3 border-t border-zinc-800 bg-zinc-950 text-right">
              <button 
                onClick={() => setSelectedDeviceForHistory(null)}
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
