"use client";

import { askConfirm } from "@/components/ConfirmModal";

import { useState } from "react";
import { Search, Plus, CheckCircle, Trash2, Printer, Ticket, Camera } from "lucide-react";
import { useConfirm } from "@/components/ConfirmModalProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CameraScannerModal } from "@/components/CameraScannerModal";
import {
  BillVerifyResultCard,
  BillVerifyResultData,
  formatTimeDiffLao,
  formatDateTimeLaoStandard,
} from "@/components/BillVerifyResultCard";

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
};

export function InvoicesClient({ initialInvoices }: { initialInvoices: Invoice[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [inspectedInvoiceResult, setInspectedInvoiceResult] = useState<BillVerifyResultData | null>(null);
  const { confirm } = useConfirm();
  
  const filtered = initialInvoices.filter(i => 
    i.customerName.toLowerCase().includes(search.toLowerCase()) || 
    i.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  const buildInvoiceInspectionResult = (inv: Invoice): BillVerifyResultData => {
    const now = new Date();
    const dueDt = inv.dueDate ? new Date(inv.dueDate) : null;

    if (inv.status === "PAID") {
      return {
        code: inv.invoiceNumber,
        typeLabel: "ໃບແຈ້ງໜີ້ (Invoice)",
        status: "COMPLETED",
        statusTitle: "ໃບແຈ້ງໜີ້ນີ້ຊຳລະເງິນຄົບຖ້ວນແລ້ວ (PAID)",
        expiryMessage: `ໃບແຈ້ງໜີ້ເລກທີ ${inv.invoiceNumber} ຂອງລູກຄ້າ "${inv.customerName}" ຊຳລະເງິນສຳເລັດແລ້ວ.`,
        customerName: inv.customerName,
        startDateFormatted: formatDateTimeLaoStandard(inv.createdAt),
        endDateFormatted: dueDt ? formatDateTimeLaoStandard(dueDt) : "ບໍ່ລະບຸ",
        amountFormatted: `₭${inv.amount.toLocaleString()}`,
        onViewReceipt: () => window.print(),
      };
    }

    if (dueDt) {
      const diff = formatTimeDiffLao(dueDt, now);
      if (diff.isPast || inv.status === "OVERDUE") {
        return {
          code: inv.invoiceNumber,
          typeLabel: "ໃບແຈ້ງໜີ້ (Invoice)",
          status: "EXPIRED",
          statusTitle: "ໃບແຈ້ງໜີ້ນີ້ໝົດອາຍຸ / ກາຍກຳນົດຊຳລະເງິນແລ້ວ!",
          expiryMessage: `ໃບແຈ້ງໜີ້ ${inv.invoiceNumber} ກາຍກຳນົດຊຳລະມາແລ້ວ ${diff.text} (ຄົບກຳນົດ ${formatDateTimeLaoStandard(dueDt)}).`,
          customerName: inv.customerName,
          startDateFormatted: formatDateTimeLaoStandard(inv.createdAt),
          endDateFormatted: formatDateTimeLaoStandard(dueDt),
          amountFormatted: `₭${inv.amount.toLocaleString()}`,
          extraBadgeText: `ກາຍກຳນົດ ${diff.text}`,
          onPrimaryAction: () => handleMarkAsPaid(inv.id, inv.invoiceNumber),
          primaryActionLabel: "ໝາຍວ່າຊຳລະແລ້ວ (Mark as Paid)",
          onViewReceipt: () => window.print(),
        };
      }

      return {
        code: inv.invoiceNumber,
        typeLabel: "ໃບແຈ້ງໜີ້ (Invoice)",
        status: "VALID",
        statusTitle: "ຍັງບໍ່ໝົດອາຍຸ • ຢູ່ໃນກຳນົດຊຳລະເງິນ",
        expiryMessage: `ຍັງເຫຼືອເວລາຊຳລະເງິນອີກ ${diff.text} (ກຳນົດຊຳລະ ${formatDateTimeLaoStandard(dueDt)}).`,
        customerName: inv.customerName,
        startDateFormatted: formatDateTimeLaoStandard(inv.createdAt),
        endDateFormatted: formatDateTimeLaoStandard(dueDt),
        amountFormatted: `₭${inv.amount.toLocaleString()}`,
        extraBadgeText: `ເຫຼືອເວລາ ${diff.text}`,
        onPrimaryAction: () => handleMarkAsPaid(inv.id, inv.invoiceNumber),
        primaryActionLabel: "ໝາຍວ່າຊຳລະແລ້ວ (Mark as Paid)",
        onViewReceipt: () => window.print(),
      };
    }

    return {
      code: inv.invoiceNumber,
      typeLabel: "ໃບແຈ້ງໜີ້ (Invoice)",
      status: "VALID",
      statusTitle: "ຍັງບໍ່ໝົດອາຍຸ • ລໍຖ້າຊຳລະເງິນ",
      expiryMessage: `ໃບແຈ້ງໜີ້ ${inv.invoiceNumber} ຍັງຢູ່ໃນສະຖານະລໍຖ້າຊຳລະເງິນ.`,
      customerName: inv.customerName,
      startDateFormatted: formatDateTimeLaoStandard(inv.createdAt),
      amountFormatted: `₭${inv.amount.toLocaleString()}`,
      onPrimaryAction: () => handleMarkAsPaid(inv.id, inv.invoiceNumber),
      primaryActionLabel: "ໝາຍວ່າຊຳລະແລ້ວ (Mark as Paid)",
      onViewReceipt: () => window.print(),
    };
  };

  const handleInspectInvoiceByQuery = (rawQuery: string) => {
    const raw = rawQuery.trim();
    if (!raw) return;
    setSearch(raw);
    const q = raw.toLowerCase().replace(/^#/, "");
    const match = initialInvoices.find(
      (i) =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q)
    );
    if (match) {
      const result = buildInvoiceInspectionResult(match);
      setInspectedInvoiceResult(result);
      if (result.status === "EXPIRED") {
        toast.error(`${result.statusTitle} (${result.code})`);
      } else {
        toast.success(`${result.statusTitle} (${result.code})`);
      }
    } else {
      setInspectedInvoiceResult({
        code: raw.toUpperCase(),
        typeLabel: "ໃບແຈ້ງໜີ້ (Invoice)",
        status: "NOT_FOUND",
        statusTitle: "ບໍ່ພົບເລກທີໃບແຈ້ງໜີ້ນີ້ໃນລະບົບ",
        expiryMessage: `ບໍ່ພົບໃບແຈ້ງໜີ້ທີ່ກົງກັບລະຫັດ "${raw}" — ກະລຸນາກວດສອບເລກທີ INV-... ອີກຄັ້ງ.`,
      });
      toast.error(`ບໍ່ພົບໃບແຈ້ງໜີ້: "${raw}"`);
    }
  };

  const handleMarkAsPaid = async (id: string, invoiceNumber: string) => {
    if (!(await askConfirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການປ່ຽນສະຖານະ ${invoiceNumber} ເປັນ ຈ່າຍແລ້ວ (PAID)?\nການກະທຳນີ້ຈະລົງບັນຊີເດບິດ-ເຄຣດິດ ອັດຕະໂນມັດ.`))) return;

    try {
      const res = await fetch(`/api/accounting/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      
      toast.success("ປ່ຽນສະຖານະສຳເລັດ ແລະ ລົງບັນຊີອັດຕະໂນມັດແລ້ວ!");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "ເກີດຂໍ້ຜິດພາດ");
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບໃບແຈ້ງໜີ້ນີ້? (Are you sure?)", { variant: "destructive" }))) return;
    try {
      const res = await fetch(`/api/accounting/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      
      toast.success("ລຶບສຳເລັດແລ້ວ");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "ເກີດຂໍ້ຜິດພາດ");
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case "PAID": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "OVERDUE": return "text-red-400 bg-red-500/10 border-red-500/30";
      default: return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!e.target.value.trim()) setInspectedInvoiceResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim()) {
                  e.preventDefault();
                  handleInspectInvoiceByQuery(search);
                }
              }}
              placeholder="ພິມເລກທີໃບແຈ້ງໜີ້ INV-... ຫຼື ຊື່ລູກຄ້າ..."
              className="pl-9 bg-zinc-950 border-zinc-800 focus:border-blue-500"
            />
          </div>
          {search.trim() && (
            <Button
              type="button"
              onClick={() => handleInspectInvoiceByQuery(search)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0"
            >
              ກວດສອບບິນ
            </Button>
          )}
          <Button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white gap-1.5 shrink-0"
          >
            <Camera size={16} />
            <span className="hidden sm:inline">ກ້ອງສະແກນ</span>
          </Button>
        </div>
        <Link href="/dashboard/accounting/invoices/new">
          <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 w-full sm:w-auto">
            <Plus size={16} />
            ສ້າງໃບແຈ້ງໜີ້ (Create Invoice)
          </Button>
        </Link>
      </div>

      {(inspectedInvoiceResult || (search.trim().length >= 3 && filtered.length === 1)) && (
        <BillVerifyResultCard
          data={inspectedInvoiceResult || buildInvoiceInspectionResult(filtered[0])}
          onClose={() => {
            setInspectedInvoiceResult(null);
            setSearch("");
          }}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/50 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">ເລກທີ (INV No.)</th>
              <th className="px-4 py-3">ລູກຄ້າ (Customer)</th>
              <th className="px-4 py-3 text-right">ມູນຄ່າ (Amount)</th>
              <th className="px-4 py-3 text-center">ສະຖານະ (Status)</th>
              <th className="px-4 py-3 text-right">ກຳນົດຊຳລະ (Due Date)</th>
              <th className="px-4 py-3 text-right rounded-tr-lg">ຈັດການ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  <Ticket className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                  ຍັງບໍ່ມີໃບແຈ້ງໜີ້
                </td>
              </tr>
            ) : (
              filtered.map(inv => (
                <tr key={inv.id} className="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                  <td className="px-4 py-4 text-zinc-300">{inv.customerName}</td>
                  <td className="px-4 py-4 text-right font-bold text-emerald-400 font-mono">
                    ₭{inv.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase border ${getStatusStyle(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-zinc-400">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("th-TH") : "-"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => window.print()}>
                        <Printer size={14} />
                      </Button>
                      
                      {inv.status !== "PAID" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleMarkAsPaid(inv.id, inv.invoiceNumber)} 
                          className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                          title="ໝາຍວ່າຈ່າຍແລ້ວ (Mark as Paid)"
                        >
                          <CheckCircle size={14} />
                        </Button>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(inv.id)} 
                        disabled={inv.status === "PAID"}
                        className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={(code) => {
          handleInspectInvoiceByQuery(code);
          setIsCameraScannerOpen(false);
        }}
        title="ສະແກນກວດສອບໃບແຈ້ງໜີ້ (Scan Invoice)"
        subtitle="ສ່ອງກ້ອງໃສ່ບາໂຄດ ຫຼື QR Code ເລກທີໃບແຈ້ງໜີ້ INV-... ເພື່ອກວດສອບວັນຄົບກຳນົດ"
        placeholder="ຍິງເຄື່ອງສະແກນ ຫຼື ພິມເລກທີ INV-..."
      />
    </div>
  );
}
