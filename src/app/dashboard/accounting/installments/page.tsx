"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Trash2,
  Edit,
  Loader2,
  DollarSign,
  TrendingUp,
  Calendar,
  Wallet,
  ArrowRight,
  Printer,
  CheckCircle2,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";

interface InstallmentItem {
  id: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  status: string; // ACTIVE, OVERDUE, COMPLETED
  dueDate: string;
  createdAt: string;
}

export default function InstallmentsPage() {
  const [items, setItems] = useState<InstallmentItem[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InstallmentItem | null>(null);
  const [payingItem, setPayingItem] = useState<InstallmentItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [totalAmount, setTotalAmount] = useState("5000000");
  const [paidAmount, setPaidAmount] = useState("1000000");
  const [status, setStatus] = useState("ACTIVE");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchCustomers();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/dashboard/installments");
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("ບໍ່ສາມາດໂຫຼດລາຍການຜ່ອນຊຳລະໄດ້");
    } finally {
      setIsLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ລູກຄ້າ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerPhone ? `${customerName.trim()} (${customerPhone.trim()})` : customerName.trim(),
        totalAmount: Number(totalAmount) || 0,
        paidAmount: Number(paidAmount) || 0,
        status,
        dueDate,
      };

      const url = editingItem
        ? `/api/dashboard/installments/${editingItem.id}`
        : "/api/dashboard/installments";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingItem ? "ອັບເດດສັນຍາຜ່ອນສຳເລັດ" : "ສ້າງສັນຍາຜ່ອນຊຳລະໃໝ່ສຳເລັດ");
        setShowAddModal(false);
        resetForm();
        fetchItems();
      } else {
        toast.error("ບັນທຶກສັນຍາຜ່ອນບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingItem || paymentAmount === "" || Number(paymentAmount) <= 0) {
      return toast.error("ກະລຸນາປ້ອນຈຳນວນເງິນທີ່ຊຳລະ");
    }

    const payVal = Number(paymentAmount);
    const newPaid = payingItem.paidAmount + payVal;

    try {
      const res = await fetch(`/api/dashboard/installments/${payingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: newPaid }),
      });

      if (res.ok) {
        toast.success(
          newPaid >= payingItem.totalAmount
            ? "ຊຳລະຄົບຖ້ວນແລ້ວ! ສະຖານະປ່ຽນເປັນ 'ສຳເລັດແລ້ວ'"
            : `ບັນທຶກການຊຳລະ ₭${payVal.toLocaleString()} ສຳເລັດ`
        );
        setPayingItem(null);
        setPaymentAmount("");
        fetchItems();
      } else {
        toast.error("ບັນທຶກການຊຳລະບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await askConfirm("ທ່ານຕ້ອງການລຶບສັນຍາຜ່ອນຊຳລະນີ້ແທ້ບໍ່?", {
      title: "ຢືນຢັນການລຶບສັນຍາຜ່ອນ",
      confirmText: "ລຶບສັນຍາ",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/installments/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບສັນຍາຜ່ອນຊຳລະສຳເລັດ");
        fetchItems();
      }
    } catch {
      toast.error("ລຶບສັນຍາຜ່ອນບໍ່ສຳເລັດ");
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setTotalAmount("5000000");
    setPaidAmount("1000000");
    setStatus("ACTIVE");
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setEditingItem(null);
  };

  const openEdit = (item: InstallmentItem) => {
    setEditingItem(item);
    setCustomerName(item.customerName);
    setTotalAmount(item.totalAmount.toString());
    setPaidAmount(item.paidAmount.toString());
    setStatus(item.status);
    setDueDate(item.dueDate ? item.dueDate.slice(0, 10) : "");
    setShowAddModal(true);
  };

  const now = new Date();
  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q || item.customerName.toLowerCase().includes(q);
    const isOverdue = new Date(item.dueDate) < now && item.paidAmount < item.totalAmount;
    const currentStatus = item.status === "COMPLETED" ? "COMPLETED" : isOverdue ? "OVERDUE" : "ACTIVE";
    const matchStatus = statusFilter === "ALL" || currentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalContractValue = items.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalPaidValue = items.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
  const totalRemainingValue = Math.max(0, totalContractValue - totalPaidValue);
  const activeCount = items.filter((i) => i.status === "ACTIVE" && i.paidAmount < i.totalAmount).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-700 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ລະບົບຜ່ອນຊຳລະ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                Installment Plans
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ຕິດຕາມຍອດຜ່ອນຊຳລະຂອງລູກຄ້າ, ຍອດຄ້າງຈ່າຍ, ວັນທີຄົບກຳນົດ ແລະ ບັນທຶກການຊຳລະງວດ
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>ສ້າງສັນຍາຜ່ອນໃໝ່</span>
        </button>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ມູນຄ່າສັນຍາຜ່ອນທັງໝົດ</p>
          <h3 className="text-2xl font-black text-indigo-400 mt-2">₭{totalContractValue.toLocaleString()}</h3>
          <p className="text-xs text-zinc-500 mt-2">{items.length} ສັນຍາຜ່ອນ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຍອດທີ່ໄດ້ຮັບແລ້ວ</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">₭{totalPaidValue.toLocaleString()}</h3>
          <p className="text-xs text-emerald-400/80 mt-2">
            {totalContractValue > 0 ? Math.round((totalPaidValue / totalContractValue) * 100) : 0}% ຂອງຍອດລວມ
          </p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຍອດຄ້າງຊຳລະ</p>
          <h3 className="text-2xl font-black text-amber-400 mt-2">₭{totalRemainingValue.toLocaleString()}</h3>
          <p className="text-xs text-amber-400/80 mt-2">ຍອດທີ່ຕ້ອງເກັບຕໍ່ໄປ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ສັນຍາທີ່ກຳລັງຜ່ອນ</p>
          <h3 className="text-2xl font-black text-blue-400 mt-2">{activeCount} ສັນຍາ</h3>
          <p className="text-xs text-blue-400/80 mt-2">ລໍຖ້າຊຳລະງວດ</p>
        </div>
      </div>

      {/* ── Toolbar & Filtering ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ລູກຄ້າ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { label: "ທັງໝົດ", value: "ALL" },
            { label: "ກຳລັງຜ່ອນ (Active)", value: "ACTIVE" },
            { label: "ເກີນກຳນົດ (Overdue)", value: "OVERDUE" },
            { label: "ສຳເລັດແລ້ວ (Completed)", value: "COMPLETED" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === item.value
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table Section ── */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
            <p className="text-zinc-400 text-sm">ກຳລັງໂຫຼດສັນຍາຜ່ອນຊຳລະ...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">ບໍ່ພົບສັນຍາຜ່ອນຊຳລະ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800/80">
                  <th className="p-4 text-xs font-semibold text-zinc-400">ຊື່ລູກຄ້າ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-right">ຍອດຜ່ອນທັງໝົດ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-right">ຊຳລະແລ້ວ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-right">ຍອດຄ້າງຊຳລະ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center min-w-[140px]">
                    ຄວາມຄືບໜ້າ
                  </th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center">ຄົບກຳນົດ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center">ສະຖານະ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filteredItems.map((item) => {
                  const remaining = Math.max(0, item.totalAmount - item.paidAmount);
                  const percent = item.totalAmount > 0 ? Math.min(100, Math.round((item.paidAmount / item.totalAmount) * 100)) : 0;
                  const isOverdue = new Date(item.dueDate) < now && remaining > 0;

                  return (
                    <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="p-4">
                        <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {item.customerName}
                        </p>
                        <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                          INST-{item.id.slice(-6).toUpperCase()}
                        </p>
                      </td>
                      <td className="p-4 text-sm font-bold text-white text-right whitespace-nowrap">
                        ₭{item.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-4 text-sm font-black text-emerald-400 text-right whitespace-nowrap">
                        ₭{item.paidAmount.toLocaleString()}
                      </td>
                      <td className="p-4 text-sm font-bold text-amber-400 text-right whitespace-nowrap">
                        ₭{remaining.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                              percent >= 100
                                ? "bg-emerald-500"
                                : percent >= 50
                                ? "bg-indigo-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-zinc-400 font-semibold mt-1 block">
                          {percent}% ({item.paidAmount >= item.totalAmount ? "ຄົບແລ້ວ" : `ເຫຼືອ ₭${remaining.toLocaleString()}`})
                        </span>
                      </td>
                      <td className="p-4 text-center text-xs text-zinc-300 whitespace-nowrap">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-center">
                        {item.status === "COMPLETED" || percent >= 100 ? (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            ສຳເລັດແລ້ວ
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                            ເກີນກຳນົດ
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                            ກຳລັງຜ່ອນ
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {remaining > 0 && (
                            <button
                              onClick={() => {
                                setPayingItem(item);
                                setPaymentAmount(Math.min(remaining, Math.round(item.totalAmount / 4)));
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                              title="ບັນທຶກການຊຳລະງວດນີ້"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              <span>ຈ່າຍງວດ</span>
                            </button>
                          )}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick Pay Modal ── */}
      {payingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-500" />
                <span>ບັນທຶກການຊຳລະງວດ</span>
              </h3>
              <button
                onClick={() => setPayingItem(null)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ຍົກເລີກ
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-zinc-400">ລູກຄ້າ:</p>
                <p className="text-base font-bold text-white mt-0.5">{payingItem.customerName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-xs">
                <div>
                  <span className="text-zinc-400 block">ຍອດຜ່ອນລວມ:</span>
                  <span className="font-bold text-white text-sm">₭{payingItem.totalAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">ຍອດຄ້າງຊຳລະ:</span>
                  <span className="font-bold text-amber-400 text-sm">
                    ₭{(payingItem.totalAmount - payingItem.paidAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ຈຳນວນເງິນທີ່ຊຳລະຄັ້ງນີ້ (₭) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={payingItem.totalAmount - payingItem.paidAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-lg font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPayingItem(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ຢືນຢັນການຊຳລະ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add / Edit Contract Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                <span>{editingItem ? "ແກ້ໄຂສັນຍາຜ່ອນ" : "ສ້າງສັນຍາຜ່ອນຊຳລະໃໝ່"}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ຍົກເລີກ
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ເລືອກລູກຄ້າຈາກລະບົບ ຫຼື ປ້ອນເອງ *
                </label>
                {customers.length > 0 && (
                  <select
                    onChange={(e) => {
                      const c = customers.find((item) => item.customerName === e.target.value);
                      if (c) {
                        setCustomerName(c.customerName);
                        if (c.customerPhone) setCustomerPhone(c.customerPhone);
                      }
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
                    placeholder="ຊື່ລູກຄ້າ *"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="ເບີໂທຕິດຕໍ່ (ຖ້າມີ)"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    ຍອດຜ່ອນທັງໝົດ (₭) *
                  </label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    ຍອດທີ່ຊຳລະແລ້ວ (₭)
                  </label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">ສະຖານະ</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ACTIVE">ກຳລັງຜ່ອນ (Active)</option>
                    <option value="COMPLETED">ສຳເລັດແລ້ວ (Completed)</option>
                    <option value="OVERDUE">ເກີນກຳນົດ (Overdue)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    ວັນທີຄົບກຳນົດ (Due Date)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
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
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? "ອັບເດດສັນຍາຜ່ອນ" : "ສ້າງສັນຍາຜ່ອນ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
