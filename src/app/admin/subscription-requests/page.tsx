"use client";

import { askConfirm } from "@/components/ConfirmModal";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Search,
  Filter,
  Loader2,
  Building,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useConfirm } from "@/components/ConfirmModalProvider";

export default function SubscriptionRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewImage, setViewImage] = useState<string | null>(null);
  const { confirm } = useConfirm();

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/subscription-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        toast.error("ບໍ່ສາມາດໂຫຼດຄຳຂໍຊຳລະເງິນໄດ້");
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
      `ທ່ານຕ້ອງການ ${action === "approve" ? "ອະນຸມັດ" : "ປະຕິເສດ"} ໃບໂອນເງິນຂອງຮ້ານ "${name}" ແທ້ບໍ່?`
    );
    if (!confirmed) return;

    try {
      const body =
        action === "reject"
          ? { reason: "ແອດມິນປະຕິເສດໃບໂອນເງິນ / ສະລິບບໍ່ຖືກຕ້ອງ" }
          : {};

      const res = await fetch(`/api/admin/subscription-requests/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(
          action === "approve"
            ? `ອະນຸມັດການຕໍ່ອາຍຸຮ້ານ "${name}" ສຳເລັດແລ້ວ!`
            : `ປະຕິເສດສະລິບຂອງຮ້ານ "${name}" ແລ້ວ`
        );
        fetchRequests();
      } else {
        toast.error("ດຳເນີນການບໍ່ສຳເລັດ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesFilter = filter === "ALL" || req.status === filter;
    const matchesSearch =
      req.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.planName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.amount?.toString().includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ຄຳຂໍຊຳລະເງິນ & ກວດສອບສະລິບ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Payment Slips
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ກວດສອບຫຼັກຖານການໂອນເງິນຕໍ່ອາຍຸການໃຊ້ງານ SaaS ຈາກເຈົ້າຂອງຮ້ານຄ້າ
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
                ລໍຖ້າກວດສອບສະລິບ (Pending)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-400 mt-2">
                {pendingCount} <span className="text-sm font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ຕ້ອງກວດສອບຮູບສະລິບ ແລະ ກົດອະນຸມັດ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ອະນຸມັດແລ້ວ (Approved)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-400 mt-2">
                {approvedCount} <span className="text-sm font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ຕໍ່ອາຍຸແພັກເກັດໃຫ້ຮ້ານຄ້າຮຽບຮ້ອຍ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-red-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ປະຕິເສດ (Rejected)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-red-400 mt-2">
                {rejectedCount} <span className="text-sm font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ສະລິບບໍ່ຖືກຕ້ອງ ຫຼື ເງິນບໍ່ເຂົ້າ</p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72 md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ຮ້ານຄ້າ, ແພັກເກັດ ຫຼື ຈຳນວນເງິນ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
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
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Requests Cards Grid ── */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
          <p className="text-zinc-500 text-sm">ກຳລັງໂຫຼດລາຍການຄຳຂໍຊຳລະເງິນ...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-8 sm:p-12 md:p-20 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-20 h-20 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4">
            <DollarSign className="w-10 h-10 text-zinc-600" />
          </div>
          <p className="text-zinc-300 text-lg font-semibold">ບໍ່ພົບລາຍການຊຳລະເງິນ</p>
          <p className="text-zinc-500 text-sm mt-1">ບໍ່ມີລາຍການທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-zinc-900/90 border border-zinc-800/80 hover:border-emerald-500/40 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      req.status === "APPROVED"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : req.status === "REJECTED"
                        ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {req.status || "PENDING"}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {req.createdAt
                      ? new Date(req.createdAt).toLocaleDateString("lo-LA")
                      : "-"}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-zinc-800 flex items-center justify-center font-black text-lg text-white shrink-0">
                    {req.organization?.name ? req.organization.name[0]?.toUpperCase() : "S"}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight group-hover:text-emerald-400 transition-colors">
                      {req.organization?.name || "ຮ້ານຄ້າໃນລະບົບ"}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      ແພັກເກັດ: <span className="text-emerald-400 font-semibold">{req.planName || "PRO"}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-4 my-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase">
                      ຈຳນວນເງິນໂອນ
                    </span>
                    <div className="text-2xl font-black text-emerald-400 mt-0.5">
                      ₭{(req.amount || 0).toLocaleString()}
                    </div>
                  </div>

                  {req.proofUrl && (
                    <button
                      onClick={() => setViewImage(req.proofUrl)}
                      className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <ImageIcon className="w-4 h-4" /> ເບິ່ງສະລິບ
                    </button>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-end gap-2">
                {req.status === "PENDING" ? (
                  <>
                    <button
                      onClick={() =>
                        handleAction(
                          req.id,
                          "reject",
                          req.organization?.name || "ຮ້ານຄ້າ"
                        )
                      }
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" /> ປະຕິເສດ
                    </button>
                    <button
                      onClick={() =>
                        handleAction(
                          req.id,
                          "approve",
                          req.organization?.name || "ຮ້ານຄ້າ"
                        )
                      }
                      className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" /> ອະນຸມັດຕໍ່ອາຍຸ
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-zinc-500 font-semibold italic">
                    ກວດສອບແລ້ວ ({req.status})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── View Slip Modal ── */}
      {viewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setViewImage(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto w-full text-center relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-bold text-white text-sm">ຫຼັກຖານການໂອນເງິນ / ຮູບສະລິບ</h3>
              <button
                onClick={() => setViewImage(null)}
                className="text-zinc-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <img
              src={viewImage}
              alt="Payment Slip"
              className="max-h-[70vh] mx-auto rounded-2xl border border-zinc-800 object-contain"
            />
            <div className="mt-4">
              <a
                href={viewImage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" /> ເປີດຮູບຂະໜາດເຕັມ
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
