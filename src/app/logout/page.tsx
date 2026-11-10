"use client";

import { LogOut, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-10 shadow-2xl relative z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle size={36} strokeWidth={2.5} />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">ອອກຈາກລະບົບ</h1>
        <p className="text-zinc-400 text-lg mb-10">
          ທ່ານຕ້ອງການອອກຈາກລະບົບແທ້ບໍ່? (Are you sure you want to log out?)
        </p>
        
        <div className="flex flex-col gap-4 w-full">
          <button 
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-red-600/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>ກຳລັງອອກຈາກລະບົບ...</span>
              </>
            ) : (
              <>
                <LogOut size={24} />
                <span>ຕົກລົງ, ອອກຈາກລະບົບ</span>
              </>
            )}
          </button>
          
          <button 
            onClick={() => router.back()}
            disabled={isLoading}
            className="w-full py-4 rounded-xl border-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <ArrowLeft size={24} />
            <span>ຍົກເລີກ (ກັບຄືນ)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
