"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Upload, QrCode, Tag, Plus, Trash2, Check, X,
  ShoppingBag, Store, ArrowLeft, Loader2, DollarSign,
  Layers, Package, AlertCircle, Camera, Star, ExternalLink,
  HelpCircle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const SIZE_PRESETS = {
  apparel: { label: "ເສື້ອຜ້າ (Apparel)", sizes: ["S", "M", "L", "XL", "XXL", "3XL", "Free Size"] },
  shoes: { label: "ເກີບ (Shoes)", sizes: ["37", "38", "39", "40", "41", "42", "43", "44", "45"] },
  drinks: { label: "ເຄື່ອງດື່ມ/ອາຫານ (Drinks/Food)", sizes: ["ຈອກນ້ອຍ (S)", "ຈອກກາງ (M)", "ຈອກໃຫຍ່ (L)", "ຈານນ້ອຍ", "ຈານໃຫຍ່", "ພິເສດ"] },
  services: { label: "ຄລີນິກ/ບໍລິການ (Services)", sizes: ["ຄັ້ງດຽວ (1 Session)", "ຄອສ 5 ຄັ້ງ", "ຄອສ 10 ຄັ້ງ", "VIP"] },
  general: { label: "ທົ່ວໄປ (General)", sizes: ["ຊິ້ນ (Piece)", "ແພັກ (Pack)", "ກ່ອງ (Box)", "ໂหล (Dozen)"] },
};

