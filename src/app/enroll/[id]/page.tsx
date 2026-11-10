"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  GraduationCap, UserSquare2, CalendarDays, CreditCard,
  Users, CheckCircle2, AlertCircle, ArrowLeft, Loader2,
  Phone, User, MessageSquare, Printer, Share2, Sparkles,
  Building2, Check, Clock
} from "lucide-react";
import { toast } from "sonner";
import { OfficialEnrollmentReceipt } from "@/components/OfficialEnrollmentReceipt";

interface PublicClassInfo {
  id: string;
  name: string;
  description?: string | null;
  coachName: string;
  maxStudents: number;
  currentStudents: number;
  scheduleInfo: string;
  price: number;
  status: "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";
  organization?: {
    id: string;
    name: string;
    logo?: string | null;
    phone?: string | null;
    address?: string | null;
  };
}

export default function PublicClassEnrollPage() {
  const params = useParams();
  const classId = params?.id as string;

  const [classInfo, setClassInfo] = useState<PublicClassInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [studentName, setStudentName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success State
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentDetails, setEnrollmentDetails] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!classId) return;
    fetchClassInfo();
  }, [classId]);

  const fetchClassInfo = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/classes/${classId}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "ບໍ່ພົບຂໍ້ມູນຄລາສຮຽນ");
      } else {
        setClassInfo(data);
      }
    } catch {
      setErrorMsg("ບໍ່ສາມາດເຊື່ອມຕໍ່ລະບົບໄດ້ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentPhone.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ ແລະ ເບີໂທຕິດຕໍ່ໃຫ້ຄົບຖ້ວນ");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim(),
          studentPhone: studentPhone.trim(),
          note: note.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsEnrolled(true);
        setEnrollmentDetails({
          id: data.enrollment?.id || `ENR-${Date.now().toString().slice(-6)}`,
          receiptNo: data.enrollment?.receiptNo || `ENR-${Date.now().toString().slice(-6)}`,
          studentName: studentName.trim(),
          studentPhone: studentPhone.trim(),
          note: note.trim(),
          price: data.enrollment?.price ?? classInfo?.price ?? 0,
          status: data.enrollment?.status || "CONFIRMED",
          timestamp: new Date().toLocaleString("lo-LA"),
          enrolledAt: data.enrollment?.enrolledAt || new Date().toISOString(),
        });
        if (data.class) {
          setClassInfo(data.class);
        }
        toast.success("ລົງທະບຽນຮຽນສຳເລັດແລ້ວ!");
      } else {
        toast.error(data.error || "ການລົງທະບຽນລົ້ມເຫຼວ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການສົ່ງຂໍ້ມູນ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("ຄັດລອກລິ້ງຄ໌ສຳເລັດແລ້ວ!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-fuchsia-500 mb-3" />
        <p className="text-zinc-400 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນຄລາສຮຽນ...</p>
      </div>
    );
  }

  if (errorMsg || !classInfo) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-8 h-8 stroke-[1.75]" />
          </div>
          <h2 className="text-xl font-bold text-white">ບໍ່ພົບຂໍ້ມູນຄລາສຮຽນ</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {errorMsg || "ຄລາສຮຽນນີ້ອາດຈະຖືກລົບ ຫຼື ປ່ຽນແປງລິ້ງຄ໌ແລ້ວ ກະລຸນາຕິດຕໍ່ຜູ້ຈັດການ."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            ໂຫຼດໜ້າຄືນໃໝ່
          </button>
        </div>
      </div>
    );
  }

  const seatsLeft = Math.max(classInfo.maxStudents - classInfo.currentStudents, 0);
  const isFull = seatsLeft <= 0 || classInfo.status === "FULL";
  const isOpen = classInfo.status === "OPEN" && !isFull;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white py-8 px-4 sm:px-6 print:bg-white print:p-0 print:m-0">
      <div className="max-w-2xl mx-auto space-y-6 print:max-w-none print:m-0">

        {/* ── Organization Branding / Header (Hidden in Print) ── */}
        <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl p-4 rounded-2xl print:hidden">
          <div className="flex items-center gap-3">
            {classInfo.organization?.logo ? (
              <img
                src={classInfo.organization.logo}
                alt={classInfo.organization.name}
                className="w-10 h-10 rounded-xl object-cover border border-zinc-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400">
                <Building2 className="w-5 h-5 stroke-[1.75]" />
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">
                {classInfo.organization?.name || "ສູນກິລາ / ສະຖາບັນຝຶກອົບຮົມ"}
              </h1>
              <p className="text-[11px] text-zinc-400">ລະບົບລົງທະບຽນຄລາສຮຽນອອນລາຍ</p>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="ແບ່ງປັນລິ້ງຄ໌"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>

        {/* ── SUCCESS SCREEN: REDESIGNED OFFICIAL RECEIPT ── */}
        {isEnrolled ? (
          <div className="space-y-6">
            {/* Top Success Banner (Screen Only) */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 text-center space-y-2 print:hidden backdrop-blur-xl">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                ລົງທະບຽນຮຽນສຳເລັດຮຽບຮ້ອຍແລ້ວ!
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                ລະບົບໄດ້ອອກໃບຮັບເງິນ ແລະ ໃບຢືນຢັນບ່ອນນັ່ງຮຽນທາງການໃຫ້ທ່ານແລ້ວ ສາມາດພິມ ຫຼື ບັນທຶກເກັບໄວ້ໄດ້ທັນທີ
              </p>
            </div>

            {/* Redesigned Official Receipt Component */}
            <OfficialEnrollmentReceipt
              data={{
                receiptNo: enrollmentDetails?.receiptNo || `ENR-${classInfo.id.slice(-6).toUpperCase()}`,
                enrolledAt: enrollmentDetails?.enrolledAt || enrollmentDetails?.timestamp || new Date(),
                studentName: enrollmentDetails?.studentName || studentName,
                studentPhone: enrollmentDetails?.studentPhone || studentPhone,
                note: enrollmentDetails?.note || note,
                className: classInfo.name,
                coachName: classInfo.coachName,
                scheduleInfo: classInfo.scheduleInfo,
                price: enrollmentDetails?.price ?? classInfo.price ?? 0,
                status: "CONFIRMED",
                organization: classInfo.organization,
                verificationUrl: typeof window !== "undefined" ? window.location.href : undefined,
              }}
              onPrint={handlePrint}
            />

            {/* Extra Action (Screen Only) */}
            <div className="flex justify-center print:hidden pt-1">
              <button
                onClick={() => {
                  setIsEnrolled(false);
                  setStudentName("");
                  setStudentPhone("");
                  setNote("");
                }}
                className="px-6 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs transition-colors shadow-sm"
              >
                + ລົງທະບຽນເພີ່ມອີກຄົນ (Register Another Student)
              </button>
            </div>
          </div>
        ) : (
          /* ── MAIN REGISTRATION VIEW ── */
          <div className="space-y-6">

            {/* Class Hero Info Card */}
            <div className="bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between gap-3 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isOpen
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {isOpen ? "ເປີດຮັບສະໝັກນັກຮຽນ" : "ເຕັມແລ້ວ / ປິດຮັບ"}
                </span>

                <div className="text-right">
                  <span className="text-lg sm:text-2xl font-black text-amber-400 font-mono">
                    ₭{classInfo.price ? Number(classInfo.price).toLocaleString() : "0"}
                  </span>
                  <span className="text-[11px] text-zinc-400 block font-normal">/ ທ່ານ</span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {classInfo.name}
              </h2>

              {classInfo.description && (
                <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-800/50">
                  {classInfo.description}
                </p>
              )}

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-3 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-500/15 text-fuchsia-400 flex items-center justify-center shrink-0 border border-fuchsia-500/20">
                    <UserSquare2 className="w-4 h-4 stroke-[1.75]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-zinc-400">ຄູຝຶກ / ໂຄດ</p>
                    <p className="text-xs font-bold text-white truncate">{classInfo.coachName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                    <CalendarDays className="w-4 h-4 stroke-[1.75]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-zinc-400">ຕາຕະລາງຮຽນ</p>
                    <p className="text-xs font-bold text-white truncate">{classInfo.scheduleInfo}</p>
                  </div>
                </div>
              </div>

              {/* Remaining Seats Bar */}
              <div className="mt-4 pt-4 border-t border-zinc-800/80">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-fuchsia-400 stroke-[1.75]" />
                    <span>ບ່ອນນັ່ງວ່າງ</span>
                  </span>
                  <span className="font-mono text-xs font-bold">
                    {isOpen ? (
                      <span className="text-emerald-400">ຍັງເຫຼືອ {seatsLeft} ບ່ອນນັ່ງ</span>
                    ) : (
                      <span className="text-rose-400">ເຕັມແລ້ວ</span>
                    )}
                    <span className="text-zinc-500"> (ຮັບ {classInfo.maxStudents} ຄົນ)</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? "bg-rose-500" : "bg-gradient-to-r from-fuchsia-500 to-emerald-400"
                    }`}
                    style={{
                      width: `${Math.min((classInfo.currentStudents / classInfo.maxStudents) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Registration Form / Sold Out Notice */}
            {!isOpen ? (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-rose-500/15 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                  <AlertCircle className="w-6 h-6 stroke-[1.75]" />
                </div>
                <h3 className="text-base font-bold text-white">ຂໍອະໄພ, ຄລາສຮຽນນີ້ປິດຮັບສະໝັກແລ້ວ</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  ເນື່ອງຈາກມີນັກຮຽນລົງທະບຽນເຕັມຕາມຈຳນວນ ຫຼື ຄລາສຮຽນໄດ້ປິດການຮັບສະໝັກແລ້ວ.
                </p>
                {classInfo.organization?.phone && (
                  <p className="text-xs text-zinc-300 pt-2">
                    ຕິດຕໍ່ສອບຖາມເພີ່ມເຕີມ:{" "}
                    <a
                      href={`tel:${classInfo.organization.phone}`}
                      className="text-fuchsia-400 font-mono underline"
                    >
                      {classInfo.organization.phone}
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
                <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/80">
                  <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">
                    <User className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">ແບບຟອມລົງທະບຽນຮຽນ</h3>
                    <p className="text-xs text-zinc-400">ກະລຸນາປ້ອນຂໍ້ມູນຂອງທ່ານເພື່ອສຳຮອງບ່ອນນັ່ງ</p>
                  </div>
                </div>

                <form onSubmit={handleEnrollSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      ຊື່ ແລະ ນາມສະກຸນ (Full Name) *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 stroke-[1.75]" />
                      <input
                        type="text"
                        required
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="ຕົວຢ່າງ: ສົມສັກ ວົງສາ"
                        className="w-full pl-10 pr-3.5 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      ເບີໂທຕິດຕໍ່ (WhatsApp / Phone) *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 stroke-[1.75]" />
                      <input
                        type="tel"
                        required
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        placeholder="ຕົວຢ່າງ: 020 99887766"
                        className="w-full pl-10 pr-3.5 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-fuchsia-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      ໝາຍເຫດ ຫຼື ເປົ້າໝາຍການຝຶກ (Note - ຖ້າມີ)
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500 stroke-[1.75]" />
                      <textarea
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="ເຊັ່ນ: ບໍ່ເຄີຍມີພື້ນຖານມາກ່ອນ, ຕ້ອງການຫຼຸດນ້ຳໜັກ..."
                        className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-fuchsia-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      )}
                      <span>ຢືນຢັນການລົງທະບຽນ</span>
                    </button>
                    <p className="text-[11px] text-zinc-500 text-center mt-2.5">
                      ກົດປຸ່ມເພື່ອສຳຮອງບ່ອນນັ່ງທັນທີໂດຍບໍ່ຕ້ອງລໍຖ້າ
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
