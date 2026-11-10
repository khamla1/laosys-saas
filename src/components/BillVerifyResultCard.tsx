"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Receipt,
  User,
  Calendar,
  Banknote,
  X,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Package,
} from "lucide-react";

export type BillExpiryState =
  | "VALID"
  | "UPCOMING"
  | "EXPIRED"
  | "COMPLETED"
  | "CANCELLED"
  | "NOT_FOUND";

export interface BillVerifyAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "danger" | "warning" | "secondary";
}

export interface BillVerifyResultData {
  billCode: string;
  billType: string;
  expiryState: BillExpiryState;
  statusTitle: string;
  timeSummary: string;
  customerName?: string;
  customerPhone?: string | null;
  itemName?: string;
  startDateLabel?: string;
  startDateValue?: string;
  dueDateLabel?: string;
  dueDateValue?: string;
  amountLabel?: string;
  amountValue?: string;
  extraBadge?: string;
  actions?: BillVerifyAction[];
}

export function formatTimeDiffLao(targetDateInput: string | Date, refDate: Date = new Date()) {
  const target = typeof targetDateInput === "string" ? new Date(targetDateInput) : targetDateInput;
  if (isNaN(target.getTime())) {
    return {
      isExpired: false,
      totalMinutes: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      durationText: "-",
    };
  }

  const diffMs = target.getTime() - refDate.getTime();
  const isExpired = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const totalMinutes = Math.max(1, Math.floor(absMs / (1000 * 60)));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ມື້`);
  if (hours > 0) parts.push(`${hours} ຊົ່ວໂມງ`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} ນາທີ`);

  return {
    isExpired,
    totalMinutes,
    days,
    hours,
    minutes,
    durationText: parts.join(" "),
  };
}

