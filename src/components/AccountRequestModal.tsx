"use client";

import {
  useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Building2,
  Store,
  ShoppingCart,
  Package,
  ChefHat,
  CalendarDays,
  CreditCard,
  LayoutTemplate,
  Ticket,
  BarChart3,
  Users,
  Stethoscope,
  Shirt,
  Smartphone,
  Sparkles,
  Check,
  QrCode,
  SplitSquareHorizontal,
  Tags,
  Barcode,
  Crown,
  Building,
  Bell,
  Handshake,
  ClipboardList,
  Calculator,
  FileText,
  Star,
  Activity,
  ShieldCheck,
  Palette,
  Truck,
  TrendingUp,
  Hourglass,
  Gift,
  Wrench,
  ArrowRight,
  Plus,
  Utensils,
  Trophy,
  Rocket,
  PartyPopper
} from "lucide-react";
import { LAO_PROVINCES, getDistrictsByProvince, formatLaoAddress } from "@/lib/laoAddressData";

// ─── Store Type Config (Upgraded with Modern Premium UI Tokens) ───
const STORE_TYPES = [
  {
    value: "RESTAURANT",
    label: "ຮ້ານອາຫານ",
    sublabel: "Restaurant",
    icon: Utensils,
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500/10 border-orange-500/30 hover:border-orange-500/80 dark:bg-orange-950/20",
    badgeColor: "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20",
    textColor: "text-orange-900 dark:text-orange-300",
    pillColor: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
    features: [
      { icon: Store, label: "ຈຸດຂາຍ (POS)" },
      { icon: ChefHat, label: "ໜ້າຈໍຫ້ອງຄົວ (KDS)" },
      { icon: LayoutTemplate, label: "ຈັດການໂຕະ & ໂຊນ" },
      { icon: Tags, label: "ຕົວເລືອກອາຫານ (Modifiers)" },
      { icon: Package, label: "ຄັງວັດຖຸດິບ (Recipe Costing)" },
      { icon: Users, label: "ຈັດການພະນັກງານ" },
      { icon: LayoutTemplate, label: "ໜ້າຮ້ານອອນລາຍ" },
      { icon: SplitSquareHorizontal, label: "ແຍກບິນ / ລວມບິນ" },
      { icon: BarChart3, label: "ລາຍງານຍອດຂາຍ" },
    ],
  },
  {
    value: "SPORTS_CLUB",
    label: "ກິລາ / ຟິດເນດ",
    sublabel: "Sports & Fitness",
    icon: Trophy,
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/80 dark:bg-emerald-950/20",
    badgeColor: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20",
    textColor: "text-emerald-900 dark:text-emerald-300",
    pillColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    features: [
      { icon: Store, label: "ຈຸດຂາຍ (POS)" },
      { icon: CalendarDays, label: "ຈອງຄອດ / ສະໜາມ" },
      { icon: LayoutTemplate, label: "ຄັງສິນຄ້າ & ອຸປະກອນ" },
      { icon: Wrench, label: "ສູນສ້ອມແປງອຸປະກອນ" },
      { icon: Tags, label: "ລະບົບເຊົ່າອຸປະກອນ" },
      { icon: Users, label: "ຊົມລົມ & ທີມ" },
      { icon: LayoutTemplate, label: "ໜ້າຮ້ານອອນລາຍ" },
      { icon: Crown, label: "ຈັດການສະມາຊິກ" },
      { icon: BarChart3, label: "ລາຍງານລາຍຮັບ-ລາຍຈ່າຍ" },
    ],
  },
  {
    value: "RETAIL",
    label: "ຮ້ານຂາຍຍ່ອຍ",
    sublabel: "Retail",
    icon: ShoppingCart,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-500/10 border-blue-500/30 hover:border-blue-500/80 dark:bg-blue-950/20",
    badgeColor: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20",
    textColor: "text-blue-900 dark:text-blue-300",
    pillColor: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    features: [
      { icon: Store, label: "ຈຸດຂາຍ (POS)" },
      { icon: Barcode, label: "ສະແກນບາໂຄດ" },
      { icon: Package, label: "ຄັງສິນຄ້າ" },
      { icon: LayoutTemplate, label: "ໜ້າຮ້ານອອນລາຍ" },
      { icon: Crown, label: "ລະບົບສະມາຊິກ" },
      { icon: Ticket, label: "ຄູປອງສ່ວນຫຼຸດ" },
      { icon: Building, label: "ຈັດການສາຂາ" },
      { icon: Bell, label: "ແຈ້ງເຕືອນສິນຄ້າໃກ້ໝົດ" },
      { icon: BarChart3, label: "ລາຍງານຍອດຂາຍ & ກຳໄລ" },
      { icon: Handshake, label: "ຈັດການຜູ້ສະໜອງ" },
    ],
  },
  {
    value: "SERVICE",
    label: "ບໍລິການ",
    sublabel: "Service",
    icon: Wrench,
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-500/10 border-purple-500/30 hover:border-purple-500/80 dark:bg-purple-950/20",
    badgeColor: "bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/20",
    textColor: "text-purple-900 dark:text-purple-300",
    pillColor: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    features: [
      { icon: Store, label: "ຈຸດຂາຍ (POS)" },
      { icon: CalendarDays, label: "ປະຕິທິນຈອງນັດໝາຍ" },
      { icon: Users, label: "ຈັດການລູກຄ້າ" },
      { icon: Users, label: "ຈັດການພະນັກງານ/ຊ່າງ" },
      { icon: Bell, label: "ແຈ້ງເຕືອນນັດໝາຍ" },
      { icon: Calculator, label: "ຄິດໄລ່ຄອມມິດຊັ່ນ" },
      { icon: Package, label: "ຂາຍແພັກເກັດ" },
      { icon: FileText, label: "ອອກໃບສະເໜີລາຄາ" },
      { icon: BarChart3, label: "ລາຍງານຍອດຂາຍ" },
      { icon: LayoutTemplate, label: "ໜ້າຮ້ານອອນລາຍ" },
    ],
  },
  {
    value: "CLINIC",
    label: "ຄລີນິກ / ສະປາ",
    sublabel: "Clinic / Spa",
    icon: Stethoscope,
    color: "from-teal-500 to-cyan-600",
    bgColor: "bg-teal-500/10 border-teal-500/30 hover:border-teal-500/80 dark:bg-teal-950/20",
    badgeColor: "bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20",
    textColor: "text-teal-900 dark:text-teal-300",
    pillColor: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
    features: [
      { icon: Store, label: "ຈຸດຂາຍ (POS)" },
      { icon: CalendarDays, label: "ປະຕິທິນຈອງນັດໝາຍ" },
      { icon: Activity, label: "ປະຫວັດການປິ່ນປົວ" },
      { icon: Package, label: "ຄັງສິນຄ້າ/ຢາ" },
      { icon: Users, label: "ຈັດການພະນັກງານ/ແພດ" },
      { icon: LayoutTemplate, label: "ໜ້າຮ້ານອອນລາຍ" },
      { icon: Package, label: "ຂາຍຄອຣ໌ສ/ແພັກເກັດ" },
      { icon: FileText, label: "ອອກໃບຮັບຮອງແພດ" },
      { icon: Calculator, label: "ຄິດໄລ່ຄອມມິດຊັ່ນ" },
      { icon: BarChart3, label: "ລາຍງານລາຍຮັບ-ລາຍຈ່າຍ" },
    ],
  },
  {
    value: "FASHION",
    label: "ຮ້ານເສື້ອຜ້າ",
    sublabel: "Fashion",
    icon: Shirt,
    color: "from-pink-500 to-rose-600",
    bgColor: "bg-pink-500/10 border-pink-500/30 hover:border-pink-500/80 dark:bg-pink-950/20",
    badgeColor: "bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/20",
    textColor: "text-pink-900 dark:text-pink-300",
    pillColor: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
    features: [
      { icon: Store, label: "ຈຸດຂາຍ (POS)" },
      { icon: Palette, label: "ຈັດການສີ & ໄຊສ໌" },
      { icon: Package, label: "ຄັງສິນຄ້າ & ສະແກນບາໂຄດ" },
      { icon: LayoutTemplate, label: "ໜ້າຮ້ານອອນລາຍ" },
      { icon: Crown, label: "ລະບົບສະມາຊິກ" },
      { icon: Tags, label: "ຈັດການໂປຣໂມຊັ່ນ" },
      { icon: Truck, label: "ເຊື່ອມຕໍ່ຂົນສົ່ງ" },
      { icon: ShoppingCart, label: "ຈັດການອໍເດີອອນລາຍ" },
      { icon: Bell, label: "ແຈ້ງເຕືອນສິນຄ້າໃກ້ໝົດ" },
      { icon: TrendingUp, label: "ລາຍງານສິນຄ້າຂາຍດີ" },
    ],
  },
  {
    value: "COSMETICS",
    label: "ເຄື່ອງສຳອາງ",
    sublabel: "Cosmetics",
    icon: Sparkles,
    color: "from-fuchsia-500 to-pink-600",
    bgColor: "bg-fuchsia-500/10 border-fuchsia-500/30 hover:border-fuchsia-500/80 dark:bg-fuchsia-950/20",
    badgeColor: "bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white shadow-lg shadow-fuchsia-500/20",
    textColor: "text-fuchsia-900 dark:text-fuchsia-300",
    pillColor: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/20",
    features: [
      { icon: Store, label: "ຈຸດຂາຍ (POS)" },
      { icon: Hourglass, label: "ຈັດການວັນໝົດອາຍຸ" },
      { icon: Package, label: "ຄັງສິນຄ້າ & ບາໂຄດ" },
      { icon: LayoutTemplate, label: "ໜ້າຮ້ານອອນລາຍ" },
      { icon: Gift, label: "ລະບົບສະມາຊິກ & ແຕ້ມ" },
      { icon: Tags, label: "ຈັດການໂປຣໂມຊັ່ນ" },
      { icon: Truck, label: "ເຊື່ອມຕໍ່ຂົນສົ່ງ" },
      { icon: Handshake, label: "ຈັດການຕົວແທນຈຳໜ່າຍ" },
      { icon: ShoppingCart, label: "ຈັດການອໍເດີອອນລາຍ" },
      { icon: BarChart3, label: "ລາຍງານຍອດຂາຍ" },
    ],
  },
  {
    value: "ELECTRONICS",
    label: "ເຄື່ອງໃຊ້ໄຟຟ້າ",
    sublabel: "Electronics",
    icon: Smartphone,
    color: "from-cyan-500 to-blue-600",
    bgColor: "bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-500/80 dark:bg-cyan-950/20",
    badgeColor: "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20",
    textColor: "text-cyan-900 dark:text-cyan-300",
    pillColor: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
    features: [
      { icon: Store, label: "ຈຸດຂາຍ (POS)" },
      { icon: Barcode, label: "ຈັດການ Serial Number" },
      { icon: ShieldCheck, label: "ລະບົບຮັບປະກັນສິນຄ້າ" },
      { icon: Package, label: "ຄັງສິນຄ້າ & ບາໂຄດ" },
      { icon: CreditCard, label: "ລະບົບຜ່ອນຊຳລະ" },
      { icon: Wrench, label: "ຈັດການຊ່າງສ້ອມແປງ" },
      { icon: FileText, label: "ອອກໃບສະເໜີລາຄາ" },
      { icon: LayoutTemplate, label: "ໜ້າຮ້ານອອນລາຍ" },
      { icon: Handshake, label: "ຈັດການຜູ້ສະໜອງ" },
      { icon: BarChart3, label: "ລາຍງານຍອດຂາຍ & ກຳໄລ" },
    ],
  },
  {
    value: "GENERIC",
    label: "ທົ່ວໄປ (ໄດ້ທຸກຟີເຈີທັງໝົດ)",
    sublabel: "Generic (All Features)",
    icon: Package,
    color: "from-amber-500 via-orange-500 to-amber-600",
    bgColor: "bg-zinc-900 border-zinc-700 hover:border-amber-500/80",
    badgeColor: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20",
    textColor: "text-amber-400",
    pillColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    features: [
      { icon: Sparkles, label: "ທຸກຟີເຈີທັງໝົດ" },
    ],
  },
];

