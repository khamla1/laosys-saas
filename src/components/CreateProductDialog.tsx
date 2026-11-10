"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Image as ImageIcon, Loader2, QrCode, Tag, Sparkles, Check, X, ExternalLink } from "lucide-react";
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

const QUICK_SIZES = [
  "S", "M", "L", "XL", "XXL", "Free Size", "38", "39", "40", "41", "42", "43"
];

export function CreateProductDialog({ t }: { t?: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lists fetched from backend
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string }[]>([]);
  const [barcodesList, setBarcodesList] = useState<{ id: string; productName: string; barcode: string }[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    barcode: "",
    image: "",
  });

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]);

  // Quick Add Category State
  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

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

  useEffect(() => {
    if (open) {
      // Fetch shop's categories and inventory barcodes when opened
      fetch("/api/dashboard/categories")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setCategoriesList(data);
          }
        })
        .catch(() => {});

      fetch("/api/dashboard/barcode")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setBarcodesList(data);
          }
        })
        .catch(() => {});
    }
  }, [open]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const addCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (trimmed && !selectedSizes.includes(trimmed)) {
      setSelectedSizes((prev) => [...prev, trimmed]);
      setCustomSizeInput("");
    }
  };

  const generateRandomBarcode = () => {
    const randomCode = "LAO-" + Math.floor(100000 + Math.random() * 900000);
    setFormData((prev) => ({ ...prev, barcode: randomCode }));
    toast.success("ສ້າງ Barcode/QR ອັດຕະໂນມັດ: " + randomCode);
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
      } catch (err) {
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
      } catch (err) {
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
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock) || 0,
          category: formData.category || null,
          images: formData.image ? [formData.image] : [],
          reviewImages: reviewImages.filter(Boolean),
          metadata: {
            sizes: selectedSizes,
            barcode: formData.barcode || null,
          },
        }),
      });

      if (res.ok) {
        toast.success("ເພີ່ມສິນຄ້າສຳເລັດແລ້ວ!");
        setOpen(false);
        setFormData({
          name: "",
          description: "",
          price: "",
          stock: "",
          category: "",
          barcode: "",
          image: "",
        });
        setSelectedSizes([]);
        setReviewImages([]);
        router.refresh();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "ເກີດຂໍ້ຜິດພາດໃນການເພີ່ມສິນຄ້າ");
      }
    } catch (error) {
      console.error(error);
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເພີ່ມສິນຄ້າ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold gap-2 px-5 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-none">
          <Plus size={16} />
          {t?.trigger || "ເພີ່ມສິນຄ້າໃໝ່"}
        </Button>
      } />
      <DialogContent className="bg-zinc-950/95 border-zinc-800/80 text-white sm:max-w-[540px] max-h-[90vh] overflow-y-auto p-6 rounded-2xl relative shadow-2xl backdrop-blur-2xl">
        {/* Ambient Spotlights */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />

        <DialogHeader className="border-b border-zinc-900 pb-4 relative z-10">
          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ImageIcon size={18} />
            </span>
            {t?.title || "ເພີ່ມສິນຄ້າໃໝ່ (Add New Product)"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs sm:text-sm mt-1">
            {t?.desc || "ກຳນົດຂໍ້ມູນສິນຄ້າ, ໝວດໝູ່, ໄຊສ໌, QR Barcode ແລະ ຮູບພາບສິນຄ້າ."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 relative z-10">
          {/* Name Field */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-zinc-300 flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
              {t?.nameLabel || "ຊື່ສິນຄ້າ *"}
            </Label>
            <Input
              id="name"
              required
              placeholder={t?.namePlaceholder || "ຕົວຢ່າງ: ເສື້ອຢືດຝ້າຍລາວ, ເຝີງົວຈານໃຫຍ່..."}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-11 bg-zinc-900/40 border-zinc-800 text-white focus-visible:ring-1 focus-visible:ring-blue-500/50 rounded-xl transition-all placeholder:text-zinc-600"
            />
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-zinc-300 flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
              {t?.descLabel || "ລາຍລະອຽດສິນຄ້າ (Optional)"}
            </Label>
            <Input
              id="description"
              placeholder={t?.descPlaceholder || "ຕົວຢ່າງ: ຜ້າຝ້າຍ 100%, ແຊບນົວພິເສດ..."}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="h-11 bg-zinc-900/40 border-zinc-800 text-white focus-visible:ring-1 focus-visible:ring-blue-500/50 rounded-xl transition-all placeholder:text-zinc-600"
            />
          </div>

          {/* Category Dropdown & Custom Option */}
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
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-0.5 transition-colors"
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
                  <span>ເພີ່ມໝວດໝູ່ສິນຄ້າໃໝ່ເຂົ້າລະບົບ:</span>
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
                    placeholder="ຊື່ໝວດໝູ່ໃໝ່ (ຕົວຢ່າງ: ເສື້ອກິລາ, ຖົງມື, ໝວກ...)"
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
                {/* Dynamic categories from shop */}
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
                {/* Default categories */}
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

            {/* Direct button below the select */}
            <div className="flex items-center justify-between pt-0.5 text-[11px] text-zinc-500">
              <span>ບໍ່ພົບໝວດໝູ່ທີ່ຕ້ອງການ?</span>
              <button
                type="button"
                onClick={() => setShowQuickAddCat(true)}
                className="text-blue-400 hover:underline font-semibold flex items-center gap-0.5"
              >
                <Plus size={11} />
                <span>ເພີ່ມໝວດໝູ່ໃໝ່ທັນທີ</span>
              </button>
            </div>
          </div>

          {/* QR Code / Barcode Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300 flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                <QrCode size={14} className="text-purple-400" />
                QR / Barcode ສິນຄ້າ (ເລືອກຈາກລະບົບ ຫຼື ສ້າງໃໝ່)
              </Label>
              <button
                type="button"
                onClick={generateRandomBarcode}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-md transition-colors"
              >
                <Sparkles size={11} />
                ສ້າງອັດຕະໂນມັດ
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="ລະຫັດ Barcode / QR-SKU..."
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="h-11 bg-zinc-900/40 border-zinc-800 text-white rounded-xl flex-1"
              />
              {barcodesList.length > 0 && (
                <Select
                  value={formData.barcode}
                  onValueChange={(val) => setFormData({ ...formData, barcode: (val === "" || val === null) ? "" : val })}
                >
                  <SelectTrigger className="w-40 h-11 bg-zinc-900/40 border-zinc-800 text-white rounded-xl text-xs">
                    <SelectValue placeholder="ເລືອກ QR" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {barcodesList.map((item) => (
                      <SelectItem key={item.id} value={item.barcode}>
                        {item.barcode} ({item.productName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Sizes / Variants Selector */}
          <div className="space-y-2 border border-zinc-800/80 bg-zinc-900/20 p-3 rounded-xl">
            <Label className="text-zinc-300 flex items-center justify-between font-semibold text-xs sm:text-sm">
              <span>ຂະໜາດ / ໄຊສ໌ (Size & Variants)</span>
              <span className="text-[11px] text-zinc-400">ເລືອກໄດ້ຫຼາຍໄຊສ໌</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SIZES.map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 text-white shadow-md shadow-blue-500/20"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {size}
                    {isSelected && <Check size={12} />}
                  </button>
                );
              })}
            </div>
            {/* Custom size input */}
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="ເພີ່ມໄຊສ໌ເອງ (ຕົວຢ່າງ: 50ml, ຈອກໃຫຍ່)..."
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSize();
                  }
                }}
                className="h-9 bg-zinc-900/60 border-zinc-800 text-xs text-white rounded-lg"
              />
              <Button
                type="button"
                onClick={addCustomSize}
                className="h-9 px-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg"
              >
                + ເພີ່ມ
              </Button>
            </div>
            {selectedSizes.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1 border-t border-zinc-800/60">
                <span className="text-[11px] text-zinc-400 self-center mr-1">ໄຊສ໌ທີ່ເລືອກ:</span>
                {selectedSizes.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md text-xs font-semibold"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => toggleSize(s)}
                      className="hover:text-red-400 ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Price & Stock Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-zinc-300 flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                {t?.priceLabel || "ລາຄາ (₭) *"}
              </Label>
              <Input
                id="price"
                type="number"
                min="5000"
                step="1"
                required
                placeholder={t?.pricePlaceholder || "25,000"}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="h-11 bg-zinc-900/40 border-zinc-800 text-white focus-visible:ring-1 focus-visible:ring-blue-500/50 rounded-xl transition-all placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock" className="text-zinc-300 flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                {t?.stockLabel || "ຈຳນວນສະຕັອກ *"}
              </Label>
              <Input
                id="stock"
                type="number"
                required
                placeholder={t?.stockPlaceholder || "50"}
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="h-11 bg-zinc-900/40 border-zinc-800 text-white focus-visible:ring-1 focus-visible:ring-blue-500/50 rounded-xl transition-all placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Main Image Uploader */}
          <div className="space-y-1.5">
            <Label className="text-zinc-300 flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
              {t?.imageLabel || "ຮູບພາບຫຼັກຂອງສິນຄ້າ"}
            </Label>
            {!formData.image ? (
              <label className="relative group/upload flex flex-col items-center justify-center w-full h-28 border border-dashed border-zinc-800 hover:border-blue-500/50 bg-zinc-900/20 hover:bg-zinc-900/40 rounded-2xl cursor-pointer transition-all duration-300">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <div className="flex flex-col items-center justify-center pt-3 pb-3 text-center px-4">
                  <span className="p-2 bg-zinc-900/80 group-hover/upload:bg-blue-500/10 group-hover/upload:text-blue-400 text-zinc-400 rounded-xl border border-zinc-800 group-hover/upload:border-blue-500/20 transition-all duration-300 mb-1.5">
                    <Upload size={16} />
                  </span>
                  <p className="text-xs font-bold text-zinc-300 group-hover/upload:text-white transition-colors">
                    ຄລິກເພື່ອອັບໂຫຼດຮູບພາບຫຼັກຂອງສິນຄ້າ
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    ຮອງຮັບ PNG, JPG, JPEG (ສູງສຸດ 100MB)
                  </p>
                </div>
              </label>
            ) : (
              <div className="relative w-full h-32 bg-zinc-900/20 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center group/preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.image} alt="Preview" className="max-h-full object-contain" />

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, image: "" }))}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-500 text-white rounded-lg transition-colors border border-red-400/20 shadow-md opacity-0 group-hover/preview:opacity-100 duration-200"
                >
                  <Plus size={14} className="rotate-45" />
                </button>
              </div>
            )}
          </div>

          {/* Supplementary / Review Photos Section */}
          <div className="space-y-1.5">
            <Label className="text-zinc-300 flex items-center justify-between font-semibold text-xs sm:text-sm">
              <span>ຮູບພາບເພີ່ມເຕີມ (ຮູບຈິງຈາກຮ້ານ)</span>
              <span className="text-[10px] text-zinc-500 font-medium">ສູງສຸດ 4 ຮູບ</span>
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, index) => {
                const img = reviewImages[index];
                return (
                  <div key={index} className="aspect-square relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/25 hover:border-blue-500/40 transition-all flex items-center justify-center">
                    {img ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`Review ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeReviewImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                        >
                          <Plus size={10} className="rotate-45" />
                        </button>
                      </>
                    ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/30">
                        <Plus size={16} className="text-zinc-500" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleReviewImageChange(e, index)}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Trigger */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-12 mt-4 rounded-xl shadow-[0_4px_15px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-none"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t?.creating || "ກຳລັງບັນທຶກສິນຄ້າ..."}
              </>
            ) : (
              t?.create || "ບັນທຶກສິນຄ້າໃໝ່ (Save Product)"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
