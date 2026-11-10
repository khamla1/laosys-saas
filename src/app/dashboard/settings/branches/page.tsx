"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect } from "react";
import {
  Building,
  Plus,
  Search,
  MapPin,
  User,
  CheckCircle,
  Trash2,
  Edit,
  XCircle,
  Loader2,
  Store,
  Navigation,
  Phone,
  Power
} from "lucide-react";
import { toast } from "sonner";

interface BranchItem {
  id: string;
  name: string;
  location: string;
  manager: string;
  status: string; // ACTIVE, CLOSED
  createdAt: string;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BranchItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [manager, setManager] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBranches();
    fetchEmployees();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/dashboard/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນສາຂາໄດ້");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ສາຂາ ແລະ ທີ່ຕັ້ງຂອງສາຂາ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        location: location.trim(),
        manager: manager.trim() || "ບໍ່ໄດ້ລະບຸ",
        status,
      };

      const url = editingItem
        ? `/api/dashboard/branches/${editingItem.id}`
        : "/api/dashboard/branches";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingItem ? "ອັບເດດຂໍ້ມູນສາຂາສຳເລັດ" : "ເພີ່ມສາຂາໃໝ່ສຳເລັດແລ້ວ");
        setShowAddModal(false);
        resetForm();
        fetchBranches();
      } else {
        toast.error("ບັນທຶກບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: BranchItem) => {
    const nextStatus = item.status === "ACTIVE" ? "CLOSED" : "ACTIVE";
    try {
      const res = await fetch(`/api/dashboard/branches/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        toast.success(
          nextStatus === "ACTIVE"
            ? `ເປີດບໍລິການສາຂາ "${item.name}" ແລ້ວ`
            : `ປິດບໍລິການສາຂາ "${item.name}" ຊົ່ວຄາວແລ້ວ`
        );
        fetchBranches();
      } else {
        toast.error("ປ່ຽນສະຖານະບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await askConfirm("ທ່ານຕ້ອງການລຶບສາຂານີ້ແທ້ບໍ່?", {
      title: "ຢືນຢັນການລຶບສາຂາ",
      confirmText: "ລຶບສາຂາ",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/branches/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບສາຂາສຳເລັດແລ້ວ");
        fetchBranches();
      } else {
        toast.error("ລຶບສາຂາບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບ");
    }
  };

  const resetForm = () => {
    setName("");
    setLocation("");
    setManager("");
    setStatus("ACTIVE");
    setEditingItem(null);
  };

  const openEdit = (item: BranchItem) => {
    setEditingItem(item);
    setName(item.name);
    setLocation(item.location);
    setManager(item.manager || "");
    setStatus(item.status);
    setShowAddModal(true);
  };

  const filteredBranches = branches.filter((b) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.location.toLowerCase().includes(q) ||
      (b.manager && b.manager.toLowerCase().includes(q));
    const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCount = branches.length;
  const activeCount = branches.filter((b) => b.status === "ACTIVE").length;
  const closedCount = branches.filter((b) => b.status === "CLOSED").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-sky-700 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <Building className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ຈັດການສາຂາ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                Store Branches
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ຈັດການຂໍ້ມູນສາຂາຮ້ານຄ້າ, ທີ່ຕັ້ງ, ຜູ້ຈັດການສາຂາ ແລະ ສະຖານະເປີດ-ປິດບໍລິການ
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
          <span>ເພີ່ມສາຂາໃໝ່</span>
        </button>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ສາຂາທັງໝົດ</p>
              <h3 className="text-2xl font-black text-white mt-2">{totalCount} ສາຂາ</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-2">ຈຳນວນສາຂາໃນລະບົບທັງໝົດ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ເປີດບໍລິການ (Active)</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-2">{activeCount} ສາຂາ</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-400/80 mt-2">ພ້ອມຂາຍ ແລະ ໃຫ້ບໍລິການ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ປິດບໍລິການ (Closed)</p>
              <h3 className="text-2xl font-black text-zinc-400 mt-2">{closedCount} ສາຂາ</h3>
            </div>
            <div className="p-3 bg-zinc-800 rounded-xl text-zinc-400 border border-zinc-700">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-2">ປິດປັບປຸງ ຫຼື ຢຸດໃຫ້ບໍລິການ</p>
        </div>
      </div>

      {/* ── Toolbar & Filtering ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ສາຂາ, ທີ່ຕັ້ງ, ຜູ້ຈັດການ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: "ທັງໝົດ", value: "ALL" },
            { label: "ເປີດບໍລິການ (Active)", value: "ACTIVE" },
            { label: "ປິດບໍລິການ (Closed)", value: "CLOSED" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === item.value
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Branches Table ── */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
            <p className="text-zinc-400 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນສາຂາ...</p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Building className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">ບໍ່ພົບຂໍ້ມູນສາຂາ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800/80">
                  <th className="p-4 text-xs font-semibold text-zinc-400">ຊື່ສາຂາ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400">ທີ່ຕັ້ງ / ສະຖານທີ່</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400">ຜູ້ຈັດການສາຂາ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center">ສະຖານະ</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filteredBranches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {branch.name}
                          </p>
                          <p className="text-[11px] font-mono text-zinc-500">
                            BR-{branch.id.slice(-6).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>{branch.location}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>{branch.manager || "ບໍ່ໄດ້ລະບຸ"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(branch)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          branch.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
                        }`}
                        title="ກົດເພື່ອປ່ຽນສະຖານະ"
                      >
                        <Power className="w-3 h-3" />
                        <span>{branch.status === "ACTIVE" ? "ເປີດບໍລິການ" : "ປິດບໍລິການ"}</span>
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(branch)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded-lg transition-colors"
                          title="ແກ້ໄຂ"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(branch.id)}
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-500" />
                <span>{editingItem ? "ແກ້ໄຂຂໍ້ມູນສາຂາ" : "ເພີ່ມສາຂາໃໝ່"}</span>
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
                  ຊື່ສາຂາ *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="ເຊັ່ນ: ສາຂາດົງໂດກ, ສາຂາສີຫອມ..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ທີ່ຕັ້ງ / ສະຖານທີ່ *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  placeholder="ເຊັ່ນ: ບ້ານດົງໂດກ, ເມືອງໄຊທານີ, ນະຄອນຫຼວງວຽງຈັນ"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ຜູ້ຈັດການສາຂາ (Manager)
                </label>
                {employees.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) setManager(e.target.value);
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
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  placeholder="ຊື່ຜູ້ຈັດການສາຂາ"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">ສະຖານະ</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ACTIVE">ເປີດບໍລິການ (Active)</option>
                  <option value="CLOSED">ປິດບໍລິການ (Closed)</option>
                </select>
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
                  <span>{editingItem ? "ອັບເດດສາຂາ" : "ບັນທຶກສາຂາ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
