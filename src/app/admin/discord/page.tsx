"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Save,
  Sparkles,
  Shield,
  ShoppingBag,
  History,
  Shop,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Bot,
  Eye,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { BrandDiscord } from "@/components/icons/BrandIcons";

const PRESET_BOT1_AVATARS = [
  { name: "3D Neon Cart", url: "https://img.icons8.com/3d-fluency/375/shopping-cart.png" },
  { name: "3D Luxury Bag", url: "https://img.icons8.com/3d-fluency/375/shopping-bag.png" },
  { name: "3D Smart Card", url: "https://img.icons8.com/3d-fluency/375/bank-card-back-side.png" },
  { name: "3D Diamond VIP", url: "https://img.icons8.com/3d-fluency/375/diamond.png" },
  { name: "3D Storefront", url: "https://img.icons8.com/3d-fluency/375/shop.png" },
];

const PRESET_BOT2_AVATARS = [
  { name: "3D Cyber Shield", url: "https://img.icons8.com/3d-fluency/375/shield.png" },
  { name: "3D Hologram Lock", url: "https://img.icons8.com/3d-fluency/375/lock-2.png" },
  { name: "3D Biometric Scan", url: "https://img.icons8.com/3d-fluency/375/fingerprint-scan.png" },
  { name: "3D AI Sentinel", url: "https://img.icons8.com/3d-fluency/375/robot-2.png" },
  { name: "3D Tech Core", url: "https://img.icons8.com/3d-fluency/375/data-configuration.png" },
];

