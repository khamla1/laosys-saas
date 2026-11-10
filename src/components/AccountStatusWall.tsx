"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  ShieldOff, Clock, Ban, LogOut, Copy, Check,
  MessageCircle, Phone, Mail, RefreshCw
} from "lucide-react";

type WallType = "BLOCKED" | "SUSPENDED" | "EXPIRED";

const CONFIGS = {
  BLOCKED: {
    icon: Ban,
    iconBg: "bg-red-500/10",
    iconBorder: "border-red-500/30",
    iconColor: "text-red-400",
    glowColor: "rgba(239,68,68,0.08)",
    accentBorder: "border-red-500/20",
    accentLine: "from-red-500/0 via-red-500 to-red-500/0",
    badgeBg: "bg-red-500/10 border-red-500/30 text-red-400",
    laoTitle: "ບັນຊີຖືກບລັອກ",
    engTitle: "Account Blocked",
    laoDesc:
      "ບັນຊີຂອງທ່ານໄດ້ຖືກ Admin ບລັອກ. ທ່ານໄດ້ລະເມີດເງື່ອນໄຂການໃຊ້ງານ ຫຼື ຖືກລາຍງານ. ກະລຸນາຕິດຕໍ່ Admin ເພື່ອສອບຖາມ.",
    engDesc:
      "Your account has been blocked by an administrator due to a policy violation or report. Contact admin to appeal.",
    badge: "BLOCKED",
    contactLao: "ຕິດຕໍ່ Admin ເພື່ອອຸທອນ",
    contactEng: "Contact Admin to appeal",
  },
  SUSPENDED: {
    icon: ShieldOff,
    iconBg: "bg-amber-500/10",
    iconBorder: "border-amber-500/30",
    iconColor: "text-amber-400",
    glowColor: "rgba(245,158,11,0.08)",
    accentBorder: "border-amber-500/20",
    accentLine: "from-amber-500/0 via-amber-500 to-amber-500/0",
    badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    laoTitle: "ບັນຊີຖືກລະງັບ",
    engTitle: "Account Suspended",
    laoDesc:
      "ບັນຊີຂອງທ່ານໄດ້ຖືກລະງັບຊົ່ວຄາວ. ທ່ານຈະບໍ່ສາມາດໃຊ້ງານຫຍັງໄດ້ຈົນກ່ວາ Admin ຈະຖອດການລະງັບ. ກະລຸນາຕິດຕໍ່ Admin.",
    engDesc:
      "Your account has been temporarily suspended. You cannot perform any actions until an administrator lifts the suspension.",
    badge: "SUSPENDED",
    contactLao: "ຕິດຕໍ່ Admin ເພື່ອປົດລະງັບ",
    contactEng: "Contact Admin to restore access",
  },
  EXPIRED: {
    icon: Clock,
    iconBg: "bg-violet-500/10",
    iconBorder: "border-violet-500/30",
    iconColor: "text-violet-400",
    glowColor: "rgba(139,92,246,0.08)",
    accentBorder: "border-violet-500/20",
    accentLine: "from-violet-500/0 via-violet-500 to-violet-500/0",
    badgeBg: "bg-violet-500/10 border-violet-500/30 text-violet-400",
    laoTitle: "ສັນຍາໝົດອາຍຸ",
    engTitle: "Subscription Expired",
    laoDesc:
      "ສັນຍາການໃຊ້ງານຂອງທ່ານໝົດອາຍຸແລ້ວ. ກະລຸນາຕິດຕໍ່ Admin ເພື່ອຕໍ່ອາຍຸສັນຍາ ແລະ ກ່ຽວກັບຂໍ້ສະເໜີສັນຍາໃໝ່.",
    engDesc:
      "Your subscription has expired. You cannot use the platform until your subscription is renewed by an administrator.",
    badge: "EXPIRED",
    contactLao: "ຕິດຕໍ່ Admin ເພື່ອຕໍ່ສັນຍາ",
    contactEng: "Contact Admin to renew",
  },
};

interface Props {
  type: WallType;
  userName: string;
  userEmail: string;
  expiredAt: string | null;
}

