"use client";

import { askConfirm } from "@/components/ConfirmModal";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building,
  Mail,
  Phone,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { useConfirm } from "@/components/ConfirmModalProvider";

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const { confirm } = useConfirm();

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        toast.error("ບໍ່ສາມາດໂຫຼດຄຳຂໍເປີດບັນຊີໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject", name: string) => {
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການ ${action === "approve" ? "ອະນຸມັດ" : "ປະຕິເສດ"} ຄຳຂໍເປີດບັນຊີຂອງ "${name}" ແທ້ບໍ່?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/requests/${id}/${action}`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success(
          action === "approve"
            ? `ອະນຸມັດຮ້ານ "${name}" ສຳເລັດແລ້ວ`
            : `ປະຕິເສດຄຳຂໍ "${name}" ແລ້ວ`
        );
        fetchRequests();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "ດຳເນີນການບໍ່ສຳເລັດ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  const filteredRequests = requests.filter((req) => {
    const reqStatus = (req.status || "pending").toUpperCase();
    const matchesFilter = filter === "ALL" || reqStatus === filter;
    const storeName = req.storeName || req.businessName || req.name || "";
    const ownerName = req.name || req.ownerName || "";
    const email = req.email || "";
    const address = req.fullAddress || req.address || "";
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      storeName.toLowerCase().includes(q) ||
      ownerName.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      address.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  const pendingCount = requests.filter((r) => (r.status || "pending").toUpperCase() === "PENDING").length;
  const approvedCount = requests.filter((r) => (r.status || "").toUpperCase() === "APPROVED").length;
  const rejectedCount = requests.filter((r) => (r.status || "").toUpperCase() === "REJECTED").length;

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ຄຳຂໍເປີດບັນຊີຮ້ານຄ້າ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Account Requests
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ກວດສອບ ແລະ ອະນຸມັດຄຳຂໍເປີດຮ້ານຄ້າໃໝ່ຈາກຜູ້ປະກອບການທີ່ລົງທະບຽນ
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ລໍຖ້າອະນຸມັດ (Pending)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-400 mt-2">
                {pendingCount} <span className="text-sm font-normal text-zinc-500">ຄຳຂໍ</span>
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ຕ້ອງກວດສອບຂໍ້ມູນ ແລະ ກົດອະນຸມັດ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ອະນຸມັດແລ້ວ (Approved)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-400 mt-2">
                {approvedCount} <span className="text-sm font-normal text-zinc-500">ຄຳຂໍ</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ສ້າງ Tenant ແລະ ເປີດໃຊ້ງານຮຽບຮ້ອຍ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-red-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ປະຕິເສດແລ້ວ (Rejected)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-red-400 mt-2">
                {rejectedCount} <span className="text-sm font-normal text-zinc-500">ຄຳຂໍ</span>
              </h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ຄຳຂໍທີ່ບໍ່ຜ່ານເກນ ຫຼື ຂໍ້ມູນບໍ່ຄົບຖ້ວນ</p>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72 md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ຮ້ານ, ເຈົ້າຂອງຮ້ານ ຫຼື ອີເມວ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { label: "ທັງໝົດ", value: "ALL" },
            { label: "PENDING", value: "PENDING" },
            { label: "APPROVED", value: "APPROVED" },
            { label: "REJECTED", value: "REJECTED" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === item.value
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards Grid View ── */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
          <p className="text-zinc-500 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນຄຳຂໍ...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-8 sm:p-12 md:p-20 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-20 h-20 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-10 h-10 text-zinc-600" />
          </div>
          <p className="text-zinc-300 text-lg font-semibold">ບໍ່ພົບຄຳຂໍເປີດບັນຊີ</p>
          <p className="text-zinc-500 text-sm mt-1">ບໍ່ມີລາຍການທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-zinc-900/90 border border-zinc-800/80 hover:border-amber-500/40 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      (req.status || "").toUpperCase() === "APPROVED"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : (req.status || "").toUpperCase() === "REJECTED"
                        ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {(req.status || "PENDING").toUpperCase()}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {req.createdAt
                      ? new Date(req.createdAt).toLocaleDateString("lo-LA")
                      : "-"}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-zinc-800 flex items-center justify-center font-black text-lg text-white shrink-0">
                    {(req.storeName || req.businessName || req.name)?.[0]?.toUpperCase() || "B"}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight group-hover:text-amber-400 transition-colors">
                      {req.storeName || req.businessName || req.name || "ຮ້ານຄ້າໃໝ່"}
                    </h3>
                    <p className="text-xs text-zinc-400">ປະເພດ: {req.businessType || "RETAIL"}</p>
                  </div>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3.5 my-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" /> ຜູ້ສະເໜີຂໍ:
                    </span>
                    <span className="text-white font-semibold">{req.name || req.ownerName || "-"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-400" /> ອີເມວ:
                    </span>
                    <span className="text-zinc-300 font-mono">{req.email || "-"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> ເບີໂທ:
                    </span>
                    <span className="text-zinc-300 font-mono">{req.phone || "-"}</span>
                  </div>

                  {(req.fullAddress || req.address) && (
                    <div className="pt-1 border-t border-zinc-800/50 text-[11px] text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 inline mr-1" />
                      <span className="text-zinc-300 font-medium">{req.fullAddress || req.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-end gap-2">
                {(req.status || "pending").toUpperCase() === "PENDING" ? (
                  <>
                    <button
                      onClick={() => handleAction(req.id, "reject", req.storeName || req.name)}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" /> ປະຕິເສດ
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "approve", req.storeName || req.name)}
                      className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" /> ອະນຸມັດຮ້ານຄ້າ
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-zinc-500 font-semibold italic">
                    ດຳເນີນການແລ້ວ ({(req.status || "").toUpperCase()})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
