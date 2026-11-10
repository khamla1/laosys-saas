"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect } from "react";
import {
  Award,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  Loader2,
  User,
  DollarSign,
  TrendingUp,
  Wallet,
  Calculator,
  Calendar,
  CheckCircle2,
  Users
} from "lucide-react";
import { toast } from "sonner";

interface CommissionItem {
  id: string;
  staffName: string;
  amount: number;
  status: string; // PENDING, PAID
  date: string;
  createdAt: string;
}

export default function CommissionsPage() {
  const [items, setItems] = useState<CommissionItem[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CommissionItem | null>(null);

  // Form states
  const [staffName, setStaffName] = useState("");
  const [amount, setAmount] = useState("300000");
  const [calcBase, setCalcBase] = useState("");
  const [calcPercent, setCalcPercent] = useState("5");
  const [status, setStatus] = useState("PENDING");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchEmployees();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/dashboard/commissions");
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("ບໍ່ສາມາດໂຫຼດລາຍການຄອມມິດຊັ່ນໄດ້");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/dashboard/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCalculatePercent = () => {
    const base = Number(calcBase) || 0;
    const pct = Number(calcPercent) || 0;
    if (base > 0 && pct > 0) {
      const computed = Math.round((base * pct) / 100);
      setAmount(computed.toString());
      toast.success(`ຄຳນວນຄອມມິດຊັ່ນ ${pct}% ຈາກ ₭${base.toLocaleString()} = ₭${computed.toLocaleString()}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ພະນັກງານ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        staffName: staffName.trim(),
        amount: Number(amount) || 0,
        status,
        date,
      };

      const url = editingItem
        ? `/api/dashboard/commissions/${editingItem.id}`
        : "/api/dashboard/commissions";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingItem ? "ອັບເດດຄອມມິດຊັ່ນສຳເລັດ" : "ບັນທຶກຄອມມິດຊັ່ນໃໝ່ສຳເລັດ");
        setShowAddModal(false);
        resetForm();
        fetchItems();
      } else {
        toast.error("ບັນທຶກບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async (item: CommissionItem) => {
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການຢືນຢັນການຈ່າຍຄອມມິດຊັ່ນ ₭${item.amount.toLocaleString()} ໃຫ້ແກ່ "${item.staffName}" ແທ້ບໍ່?`,
      {
        title: "ຢືນຢັນການຈ່າຍຄອມມິດຊັ່ນ",
        confirmText: "ຢືນຢັນຈ່າຍເງິນ",
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/commissions/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });

      if (res.ok) {
        toast.success(`ຈ່າຍຄອມມິດຊັ່ນໃຫ້ "${item.staffName}" ສຳເລັດແລ້ວ`);
        fetchItems();
      } else {
        toast.error("ອັບເດດສະຖານະບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await askConfirm("ທ່ານຕ້ອງການລຶບລາຍການຄອມມິດຊັ່ນນີ້ແທ້ບໍ່?", {
      title: "ຢືນຢັນການລຶບຄອມມິດຊັ່ນ",
      confirmText: "ລຶບລາຍການ",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/commissions/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບລາຍການສຳເລັດ");
        fetchItems();
      }
    } catch {
      toast.error("ລຶບລາຍການບໍ່ສຳເລັດ");
    }
  };

  const resetForm = () => {
    setStaffName("");
    setAmount("300000");
    setCalcBase("");
    setCalcPercent("5");
    setStatus("PENDING");
    setDate(new Date().toISOString().slice(0, 10));
    setEditingItem(null);
  };

  const openEdit = (item: CommissionItem) => {
    setEditingItem(item);
    setStaffName(item.staffName);
    setAmount(item.amount.toString());
    setStatus(item.status);
    setDate(item.date ? item.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setShowAddModal(true);
  };

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q || item.staffName.toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCommissions = items.reduce((sum, i) => sum + (i.amount || 0), 0);
  const pendingCommissions = items
    .filter((i) => i.status === "PENDING")
    .reduce((sum, i) => sum + (i.amount || 0), 0);
  const paidCommissions = items
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + (i.amount || 0), 0);
  const uniqueStaff = new Set(items.map((i) => i.staffName.trim().toLowerCase())).size;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-600 to-orange-700 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <Calculator className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ຄິດໄລ່ຄອມມິດຊັ່ນ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Staff Commission
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ຄຳນວນຄ່າຄອມມິດຊັ່ນຂອງພະນັກງານ, ຕິດຕາມຍອດຄ້າງຈ່າຍ ແລະ ບັນທຶກການເບີກຈ່າຍເງິນ
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>ເພີ່ມລາຍການຄອມມິດຊັ່ນ</span>
        </button>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ມູນຄ່າຄອມມິດຊັ່ນລວມ</p>
          <h3 className="text-2xl font-black text-amber-400 mt-2">₭{totalCommissions.toLocaleString()}</h3>
          <p className="text-xs text-zinc-500 mt-2">{items.length} ລາຍການທັງໝົດ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ລໍຖ້າຈ່າຍ (Pending)</p>
          <h3 className="text-2xl font-black text-orange-400 mt-2">₭{pendingCommissions.toLocaleString()}</h3>
          <p className="text-xs text-orange-400/80 mt-2">ຍອດທີ່ຍັງບໍ່ທັນເບີກຈ່າຍ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຈ່າຍແລ້ວ (Paid)</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">₭{paidCommissions.toLocaleString()}</h3>
          <p className="text-xs text-emerald-400/80 mt-2">ເບີກຈ່າຍຮຽບຮ້ອຍ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ພະນັກງານທີ່ໄດ້ຮັບ</p>
          <h3 className="text-2xl font-black text-blue-400 mt-2">{uniqueStaff} ຄົນ</h3>
          <p className="text-xs text-zinc-500 mt-2">ທີມງານທີ່ມີຜົນງານ</p>
        </div>
      </div>

      {/* ── Toolbar & Filtering ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ພະນັກງານ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { label: "ທັງໝົດ", value: "ALL" },
            { label: "ລໍຖ້າຈ່າຍ (Pending)", value: "PENDING" },
            { label: "ຈ່າຍແລ້ວ (Paid)", value: "PAID" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === item.value
                  ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md shadow-amber-500/20"
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
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
            <p className="text-zinc-400 text-sm">ກຳລັງໂຫຼດລາຍການຄອມມິດຊັ່ນ...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Calculator className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">ບໍ່ພົບລາຍການຄອມມິດຊັ່ນ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800/80">
                  <th className="p-4 text-xs font-semibold text-zinc-400">ຊື່ພະນັກງານ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-right">ຈຳນວນເງິນຄອມມິດຊັ່ນ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center">ວັນທີບັນທຶກ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center">ສະຖານະ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-4">
                      <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        {item.staffName}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        COM-{item.id.slice(-6).toUpperCase()}
                      </p>
                    </td>
                    <td className="p-4 text-sm font-black text-emerald-400 text-right whitespace-nowrap">
                      ₭{item.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center text-xs text-zinc-300">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === "PAID"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {item.status === "PAID" ? "ຈ່າຍແລ້ວ" : "ລໍຖ້າຈ່າຍ"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status === "PENDING" && (
                          <button
                            onClick={() => handleMarkPaid(item)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                            title="ຢືນຢັນການຈ່າຍຄອມມິດຊັ່ນ"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>ຈ່າຍແລ້ວ</span>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-500" />
                <span>{editingItem ? "ແກ້ໄຂຄອມມິດຊັ່ນ" : "ເພີ່ມລາຍການຄອມມິດຊັ່ນໃໝ່"}</span>
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
                  ເລືອກພະນັກງານ ຫຼື ປ້ອນຊື່ *
                </label>
                {employees.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) setStaffName(e.target.value);
                    }}
                    className="w-full mb-2 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300"
                  >
                    <option value="">-- ເລືອກຈາກລາຍຊື່ພະນັກງານໃນລະບົບ --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} ({emp.position || emp.department})
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  required
                  placeholder="ຊື່ພະນັກງານ / ຜູ້ຮັບຄອມມິດຊັ່ນ *"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Commission Calculator Helper */}
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 space-y-2">
                <span className="text-[11px] font-semibold text-amber-400 block">
                  ເຄື່ອງມືຊ່ວຍຄຳນວນຈາກເປີເຊັນຍອດຂາຍ:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="ຍອດຂາຍ (₭)..."
                      value={calcBase}
                      onChange={(e) => setCalcBase(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      placeholder="%"
                      value={calcPercent}
                      onChange={(e) => setCalcPercent(e.target.value)}
                      className="w-16 px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-center text-white"
                    />
                    <button
                      type="button"
                      onClick={handleCalculatePercent}
                      className="flex-1 px-2 py-1.5 bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      ຄິດໄລ່
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    ຈຳນວນເງິນຄອມມິດຊັ່ນ (₭) *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">ສະຖານະ</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="PENDING">ລໍຖ້າຈ່າຍ (Pending)</option>
                    <option value="PAID">ຈ່າຍແລ້ວ (Paid)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ວັນທີບັນທຶກ (Date)
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
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
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? "ອັບເດດຄອມມິດຊັ່ນ" : "ບັນທຶກຄອມມິດຊັ່ນ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
