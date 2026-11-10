"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
};

const ACCOUNT_TYPES = [
  { value: "ASSET", label: "ຊັບສິນ (Assets)" },
  { value: "LIABILITY", label: "ໜີ້ສິນ (Liabilities)" },
  { value: "EQUITY", label: "ທຶນ (Equity)" },
  { value: "REVENUE", label: "ລາຍຮັບ (Revenue)" },
  { value: "EXPENSE", label: "ຄ່າໃຊ້ຈ່າຍ (Expenses)" },
];

export function COAClient({ initialAccounts }: { initialAccounts: Account[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ code: "", name: "", type: "ASSET" });

  const filtered = initialAccounts.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.code.includes(search)
  );

  const handleSave = async () => {
    if (!formData.code || !formData.name) return toast.error("ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ (Required)");
    
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      
      toast.success("ເພີ່ມບັນຊີສຳເລັດແລ້ວ");
      setIsOpen(false);
      setFormData({ code: "", name: "", type: "ASSET" });
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case "ASSET": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "LIABILITY": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "EQUITY": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "REVENUE": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "EXPENSE": return "text-red-400 bg-red-500/10 border-red-500/20";
      default: return "text-zinc-400 bg-zinc-800 border-zinc-700";
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ຄົ້ນຫາລະຫັດ ຫຼື ຊື່ບັນຊີ..."
            className="pl-9 bg-zinc-950 border-zinc-800 focus:border-purple-500"
          />
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white gap-2">
          <Plus size={16} />
          ເພີ່ມບັນຊີ (Add Account)
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/50 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">ລະຫັດບັນຊີ (Code)</th>
              <th className="px-4 py-3">ຊື່ບັນຊີ (Name)</th>
              <th className="px-4 py-3 rounded-tr-lg">ໝວດໝູ່ (Type)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-4 font-mono font-bold text-white">{a.code}</td>
                <td className="px-4 py-4 text-zinc-300">{a.name}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase border ${getTypeColor(a.type)}`}>
                    {a.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>ເພີ່ມຜັງບັນຊີໃໝ່</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">ລະຫັດບັນຊີ (Code)</label>
              <Input 
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value})}
                placeholder="Ex: 1020"
                className="bg-zinc-900 border-zinc-800 font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">ຊື່ບັນຊີ (Name)</label>
              <Input 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: ເງິນຝາກທະນາຄານ BCEL"
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">ໝວດໝູ່ (Account Type)</label>
              <select
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:border-purple-500"
              >
                {ACCOUNT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="border-zinc-700 hover:bg-zinc-800 text-white">
              ຍົກເລີກ
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-purple-600 hover:bg-purple-500 text-white">
              ບັນທຶກ (Save)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
