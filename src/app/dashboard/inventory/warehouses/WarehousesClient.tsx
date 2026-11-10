"use client";

import { askConfirm } from "@/components/ConfirmModal";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ConfirmModalProvider";

type Warehouse = {
  id: string;
  name: string;
  location: string | null;
  _count: { stock: number };
};

export function WarehousesClient({ initialWarehouses }: { initialWarehouses: Warehouse[] }) {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const { confirm } = useConfirm();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({ name: "", location: "" });

  const filteredWarehouses = warehouses.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    (w.location && w.location.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenDialog = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({ name: warehouse.name, location: warehouse.location || "" });
    } else {
      setEditingWarehouse(null);
      setFormData({ name: "", location: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error("ກະລຸນາປ້ອນຊື່ສາງ (Name required)");
    setLoading(true);

    try {
      if (editingWarehouse) {
        const res = await fetch(`/api/warehouses/${editingWarehouse.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Failed to update");
        
        setWarehouses(prev => prev.map(w => w.id === editingWarehouse.id ? { ...w, ...formData } : w));
        toast.success("ອັບເດດສຳເລັດແລ້ວ");
      } else {
        const res = await fetch(`/api/warehouses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Failed to create");
        const newWarehouse = await res.json();
        
        setWarehouses(prev => [{ ...newWarehouse, _count: { stock: 0 } }, ...prev]);
        toast.success("ເພີ່ມສາງສິນຄ້າສຳເລັດແລ້ວ");
      }
      setIsDialogOpen(false);
      router.refresh();
    } catch (e) {
      toast.error("ເກີດຂໍ້ຜິດພາດ (Error saving warehouse)");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ? (Are you sure?)", { variant: "destructive" }))) return;
    try {
      const res = await fetch(`/api/warehouses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setWarehouses(prev => prev.filter(w => w.id !== id));
      toast.success("ລຶບສຳເລັດແລ້ວ");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "ເກີດຂໍ້ຜິດພາດ (Error deleting)");
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
            placeholder="ຄົ້ນຫາສາງ..."
            className="pl-9 bg-zinc-950 border-zinc-800 focus:border-orange-500"
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-orange-600 hover:bg-orange-500 text-white gap-2">
          <Plus size={16} />
          ເພີ່ມສາງໃໝ່ (Add)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWarehouses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 bg-zinc-950/30 rounded-xl border border-zinc-800/50">
            <Package className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            ບໍ່ພົບສາງສິນຄ້າ (No warehouses found)
          </div>
        ) : (
          filteredWarehouses.map(warehouse => (
            <div key={warehouse.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-orange-500/50 transition-colors group relative">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(warehouse)} className="h-7 w-7 text-zinc-400 hover:text-white bg-zinc-900">
                  <Edit2 size={12} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(warehouse.id)} className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-500/20 bg-zinc-900">
                  <Trash2 size={12} />
                </Button>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{warehouse.name}</h3>
                  <p className="text-xs text-zinc-400 truncate">{warehouse.location || "ບໍ່ໄດ້ລະບຸສະຖານທີ່"}</p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-zinc-800/50 mt-4 flex justify-between items-center">
                <span className="text-xs text-zinc-500">ລາຍການສິນຄ້າໃນສາງ (Items)</span>
                <span className="text-sm font-black text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-md">
                  {warehouse._count.stock}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? "ແກ້ໄຂສາງ (Edit Warehouse)" : "ເພີ່ມສາງໃໝ່ (Add Warehouse)"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">ຊື່ສາງ (Name) <span className="text-red-500">*</span></label>
              <Input 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex. Main Warehouse"
                className="bg-zinc-900 border-zinc-800 focus:border-orange-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">ສະຖານທີ່ (Location)</label>
              <Input 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                placeholder="Vientiane, Laos..."
                className="bg-zinc-900 border-zinc-800 focus:border-orange-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-zinc-700 hover:bg-zinc-800 text-white">
              ຍົກເລີກ (Cancel)
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-orange-600 hover:bg-orange-500 text-white">
              {loading ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກ (Save)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
