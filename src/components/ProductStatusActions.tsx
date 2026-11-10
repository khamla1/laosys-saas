"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog";

// Multi-language translation dictionaries
const localDict = {
  en: {
    confirmTitle: "Confirm Deletion",
    confirmDesc: "Are you sure? This request will be sent to the administrator for approval.",
    reasonLabel: "Please specify a reason (optional):",
    reasonPlaceholder: "e.g. Broken stock, discontinued...",
    cancel: "Cancel",
    confirm: "Confirm Request",
    toastSuccess: "Deletion request submitted",
    toastError: "Unable to submit deletion request",
    toastStatusSuccessApproved: "Deletion approved successfully",
    toastStatusSuccessRestored: "Product restored successfully",
    approveDeleteBtn: "Approve Delete",
    restoreBtn: "Restore"
  },
  la: {
    confirmTitle: "ຢືນຢັນການສົ່ງຄຳຂໍລົບ",
    confirmDesc: "ທ່ານແນ່ໃຈແລ້ວບໍ່? ຄຳຂໍລົບນີ້ຈະຖືກສົ່ງໄປຫາຜູ້ດຳເນີນການລະບົບເພື່ອອະນຸມັດ.",
    reasonLabel: "ກະລຸນາລະບຸເຫດຜົນ (ບໍ່ບັງຄັບ):",
    reasonPlaceholder: "ເຊັ່ນ: ສິນຄ້າຊຳລຸດ, ເລີກຂາຍ...",
    cancel: "ຍົກເລີກ",
    confirm: "ສົ່ງຄຳຂໍລົບ",
    toastSuccess: "ສົ່ງຄຳຂໍລົບສຳເລັດ",
    toastError: "ບໍ່ສາມາດສົ່ງຄຳຂໍລົບໄດ້",
    toastStatusSuccessApproved: "ອະນຸມັດການລົບສຳເລັດ",
    toastStatusSuccessRestored: "ກູ້ຄືນສິນຄ້າສຳເລັດ",
    approveDeleteBtn: "ອະນຸມັດການລົບ",
    restoreBtn: "ກູ້ຄືນ"
  },
  th: {
    confirmTitle: "ยืนยันการส่งคำขอลบ",
    confirmDesc: "คุณแน่ใจหรือไม่? คำขอลบนี้จะถูกส่งไปยังผู้ดูแลระบบเพื่อพิจารณาอนุมัติ",
    reasonLabel: "กรุณาระบุเหตุผล (ไม่บังคับ):",
    reasonPlaceholder: "เช่น สินค้าชำรุด, เลิกขาย...",
    cancel: "ยกเลิก",
    confirm: "ยืนยันส่งคำขอ",
    toastSuccess: "ส่งคำขอลบเรียบร้อยแล้ว",
    toastError: "ไม่สามารถส่งคำขอลบได้",
    toastStatusSuccessApproved: "อนุมัติการลบสำเร็จ",
    toastStatusSuccessRestored: "กู้คืนสินค้าสำเร็จ",
    approveDeleteBtn: "อนุมัติการลบ",
    restoreBtn: "กู้คืน"
  }
};

export function ProductStatusActions({ productId, currentStatus, isAdmin }: { productId: string; currentStatus: string; isAdmin: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Custom delete prompt states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  
  // Localized state
  const [locale, setLocale] = useState<"en" | "la" | "th">("la");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
      if (match && ["en", "la", "th"].includes(match[1])) {
        setLocale(match[1] as "en" | "la" | "th");
      }
    }
  }, []);

  const d = localDict[locale] || localDict.la;

  const updateStatus = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(status === "DELETED" ? d.toastStatusSuccessApproved : d.toastStatusSuccessRestored);
        router.refresh();
      } else {
        const err = await res.text();
        let errorMessage = "Error updating status";
        try {
          const errData = JSON.parse(err);
          errorMessage = errData.error || errorMessage;
        } catch {
          errorMessage = err || errorMessage;
        }
        if (errorMessage === "Product is not active") {
          toast.error("This product is no longer available");
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setShowDeleteModal(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason }),
      });
      if (res.ok) {
        toast.success(d.toastSuccess);
        setDeleteReason("");
        router.refresh();
      } else {
        const err = await res.text();
        let errorMessage = d.toastError;
        try {
          const errData = JSON.parse(err);
          errorMessage = errData.error || errorMessage;
        } catch {
          errorMessage = err || errorMessage;
        }
        if (errorMessage === "Product is not active") {
          toast.error("This product is no longer available");
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-end gap-1.5 items-center">
      {isAdmin && currentStatus === "PENDING_DELETE" && (
        <>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => updateStatus("DELETED")} 
            disabled={loading}
            title="Approve Delete"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8 px-2 rounded-lg text-xs font-bold"
          >
            {d.approveDeleteBtn}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => updateStatus("ACTIVE")} 
            disabled={loading}
            title="Restore Product"
            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 h-8 px-2 rounded-lg text-xs font-bold"
          >
            {d.restoreBtn}
          </Button>
        </>
      )}
      {currentStatus !== "PENDING_DELETE" && currentStatus !== "DELETED" && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowDeleteModal(true)} 
          disabled={loading}
          title="Request Delete"
          className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 rounded-full transition-colors"
        >
          <Trash2 size={16} />
        </Button>
      )}

      {/* Premium Customized Deletion Request Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-zinc-950 border border-zinc-850 text-white rounded-2xl max-w-sm p-6 shadow-2xl overflow-hidden relative">
          
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500/60 via-rose-500 to-red-500/60" />
          
          <DialogHeader className="space-y-4 pt-1">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-inner">
              <AlertTriangle size={24} className="animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-center text-base font-extrabold tracking-tight text-white">
                {d.confirmTitle}
              </DialogTitle>
              <DialogDescription className="text-center text-xs text-zinc-400 leading-relaxed mt-1.5 px-2">
                {d.confirmDesc}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="mt-5 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block pl-1">
              {d.reasonLabel}
            </label>
            <input
              type="text"
              placeholder={d.reasonPlaceholder}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all shadow-inner"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteReason("");
              }}
              disabled={loading}
              className="flex-1 border-zinc-805 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-xl h-11 font-bold transition-all text-xs"
            >
              {d.cancel}
            </Button>
            <Button
              onClick={handleDeleteSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl h-11 font-black shadow-lg shadow-red-500/25 hover:shadow-red-550/30 transition-all text-xs border-0"
            >
              {d.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