export function AccountRequestModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Choose type, Step 2: Fill form

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    businessType: "RETAIL",
  });

  const [province, setProvince] = useState("ນະຄອນຫຼວງວຽງຈັນ");
  const [district, setDistrict] = useState("ຈັນທະບູລີ");
  const [village, setVillage] = useState("");
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [customProvince, setCustomProvince] = useState("");
  const [customDistrict, setCustomDistrict] = useState("");

  const availableDistricts = getDistrictsByProvince(province);

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const districts = getDistrictsByProvince(newProv);
    setDistrict(districts[0] || "");
  };

  const selectedType = STORE_TYPES.find(t => t.value === formData.businessType);

  const resetModal = () => {
    setSuccess(false);
    setError("");
    setStep(1);
    setIsCustomLocation(false);
    setCustomProvince("");
    setCustomDistrict("");
    setProvince("ນະຄອນຫຼວງວຽງຈັນ");
    setDistrict("ຈັນທະບູລີ");
    setVillage("");
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      businessType: "RETAIL",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const activeProvince = isCustomLocation ? customProvince.trim() : province;
  const activeDistrict = isCustomLocation ? customDistrict.trim() : district;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isCustomLocation && !customProvince.trim()) {
      setError("ກະລຸນາປ້ອນຊື່ແຂວງ ຫຼື ລັດຂອງທ່ານ");
      setLoading(false);
      return;
    }

    if (isCustomLocation && !customDistrict.trim()) {
      setError("ກະລຸນາປ້ອນຊື່ເມືອງ ຫຼື ເຂດຂອງທ່ານ");
      setLoading(false);
      return;
    }

    const fullAddress = formatLaoAddress({
      village,
      district: activeDistrict,
      province: activeProvince,
    });

    try {
      const res = await fetch("/api/request-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          address: fullAddress,
          province: activeProvince,
          district: activeDistrict,
          village: village.trim(),
          businessType: formData.businessType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ເກີດຂໍ້ຜິດພາດ");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => { resetModal(); setOpen(true); }} 
        className="w-full h-12 bg-white border-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-500/50 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm group"
      >
        <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform text-emerald-500" />
        ລົງທະບຽນເປີດບັນຊີໃໝ່ (Register Account)
      </Button>
      
      <Dialog open={open} onOpenChange={(val) => {
        setOpen(val);
        if(!val) resetModal();
      }}>
        <DialogContent className={`bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl p-0 overflow-hidden transition-all duration-300 ${step === 1 ? "sm:max-w-[780px] md:max-w-[840px]" : "sm:max-w-[540px]"}`}>
          
          {/* Top Gradient Header Line - dynamically matches selected store accent */}
          <div className={`h-2.5 w-full bg-gradient-to-r ${selectedType ? selectedType.color : "from-emerald-500 via-teal-500 to-emerald-600"}`}></div>

          <div className="p-6 sm:p-7 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {success ? (
              /* ── Success Screen ── */
              <div className="py-10 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
                  <CheckCircle className="w-12 h-12 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 flex items-center justify-center gap-2"><span>ເປີດບັນຊີສຳເລັດແລ້ວ!</span> <PartyPopper className="w-6 h-6 text-amber-400 inline" /></h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm">
                  ບັນຊີຮ້ານຄ້າຂອງທ່ານຖືກສ້າງ ແລະ ອະນຸມັດອັດຕະໂນມັດແລ້ວ. ທ່ານສາມາດເຂົ້າສູ່ລະບົບເພື່ອເລີ່ມຕົ້ນໃຊ້ງານໄດ້ທັນທີ!
                </p>
                <Button 
                  className="mt-8 w-full max-w-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl h-12 shadow-lg shadow-emerald-500/20" 
                  onClick={() => setOpen(false)}
                >
                  ປິດໜ້າຕ່າງ
                </Button>
              </div>
            ) : step === 1 ? (
              /* ── STEP 1: Choose Store Type (Stunning Ultra-Premium UI) ── */
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                {/* Modern Luxury Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80 dark:border-zinc-800 mb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                        ເລືອກປະເພດຮ້ານຄ້າຂອງທ່ານ
                      </DialogTitle>
                      <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-0.5">
                        ເລືອກປະເພດທຸລະກິດຂອງທ່ານ — ລະບົບຈະເປີດຟີເຈີທີ່ເໝາະສົມໃຫ້ອັດຕະໂນມັດ (ປັບປ່ຽນໄດ້ພາຍຫຼັງ)
                      </DialogDescription>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                    8 ປະເພດທຸລະກິດ
                  </span>
                </div>

                {/* Grid of 8 Beautiful Business Type Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                  {STORE_TYPES.filter(t => t.value !== "GENERIC").map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, businessType: type.value }));
                        setStep(2);
                      }}
                      className={`group relative text-left p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 ${type.bgColor} bg-white/60 dark:bg-zinc-900/60`}
                    >
                      {/* Decorative top accent line */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${type.color} opacity-80 group-hover:opacity-100 transition-opacity`} />

                      {/* Top row: Emoji Icon + Business Title + Arrow Indicator */}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl ${type.badgeColor} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                              {type.icon ? <type.icon className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-base text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {type.label}
                              </h4>
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-bold mt-1">
                                {type.sublabel}
                              </span>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-emerald-500 group-hover:text-white text-zinc-400 flex items-center justify-center transition-all duration-300 shadow-sm shrink-0">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Included Features Section - Styled Pills with checkmarks */}
                        <div className="mt-3.5 pt-3 border-t border-zinc-200/60 dark:border-zinc-800">
                          <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            ຟີເຈີເດັ່ນທີ່ລວມຢູ່:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {type.features.map((feat, i) => {
                              const FIcon = feat.icon;
                              return (
                                <div
                                  key={i}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100/90 dark:bg-zinc-800/90 group-hover:bg-white dark:group-hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors"
                                >
                                  <FIcon size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>{feat.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Footer Indicator */}
                      <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <span className="text-zinc-400 dark:text-zinc-500 font-medium">
                          ລວມ {type.features.length} ຟີເຈີຫຼັກ
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          ເລືອກປະເພດນີ້ <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* VIP Sandbox All-In-One Card at bottom */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, businessType: "GENERIC" }));
                    setStep(2);
                  }}
                  className="w-full mt-4 p-4 rounded-2xl border-2 border-zinc-800 hover:border-amber-500 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                      <Package className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base text-white group-hover:text-amber-400 transition-colors">
                          ທົ່ວໄປ (ໄດ້ທຸກຟີເຈີທັງໝົດ) — ສຳລັບທົດລອງ ແລະ ສຳຫຼວດ
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold uppercase tracking-wide">
                          All-In-One
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        ເປີດທຸກລະບົບໃນແພລດຟອມ: POS, ອາຫານ, ຄລີນິກ, ກິລາ, ຂາຍຍ່ອຍ, ເຊົ່າ, ສ້ອມແປງ, ບັນຊີ
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-extrabold text-xs transition-all duration-300 shrink-0 shadow-lg shadow-amber-500/20 group-hover:bg-amber-400">
                    <span>ເລືອກທົ່ວໄປ (All Features)</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            ) : (
              /* ── STEP 2: Fill Form (Sleek Apple-Style Modal Form) ── */
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <DialogHeader className="mb-5 text-left">
                  <DialogTitle className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    ຂໍ້ມູນເປີດບັນຊີຮ້ານຄ້າ
                  </DialogTitle>
                </DialogHeader>

                {/* Selected Type Summary Banner */}
                {selectedType && (
                  <div className="mb-5 p-4 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-12 h-12 rounded-2xl ${selectedType.badgeColor} flex items-center justify-center text-2xl shadow-md shrink-0`}>
                        {selectedType.icon ? <selectedType.icon className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-base text-zinc-900 dark:text-white">{selectedType.label}</p>
                          <span className="px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold">
                            {selectedType.sublabel}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          ລວມ {selectedType.features.length} ຟີເຈີພ້ອມໃຊ້ງານໃນລະບົບ
                        </p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline"
                      size="sm"
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl h-9 px-3"
                    >
                      ປ່ຽນປະເພດຮ້ານ
                    </Button>
                  </div>
                )}

                {/* Features Preview Pills */}
                {selectedType && selectedType.value !== "GENERIC" && (
                  <div className="mb-5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
                    <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      ຟີເຈີທີ່ລະບົບຈະເປີດໃຫ້ອັດຕະໂນມັດ:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedType.features.map((feat, i) => {
                        const FIcon = feat.icon;
                        return (
                          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 font-medium shadow-2xs">
                            <Check size={12} className="text-emerald-500" />
                            {feat.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-zinc-700 dark:text-zinc-300 font-bold text-sm">
                      ຊື່ຮ້ານ ຫຼື ຊື່ເຈົ້າຂອງ <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <UserPlus className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                      <Input 
                        id="name" 
                        name="name" 
                        required 
                        value={formData.name} 
                        onChange={handleChange} 
                        className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-sm font-medium" 
                        placeholder="ຕົວຢ່າງ: ສຸລິຍະ ຄາເຟ່ / ບໍລິສັດ ເອມໄອທີ" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300 font-bold text-sm">
                      ອີເມວເຂົ້າສູ່ລະບົບ <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        required 
                        value={formData.email} 
                        onChange={handleChange} 
                        className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-sm font-medium" 
                        placeholder="you@example.com" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300 font-bold text-sm">
                      ລະຫັດຜ່ານ <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        name="password" 
                        type="password" 
                        required 
                        value={formData.password} 
                        onChange={handleChange} 
                        className="pl-3.5 h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-sm font-medium" 
                        placeholder="ຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ" 
                        minLength={6} 
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-zinc-700 dark:text-zinc-300 font-bold text-sm">
                      ເບີໂທຕິດຕໍ່ <span className="text-zinc-400 font-normal text-xs">(WhatsApp / ໂທລະສັບ)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                      <Input 
                        id="phone" 
                        name="phone" 
                        type="tel" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium" 
                        placeholder="020 xxxx xxxx" 
                      />
                    </div>
                  </div>

                  {/* Lao Location: Province, District, Village */}
                  <div className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      <span>ທີ່ຢູ່ຮ້ານຄ້າ / ສະຖານທີ່ຕັ້ງ (Store Location)</span>
                    </div>

                    {!isCustomLocation ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* ແຂວງ (Province) */}
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                              ແຂວງ (Province) <span className="text-red-500">*</span>
                            </Label>
                            <select
                              value={province}
                              onChange={(e) => {
                                if (e.target.value === "__CUSTOM__") {
                                  setIsCustomLocation(true);
                                } else {
                                  handleProvinceChange(e.target.value);
                                }
                              }}
                              className="w-full h-10 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                            >
                              {LAO_PROVINCES.map((p) => (
                                <option key={p.name} value={p.name}>
                                  {p.name}
                                </option>
                              ))}
                              <option value="__CUSTOM__">+ ປ້ອນແຂວງອື່ນໆເອງ...</option>
                            </select>
                          </div>

                          {/* ເມືອງ (District) */}
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                              ເມືອງ (District) <span className="text-red-500">*</span>
                            </Label>
                            <select
                              value={district}
                              onChange={(e) => {
                                if (e.target.value === "__CUSTOM__") {
                                  setIsCustomLocation(true);
                                } else {
                                  setDistrict(e.target.value);
                                }
                              }}
                              className="w-full h-10 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                            >
                              {availableDistricts.map((d) => (
                                <option key={d} value={d}>
                                  {d.startsWith("ເມືອງ") || d.startsWith("ນະຄອນ") ? d : `ເມືອງ ${d}`}
                                </option>
                              ))}
                              <option value="__CUSTOM__">+ ປ້ອນເມືອງອື່ນໆເອງ...</option>
                            </select>
                          </div>
                        </div>

                        {/* Small Button beneath Province / District */}
                        <div className="flex items-center justify-start pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomLocation(true);
                              if (!customProvince) setCustomProvince(province === "ນະຄອນຫຼວງວຽງຈັນ" ? "" : province);
                              if (!customDistrict) setCustomDistrict(district === "ຈັນທະບູລີ" ? "" : district);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold transition-colors py-0.5 px-1.5 rounded-lg hover:bg-emerald-500/10 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ບໍ່ພົບແຂວງ ຫຼື ເມືອງຂອງທ່ານ? ຄລິກປ້ອນເອງ (Custom Location)</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Custom Province */}
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                              <span>ແຂວງ / ລັດ / ພາກພື້ນ <span className="text-red-500">*</span></span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded">ປ້ອນເອງ</span>
                            </Label>
                            <Input
                              value={customProvince}
                              onChange={(e) => setCustomProvince(e.target.value)}
                              placeholder="ເຊັ່ນ: ແຂວງອື່ນໆ ຫຼື ລັດຕ່າງປະເທດ"
                              className="h-10 bg-white dark:bg-zinc-950 border-emerald-500/40 rounded-xl text-sm font-medium focus-visible:ring-emerald-500/20"
                            />
                          </div>

                          {/* Custom District */}
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                              <span>ເມືອງ / ນະຄອນ / ເຂດ <span className="text-red-500">*</span></span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded">ປ້ອນເອງ</span>
                            </Label>
                            <Input
                              value={customDistrict}
                              onChange={(e) => setCustomDistrict(e.target.value)}
                              placeholder="ເຊັ່ນ: ຊື່ເມືອງ ຫຼື ເຂດຂອງທ່ານ"
                              className="h-10 bg-white dark:bg-zinc-950 border-emerald-500/40 rounded-xl text-sm font-medium focus-visible:ring-emerald-500/20"
                            />
                          </div>
                        </div>

                        {/* Button to switch back to standard list */}
                        <div className="flex items-center justify-start pt-0.5">
                          <button
                            type="button"
                            onClick={() => setIsCustomLocation(false)}
                            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 font-medium transition-colors py-0.5 px-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            <span>← ກັບໄປເລືອກຈາກລາຍການ 18 ແຂວງໃນລະບົບ</span>
                          </button>
                        </div>
                      </>
                    )}

                    {/* ບ້ານ / ລາຍລະອຽດທີ່ຢູ່ (Village / Street) */}
                    <div className="space-y-1">
                      <Label htmlFor="village" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        ບ້ານ ຫຼື ສະຖານທີ່ໃກ້ຄຽງ (Village / Location Detail)
                      </Label>
                      <Input
                        id="village"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        placeholder="ເຊັ່ນ: ບ້ານ ດົງໂດກ, ຮ່ອມ 5 ຫຼື ໃກ້ມະຫາວິທະຍາໄລ..."
                        className="h-10 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium"
                      />
                    </div>

                    {/* Live Preview */}
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 pt-0.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">ທີ່ຢູ່ເຕັມ:</span>
                      <span className="truncate">
                        {formatLaoAddress({ village, district: activeDistrict, province: activeProvince }) || "ກະລຸນາເລືອກ ຫຼື ປ້ອນແຂວງ ແລະ ເມືອງ"}
                      </span>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400 font-bold flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      {error}
                    </div>
                  )}
                  
                  <DialogFooter className="pt-4 flex flex-col sm:flex-row items-center gap-3 sm:justify-end border-t border-zinc-200/80 dark:border-zinc-800">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setStep(1)} 
                      disabled={loading} 
                      className="w-full sm:w-auto text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl h-11 px-5 text-sm font-bold"
                    >
                      ← ກັບຄືນ (Back)
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full sm:w-auto text-white shadow-xl shadow-emerald-500/20 rounded-xl h-11 px-8 transition-all hover:-translate-y-0.5 text-sm font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500"
                    >
                      {loading ? (
                        "ກຳລັງສ້າງບັນຊີ..."
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <Rocket className="w-4 h-4" />
                          <span>ເປີດຮ້ານເລີຍ! (Create Store)</span>
                        </span>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AccountRequestModal;
