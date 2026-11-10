"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Barcode,
  Plus,
  Search,
  Printer,
  Copy,
  Trash2,
  Edit,
  Loader2,
  Package,
  RefreshCw,
  Tag,
  XCircle,
  QrCode,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface BarcodeItem {
  id: string;
  productName: string;
  barcode: string;
  price: number;
}

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  sku?: string;
}

export default function InventoryBarcodePage() {
  const [items, setItems] = useState<BarcodeItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BarcodeItem | null>(null);
  const [printPreviewItem, setPrintPreviewItem] = useState<BarcodeItem | null>(null);

  // Form states
  const [productName, setProductName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("50000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchCatalogProducts();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/dashboard/barcode");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນບາໂຄ້ດໄດ້");
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

  const generateRandomBarcode = () => {
    const prefix = "885";
    const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setBarcode(prefix + randomDigits.slice(0, 10));
  };

  const handleSelectProduct = (prodId: string) => {
    const found = catalogProducts.find((p) => p.id === prodId);
    if (!found) return;
    setProductName(found.name);
    setPrice(String(found.price || 0));
    if (found.sku && found.sku.length >= 6) {
      setBarcode(found.sku);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !barcode.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ສິນຄ້າ ແລະ ລະຫັດບາໂຄ້ດ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        productName,
        barcode,
        price: Number(price) || 0,
      };

      const url = editingItem
        ? `/api/dashboard/barcode/${editingItem.id}`
        : "/api/dashboard/barcode";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingItem ? "ອັບເດດບາໂຄ້ດສຳເລັດແລ້ວ" : "ສ້າງປ້າຍບາໂຄ້ດໃໝ່ສຳເລັດແລ້ວ");
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

  const handleDelete = async (id: string) => {
    if (!(await askConfirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍການບາໂຄ້ດນີ້?"))) return;
    try {
      const res = await fetch(`/api/dashboard/barcode/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບລາຍການບາໂຄ້ດສຳເລັດແລ້ວ");
        fetchItems();
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດລຶບລາຍການໄດ້");
    }
  };

  const resetForm = () => {
    setProductName("");
    generateRandomBarcode();
    setPrice("50000");
    setEditingItem(null);
  };

  const openEdit = (item: BarcodeItem) => {
    setEditingItem(item);
    setProductName(item.productName);
    setBarcode(item.barcode);
    setPrice(item.price.toString());
    setShowAddModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`ຄັດລອກລະຫັດ "${text}" ແລ້ວ`);
  };

  const filteredItems = items.filter(
    (item) =>
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <Barcode className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ພິມບາໂຄ້ດ & ປ້າຍລາຄາ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                Barcode Studio
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ສ້າງລະຫັດບາໂຄ້ດ EAN-13, ເຊື່ອມຕໍ່ສິນຄ້າໃນສາງ ແລະ ສັ່ງພິມສະຕິກເກີຕິດສິນຄ້າ
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> ສ້າງບາໂຄ້ດໃໝ່
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ລາຍການບາໂຄ້ດທັງໝົດ
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-2">
                {items.length} <span className="text-sm font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Barcode className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ມາດຕະຖານລະຫັດ
              </p>
              <h3 className="text-2xl font-extrabold text-indigo-400 mt-2">EAN-13 / Code128</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <QrCode className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-2">ຮອງຮັບເຄື່ອງສະແກນບາໂຄ້ດໜ້າຮ້ານ POS ທຸກລຸ້ນ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ສະຖານະເຄື່ອງພິມປ້າຍ
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-2">ພ້ອມພິມ (Ready)</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Printer className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-2">ຮອງຮັບເຈ້ຍສະຕິກເກີຂະໜາດມາດຕະຖານ</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ ຫຼື ລະຫັດບາໂຄ້ດ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="text-xs text-zinc-400">
          ສະແດງ <strong className="text-white">{filteredItems.length}</strong> ລາຍການ
        </div>
      </div>

      {/* Barcode Grid */}
      {isLoading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
          <p className="text-zinc-500 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນບາໂຄ້ດ...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 sm:p-12 md:p-20 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-20 h-20 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4">
            <Barcode className="w-10 h-10 text-zinc-600" />
          </div>
          <p className="text-zinc-300 text-lg font-semibold">ຍັງບໍ່ມີລາຍການບາໂຄ້ດ</p>
          <p className="text-zinc-500 text-sm mt-1">
            ກົດປຸ່ມ &quot;ສ້າງບາໂຄ້ດໃໝ່&quot; ດ້ານເທິງເພື່ອເລີ່ມສ້າງປ້າຍສະຕິກເກີຕິດສິນຄ້າ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900/90 border border-zinc-800/80 hover:border-indigo-500/40 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Package className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-white text-base leading-tight group-hover:text-indigo-400 transition-colors">
                      {item.productName}
                    </h3>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                    {Number(item.price).toLocaleString()} ₭
                  </span>
                </div>

                {/* Visual Barcode Sticker Simulation */}
                <div className="bg-white rounded-xl p-4 my-3 text-center shadow-inner border border-zinc-200 flex flex-col items-center">
                  <span className="text-[11px] font-bold text-zinc-700 truncate max-w-full mb-1">
                    {item.productName}
                  </span>
                  <div className="w-full h-12 flex items-center justify-center gap-[2px] px-4 overflow-hidden">
                    {item.barcode.split("").map((char, idx) => {
                      const num = parseInt(char, 10) || 3;
                      return (
                        <React.Fragment key={idx}>
                          <div
                            className="bg-black h-full"
                            style={{ width: `${(num % 3) + 1.5}px` }}
                          />
                          <div className="bg-white h-full" style={{ width: "1.5px" }} />
                          <div
                            className="bg-black h-full"
                            style={{ width: `${((num + 1) % 2) + 1}px` }}
                          />
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <span className="font-mono text-xs font-bold tracking-[0.25em] text-zinc-900 mt-1.5">
                    {item.barcode}
                  </span>
                  <span className="text-[11px] font-extrabold text-indigo-700 mt-0.5">
                    ລາຄາ: {Number(item.price).toLocaleString()} ກີບ
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => copyToClipboard(item.barcode)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> ຄັດລອກ
                  </button>
                  <button
                    onClick={() => setPrintPreviewItem(item)}
                    className="px-3 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> ພິມປ້າຍ
                  </button>
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
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {editingItem ? "ແກ້ໄຂຂໍ້ມູນບາໂຄ້ດ" : "ສ້າງບາໂຄ້ດສິນຄ້າໃໝ່"}
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
                  <label className="block text-xs font-semibold text-indigo-400 uppercase mb-1.5">
                    ເລືອກດຶງຈາກສິນຄ້າໃນສາງ (ທາງເລືອກ)
                  </label>
                  <select
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    defaultValue=""
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-indigo-500/40 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- ເລືອກສິນຄ້າເພື່ອດຶງຊື່ ແລະ ລາຄາອັດຕະໂນມັດ --</option>
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({Number(p.price || 0).toLocaleString()} ₭)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ຊື່ສິນຄ້າ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ຕົວຢ່າງ: ກາເຟອາຣາບິກ້າ 500g, ເສື້ອກິລາ..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ລະຫັດບາໂຄ້ດ (Barcode / SKU) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-indigo-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={generateRandomBarcode}
                    className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="ສຸ່ມລະຫັດໃໝ່"
                  >
                    <RefreshCw className="w-4 h-4" /> ສຸ່ມລະຫັດ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ລາຄາຂາຍ (ກີບ) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-emerald-400 font-bold focus:outline-none focus:border-indigo-500"
                />
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
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? "ບັນທຶກການແກ້ໄຂ" : "ສ້າງບາໂຄ້ດ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Sticker Preview Modal */}
      {printPreviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-center space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-400" /> ຕົວຢ່າງປ້າຍສະຕິກເກີບາໂຄ້ດ
              </h3>
              <button
                onClick={() => setPrintPreviewItem(null)}
                className="text-zinc-500 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-xl mx-auto max-w-xs border-2 border-dashed border-zinc-300">
              <p className="text-sm font-extrabold text-zinc-900 mb-2">
                {printPreviewItem.productName}
              </p>
              <div className="w-full h-16 flex items-center justify-center gap-[2px] px-4">
                {printPreviewItem.barcode.split("").map((char, idx) => {
                  const num = parseInt(char, 10) || 3;
                  return (
                    <React.Fragment key={idx}>
                      <div
                        className="bg-black h-full"
                        style={{ width: `${(num % 3) + 2}px` }}
                      />
                      <div className="bg-white h-full" style={{ width: "2px" }} />
                      <div
                        className="bg-black h-full"
                        style={{ width: `${((num + 1) % 2) + 1.5}px` }}
                      />
                    </React.Fragment>
                  );
                })}
              </div>
              <p className="font-mono text-sm font-bold tracking-[0.3em] text-zinc-900 mt-2">
                {printPreviewItem.barcode}
              </p>
              <p className="text-base font-black text-indigo-700 mt-1">
                {Number(printPreviewItem.price).toLocaleString()} ກີບ
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPrintPreviewItem(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold"
              >
                ປິດໜ້າຕ່າງ
              </button>
              <button
                onClick={() => {
                  window.print();
                  toast.success("ສົ່ງຄຳສັ່ງພິມປ້າຍບາໂຄ້ດແລ້ວ");
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <Printer className="w-4 h-4" /> ສັ່ງພິມດຽວນີ້
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
