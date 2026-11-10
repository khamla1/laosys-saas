"use client";

import { useState, useEffect } from "react";
import { Plus, Settings, Loader2, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type FittingProfile = {
  id: string;
  customerName: string;
  customerPhone?: string;
  sportType: string;
  equipmentName: string;
  specifications: any;
  notes?: string;
  createdAt: string;
};

export function FittingClient() {
  const [profiles, setProfiles] = useState<FittingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [sportType, setSportType] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [specs, setSpecs] = useState(""); // simple string for now, could be JSON
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/fitting");
      if (res.ok) setProfiles(await res.json());
    } catch (error) {
      toast.error("Failed to load profiles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!customerName || !equipmentName || !specs) {
      toast.error("Please fill required fields");
      return;
    }
    setIsSubmitting(true);
    
    // Parse simple key:value format into JSON for specs
    const specsJson = specs.split(',').reduce((acc, curr) => {
      const [k, v] = curr.split(':');
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {} as Record<string, string>);

    try {
      const res = await fetch("/api/fitting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, customerPhone, sportType, equipmentName, specifications: specsJson, notes }),
      });
      if (res.ok) {
        toast.success("Profile saved!");
        setIsDialogOpen(false);
        fetchData();
        setCustomerName(""); setCustomerPhone(""); setSportType(""); setEquipmentName(""); setSpecs(""); setNotes("");
      }
    } catch (error) {
      toast.error("Error creating profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="text-teal-500" />
            ຂໍ້ມູນການປັບແຕ່ງ (Fitting Profiles)
          </h1>
          <p className="text-zinc-400 mt-1">ເກັບບັນທຶກຂໍ້ມູນສະລີລະແລະການຕັ້ງຄ່າອຸປະກອນຂອງລູກຄ້າແຕ່ລະທ່ານ</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white gap-2 rounded-xl h-11">
          <Plus size={18} /> ເພີ່ມໂປຣໄຟລ໌ Fitting
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-zinc-500" /></div>
      ) : profiles.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/50 border-zinc-800 border-dashed border-2 rounded-2xl">
          <Settings size={48} className="text-zinc-600 mb-4" />
          <h3 className="text-xl font-semibold text-white">ຍັງບໍ່ມີປະຫວັດການປັບແຕ່ງ</h3>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="mt-4 rounded-xl">ເພີ່ມໂປຣໄຟລ໌ທຳອິດ</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(p => (
            <Card key={p.id} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {p.customerName}
                  </h3>
                  <p className="text-sm text-zinc-400 font-medium mt-1">{p.customerPhone}</p>
                </div>
                <span className="px-2 py-1 rounded bg-teal-500/10 text-teal-400 text-xs font-bold uppercase">
                  {p.sportType || 'General'}
                </span>
              </div>
              <div className="space-y-3 mt-2">
                <div className="flex items-center gap-2 text-sm text-white font-semibold">
                  <Activity size={14} className="text-teal-500" /> {p.equipmentName}
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/50">
                  <p className="text-xs text-zinc-500 mb-2 uppercase font-semibold">Specifications</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(p.specifications || {}).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-zinc-400">{key}:</span> <span className="text-white font-medium">{value as string}</span>
                      </div>
                    ))}
                    {Object.keys(p.specifications || {}).length === 0 && (
                      <div className="text-zinc-500 italic">No specs recorded</div>
                    )}
                  </div>
                </div>
                {p.notes && <p className="text-xs text-zinc-500 italic border-t border-zinc-800 pt-2">ໝາຍເຫດ: {p.notes}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">ເພີ່ມປະຫວັດການປັບແຕ່ງອຸປະກອນ (Fitting)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">ຊື່ລູກຄ້າ</label>
              <Input placeholder="ຊື່" value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">ເບີໂທ</label>
              <Input placeholder="ເບີຕິດຕໍ່" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">ປະເພດກິລາ</label>
              <Input placeholder="ເຊັ່ນ ກ໊ອຟ, ດອກປີກໄກ່" value={sportType} onChange={e => setSportType(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">ຊື່ອຸປະກອນ</label>
              <Input placeholder="ເຊັ່ນ Yonex Astrox 88D" value={equipmentName} onChange={e => setEquipmentName(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-xs text-zinc-400">ຄ່າການຕັ້ງຄ່າ (ຂັ້ນດ້ວຍໝາຍຈຸດ, ເຊັ່ນ Tension: 26lbs, String: BG80)</label>
              <Input placeholder="Tension: 26lbs, String: BG80" value={specs} onChange={e => setSpecs(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-xs text-zinc-400">ໝາຍເຫດເພີ່ມເຕີມ</label>
              <Input placeholder="ເຊັ່ນ ລູກຄ້າມັກດ້າມຈັບໜາ" value={notes} onChange={e => setNotes(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-zinc-400 hover:text-white">ຍົກເລີກ</Button>
            <Button onClick={handleCreate} disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl">ບັນທຶກຂໍ້ມູນ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
