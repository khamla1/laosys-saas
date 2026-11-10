"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Search,
  Filter,
  AlertCircle,
  Clock,
  User,
  Store,
  FileText,
  Activity,
  Loader2,
  XCircle,
  Eye,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Key,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  LayoutList,
  LayoutGrid,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { ExcelExportButton } from "@/components/ExcelExportButton";
import { exportToExcel } from "@/lib/excel";
import { toast } from "sonner";
import { PaginationControls } from "@/components/PaginationControls";

interface LogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: {
    id?: string;
    name: string;
    email: string;
    role?: string;
  };
  organization?: {
    id?: string;
    name: string;
    slug?: string;
  };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<{
    total: number;
    updates: number;
    deletions: number;
    logins?: number;
    security?: number;
    orgs: string[];
  }>({
    total: 0,
    updates: 0,
    deletions: 0,
    logins: 0,
    security: 0,
    orgs: [],
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(currentPage, itemsPerPage, search, filterAction, filterOrg);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, itemsPerPage, search, filterAction, filterOrg]);

  const fetchLogs = async (page: number, limit: number, q: string, act: string, org: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        stats: "true",
      });
      if (q.trim()) params.set("search", q.trim());
      if (act !== "ALL") params.set("action", act);
      if (org !== "ALL") params.set("organizationName", org);

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          setLogs(json.data);
          setTotalItems(json.total ?? json.data.length);
          if (json.stats) {
            setStats(json.stats);
          }
        } else if (Array.isArray(json)) {
          setLogs(json);
          setTotalItems(json.length);
        }
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດໂຫຼດປະຫວັດລະບົບໄດ້");
    } finally {
      setLoading(false);
    }
  };

  const uniqueOrgs =
    stats.orgs.length > 0
      ? stats.orgs
      : Array.from(
          new Set(
            logs
              .map((l) => l.organization?.name)
              .filter((n): n is string => Boolean(n))
          )
        );

  const filteredLogs = logs;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getActionInfo = (act: string) => {
    const a = (act || "").toUpperCase();

    if (a === "SUCCESSFUL_LOGIN") {
      return {
        label: "ເຂົ້າສູ່ລະບົບ",
        subLabel: "SUCCESSFUL_LOGIN",
        color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        badgeBg: "bg-emerald-500/10 text-emerald-400",
        icon: ShieldCheck,
      };
    }
    if (a === "FAILED_LOGIN") {
      return {
        label: "ລະຫັດຜິດ",
        subLabel: "FAILED_LOGIN",
        color: "bg-rose-500/15 text-rose-400 border-rose-500/30",
        badgeBg: "bg-rose-500/10 text-rose-400",
        icon: ShieldAlert,
      };
    }
    if (a === "ACCOUNT_LOCKED") {
      return {
        label: "ລັອກບັນຊີ",
        subLabel: "ACCOUNT_LOCKED",
        color: "bg-red-600/20 text-red-300 border-red-500/40",
        badgeBg: "bg-red-500/10 text-red-400",
        icon: Lock,
      };
    }
    if (a === "LOGOUT") {
      return {
        label: "ອອກຈາກລະບົບ",
        subLabel: "LOGOUT",
        color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
        badgeBg: "bg-zinc-800 text-zinc-400",
        icon: LogOut,
      };
    }
    if (a === "ADMIN_IMPERSONATION_LOGIN") {
      return {
        label: "ເຂົ້າແທນ (Token)",
        subLabel: "IMPERSONATION",
        color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        badgeBg: "bg-purple-500/10 text-purple-400",
        icon: Key,
      };
    }
    if (a.includes("DELETE") || a.includes("CANCEL") || a.includes("REJECT") || a.includes("FAIL")) {
      return {
        label: "ລຶບ / ຍົກເລີກ",
        subLabel: act,
        color: "bg-red-500/15 text-red-400 border-red-500/30",
        badgeBg: "bg-red-500/10 text-red-400",
        icon: AlertCircle,
      };
    }
    if (a.includes("UPDATE") || a.includes("MODIFY") || a.includes("ADJUST") || a.includes("WARN")) {
      return {
        label: "ແກ້ໄຂຂໍ້ມູນ",
        subLabel: act,
        color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        badgeBg: "bg-amber-500/10 text-amber-400",
        icon: FileText,
      };
    }
    if (a.includes("CREATE") || a.includes("ADD") || a.includes("PAID") || a.includes("SUCCESS")) {
      return {
        label: "ສ້າງໃໝ່ / ສຳເລັດ",
        subLabel: act,
        color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        badgeBg: "bg-cyan-500/10 text-cyan-400",
        icon: CheckCircle2,
      };
    }

    return {
      label: "ກິດຈະກຳລະບົບ",
      subLabel: act || "INFO",
      color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      badgeBg: "bg-blue-500/10 text-blue-400",
      icon: Activity,
    };
  };

  const getDeviceIcon = (device?: string) => {
    const d = (device || "").toLowerCase();
    if (d.includes("mobile") || d.includes("phone")) return <Smartphone className="w-3.5 h-3.5 text-blue-400" />;
    if (d.includes("tablet") || d.includes("ipad")) return <Tablet className="w-3.5 h-3.5 text-purple-400" />;
    return <Laptop className="w-3.5 h-3.5 text-cyan-400" />;
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diffSec < 60) return "ເມື່ອກີ້ນີ້";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} ນາທີກ່ອນ`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ຊົ່ວໂມງກ່ອນ`;
      return `${Math.floor(diffSec / 86400)} ມື້ກ່ອນ`;
    } catch {
      return "";
    }
  };

  const copyToClipboard = (text: string, type: "ip" | "json") => {
    navigator.clipboard.writeText(text);
    if (type === "ip") {
      setCopiedIp(text);
      setTimeout(() => setCopiedIp(null), 2000);
      toast.success(`ຄັດລອກ IP: ${text} ແລ້ວ`);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
      toast.success("ຄັດລອກ JSON ລາຍລະອຽດແລ້ວ");
    }
  };

  const handleExportExcel = () => {
    exportToExcel({
      filename: "Admin_System_Logs",
      sheetName: "ປະຫວັດລະບົບ",
      title: "ລາຍງານປະຫວັດລະບົບ ແລະ ຄວາມປອດໄພ (ADMIN SYSTEM AUDIT LOGS)",
      subtitle: `ລວມທັງໝົດ ${logs.length} ລາຍການ | ດາວໂຫຼດວັນທີ ${new Date().toLocaleDateString("lo-LA")}`,
      headers: [
        "ລຳດັບ",
        "ວັນທີ & ເວລາ",
        "ປະເພດເຫດການ",
        "ລາຍລະອຽດ",
        "ຜູ້ດຳເນີນການ",
        "ບົດບາດ (Role)",
        "ຮ້ານຄ້າ (Store)",
        "IP Address",
        "ອຸປະກອນ (Device)",
        "ລະບົບປະຕິບັດການ (OS)",
        "ບຣາວເຊີ (Browser)",
      ],
      data: logs.map((item: any, idx: number) => {
        const meta = item.metadata || {};
        return [
          idx + 1,
          item.createdAt ? new Date(item.createdAt).toLocaleString("lo-LA") : "-",
          item.action || "-",
          item.details || "-",
          item.user?.name || item.user?.email || "System",
          item.user?.role || meta.userRole || "-",
          item.organization?.name || meta.storeName || "ທົ່ວລະບົບ",
          item.ipAddress || meta.ipAddress || "-",
          meta.device || "Desktop",
          meta.os || "-",
          meta.browser || "-",
        ];
      }),
      summaryRow: [
        "ລວມທັງໝົດ / TOTAL",
        `${logs.length} ລາຍການ`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ປະຫວັດລະບົບ & ການກວດສອບຄວາມປອດໄພ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                Audit Logs
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-xs sm:text-sm">
              ບັນທຶກທຸກການເຄື່ອນໄຫວໃນລະບົບ SaaS, ການແກ້ໄຂຂໍ້ມູນ, ການເຂົ້າສູ່ລະບົບລະອຽດ (IP, Device, User)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => fetchLogs(currentPage, itemsPerPage, search, filterAction, filterOrg)}
            disabled={loading}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/80 flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="ໂຫຼດຂໍ້ມູນໃໝ່"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span className="hidden sm:inline">ຣີເຟຣຊ</span>
          </button>
          <ExcelExportButton onClick={handleExportExcel} />
        </div>
      </div>

      {/* ── Summary Stats (4 Metrics) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ເຫດການທັງໝົດ (Total Events)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1 sm:mt-2 font-mono">
                {(stats.total || totalItems).toLocaleString()} <span className="text-xs font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 sm:mt-3">ບັນທຶກກິດຈະກຳທັງໝົດໃນລະບົບ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ການເຂົ້າສູ່ລະບົບ (Logins)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-400 mt-1 sm:mt-2 font-mono">
                {(stats.logins || 0).toLocaleString()} <span className="text-xs font-normal text-zinc-500">ຄັ້ງ</span>
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 sm:mt-3">ການເຂົ້າ ແລະ ອອກຈາກລະບົບ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ການແກ້ໄຂຂໍ້ມູນ (Updates)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-400 mt-1 sm:mt-2 font-mono">
                {stats.updates.toLocaleString()} <span className="text-xs font-normal text-zinc-500">ຄັ້ງ</span>
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 sm:mt-3">ແກ້ໄຂຂໍ້ມູນ, ລາຄາ, ສະຕັອກ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden group hover:border-rose-500/40 transition-all duration-300 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ຄວາມປອດໄພ/ຜິດພາດ (Security)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-rose-400 mt-1 sm:mt-2 font-mono">
                {(stats.security || stats.deletions || 0).toLocaleString()} <span className="text-xs font-normal text-zinc-500">ຄັ້ງ</span>
              </h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 sm:mt-3">ລະຫັດຜິດ, ລັອກບັນຊີ, ລຶບຂໍ້ມູນ</p>
        </div>
      </div>

      {/* ── Toolbar & Filter Controls ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="ຄົ້ນຫາຊື່ຜູ້ໃຊ້, ອີເມວ, IP, ຮ້ານຄ້າ, ຫຼື ກິດຈະກຳ..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-zinc-500"
              />
            </div>

            {/* Store Filter Dropdown */}
            <div className="relative w-full sm:w-64">
              <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <select
                value={filterOrg}
                onChange={(e) => {
                  setFilterOrg(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-8 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="ALL">ທຸກຮ້ານຄ້າ (All Stores)</option>
                <option value="ທົ່ວລະບົບ">ທົ່ວລະບົບ (System-wide)</option>
                {uniqueOrgs.map((orgName) => (
                  <option key={orgName} value={orgName}>
                    {orgName}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* View Mode Switcher (Table vs Grid) */}
          <div className="flex items-center gap-1.5 self-end lg:self-center bg-zinc-950/80 border border-zinc-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="ສະແດງແບບຕາຕະລາງແຖວ (Table List)"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>ຕາຕະລາງ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="ສະແດງແບບກາດ (Cards Grid)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>ກາດ</span>
            </button>
          </div>
        </div>

        {/* Filter Action Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar pt-2 border-t border-zinc-800/60">
          {[
            { label: "ທັງໝົດ (All)", value: "ALL", icon: Activity },
            { label: "ເຂົ້າສູ່ລະບົບ (Logins)", value: "LOGIN", icon: LogIn },
            { label: "ສ້າງໃໝ່ (Create)", value: "CREATE", icon: CheckCircle2 },
            { label: "ແກ້ໄຂ (Update)", value: "UPDATE", icon: FileText },
            { label: "ລຶບ (Delete)", value: "DELETE", icon: AlertCircle },
            { label: "ຄວາມປອດໄພ (Security)", value: "SECURITY", icon: ShieldAlert },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => {
                setFilterAction(item.value);
                setCurrentPage(1);
              }}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterAction === item.value
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content Area (Table or Grid) ── */}
      {loading ? (
        <div className="p-16 text-center bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500 mb-2" />
          <p className="text-zinc-400 text-sm font-medium">ກຳລັງໂຫຼດປະຫວັດລະບົບ...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 sm:p-20 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-20 h-20 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-10 h-10 text-zinc-600" />
          </div>
          <p className="text-zinc-200 text-lg font-bold">ບໍ່ພົບປະຫວັດລະບົບ</p>
          <p className="text-zinc-500 text-sm mt-1">ບໍ່ມີລາຍການທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາຂອງທ່ານ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ══════════════ TABLE LIST VIEW (Default) ══════════════ */}
          {viewMode === "table" ? (
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800/80 bg-zinc-950/70 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 whitespace-nowrap">ວັນທີ & ເວລາ</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">ປະເພດເຫດການ</th>
                      <th className="py-3.5 px-4">ລາຍລະອຽດກິດຈະກຳ</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">ຜູ້ດຳເນີນການ</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">ຮ້ານຄ້າ / ຂອບເຂດ</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">ອຸປະກອນ & IP</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">ຈັດການ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                    {filteredLogs.map((log) => {
                      const actionInfo = getActionInfo(log.action);
                      const IconComp = actionInfo.icon;
                      const meta = log.metadata || {};
                      const ip = log.ipAddress || meta.ipAddress || null;
                      const device = meta.device || "Desktop";
                      const os = meta.os || null;
                      const browser = meta.browser || null;
                      const storeName = log.organization?.name || meta.storeName || "ທົ່ວລະບົບ";

                      return (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                        >
                          {/* 1. Date & Time */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-mono text-zinc-200 font-semibold">
                                {log.createdAt
                                  ? new Date(log.createdAt).toLocaleTimeString("lo-LA", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                      hour12: false,
                                    })
                                  : "-"}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                                <span>{log.createdAt ? new Date(log.createdAt).toLocaleDateString("lo-LA") : "-"}</span>
                                <span>•</span>
                                <span className="text-cyan-400/80 font-medium">{formatRelativeTime(log.createdAt)}</span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Action Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex flex-col items-start gap-1">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-[11px] ${actionInfo.color}`}
                              >
                                <IconComp className="w-3.5 h-3.5 shrink-0" />
                                <span>{actionInfo.label}</span>
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight pl-0.5">
                                {log.action}
                              </span>
                            </div>
                          </td>

                          {/* 3. Details */}
                          <td className="py-3 px-4 max-w-xs md:max-w-md lg:max-w-lg">
                            <div className="text-zinc-200 font-medium leading-relaxed break-words line-clamp-2">
                              {log.details || "ດຳເນີນການສຳເລັດ"}
                            </div>
                            {meta.failureReason && (
                              <div className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>ສາເຫດ: {meta.failureReason}</span>
                              </div>
                            )}
                          </td>

                          {/* 4. Actor / User */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                                {(log.user?.name || log.user?.email || "S").charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-zinc-200 group-hover:text-cyan-400 transition-colors">
                                  {log.user?.name || meta.userName || "ແອດມິນລະບົບ"}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                  <span className="truncate max-w-[130px]">{log.user?.email || meta.userEmail || "System"}</span>
                                  {(log.user?.role || meta.userRole) && (
                                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-semibold text-[9px] uppercase">
                                      {log.user?.role || meta.userRole}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 5. Store / Scope */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                                storeName === "ທົ່ວລະບົບ"
                                  ? "bg-zinc-800/80 text-zinc-400 border-zinc-700/60"
                                  : "bg-purple-500/10 text-purple-300 border-purple-500/25"
                              }`}
                            >
                              <Store className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span className="truncate max-w-[130px]">{storeName}</span>
                            </span>
                          </td>

                          {/* 6. Device & IP */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              {ip ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
                                  <Globe className="w-3 h-3 text-cyan-400" />
                                  <span>{ip}</span>
                                </span>
                              ) : (
                                <span className="text-zinc-600 text-[11px] font-mono">-</span>
                              )}
                              {(os || browser) && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                                  {getDeviceIcon(device)}
                                  <span>{os || device}{browser ? ` • ${browser}` : ""}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 7. Action Button */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-cyan-600 text-zinc-300 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1 font-semibold text-xs border border-zinc-700/60"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">ເບິ່ງ</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ══════════════ CARDS GRID VIEW (Alternative) ══════════════ */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
              {filteredLogs.map((log) => {
                const actionInfo = getActionInfo(log.action);
                const IconComp = actionInfo.icon;
                const meta = log.metadata || {};
                const ip = log.ipAddress || meta.ipAddress || null;
                const device = meta.device || "Desktop";
                const os = meta.os || null;
                const browser = meta.browser || null;
                const storeName = log.organization?.name || meta.storeName || "ທົ່ວລະບົບ";

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="bg-zinc-900/90 border border-zinc-800/80 hover:border-cyan-500/40 rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between group shadow-lg cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${actionInfo.color}`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{actionInfo.label}</span>
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {log.createdAt ? new Date(log.createdAt).toLocaleTimeString("lo-LA", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "-"}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors mt-2">
                        {log.action}
                      </h3>
                      <p className="text-xs text-zinc-300 mt-2 line-clamp-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60 font-mono">
                        {log.details || "ດຳເນີນການສຳເລັດ"}
                      </p>

                      {/* Device & IP Badge */}
                      {ip && (
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400 font-mono bg-zinc-950/40 px-2.5 py-1.5 rounded-lg border border-zinc-800/40">
                          <span className="flex items-center gap-1.5 text-zinc-300">
                            <Globe className="w-3 h-3 text-cyan-400" />
                            {ip}
                          </span>
                          <span className="text-zinc-500 text-[10px]">
                            {os || device}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-zinc-800/60 text-zinc-400">
                        <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          {log.user?.name || meta.userName || "ແອດມິນ"}
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold text-[11px]">
                          <Store className="w-3 h-3 text-purple-400" />
                          <span className="truncate max-w-[110px]">{storeName}</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-800/60 mt-3 flex justify-between items-center text-[10px] text-zinc-500">
                      <span>{log.createdAt ? new Date(log.createdAt).toLocaleDateString("lo-LA") : "-"}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> ລາຍລະອຽດ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination ── */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* ── Comprehensive Audit Log Detail Modal ── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    ລາຍລະອຽດປະຫວັດລະບົບ (Audit Log Detail)
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-sm overflow-y-auto custom-scrollbar flex-1">
              {/* Event Overview Box */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80">
                <div>
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">ການກະທຳ (Action)</p>
                  <p className="font-bold text-white mt-1 font-mono text-sm">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">ໝວດໝູ່ (Entity)</p>
                  <p className="font-bold text-cyan-400 mt-1 font-mono text-sm">{selectedLog.entityType || "SYSTEM"}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">ວັນທີ & ເວລາ</p>
                  <p className="font-medium text-zinc-300 mt-1 font-mono text-xs">
                    {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString("lo-LA") : "-"}
                  </p>
                </div>
              </div>

              {/* Activity Details Text */}
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  ເນື້ອໃນກິດຈະກຳ (Description)
                </p>
                <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl text-zinc-200 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedLog.details || "ບໍ່ມີຂໍ້ມູນລາຍລະອຽດ"}
                </div>
              </div>

              {/* Actor & Store Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Actor Info */}
                <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/60">
                  <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <User className="w-3.5 h-3.5" /> ຂໍ້ມູນຜູ້ດຳເນີນການ (Actor)
                  </p>
                  <div className="space-y-1 text-xs">
                    <p className="text-white font-bold text-sm">
                      {selectedLog.user?.name || selectedLog.metadata?.userName || "ແອດມິນລະບົບ"}
                    </p>
                    <p className="text-zinc-400 font-mono">
                      {selectedLog.user?.email || selectedLog.metadata?.userEmail || "System"}
                    </p>
                    <div className="pt-1">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold text-[10px] uppercase">
                        ບົດບາດ: {selectedLog.user?.role || selectedLog.metadata?.userRole || "ADMIN"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Store Info */}
                <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/60">
                  <p className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Store className="w-3.5 h-3.5" /> ຮ້ານຄ້າ / ຂອບເຂດ (Scope)
                  </p>
                  <div className="space-y-1 text-xs">
                    <p className="text-white font-bold text-sm">
                      {selectedLog.organization?.name || selectedLog.metadata?.storeName || "ທົ່ວລະບົບ (System-wide)"}
                    </p>
                    <p className="text-zinc-500 font-mono text-[11px]">
                      {selectedLog.organization?.slug ? `Slug: ${selectedLog.organization.slug}` : "ລະດັບ Global Admin"}
                    </p>
                    {selectedLog.organization?.id && (
                      <p className="text-zinc-600 font-mono text-[10px] truncate">
                        ID: {selectedLog.organization.id}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Network & Device Security Box */}
              <div className="bg-gradient-to-br from-zinc-950 to-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> ຄວາມປອດໄພ & ອຸປະກອນ (Network & Device Security)
                  </p>
                  {selectedLog.ipAddress && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedLog.ipAddress!, "ip")}
                      className="text-xs text-cyan-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
                    >
                      {copiedIp === selectedLog.ipAddress ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">ຄັດລອກແລ້ວ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>ຄັດລອກ IP</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block uppercase">IP Address</span>
                    <span className="font-mono text-zinc-200 font-bold">
                      {selectedLog.ipAddress || selectedLog.metadata?.ipAddress || "Unknown"}
                    </span>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block uppercase">ປະເພດອຸປະກອນ</span>
                    <span className="text-zinc-200 font-semibold flex items-center gap-1 mt-0.5">
                      {getDeviceIcon(selectedLog.metadata?.device)}
                      <span>{selectedLog.metadata?.device || "Desktop"}</span>
                    </span>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block uppercase">ລະບົບປະຕິບັດການ</span>
                    <span className="text-zinc-200 font-semibold mt-0.5 block truncate">
                      {selectedLog.metadata?.os || "Windows / Linux"}
                    </span>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block uppercase">ເວັບບຣາວເຊີ</span>
                    <span className="text-zinc-200 font-semibold mt-0.5 block truncate">
                      {selectedLog.metadata?.browser || "Chrome / Safari"}
                    </span>
                  </div>
                </div>

                {selectedLog.metadata?.userAgent && (
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase mb-1">User-Agent Header</span>
                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 font-mono text-[11px] text-zinc-400 break-all select-all">
                      {selectedLog.metadata.userAgent}
                    </div>
                  </div>
                )}
              </div>

              {/* Changes / Diff Section (If Present) */}
              {selectedLog.metadata?.changes && (
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" /> ການປ່ຽນແປງຂໍ້ມູນ (Changes)
                  </p>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
                          <th className="py-2 px-3 text-left">ຊ່ອງຂໍ້ມູນ (Field)</th>
                          <th className="py-2 px-3 text-left">ຄ່າເກົ່າ (Before)</th>
                          <th className="py-2 px-3 text-left">ຄ່າໃໝ່ (After)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-mono">
                        {Object.entries(selectedLog.metadata.changes).map(([field, diff]: [string, any]) => (
                          <tr key={field} className="hover:bg-zinc-900/40">
                            <td className="py-2 px-3 text-zinc-300 font-semibold">{field}</td>
                            <td className="py-2 px-3 text-rose-400 bg-rose-500/5">{String(diff?.from ?? "-")}</td>
                            <td className="py-2 px-3 text-emerald-400 bg-emerald-500/5">{String(diff?.to ?? "-")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Raw Metadata JSON Inspector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    ຂໍ້ມູນເມຕາເພີ່ມເຕີມ (Raw Metadata JSON)
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(JSON.stringify(selectedLog, null, 2), "json")}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">ຄັດລອກແລ້ວ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-300 max-h-48 overflow-y-auto custom-scrollbar">
                  <pre>{JSON.stringify(selectedLog.metadata || {}, null, 2)}</pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                ປິດໜ້າຕ່າງ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