export function AccountStatusWall({ type, userName, userEmail, expiredAt }: Props) {
  const cfg = CONFIGS[type];
  const Icon = cfg.icon;
  const [copied, setCopied] = useState(false);

  const adminEmail = "admin@laosys.site";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(adminEmail).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const mailtoSubject = encodeURIComponent(
    type === "EXPIRED"
      ? `[ຕໍ່ສັນຍາ] ${userName} — Subscription Renewal Request`
      : `[${type}] ${userName} — Account Access Request`
  );
  const mailtoBody = encodeURIComponent(
    `ສະບາຍດີ Admin,\n\nຂ້ອຍ ${userName} (${userEmail}) ຕ້ອງການ ${
      type === "EXPIRED" ? "ຕໍ່ອາຍຸສັນຍາ" : "ສອບຖາມກ່ຽວກັບການ " + (type === "SUSPENDED" ? "ລະງັບ" : "ບລັອກ")
    } ບັນຊີຂອງຂ້ອຍ.\n\nUser: ${userName}\nEmail: ${userEmail}\nStatus: ${type}${
      expiredAt ? `\nExpired: ${new Date(expiredAt).toLocaleString("th-TH")}` : ""
    }\n\nກະລຸນາຊ່ວຍດ້ວຍ.\n\nຂໍຂອບໃຈ`
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 30%, ${cfg.glowColor}, transparent)`,
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-lg mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
        {/* Card */}
        <div
          className={`relative rounded-2xl border ${cfg.accentBorder} bg-zinc-950/80 backdrop-blur-xl shadow-2xl overflow-hidden`}
        >
          {/* Top accent line */}
          <div className={`h-[2px] w-full bg-gradient-to-r ${cfg.accentLine}`} />

          <div className="p-8 space-y-6">
            {/* Icon + Badge */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center border ${cfg.iconBg} ${cfg.iconBorder} shadow-xl`}
              >
                <Icon size={36} className={cfg.iconColor} />
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border ${cfg.badgeBg}`}
              >
                {cfg.badge}
              </span>
            </div>

            {/* Title */}
            <div className="text-center">
              <h1 className="text-3xl font-black text-white leading-tight">
                {cfg.laoTitle}
              </h1>
              <p className="text-zinc-500 text-sm font-semibold mt-1">{cfg.engTitle}</p>
            </div>

            {/* Description */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2">
              <p className="text-sm text-zinc-200 leading-relaxed">{cfg.laoDesc}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{cfg.engDesc}</p>
            </div>

            {/* User info summary */}
            <div className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-black text-sm shrink-0">
                {userName[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-200 truncate">{userName}</p>
                <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
              </div>
              {expiredAt && type === "EXPIRED" && (
                <div className="ml-auto text-right shrink-0">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">ໝົດ</p>
                  <p className="text-xs font-mono text-violet-400">
                    {new Date(expiredAt).toLocaleDateString("th-TH")}
                  </p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">ຕິດຕໍ່ Admin</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Contact actions */}
            <div className="space-y-3">
              {/* Email admin */}
              <a
                href={`mailto:${adminEmail}?subject=${mailtoSubject}&body=${mailtoBody}`}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border ${cfg.accentBorder} ${cfg.iconBg} hover:opacity-80 transition-all group`}
              >
                <Mail size={16} className={cfg.iconColor} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-200">{cfg.contactLao}</p>
                  <p className="text-xs text-zinc-500 truncate">{adminEmail}</p>
                </div>
                <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors">
                  {cfg.contactEng} →
                </span>
              </a>

              {/* Copy email */}
              <button
                onClick={handleCopyEmail}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 transition-all text-left"
              >
                {copied ? (
                  <Check size={16} className="text-emerald-400 shrink-0" />
                ) : (
                  <Copy size={16} className="text-zinc-500 shrink-0" />
                )}
                <span className="text-sm text-zinc-400">
                  {copied ? "ຄັດລອກແລ້ວ! (Copied!)" : "ຄັດລອກ Email Admin"}
                </span>
              </button>
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-white hover:border-zinc-700 text-sm font-medium transition-all"
              >
                <RefreshCw size={14} />
                ໂຫລດໃໝ່
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-red-400 hover:border-red-500/30 text-sm font-medium transition-all"
              >
                <LogOut size={14} />
                ອອກຈາກລະບົບ
              </button>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-[11px] text-zinc-700 mt-6">
          LAOSYS SaaS Platform • ທ່ານຍັງ login ຢູ່ — ແຕ່ຕ້ອງໄດ້ຮັບການປົດລ็ອກຈາກ Admin ກ່ອນ
        </p>
      </div>
    </div>
  );
}
