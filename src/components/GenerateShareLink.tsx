"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link2, Copy, Check, Lightbulb } from "lucide-react";
import { toast } from "sonner";

export function GenerateShareLink({ productIds }: { productIds: string[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState("10");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/share-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds,
          durationMinutes: parseInt(duration)
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const fullLink = `${window.location.origin}${data.link}`;
        setGeneratedLink(fullLink);
        toast.success("ສ້າງລິ້ງສຳເລັດແລ້ວ!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to generate link");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while generating the link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setGeneratedLink(""); }}>
      <DialogTrigger render={
        <Button 
          variant="default" 
          size="sm" 
          disabled={productIds.length === 0}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] h-9 px-4 gap-2 transition-all duration-300 rounded-xl"
        >
          <Link2 size={16} /> ສ້າງລິ້ງຂາຍ ({productIds.length} ລາຍການ)
        </Button>
      } />
      <DialogContent className="bg-zinc-950/80 backdrop-blur-2xl border-blue-500/20 text-white sm:max-w-[425px] rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-white/5 overflow-hidden">
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none animate-pulse" />
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none animate-pulse delay-1000" />
        
        <DialogHeader className="relative z-10 border-b border-zinc-800/50 pb-4">
          <DialogTitle className="text-xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-400" /> ສ້າງລິ້ງ FOMO
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 pt-4 relative z-10">
          {!generatedLink ? (
            <>
              <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-xl flex gap-3 text-sm shadow-[inset_0_0_15px_rgba(59,130,246,0.05)]">
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                <div>
                  <p className="font-bold text-blue-400 mb-1">ວິທີນຳໃຊ້ (How to use)</p>
                  <p className="text-blue-100/80 text-xs leading-relaxed">
                    ກັອບປີ້ລິ້ງແລ້ວສົ່ງໃຫ້ລູກຄ້າ ເພື່ອໃຫ້ພວກເຂົາສາມາດກົດສັ່ງຊື້ສິນຄ້າທີ່ເລືອກໄວ້ດ້ວຍຕົນເອງໄດ້ທັນທີ ກ່ອນເວລາທີ່ກຳນົດຈະໝົດ!
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">ເວລາໝົດອາຍຸຂອງລິ້ງ (Link Expiration Time)</label>
                <select 
                  value={duration} 
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-12 px-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer hover:bg-zinc-800/50"
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                >
                  <option value="10">10 ນາທີ (Flash Sale)</option>
                  <option value="30">30 ນາທີ</option>
                  <option value="60">1 ຊົ່ວໂມງ</option>
                  <option value="1440">24 ຊົ່ວໂມງ</option>
                </select>
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={loading} 
                className="relative w-full h-12 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.3)] font-bold uppercase tracking-wide overflow-hidden group transition-all"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-[position:200%_0,0_0] bg-no-repeat transition-[background-position_0s_ease] group-hover:bg-[position:-200%_0,0_0] group-hover:duration-[1500ms]" />
                <span className="relative z-10">{loading ? "ກຳລັງສ້າງ..." : "ສ້າງລິ້ງ (Generate Link)"}</span>
              </Button>
            </>
          ) : (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
                <div className="mt-0.5 bg-emerald-500/20 p-1 rounded-full text-emerald-400 shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-400">ສ້າງລິ້ງສຳເລັດແລ້ວ! (Link Generated Successfully!)</p>
                  <p className="text-xs text-emerald-500/80 mt-1">ລິ້ງນີ້ຈະໝົດອາຍຸອັດຕະໂນມັດໃນ {duration} ນາທີ.</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">ລິ້ງ FOMO ຂອງທ່ານ (Your FOMO Link)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={generatedLink} 
                    className="flex-1 bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button 
                    onClick={handleCopy} 
                    className="h-auto px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-white shadow-sm transition-colors"
                  >
                    {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
