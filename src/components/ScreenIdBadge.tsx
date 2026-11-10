"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getScreenById,
  getScreenByPath,
  SCREEN_REGISTRY,
  ScreenDefinition,
} from "@/lib/screens";
import {
  Copy,
  Check,
  Search,
  ExternalLink,
  X,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

function ScreenIdBadgeInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Determine active screen definition
  const queryScreenId = searchParams?.get("screenId");
  const currentScreen: ScreenDefinition | undefined = useMemo(() => {
    if (pathname) {
      const match = getScreenByPath(pathname);
      if (match) return match;
    }
    if (queryScreenId) {
      const match = getScreenById(queryScreenId);
      if (match) return match;
    }
    if (typeof window !== "undefined") {
      const pathSegment = window.location.pathname.replace(/^\//, "").toUpperCase();
      const directMatch = getScreenById(pathSegment);
      if (directMatch) return directMatch;
    }
    return undefined;
  }, [pathname, queryScreenId]);

  // Keep browser address bar showing the clean Direct Short URL (e.g. /DSH000001, /BKG000001)
  useEffect(() => {
    if (!currentScreen || typeof window === "undefined") return;

    const targetPath = `/${currentScreen.screenId}`;
    const params = new URLSearchParams(window.location.search);
    params.delete("screenId");
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const targetUrl = `${targetPath}${queryStr}`;

    if (window.location.pathname !== targetPath || window.location.search.includes("screenId")) {
      window.history.replaceState(null, "", targetUrl);
    }
  }, [currentScreen, pathname]);

  // Keyboard shortcut (Ctrl+K or Cmd+K) to open Quick Jump
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsJumpModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fallbackCopy = (text: string) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      toast.success(`ຄັດລອກລິ້ງແລ້ວ: ${text}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(`ກະລຸນາຄັດລອກດ້ວຍຕົນເອງ: ${text}`);
    }
  };

  const handleCopyLink = () => {
    if (!currentScreen || typeof window === "undefined") return;

    const origin = window.location.origin;
    const shortUrl = `${origin}/${currentScreen.screenId}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shortUrl).then(() => {
        setCopied(true);
        toast.success(`ຄັດລອກລິ້ງສັ້ນແລ້ວ: ${shortUrl}`);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => fallbackCopy(shortUrl));
    } else {
      fallbackCopy(shortUrl);
    }
  };

  const handleSelectScreen = (screen: ScreenDefinition) => {
    setIsJumpModalOpen(false);
    setSearchQuery("");
    router.push(`${screen.path}?screenId=${screen.screenId}`);
  };

  // Filtered screens for Quick Jump modal
  const filteredScreens = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SCREEN_REGISTRY;
    return SCREEN_REGISTRY.filter(
      (s) =>
        s.screenId.toLowerCase().includes(q) ||
        s.titleLa.toLowerCase().includes(q) ||
        s.titleEn.toLowerCase().includes(q) ||
        s.module.toLowerCase().includes(q) ||
        (s.descriptionLa && s.descriptionLa.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  if (!currentScreen) return null;

  return (
    <>
      {/* ── Screen ID Toolbar Item ── */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        {/* Quick Jump Search Launcher */}
        <button
          type="button"
          onClick={() => setIsJumpModalOpen(true)}
          className="flex items-center justify-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg sm:rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-all shadow-sm shrink-0"
          title="ຄົ້ນຫາໜ້າຈໍ (Ctrl + K)"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline text-[11px] font-mono text-zinc-500">Ctrl+K</span>
        </button>

        {/* Enterprise Screen ID Badge */}
        <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-lg sm:rounded-xl px-2 sm:px-2.5 py-1 text-xs shadow-sm hover:border-zinc-700 transition-all min-w-0">
          <button
            type="button"
            onClick={() => setIsJumpModalOpen(true)}
            className="flex items-center gap-1.5 mr-1.5 sm:mr-2 min-w-0 text-left"
            title={`${currentScreen.screenId} - ${currentScreen.titleLa}`}
          >
            <span className="font-mono font-bold text-[10px] sm:text-[11px] text-blue-400 tracking-wide shrink-0">
              {currentScreen.screenId}
            </span>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="hidden sm:inline text-[11px] font-medium text-zinc-300 sm:max-w-[200px] truncate">
              {currentScreen.titleLa}
            </span>
          </button>

          {/* Copy URL Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
            title={`ຄັດລອກລິ້ງສັ້ນ (Direct URL: /${currentScreen.screenId})`}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Quick Screen Jump Modal (Command Palette Style) ── */}
      {isJumpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-24 p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[82dvh] sm:max-h-[75vh]">
            {/* Search Input Bar */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-950">
              <Search className="w-5 h-5 text-blue-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ພິມລະຫັດໜ້າຈໍ (ເຊັ່ນ RNT000001, RPT000004, POS) ຫຼື ຊື່ໜ້າ..."
                className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsJumpModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Screen Results List */}
            <div className="p-2 overflow-y-auto space-y-1">
              {filteredScreens.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  ບໍ່ພົບໜ້າຈໍທີ່ກົງກັບຄຳຄົ້ນຫາ &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredScreens.map((screen) => {
                  const isCurrent = screen.screenId === currentScreen.screenId;
                  return (
                    <button
                      key={screen.screenId}
                      type="button"
                      onClick={() => handleSelectScreen(screen)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                        isCurrent
                          ? "bg-blue-500/10 border border-blue-500/30 text-white"
                          : "hover:bg-zinc-800/60 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                            isCurrent
                              ? "bg-blue-500 text-white"
                              : "bg-zinc-800 text-zinc-300 group-hover:bg-zinc-700"
                          }`}
                        >
                          {screen.screenId.slice(0, 3)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-400">
                              {screen.screenId}
                            </span>
                            <span className="text-xs font-medium text-white truncate">
                              {screen.titleLa}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            <span className="text-blue-400 font-mono font-medium">/{screen.screenId}</span> • {screen.titleEn} • {screen.module}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {isCurrent ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
                            ໜ້າປັດຈຸບັນ
                          </span>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer Help */}
            <div className="p-3 bg-zinc-950 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex justify-between items-center px-4">
              <span>ກົດ Esc ເພື່ອປິດໜ້າຕ່າງ</span>
              <span className="font-mono text-zinc-400">
                {filteredScreens.length} ໜ້າຈໍທັງໝົດ
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ScreenIdBadge() {
  return (
    <Suspense fallback={<div className="h-7 w-24 bg-zinc-800/40 rounded-lg animate-pulse" />}>
      <ScreenIdBadgeInner />
    </Suspense>
  );
}