export default function AdminDiscordPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTarget, setTestingTarget] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"bot1" | "bot2">("bot1");

  // Form states
  const [enabled, setEnabled] = useState(true);
  const [webhook1, setWebhook1] = useState(
    "https://discord.com/api/webhooks/1568253705818734736/gkSA_XAkluoeMsklpVc52d-LNm3TTUu7CFo-YUCVWNe3yRODOhhktHj9xNNj01NT7jeG"
  );
  const [webhook1Name, setWebhook1Name] = useState("ຊ່ອງ 1: ອໍເດີ & ຍອດຂາຍ (Orders & Sales)");
  const [webhook2, setWebhook2] = useState(
    "https://discord.com/api/webhooks/1568253737007452332/_3M2yc19OtmzOYeWEhXLFUwAPCNoEN3dqfc6PP47EBJ2AlOo9KiS_2J8ebJP1uldajNQ"
  );
  const [webhook2Name, setWebhook2Name] = useState("ຊ່ອງ 2: ຄວາມປອດໄພ & ບັນທຶກລະບົບ (Security & Audit Logs)");

  // Bot Identities & Logos
  const [bot1Name, setBot1Name] = useState("LAOSYS Commercial Engine");
  const [bot1Avatar, setBot1Avatar] = useState("https://img.icons8.com/3d-fluency/375/shopping-cart.png");
  const [bot2Name, setBot2Name] = useState("LAOSYS Sentinel Guard");
  const [bot2Avatar, setBot2Avatar] = useState("https://img.icons8.com/3d-fluency/375/shield.png");

  // Routing
  const [routeOrders, setRouteOrders] = useState("WEBHOOK_1");
  const [routeSecurity, setRouteSecurity] = useState("WEBHOOK_2");
  const [routeAudit, setRouteAudit] = useState("WEBHOOK_2");
  const [routeRequests, setRouteRequests] = useState("BOTH");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/discord");
      const data = await res.json();
      if (res.ok) {
        if (data.enabled !== undefined) setEnabled(data.enabled);
        if (data.webhook1) setWebhook1(data.webhook1);
        if (data.webhook1Name) setWebhook1Name(data.webhook1Name);
        if (data.webhook2) setWebhook2(data.webhook2);
        if (data.webhook2Name) setWebhook2Name(data.webhook2Name);
        if (data.bot1Name) setBot1Name(data.bot1Name);
        if (data.bot1Avatar) setBot1Avatar(data.bot1Avatar);
        if (data.bot2Name) setBot2Name(data.bot2Name);
        if (data.bot2Avatar) setBot2Avatar(data.bot2Avatar);
        if (data.routeOrders) setRouteOrders(data.routeOrders);
        if (data.routeSecurity) setRouteSecurity(data.routeSecurity);
        if (data.routeAudit) setRouteAudit(data.routeAudit);
        if (data.routeRequests) setRouteRequests(data.routeRequests);
      }
    } catch {
      toast.error("ບໍ່ສາມາດໂຫຼດການຕັ້ງຄ່າ Discord ໄດ້");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          webhook1,
          webhook1Name,
          webhook2,
          webhook2Name,
          bot1Name,
          bot1Avatar,
          bot2Name,
          bot2Avatar,
          routeOrders,
          routeSecurity,
          routeAudit,
          routeRequests,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "ບັນທຶກການຕັ້ງຄ່າ Discord ສຳເລັດແລ້ວ!");
      } else {
        toast.error(data.error || "ບໍ່ສາມາດບັນທຶກໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (target: "WEBHOOK_1" | "WEBHOOK_2" | "BOTH") => {
    setTestingTarget(target);
    try {
      const res = await fetch("/api/admin/discord/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "ສົ່ງຂໍ້ຄວາມທົດສອບສຳເລັດແລ້ວ! ກວດສອບທີ່ Discord");
      } else {
        toast.error(data.error || "ການທົດສອບລົ້ມເຫຼວ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການສົ່ງຂໍ້ຄວາມທົດສອບ");
    } finally {
      setTestingTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
        <p className="text-zinc-400 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນ Discord Webhooks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-zinc-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-xl shadow-indigo-500/10">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Discord Webhooks & Bot Hub
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Clean Receipts & 3D Logos Active</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1">
                ຈັດການໂລໂກ້ Bot (3D Logos), ເສັ້ນຂັ້ນໃບບິນ, ລາຍການສິນຄ້າ, ຄວາມປອດໄພ ແລະ Audit Logs ແບບ Real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleTest("BOTH")}
              disabled={testingTarget !== null}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 whitespace-nowrap active:scale-95 disabled:opacity-50"
            >
              {testingTarget === "BOTH" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>ທົດສອບສົ່ງທັງ 2 Bots</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Global Master Toggle ── */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
              enabled
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-500"
            }`}
          >
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              ເປີດໃຊ້ງານລະບົບແຈ້ງເຕືອນ Discord (Master Enable)
            </h3>
            <p className="text-xs text-zinc-400">
              {enabled
                ? "ລະບົບກຳລັງເຮັດວຽກ — ຂໍ້ຄວາມ, ເສັ້ນຂັ້ນ ແລະ ໃບບິນສິນຄ້າຈະຖືກສົ່ງໄປຍັງ Discord ຢ່າງສວຍງາມ ແລະ ອ່ານງ່າຍ 100%"
                : "ປິດການແຈ້ງເຕືອນທັງໝົດຊົ່ວຄາວ (Pause Notifications)"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
            enabled ? "bg-emerald-600" : "bg-zinc-800"
          }`}
        >
          <div
            className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
              enabled ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── Bot Identities & 3D Logos Section ── */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" />
                <span>ຕັ້ງຄ່າໂລໂກ້ & ຊື່ Bot (Bot Identities & 3D Logos)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                ເລືອກຮູບໂລໂກ້ 3D ຫຼື ໃສ່ລິ້ງຮູບພາບຂອງທ່ານເອງ ເພື່ອໃຫ້ Bot ໃນ Discord ສະແດງຢ່າງສວຍງາມ ແລະ ໂດດເດັ່ນ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bot 1 Identity (Commercial & Sales) */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-3.5 pb-3 border-b border-zinc-800/60">
                <div className="relative">
                  <img
                    src={bot1Avatar}
                    alt="Bot 1 Avatar"
                    className="w-14 h-14 rounded-2xl object-cover bg-zinc-900 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20 p-1"
                    onError={(e) => {
                      (e.target as any).src = "https://img.icons8.com/3d-fluency/375/shopping-cart.png";
                    }}
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Bot 1: Commercial Engine</h4>
                  <p className="text-[11px] text-emerald-400">ສຳລັບຊ່ອງອໍເດີ, ຍອດຂາຍ POS, ແລະ ໃບບິນຮັບເງິນ</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  ຊື່ Bot ໃນ Discord (Bot Display Name)
                </label>
                <input
                  type="text"
                  value={bot1Name}
                  onChange={(e) => setBot1Name(e.target.value)}
                  placeholder="LAOSYS Commercial Engine"
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  ລິ້ງຮູບໂລໂກ້ Bot (Avatar Image URL)
                </label>
                <input
                  type="url"
                  value={bot1Avatar}
                  onChange={(e) => setBot1Avatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <span className="block text-[11px] text-zinc-400 mb-1.5 font-medium">
                  ເລືອກໂລໂກ້ 3D ສຳເລັດຮູບ (Quick 3D Presets):
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_BOT1_AVATARS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setBot1Avatar(preset.url)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all ${
                        bot1Avatar === preset.url
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      <img src={preset.url} alt="" className="w-4 h-4" />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bot 2 Identity (Sentinel & Security) */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4 hover:border-purple-500/40 transition-colors">
              <div className="flex items-center gap-3.5 pb-3 border-b border-zinc-800/60">
                <div className="relative">
                  <img
                    src={bot2Avatar}
                    alt="Bot 2 Avatar"
                    className="w-14 h-14 rounded-2xl object-cover bg-zinc-900 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20 p-1"
                    onError={(e) => {
                      (e.target as any).src = "https://img.icons8.com/3d-fluency/375/shield.png";
                    }}
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-500 border-2 border-zinc-950" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Bot 2: Sentinel Guard</h4>
                  <p className="text-[11px] text-purple-400">ສຳລັບຊ່ອງຄວາມປອດໄພ, Logins, ແລະ Audit Logs</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  ຊື່ Bot ໃນ Discord (Bot Display Name)
                </label>
                <input
                  type="text"
                  value={bot2Name}
                  onChange={(e) => setBot2Name(e.target.value)}
                  placeholder="LAOSYS Sentinel Guard"
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  ລິ້ງຮູບໂລໂກ້ Bot (Avatar Image URL)
                </label>
                <input
                  type="url"
                  value={bot2Avatar}
                  onChange={(e) => setBot2Avatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <span className="block text-[11px] text-zinc-400 mb-1.5 font-medium">
                  ເລືອກໂລໂກ້ 3D ສຳເລັດຮູບ (Quick 3D Presets):
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_BOT2_AVATARS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setBot2Avatar(preset.url)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all ${
                        bot2Avatar === preset.url
                          ? "bg-purple-500/20 border-purple-500 text-purple-300 shadow-md shadow-purple-500/20"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      <img src={preset.url} alt="" className="w-4 h-4" />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Webhooks Configuration Grid (2 Columns) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Webhook 1 (Business & Orders) */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Discord Webhook #1</h3>
                    <p className="text-[11px] text-zinc-400">ຊ່ອງຫຼັກ: ອໍເດີ & ຍອດຂາຍ (Orders)</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  ACTIVE
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  ຊື່ຊ່ອງທາງ / ຄຳອະທິບາຍ (Channel Label)
                </label>
                <input
                  type="text"
                  value={webhook1Name}
                  onChange={(e) => setWebhook1Name(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ຊ່ອງອໍເດີ (Orders Channel)"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Discord Webhook URL #1 <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={webhook1}
                  onChange={(e) => setWebhook1(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">ໃຊ້ສຳລັບແຈ້ງເຕືອນອໍເດີໃໝ່, ບິນ POS & ລາຍການສິນຄ້າ</span>
              <button
                type="button"
                onClick={() => handleTest("WEBHOOK_1")}
                disabled={testingTarget !== null}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-emerald-600/20 text-zinc-300 hover:text-emerald-300 border border-zinc-700 hover:border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {testingTarget === "WEBHOOK_1" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>ທົດສອບ Bot 1</span>
              </button>
            </div>
          </div>

          {/* Card 2: Webhook 2 (Security & Audit Logs) */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/40 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-500/15 border border-purple-500/30 text-purple-400 rounded-xl">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Discord Webhook #2</h3>
                    <p className="text-[11px] text-zinc-400">ຊ່ອງຄວາມປອດໄພ & ລະບົບ (Security)</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                  ACTIVE
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  ຊື່ຊ່ອງທາງ / ຄຳອະທິບາຍ (Channel Label)
                </label>
                <input
                  type="text"
                  value={webhook2Name}
                  onChange={(e) => setWebhook2Name(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ຊ່ອງຄວາມປອດໄພ (Security Channel)"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Discord Webhook URL #2 <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={webhook2}
                  onChange={(e) => setWebhook2(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">ໃຊ້ສຳລັບແຈ້ງເຕືອນ Login, Security & Audits</span>
              <button
                type="button"
                onClick={() => handleTest("WEBHOOK_2")}
                disabled={testingTarget !== null}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-purple-600/20 text-zinc-300 hover:text-purple-300 border border-zinc-700 hover:border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {testingTarget === "WEBHOOK_2" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>ທົດສອບ Bot 2</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Live Discord Chat Preview with Clean Receipt ── */}
        <div className="bg-[#313338] border border-zinc-700/60 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-700/50">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">ຕົວຢ່າງໃບບິນ ແລະ ເສັ້ນຂັ້ນໃນ Discord (Live Receipt Preview)</h3>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-[#1e1f22] rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setPreviewTab("bot1")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  previewTab === "bot1"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                ໃບບິນຮັບເງິນ (Sales Receipt)
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("bot2")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  previewTab === "bot2"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                ແຈ້ງເຕືອນຄວາມປອດໄພ (Security Alert)
              </button>
            </div>
          </div>

          {/* Discord Message Mockup */}
          {previewTab === "bot1" ? (
            <div className="flex items-start gap-4 pt-1 font-sans">
              <img
                src={bot1Avatar}
                alt="Bot 1"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5 bg-zinc-800"
                onError={(e) => {
                  (e.target as any).src = "https://img.icons8.com/3d-fluency/375/shopping-cart.png";
                }}
              />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm hover:underline cursor-pointer">
                    {bot1Name || "LAOSYS Commercial Engine"}
                  </span>
                  <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded leading-tight">
                    BOT
                  </span>
                  <span className="text-[11px] text-zinc-400">ມື້ນີ້ ເວລາ 09:30 AM</span>
                </div>

                {/* Embed Container */}
                <div className="bg-[#2B2D31] border-l-4 border-l-[#10B981] rounded-r-lg p-4 space-y-3 max-w-xl shadow-lg">
                  {/* Author */}
                  <div className="flex items-center gap-2">
                    <img src={bot1Avatar} alt="" className="w-4 h-4 rounded-full" />
                    <span className="text-xs font-bold text-zinc-300">LAOSYS POS & COMMERCIAL ENGINE</span>
                  </div>

                  {/* Title & Divider Lines */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-sm font-bold text-white">ໃບບິນຮັບເງິນ (Sales Receipt) • #ORD-9921</h4>
                      <div className="text-[11px] text-zinc-300 leading-snug space-y-1">
                        <div className="text-zinc-600 font-mono">────────────────────────────────────────</div>
                        <div><strong>ຮ້ານຄ້າ:</strong> <code className="text-emerald-300">Super Admin Store (HQ)</code></div>
                        <div><strong>ການຊຳລະ:</strong> <code className="text-emerald-400">PAID (ຊຳລະເງິນສຳເລັດແລ້ວ)</code></div>
                        <div className="text-zinc-600 font-mono">────────────────────────────────────────</div>
                      </div>
                    </div>
                    <img
                      src="https://img.icons8.com/3d-fluency/188/bank-card-back-side.png"
                      alt=""
                      className="w-12 h-12 object-contain flex-shrink-0"
                    />
                  </div>

                  {/* Customer & Payment Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-[#1e1f22] p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-400 block text-[11px] font-bold mb-1">ຂໍ້ມູນລູກຄ້າ</span>
                      <div className="text-zinc-200 text-xs">
                        • <strong>Khamla V.</strong><br />
                        • Tel: <code className="text-zinc-400">020 5511 2233</code>
                      </div>
                    </div>
                    <div className="bg-[#1e1f22] p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-400 block text-[11px] font-bold mb-1">ຊ່ອງທາງຊຳລະ</span>
                      <div className="text-emerald-300 text-xs">
                        • <strong>BCEL OnePay QR</strong><br />
                        • ຍອດ: <strong>₭ 450,000</strong>
                      </div>
                    </div>
                  </div>

                  {/* Clean Receipt Slip */}
                  <div className="space-y-1.5 bg-[#1e1f22] p-3 rounded-lg border border-zinc-800 text-xs">
                    <span className="text-zinc-400 block text-[11px] font-bold mb-1">ລາຍການສິນຄ້າໃນບິນ (Order Items):</span>
                    <div className="space-y-2 text-zinc-200">
                      <div>
                        • <strong>1. TaylorMade Stealth 2 Driver</strong>
                        <div className="text-zinc-400 text-[11px] pl-3">
                          ↳ ຈຳນວນ: <code className="text-emerald-400">1</code> × <code className="text-zinc-300">₭ 350,000</code> = <code className="text-emerald-300">₭ 350,000</code>
                        </div>
                      </div>
                      <div>
                        • <strong>2. ໝວກກ໊ອຟ Titleist Tour Cap</strong>
                        <div className="text-zinc-400 text-[11px] pl-3">
                          ↳ ຈຳນວນ: <code className="text-emerald-400">1</code> × <code className="text-zinc-300">₭ 100,000</code> = <code className="text-emerald-300">₭ 100,000</code>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-zinc-700/80 pt-2 flex items-center justify-between text-xs font-bold">
                      <span className="text-zinc-300">ຍອດລວມທັງໝົດ (TOTAL):</span>
                      <span className="text-emerald-400 text-sm font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        ₭ 450,000
                      </span>
                    </div>
                  </div>

                  {/* Separator & Footer */}
                  <div className="text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2 flex items-center justify-between">
                    <span>▸ ສາຂາ: <strong>ສຳນັກງານໃຫຍ່</strong> • ສອງສາມວິນາທີກ່ອນ</span>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <img src="https://img.icons8.com/3d-fluency/94/approval.png" alt="" className="w-3.5 h-3.5" />
                      <span>LAOSYS Enterprise POS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4 pt-1 font-sans">
              <img
                src={bot2Avatar}
                alt="Bot 2"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5 bg-zinc-800"
                onError={(e) => {
                  (e.target as any).src = "https://img.icons8.com/3d-fluency/375/shield.png";
                }}
              />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm hover:underline cursor-pointer">
                    {bot2Name || "LAOSYS Sentinel Guard"}
                  </span>
                  <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded leading-tight">
                    BOT
                  </span>
                  <span className="text-[11px] text-zinc-400">ມື້ນີ້ ເວລາ 09:31 AM</span>
                </div>

                {/* Embed Container */}
                <div className="bg-[#2B2D31] border-l-4 border-l-[#3B82F6] rounded-r-lg p-4 space-y-3 max-w-xl shadow-lg">
                  {/* Author */}
                  <div className="flex items-center gap-2">
                    <img src={bot2Avatar} alt="" className="w-4 h-4 rounded-full" />
                    <span className="text-xs font-bold text-zinc-300">LAOSYS CYBER SENTINEL • SECURITY HUB</span>
                  </div>

                  {/* Title & Divider Lines */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-sm font-bold text-white">ບັນທຶກຄວາມປອດໄພ • SUCCESSFUL_LOGIN</h4>
                      <div className="text-[11px] text-zinc-300 leading-snug space-y-1">
                        <div className="text-zinc-600 font-mono">────────────────────────────────────────</div>
                        <div><strong>ເຫດການ:</strong> <code className="text-cyan-300">SUCCESSFUL_LOGIN</code></div>
                        <div><strong>ລະດັບ:</strong> <code className="text-emerald-400">NORMAL (ປອດໄພ 100%)</code></div>
                        <div className="text-zinc-600 font-mono">────────────────────────────────────────</div>
                      </div>
                    </div>
                    <img
                      src="https://img.icons8.com/3d-fluency/188/fingerprint-scan.png"
                      alt=""
                      className="w-12 h-12 object-contain flex-shrink-0"
                    />
                  </div>

                  {/* Fields Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-[#1e1f22] p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-400 block text-[11px] font-bold mb-1">ບັນຊີຜູ້ໃຊ້ (Account)</span>
                      <div className="text-zinc-200">
                        • <strong>Super Admin</strong><br />
                        • <code className="text-zinc-400">admin@saas.la</code>
                      </div>
                    </div>
                    <div className="bg-[#1e1f22] p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-400 block text-[11px] font-bold mb-1">ສິດທິ & IP</span>
                      <div className="text-zinc-200">
                        • Role: <strong className="text-yellow-400">SUPER_ADMIN</strong><br />
                        • <code className="text-cyan-300">26.86.176.51</code>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-300 bg-[#1e1f22] p-2.5 rounded-lg border border-zinc-800 font-mono">
                    ເຂົ້າສູ່ລະບົບຈັດການ Super Admin Dashboard ສຳເລັດຜ່ານ Session ທີ່ຖືກຕ້ອງ (Authorized Access)
                  </div>

                  {/* Footer */}
                  <div className="text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2 flex items-center justify-between">
                    <span>▸ ບັນທຶກເມື່ອ: <strong>ສອງສາມວິນາທີກ່ອນ</strong></span>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <img src="https://img.icons8.com/3d-fluency/94/lock-2.png" alt="" className="w-3.5 h-3.5" />
                      <span>LAOSYS Sentinel Security</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Event Routing & Automation Rules ── */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>ການກຳນົດເສັ້ນທາງແຈ້ງເຕືອນ (Event Routing & Rules)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                ເລືອກວ່າເຫດການໃດ ຈະໃຫ້ສົ່ງໄປຍັງ Webhook 1, Webhook 2 ຫຼື ສົ່ງໄປພ້ອມກັນທັງສອງຊ່ອງ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rule 1: Orders & Sales */}
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">ອໍເດີ & ການຂາຍ (Orders & Sales)</span>
                </div>
                <p className="text-[11px] text-zinc-400 mb-3">
                  ອໍເດີໃໝ່, ຊຳລະເງິນສຳເລັດ, ຍອດຂາຍ POS, ແລະ ການສັ່ງຊື້ໜ້າຮ້ານອອນລາຍທັງໝົດ
                </p>
              </div>
              <select
                value={routeOrders}
                onChange={(e) => setRouteOrders(e.target.value)}
                className="w-full py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="WEBHOOK_1">Webhook #1 (Bot: Commercial)</option>
                <option value="WEBHOOK_2">Webhook #2 (Bot: Sentinel)</option>
                <option value="BOTH">ສົ່ງໄປທັງສອງຊ່ອງ (Both)</option>
                <option value="OFF">ປິດການແຈ້ງເຕືອນ (Off)</option>
              </select>
            </div>

            {/* Rule 2: Security & Logins */}
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">ຄວາມປອດໄພ & Login (Security & Auth)</span>
                </div>
                <p className="text-[11px] text-zinc-400 mb-3">
                  ເຂົ້າສູ່ລະບົບ (Login), ລະຫັດຜິດ (Failed Login), ລັອກບັນຊີ (Account Lockout), Admin Login
                </p>
              </div>
              <select
                value={routeSecurity}
                onChange={(e) => setRouteSecurity(e.target.value)}
                className="w-full py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-purple-300 font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value="WEBHOOK_2">Webhook #2 (Bot: Sentinel - ແນະນຳ)</option>
                <option value="WEBHOOK_1">Webhook #1 (Bot: Commercial)</option>
                <option value="BOTH">ສົ່ງໄປທັງສອງຊ່ອງ (Both)</option>
                <option value="OFF">ປິດການແຈ້ງເຕືອນ (Off)</option>
              </select>
            </div>

            {/* Rule 3: System Audits & Deletions */}
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <History className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">ບັນທຶກລະບົບ (Audit Logs & Modifications)</span>
                </div>
                <p className="text-[11px] text-zinc-400 mb-3">
                  ແກ້ໄຂສິນຄ້າ, ປັບສະຕັອກ, ການລຶບຂໍ້ມູນ, ສ້າງໂປຣໂມຊັ່ນ, ຈັດການສິດທິພະນັກງານ
                </p>
              </div>
              <select
                value={routeAudit}
                onChange={(e) => setRouteAudit(e.target.value)}
                className="w-full py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="WEBHOOK_2">Webhook #2 (Bot: Sentinel - ແນະນຳ)</option>
                <option value="WEBHOOK_1">Webhook #1 (Bot: Commercial)</option>
                <option value="BOTH">ສົ່ງໄປທັງສອງຊ່ອງ (Both)</option>
                <option value="OFF">ປິດການແຈ້ງເຕືອນ (Off)</option>
              </select>
            </div>

            {/* Rule 4: Store & Package Requests */}
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">ຄຳຮ້ອງຂໍເປີດຮ້ານ & ແພັກເກດ (Store Requests)</span>
                </div>
                <p className="text-[11px] text-zinc-400 mb-3">
                  ຮ້ານຄ້າໃໝ່ສະໝັກເຂົ້າມາ, ຂໍຕໍ່ອາຍຸ Package, ຂໍອັບເກຣດແພັກເກດການໃຊ້ງານ
                </p>
              </div>
              <select
                value={routeRequests}
                onChange={(e) => setRouteRequests(e.target.value)}
                className="w-full py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-blue-300 font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="BOTH">ສົ່ງໄປທັງສອງຊ່ອງ (Both - ແນະນຳ)</option>
                <option value="WEBHOOK_1">Webhook #1 (Bot: Commercial)</option>
                <option value="WEBHOOK_2">Webhook #2 (Bot: Sentinel)</option>
                <option value="OFF">ປິດການແຈ້ງເຕືອນ (Off)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Save Settings Button ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-indigo-500/25 flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>ບັນທຶກການຕັ້ງຄ່າ Discord ທັງໝົດ</span>
          </button>
        </div>
      </form>
    </div>
  );
}
