"use client";

import React from "react";
import {
  Printer, CheckCircle2, QrCode, Phone, User, Calendar,
  Clock, ShieldCheck, Building2, MapPin, Sparkles, Download, Check
} from "lucide-react";

export interface EnrollmentReceiptData {
  receiptNo: string;
  enrolledAt: string | Date;
  studentName: string;
  studentPhone: string;
  note?: string | null;
  className: string;
  coachName?: string | null;
  scheduleInfo?: string | null;
  price: number;
  status?: string;
  organization?: {
    name?: string | null;
    logo?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  verificationUrl?: string;
}

interface Props {
  data: EnrollmentReceiptData;
  onPrint?: () => void;
  showPrintButton?: boolean;
}

export function OfficialEnrollmentReceipt({
  data,
  onPrint,
  showPrintButton = true,
}: Props) {
  const formattedDate = React.useMemo(() => {
    try {
      const d = typeof data.enrolledAt === "string" ? new Date(data.enrolledAt) : data.enrolledAt;
      return d.toLocaleDateString("lo-LA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(data.enrolledAt || "");
    }
  }, [data.enrolledAt]);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else if (typeof window !== "undefined") {
      window.print();
    }
  };

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=4&data=${encodeURIComponent(
    data.verificationUrl || (typeof window !== "undefined" ? window.location.href : data.receiptNo)
  )}`;

  return (
    <div className="w-full">
      {/* ── Global Print Styles for Perfect Crisp A4 Printing ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 15mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .official-receipt-print-container {
            background: #ffffff !important;
            color: #000000 !important;
            border: 2px solid #000000 !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            padding: 24px !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .official-receipt-print-container * {
            color: #000000 !important;
            text-shadow: none !important;
          }
          .receipt-print-header {
            border-bottom: 2px solid #000000 !important;
          }
          .receipt-print-box {
            border: 1px solid #71717a !important;
            background: #fafafa !important;
          }
          .receipt-print-divider {
            border-color: #a1a1aa !important;
          }
          .receipt-print-badge-paid {
            border: 2px solid #059669 !important;
            color: #059669 !important;
            background: #ecfdf5 !important;
          }
          .receipt-print-barcode {
            filter: contrast(200%);
          }
        }
      `,
        }}
      />

      {/* ── Printable Receipt Card ── */}
      <div className="official-receipt-print-container bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-left shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl print:p-6 print:rounded-none">
        
        {/* Subtle Decorative Background Aura (Screen Only) */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none print:hidden" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none print:hidden" />

        {/* ── 1. Top Academy / Store Branding Header ── */}
        <div className="receipt-print-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800 relative z-10">
          <div className="flex items-center gap-3.5">
            {data.organization?.logo ? (
              <img
                src={data.organization.logo}
                alt="Logo"
                className="w-14 h-14 rounded-2xl object-cover border border-zinc-700 p-0.5 bg-zinc-900 print:border-black print:w-12 print:h-12"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-fuchsia-600/30 print:bg-black print:text-white print:border print:border-black print:w-12 print:h-12">
                <Building2 className="w-7 h-7 stroke-[1.75]" />
              </div>
            )}
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide print:text-black">
                {data.organization?.name || "ສູນກິລາ ແລະ ສະຖາບັນຝຶກອົບຮົມ"}
              </h3>
              <p className="text-xs text-zinc-400 print:text-zinc-600 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 print:text-black shrink-0" />
                <span>ລະບົບບິນລົງທະບຽນຮຽນ ແລະ ອອກໃບຢືນຢັນທາງການ</span>
              </p>
              {data.organization?.phone && (
                <p className="text-[11px] text-zinc-500 print:text-zinc-600 mt-0.5">
                  ໂທ: {data.organization.phone} {data.organization.address ? `| ${data.organization.address}` : ""}
                </p>
              )}
            </div>
          </div>

          <div className="sm:text-right flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-1">
            <div className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-black tracking-wider uppercase inline-flex items-center gap-1.5 receipt-print-badge-paid">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ຊຳລະແລ້ວ / PAID</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 print:text-zinc-800 mt-1">
              <span>ເລກທີບິນ: </span>
              <strong className="text-white print:text-black font-extrabold text-xs">
                {data.receiptNo}
              </strong>
            </div>
            <div className="text-[10px] text-zinc-500 print:text-zinc-600 font-mono">
              {formattedDate}
            </div>
          </div>
        </div>

        {/* ── 2. Official Document Title ── */}
        <div className="text-center py-1">
          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider print:text-black">
            ໃບຮັບເງິນ & ໃບຢືນຢັນການລົງທະບຽນຮຽນ
          </h2>
          <p className="text-[11px] text-zinc-400 print:text-zinc-600 font-mono tracking-wide">
            OFFICIAL ENROLLMENT RECEIPT & REGISTRATION SLIP
          </p>
        </div>

        {/* ── 3. Structured Two-Column Data: Student Info & Course Info ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Box 1: Student Information */}
          <div className="receipt-print-box bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80 receipt-print-divider">
              <User className="w-4 h-4 text-fuchsia-400 print:text-black" />
              <h4 className="text-xs font-bold text-zinc-300 print:text-black uppercase tracking-wider">
                ຂໍ້ມູນນັກຮຽນ (Student Details)
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 print:text-zinc-600">ຊື່ ແລະ ນາມສະກຸນ:</span>
                <span className="font-bold text-white print:text-black text-sm">
                  {data.studentName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 print:text-zinc-600">ເບີໂທຕິດຕໍ່:</span>
                <span className="font-mono font-bold text-zinc-200 print:text-black">
                  {data.studentPhone}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 print:text-zinc-600">ລະຫັດລົງທະບຽນ:</span>
                <span className="font-mono text-zinc-400 print:text-black text-[11px]">
                  #{data.receiptNo}
                </span>
              </div>
              {data.note && (
                <div className="flex justify-between items-start pt-1 border-t border-zinc-800/50 receipt-print-divider">
                  <span className="text-zinc-400 print:text-zinc-600 shrink-0">ໝາຍເຫດ / ສາຂາ:</span>
                  <span className="text-zinc-300 print:text-black text-right ml-2">
                    {data.note}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Box 2: Course & Schedule Information */}
          <div className="receipt-print-box bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80 receipt-print-divider">
              <Calendar className="w-4 h-4 text-cyan-400 print:text-black" />
              <h4 className="text-xs font-bold text-zinc-300 print:text-black uppercase tracking-wider">
                ລາຍລະອຽດຫຼັກສູດ (Course Details)
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 print:text-zinc-600">ຫຼັກສູດ / ຄລາສ:</span>
                <span className="font-bold text-white print:text-black text-sm">
                  {data.className}
                </span>
              </div>
              {data.coachName && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 print:text-zinc-600">ຄູຝຶກ / ໂຄດ:</span>
                  <span className="font-semibold text-zinc-200 print:text-black">
                    {data.coachName}
                  </span>
                </div>
              )}
              {data.scheduleInfo && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 print:text-zinc-600">ຕາຕະລາງເວລາຮຽນ:</span>
                  <span className="font-mono text-zinc-200 print:text-black">
                    {data.scheduleInfo}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 print:text-zinc-600">ສະຖານະການຈອງ:</span>
                <span className="font-semibold text-emerald-400 print:text-black">
                  ຢືນຢັນບ່ອນນັ່ງຮຽນແລ້ວ (Confirmed)
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ── 4. Financial Breakdown & Payment Summary ── */}
        <div className="receipt-print-box bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Left: QR Code Verification */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl border border-zinc-700 shadow-md print:border-black shrink-0">
                <img
                  src={qrSrc}
                  alt="QR Code"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-white print:text-black flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-fuchsia-400 print:text-black" />
                  <span>ສະແກນເພື່ອກວດສອບໃບບິນ</span>
                </p>
                <p className="text-[11px] text-zinc-400 print:text-zinc-600 leading-tight">
                  Scan to verify online registration validity & authenticity.
                </p>
                <p className="text-[10px] text-zinc-500 font-mono print:text-zinc-600">
                  REF: {data.receiptNo}
                </p>
              </div>
            </div>

            {/* Right: Net Total Box */}
            <div className="sm:text-right w-full sm:w-auto p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80 print:bg-white print:border-zinc-300">
              <span className="text-[11px] font-semibold text-zinc-400 print:text-zinc-600 uppercase tracking-wider block">
                ຍອດເງິນຄ່າຮຽນລວມທັງໝົດ (TOTAL AMOUNT)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight mt-0.5 print:text-black">
                ₭{Number(data.price || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-400 print:text-zinc-600 font-medium block mt-0.5">
                ຮວມຄ່າຮຽນ ແລະ ຄ່າເອກະສານແລ້ວ
              </span>
            </div>

          </div>
        </div>

        {/* ── 5. Terms, Conditions & Policy ── */}
        <div className="pt-2 border-t border-zinc-800/80 receipt-print-divider text-[10px] sm:text-[11px] text-zinc-400 print:text-zinc-700 space-y-1">
          <p className="font-semibold text-zinc-300 print:text-black">
            ຂໍ້ກຳນົດ ແລະ ຄຳແນະນຳ (Terms & Instructions):
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[10px] sm:text-[10.5px]">
            <li>ກະລຸນານຳໃບບິນນີ້ (ຫຼື ຮູບຖ່າຍໃນມືຖື) ມາສະແດງຕໍ່ເຈົ້າໜ້າທີ່ໃນມື້ເຂົ້າຮຽນຄັ້ງທຳອິດ.</li>
            <li>ກະລຸນາມາຮອດກ່ອນເວລາຮຽນປະມານ 10-15 ນາທີ ເພື່ອກະກຽມຄວາມພ້ອມ.</li>
            <li>ຫາກຕ້ອງການເລື່ອນເວລາ ຫຼື ມີຂໍ້ສົງໄສ ໂປດຕິດຕໍ່ທີມງານຕາມເບີໂທທີ່ລະບຸໄວ້.</li>
          </ul>
        </div>

        {/* ── 6. Official Signatures & Stamp Box ── */}
        <div className="pt-4 border-t border-zinc-800 receipt-print-divider grid grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-10">
            <div className="h-10 border-b border-dashed border-zinc-700 print:border-black" />
            <div>
              <p className="font-bold text-zinc-200 print:text-black">ລາຍເຊັນນັກຮຽນ / ຜູ້ປົກຄອງ</p>
              <p className="text-[10px] text-zinc-500 print:text-zinc-600">(Student / Guardian Signature)</p>
            </div>
          </div>

          <div className="space-y-10">
            <div className="h-10 border-b border-dashed border-zinc-700 print:border-black" />
            <div>
              <p className="font-bold text-zinc-200 print:text-black">ລາຍເຊັນເຈົ້າໜ້າທີ່ / ຜູ້ຮັບເງິນ</p>
              <p className="text-[10px] text-zinc-500 print:text-zinc-600">(Authorized Officer / Stamp)</p>
            </div>
          </div>
        </div>

      </div>

      {/* ── 7. Screen Action Buttons (Print / Download / Back) - Hidden in Print ── */}
      {showPrintButton && (
        <div className="flex flex-col sm:flex-row gap-3 pt-5 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-[0.99] transition-all"
          >
            <Printer className="w-4 h-4 stroke-[2]" />
            <span>ພິມໃບບິນ ຫຼື ບັນທຶກເປັນ PDF (Print Official Receipt)</span>
          </button>
        </div>
      )}
    </div>
  );
}
