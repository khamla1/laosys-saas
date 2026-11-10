"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Loader2,
  Package,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface ExpiryItem {
  id: string;
  productName: string;
  expiryDate: string;
  quantity: number;
  status: string; // GOOD, WARNING, EXPIRED
}

interface CatalogProduct {
  id: string;
  name: string;
  stock?: number;
}

export default function InventoryExpiryPage() {
  const [items, setItems] = useState<ExpiryItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpiryItem | null>(null);

  // Form states
  const [productName, setProductName] = useState("");
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [quantity, setQuantity] = useState("50");
  const [status, setStatus] = useState("GOOD");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchCatalogProducts();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/dashboard/expiry");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນວັນໝົດອາຍຸໄດ້");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCatalogProducts = async () => {
    try {
      const res = await fetch("/api/products?limit=200");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.products || [];
      setCatalogProducts(list);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !expiryDate) {
      return toast.error("ກະລຸນາປ້ອນຊື່ສິນຄ້າ ແລະ ວັນໝົດອາຍຸ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        productName,
        expiryDate,
        quantity: Number(quantity) || 1,
        status,
      };

      const url = editingItem
        ? `/api/dashboard/expiry/${editingItem.id}`
        : "/api/dashboard/expiry";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingItem ? "ອັບເດດຂໍ້ມູນລ็อตສິນຄ້າສຳເລັດແລ້ວ" : "ເພີ່ມລ็อตວັນໝົດອາຍຸສຳເລັດແລ້ວ");
        setShowAddModal(false);
        resetForm();
        fetchItems();
      } else {
        const err = await res.json();
        toast.error(err.error || "ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (item: ExpiryItem, nextStatus: string) => {
    try {
      const res = await fetch(`/api/dashboard/expiry/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        toast.success(`ປ່ຽນສະຖານະເປັນ "${nextStatus}" ສຳເລັດແລ້ວ`);
        fetchItems();
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດອັບເດດສະຖານະໄດ້");
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍການລ็อตວັນໝົດອາຍຸນີ້?"))) return;
    try {
      const res = await fetch(`/api/dashboard/expiry/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບລາຍການສຳເລັດແລ້ວ");
        fetchItems();
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດລຶບລາຍການໄດ້");
    }
  };

  const resetForm = () => {
    setProductName("");
    setExpiryDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setQuantity("50");
    setStatus("GOOD");
    setEditingItem(null);
  };

  const openEdit = (item: ExpiryItem) => {
    setEditingItem(item);
    setProductName(item.productName);
    setExpiryDate(item.expiryDate.slice(0, 10));
    setQuantity(item.quantity.toString());
    setStatus(item.status);
    setShowAddModal(true);
  };

  const calculateDaysLeft = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredItems = items.filter((i) => {
    const matchSearch = i.productName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const goodCount = items.filter((i) => i.status === "GOOD").length;
  const warningCount = items.filter((i) => i.status === "WARNING").length;
  const expiredCount = items.filter((i) => i.status === "EXPIRED").length;

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "EXPIRED":
        return {
          label: "ໝົດອາຍຸແລ້ວ (EXPIRED)",
          color: "bg-red-500/15 text-red-400 border-red-500/30",
        };
      case "WARNING":
        return {
          label: "ໃກ້ໝົດອາຍຸ (WARNING)",
          color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        };
      default:
        return {
          label: "ປົກກະຕິ (GOOD)",
          color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/inventory"
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="ກັບຄືນໜ້າຄັງສິນຄ້າ"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ຕິດຕາມລ็อต & ວັນໝົດອາຍຸ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Lot & Expiry Tracker
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ກວດສອບອາຍຸສິນຄ້າ, ວັດຖຸດິບອາຫານ, ຢາ ແລະ ແຈ້ງເຕືອນກ່ອນສິນຄ້າໝົດອາຍຸ
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-amber-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> ເພີ່ມລ็อตວັນໝົດອາຍຸ
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ປົກກະຕິ (Good)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-400 mt-2">
                {goodCount} <span className="text-sm font-normal text-zinc-500">ລ็อต</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ອາຍຸຄົງເຫຼືອຫຼາຍກວ່າ 30 ວັນ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ໃກ້ໝົດອາຍຸ (Warning)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-400 mt-2">
                {warningCount} <span className="text-sm font-normal text-zinc-500">ລ็อต</span>
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ຄວນຈັດໂປຣໂມຊັ່ນລະບາຍສະຕັອກດ່ວນ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-red-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ໝົດອາຍຸແລ້ວ (Expired)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-red-400 mt-2">
                {expiredCount} <span className="text-sm font-normal text-zinc-500">ລ็อต</span>
              </h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ຫ້າມຈຳໜ່າຍ ແລະ ຄວນຄັດອອກຈາກສາງ</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72 md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { label: "ທັງໝົດ", value: "ALL" },
            { label: "ປົກກະຕິ (GOOD)", value: "GOOD" },
            { label: "ໃກ້ໝົດອາຍຸ (WARNING)", value: "WARNING" },
            { label: "ໝົດອາຍຸ (EXPIRED)", value: "EXPIRED" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === item.value
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expiry List Grid */}
      {isLoading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
          <p className="text-zinc-500 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນວັນໝົດອາຍຸ...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 sm:p-12 md:p-20 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-20 h-20 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10 text-zinc-600" />
          </div>
          <p className="text-zinc-300 text-lg font-semibold">ຍັງບໍ່ມີລາຍການລ็อตວັນໝົດອາຍຸ</p>
          <p className="text-zinc-500 text-sm mt-1">
            ກົດປຸ່ມ &quot;ເພີ່ມລ็อตວັນໝົດອາຍຸ&quot; ເພື່ອເລີ່ມຕິດຕາມອາຍຸສິນຄ້າໃນສາງ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredItems.map((item) => {
            const badge = getStatusBadge(item.status);
            const daysLeft = calculateDaysLeft(item.expiryDate);
            return (
              <div
                key={item.id}
                className="bg-zinc-900/90 border border-zinc-800/80 hover:border-amber-500/40 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.color}`}
                    >
                      {badge.label}
                    </span>

                    <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-lg">
                      ຈຳນວນ: <strong className="text-white">{item.quantity}</strong>
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-lg leading-tight group-hover:text-amber-400 transition-colors flex items-center gap-2 mt-2">
                    <Package className="w-4 h-4 text-amber-400 shrink-0" />
                    {item.productName}
                  </h3>

                  {/* Expiry Date Card */}
                  <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-4 my-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase">
                        ວັນໝົດອາຍຸ (EXP)
                      </span>
                      <div className="text-base font-bold text-zinc-200 mt-1">
                        {item.expiryDate ? item.expiryDate.slice(0, 10) : "-"}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase">
                        ເວລາຄົງເຫຼືອ
                      </span>
                      <div
                        className={`text-lg font-extrabold ${
                          daysLeft <= 0
                            ? "text-red-400"
                            : daysLeft <= 30
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {daysLeft <= 0 ? "ໝົດອາຍຸແລ້ວ" : `ອີກ ${daysLeft} ວັນ`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step Actions */}
                <div className="pt-4 border-t border-zinc-800/60 mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {item.status !== "GOOD" && (
                      <button
                        onClick={() => handleUpdateStatus(item, "GOOD")}
                        className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors"
                      >
                        ປົກກະຕິ
                      </button>
                    )}
                    {item.status !== "WARNING" && (
                      <button
                        onClick={() => handleUpdateStatus(item, "WARNING")}
                        className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors"
                      >
                        ໃກ້ໝົດ
                      </button>
                    )}
                    {item.status !== "EXPIRED" && (
                      <button
                        onClick={() => handleUpdateStatus(item, "EXPIRED")}
                        className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition-colors"
                      >
                        ໝົດອາຍຸ
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      title="ແກ້ໄຂ"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="ລຶບ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {editingItem ? "ແກ້ໄຂລ็อตວັນໝົດອາຍຸ" : "ເພີ່ມລ็อตວັນໝົດອາຍຸໃໝ່"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingItem && catalogProducts.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase mb-1.5">
                    ເລືອກສິນຄ້າຈາກສາງ (ທາງເລືອກ)
                  </label>
                  <select
                    onChange={(e) => {
                      const found = catalogProducts.find((p) => p.id === e.target.value);
                      if (found) {
                        setProductName(found.name);
                        if (found.stock) setQuantity(String(found.stock));
                      }
                    }}
                    defaultValue=""
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-amber-500/40 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- ເລືອກສິນຄ້າໃນຄັງ --</option>
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ຊື່ສິນຄ້າ / ໝາຍເລກລ็อต (Lot) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ຕົວຢ່າງ: ນົມສົດ Lot #A01, ກາເຟຄົ່ວ..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    ວັນໝົດອາຍຸ (EXP) *
                  </label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    ຈຳນວນໃນລ็อต *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ສະຖານະ
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="GOOD">GOOD (ປົກກະຕິ)</option>
                  <option value="WARNING">WARNING (ໃກ້ໝົດອາຍຸ)</option>
                  <option value="EXPIRED">EXPIRED (ໝົດອາຍຸແລ້ວ)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? "ບັນທຶກການແກ້ໄຂ" : "ບັນທຶກລ็อตສິນຄ້າ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
