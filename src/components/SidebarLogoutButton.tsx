"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";

export function SidebarLogoutButton({ t }: { t: any }) {
  return (
    <Link 
      href="/logout"
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm w-full"
    >
      <LogOut size={18} />
      {t.title}
    </Link>
  );
}
