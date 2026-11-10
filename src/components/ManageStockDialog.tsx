"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Minus, Package, ClipboardList, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  images: string[];
  reviewImages?: string[];
};

export function ManageStockDialog({ product }: { product: Product }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"ADD" | "REMOVE" | null>(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setMode(null);
      setQuantity("");
      setReason("");
    }
  };

  const handleSelectMode = (newMode: "ADD" | "REMOVE") => {
    setMode(newMode);
    setQuantity("");
    setReason("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyVal = parseInt(quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      toast.error("ກະລຸນາໃສ່ຈຳນວນທີ່ຖືກຕ້ອງ ແລະ ຫຼາຍກວ່າ 0");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/products/${product.id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mode,
          quantity: qtyVal,
          reason: reason || undefined,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        const updatedStock = result.product?.stock ?? product.stock;
        toast.success(`ອັບເດດສະຕັອກສຳເລັດ! ສະຕັອກໃໝ່: ${updatedStock}`);
        setOpen(false);
        setMode(null);
        setQuantity("");
        setReason("");
        router.refresh();
      } else {
        const err = await res.text();
        let errorMessage = "ບໍ່ສາມາດອັບເດດສະຕັອກໄດ້";
        try {
          const errData = JSON.parse(err);
          errorMessage = errData.error || errorMessage;
        } catch {
          errorMessage = err || errorMessage;
        }
        
        if (errorMessage === "Product is not active") {
          toast.error("This product is no longer available");
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບເດດ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        <button 
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 shrink-0" 
          title="ຈັດການສະຕັອກ (Manage Stock)"
        >
          <Package size={14} />
          <span>ຈັດການສະຕັອກ</span>
        </button>
      } />
      <DialogContent className="bg-zinc-950/95 border-zinc-800/80 text-white sm:max-w-[480px] p-6 overflow-hidden rounded-2xl relative shadow-2xl backdrop-blur-2xl">
        {/* Ambient Spotlights */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />

        <DialogHeader className="border-b border-zinc-900 pb-4 relative z-10">
          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Package size={18} />
            </span>
            ຈັດການສະຕັອກ (Manage Stock)
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs sm:text-sm mt-1">
            ເພີ່ມ ຫຼື ຫຼຸດຈຳນວນສະຕັອກສິນຄ້າໃນລະບົບ
          </DialogDescription>
        </DialogHeader>

        {/* Product Details Card */}
        <div className="flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl mt-4 relative z-10">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-lg overflow-hidden border border-zinc-700/50 flex items-center justify-center shrink-0">
            {product.images && product.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={24} className="text-zinc-650" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-zinc-100 truncate">{product.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-zinc-500 font-medium">ສະຕັອກປັດຈຸບັນ:</span>
              <span className="text-sm font-black text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                {product.stock}
              </span>
            </div>
          </div>
        </div>

        {!mode ? (
          /* Step 1: Mode Selection */
          <div className="grid grid-cols-2 gap-4 py-6 relative z-10">
            <Button
              type="button"
              onClick={() => handleSelectMode("ADD")}
              className="h-24 bg-zinc-900/40 border border-zinc-850 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-white flex flex-col items-center justify-center gap-2 rounded-2xl transition-all duration-300 group shadow-md"
            >
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <Plus size={20} />
              </span>
              <span className="text-xs font-bold tracking-wide text-zinc-350 group-hover:text-emerald-400 transition-colors">
                ເພີ່ມສິນຄ້າ
              </span>
            </Button>
            <Button
              type="button"
              onClick={() => handleSelectMode("REMOVE")}
              className="h-24 bg-zinc-900/40 border border-zinc-850 hover:border-red-500/50 hover:bg-red-500/5 text-white flex flex-col items-center justify-center gap-2 rounded-2xl transition-all duration-300 group shadow-md"
            >
              <span className="p-2 rounded-xl bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
                <Minus size={20} />
              </span>
              <span className="text-xs font-bold tracking-wide text-zinc-350 group-hover:text-red-400 transition-colors">
                ຫຼຸດສິນຄ້າ
              </span>
            </Button>
          </div>
        ) : (
          /* Step 2: Input Quantity & Reason */
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 relative z-10">
            <button
              type="button"
              onClick={() => setMode(null)}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors mb-2"
            >
              <ArrowLeft size={12} />
              ກັບຄືນ
            </button>

            <div className="p-3 bg-zinc-900/20 border border-zinc-900 rounded-xl flex items-center gap-2.5 mb-2">
              <span className={`p-1.5 rounded-lg ${mode === "ADD" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                {mode === "ADD" ? <Plus size={14} /> : <Minus size={14} />}
              </span>
              <span className="text-xs text-zinc-300 font-semibold">
                {mode === "ADD" ? "ກຳລັງເຮັດລາຍການ: ເພີ່ມສິນຄ້າ (+)" : "ກຳລັງເຮັດລາຍການ: ຫຼຸດສິນຄ້າ (-)"}
              </span>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="stock-qty" className="text-zinc-350 flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                ຈຳນວນ
              </Label>
              <Input
                id="stock-qty"
                type="number"
                required
                min="1"
                placeholder="ປ້ອນຈຳນວນສິນຄ້າ..."
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-11 sm:h-12 bg-zinc-900/40 border-zinc-850 text-white focus-visible:ring-1 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50 rounded-xl transition-all duration-300 placeholder:text-zinc-600"
              />
            </div>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="stock-reason" className="text-zinc-350 flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                ເຫດຜົນ / ລາຍລະອຽດ
              </Label>
              <Input
                id="stock-reason"
                placeholder={mode === "ADD" ? "ຕົວຢ່າງ: ຮັບສິນຄ້າຈາກຜູ້ສະໜອງ..." : "ຕົວຢ່າງ: ສິນຄ້າຊຳລຸດ..."}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-11 sm:h-12 bg-zinc-900/40 border-zinc-850 text-white focus-visible:ring-1 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50 rounded-xl transition-all duration-300 placeholder:text-zinc-600"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-900 mt-6 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl h-12 px-6"
              >
                ຍົກເລີກ
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className={`text-white font-bold h-12 px-6 rounded-xl border-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                  mode === "ADD" 
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_4px_15px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)]" 
                    : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-[0_4px_15px_rgba(239,68,68,0.25)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.4)]"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ກຳລັງບັນທຶກ...
                  </>
                ) : (
                  "ບັນທຶກ"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
