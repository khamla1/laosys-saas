"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ClockInOutClient({ records }: { records: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine if currently working
  const activeRecord = records.find(r => r.checkOut === null);
  const isWorking = !!activeRecord;

  const handleClockInOut = async () => {
    setLoading(true);
    try {
      const action = isWorking ? "CLOCK_OUT" : "CLOCK_IN";
      const res = await fetch(`/api/hr/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      
      toast.success(isWorking ? "ບັນທຶກເວລາອອກງານສຳເລັດ" : "ບັນທຶກເວລາເຂົ້າງານສຳເລັດ");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "ເກີດຂໍ້ຜິດພາດ (Error)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-zinc-950/50 border border-zinc-800 rounded-3xl p-10 flex flex-col items-center text-center">
        <div className="text-6xl sm:text-8xl font-black text-white tracking-tighter mb-2 font-mono">
          {currentTime.toLocaleTimeString("en-GB")}
        </div>
        <div className="text-zinc-500 font-medium mb-10">
          {currentTime.toLocaleDateString("th-TH", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        <button
          onClick={handleClockInOut}
          disabled={loading}
          className={`relative group overflow-hidden w-64 h-64 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${
            isWorking 
              ? "bg-red-500/10 border-4 border-red-500/30 text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.2)] hover:shadow-[0_0_80px_rgba(239,68,68,0.4)]" 
              : "bg-emerald-500/10 border-4 border-emerald-500/30 text-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] hover:shadow-[0_0_80px_rgba(16,185,129,0.4)]"
          }`}
        >
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-3xl font-black uppercase tracking-widest mb-1">
              {loading ? "..." : (isWorking ? "ອອກງານ" : "ເຂົ້າງານ")}
            </span>
            <span className="text-sm font-bold opacity-70 uppercase tracking-widest">
              {isWorking ? "Clock Out" : "Clock In"}
            </span>
          </div>
          <div className={`absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
        </button>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">ປະຫວັດການເຂົ້າງານມື້ນີ້ (Today's Logs)</h3>
        {records.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-sm">
            ຍັງບໍ່ມີປະຫວັດການເຂົ້າງານໃນມື້ນີ້
          </div>
        ) : (
          <div className="space-y-3">
            {records.map(r => (
              <div key={r.id} className="flex justify-between items-center p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-400">ເຂົ້າງານ (In)</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {new Date(r.checkIn).toLocaleTimeString("en-GB", { hour: '2-digit', minute:'2-digit' })}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-sm text-zinc-400">ອອກງານ (Out)</span>
                  <span className={`text-lg font-bold ${r.checkOut ? 'text-red-400' : 'text-zinc-600'}`}>
                    {r.checkOut ? new Date(r.checkOut).toLocaleTimeString("en-GB", { hour: '2-digit', minute:'2-digit' }) : "--:--"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
