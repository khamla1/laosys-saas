"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  FileText,
  Trash2,
  CheckCircle,
  Loader2,
  Package,
  Building,
  DollarSign,
  Clock,
  Boxes,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export default function PurchasesPage() {
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get("productId");

  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [recordedBy, setRecordedBy] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (preselectedProductId && products.length > 0) {
      setSelectedProductId(preselectedProductId);
      const prod = products.find((p) => p.id === preselectedProductId);
      if (prod) {
        setUnitPrice(prod.costPrice || prod.price || 0);
        setTotalAmount((prod.costPrice || prod.price || 0) * 1);
        setDescription(`ສັ່ງຊື້ຕື່ມສະຕັອກ: ${prod.name}`);
      }
      setShowAddModal(true);
    }
  }, [preselectedProductId, products]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/dashboard/purchases");
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("ບໍ່ສາມາດໂຫຼດລາຍການສັ່ງຊື້ໄດ້");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/dashboard/suppliers");
      if (res.ok) {
        const data = await res.json();
        setSuppliers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/data-editor/products?limit=100");
      if (res.ok) {
        const json = await res.json();
        setProducts(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      const price = prod.costPrice || prod.price || 0;
      setUnitPrice(price);
      setTotalAmount(price * quantity);
      if (!description) setDescription(`ສັ່ງຊື້: ${prod.name}`);
    }
  };

  const handleQuantityChange = (qty: number) => {
    setQuantity(qty);
    if (typeof unitPrice === "number") {
      setTotalAmount(unitPrice * qty);
    }
  };

  const handleUnitPriceChange = (price: number) => {
    setUnitPrice(price);
    setTotalAmount(price * quantity);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || totalAmount === "") {
      return toast.error("ກະລຸນາເລືອກຜູ້ສະໜອງ ແລະ ປ້ອນຍອດເງິນສັ່ງຊື້");
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        supplierId,
        status,
        totalAmount: Number(totalAmount),
        description: description.trim(),
        recordedBy: recordedBy.trim(),
      };

      if (selectedProductId) {
        payload.items = [
          {
            productId: selectedProductId,
            quantity: Number(quantity) || 1,
            unitPrice: Number(unitPrice) || 0,
          },
        ];
      }

      const res = await fetch("/api/dashboard/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("ບັນທຶກລາຍການສັ່ງຊື້ສຳເລັດ");
        setShowAddModal(false);
        resetForm();
        fetchOrders();
      } else {
        toast.error("ບັນທຶກລາຍການສັ່ງຊື້ບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkReceived = async (order: any) => {
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການຢືນຢັນການຮັບສິນຄ້າເຂົ້າສະຕັອກແທ້ບໍ່? ລະບົບຈະເພີ່ມຈຳນວນສິນຄ້າເຂົ້າສະຕັອກໂດຍອັດຕະໂນມັດ`,
      {
        title: "ຢືນຢັນການຮັບສິນຄ້າເຂົ້າສະຕັອກ",
        confirmText: "ຢືນຢັນຮັບສິນຄ້າ",
      }
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/purchases/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RECEIVED" }),
      });

      if (res.ok) {
        toast.success("ອັບເດດສະຖານະເປັນ 'ຮັບສິນຄ້າແລ້ວ' ແລະ ເພີ່ມສະຕັອກສຳເລັດ");
        fetchOrders();
        setSelectedOrder(null);
      } else {
        toast.error("ອັບເດດສະຖານະບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await askConfirm("ທ່ານຕ້ອງການລຶບລາຍການສັ່ງຊື້ສິນຄ້ານີ້ແທ້ບໍ່?", {
      title: "ຢືນຢັນການລຶບລາຍການສັ່ງຊື້",
      confirmText: "ລຶບລາຍການ",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/purchases/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບລາຍການສັ່ງຊື້ສຳເລັດ");
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch {
      toast.error("ລຶບລາຍການສັ່ງຊື້ບໍ່ສຳເລັດ");
    }
  };

  const resetForm = () => {
    setSupplierId("");
    setStatus("DRAFT");
    setTotalAmount("");
    setDescription("");
    setRecordedBy("");
    setSelectedProductId("");
    setQuantity(1);
    setUnitPrice("");
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      (o.description || "").toLowerCase().includes(q) ||
      (o.supplier?.name || "").toLowerCase().includes(q) ||
      (o.recordedBy || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalExpenseAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === "ORDERED" || o.status === "DRAFT").length;
  const receivedOrdersCount = orders.filter((o) => o.status === "RECEIVED").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ລະບົບບັນຊີ ແລະ ລາຍການຊື້
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Purchase Orders
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ຈັດການລາຍການສັ່ງຊື້ສິນຄ້າເຂົ້າຮ້ານ, ຜູ້ສະໜອງ (Suppliers) ແລະ ບັນທຶກເຂົ້າສະຕັອກອັດຕະໂນມັດ
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>ສ້າງໃບສັ່ງຊື້ໃໝ່</span>
        </button>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຍອດສັ່ງຊື້ລວມທັງໝົດ</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">₭{totalExpenseAmount.toLocaleString()}</h3>
          <p className="text-xs text-zinc-500 mt-2">{orders.length} ລາຍການສັ່ງຊື້</p>
        </div>
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ລໍຖ້າຮັບສິນຄ້າ</p>
          <h3 className="text-2xl font-black text-amber-400 mt-2">{pendingOrdersCount} ລາຍການ</h3>
          <p className="text-xs text-amber-400/80 mt-2">DRAFT ຫຼື ORDERED</p>
        </div>
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຮັບເຂົ້າສະຕັອກແລ້ວ</p>
          <h3 className="text-2xl font-black text-blue-400 mt-2">{receivedOrdersCount} ລາຍການ</h3>
          <p className="text-xs text-blue-400/80 mt-2">ເພີ່ມສະຕັອກຮຽບຮ້ອຍ</p>
        </div>
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຜູ້ສະໜອງສິນຄ້າ</p>
          <h3 className="text-2xl font-black text-purple-400 mt-2">{suppliers.length} ບໍລິສັດ</h3>
          <p className="text-xs text-zinc-500 mt-2">ຄູ່ຄ້າທັງໝົດໃນລະບົບ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Data Grid */}
        <div className={`lg:col-span-${selectedOrder ? "7" : "12"} transition-all duration-300`}>
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="ຄົ້ນຫາຜູ້ສະໜອງ, ຄຳອະທິບາຍ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                {[
                  { label: "ທັງໝົດ", val: "ALL" },
                  { label: "ຮ່າງ (Draft)", val: "DRAFT" },
                  { label: "ສັ່ງແລ້ວ (Ordered)", val: "ORDERED" },
                  { label: "ຮັບແລ້ວ (Received)", val: "RECEIVED" },
                ].map((f) => (
                  <button
                    key={f.val}
                    onClick={() => setStatusFilter(f.val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      statusFilter === f.val
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-zinc-800/50 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900/50 border-b border-zinc-800/80">
                    <th className="p-4 text-xs font-semibold text-zinc-400">ວັນທີສັ່ງຊື້</th>
                    <th className="p-4 text-xs font-semibold text-zinc-400">ຜູ້ສະໜອງ</th>
                    <th className="p-4 text-xs font-semibold text-zinc-400">ລາຍລະອຽດ</th>
                    <th className="p-4 text-xs font-semibold text-zinc-400 text-right">ຍອດເງິນລວມ</th>
                    <th className="p-4 text-xs font-semibold text-zinc-400 text-center">ສະຖານະ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-zinc-500">
                        ບໍ່ພົບລາຍການສັ່ງຊື້
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`cursor-pointer transition-colors hover:bg-zinc-800/30 group ${
                          selectedOrder?.id === order.id ? "bg-emerald-500/5" : ""
                        }`}
                      >
                        <td className="p-4 text-sm text-zinc-300 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm text-white font-medium">
                          {order.supplier?.name || "ບໍ່ລະບຸຜູ້ສະໜອງ"}
                        </td>
                        <td className="p-4 text-sm text-zinc-400 max-w-[200px] truncate">
                          {order.description || "-"}
                        </td>
                        <td className="p-4 text-sm text-emerald-400 font-bold text-right whitespace-nowrap">
                          ₭{order.totalAmount.toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex px-2 py-1 rounded-md text-[11px] font-bold ${
                              order.status === "RECEIVED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : order.status === "ORDERED"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            }`}
                          >
                            {order.status === "RECEIVED"
                              ? "ຮັບແລ້ວ"
                              : order.status === "ORDERED"
                              ? "ສັ່ງແລ້ວ"
                              : "ຮ່າງ"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Order Details Drawer */}
        {selectedOrder && (
          <div className="lg:col-span-5 animate-in slide-in-from-right-8 duration-300">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl sticky top-6">
              <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/50 flex justify-between items-center">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  <span>ລາຍລະອຽດໃບສັ່ງຊື້</span>
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  ປິດ
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">ຍອດເງິນສັ່ງຊື້ທັງໝົດ</div>
                    <div className="text-3xl font-bold text-emerald-400">
                      ₭{selectedOrder.totalAmount.toLocaleString()}
                    </div>
                  </div>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                      selectedOrder.status === "RECEIVED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : selectedOrder.status === "ORDERED"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    {selectedOrder.status === "RECEIVED"
                      ? "ຮັບແລ້ວ"
                      : selectedOrder.status === "ORDERED"
                      ? "ສັ່ງແລ້ວ"
                      : "ຮ່າງ"}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-400">ຜູ້ສະໜອງ:</span>
                    <span className="font-medium text-white">{selectedOrder.supplier?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-400">ເບີໂທຜູ້ສະໜອງ:</span>
                    <span className="font-mono text-zinc-300">{selectedOrder.supplier?.phone || "-"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-400">ວັນທີສັ່ງ:</span>
                    <span className="text-zinc-300">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-400">ຜູ້ບັນທຶກ:</span>
                    <span className="text-zinc-300">{selectedOrder.recordedBy || "-"}</span>
                  </div>
                  <div className="py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-400 block mb-1">ລາຍລະອຽດສິນຄ້າ:</span>
                    <p className="text-zinc-200 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                      {selectedOrder.description || "ບໍ່ມີລາຍລະອຽດເພີ່ມເຕີມ"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  {selectedOrder.status !== "RECEIVED" && (
                    <button
                      onClick={() => handleMarkReceived(selectedOrder)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>ຢືນຢັນຮັບສິນຄ້າເຂົ້າສະຕັອກ</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedOrder.id)}
                    className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>ລຶບລາຍການສັ່ງຊື້ນີ້</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                <span>ສ້າງໃບສັ່ງຊື້ສິນຄ້າໃໝ່</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ຍົກເລີກ
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ເລືອກຜູ້ສະໜອງ (Supplier) *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- ເລືອກຜູ້ສະໜອງ --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactPerson || s.phone || "ທົ່ວໄປ"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ເລືອກສິນຄ້າທີ່ຕ້ອງການສັ່ງຊື້ (ທາງເລືອກ)
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- ເລືອກສິນຄ້າໃນລະບົບ --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (ສະຕັອກປັດຈຸບັນ: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProductId && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      ຈຳນວນທີ່ສັ່ງ (ຊິ້ນ)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      ຕົ້ນທຶນຕໍ່ຊິ້ນ (₭)
                    </label>
                    <input
                      type="number"
                      value={unitPrice}
                      onChange={(e) => handleUnitPriceChange(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    ຍອດເງິນລວມ (₭) *
                  </label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    required
                    placeholder="0"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">ສະຖານະ</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="DRAFT">ຮ່າງ (Draft)</option>
                    <option value="ORDERED">ສັ່ງແລ້ວ (Ordered)</option>
                    <option value="RECEIVED">ຮັບແລ້ວ (Received)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ລາຍລະອຽດ / ເລກທີບິນ
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ລະບຸເລກທີໃບບິນ ຫຼື ລາຍລະອຽດ..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ຊື່ຜູ້ບັນທຶກລາຍການ
                </label>
                <input
                  type="text"
                  value={recordedBy}
                  onChange={(e) => setRecordedBy(e.target.value)}
                  placeholder="ຊື່ພະນັກງານທີ່ຮັບຜິດຊອບ"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>ບັນທຶກໃບສັ່ງຊື້</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
