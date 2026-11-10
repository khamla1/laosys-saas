"use client";

import { useSession } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";

export function ExitImpersonationButton() {
  const { update } = useSession();
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = async () => {
    setIsExiting(true);
    await update({ organizationId: null });
    window.location.href = "/admin/users";
  };

  return (
    <button
      onClick={handleExit}
      disabled={isExiting}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors text-sm w-full disabled:opacity-50 text-left"
    >
      {isExiting ? <Loader2 size={18} className="animate-spin shrink-0" /> : <LogOut size={18} className="shrink-0" />}
      <span className="truncate">ອອກຈາກໂໝດ Admin</span>
    </button>
  );
}
