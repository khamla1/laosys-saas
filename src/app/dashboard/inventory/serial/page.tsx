"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Hash,
  Plus,
  Search,
  Copy,
  XCircle,
  Trash2,
  Edit,
  Loader2,
  Package,
  ShoppingCart,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface SerialItem {
  id: string;
  productName: string;
  serialNumber: string;
  status: string; // IN_STOCK, SOLD, RETURNED
}

interface CatalogProduct {
  id: string;
  name: string;
}

export default function InventorySerialPage() {
  const [items, setItems] = useState<SerialItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SerialItem | null>(null);

  // Form states
  const [productName, setProductName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [status, setStatus] = useState("IN_STOCK");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchCatalogProducts();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/dashboard/serial");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນ Serial Number ໄດ້");
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
    if (!productName.trim() || !serialNumber.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ສິນຄ້າ ແລະ ໝາຍເລກ Serial Number");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        productName,
        serialNumber,
        status,
      };

      const url = editingItem
        ? `/api/dashboard/serial/${editingItem.id}`
        : "/api/dashboard/serial";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(
          editingItem ? "ອັບເດດ Serial Number ສຳເລັດແລ້ວ" : "ລົງທະບຽນ Serial Number ໃໝ່ສຳເລັດແລ້ວ"
        );
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

  const handleUpdateStatus = async (item: SerialItem, nextStatus: string) => {
    try {
      const res = await fetch(`/api/dashboard/serial/${item.id}`, {
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
    if (!(await askConfirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບໝາຍເລກ Serial Number ນີ້?"))) return;
    try {
      const res = await fetch(`/api/dashboard/serial/${id}`, { method: "DELETE" });
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
    setSerialNumber("");
    setStatus("IN_STOCK");
    setEditingItem(null);
  };

  const openEdit = (item: SerialItem) => {
    setEditingItem(item);
    setProductName(item.productName);
    setSerialNumber(item.serialNumber);
    setStatus(item.status);
    setShowAddModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`ຄັດລອກ SN "${text}" ແລ້ວ`);
  };

  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const inStockCount = items.filter((i) => i.status === "IN_STOCK").length;
  const soldCount = items.filter((i) => i.status === "SOLD").length;
  const returnedCount = items.filter((i) => i.status === "RETURNED").length;

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "SOLD":
        return {
          label: "ຂາຍແລ້ວ (SOLD)",
          color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          icon: ShoppingCart,
        };
      case "RETURNED":
        return {
          label: "ສົ່ງຄືນ/ເຄລມ (RETURNED)",
          color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
          icon: RotateCcw,
        };
      default:
        return {
          label: "ພ້ອມຂາຍ (IN STOCK)",
          color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
          icon: Package,
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
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-600 to-emerald-700 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <Hash className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ຕິດຕາມ Serial Number / IMEI
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                Serial Tracking
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ຄຸ້ມຄອງລະຫັດເຄື່ອງ Serial Number, IMEI ໂທລະສັບ, ອຸປະກອນໄອທີ ແລະ ການຮັບປະກັນລາຍຊິ້ນ
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-cyan-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> ລົງທະບຽນ Serial Number ໃໝ່
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ຢູ່ໃນສາງ (In Stock)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-cyan-400 mt-2">
                {inStockCount} <span className="text-sm font-normal text-zinc-500">ເຄື່ອງ</span>
              </h3>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ພ້ອມຈຳໜ່າຍໃນສາງ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ຂາຍອອກແລ້ວ (Sold)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-400 mt-2">
                {soldCount} <span className="text-sm font-normal text-zinc-500">ເຄື່ອງ</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ກຳລັງຢູ່ໃນໄລຍະຮັບປະກັນລູກຄ້າ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ສົ່ງຄືນ / ເຄລມ (Returned)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-purple-400 mt-2">
                {returnedCount} <span className="text-sm font-normal text-zinc-500">ເຄື່ອງ</span>
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <RotateCcw className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ລາຍການສົ່ງເຄລມ ຫຼື ຄືນສິນຄ້າ</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72 md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ, SN ຫຼື IMEI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { label: "ທັງໝົດ", value: "ALL" },
            { label: "ພ້ອມຂາຍ (IN STOCK)", value: "IN_STOCK" },
            { label: "ຂາຍແລ້ວ (SOLD)", value: "SOLD" },
            { label: "ສົ່ງຄືນ/ເຄລມ (RETURNED)", value: "RETURNED" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === item.value
                  ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-500/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Serial Numbers Grid */}
      {isLoading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500 mb-2" />
          <p className="text-zinc-500 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນ Serial Number...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 sm:p-12 md:p-20 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-20 h-20 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4">
            <Hash className="w-10 h-10 text-zinc-600" />
          </div>
          <p className="text-zinc-300 text-lg font-semibold">ຍັງບໍ່ມີຂໍ້ມູນ Serial Number</p>
          <p className="text-zinc-500 text-sm mt-1">
            ກົດປຸ່ມ &quot;ລົງທະບຽນ Serial Number ໃໝ່&quot; ເພື່ອເລີ່ມບັນທຶກລະຫັດເຄື່ອງລາຍຊິ້ນ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredItems.map((item) => {
            const badge = getStatusBadge(item.status);
            const BadgeIcon = badge.icon;
            return (
              <div
                key={item.id}
                className="bg-zinc-900/90 border border-zinc-800/80 hover:border-cyan-500/40 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.color} flex items-center gap-1.5`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      {badge.label}
                    </span>

                    <button
                      onClick={() => copyToClipboard(item.serialNumber)}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 px-2.5 py-1 rounded-lg transition-colors font-mono"
                    >
                      <Copy className="w-3 h-3" /> ຄັດລອກ SN
                    </button>
                  </div>

                  <h3 className="font-bold text-white text-lg leading-tight group-hover:text-cyan-400 transition-colors flex items-center gap-2 mt-2">
                    <Package className="w-4 h-4 text-cyan-400 shrink-0" />
                    {item.productName}
                  </h3>

                  {/* Serial Number Display Box */}
                  <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-4 my-3">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5" /> SERIAL NUMBER / IMEI
                    </span>
                    <div className="text-base font-mono font-bold text-cyan-400 mt-1 tracking-wider">
                      {item.serialNumber}
                    </div>
                  </div>
                </div>

                {/* Step Actions */}
                <div className="pt-4 border-t border-zinc-800/60 mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {item.status !== "IN_STOCK" && (
                      <button
                        onClick={() => handleUpdateStatus(item, "IN_STOCK")}
                        className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-semibold transition-colors"
                      >
                        ຄືນເຂົ້າສາງ
                      </button>
                    )}
                    {item.status !== "SOLD" && (
                      <button
                        onClick={() => handleUpdateStatus(item, "SOLD")}
                        className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors"
                      >
                        ຂາຍອອກ
                      </button>
                    )}
                    {item.status !== "RETURNED" && (
                      <button
                        onClick={() => handleUpdateStatus(item, "RETURNED")}
                        className="px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-semibold transition-colors"
                      >
                        ສົ່ງຄືນ/ເຄລມ
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
                {editingItem ? "ແກ້ໄຂ Serial Number" : "ລົງທະບຽນ Serial Number / IMEI ໃໝ່"}
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
                  <label className="block text-xs font-semibold text-cyan-400 uppercase mb-1.5">
                    ເລືອກສິນຄ້າຈາກສາງ (ທາງເລືອກ)
                  </label>
                  <select
                    onChange={(e) => {
                      const found = catalogProducts.find((p) => p.id === e.target.value);
                      if (found) setProductName(found.name);
                    }}
                    defaultValue=""
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-cyan-500/40 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
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
                  ຊື່ສິນຄ້າ / ລຸ້ນອຸປະກອນ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ຕົວຢ່າງ: iPhone 15 Pro Max 256GB, Garmin Fenix 7..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ໝາຍເລກ Serial Number / IMEI *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ຕົວຢ່າງ: SN-9988112233 ຫຼື 3584910293849"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ສະຖານະສິນຄ້າ
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="IN_STOCK">IN_STOCK (ພ້ອມຂາຍໃນສາງ)</option>
                  <option value="SOLD">SOLD (ຂາຍແລ້ວ / ຢູ່ໃນປະກັນ)</option>
                  <option value="RETURNED">RETURNED (ສົ່ງຄືນ / ເຄລມ)</option>
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
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? "ບັນທຶກການແກ້ໄຂ" : "ບັນທຶກ Serial Number"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
