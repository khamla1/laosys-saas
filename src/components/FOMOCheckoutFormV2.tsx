"use client";

import { toast } from "sonner";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Timer, ShoppingCart, Plus, Minus, Printer, CheckCircle, TicketPercent } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  stock: number;
}

export function FOMOCheckoutFormV2({ 
  token, 
  expiresAt, 
  products,
  paymentQrCode,
  paymentAccountInfo,
  promptPayId,
  storeName
}: { 
  token: string; 
  expiresAt: string; 
  products: Product[];
  paymentQrCode?: string;
  paymentAccountInfo?: string;
  promptPayId?: string;
  storeName?: string;
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [paymentSlipUrl, setPaymentSlipUrl] = useState("");
  const [uploadingSlip, setUploadingSlip] = useState(false);

const LAOS_PROVINCES = [
  "ນະຄອນຫຼວງວຽງຈັນ (Vientiane Capital)",
  "ຫຼວງພະບາງ (Luang Prabang)",
  "ຈຳປາສັກ (Champasak)",
  "ສະຫວັນນະເຂດ (Savannakhet)",
  "ຄຳມ່ວນ (Khammouane)",
  "ວຽງຈັນ (Vientiane Province)",
  "ອຸດົມໄຊ (Oudomxay)",
  "ບໍ່ແກ້ວ (Bokeo)",
  "ຫຼວງນ້ຳທາ (Luang Namtha)",
  "ຜົ້ງສາລີ (Phongsaly)",
  "ຫົວພັນ (Houaphanh)",
  "ຊຽງຂວາງ (Xieng Khouang)",
  "ໄຊຍະບູລີ (Xayabury)",
  "ໄຊສົມບູນ (Xaysomboun)",
  "ບໍລິຄຳໄຊ (Bolikhamsai)",
  "ສາລະວັນ (Salavan)",
  "ເຊກອງ (Sekong)",
  "ອັດຕະປື (Attapeu)"
];

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    village: "",
    district: "",
    province: "ນະຄອນຫຼວງວຽງຈັນ (Vientiane Capital)",
    addressDetails: "",
    shippingMethod: "EXPRESS",
    note: ""
  });

  const getFullAddress = () => {
    const shipLabel = 
      formData.shippingMethod === "EXPRESS" ? "ຈັດສົ່ງດ່ວນ (Express)" :
      formData.shippingMethod === "PICKUP" ? "ຮັບເຄື່ອງເອງທີ່ຮ້ານ (Pickup)" : "ແມັສເຊັນເຈີ (Messenger)";
    return `ບ້ານ: ${formData.village}\nເມືອງ: ${formData.district}\nແຂວງ: ${formData.province}\nຮູບແບບຈັດສົ່ງ: ${shipLabel}\nລາຍລະອຽດເພີ່ມເຕີມ: ${formData.addressDetails}`;
  };

  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  useEffect(() => {
    const targetDate = new Date(expiresAt).getTime();
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft(0);
        setExpired(true);
        return 0;
      }
      setTimeLeft(difference);
      return difference;
    };

    const initialDiff = calculateTimeLeft();
    if (initialDiff <= 0) return;

    const interval = setInterval(() => {
      const diff = calculateTimeLeft();
      if (diff <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const updateQuantity = (productId: string, delta: number, maxStock: number) => {
    setSelectedItems(prev => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next < 0) return prev;
      if (next > maxStock) return prev;
      
      const updated = { ...prev, [productId]: next };
      if (next === 0) delete updated[productId];
      return updated;
    });
  };

  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const totalPrice = products.reduce((sum, p) => {
    return sum + (p.price * (selectedItems[p.id] || 0));
  }, 0);

  const totalItems = Object.values(selectedItems).reduce((sum, q) => sum + q, 0);

  // Clear coupon if total items change to prevent invalid discount logic
  useEffect(() => {
    setAppliedDiscount(0);
    setCouponCode("");
    setCouponError("");
  }, [totalItems]);

  const validateCoupon = async () => {
    setCouponError("");
    setAppliedDiscount(0);
    if (!couponCode.trim()) return;
    
    setValidatingCoupon(true);
    try {
      const res = await fetch(`/api/buy/${token}/coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: couponCode.trim(), subtotal: totalPrice }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedDiscount(data.discountAmount);
      } else {
        setCouponError(data.error || "ລະຫັດສ່ວນຫຼຸດບໍ່ຖືກຕ້ອງ");
      }
    } catch (e) {
      setCouponError("ເກີດຂໍ້ຜິດພາດໃນການກວດສອບ");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const finalPrice = Math.max(0, totalPrice - appliedDiscount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalItems === 0) {
      toast.error("ກະລຸນາເລືອກສິນຄ້າຢ່າງໜ້ອຍ 1 ລາຍການ.");
      return;
    }
    if ((paymentQrCode || promptPayId) && !paymentSlipUrl) {
      toast.error("ກະລຸນາອັບໂຫຼດສະລິບໂອນເງິນກ່ອນ.");
      return;
    }
    setLoading(true);
    
    const itemsPayload = Object.entries(selectedItems).map(([productId, quantity]) => ({
      productId,
      quantity
    }));

    try {
      const res = await fetch(`/api/buy/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          note: formData.note,
          address: getFullAddress(),
          items: itemsPayload,
          paymentSlipUrl,
          couponCode: appliedDiscount > 0 ? couponCode.trim() : undefined
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        setOrderId(data.orderId);
      } else {
        toast.error(data.error || "ການສັ່ງຊື້ລົ້ມເຫຼວ.");
      }
    } catch (error) {
      console.error(error);
      toast.error("ເກີດຂໍ້ຜິດພາດທີ່ບໍ່ຄາດຄິດ.");
    } finally {
      setLoading(false);
    }
  };

  const handleSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingSlip(true);
    try {
      const res = await fetch("/api/public-upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setPaymentSlipUrl(data.url);
      } else {
        toast.error("Upload failed: " + data.error);
      }
    } catch(err) {
      toast.error("Error uploading file.");
    }
    setUploadingSlip(false);
  };

  if (expired) {
    return (
      <div className="text-center animate-in zoom-in duration-300">
        <h1 className="text-4xl font-bold text-red-500 mb-3">ໝົດເວລາ!</h1>
        <p className="text-zinc-400">ລິ້ງການຂາຍພິເສດນີ້ໝົດອາຍຸແລ້ວ.</p>
      </div>
    );
  }

  if (success) {
    const purchasedItems = Object.entries(selectedItems).map(([id, qty]) => {
      const p = products.find(prod => prod.id === id)!;
      return { ...p, quantity: qty };
    });

    return (
      <div className="w-full max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
        <Card className="bg-white text-black border-none rounded-2xl shadow-2xl print:shadow-none" id="receipt">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2 border-b border-zinc-200 pb-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 print:hidden shadow-inner">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-900">{storeName || "SaaS Store"}</h2>
              <p className="text-zinc-500 text-sm font-medium">ໃບບິນ (Receipt)</p>
              <p className="text-zinc-400 text-xs font-medium">ຢືນຢັນຄຳສັ່ງຊື້ສຳເລັດ</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start text-sm bg-zinc-50 p-4 rounded-xl border border-zinc-100">
              <div className="space-y-1 w-full sm:w-auto">
                <p className="text-zinc-500">ລະຫັດບິນ:</p>
                <p className="font-mono font-bold text-base">{orderId.slice(-8).toUpperCase()}</p>
                <p className="text-zinc-500 mt-2">ວັນທີ:</p>
                <p className="font-medium">{new Date().toLocaleString()}</p>
              </div>
              <div className="space-y-1 text-left sm:text-right w-full sm:w-auto">
                <p className="text-zinc-500">ຂໍ້ມູນລູກຄ້າ:</p>
                <p className="font-bold text-base">{formData.name}</p>
                <p className="font-medium">{formData.phone}</p>
                <p className="max-w-xs sm:max-w-[180px] sm:ml-auto ml-0 text-zinc-600 whitespace-pre-wrap text-left text-xs bg-zinc-100 p-2 rounded-md mt-2">{getFullAddress()}</p>
              </div>
            </div>

            <div className="pt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-zinc-900 text-left uppercase text-zinc-600 font-bold">
                    <th className="pb-2">ລາຍການ</th>
                    <th className="pb-2 text-center">ຈຳນວນ</th>
                    <th className="pb-2 text-right">ລາຄາ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {purchasedItems.map(item => (
                    <tr key={item.id}>
                      <td className="py-3 font-medium">{item.name}</td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right">₭{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="pt-4 text-right pr-4 text-zinc-500">ຍອດລວມກ່ອນຫຼຸດ</td>
                    <td className="pt-4 text-right text-zinc-500">₭{totalPrice.toLocaleString()}</td>
                  </tr>
                  {appliedDiscount > 0 && (
                    <tr>
                      <td colSpan={2} className="pt-1 text-right pr-4 text-emerald-500">ສ່ວນຫຼຸດ</td>
                      <td className="pt-1 text-right text-emerald-500">-₭{appliedDiscount.toLocaleString()}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-zinc-900 font-bold text-lg">
                    <td colSpan={2} className="pt-4 text-right pr-4 uppercase">ຍອດລວມທັງໝົດ</td>
                    <td className="pt-4 text-right text-emerald-600">₭{finalPrice.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="text-center pt-8 text-sm text-zinc-500 font-medium">
              <p>*** ຂອບໃຈທີ່ອຸດໜູນ! ***</p>
              <p>ກະລຸນາບັນທຶກໃບບິນນີ້ໄວ້ເປັນຫຼັກຖານ.</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center print:hidden">
          <Button 
            onClick={() => window.print()} 
            className="bg-zinc-800 hover:bg-zinc-700 text-white gap-2 font-bold px-8 h-12 text-base rounded-full shadow-lg"
          >
            <Printer size={18} /> ພິມ / ບັນທຶກໃບບິນ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl grid lg:grid-cols-[1.2fr_1fr] gap-4 sm:gap-8">
      {/* Products Selection */}
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <div className="flex items-center text-red-400 font-semibold gap-2 text-base sm:text-lg">
            <Timer className="animate-pulse" /> ຂໍ້ສະເໜີຈະສິ້ນສຸດພາຍໃນ:
          </div>
          <div className="text-3xl sm:text-4xl font-mono font-bold text-red-500 tracking-wider">
            {timeLeft !== null ? formatTime(timeLeft) : "--:--:--"}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-emerald-500" /> ເລືອກສິນຄ້າ
          </h3>
          {products.map(product => (
            <Card key={product.id} className={`bg-zinc-900/60 backdrop-blur-sm border-2 transition-all ${selectedItems[product.id] ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'border-zinc-800/50'} overflow-hidden flex flex-row items-stretch rounded-2xl cursor-pointer hover:border-zinc-700`}>
              {product.images && product.images.length > 0 ? (
                <div className="w-24 sm:w-32 bg-zinc-800 shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover absolute inset-0" />
                </div>
              ) : (
                <div className="w-24 sm:w-32 bg-zinc-800/30 shrink-0 flex items-center justify-center border-r border-zinc-800/50">
                  <ShoppingCart size={32} className="text-zinc-600" />
                </div>
              )}
              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-zinc-200 text-base sm:text-lg leading-tight">{product.name}</h4>
                  <div className="text-xs sm:text-sm text-zinc-400 line-clamp-2 mt-1">{product.description}</div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mt-3 sm:mt-4 gap-2 sm:gap-0">
                  <div className="text-emerald-400 font-bold text-lg sm:text-xl">₭{product.price.toLocaleString()}</div>
                  {product.stock > 0 ? (
                    <div className="flex items-center bg-zinc-950 rounded-full border border-zinc-800 shadow-inner overflow-hidden w-full sm:w-auto justify-between sm:justify-start">
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, -1, product.stock); }}
                        className="p-2 sm:p-3 flex-1 sm:flex-none flex justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center text-white font-bold">{selectedItems[product.id] || 0}</span>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, 1, product.stock); }}
                        className="p-2 sm:p-3 flex-1 sm:flex-none flex justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        disabled={(selectedItems[product.id] || 0) >= product.stock}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-sm font-semibold border border-red-500/20">ສິນຄ້າໝົດ</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Checkout Form */}
      <Card className="bg-zinc-900/60 backdrop-blur-md border-zinc-800/50 h-fit sticky top-4 rounded-3xl shadow-2xl">
        <CardHeader className="border-b border-zinc-800/50 pb-4 sm:pb-6 p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl text-white">ການຈັດສົ່ງ ແລະ ຊຳລະເງິນ</CardTitle>
          <CardDescription className="text-zinc-400 text-sm sm:text-base mt-1">ກະລຸນາຕື່ມຂໍ້ມູນຂອງທ່ານເພື່ອສັ່ງຊື້.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium ml-1">ຊື່ ແລະ ນາມສະກຸນ <span className="text-red-400">*</span></Label>
              <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 bg-zinc-950/50 border-zinc-800 text-white focus-visible:ring-emerald-500 rounded-xl" placeholder="ປ້ອນຊື່ຂອງທ່ານ..." />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium ml-1">ເບີໂທລະສັບ <span className="text-red-400">*</span></Label>
              <Input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-12 bg-zinc-950/50 border-zinc-800 text-white focus-visible:ring-emerald-500 rounded-xl" placeholder="020 xxxx xxxx" />
            </div>
            <div className="space-y-4 bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/50">
              <Label className="text-zinc-300 font-medium ml-1 flex items-center gap-2">ທີ່ຢູ່ຈັດສົ່ງ <span className="text-red-400">*</span></Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-sm ml-1">ບ້ານ <span className="text-red-400">*</span></Label>
                  <Input required value={formData.village} onChange={(e) => setFormData({...formData, village: e.target.value})} className="h-11 bg-zinc-950/50 border-zinc-800 text-white focus-visible:ring-emerald-500 rounded-lg" placeholder="ປ້ອນຊື່ບ້ານ" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-sm ml-1">ເມືອງ <span className="text-red-400">*</span></Label>
                  <Input required value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} className="h-11 bg-zinc-950/50 border-zinc-800 text-white focus-visible:ring-emerald-500 rounded-lg" placeholder="ປ້ອນຊື່ເມືອງ" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-zinc-400 text-sm ml-1">ແຂວງ (Province) <span className="text-red-400">*</span></Label>
                  <select
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({...formData, province: e.target.value})}
                    className="w-full h-11 bg-zinc-950/50 border border-zinc-800 text-white focus-visible:ring-emerald-500 rounded-lg px-3 text-sm"
                  >
                    {LAOS_PROVINCES.map(prov => (
                      <option key={prov} value={prov} className="bg-zinc-900 text-white">{prov}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-zinc-400 text-sm ml-1">ລາຍລະອຽດເພີ່ມເຕີມ (ຈຸດສັງເກດ)</Label>
                  <Input value={formData.addressDetails} onChange={(e) => setFormData({...formData, addressDetails: e.target.value})} className="h-11 bg-zinc-950/50 border-zinc-800 text-white focus-visible:ring-emerald-500 rounded-lg" placeholder="ເຊັ່ນ: ຮ່ອມ 2, ເຮືອນສີຂຽວ" />
                </div>
                <div className="space-y-2 sm:col-span-2 pt-2">
                  <Label className="text-zinc-400 text-sm ml-1 block">ຮູບແບບການຈັດສົ່ງ (Shipping Method) <span className="text-red-400">*</span></Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: "EXPRESS", label: "ຈັດສົ່ງດ່ວນ (Express)", desc: "Anousith / HAL / KiengKai" },
                      { id: "PICKUP", label: "ຮັບເຄື່ອງເອງທີ່ຮ້ານ (Pickup)", desc: "ມາຮັບທີ່ໜ້າຮ້ານ" },
                      { id: "MESSENGER", label: "ແມັສເຊັນເຈີ (Messenger)", desc: "ຈັດສົ່ງພາຍໃນຕົວເມືອງ" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setFormData({...formData, shippingMethod: m.id})}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          formData.shippingMethod === m.id
                            ? "border-emerald-500 bg-emerald-500/15 text-white"
                            : "border-zinc-800 hover:border-zinc-700 text-zinc-400"
                        }`}
                      >
                        <p className="font-bold text-xs sm:text-sm">{m.label}</p>
                        <p className="text-[10px] opacity-70 mt-0.5">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 font-medium ml-1">ໝາຍເຫດເຖິງຜູ້ຂາຍ (ບໍ່ບັງຄັບ)</Label>
              <Input value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="h-12 bg-zinc-950/50 border-zinc-800 text-white focus-visible:ring-emerald-500 rounded-xl" placeholder="ຂໍ້ຄວາມເພີ່ມເຕີມ..." />
            </div>
            
            {/* Coupon Section */}
            <div className="space-y-3 pt-4 border-t border-zinc-800/50">
              <div className="flex items-center gap-2">
                <TicketPercent size={18} className="text-emerald-400" />
                <span className="text-zinc-300 font-medium text-sm sm:text-base">ໂຄ້ດສ່ວນຫຼຸດ (Coupon Code)</span>
              </div>
              <div className="flex gap-2">
                <Input 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value)} 
                  disabled={appliedDiscount > 0}
                  className="bg-zinc-900 border-zinc-700 text-white uppercase focus-visible:ring-emerald-500" 
                  placeholder="ປ້ອນລະຫັດສ່ວນຫຼຸດ..." 
                />
                {appliedDiscount > 0 ? (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => { setAppliedDiscount(0); setCouponCode(""); }} 
                  >
                    ຍົກເລີກ
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={validateCoupon} 
                    disabled={!couponCode.trim() || validatingCoupon || totalItems === 0} 
                    className="bg-zinc-800 hover:bg-zinc-700 text-white"
                  >
                    {validatingCoupon ? "ກວດສອບ..." : "ນຳໃຊ້"}
                  </Button>
                )}
              </div>
              {couponError && <p className="text-red-400 text-sm ml-1">{couponError}</p>}
              {appliedDiscount > 0 && <p className="text-emerald-400 text-sm ml-1">ໃຊ້ລະຫັດສ່ວນຫຼຸດສຳເລັດແລ້ວ!</p>}
            </div>

            <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-zinc-800/50 flex flex-col gap-4">
              {totalItems > 0 && (
                <div className="space-y-3">
                  <span className="text-zinc-400 font-medium text-sm sm:text-base">ສະຫຼຸບລາຍການສັ່ງຊື້</span>
                  <div className="space-y-2">
                    {Object.entries(selectedItems).map(([id, qty]) => {
                      const p = products.find(prod => prod.id === id)!;
                      return (
                        <div key={id} className="flex items-center justify-between bg-zinc-950/80 p-2 sm:p-3 rounded-xl border border-zinc-800">
                          <div className="flex items-center gap-3">
                            {p.images && p.images.length > 0 ? (
                              <img src={p.images[0]} alt={p.name} className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg border border-zinc-700" />
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                                <ShoppingCart size={16} className="text-zinc-500" />
                              </div>
                            )}
                            <div>
                              <p className="text-zinc-200 font-medium text-sm sm:text-base">{p.name}</p>
                              <p className="text-zinc-500 text-xs sm:text-sm">{qty} ຊິ້ນ</p>
                            </div>
                          </div>
                          <span className="text-emerald-400 font-bold text-sm sm:text-base">₭{(p.price * qty).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-zinc-400 font-medium text-sm sm:text-base">ລາຍການທັງໝົດ</span>
                <span className="text-white text-sm sm:text-base">{totalItems} ຊິ້ນ</span>
              </div>
              
              <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                <span className="text-zinc-400 font-medium text-sm sm:text-base">ຍອດລວມກ່ອນຫຼຸດ</span>
                <span className="text-white text-sm sm:text-base">₭{totalPrice.toLocaleString()}</span>
              </div>
              
              {appliedDiscount > 0 && (
                <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                  <span className="text-emerald-400 font-medium text-sm sm:text-base">ສ່ວນຫຼຸດ</span>
                  <span className="text-emerald-400 text-sm sm:text-base">-₭{appliedDiscount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-end justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <span className="text-zinc-300 font-bold text-base sm:text-lg">ຍອດລວມທັງໝົດ</span>
                <div className="flex flex-col items-end">
                  {appliedDiscount > 0 && (
                    <span className="text-zinc-500 font-medium text-sm sm:text-base line-through mb-1">
                      ₭{totalPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-emerald-400 font-bold text-3xl sm:text-4xl">₭{finalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {(paymentQrCode || promptPayId) && (
              <div className="pt-6 border-t border-zinc-800/50 space-y-4">
                <Label className="text-zinc-300 font-medium ml-1">ສະແກນ QR ເພື່ອຊຳລະເງິນ <span className="text-red-400">*</span></Label>
                <div className="bg-zinc-950/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-zinc-800 text-center">
                  <div className="w-48 h-48 bg-white p-2 rounded-xl mb-4">
                    {promptPayId && finalPrice > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={`/api/promptpay?id=${encodeURIComponent(promptPayId)}&amount=${finalPrice}`} alt="Dynamic PromptPay QR Code" className="w-full h-full object-contain" />
                    ) : paymentQrCode ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={paymentQrCode} alt="Payment QR Code" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">ບໍ່ມີ QR Code</div>
                    )}
                  </div>
                  {paymentAccountInfo && (
                    <div className="text-sm text-zinc-300 whitespace-pre-wrap bg-zinc-900 w-full p-3 rounded-lg border border-zinc-800">
                      {paymentAccountInfo}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="text-zinc-300 font-medium ml-1">ອັບໂຫຼດສະລິບໂອນເງິນ <span className="text-red-400">*</span></Label>
                  <label className={`relative flex items-center justify-center w-full h-16 border-2 border-dashed rounded-xl transition-colors ${paymentSlipUrl ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-700'} ${uploadingSlip ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-500 hover:bg-zinc-800/50'}`}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleSlipUpload}
                      disabled={uploadingSlip}
                    />
                    {uploadingSlip ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-2">
                        <Timer className="animate-spin" size={18} /> ກຳລັງອັບໂຫຼດ...
                      </span>
                    ) : paymentSlipUrl ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-2">
                        <CheckCircle size={18} /> ອັບໂຫຼດສຳເລັດແລ້ວ
                      </span>
                    ) : (
                      <span className="text-zinc-400 font-medium">ຄລິກເພື່ອອັບໂຫຼດຮູບສະລິບ</span>
                    )}
                  </label>
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading || totalItems === 0 || ((!!paymentQrCode || !!promptPayId) && !paymentSlipUrl) || uploadingSlip} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xl h-14 mt-6 font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none border-none">
              {loading ? "ກຳລັງດຳເນີນການ..." : `ສັ່ງຊື້ເລີຍ`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