const SAMPLE_UNSPLASH_IMAGES = [
  { name: "ກາເຟເຢັນ (Iced Coffee)", url: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80" },
  { name: "ເສື້ອຢືດຝ້າຍ (Cotton T-Shirt)", url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80" },
  { name: "ເກີບກິລາ (Running Shoes)", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80" },
  { name: "ເຊຣັ່ມບຳລຸງຜິວ (Facial Serum)", url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80" },
  { name: "ຫູຟັງໄຮ້ສາຍ (Wireless Earbuds)", url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80" },
  { name: "ໄມ້ຕີດອກປີກໄກ່ (Badminton Racket)", url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80" },
];

type VariantRow = {
  size: string;
  price: number;
  stock: number;
  barcode: string;
};

// Touch-Friendly Aesthetic Toggle Switch Component (h-7 w-14 for easy mobile tapping)
function CustomSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-blue-600" : "bg-zinc-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-7" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function ProductCreatorStudioClient({ t }: { t?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"POS" | "ECOMMERCE">("POS");
  const [sizeCategory, setSizeCategory] = useState<keyof typeof SIZE_PRESETS>("apparel");

  // Dynamic Lists strictly from Categories feature (/api/dashboard/categories)
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string; description?: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [barcodesList, setBarcodesList] = useState<{ id: string; productName: string; barcode: string }[]>([]);

  // Main Form Data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    category: "",
    barcode: "",
    price: "",
    costPrice: "",
    stock: "50",
    minStock: "5",
    image: "",
    showInPos: true,
    showInStore: true,
    isFeatured: true,
  });

  // Size & Variant State
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [useSamePriceForAll, setUseSamePriceForAll] = useState(true);

  // Gallery Photos
  const [reviewImages, setReviewImages] = useState<string[]>(["", "", "", ""]);

  // Load actual categories created in the Categories feature (/dashboard/categories)
  const fetchCategories = () => {
    setLoadingCategories(true);
    fetch("/api/dashboard/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategoriesList(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCategories(false));
  };

  useEffect(() => {
    fetchCategories();

    fetch("/api/dashboard/barcode")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBarcodesList(data);
      })
      .catch(() => {});
  }, []);

  // Update Variants table automatically whenever selectedSizes changes
  useEffect(() => {
    const defaultPrice = parseFloat(formData.price) || 25000;
    const defaultStock = Math.max(1, Math.floor(parseInt(formData.stock || "10") / Math.max(1, selectedSizes.length)));

    const newVariants: VariantRow[] = selectedSizes.map((s) => {
      const existing = variants.find((v) => v.size === s);
      if (existing) return existing;
      return {
        size: s,
        price: defaultPrice,
        stock: defaultStock,
        barcode: formData.barcode ? `${formData.barcode}-${s}` : "",
      };
    });

    setVariants(newVariants);
  }, [selectedSizes, formData.price, formData.stock, formData.barcode]);

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

  const generateAutoSku = () => {
    const prefix = (formData.category || "PRD").slice(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, sku: `${prefix}-${randomNum}` }));
    toast.success("ສ້າງລະຫັດ SKU ອັດຕະໂນມັດ: " + `${prefix}-${randomNum}`);
  };

  const generateAutoBarcode = () => {
    const code = "LAO-" + Math.floor(100000 + Math.random() * 900000);
    setFormData((prev) => ({ ...prev, barcode: code }));
    toast.success("ສ້າງ Barcode/QR ອັດຕະໂນມັດ: " + code);
  };

  const simulateScanBarcode = () => {
    const scanned = "QR-SCAN-" + Math.floor(100000 + Math.random() * 900000);
    setFormData((prev) => ({ ...prev, barcode: scanned }));
    toast.success("ສະແກນ Barcode ສຳເລັດແລ້ວ: " + scanned);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("ຂະໜາດຮູບພາບໃຫຍ່ເກີນໄປ");
        return;
      }
      const uploader = new FormData();
      uploader.append("file", file);
      const uploadToast = toast.loading("ກຳລັງອັບໂຫຼດຮູບພາບ...");
      try {
        const res = await fetch("/api/upload", { method: "POST", body: uploader });
        const data = await res.json();
        if (data.url) {
          setFormData((prev) => ({ ...prev, image: data.url }));
          toast.success("ອັບໂຫຼດຮູບພາບສຳເລັດ", { id: uploadToast });
        } else {
          toast.error(data.error || "ການອັບໂຫຼດລົ້ມເຫຼວ", { id: uploadToast });
        }
      } catch {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດ", { id: uploadToast });
      }
    }
  };

  const handleReviewImageChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("ຂະໜາດຮູບພາບໃຫຍ່ເກີນໄປ");
        return;
      }
      const uploader = new FormData();
      uploader.append("file", file);
      const uploadToast = toast.loading("ກຳລັງອັບໂຫຼດຮູບພາບ...");
      try {
        const res = await fetch("/api/upload", { method: "POST", body: uploader });
        const data = await res.json();
        if (data.url) {
          setReviewImages((prev) => {
            const next = [...prev];
            next[index] = data.url;
            return next;
          });
          toast.success("ອັບໂຫຼດຮູບພາບສຳເລັດ", { id: uploadToast });
        } else {
          toast.error(data.error || "ການອັບໂຫຼດລົ້ມເຫຼວ", { id: uploadToast });
        }
      } catch {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດ", { id: uploadToast });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("ກະລຸນາປ້ອນຊື່ສິນຄ້າ (Product Name is required)");
      return;
    }
    const priceVal = parseFloat(formData.price) || 0;
    if (priceVal < 5000) {
      toast.error("ລາຄາສິນຄ້າຕ້ອງເລີ່ມຕົ້ນຢ່າງໜ້ອຍ 5,000 ₭");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        price: priceVal,
        stock: parseInt(formData.stock) || 0,
        category: formData.category || null,
        images: formData.image ? [formData.image] : [],
        reviewImages: reviewImages.filter((img) => Boolean(img)),
        metadata: {
          sku: formData.sku || null,
          barcode: formData.barcode || null,
          costPrice: parseFloat(formData.costPrice) || null,
          minStock: parseInt(formData.minStock) || 5,
          showInPos: formData.showInPos,
          showInStore: formData.showInStore,
          isFeatured: formData.isFeatured,
          sizes: selectedSizes,
          variants: variants.map((v) => ({
            size: v.size,
            price: useSamePriceForAll ? priceVal : v.price,
            stock: v.stock,
            barcode: v.barcode || null,
          })),
        },
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("ສ້າງສິນຄ້າໃໝ່ສຳເລັດແລ້ວ! (Product Created Successfully)");
        router.push("/dashboard/products");
        router.refresh();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "ບໍ່ສາມາດສ້າງສິນຄ້າໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setLoading(false);
    }
  };

  // Calculations for preview badge
  const priceNum = parseFloat(formData.price) || 0;
  const costNum = parseFloat(formData.costPrice) || 0;
  const profitNum = priceNum - costNum;
  const profitMarginPercent = priceNum > 0 && costNum > 0 ? ((profitNum / priceNum) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* HEADER BAR (MOBILE & DESKTOP OPTIMIZED) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-900/90 p-5 sm:p-6 rounded-2xl border border-zinc-800/80 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/products")}
            className="h-12 w-12 rounded-xl bg-zinc-800/60 border-zinc-700 hover:bg-zinc-700 text-white shrink-0"
          >
            <ArrowLeft size={22} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                <Sparkles size={20} />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                LAOSYS Smart Product Studio
              </h1>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                PRO FEATURE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              ສູນສ້າງສິນຄ້າອັດສະລິຍະ ອອກແບບປຸ່ມໃຫຍ່ກົດງ່າຍ ຮອງຮັບມືຖື 100%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (categoriesList.length > 0 && !formData.category) {
                setFormData((prev) => ({ ...prev, category: categoriesList[0].name }));
              }
              setFormData((prev) => ({
                ...prev,
                name: "ເສື້ອຢືດຝ້າຍລາວ ພຣີມຽມ",
                description: "ຜ້າຝ້າຍທໍາມະຊາດ 100% ໃສ່ສະບາຍ ບໍ່ຮ້ອນ ເໝາະກັບທຸກລະດູ",
                sku: "LAO-TS01",
                barcode: "LAO-892011",
                price: "45000",
                costPrice: "25000",
                stock: "80",
                minStock: "10",
                image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
                showInPos: true,
                showInStore: true,
                isFeatured: true,
              }));
              setSelectedSizes(["S", "M", "L", "XL"]);
              toast.success("ໂຫຼດຂໍ້ມູນຕົວຢ່າງສຳເລັດ");
            }}
            className="h-12 text-xs sm:text-sm border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:text-white rounded-xl px-4 flex-1 sm:flex-none font-bold"
          >
            ໂຫຼດຕົວຢ່າງ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black px-6 rounded-xl shadow-[0_4px_20px_rgba(79,70,229,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base flex-1 sm:flex-none"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ກຳລັງບັນທຶກ...
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                ບັນທຶກສິນຄ້າໃໝ່
              </>
            )}
          </Button>
        </div>
      </div>

      {/* TWO-COLUMN STUDIO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: EDITOR FORM (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 1: BASIC INFO & SKU */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Package size={20} className="text-blue-400" />
                1. ຂໍ້ມູນສິນຄ້າຫຼັກ (Basic Information)
              </h2>
              <button
                type="button"
                onClick={generateAutoSku}
                className="h-10 text-xs sm:text-sm text-blue-400 hover:text-blue-300 font-bold bg-blue-500/15 hover:bg-blue-500/25 px-3.5 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Sparkles size={16} />
                ສ້າງ SKU ອັດຕະໂນມັດ
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="name" className="text-zinc-300 font-semibold text-sm">
                  ຊື່ສິນຄ້າ (Product Name) <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="ຕົວຢ່າງ: ເສື້ອຢືດຝ້າຍລາວ, ເຝີງົວຈານໃຫຍ່, ຄອສສະປາ..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12 text-sm sm:text-base bg-zinc-950/70 border-zinc-800 text-white rounded-xl focus-visible:ring-blue-500 px-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku" className="text-zinc-300 font-semibold text-sm">
                  ລະຫັດ SKU / SKU Code
                </Label>
                <Input
                  id="sku"
                  placeholder="ຕົວຢ່າງ: TS-001"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="h-12 text-sm sm:text-base bg-zinc-950/70 border-zinc-800 text-white rounded-xl focus-visible:ring-blue-500 font-mono px-4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc" className="text-zinc-300 font-semibold text-sm">
                ລາຍລະອຽດສິນຄ້າ (Description - ຮອງຮັບພາສາລາວ, ໄທ, ອັງກິດ)
              </Label>
              <Input
                id="desc"
                placeholder="ອະທິບາຍຈຸດເດັ່ນຂອງສິນຄ້າ, ວັດຖຸດິບ, ວິທີໃຊ້ ຫຼື ຄຸນສົມບັດພິເສດ..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-12 text-sm sm:text-base bg-zinc-950/70 border-zinc-800 text-white rounded-xl focus-visible:ring-blue-500 px-4"
              />
            </div>
          </div>

          {/* SECTION 2: CATEGORIES (STRICTLY FROM /dashboard/categories FEATURE) & QR BARCODE */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Tag size={20} className="text-indigo-400" />
                  2. ໝວດໝູ່ສິນຄ້າ & QR Barcode
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  ດຶງຂໍ້ມູນໝວດໝູ່ຈາກໜ້າຈັດການ "ໝວດໝູ່ (Categories)" ເທົ່ານັ້ນ
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/dashboard/categories")}
                className="h-11 text-xs sm:text-sm text-blue-300 hover:text-white font-bold bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-blue-500/10"
              >
                <ExternalLink size={16} />
                ໄປໜ້າຈັດການໝວດໝູ່ (Categories)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Category Dropdown (Strictly categories from system) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300 font-semibold text-sm flex items-center gap-1.5">
                    ເລືອກໝວດໝູ່ສິນຄ້າ (Shop Categories)
                  </Label>
                  <button
                    type="button"
                    onClick={fetchCategories}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    ໂຫຼດໃໝ່
                  </button>
                </div>

                {loadingCategories ? (
                  <div className="h-12 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center px-4 text-xs text-zinc-400">
                    <Loader2 size={16} className="animate-spin mr-2 text-blue-400" />
                    ກຳລັງໂຫຼດຂໍ້ມູນຈາກໜ້າໝວດໝູ່...
                  </div>
                ) : categoriesList.length === 0 ? (
                  /* IF NO CATEGORIES FOUND IN /dashboard/categories YET */
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-bold">
                      <AlertCircle size={18} className="shrink-0" />
                      <span>ຍັງບໍ່ມີຂໍ້ມູນໝວດໝູ່ໃນລະບົບຮ້ານ</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      ກະລຸນາເຂົ້າໄປເພີ່ມໝວດໝູ່ທີ່ໜ້າ <b>"ໝວດໝູ່ (Categories)"</b> ກ່ອນ ຈຶ່ງຈະສາມາດເລືອກໝວດໝູ່ໃນໜ້ານີ້ໄດ້
                    </p>
                    <Button
                      type="button"
                      onClick={() => router.push("/dashboard/categories")}
                      className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs"
                    >
                      ຄລິກເພື່ອໄປເພີ່ມໝວດໝູ່ທີ່ໜ້າ Categories
                    </Button>
                  </div>
                ) : (
                  /* IF CATEGORIES EXIST IN /dashboard/categories */
                  <Select
                    value={String(formData.category || "")}
                    onValueChange={(val: any) => setFormData({ ...formData, category: val || "" })}
                  >
                    <SelectTrigger className="h-12 text-sm sm:text-base bg-zinc-950/70 border-zinc-800 text-white rounded-xl px-4">
                      <SelectValue placeholder="-- ເລືອກໝວດໝູ່ສິນຄ້າ --" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                      <div className="px-3 py-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-zinc-800">
                        ໝວດໝູ່ໃນລະບົບຮ້ານ ({categoriesList.length} ໝວດໝູ່)
                      </div>
                      {categoriesList.map((c) => (
                        <SelectItem key={c.id} value={c.name} className="py-3 text-sm">
                          <div className="flex flex-col">
                            <span className="font-bold">{c.name}</span>
                            {c.description && (
                              <span className="text-[11px] text-zinc-400">{c.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* QR Barcode Engine */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300 font-semibold text-sm flex items-center gap-1.5">
                    <QrCode size={16} className="text-purple-400" />
                    QR Code / Barcode
                  </Label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={generateAutoBarcode}
                      className="h-8 text-xs text-purple-300 hover:text-white font-bold bg-purple-500/20 hover:bg-purple-500/30 px-2.5 rounded-lg active:scale-95 transition-colors"
                    >
                      ສ້າງອັດຕະໂນມັດ
                    </button>
                    <button
                      type="button"
                      onClick={simulateScanBarcode}
                      className="h-8 text-xs text-orange-300 hover:text-white font-bold bg-orange-500/20 hover:bg-orange-500/30 px-2.5 rounded-lg flex items-center gap-1 active:scale-95 transition-colors"
                    >
                      <Camera size={13} />
                      ສະແກນ
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="ລະຫັດ Barcode / QR..."
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="h-12 text-sm sm:text-base bg-zinc-950/70 border-zinc-800 text-white rounded-xl font-mono px-4 flex-1"
                  />
                  {barcodesList.length > 0 && (
                    <Select
                      value={String(formData.barcode || "")}
                      onValueChange={(val: any) => setFormData({ ...formData, barcode: val || "" })}
                    >
                      <SelectTrigger className="w-36 h-12 bg-zinc-950/70 border-zinc-800 text-white rounded-xl text-xs font-semibold px-3">
                        <SelectValue placeholder="ເລືອກ QR" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {barcodesList.map((b) => (
                          <SelectItem key={b.id} value={b.barcode} className="py-2.5">
                            {b.barcode} ({b.productName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: ADVANCED SIZES & VARIANTS STUDIO (BIG TOUCH CHIPS FOR MOBILE) */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Layers size={20} className="text-purple-400" />
                  3. ຂະໜາດ / ໄຊສ໌ ແລະ ຕົວເລືອກ (Variants Studio)
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  ປຸ່ມໃຫຍ່ກົດງ່າຍ ຮອງຮັບການແຕະໃນມືຖື (Big Touch Targets)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">ປະເພດໄຊສ໌:</span>
                <Select
                  value={sizeCategory}
                  onValueChange={(val) => setSizeCategory(val as keyof typeof SIZE_PRESETS)}
                >
                  <SelectTrigger className="h-10 w-48 bg-zinc-950/70 border-zinc-800 text-white rounded-xl text-xs font-bold px-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {Object.entries(SIZE_PRESETS).map(([key, obj]) => (
                      <SelectItem key={key} value={key} className="py-2.5 text-xs">
                        {obj.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Size Chips (BIG BUTTONS FOR EASY MOBILE TAP) */}
            <div className="space-y-3">
              <Label className="text-xs sm:text-sm text-zinc-300 font-semibold">
                ແຕະເລືອກໄຊສ໌ທີ່ຕ້ອງການ (ແຕະເພື່ອເລືອກ/ຍົກເລີກ):
              </Label>
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {SIZE_PRESETS[sizeCategory].sizes.map((s) => {
                  const isSelected = selectedSizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`min-h-[44px] px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all border flex items-center gap-2 active:scale-95 ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 text-white shadow-lg shadow-blue-500/25 scale-105"
                          : "bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 hover:bg-zinc-800"
                      }`}
                    >
                      <span>{s}</span>
                      {isSelected && <Check size={16} className="text-white" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Size Input */}
              <div className="flex gap-2.5 pt-2">
                <Input
                  placeholder="ພິມເພີ່ມໄຊສ໌ເອງ (ຕົວຢ່າງ: 50ml, ຈອກໃຫຍ່, VIP)..."
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSize();
                    }
                  }}
                  className="h-12 bg-zinc-950/70 border-zinc-800 text-sm sm:text-base text-white rounded-xl px-4"
                />
                <Button
                  type="button"
                  onClick={addCustomSize}
                  className="h-12 px-5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl active:scale-95"
                >
                  + ເພີ່ມໄຊສ໌
                </Button>
              </div>
            </div>

            {/* Per-Variant Price Table */}
            {selectedSizes.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-blue-400 uppercase tracking-wider">
                    ຕັ້ງຄ່າລາຄາ ແລະ ສະຕັອກແຕ່ລະໄຊສ໌ ({selectedSizes.length} ຕົວເລືອກ)
                  </span>
                  <div className="flex items-center gap-3 bg-zinc-950/60 px-3.5 py-2 rounded-xl border border-zinc-800">
                    <Label htmlFor="samePrice" className="text-xs sm:text-sm text-zinc-300 font-semibold cursor-pointer">
                      ໃຊ້ລາຄາດຽວກັນທຸກໄຊສ໌
                    </Label>
                    <CustomSwitch
                      checked={useSamePriceForAll}
                      onCheckedChange={(val: boolean) => setUseSamePriceForAll(val)}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 overflow-x-auto bg-zinc-950/50">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs text-zinc-400 font-bold uppercase">
                        <th className="py-3 px-4">ໄຊສ໌ (Size)</th>
                        <th className="py-3 px-4">ລາຄາ (₭)</th>
                        <th className="py-3 px-4">ສະຕັອກ (Stock)</th>
                        <th className="py-3 px-4">Barcode</th>
                        <th className="py-3 px-3 text-right">ລົບ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-sm text-white">
                      {variants.map((v, idx) => (
                        <tr key={v.size} className="hover:bg-zinc-900/40">
                          <td className="py-3 px-4 font-bold text-blue-300">{v.size}</td>
                          <td className="py-3 px-4">
                            {useSamePriceForAll ? (
                              <span className="text-zinc-400 font-mono font-semibold">
                                {parseInt(formData.price || "0").toLocaleString()} ₭
                              </span>
                            ) : (
                              <Input
                                type="number"
                                value={v.price}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setVariants((prev) =>
                                    prev.map((row, i) => (i === idx ? { ...row, price: val } : row))
                                  );
                                }}
                                className="h-10 w-32 bg-zinc-900 border-zinc-700 text-sm text-white rounded-xl px-3 font-mono"
                              />
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              value={v.stock}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setVariants((prev) =>
                                  prev.map((row, i) => (i === idx ? { ...row, stock: val } : row))
                                );
                              }}
                              className="h-10 w-24 bg-zinc-900 border-zinc-700 text-sm text-white rounded-xl px-3 font-mono"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-400 text-xs">
                            {v.barcode || formData.barcode || "N/A"}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => toggleSize(v.size)}
                              className="h-9 w-9 inline-flex items-center justify-center text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: PRICING, COST & MARGIN CALCULATOR */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 backdrop-blur-md">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <DollarSign size={20} className="text-emerald-400" />
              4. ລາຄາ, ຕົ້ນທຶນ & ການຄຳນວນກຳໄລ (Pricing & Profit Calculator)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-zinc-300 font-semibold text-sm">
                  ລາຄາຂາຍ / Price (₭) <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="5000"
                  required
                  placeholder="25000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="h-12 bg-zinc-950/70 border-zinc-800 text-white rounded-xl font-mono text-base font-bold focus-visible:ring-emerald-500 px-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice" className="text-zinc-300 font-semibold text-sm">
                  ຕົ້ນທຶນ / Cost Price (₭)
                </Label>
                <Input
                  id="costPrice"
                  type="number"
                  placeholder="15000"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="h-12 bg-zinc-950/70 border-zinc-800 text-white rounded-xl font-mono text-base px-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock" className="text-zinc-300 font-semibold text-sm">
                  ສະຕັອກເລີ່ມຕົ້ນ / Initial Stock <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="stock"
                  type="number"
                  required
                  placeholder="50"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="h-12 bg-zinc-950/70 border-zinc-800 text-white rounded-xl font-mono text-base px-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock" className="text-zinc-300 font-semibold text-sm flex items-center gap-1.5">
                  <AlertCircle size={15} className="text-amber-400" />
                  ເຕືອນເມື່ອສະຕັອກຕ່ຳ
                </Label>
                <Input
                  id="minStock"
                  type="number"
                  placeholder="5"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  className="h-12 bg-zinc-950/70 border-zinc-800 text-white rounded-xl font-mono text-base px-4"
                />
              </div>
            </div>

            {/* Profit Margin Info Card */}
            {priceNum > 0 && (
              <div className="flex flex-wrap items-center justify-between bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-2xl p-4 text-xs sm:text-sm">
                <div className="flex flex-wrap items-center gap-5">
                  <div>
                    <span className="text-zinc-400">ກຳໄລຕໍ່ຊິ້ນ (Profit): </span>
                    <span className="text-emerald-400 font-bold font-mono text-base">
                      {profitNum.toLocaleString()} ₭
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">ອັດຕາກຳໄລ (Margin): </span>
                    <span className="text-emerald-400 font-bold font-mono text-base">
                      {profitMarginPercent}%
                    </span>
                  </div>
                </div>
                <div className="text-zinc-400 mt-2 sm:mt-0">
                  ມູນຄ່າສະຕັອກລວມ: <span className="text-white font-bold font-mono text-base">{(priceNum * (parseInt(formData.stock) || 0)).toLocaleString()} ₭</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: STUDIO IMAGE GALLERY */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Upload size={20} className="text-pink-400" />
                5. ສະຕູດີໂອຮູບພາບສິນຄ້າ (Studio Image Gallery)
              </h2>
              <span className="text-xs text-zinc-400">
                ຮອງຮັບ JPG, PNG, WEBP (ສູງສຸດ 100MB)
              </span>
            </div>

            {/* Main Cover Image */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-semibold text-sm">
                ຮູບພາບຫຼັກສິນຄ້າ (Cover Image)
              </Label>
              {!formData.image ? (
                <label className="relative group/upload flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-zinc-800 hover:border-blue-500/60 bg-zinc-950/50 hover:bg-zinc-900/70 rounded-2xl cursor-pointer transition-all duration-300">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <span className="p-3.5 bg-zinc-900 group-hover/upload:bg-blue-500/15 group-hover/upload:text-blue-400 text-zinc-400 rounded-2xl border border-zinc-800 group-hover/upload:border-blue-500/30 transition-all duration-300 mb-2">
                      <Upload size={24} />
                    </span>
                    <p className="text-base font-bold text-zinc-300 group-hover/upload:text-white transition-colors">
                      ແຕະເພື່ອອັບໂຫຼດຮູບພາບຫຼັກຂອງສິນຄ້າ
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      ຫຼື ຄລິກເລືອກຮູບພາບຕົວຢ່າງຂ້າງລຸ່ມ
                    </p>
                  </div>
                </label>
              ) : (
                <div className="relative w-full h-52 bg-zinc-950/60 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center group/preview">
                  <img src={formData.image} alt="Preview" className="max-h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, image: "" }))}
                    className="absolute top-3 right-3 p-2.5 bg-red-500/90 hover:bg-red-500 text-white rounded-xl transition-colors shadow-lg active:scale-95"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Sample Unsplash selector for instant testing */}
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm text-zinc-400">
                ເລືອກຮູບພາບຕົວຢ່າງທີ່ມີຄຸນນະພາບສູງ (Unsplash Quick Pick):
              </Label>
              <div className="flex flex-wrap gap-2.5">
                {SAMPLE_UNSPLASH_IMAGES.map((img) => (
                  <button
                    key={img.name}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, image: img.url }));
                      toast.success("ເລືອກຮູບ: " + img.name);
                    }}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800 text-zinc-300 hover:text-white hover:border-blue-500/50 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 active:scale-95"
                  >
                    <span className="w-4 h-4 rounded-full overflow-hidden inline-block bg-zinc-800 shrink-0">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </span>
                    {img.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Supplementary 4 Gallery Photos */}
            <div className="space-y-2 pt-2">
              <Label className="text-zinc-300 font-semibold text-sm flex items-center justify-between">
                <span>ຮູບພາບປະກອບແກເລີຣີ (Gallery Images - ສູງສຸດ 4 ຮູບ)</span>
                <span className="text-xs text-zinc-500">ຮູບພາບເພີ່ມເຕີມ</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, index) => {
                  const img = reviewImages[index];
                  return (
                    <div
                      key={index}
                      className="aspect-square relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950/50 hover:border-blue-500/50 transition-all flex items-center justify-center"
                    >
                      {img ? (
                        <>
                          <img src={img} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setReviewImages((prev) => {
                                const next = [...prev];
                                next[index] = "";
                                return next;
                              });
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-xl transition-colors shadow-md active:scale-95"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/60 p-3">
                          <Plus size={24} className="text-zinc-500 mb-1" />
                          <span className="text-xs text-zinc-400 font-bold">ຮູບທີ {index + 1}</span>
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
          </div>

          {/* SECTION 6: POS & STOREFRONT TOGGLES (MOBILE TOUCH OPTIMIZED) */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 backdrop-blur-md">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Store size={20} className="text-amber-400" />
              6. ການສະແດງຜົນໃນຮ້ານ ແລະ ເວັບໄຊທ໌ (Visibility & Channels)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="space-y-0.5">
                  <Label htmlFor="posToggle" className="text-sm font-bold text-white">
                    ສະແດງໃນ POS
                  </Label>
                  <p className="text-xs text-zinc-400">ຂາຍໜ້າຮ້ານທັນທີ</p>
                </div>
                <CustomSwitch
                  checked={formData.showInPos}
                  onCheckedChange={(val: boolean) => setFormData({ ...formData, showInPos: val })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="space-y-0.5">
                  <Label htmlFor="storeToggle" className="text-sm font-bold text-white">
                    ສະແດງใน E-Commerce
                  </Label>
                  <p className="text-xs text-zinc-400">ໜ້າຮ້ານອອນລາຍ</p>
                </div>
                <CustomSwitch
                  checked={formData.showInStore}
                  onCheckedChange={(val: boolean) => setFormData({ ...formData, showInStore: val })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="space-y-0.5">
                  <Label htmlFor="featToggle" className="text-sm font-bold text-white">
                    ສິນຄ້າແນະນຳ (Featured)
                  </Label>
                  <p className="text-xs text-zinc-400">ຕິດປ້າຍພິເສດ</p>
                </div>
                <CustomSwitch
                  checked={formData.isFeatured}
                  onCheckedChange={(val: boolean) => setFormData({ ...formData, isFeatured: val })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME GLASSMORPHISM LIVE PREVIEW (4 COLS) */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-5">
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles size={18} className="text-blue-400" />
                Live Product Preview
              </h3>
              <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("POS")}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "POS" ? "bg-blue-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  POS View
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ECOMMERCE")}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "ECOMMERCE" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Store View
                </button>
              </div>
            </div>

            {/* THE PREVIEW CARD */}
            <div className="relative group rounded-2xl overflow-hidden border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 shadow-2xl">
              {/* Card Header Tag */}
              <div className="absolute top-3 left-3 z-10 flex gap-1.5">
                {formData.isFeatured && (
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Star size={12} className="fill-current" />
                    Featured
                  </span>
                )}
                <span className="bg-zinc-900/80 backdrop-blur-md text-zinc-300 text-xs font-bold px-3 py-1 rounded-full border border-zinc-700">
                  {formData.category || "ຍັງບໍ່ໄດ້ເລືອກໝວດໝູ່"}
                </span>
              </div>

              {/* Product Image */}
              <div className="aspect-[4/3] relative bg-zinc-950 overflow-hidden flex items-center justify-center">
                {formData.image ? (
                  <img src={formData.image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="text-center p-6 text-zinc-600">
                    <Package size={42} className="mx-auto mb-2 opacity-40" />
                    <span className="text-xs">ຍັງບໍ່ໄດ້ເລືອກຮູບພາບ</span>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-5 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span className="font-mono">{formData.sku || "SKU-AUTO"}</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ສະຕັອກ: {formData.stock || "0"}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-base sm:text-lg leading-snug line-clamp-1">
                    {formData.name || "ຊື່ສິນຄ້າຕົວຢ່າງ (Your Product)"}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                    {formData.description || "ລາຍລະອຽດສິນຄ້າຈະສະແດງຢູ່ທີ່ນີ້..."}
                  </p>
                </div>

                {/* Size Chips in Preview */}
                {selectedSizes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedSizes.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-bold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Price and Add Button */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                  <div>
                    <span className="text-xs text-zinc-500 block">ລາຄາຂາຍ:</span>
                    <span className="text-xl font-black text-white font-mono">
                      {priceNum.toLocaleString()} ₭
                    </span>
                  </div>

                  {activeTab === "POS" ? (
                    <div className="h-10 px-4 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold flex items-center justify-center">
                      + ແຕະເພື່ອຂາຍ
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs px-4"
                    >
                      + Add to Cart
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Stat Box */}
            <div className="bg-zinc-950/70 rounded-2xl p-4 border border-zinc-800 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>ຈຳນວນ Variants:</span>
                <span className="text-white font-bold">{Math.max(1, selectedSizes.length)} ຕົວເລືอก</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>ຄາດຄະເນກຳໄລຕໍ່ຊິ້ນ:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {profitNum.toLocaleString()} ₭ ({profitMarginPercent}%)
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>ສະຖານະ QR / Barcode:</span>
                <span className="text-purple-400 font-mono font-bold">
                  {formData.barcode || "ຍັງບໍ່ໄດ້ກຳນົດ"}
                </span>
              </div>
            </div>

            {/* SAVE BUTTON INSIDE STICKY PANEL (BIG TOUCH BUTTON) */}
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black h-14 rounded-2xl shadow-[0_4px_20px_rgba(79,70,229,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ກຳລັງບັນທຶກສິນຄ້າ...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  ບັນທຶກສິນຄ້າໃໝ່ (Save Product)
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
