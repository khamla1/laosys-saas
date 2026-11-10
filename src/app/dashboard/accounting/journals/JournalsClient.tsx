"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Account = { id: string; code: string; name: string };
type JournalLine = { id?: string; accountId: string; debit: number; credit: number; description?: string; account?: Account };
type JournalEntry = { id: string; date: string; description: string; reference: string | null; lines: JournalLine[] };

export function JournalsClient({ initialJournals, accounts }: { initialJournals: JournalEntry[], accounts: Account[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    reference: "",
    lines: [
      { accountId: "", debit: 0, credit: 0 },
      { accountId: "", debit: 0, credit: 0 }
    ] as JournalLine[]
  });

  const totalDebit = formData.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = formData.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;

  const handleAddLine = () => {
    setFormData({ ...formData, lines: [...formData.lines, { accountId: "", debit: 0, credit: 0 }] });
  };

  const handleRemoveLine = (index: number) => {
    const newLines = [...formData.lines];
    newLines.splice(index, 1);
    setFormData({ ...formData, lines: newLines });
  };

  const updateLine = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...formData.lines];
    (newLines[index] as any)[field] = value;
    
    // Auto zero out the opposite side if they type in one side
    if (field === 'debit' && Number(value) > 0) newLines[index].credit = 0;
    if (field === 'credit' && Number(value) > 0) newLines[index].debit = 0;
    
    setFormData({ ...formData, lines: newLines });
  };

  const handleSave = async () => {
    if (!formData.description) return toast.error("ກະລຸນາປ້ອນລາຍລະອຽດ (Description required)");
    if (!isBalanced) return toast.error("ຍອດເດບິດ ຕ້ອງເທົ່າກັບ ຍອດເຄຣດິດ (Debit must equal Credit)");
    if (formData.lines.some(l => !l.accountId)) return toast.error("ກະລຸນາເລືອກບັນຊີໃຫ້ຄົບທຸກແຖວ");
    
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/journals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      
      toast.success("ບັນທຶກລາຍການສຳເລັດແລ້ວ");
      setIsOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: "",
        reference: "",
        lines: [
          { accountId: "", debit: 0, credit: 0 },
          { accountId: "", debit: 0, credit: 0 }
        ]
      });
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setIsOpen(true)} className="bg-orange-600 hover:bg-orange-500 text-white gap-2">
          <Plus size={16} />
          ລົງບັນຊີໃໝ່ (New Journal Entry)
        </Button>
      </div>

      <div className="space-y-4">
        {initialJournals.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
            ຍັງບໍ່ມີລາຍການບັນທຶກບັນຊີ
          </div>
        ) : (
          initialJournals.map(journal => (
            <div key={journal.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="bg-zinc-950/80 p-4 border-b border-zinc-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">{journal.description}</div>
                  <div className="text-xs text-zinc-500">
                    ວັນທີ: {new Date(journal.date).toLocaleDateString("th-TH")} 
                    {journal.reference && ` | ອ້າງອີງ: ${journal.reference}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500">ຍອດລວມ (Total)</div>
                  <div className="font-mono font-bold text-orange-400">
                    ₭{journal.lines.reduce((s, l) => s + (l.debit || 0), 0).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-500 uppercase border-b border-zinc-800/50">
                    <tr>
                      <th className="py-2 font-medium">ບັນຊີ (Account)</th>
                      <th className="py-2 font-medium text-right text-emerald-400/80">ເດບິດ (Debit)</th>
                      <th className="py-2 font-medium text-right text-red-400/80">ເຄຣດິດ (Credit)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journal.lines.map((line, idx) => (
                      <tr key={line.id || idx} className="border-b border-zinc-800/30 last:border-0">
                        <td className="py-2 font-mono text-zinc-300">
                          <span className="text-zinc-500 mr-2">{line.account?.code}</span>
                          {line.account?.name}
                        </td>
                        <td className="py-2 font-mono text-right text-emerald-400">
                          {line.debit > 0 ? line.debit.toLocaleString() : ""}
                        </td>
                        <td className="py-2 font-mono text-right text-red-400">
                          {line.credit > 0 ? line.credit.toLocaleString() : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>ລົງບັນຊີໃໝ່ (New Journal Entry)</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">ວັນທີ (Date)</label>
                <Input 
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">ເລກອ້າງອີງ (Ref)</label>
                <Input 
                  value={formData.reference}
                  onChange={e => setFormData({...formData, reference: e.target.value})}
                  placeholder="Ex: INV-001"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">ລາຍລະອຽດ (Description) <span className="text-red-500">*</span></label>
              <Input 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Ex: ບັນທຶກລາຍຮັບຈາກການຂາຍ"
                className="bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-900 p-3 grid grid-cols-12 gap-2 text-xs font-bold text-zinc-400 uppercase">
                <div className="col-span-5">ບັນຊີ (Account)</div>
                <div className="col-span-3 text-right">ເດບິດ (Debit)</div>
                <div className="col-span-3 text-right">ເຄຣດິດ (Credit)</div>
                <div className="col-span-1"></div>
              </div>
              
              <div className="p-2 space-y-2">
                {formData.lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <select
                        value={line.accountId}
                        onChange={e => updateLine(idx, "accountId", e.target.value)}
                        className="w-full h-9 px-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="">-- ເລືອກ --</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        value={line.debit || ""}
                        onChange={e => updateLine(idx, "debit", Number(e.target.value) || 0)}
                        className="h-9 bg-zinc-950 border-zinc-800 text-right text-emerald-400 font-mono"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        value={line.credit || ""}
                        onChange={e => updateLine(idx, "credit", Number(e.target.value) || 0)}
                        className="h-9 bg-zinc-950 border-zinc-800 text-right text-red-400 font-mono"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveLine(idx)} disabled={formData.lines.length <= 2} className="h-8 w-8 text-zinc-500 hover:text-red-400">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center">
                <Button variant="ghost" size="sm" onClick={handleAddLine} className="text-zinc-400 hover:text-white">
                  <Plus size={14} className="mr-1" /> ເພີ່ມແຖວ
                </Button>
                <div className="flex gap-8 text-sm font-mono">
                  <div className={`font-bold ${isBalanced ? 'text-emerald-400' : 'text-red-400'}`}>
                    Dr: {totalDebit.toLocaleString()}
                  </div>
                  <div className={`font-bold ${isBalanced ? 'text-emerald-400' : 'text-red-400'}`}>
                    Cr: {totalCredit.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            
            {!isBalanced && totalDebit > 0 && (
              <p className="text-red-400 text-sm text-right flex items-center justify-end gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0" /> ຍອດເດບິດ ບໍ່ເທົ່າກັບ ຍອດເຄຣດິດ (Unbalanced Entry)</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="border-zinc-700 hover:bg-zinc-800 text-white">
              ຍົກເລີກ
            </Button>
            <Button onClick={handleSave} disabled={loading || !isBalanced || totalDebit === 0} className="bg-orange-600 hover:bg-orange-500 text-white">
              ບັນທຶກ (Post Journal)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
