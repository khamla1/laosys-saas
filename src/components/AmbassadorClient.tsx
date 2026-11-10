"use client";

import { useState, useEffect } from "react";
import { Plus, Award, Loader2, Link as LinkIcon, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Ambassador = {
  id: string;
  name: string;
  sportType: string;
  socialMedia: string;
  promoCode: string;
  status: string;
  sponsorshipAmount: number;
  salesGenerated: number;
};

export function AmbassadorClient() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [sportType, setSportType] = useState("");
  const [socialMedia, setSocialMedia] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [sponsorshipAmount, setSponsorshipAmount] = useState("0");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/ambassadors");
      if (res.ok) setAmbassadors(await res.json());
    } catch (error) {
      toast.error("Failed to load ambassadors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !sportType) {
      toast.error("Please fill required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ambassadors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sportType, socialMedia, promoCode, sponsorshipAmount }),
      });
      if (res.ok) {
        toast.success("Ambassador added!");
        setIsDialogOpen(false);
        fetchData();
        setName(""); setSportType(""); setSocialMedia(""); setPromoCode(""); setSponsorshipAmount("0");
      }
    } catch (error) {
      toast.error("Error creating ambassador");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Award className="text-pink-500" />
            ແອມບາສເດີແລະສະປອນເຊີ (Brand Ambassador)
          </h1>
          <p className="text-zinc-400 mt-1">ຈັດການນັກກິລາໃນສັງກັດແລະຕິດຕາມຍອດຂາຍຈາກ Promo Code</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-pink-600 hover:bg-pink-700 text-white gap-2 rounded-xl h-11">
          <Plus size={18} /> ເພີ່ມນັກກິລາໃນສັງກັດ
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-zinc-500" /></div>
      ) : ambassadors.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/50 border-zinc-800 border-dashed border-2 rounded-2xl">
          <Award size={48} className="text-zinc-600 mb-4" />
          <h3 className="text-xl font-semibold text-white">ຍັງບໍ່ມີນັກກິລາໃນສັງກັດ</h3>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="mt-4 rounded-xl">ເພີ່ມ Ambassador ຄົນທຳອິດ</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ambassadors.map(a => (
            <Card key={a.id} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center text-xl font-bold uppercase">
                    {a.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{a.name}</h3>
                    <p className="text-sm text-zinc-400 font-medium">{a.sportType}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${a.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                  {a.status}
                </span>
              </div>
              <div className="space-y-3 mt-2">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <LinkIcon size={14} /> {a.socialMedia || "No Social Media"}
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-zinc-800 pt-3">
                  <div className="bg-zinc-950 p-2 rounded-lg">
                    <p className="text-xs text-zinc-500 mb-1">ງົບສະປອນເຊີ</p>
                    <p className="text-sm font-bold text-pink-400">฿{a.sponsorshipAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded-lg">
                    <p className="text-xs text-zinc-500 mb-1">ຍອດຂາຍທີ່ເຮັດໄດ້ (Promo: {a.promoCode || '-'})</p>
                    <p className="text-sm font-bold text-green-400">฿{a.salesGenerated.toLocaleString()}</p>
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
            <DialogTitle className="text-white">ເພີ່ມນັກກິລາ Brand Ambassador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-xs text-zinc-400">ຊື່-ນາມສະກຸນ</label>
              <Input placeholder="ເຊັ່ນ ລັດຊະນົກ ອິນທະນົນ" value={name} onChange={e => setName(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">ປະເພດກິລາ</label>
              <Input placeholder="ເຊັ່ນ ແບດມິນຕັນ" value={sportType} onChange={e => setSportType(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Social Media</label>
              <Input placeholder="ເຊັ່ນ @username" value={socialMedia} onChange={e => setSocialMedia(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Promo Code (ສຳລັບໃຫ້ FC)</label>
              <Input placeholder="ເຊັ່ນ MAY10" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl uppercase" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">ງົບສະໜັບສະໜູນ (ບາດ/ປີ)</label>
              <Input type="number" min="0" value={sponsorshipAmount} onChange={e => setSponsorshipAmount(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-zinc-400 hover:text-white">ຍົກເລີກ</Button>
            <Button onClick={handleCreate} disabled={isSubmitting} className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl">ເພີ່ມຂໍ້ມູນ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