export function formatDateTimeLaoStandard(dateInput?: string | Date | null): string {
  if (!dateInput) return "-";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

interface BillVerifyResultCardProps {
  result: BillVerifyResultData | null;
  onClose: () => void;
}

export function BillVerifyResultCard({ result, onClose }: BillVerifyResultCardProps) {
  if (!result) return null;

  const getTheme = (state: BillExpiryState) => {
    switch (state) {
      case "VALID":
        return {
          wrapper:
            "bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-zinc-900/90 border-emerald-500/60 ring-2 ring-emerald-500/20",
          iconBox: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
          badge: "bg-emerald-500 text-zinc-950 border-emerald-400",
          badgeLabel: "ຍັງບໍ່ໝົດອາຍຸ • ໃຊ້ງານໄດ້ (VALID / ACTIVE)",
          headlineText: "text-emerald-300",
          timeBox: "bg-emerald-950/70 border-emerald-500/40 text-emerald-200",
          Icon: ShieldCheck,
        };
      case "UPCOMING":
        return {
          wrapper:
            "bg-gradient-to-r from-sky-950/60 via-blue-950/40 to-zinc-900/90 border-sky-500/60 ring-2 ring-sky-500/20",
          iconBox: "bg-sky-500/20 border-sky-500/40 text-sky-400",
          badge: "bg-sky-500 text-zinc-950 border-sky-400",
          badgeLabel: "ຍັງບໍ່ໝົດອາຍຸ • ລໍຖ້າເຖິງເວລາ (UPCOMING)",
          headlineText: "text-sky-300",
          timeBox: "bg-sky-950/70 border-sky-500/40 text-sky-200",
          Icon: Clock,
        };
      case "EXPIRED":
        return {
          wrapper:
            "bg-gradient-to-r from-rose-950/70 via-red-950/50 to-zinc-900/90 border-rose-500/70 ring-2 ring-rose-500/30",
          iconBox: "bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse",
          badge: "bg-rose-600 text-white border-rose-400",
          badgeLabel: "ໝົດອາຍຸແລ້ວ / ກາຍກຳນົດ! (EXPIRED / OVERDUE)",
          headlineText: "text-rose-300",
          timeBox: "bg-rose-950/80 border-rose-500/50 text-rose-200",
          Icon: ShieldAlert,
        };
      case "COMPLETED":
        return {
          wrapper:
            "bg-gradient-to-r from-indigo-950/60 via-blue-950/40 to-zinc-900/90 border-indigo-500/50 ring-2 ring-indigo-500/20",
          iconBox: "bg-indigo-500/20 border-indigo-500/40 text-indigo-400",
          badge: "bg-indigo-500 text-white border-indigo-400",
          badgeLabel: "ສົ່ງຄືນ / ປິດບິນສຳເລັດແລ້ວ (COMPLETED / CLOSED)",
          headlineText: "text-indigo-300",
          timeBox: "bg-indigo-950/70 border-indigo-500/40 text-indigo-200",
          Icon: CheckCircle2,
        };
      case "CANCELLED":
        return {
          wrapper:
            "bg-gradient-to-r from-zinc-900 via-rose-950/30 to-zinc-900 border-zinc-700 ring-1 ring-rose-500/20",
          iconBox: "bg-zinc-800 border-zinc-700 text-rose-400",
          badge: "bg-zinc-700 text-zinc-200 border-zinc-600",
          badgeLabel: "ບິນຖືກຍົກເລີກແລ້ວ (CANCELLED)",
          headlineText: "text-zinc-300",
          timeBox: "bg-zinc-950/80 border-zinc-700 text-zinc-300",
          Icon: XCircle,
        };
      case "NOT_FOUND":
      default:
        return {
          wrapper:
            "bg-gradient-to-r from-amber-950/50 via-rose-950/30 to-zinc-900/90 border-amber-500/50",
          iconBox: "bg-amber-500/20 border-amber-500/40 text-amber-400",
          badge: "bg-amber-500 text-zinc-950 border-amber-400",
          badgeLabel: "ບໍ່ພົບຂໍ້ມູນບິນ (BILL NOT FOUND)",
          headlineText: "text-amber-300",
          timeBox: "bg-amber-950/60 border-amber-500/40 text-amber-200",
          Icon: AlertTriangle,
        };
    }
  };

  const theme = getTheme(result.expiryState);
  const StatusIcon = theme.Icon;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${theme.wrapper}`}
    >
      <div className="flex flex-col gap-3.5">
        {/* Top Row: Status Badge, Bill Code & Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg ${theme.iconBox}`}
            >
              <StatusIcon className="w-6 h-6" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-lg bg-black/50 border border-white/15 text-white">
                  {result.billCode}
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-extrabold px-3 py-0.5 rounded-full border shadow-sm ${theme.badge}`}
                >
                  {theme.badgeLabel}
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  ({result.billType})
                </span>
              </div>

              <h3 className={`text-sm sm:text-base font-extrabold ${theme.headlineText}`}>
                {result.statusTitle}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-zinc-400 hover:text-white border border-white/10 transition-colors shrink-0"
            title="ປິດກ່ອງກວດສອບບິນ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Highlighted Time / Expiry Status Bar */}
        <div
          className={`px-3.5 py-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${theme.timeBox}`}
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <Clock className="w-4 h-4 shrink-0" />
            <span>{result.timeSummary}</span>
          </div>
          {result.extraBadge && (
            <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/15 text-xs font-extrabold text-amber-300 self-start sm:self-auto">
              {result.extraBadge}
            </span>
          )}
        </div>

        {/* Metadata Details Grid */}
        {result.expiryState !== "NOT_FOUND" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
            {result.customerName && (
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/10">
                <span className="text-zinc-400 text-[10px] uppercase font-semibold flex items-center gap-1">
                  <User className="w-3 h-3" /> ລູກຄ້າ (Customer)
                </span>
                <p className="font-bold text-white truncate mt-0.5">{result.customerName}</p>
                {result.customerPhone && (
                  <p className="text-[11px] text-zinc-400 font-mono truncate">{result.customerPhone}</p>
                )}
              </div>
            )}

            {result.itemName && (
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/10">
                <span className="text-zinc-400 text-[10px] uppercase font-semibold flex items-center gap-1">
                  <Package className="w-3 h-3" /> ລາຍການ (Item / Service)
                </span>
                <p className="font-bold text-white truncate mt-0.5">{result.itemName}</p>
              </div>
            )}

            {(result.startDateValue || result.dueDateValue) && (
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/10">
                <span className="text-zinc-400 text-[10px] uppercase font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {result.dueDateLabel || "ກຳນົດໝົດອາຍຸ / ສົ່ງຄືນ"}
                </span>
                <p className="font-bold text-white font-mono mt-0.5">
                  {result.dueDateValue || "-"}
                </p>
                {result.startDateValue && (
                  <p className="text-[10px] text-zinc-400 font-mono truncate">
                    {result.startDateLabel || "ເລີ່ມ"}: {result.startDateValue}
                  </p>
                )}
              </div>
            )}

            {result.amountValue && (
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/10">
                <span className="text-zinc-400 text-[10px] uppercase font-semibold flex items-center gap-1">
                  <Banknote className="w-3 h-3" /> {result.amountLabel || "ຍອດເງິນໃນບິນ"}
                </span>
                <p className="font-black text-emerald-400 font-mono text-sm mt-0.5">
                  {result.amountValue}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Action Buttons */}
        {result.actions && result.actions.length > 0 && (
          <div className="flex items-center justify-end gap-2 flex-wrap pt-1 border-t border-white/10">
            {result.actions.map((act, idx) => {
              let btnStyle =
                "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700";
              if (act.variant === "primary") {
                btnStyle =
                  "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20";
              } else if (act.variant === "danger") {
                btnStyle =
                  "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20";
              } else if (act.variant === "warning") {
                btnStyle =
                  "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20";
              }
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={act.onClick}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${btnStyle}`}
                >
                  {act.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
