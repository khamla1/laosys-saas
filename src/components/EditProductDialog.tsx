"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Loader2, Upload, Settings, Plus, Tag, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const DEFAULT_CATEGORIES = [
  "ອາຫານ (Food)",
  "ເຄື່ອງດື່ມ (Beverages)",
  "ເຄື່ອງແຕ່ງກາຍ (Fashion)",
  "ເຄື່ອງສຳອາງ (Cosmetics)",
  "ອຸປະກອນກິລາ (Sports & Fitness)",
  "ເຄື່ອງໃຊ້ໄຟຟ້າ (Electronics)",
  "ບໍລິການ (Services & Care)",
  "ຄລີນິກ / ສະປາ (Clinic & Spa)",
  "ສິນຄ້າທົ່ວໄປ (General Retail)"
];

export function EditProductDialog({ product, isAdmin, t }: { product: any, isAdmin: boolean, t: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string }[]>([]);

  // Quick Add Category State
  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || "",
    category: product.category || "",
    price: product.price.toString(),
    stock: product.stock.toString(),
    image: product.images?.[0] || "",
  });
  const [reviewImages, setReviewImages] = useState<string[]>(product.reviewImages || []);

  useEffect(() => {
    if (open) {
      setFormData({
        name: product.name,
        description: product.description || "",
        category: product.category || "",
        price: product.price.toString(),
        stock: product.stock.toString(),
        image: product.images?.[0] || "",
      });
      setReviewImages(product.reviewImages || []);

      fetch("/api/dashboard/categories")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setCategoriesList(data);
          }
        })
        .catch(() => {});
    }
  }, [open, product]);

  const handleQuickSaveCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCatInput.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ໝວດໝູ່ໃໝ່");
    }
    setIsSavingCategory(true);
    try {
      const res = await fetch("/api/dashboard/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatInput.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        const catName = created.name || newCatInput.trim();
        setCategoriesList(prev => [{ id: created.id || Date.now().toString(), name: catName }, ...prev]);
        setFormData(prev => ({ ...prev, category: catName }));
        setNewCatInput("");
        setShowQuickAddCat(false);
        toast.success(`ເພີ່ມໝວດໝູ່ "${catName}" ສຳເລັດ`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "ບໍ່ສາມາດເພີ່ມໝວດໝູ່ໄດ້");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("ຂະໜາດຮູບພາບໃຫຍ່ເກີນໄປ (ສູງສຸດ 100MB)");
        return;
      }
      
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      
      const uploadToast = toast.loading("ກຳລັງອັບໂຫຼດຮູບພາບ...");
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formDataUpload });
        const data = await res.json();
        if (data.url) {
          setFormData((prev) => ({ ...prev, image: data.url }));
          toast.success("ອັບໂຫຼດຮູບພາບສຳເລັດ", { id: uploadToast });
        } else {
          toast.error(data.error || "ການອັບໂຫຼດລົ້ມເຫຼວ", { id: uploadToast });
        }
      } catch {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດຮູບພາບ", { id: uploadToast });
      }
    }
  };

  const handleReviewImageChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("ຂະໜາດຮູບພາບໃຫຍ່ເກີນໄປ (ສູງສຸດ 100MB)");
        return;
      }
      
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      
      const uploadToast = toast.loading("ກຳລັງອັບໂຫຼດຮູບພາບ...");
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formDataUpload });
        const data = await res.json();
        if (data.url) {
          setReviewImages((prev) => {
            const updated = [...prev];
            updated[index] = data.url;
            return updated;
          });
          toast.success("ອັບໂຫຼດຮູບພາບສຳເລັດ", { id: uploadToast });
        } else {
          toast.error(data.error || "ການອັບໂຫຼດລົ້ມເຫຼວ", { id: uploadToast });
        }
      } catch {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດຮູບພາບ", { id: uploadToast });
      }
    }
  };

  const removeReviewImage = (index: number) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category || null,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          images: formData.image ? [formData.image] : [],
          reviewImages: reviewImages.filter(Boolean),
        }),
      });
      
      if (res.ok) {
        toast.success("ອັບເດດຂໍ້ມູນສິນຄ້າສຳເລັດ");
        setOpen(false);
        router.refresh();
      } else {
        const err = await res.text();
        let errorMessage = "ບໍ່ສາມາດອັບເດດຂໍ້ມູນສິນຄ້າໄດ້";
        try {
          const errData = JSON.parse(err);
          errorMessage = errData.error || errorMessage;
        } catch {
          errorMessage = err || errorMessage;
        }
        
        if (errorMessage === "Product is not active") {
          toast.error("ສິນຄ້ານີ້ບໍ່ສາມາດແກ້ໄຂໄດ້");
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <button 
          className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95" 
          title={t.trigger}
        >
          <Edit2 size={16} />
        </button>
      } />
      <DialogContent className="bg-zinc-950/95 border-zinc-800/80 text-white sm:max-w-[500px] p-6 overflow-hidden rounded-2xl relative shadow-2xl backdrop-blur-2xl max-h-[90vh] flex flex-col">
        {/* Ambient Spotlights */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />

        <DialogHeader className="border-b border-zinc-900 pb-4 relative z-10">
          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Settings size={18} />
            </span>
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs sm:text-sm mt-1">
            {t.desc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 relative z-10 overflow-y-auto pr-1">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor={`name-${product.id}`} className="text-zinc-350 flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
              {t.nameLabel}
            </Label>
            <Input 
              id={`name-${product.id}`}
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-11 sm:h-12 bg-zinc-900/40 border-zinc-850 text-white focus-visible:ring-1 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 rounded-xl transition-all duration-300" 
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor={`desc-${product.id}`} className="text-zinc-350 flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
              {t.descLabel}
            </Label>
            <Input 
              id={`desc-${product.id}`}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="h-11 sm:h-12 bg-zinc-900/40 border-zinc-850 text-white focus-visible:ring-1 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 rounded-xl transition-all duration-300" 
            />
          </div>

          {/* Category Dropdown & Quick Add Button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300 flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                <Tag size={14} className="text-blue-400" />
                ໝວດໝູ່ສິນຄ້າ (Category)
              </Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddCat(!showQuickAddCat)}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-lg border border-blue-500/30 transition-all"
                >
                  <Plus size={12} />
                  <span>+ ເພີ່ມໝວດໝູ່ໃໝ່</span>
                </button>
                <Link
                  href="/dashboard/categories"
                  target="_blank"
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-0.5"
                >
                  <span>ຈັດການ</span>
                  <ExternalLink size={10} />
                </Link>
              </div>
            </div>

            {/* Quick Add Inline Form */}
            {showQuickAddCat && (
              <div className="p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs text-blue-300 font-semibold">
                  <span>ເພີ່ມໝວດໝູ່ສິນຄ້າໃໝ່:</span>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCat(false)}
                    className="text-zinc-500 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    autoFocus
                    placeholder="ຊື່ໝວດໝູ່ໃໝ່..."
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    className="h-9 bg-zinc-950 border-zinc-700 text-xs text-white"
                  />
                  <Button
                    type="button"
                    onClick={handleQuickSaveCategory}
                    disabled={isSavingCategory}
                    className="h-9 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0"
                  >
                    {isSavingCategory ? <Loader2 size={12} className="animate-spin" /> : "ບັນທຶກ"}
                  </Button>
                </div>
              </div>
            )}

            <Select
              value={formData.category}
              onValueChange={(val) => {
                if (val === "__ADD_NEW_CAT__") {
                  setShowQuickAddCat(true);
                } else {
                  setFormData({ ...formData, category: (val === "" || val === null) ? "" : val });
                }
              }}
            >
              <SelectTrigger className="h-11 bg-zinc-900/40 border-zinc-800 text-white rounded-xl">
                <SelectValue placeholder="-- ເລືອກໝວດໝູ່ສິນຄ້າ --" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                {categoriesList.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                      ໝວດໝູ່ທີ່ຕັ້ງໄວ້ໃນຮ້ານ ({categoriesList.length})
                    </div>
                    {categoriesList.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </>
                )}
                <div className="px-2 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mt-1 border-t border-zinc-800 pt-1">
                  ໝວດໝູ່ມາດຕະຖານ (Standard)
                </div>
                {DEFAULT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                <SelectItem value="__ADD_NEW_CAT__" className="text-blue-400 font-bold bg-zinc-800/80 mt-1 border-t border-zinc-800">
                  + ເພີ່ມໝວດໝູ່ໃໝ່...
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price & Stock Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`price-${product.id}`} className="text-zinc-350 flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                {t.priceLabel} {isAdmin && <span className="text-emerald-400 text-[10px] ml-1 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">(Admin)</span>}
              </Label>
              <Input 
                id={`price-${product.id}`}
                type="number"
                min={isAdmin ? "0" : "5000"}
                step="1"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="h-11 sm:h-12 bg-zinc-900/40 border-zinc-850 text-white focus-visible:ring-1 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 rounded-xl transition-all duration-300" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`stock-${product.id}`} className="text-zinc-350 flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                {t.stockLabel}
              </Label>
              <Input 
                id={`stock-${product.id}`}
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="h-11 sm:h-12 bg-zinc-900/40 border-zinc-850 text-white focus-visible:ring-1 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 rounded-xl transition-all duration-300" 
              />
            </div>
          </div>

          {/* Main Image Uploader */}
          <div className="space-y-2">
            <Label className="text-zinc-350 flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
              {t.imageLabel}
            </Label>
            {!formData.image ? (
              <label className="relative group/upload flex flex-col items-center justify-center w-full h-32 border border-dashed border-zinc-800 hover:border-blue-500/50 bg-zinc-900/20 hover:bg-zinc-900/40 rounded-2xl cursor-pointer transition-all duration-300">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                  disabled={isAdmin}
                />
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  <span className="p-2.5 bg-zinc-900/80 group-hover/upload:bg-blue-500/10 group-hover/upload:text-blue-400 text-zinc-400 rounded-xl border border-zinc-800 group-hover/upload:border-blue-500/20 transition-all duration-300 mb-2">
                    <Upload size={16} />
                  </span>
                  <p className="text-xs font-bold text-zinc-300 group-hover/upload:text-white transition-colors">
                    ຄລິກເພື່ອອັບໂຫຼດຮູບພາບຫຼັກຂອງສິນຄ້າ
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    ຮອງຮັບ PNG, JPG, JPEG (ສູງສຸດ 100MB)
                  </p>
                </div>
              </label>
            ) : (
              <div className="relative w-full h-36 bg-zinc-900/20 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center group/preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.image} alt="Preview" className="max-h-full object-contain" />
                
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, image: "" }))}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-red-500/90 hover:bg-red-500 text-white rounded-lg transition-colors border border-red-400/20 shadow-md opacity-0 group-hover/preview:opacity-100 duration-200"
                  >
                    <Plus size={14} className="rotate-45" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Footer Buttons */}
          <DialogFooter className="pt-4 border-t border-zinc-900 mt-6 flex gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)} 
              className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl h-11 px-6"
            >
              {t.cancel}
            </Button>
            <Button 
              type="submit" 
              disabled={loading || isAdmin} 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 px-6 rounded-xl shadow-[0_4px_15px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-all duration-300 active:scale-[0.98] border-none"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.saving}
                </>
              ) : (
                t.save
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
