"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
          ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດໜ້າຈໍ
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mb-4 leading-relaxed">
          ລະບົບບໍ່ສາມາດໂຫຼດຂໍ້ມູນໜ້າຈໍນີ້ໄດ້ໃນຂະນະນີ້. ກະລຸນາກົດປຸ່ມລອງໃໝ່ ຫຼື ກັບຄືນສູ່ໜ້າຫຼັກ.
        </p>

        {/* Detailed Diagnostic Message */}
        <div className="mb-6 p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-left overflow-auto max-h-40">
          <p className="text-[11px] font-mono text-red-400 break-all">
            {error?.message || "Unknown error occurred"}
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-zinc-500 mt-1">
              Digest: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ລອງໃໝ່ອີກຄັ້ງ (Retry)</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-xs sm:text-sm rounded-xl transition-all border border-zinc-700"
          >
            <Home className="w-4 h-4" />
            <span>ໜ້າຫຼັກ (Home)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
