"use client";

import { askConfirm } from "@/components/ConfirmModal";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, CheckCircle, Search, ArrowRight, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/ConfirmModalProvider";

type PO = {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  supplier: { name: string };
  items: any[];
};

type Warehouse = {
  id: string;
  name: string;
  location?: string;
};

export function POClient({ initialPOs, warehouses }: { initialPOs: PO[], warehouses: Warehouse[] }) {
  const router = useRouter();
  const [pos, setPos] = useState<PO[]>(initialPOs);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const { confirm } = useConfirm();
  
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PO | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");

  const filteredPOs = pos.filter(po => 
    po.id.toLowerCase().includes(search.toLowerCase()) || 
    po.supplier.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch(status) {
      case "DRAFT": return "bg-zinc-800 text-zinc-400 border-zinc-700";
      case "ORDERED": return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "RECEIVED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const handleReceiveClick = (po: PO) => {
    setSelectedPO(po);
    setIsReceiveOpen(true);
  };

  const confirmReceive = async () => {
    if (!selectedPO) return;
    if (!selectedWarehouse) return toast.error("ກະລຸນາເລືອກສາງ (Select warehouse)");

    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-orders/${selectedPO.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RECEIVED", warehouseId: selectedWarehouse }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to receive");
      }
      
      toast.success("ຮັບສິນຄ້າເຂົ້າສາງສຳເລັດແລ້ວ!");
      setPos(prev => prev.map(p => p.id === selectedPO.id ? { ...p, status: "RECEIVED" } : p));
      setIsReceiveOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "ເກີດຂໍ້ຜິດພາດ (Error)");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ? (Are you sure?)", { variant: "destructive" }))) return;
    try {
      const res = await fetch(`/api/purchase-orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      
      setPos(prev => prev.filter(p => p.id !== id));
      toast.success("ລຶບສຳເລັດແລ້ວ");
      router.refresh();
    } catch (e) {
      toast.error("ເກີດຂໍ້ຜິດພາດ (Cannot delete received POs)");
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
            placeholder="ຄົ້ນຫາໃບສັ່ງຊື້..."
            className="pl-9 bg-zinc-950 border-zinc-800 focus:border-purple-500"
          />
        </div>
        <Link href="/dashboard/inventory/purchase-orders/new">
          <Button className="bg-purple-600 hover:bg-purple-500 text-white gap-2">
            <Plus size={16} />
            ສ້າງໃບສັ່ງຊື້ໃໝ່ (Create PO)
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/50 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">ລະຫັດ PO</th>
              <th className="px-4 py-3">ຜູ້ສະໜອງ (Supplier)</th>
              <th className="px-4 py-3 text-center">ຈຳນວນລາຍການ</th>
              <th className="px-4 py-3 text-right">ຍອດລວມ</th>
              <th className="px-4 py-3 text-center">ສະຖານະ (Status)</th>
              <th className="px-4 py-3 text-center">ວັນທີ</th>
              <th className="px-4 py-3 text-right rounded-tr-lg">ຈັດການ</th>
            </tr>
          </thead>
          <tbody>
            {filteredPOs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                  ບໍ່ພົບໃບສັ່ງຊື້ (No purchase orders found)
                </td>
              </tr>
            ) : (
              filteredPOs.map(po => (
                <tr key={po.id} className="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4 font-mono text-xs text-zinc-400">#{po.id.slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-4 font-bold text-white">{po.supplier.name}</td>
                  <td className="px-4 py-4 text-center text-zinc-300">{po.items.length} ລາຍການ</td>
                  <td className="px-4 py-4 text-right font-medium text-emerald-400">
                    ₭{po.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase border ${getStatusStyle(po.status)}`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-xs text-zinc-500">
                    {new Date(po.createdAt).toLocaleDateString("th-TH")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {po.status !== "RECEIVED" && (
                        <Button variant="ghost" size="icon" onClick={() => handleReceiveClick(po)} className="h-8 w-8 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10" title="ຮັບສິນຄ້າເຂົ້າສາງ">
                          <CheckCircle size={16} />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(po.id)} className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10" disabled={po.status === "RECEIVED"}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ຮັບສິນຄ້າເຂົ້າສາງ (Receive Stock)</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-3 rounded-lg text-sm">
              ທ່ານກຳລັງຈະຮັບສິນຄ້າຈາກ <b>{selectedPO?.supplier.name}</b> ເຂົ້າສູ່ຄັງສິນຄ້າ.
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">ເລືອກສາງທີ່ຕ້ອງການເກັບ (Destination Warehouse) <span className="text-red-500">*</span></label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full h-11 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">-- ກະລຸນາເລືອກສາງ --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} {w.location ? `(${w.location})` : ""}</option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiveOpen(false)} className="border-zinc-700 hover:bg-zinc-800 text-white">
              ຍົກເລີກ
            </Button>
            <Button onClick={confirmReceive} disabled={loading || !selectedWarehouse} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {loading ? "ກຳລັງດຳເນີນການ..." : "ຢືນຢັນການຮັບ (Confirm Receive)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
