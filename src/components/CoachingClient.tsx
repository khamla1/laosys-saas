"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Loader2, Calendar, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type CoachingClass = {
  id: string;
  name: string;
  coachName: string;
  maxStudents: number;
  currentStudents: number;
  scheduleInfo: string;
  price: number;
  status: string;
};

export function CoachingClient() {
  const [classes, setClasses] = useState<CoachingClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [coachName, setCoachName] = useState("");
  const [maxStudents, setMaxStudents] = useState("10");
  const [scheduleInfo, setScheduleInfo] = useState("");
  const [price, setPrice] = useState("0");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/coaching");
      if (res.ok) setClasses(await res.json());
    } catch (error) {
      toast.error("Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !coachName || !scheduleInfo) {
      toast.error("Please fill required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, coachName, maxStudents, scheduleInfo, price }),
      });
      if (res.ok) {
        toast.success("Class created!");
        setIsDialogOpen(false);
        fetchData();
        setName(""); setCoachName(""); setMaxStudents("10"); setScheduleInfo(""); setPrice("0");
      }
    } catch (error) {
      toast.error("Error creating class");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Star className="text-yellow-500" />
            ກອງປະຊຸມແລະຫ້ອງຮຽນ (Classes & Coaching)
          </h1>
          <p className="text-zinc-400 mt-1">ຈັດການຕາຕະລາງຫ້ອງຮຽນ, ຄູຝຶກ, ແລະ ນັກຮຽນ</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white gap-2 rounded-xl h-11">
          <Plus size={18} /> ເປີດຫ້ອງຮຽນໃໝ່
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-zinc-500" /></div>
      ) : classes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/50 border-zinc-800 border-dashed border-2 rounded-2xl">
          <Star size={48} className="text-zinc-600 mb-4" />
          <h3 className="text-xl font-semibold text-white">ຍັງບໍ່ມີຫ້ອງຮຽນເທື່ອ</h3>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="mt-4 rounded-xl">ສ້າງຫ້ອງຮຽນທຳອິດຂອງທ່ານ</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(c => (
            <Card key={c.id} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{c.name}</h3>
                  <p className="text-sm text-yellow-500 font-medium mt-1">ໂດຍ ຄູຝຶກ {c.coachName}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${c.status === 'OPEN' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                  {c.status}
                </span>
              </div>
              <div className="space-y-3 mt-2">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Calendar size={14} /> {c.scheduleInfo}
                </div>
                <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Users size={14} className="text-blue-400" /> {c.currentStudents} / {c.maxStudents} ຄົນ
                  </div>
                  <div className="text-sm font-bold text-white">
                    ฿{c.price.toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">ສ້າງຫ້ອງຮຽນໃໝ່</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-xs text-zinc-400">ຊື່ຫ້ອງຮຽນ</label>
              <Input placeholder="ເຊັ່ນ ໂຍຄະພື້ນຖານ, ຄລີນິກສອນເຕະບານ" value={name} onChange={e => setName(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">ຊື່ຜູ້ສອນ (Coach)</label>
              <Input placeholder="ຊື່ຄູຝຶກ" value={coachName} onChange={e => setCoachName(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">ຮັບຈຳນວນຈຳກັດ (ຄົນ)</label>
              <Input type="number" min="1" value={maxStudents} onChange={e => setMaxStudents(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-xs text-zinc-400">ວັນເວລາທີ່ຮຽນ (Schedule)</label>
              <Input placeholder="ເຊັ່ນ ທຸກໆວັນເສົາ 10:00 - 12:00 ໂມງ" value={scheduleInfo} onChange={e => setScheduleInfo(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">ຄ່າຮຽນ (ບາດ)</label>
              <Input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-zinc-400 hover:text-white">ຍົກເລີກ</Button>
            <Button onClick={handleCreate} disabled={isSubmitting} className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl">ເປີດຫ້ອງຮຽນ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
