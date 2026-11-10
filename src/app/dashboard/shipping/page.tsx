"use client";

import { askConfirm } from "@/components/ConfirmModal";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Search,
  MapPin,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  XCircle,
  Loader2,
  PackageCheck,
  Navigation,
  ExternalLink,
  Barcode,
  User,
  Phone,
  ShoppingBag,
  Eye,
  Copy,
  FileText,
  ShoppingCart,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaginationControls } from "@/components/PaginationControls";
import { copyToClipboard } from "@/lib/utils";

interface ShippingRouteItem {
  id: string;
  type?: "ONLINE_ORDER" | "MANUAL";
  destination: string;
  carrier: string;
  trackingNumber: string;
  status: string; // PENDING, SHIPPED, DELIVERED
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerNote?: string;
  totalAmount?: number;
  orderItems?: { name: string; quantity: number; price: number }[];
  createdAt?: string;
}

export default function ShippingPage() {
  const [items, setItems] = useState<ShippingRouteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShippingRouteItem | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<ShippingRouteItem | null>(null);

  // Form states
  const [destination, setDestination] = useState("");
  const [carrier, setCarrier] = useState("Anousith Express");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/dashboard/shipping");
      const data = await res.json();
      if (res.ok) {
        setItems(data);
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນຂົນສົ່ງໄດ້");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || !carrier.trim()) {
      return toast.error("ກະລຸນາປ້ອນປາຍທາງ ແລະ ບໍລິສັດຂົນສົ່ງ");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        destination,
        carrier,
        trackingNumber: trackingNumber || `LAO-${Math.floor(100000 + Math.random() * 900000)}`,
        status,
      };

      const url = editingItem
        ? `/api/dashboard/shipping/${editingItem.id}`
        : "/api/dashboard/shipping";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingItem ? "ແກ້ໄຂຂໍ້ມູນສຳເລັດ" : "ບັນທຶກອໍເດີຂົນສົ່ງໃໝ່ສຳເລັດ");
        setShowAddModal(false);
        resetForm();
        fetchItems();
      } else {
        const err = await res.json();
        toast.error(err.error || "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (item: ShippingRouteItem, nextStatus: string) => {
    try {
      const res = await fetch(`/api/dashboard/shipping/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        toast.success(`ອັບເດດສະຖານະເປັນ "${nextStatus}" ແລ້ວ`);
        fetchItems();
      }
    } catch (err) {
      toast.error("ປ່ຽນສະຖານະບໍ່ສຳເລັດ");
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm("ທ່ານຕ້ອງການລຶບຂໍ້ມູນຂົນສົ່ງນີ້ແທ້ບໍ່?"))) return;
    try {
      const res = await fetch(`/api/dashboard/shipping/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບສຳເລັດແລ້ວ");
        fetchItems();
      }
    } catch (err) {
      toast.error("ລຶບບໍ່ສຳເລັດ");
    }
  };

  const resetForm = () => {
    setDestination("");
    setCarrier("Anousith Express");
    setTrackingNumber("");
    setStatus("PENDING");
    setEditingItem(null);
  };

  const openEdit = (item: ShippingRouteItem) => {
    setEditingItem(item);
    setDestination(item.destination);
    setCarrier(item.carrier);
    setTrackingNumber(item.trackingNumber || "");
    setStatus(item.status);
    setShowAddModal(true);
  };

  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.destination.toLowerCase().includes(search.toLowerCase()) ||
      (item.trackingNumber && item.trackingNumber.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Reset page when filtering or searching changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Summary statistics
  const pendingCount = items.filter((i) => i.status === "PENDING").length;
  const shippedCount = items.filter((i) => i.status === "SHIPPED").length;
  const deliveredCount = items.filter((i) => i.status === "DELIVERED").length;

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "DELIVERED":
        return {
          label: "ສົ່ງຮອດແລ້ວ (DELIVERED)",
          color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          icon: PackageCheck,
        };
      case "SHIPPED":
        return {
          label: "ກຳລັງຂົນສົ່ງ (SHIPPED)",
          color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          icon: Truck,
        };
      default:
        return {
          label: "ລໍຖ້າຈັດສົ່ງ (PENDING)",
          color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          icon: Clock,
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ເຊື່ອມຕໍ່ຂົນສົ່ງ (Logistics)
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                Delivery Tracking
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ຕິດຕາມອໍເດີຈັດສົ່ງ, ເລກ Tracking, ບໍລິສັດຂົນສົ່ງ ແລະ ສະຖານະການຈັດສົ່ງ
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-cyan-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> ສ້າງລາຍການຂົນສົ່ງ
        </button>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ລໍຖ້າຈັດສົ່ງ (Pending)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-400 mt-2">
                {pendingCount} <span className="text-sm font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ລໍຖ້າການມາຮັບພັດສະດຸຈາກຂົນສົ່ງ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ກຳລັງຂົນສົ່ງ (In Transit)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-blue-400 mt-2">
                {shippedCount} <span className="text-sm font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <Truck className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ຢູ່ລະຫວ່າງການເດີນທາງໄປຫາລູກຄ້າ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ສົ່ງຮອດແລ້ວ (Delivered)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-400 mt-2">
                {deliveredCount} <span className="text-sm font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <PackageCheck className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ລູກຄ້າໄດ້ຮັບສິນຄ້າຮຽບຮ້ອຍແລ້ວ</p>
        </div>
      </div>

      {/* ── Toolbar & Filtering ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72 md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາປາຍທາງ ຫຼື ເລກ Tracking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { label: "ທັງໝົດ", value: "ALL" },
            { label: "PENDING", value: "PENDING" },
            { label: "SHIPPED", value: "SHIPPED" },
            { label: "DELIVERED", value: "DELIVERED" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === item.value
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Shipping Routes Grid ── */}
      {isLoading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500 mb-2" />
          <p className="text-zinc-500 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນຂົນສົ່ງ...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 sm:p-12 md:p-20 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-20 h-20 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4">
            <Truck className="w-10 h-10 text-zinc-600" />
          </div>
          <p className="text-zinc-300 text-lg font-semibold">ບໍ່ພົບລາຍການຂົນສົ່ງ</p>
          <p className="text-zinc-500 text-sm mt-1">
            ທ່ານສາມາດສ້າງລາຍການຂົນສົ່ງໃໝ່ໄດ້ໂດຍກົດປຸ່ມດ້ານເທິງ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {paginatedItems.map((item) => {
            const badge = getStatusBadge(item.status);
            const BadgeIcon = badge.icon;
            return (
              <div
                key={item.id}
                className="bg-zinc-900/90 border border-zinc-800/80 hover:border-cyan-500/40 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between group shadow-lg"
              >
                <div>
                  {/* Status header */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.color} flex items-center gap-1.5`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      {badge.label}
                    </span>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border ${
                        item.type === "ONLINE_ORDER"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {item.type === "ONLINE_ORDER" ? (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ອໍເດີອອນລາຍ</span>
                        </>
                      ) : (
                        <>
                          <Truck className="w-3.5 h-3.5" />
                          <span>ບັນທຶກເອງ</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Destination */}
                  <h3 className="font-bold text-white text-lg leading-tight group-hover:text-cyan-400 transition-colors flex items-center gap-2 mt-2">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="line-clamp-1">{item.destination}</span>
                  </h3>

                  {/* Customer Information Box */}
                  <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 my-3 space-y-2 text-xs shadow-inner">
                    <div className="flex items-center justify-between text-zinc-200">
                      <span className="flex items-center gap-1.5 font-bold text-sm">
                        <User className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="line-clamp-1">{item.customerName || "ລູກຄ້າ"}</span>
                      </span>
                      {item.customerPhone && item.customerPhone !== "-" && (
                        <button
                          onClick={() => {
                            copyToClipboard(item.customerPhone || "");
                            toast.success("ກັອບປີ້ເບີໂທແລ້ວ");
                          }}
                          className="font-mono font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 shrink-0 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          {item.customerPhone}
                        </button>
                      )}
                    </div>

                    {item.customerAddress && item.customerAddress !== "-" && (
                      <div className="text-zinc-400 line-clamp-2 leading-relaxed bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                        {item.customerAddress}
                      </div>
                    )}

                    {item.customerNote && item.customerNote !== "-" && (
                      <div className="px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 flex items-start gap-1.5 text-[11px]">
                        <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">ໝາຍເຫດ: {item.customerNote}</span>
                      </div>
                    )}

                    {item.orderItems && item.orderItems.length > 0 && (
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1 font-medium text-cyan-300">
                          <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                          {item.orderItems.length} ລາຍການ ({item.orderItems.reduce((acc, i) => acc + i.quantity, 0)} ຊິ້ນ)
                        </span>
                        {item.totalAmount !== undefined && item.totalAmount > 0 && (
                          <span className="font-extrabold text-emerald-400 text-xs">
                            ₭{item.totalAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tracking Number Card */}
                  <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3.5 mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-zinc-500 uppercase flex items-center gap-1">
                        <Barcode className="w-3.5 h-3.5" /> ເລກ TRACKING ({item.carrier})
                      </span>
                      <div className="text-sm font-mono font-bold text-zinc-200 mt-0.5">
                        {item.trackingNumber || "ບໍ່ໄດ້ລະບຸ"}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (item.trackingNumber) {
                          copyToClipboard(item.trackingNumber);
                          toast.success("ກັອບປີ້ Tracking ແລ້ວ");
                        }
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Step Workflow Actions */}
                <div className="pt-3.5 border-t border-zinc-800/60 mt-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.status !== "SHIPPED" && item.status !== "DELIVERED" && (
                      <button
                        onClick={() => handleUpdateStatus(item, "SHIPPED")}
                        className="px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold transition-colors"
                      >
                        ສົ່ງອອກແລ້ວ
                      </button>
                    )}
                    {item.status !== "DELIVERED" && (
                      <button
                        onClick={() => handleUpdateStatus(item, "DELIVERED")}
                        className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors"
                      >
                        ຮອດລູກຄ້າແລ້ວ
                      </button>
                    )}
                    {item.status === "DELIVERED" && (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> ສຳເລັດ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailModalItem(item)}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1"
                      title="ເບິ່ງຂໍ້ມູນລູກຄ້າ ແລະ ທີ່ຢູ່ເຕັມ"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">ລາຍລະອຽດ</span>
                    </button>
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

      {/* ── Pagination Controls ── */}
      {filteredItems.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onItemsPerPageChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          t={{
            showing: "Showing",
            to: "to",
            of: "of",
            entries: "entries",
            page: "Page",
            perPage: "ແຖວຕໍ່ໜ້າ (Rows):",
            previous: "Previous",
            next: "Next",
          }}
        />
      )}

      {/* ── Add / Edit Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {editingItem ? "ແກ້ໄຂຂໍ້ມູນຂົນສົ່ງ" : "ສ້າງລາຍການຂົນສົ່ງໃໝ່"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ປາຍທາງ / ທີ່ຢູ່ຈັດສົ່ງ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ເຊັ່ນ: ນະຄອນຫຼວງວຽງຈັນ, ປາກເຊ..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ບໍລິສັດຂົນສົ່ງ *
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Anousith Express">Anousith Express (ອານຸສິດ)</option>
                  <option value="HAL Logistics">HAL Logistics</option>
                  <option value="Kiengkai Express">Kiengkai Express (ກຽງໄກ)</option>
                  <option value="LFE Express">LFE Express</option>
                  <option value="EMS Laos">EMS Laos (ໄປສະນີ)</option>
                  <option value="DHL / FedEx">DHL / FedEx</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ເລກ Tracking Number
                </label>
                <input
                  type="text"
                  placeholder="ເຊັ່ນ: LAO-894102 (ປ່ອຍວ່າງເພື່ອສ້າງອັດຕະໂນມັດ)"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-cyan-400 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ສະຖານະ
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="PENDING">PENDING (ລໍຖ້າຈັດສົ່ງ)</option>
                  <option value="SHIPPED">SHIPPED (ກຳລັງຂົນສົ່ງ)</option>
                  <option value="DELIVERED">DELIVERED (ສົ່ງຮອດແລ້ວ)</option>
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
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? "ບັນທຶກການແກ້ໄຂ" : "ສ້າງລາຍການຂົນສົ່ງ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Full Customer & Shipping Details Modal (Spacious Wide Layout) ── */}
      <Dialog open={!!detailModalItem} onOpenChange={(open) => !open && setDetailModalItem(null)}>
        <DialogContent className="w-[96vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-6xl bg-zinc-950 border border-zinc-800 text-white rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="border-b border-zinc-800/80 pb-4 mb-4">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center justify-between text-cyan-400">
              <div className="flex items-center gap-2.5">
                <Truck className="w-6 h-6 text-cyan-400" />
                <span>ຂໍ້ມູນການຈັດສົ່ງ ແລະ ລາຍລະອຽດລູກຄ້າ</span>
              </div>
              <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {detailModalItem?.trackingNumber || detailModalItem?.id || "SHIPPING"}
              </span>
            </DialogTitle>
          </DialogHeader>

          {detailModalItem && (
            <div className="space-y-6">
              {/* 2-Column Responsive Wide Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Customer & Shipping Address */}
                <div className="space-y-5">
                  {/* Customer Contact Card */}
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-sm">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                      <User className="w-4 h-4 text-cyan-400" />
                      <span>ຂໍ້ມູນຕິດຕໍ່ຜູ້ຮັບ (Customer Info)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-1">
                      <div>
                        <span className="text-zinc-500 text-xs block font-medium">ຊື່ ແລະ ນາມສະກຸນ:</span>
                        <span className="font-bold text-white text-base mt-0.5 block">
                          {detailModalItem.customerName || "ບໍ່ລະບຸ"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-xs block font-medium">ເບີໂທຕິດຕໍ່ (Phone):</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-emerald-400 text-base">
                            {detailModalItem.customerPhone || "-"}
                          </span>
                          {detailModalItem.customerPhone && detailModalItem.customerPhone !== "-" && (
                            <button
                              onClick={() => {
                                copyToClipboard(detailModalItem.customerPhone || "");
                                toast.success("ກັອບປີ້ເບີໂທແລ້ວ");
                              }}
                              className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-lg border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address Card */}
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <span>ທີ່ຢູ່ຈັດສົ່ງ (Shipping Address in Laos)</span>
                      </h4>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            window.print();
                            toast.success("ສົ່ງຄຳສັ່ງພິມໃບປ່ອງໜ້າກ່ອງພັດສະດຸແລ້ວ");
                          }}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Barcode className="w-3.5 h-3.5 text-cyan-400" />
                          <span>ພິມໃບປ່ອງ (Print Label)</span>
                        </button>

                        <button
                          onClick={() => {
                            const textToCopy = `ຊື່ຜູ້ຮັບ: ${detailModalItem.customerName || "-"}\nເບີໂທ: ${detailModalItem.customerPhone || "-"}\nທີ່ຢູ່: ${detailModalItem.customerAddress || detailModalItem.destination}\nຂົນສົ່ງ: ${detailModalItem.carrier}`;
                            copyToClipboard(textToCopy);
                            toast.success("ກັອບປີ້ທີ່ຢູ່ຈັດສົ່ງສຳລັບພິມໃບປິ້ນແລ້ວ");
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>ກັອບປີ້ທີ່ຢູ່ (Copy)</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {detailModalItem.customerAddress || detailModalItem.destination}
                    </div>

                    {detailModalItem.customerNote && detailModalItem.customerNote !== "-" && (
                      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
                        <FileText className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                        <div>
                          <span className="font-bold block text-amber-400">ໝາຍເຫດຈາກລູກຄ້າ:</span>
                          <p className="mt-0.5 text-zinc-200">{detailModalItem.customerNote}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Order Items & Carrier / Tracking */}
                <div className="space-y-5">
                  {/* Order Items Breakdown */}
                  {detailModalItem.orderItems && detailModalItem.orderItems.length > 0 && (
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-zinc-800 pb-2.5">
                        <span className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-emerald-400" />
                          <span>ລາຍການສິນຄ້າທີ່ສັ່ງ (Order Items)</span>
                        </span>
                        {detailModalItem.totalAmount !== undefined && detailModalItem.totalAmount > 0 && (
                          <span className="font-extrabold text-emerald-400 text-sm">
                            ລວມ: ₭{detailModalItem.totalAmount.toLocaleString()}
                          </span>
                        )}
                      </h4>

                      <div className="divide-y divide-zinc-800/60 max-h-56 overflow-y-auto pr-1">
                        {detailModalItem.orderItems.map((orderItem, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
                            <span className="text-zinc-200 font-medium">
                              {orderItem.name} <span className="text-zinc-500 font-normal">x{orderItem.quantity}</span>
                            </span>
                            <span className="font-mono font-bold text-zinc-300">
                              ₭{(orderItem.price * orderItem.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Carrier & Tracking */}
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                      <Truck className="w-4 h-4 text-blue-400" />
                      <span>ຂໍ້ມູນການຂົນສົ່ງ (Logistics & Carrier)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-zinc-500 uppercase block font-semibold">ບໍລິສັດຂົນສົ່ງ / ຊ່ອງທາງ (Carrier)</span>
                        <span className="text-sm font-bold text-white mt-1 block">{detailModalItem.carrier}</span>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500 uppercase block font-semibold">ເລກ Tracking</span>
                        <span className="text-sm font-mono font-bold text-cyan-400 mt-1 block">
                          {detailModalItem.trackingNumber || "ບໍ່ໄດ້ລະບຸ"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      window.print();
                      toast.success("ສົ່ງຄຳສັ່ງພິມໃບປ່ອງໜ້າກ່ອງພັດສະດຸແລ້ວ");
                    }}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                  >
                    <Barcode className="w-4 h-4 text-cyan-400" />
                    <span>ພິມໃບປ່ອງ (Print Label)</span>
                  </button>
                  <button
                    onClick={() => {
                      const textToCopy = `ຊື່ຜູ້ຮັບ: ${detailModalItem.customerName || "-"}\nເບີໂທ: ${detailModalItem.customerPhone || "-"}\nທີ່ຢູ່: ${detailModalItem.customerAddress || detailModalItem.destination}\nຂົນສົ່ງ: ${detailModalItem.carrier}`;
                      copyToClipboard(textToCopy);
                      toast.success("ກັອບປີ້ທີ່ຢູ່ຈັດສົ່ງສຳລັບພິມໃບປິ້ນແລ້ວ");
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    <span>ກັອບປີ້ທີ່ຢູ່ (Copy)</span>
                  </button>
                </div>

                <button
                  onClick={() => setDetailModalItem(null)}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors ml-auto"
                >
                  ປິດ (Close)
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
