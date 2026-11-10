"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Users,
  CheckCircle,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit,
  XCircle,
  Loader2,
  Printer,
  FileText,
  BadgeCheck,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface AgentItem {
  id: string;
  agentCode: string;
  companyName?: string | null;
  agentName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  agentType: string; // DEALER, DISTRIBUTOR, DROPSHIP
  status: string; // ACTIVE, INACTIVE
  createdAt?: string;
  joinDate?: string;
}

export default function AgentPage() {
  const [items, setItems] = useState<AgentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AgentItem | null>(null);

  // Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printingItem, setPrintingItem] = useState<AgentItem | null>(null);
  const [printFormat, setPrintFormat] = useState<"SLIP" | "A4">("SLIP");

  // Form State
  const [agentCode, setAgentCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [agentType, setAgentType] = useState("DEALER");
  const [status, setStatus] = useState("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/dashboard/agent");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setItems(data);
      } else {
        toast.error("ໂຫລດຂໍ້ມູນຕົວແທນຈຳໜ່າຍບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentCode.trim() || !agentName.trim() || !phone.trim()) {
      return toast.error("ກະລຸນາປ້ອນລະຫັດ, ຊື່ຕົວແທນ ແລະ ເບີໂທລະສັບໃຫ້ຄົບຖ້ວນ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        agentCode: agentCode.trim(),
        companyName: companyName.trim() || undefined,
        agentName: agentName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        agentType,
        status,
      };

      const url = editingItem ? `/api/dashboard/agent/${editingItem.id}` : "/api/dashboard/agent";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingItem ? "ອັບເດດຂໍ້ມູນຕົວແທນຈຳໜ່າຍສຳເລັດ" : "ບັນທຶກຕົວແທນຈຳໜ່າຍໃໝ່ສຳເລັດ");
        setShowAddModal(false);
        resetForm();
        fetchItems();
      } else {
        const err = await res.json();
        toast.error(err.error || "ບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຂໍ້ມູນ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const actionLabel = newStatus === "ACTIVE" ? "ເປີດໃຊ້ງານ" : "ປິດການໃຊ້ງານ";
    const confirmed = await askConfirm(
      `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການ${actionLabel}ຕົວແທນຈຳໜ່າຍລາຍການນີ້?`,
      {
        title: `ຢືນຢັນການ${actionLabel}`,
        confirmLabel: "ຢືນຢັນ",
        cancelLabel: "ຍົກເລີກ",
        variant: newStatus === "ACTIVE" ? "default" : "destructive",
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/agent/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`ປ່ຽນສະຖານະເປັນ ${newStatus === "ACTIVE" ? "ເປີດໃຊ້ງານ" : "ປິດໃຊ້ງານ"} ສຳເລັດ`);
        fetchItems();
      } else {
        toast.error("ອັບເດດສະຖານະບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບເດດສະຖານະ");
    }
  };

  const handleDelete = async (id: string, agentName: string) => {
    const confirmed = await askConfirm(
      `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຕົວແທນ "${agentName}" ອອກຈາກລະບົບ? ຂໍ້ມູນທີ່ລຶບຈະບໍ່ສາມາດກູ້ຄືນໄດ້.`,
      {
        title: "ຢືນຢັນການລຶບຕົວແທນຈຳໜ່າຍ",
        confirmLabel: "ລຶບລາຍການ",
        cancelLabel: "ຍົກເລີກ",
        variant: "destructive",
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/agent/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບຕົວແທນຈຳໜ່າຍສຳເລັດ");
        fetchItems();
      } else {
        toast.error("ລຶບຂໍ້ມູນບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບ");
    }
  };

  const resetForm = () => {
    setAgentCode(`AG-${Math.floor(1000 + Math.random() * 9000)}`);
    setCompanyName("");
    setAgentName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setAgentType("DEALER");
    setStatus("ACTIVE");
    setEditingItem(null);
  };

  const openEdit = (item: AgentItem) => {
    setEditingItem(item);
    setAgentCode(item.agentCode);
    setCompanyName(item.companyName || "");
    setAgentName(item.agentName);
    setPhone(item.phone);
    setEmail(item.email || "");
    setAddress(item.address || "");
    setAgentType(item.agentType);
    setStatus(item.status);
    setShowAddModal(true);
  };

  const openPrint = (item: AgentItem) => {
    setPrintingItem(item);
    setPrintFormat("SLIP");
    setShowPrintModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredItems = items.filter((r) => {
    const matchSearch =
      r.agentName.toLowerCase().includes(search.toLowerCase()) ||
      r.agentCode.toLowerCase().includes(search.toLowerCase()) ||
      (r.companyName && r.companyName.toLowerCase().includes(search.toLowerCase())) ||
      r.phone.includes(search);
    const matchType = typeFilter === "ALL" || r.agentType === typeFilter;
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const totalAgents = items.length;
  const activeCount = items.filter((i) => i.status === "ACTIVE").length;
  const dealerCount = items.filter((i) => i.agentType === "DEALER").length;
  const distributorCount = items.filter((i) => i.agentType === "DISTRIBUTOR").length;
  const dropshipCount = items.filter((i) => i.agentType === "DROPSHIP").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <Users className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              ຈັດການຕົວແທນຈຳໜ່າຍ (Agents & Dealers)
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ລະບົບຈັດການພັນທະມິດ, ຕົວແທນຂາຍ, ສູນກະຈາຍສິນຄ້າ ແລະ ດຣອບຊິບ
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          ເພີ່ມຕົວແທນໃໝ່
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-xl">
          <div className="text-xs font-medium text-zinc-400">ຕົວແທນທັງໝົດ</div>
          <div className="text-2xl font-bold text-white mt-1">{totalAgents}</div>
          <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
            <BadgeCheck className="w-3 h-3" />
            ເປີດໃຊ້ງານ {activeCount} ລາຍການ
          </div>
        </div>
        <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-xl">
          <div className="text-xs font-medium text-zinc-400">ຕົວແທນທົ່ວໄປ (Dealer)</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{dealerCount}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">ຮ້ານຄ້າຍ່ອຍ / ຕົວແທນຈຳໜ່າຍ</div>
        </div>
        <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-xl">
          <div className="text-xs font-medium text-zinc-400">ສູນກະຈາຍ (Distributor)</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{distributorCount}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">ສາງຫຼັກ / ສູນພາກພື້ນ</div>
        </div>
        <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-xl">
          <div className="text-xs font-medium text-zinc-400">ດຣອບຊິບ (Dropship)</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{dropshipCount}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">ສົ່ງຕໍ່ໂດຍບໍ່ຕ້ອງສະຕັອກ</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່, ລະຫັດ, ເບີໂທ, ຊື່ບໍລິສັດ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === "ALL" ? "bg-white text-black font-semibold" : "text-zinc-400 hover:text-white"
              }`}
            >
              ທຸກປະເພດ
            </button>
            <button
              onClick={() => setTypeFilter("DEALER")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === "DEALER"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Dealer
            </button>
            <button
              onClick={() => setTypeFilter("DISTRIBUTOR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === "DISTRIBUTOR"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Distributor
            </button>
            <button
              onClick={() => setTypeFilter("DROPSHIP")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === "DROPSHIP"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Dropship
            </button>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === "ALL" ? "bg-white text-black font-semibold" : "text-zinc-400 hover:text-white"
              }`}
            >
              ທຸກສະຖານະ
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === "ACTIVE"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ເປີດໃຊ້
            </button>
            <button
              onClick={() => setStatusFilter("INACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === "INACTIVE"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ປິດໃຊ້
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {isLoading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-zinc-500 text-sm mt-3">ກຳລັງໂຫລດຂໍ້ມູນຕົວແທນ...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center flex flex-col items-center border border-zinc-800 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-4 text-zinc-600">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-300">ບໍ່ພົບຂໍ້ມູນຕົວແທນຈຳໜ່າຍ</h3>
          <p className="text-zinc-500 text-sm mt-1 max-w-sm">
            ທ່ານສາມາດກົດປຸ່ມ &quot;ເພີ່ມຕົວແທນໃໝ່&quot; ດ້ານເທິງເພື່ອລົງທະບຽນພັນທະມິດ ຫຼື ຕົວແທນຂາຍໄດ້ທັນທີ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-zinc-900/90 border ${
                item.status === "ACTIVE"
                  ? "border-zinc-800/80 hover:border-blue-500/50 hover:shadow-[0_0_25px_rgba(59,130,246,0.12)]"
                  : "border-red-900/30 opacity-75 hover:opacity-100"
              } rounded-2xl overflow-hidden group transition-all duration-300 flex flex-col`}
            >
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug">{item.agentName}</h3>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {item.companyName || "ບຸກຄົນທົ່ວໄປ (Individual)"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                      {item.agentCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.agentType === "DEALER"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : item.agentType === "DISTRIBUTOR"
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {item.agentType}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mt-2 mb-4 text-xs text-zinc-300 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/60 flex-1">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="font-mono">{item.phone}</span>
                  </div>
                  {item.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{item.email}</span>
                    </div>
                  )}
                  {item.address && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                      <span className="text-zinc-400 leading-relaxed line-clamp-2">{item.address}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openPrint(item)}
                      className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="ພິມໃບຢັ້ງຢືນ / ບິນຕົວແທນ"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      title="ແກ້ໄຂຂໍ້ມູນ"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.agentName)}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="ລຶບລາຍການ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {item.status === "ACTIVE" ? (
                    <button
                      onClick={() => handleUpdateStatus(item.id, "INACTIVE")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 rounded-lg text-xs font-semibold transition-colors border border-zinc-700/50"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      ປິດໃຊ້
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(item.id, "ACTIVE")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      ເປີດໃຊ້
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                {editingItem ? "ແກ້ໄຂຂໍ້ມູນຕົວແທນຈຳໜ່າຍ" : "ເພີ່ມຕົວແທນຈຳໜ່າຍໃໝ່"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="item-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      ລະຫັດຕົວແທນ (Agent Code) *
                    </label>
                    <input
                      type="text"
                      value={agentCode}
                      onChange={(e) => setAgentCode(e.target.value)}
                      required
                      placeholder="AG-1001"
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      ປະເພດຕົວແທນ (Agent Type) *
                    </label>
                    <select
                      value={agentType}
                      onChange={(e) => setAgentType(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="DEALER">Dealer (ຕົວແທນທົ່ວໄປ)</option>
                      <option value="DISTRIBUTOR">Distributor (ສູນກະຈາຍສິນຄ້າ)</option>
                      <option value="DROPSHIP">Dropship (ດຣອບຊິບ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      ຊື່ຕົວແທນ / ຜູ້ຕິດຕໍ່ *
                    </label>
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      required
                      placeholder="ຊື່ ແລະ ນາມສະກຸນ"
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      ຊື່ບໍລິສັດ / ຊື່ຮ້ານຄ້າ
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="ບໍລິສັດ ຫຼື ຊື່ຮ້ານ (ຖ້າມີ)"
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      ເບີໂທລະສັບ (Phone) *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="020 xxxx xxxx"
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      ອີເມວ (Email)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="agent@example.com"
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      ສະຖານະການໃຊ້ງານ
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="ACTIVE">ເປີດໃຊ້ງານ (Active)</option>
                      <option value="INACTIVE">ປິດໃຊ້ງານ (Inactive)</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      ທີ່ຢູ່ / ສາຂາ / ແຂວງ
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      placeholder="ບ້ານ, ເມືອງ, ແຂວງ ແລະ ຈຸດສັງເກດ"
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-zinc-800 bg-zinc-950/70 flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                form="item-form"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingItem ? "ບັນທຶກການແກ້ໄຂ" : "ຢືນຢັນເພີ່ມຕົວແທນ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dual-Format Print Modal */}
      {showPrintModal && printingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/80">
              <div className="flex items-center gap-3">
                <Printer className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">ພິມໃບຢັ້ງຢືນຕົວແທນຈຳໜ່າຍ</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <button
                    onClick={() => setPrintFormat("SLIP")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      printFormat === "SLIP" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    ບິນນ້ອຍ 80mm
                  </button>
                  <button
                    onClick={() => setPrintFormat("A4")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      printFormat === "A4" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    ບິນໃຫຍ່ A4
                  </button>
                </div>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar bg-zinc-950/40 flex justify-center">
              <div
                id="printable-agent-slip"
                className={`bg-white text-black p-6 rounded-xl shadow-lg font-sans ${
                  printFormat === "SLIP" ? "w-[300px] text-xs" : "w-full max-w-[650px] text-sm"
                }`}
              >
                {/* Letterhead */}
                <div className="text-center pb-3 border-b border-dashed border-gray-400">
                  <div className="font-extrabold text-base tracking-wide uppercase">
                    ໃບຢັ້ງຢືນຕົວແທນຈຳໜ່າຍ
                  </div>
                  <div className="text-[11px] text-gray-600 font-mono mt-0.5">
                    OFFICIAL DEALER CERTIFICATE &amp; ID
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    ລະຫັດ: <span className="font-bold text-black font-mono">{printingItem.agentCode}</span>
                  </div>
                </div>

                {/* Agent Details */}
                <div className="py-4 space-y-2 border-b border-dashed border-gray-400">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ຊື່ຕົວແທນ:</span>
                    <span className="font-bold">{printingItem.agentName}</span>
                  </div>
                  {printingItem.companyName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ຊື່ບໍລິສັດ:</span>
                      <span className="font-medium">{printingItem.companyName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">ເບີໂທລະສັບ:</span>
                    <span className="font-mono font-bold">{printingItem.phone}</span>
                  </div>
                  {printingItem.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ອີເມວ:</span>
                      <span className="font-mono">{printingItem.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">ປະເພດ:</span>
                    <span className="font-bold uppercase">{printingItem.agentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ສະຖານະ:</span>
                    <span className="font-bold text-emerald-700">
                      {printingItem.status === "ACTIVE" ? "ເປີດໃຊ້ງານ (ACTIVE)" : "ປິດໃຊ້ງານ"}
                    </span>
                  </div>
                  {printingItem.address && (
                    <div className="pt-1">
                      <span className="text-gray-600 block text-[11px]">ທີ່ຢູ່ / ສາຂາ:</span>
                      <span className="text-[11px] text-gray-800">{printingItem.address}</span>
                    </div>
                  )}
                </div>

                {/* Legal & Terms for A4 */}
                {printFormat === "A4" && (
                  <div className="py-4 space-y-2 text-[11px] text-gray-600 border-b border-gray-300">
                    <div className="font-bold text-gray-800">ຂໍ້ກຳນົດ ແລະ ເງື່ອນໄຂຕົວແທນ:</div>
                    <p>1. ຕົວແທນຈຳໜ່າຍມີສິດໃນການຈຳໜ່າຍສິນຄ້າ ແລະ ຮັບອັດຕາສ່ວນຫຼຸດ/ຄອມມິດຊັ່ນຕາມຂໍ້ຕົກລົງ.</p>
                    <p>2. ຫ້າມຈຳໜ່າຍສິນຄ້າຕໍ່າກວ່າລາຄາກາງທີ່ທາງບໍລິສັດກຳນົດໄວ້ໂດຍບໍ່ໄດ້ຮັບອະນຸຍາດ.</p>
                    <p>3. ໃບຢັ້ງຢືນນີ້ມີຜົນບັງຄັບໃຊ້ນັບຕັ້ງແຕ່ວັນທີ່ອອກເອກະສານເປັນຕົ້ນໄປ.</p>
                  </div>
                )}

                {/* Signatures */}
                <div className="pt-6 grid grid-cols-2 gap-4 text-center text-[10px]">
                  <div>
                    <div className="h-10 border-b border-gray-400 mb-1" />
                    <div>ລາຍເຊັນຕົວແທນຈຳໜ່າຍ</div>
                  </div>
                  <div>
                    <div className="h-10 border-b border-gray-400 mb-1" />
                    <div>ລາຍເຊັນຜູ້ມີອຳນາດ / ປະທັບຕາ</div>
                  </div>
                </div>

                <div className="text-center text-[9px] text-gray-400 mt-4">
                  ພິມອອກເມື່ອ: {new Date().toLocaleString("lo-LA")}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex justify-end gap-3">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold"
              >
                ປິດໜ້າຕ່າງ
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Printer className="w-4 h-4" />
                ສັ່ງພິມເອກະສານ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Print Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-agent-slip,
          #printable-agent-slip * {
            visibility: visible !important;
          }
          #printable-agent-slip {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: ${printFormat === "SLIP" ? "80mm" : "100%"} !important;
            max-width: ${printFormat === "SLIP" ? "80mm" : "210mm"} !important;
            margin: 0 !important;
            padding: ${printFormat === "SLIP" ? "10px" : "30px"} !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 999999 !important;
          }
        }
      `,
        }}
      />
    </div>
  );
}
