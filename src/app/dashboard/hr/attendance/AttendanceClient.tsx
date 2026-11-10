"use client";

import { useState } from "react";
import { Search, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";

type Record = {
  id: string;
  checkIn: string;
  checkOut: string | null;
  status: string;
  employee: {
    department: string | null;
    user: {
      name: string | null;
    }
  }
};

export function AttendanceClient({ records }: { records: Record[] }) {
  const [search, setSearch] = useState("");

  const filtered = records.filter(r => 
    (r.employee.user.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (r.employee.department || "").toLowerCase().includes(search.toLowerCase())
  );

  const calculateHours = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return "-";
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diff = (end - start) / (1000 * 60 * 60);
    return `${diff.toFixed(2)} ຊົ່ວໂມງ`;
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ຄົ້ນຫາຊື່ພະນັກງານ..."
            className="pl-9 bg-zinc-950 border-zinc-800 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/50 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">ຊື່ພະນັກງານ (Name)</th>
              <th className="px-4 py-3">ແຜນກ (Dept)</th>
              <th className="px-4 py-3 text-center">ເວລາເຂົ້າ (Clock In)</th>
              <th className="px-4 py-3 text-center">ເວລາອອກ (Clock Out)</th>
              <th className="px-4 py-3 text-center">ຊົ່ວໂມງເຮັດງານ (Hours)</th>
              <th className="px-4 py-3 text-center rounded-tr-lg">ສະຖານະ (Status)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  <CalendarDays className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                  ບໍ່ພົບປະຫວັດການເຂົ້າງານ
                </td>
              </tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4 font-bold text-white">
                    {r.employee.user.name || "Unknown"}
                  </td>
                  <td className="px-4 py-4 text-zinc-400">{r.employee.department || "-"}</td>
                  <td className="px-4 py-4 text-center text-emerald-400 font-mono">
                    {new Date(r.checkIn).toLocaleString("th-TH")}
                  </td>
                  <td className="px-4 py-4 text-center font-mono text-zinc-300">
                    {r.checkOut ? new Date(r.checkOut).toLocaleString("th-TH") : <span className="text-zinc-600">ຍັງບໍ່ອອກງານ</span>}
                  </td>
                  <td className="px-4 py-4 text-center text-zinc-300 font-medium">
                    {calculateHours(r.checkIn, r.checkOut)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase border ${r.checkOut ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                      {r.checkOut ? "COMPLETED" : "WORKING"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
