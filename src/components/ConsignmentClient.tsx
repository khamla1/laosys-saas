"use client";

import { useState, useEffect } from "react";
import { Plus, Tag, Loader2, DollarSign, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type ConsignmentItem = {
  id: string;
  itemName: string;
  description?: string;
  condition: string;
  ownerName: string;
  ownerPhone?: string;
  price: number;
  storeFeePct: number;
  status: string;
  createdAt: string;
};

export function ConsignmentClient() {
  const [items, setItems] = useState<ConsignmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [price, setPrice] = useState("0");
  const [storeFeePct, setStoreFeePct] = useState("20");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/consignment");
      if (res.ok) setItems(await res.json());
    } catch (error) {
      toast.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!itemName || !ownerName || !price) {
      toast.error("Please fill required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/consignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName, description, condition, ownerName, ownerPhone, price, storeFeePct }),
      });
      if (res.ok) {
        toast.success("Item added!");
        setIsDialogOpen(false);
        fetchData();
        setItemName(""); setDescription(""); setCondition(""); setOwnerName(""); setOwnerPhone(""); setPrice("0"); setStoreFeePct("20");
      }
    } catch (error) {
      toast.error("Error creating item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const markSold = async (id: string) => {
    try {
      const res = await fetch(`/api/consignment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SOLD" }),
      });
      if (res.ok) {
        toast.success("Marked as sold");
        fetchData();
      }
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Tag className="text-emerald-500" />
            ສິນຄ້າມືສອງແລະຮັບຝາກຂາຍ (Second-Hand & Consignment)
          </h1>
          <p className="text-zinc-400 mt-1">ຈັດການສິນຄ້າຝາກຂາຍ ຄຳນວນສ່ວນແບ່ງຮ້ານແລະເຈົ້າຂອງອັດຕະໂນມັດ</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl h-11">
          <Plus size={18} /> ຮັບຝາກສິນຄ້າໃໝ່
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-zinc-500" /></div>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/50 border-zinc-800 border-dashed border-2 rounded-2xl">
          <Tag size={48} className="text-zinc-600 mb-4" />
          <h3 className="text-xl font-semibold text-white">ຍັງບໍ່ມີສິນຄ້າຝາກຂາຍ</h3>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="mt-4 rounded-xl text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">ເປີດຮັບຝາກຊິ້ນທຳອິດ</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const storeShare = item.price * (item.storeFeePct / 100);
            const ownerShare = item.price - storeShare;
            return (
              <Card key={item.id} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{item.itemName}</h3>
                    <p className="text-sm text-zinc-400 font-medium mt-1">ສະພາບ: {item.condition}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'FOR_SALE' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {item.status === 'FOR_SALE' ? 'ກຳລັງຂາຍ' : 'ຂາຍແລ້ວ (SOLD)'}
                  </span>
                </div>
                
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/50 mb-3 text-sm">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-800">
                    <span className="text-zinc-400">ລາຄາຕັ້ງຂາຍ:</span>
                    <span className="text-white font-bold text-lg">฿{item.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500">ສ່ວນແບ່ງຮ້ານ ({item.storeFeePct}%):</span>
                    <span className="text-emerald-400 font-medium">฿{storeShare.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">ຄືນເຈົ້າຂອງ:</span>
                    <span className="text-zinc-300 font-medium">฿{ownerShare.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-zinc-500">
                    <span className="block text-zinc-400">ເຈົ້າຂອງ: {item.ownerName}</span>
                    {item.ownerPhone}
                  </div>
                  {item.status === 'FOR_SALE' && (
                    <Button size="sm" variant="outline" onClick={() => markSold(item.id)} className="h-8 rounded-lg text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                      <CheckCircle size={14} className="mr-1" /> ຂາຍແລ້ວ
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">ຮັບຝາກສິນຄ້າມືສອງ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-xs text-zinc-400">ຊື່ສິນຄ້າ</label>
              <Input placeholder="ເຊັ່ນ ເກີບເຕະບານ Nike ໄຊສ໌ 42" value={itemName} onChange={e => setItemName(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">ສະພາບສິນຄ້າ</label>
              <Input placeholder="ເຊັ່ນ 90%, ມີຮອຍຖະຫຼອກ" value={condition} onChange={e => setCondition(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">ລາຄາຕັ້ງຂາຍ (ບາດ)</label>
              <Input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">ຊື່ຜູ້ຝາກຂາຍ (ເຈົ້າຂອງ)</label>
              <Input placeholder="ຊື່" value={ownerName} onChange={e => setOwnerName(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">ເບີໂທຜູ້ຝາກ</label>
              <Input placeholder="ເບີໂທ" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="col-span-2 space-y-2 border-t border-zinc-800 pt-2">
              <label className="text-xs text-zinc-400">ສ່ວນແບ່ງຮ້ານຄ້າ (%) - Commission</label>
              <Input type="number" min="0" max="100" value={storeFeePct} onChange={e => setStoreFeePct(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
              <p className="text-[10px] text-zinc-500 mt-1">ເຊັ່ນ 20% ໝາຍເຖິງ ຮ້ານໄດ້ 20% ເຈົ້າຂອງໄດ້ 80% ເມື່ອຂາຍອອກ</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-zinc-400 hover:text-white">ຍົກເລີກ</Button>
            <Button onClick={handleCreate} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">ບັນທຶກສິນຄ້າຝາກຂາຍ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
