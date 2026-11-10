"use client";

import { toast } from "sonner";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, ShoppingCart, Plus, Minus, Timer, CheckCircle, Printer, TicketPercent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
}

export function CheckoutModal({ 
  product, 
  storeId,
  paymentQrCode,
  paymentAccountInfo,
  storeName
}: { 
  product: Product; 
  storeId: string;
  paymentQrCode?: string;
  paymentAccountInfo?: string;
  storeName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [paymentSlipUrl, setPaymentSlipUrl] = useState("");
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    village: "",
    district: "",
    province: "",
    addressDetails: "",
    note: ""
  });

  const getFullAddress = () => {
    return `ບ້ານ: ${formData.village}\nເມືອງ: ${formData.district}\nແຂວງ: ${formData.province}\nລາຍລະອຽດເພີ່ມເຕີມ: ${formData.addressDetails}`;
  };

  const updateQuantity = (delta: number) => {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > product.stock) return product.stock;
      if (appliedCoupon) {
        setAppliedCoupon(null);
        setCouponCode("");
      }
      return next;
    });
  };

  const subtotal = product.price * quantity;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPrice = Math.max(0, subtotal - discountAmount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");
    setAppliedCoupon(null);
    try {
      const res = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          sellerId: storeId,
          orderAmount: subtotal,
          productIds: [product.id]
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedCoupon(data);
      } else {
        setCouponError(data.error || "ລະຫັດສ່ວນຫຼຸດບໍ່ຖືກຕ້ອງ");
      }
    } catch (err) {
      setCouponError("ເກີດຂໍ້ຜິດພາດໃນການກວດສອບລະຫັດ");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentQrCode && !paymentSlipUrl) {
      toast.error("ກະລຸນາອັບໂຫຼດສະລິບໂອນເງິນກ່ອນ.");
      return;
    }
    setLoading(true);
    
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          productId: product.id,
          quantity: quantity,
          customerName: formData.name,
          customerPhone: formData.phone,
          customerAddress: getFullAddress(),
          customerNote: formData.note,
          paymentSlipUrl: paymentSlipUrl,
          couponId: appliedCoupon ? appliedCoupon.couponId : undefined
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        setOrderId(data.orderId);
      } else {
        toast.error("Checkout failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button 
          disabled={product.stock <= 0} 
          className="w-full bg-blue-600 hover:bg-blue-750 text-white gap-1 sm:gap-2 h-7 sm:h-10 text-[9px] sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/10"
        >
          <ShoppingBag size={10} className="sm:w-4 sm:h-4" />
          {product.stock > 0 ? "ຊື້ເລີຍ" : "ສິນຄ້າໝົດ"}
        </Button>
      } />
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0">
        {success ? (
          <div className="p-6 sm:p-10 w-full mx-auto animate-in zoom-in duration-500">
            <Card className="bg-white text-black border-none rounded-2xl shadow-2xl print:shadow-none" id="receipt">
              <CardContent className="p-8 space-y-6">
                <div className="text-center space-y-2 border-b border-zinc-200 pb-6">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 print:hidden shadow-inner">
                    <CheckCircle size={32} />
                  </div>
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-900">{storeName || "SaaS Store"}</h2>
                  <p className="text-zinc-500 text-sm font-medium">ໃບບິນ</p>
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
                      <tr>
                        <td className="py-3 font-medium">{product.name}</td>
                        <td className="py-3 text-center">{quantity}</td>
                        <td className="py-3 text-right">₭{(product.price * quantity).toLocaleString()}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      {appliedCoupon && (
                        <tr className="text-zinc-500">
                          <td colSpan={2} className="pt-4 text-right pr-4 uppercase">ສ່ວນຫຼຸດ ({appliedCoupon.code})</td>
                          <td className="pt-4 text-right">- ₭{appliedCoupon.discountAmount.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="border-t-2 border-zinc-900 font-bold text-lg">
                        <td colSpan={2} className="pt-4 text-right pr-4 uppercase">ຍອດລວມ</td>
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
                onClick={() => {
                   window.print();
                }} 
                className="bg-zinc-800 hover:bg-zinc-700 text-white gap-2 font-bold px-8 h-12 text-base rounded-full shadow-lg"
              >
                <Printer size={18} /> ພິມ / ບັນທຶກໃບບິນ
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 pb-8">
            <DialogHeader className="mb-6 border-b border-zinc-800/50 pb-4">
              <DialogTitle className="text-xl sm:text-2xl text-white">ການຈັດສົ່ງ ແລະ ຊຳລະເງິນ</DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm sm:text-base mt-1">
                ກະລຸນາຕື່ມຂໍ້ມູນຂອງທ່ານເພື່ອສັ່ງຊື້.
              </DialogDescription>
            </DialogHeader>

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
                    <Label className="text-zinc-400 text-sm ml-1">ແຂວງ <span className="text-red-400">*</span></Label>
                    <Input required value={formData.province} onChange={(e) => setFormData({...formData, province: e.target.value})} className="h-11 bg-zinc-950/50 border-zinc-800 text-white focus-visible:ring-emerald-500 rounded-lg" placeholder="ປ້ອນຊື່ແຂວງ" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-zinc-400 text-sm ml-1">ລາຍລະອຽດເພີ່ມເຕີມ (ຈຸດສັງເກດ)</Label>
                    <Input value={formData.addressDetails} onChange={(e) => setFormData({...formData, addressDetails: e.target.value})} className="h-11 bg-zinc-950/50 border-zinc-800 text-white focus-visible:ring-emerald-500 rounded-lg" placeholder="ເຊັ່ນ: ຮ່ອມ 2, ເຮືອນສີຂຽວ" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-zinc-400 font-medium ml-1">ໝາຍເຫດເຖິງຜູ້ຂາຍ (ບໍ່ບັງຄັບ)</Label>
                <Input value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="h-12 bg-zinc-950/50 border-zinc-800 text-white focus-visible:ring-emerald-500 rounded-xl" placeholder="ຂໍ້ຄວາມເພີ່ມເຕີມ..." />
              </div>
              
              <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-zinc-800/50 flex flex-col gap-4">
                <div className="space-y-3">
                  <span className="text-zinc-400 font-medium text-sm sm:text-base">ສະຫຼຸບລາຍການສັ່ງຊື້</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-zinc-950/80 p-2 sm:p-3 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-3">
                        {product.images && product.images.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.images[0]} alt={product.name} className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg border border-zinc-700" />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                            <ShoppingCart size={16} className="text-zinc-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-zinc-200 font-medium text-sm sm:text-base">{product.name}</p>
                          <div className="flex items-center bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden mt-1 w-24 justify-between">
                            <button 
                              type="button" 
                              onClick={() => updateQuantity(-1)}
                              className="px-2 py-0.5 text-zinc-400 hover:text-white hover:bg-zinc-800"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-white text-xs font-bold">{quantity}</span>
                            <button 
                              type="button" 
                              onClick={() => updateQuantity(1)}
                              className="px-2 py-0.5 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                              disabled={quantity >= product.stock}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <span className="text-emerald-400 font-bold text-sm sm:text-base">₭{(product.price * quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Coupon System */}
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <TicketPercent size={18} className="text-emerald-400" />
                    <span className="text-zinc-300 font-medium text-sm sm:text-base">ລະຫັດສ່ວນຫຼຸດ</span>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={couponCode} 
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="ປ້ອນລະຫັດສ່ວນຫຼຸດ..." 
                      className="bg-zinc-900 border-zinc-700 text-white uppercase focus-visible:ring-emerald-500"
                      disabled={validatingCoupon || !!appliedCoupon}
                    />
                    {appliedCoupon ? (
                      <Button 
                        type="button" 
                        variant="destructive" 
                        onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                      >
                        ຍົກເລີກ
                      </Button>
                    ) : (
                      <Button 
                        type="button" 
                        onClick={applyCoupon}
                        disabled={!couponCode.trim() || validatingCoupon}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white"
                      >
                        {validatingCoupon ? "ກວດສອບ..." : "ນຳໃຊ້"}
                      </Button>
                    )}
                  </div>
                  {couponError && <p className="text-red-400 text-xs">{couponError}</p>}
                  {appliedCoupon && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-2 rounded flex justify-between items-center">
                      <span>ສ່ວນຫຼຸດ ({appliedCoupon.code})</span>
                      <span className="font-bold">- ₭{appliedCoupon.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mt-4">
                  <div className="flex justify-between text-zinc-400 text-sm">
                    <span>ລວມສິນຄ້າ ({quantity} ຊິ້ນ)</span>
                    <span>₭{subtotal.toLocaleString()}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-400 text-sm">
                      <span>ສ່ວນຫຼຸດ</span>
                      <span>- ₭{appliedCoupon.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-end justify-between border-t border-zinc-800/50 pt-2 mt-2">
                    <span className="text-zinc-300 font-bold text-base sm:text-lg">ຍອດລວມ</span>
                    <div className="flex flex-col items-end">
                      {appliedCoupon && (
                        <span className="text-zinc-500 font-medium text-sm sm:text-base line-through mb-1">
                          ₭{subtotal.toLocaleString()}
                        </span>
                      )}
                      <span className="text-emerald-400 font-bold text-3xl sm:text-4xl">₭{finalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {paymentQrCode && (
                <div className="pt-6 border-t border-zinc-800/50 space-y-4">
                  <Label className="text-zinc-300 font-medium ml-1">ສະແກນ QR ເພື່ອຊຳລະເງິນ <span className="text-red-400">*</span></Label>
                  <div className="bg-zinc-950/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-zinc-800 text-center">
                    <div className="w-48 h-48 bg-white p-2 rounded-xl mb-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={paymentQrCode} alt="Payment QR Code" className="w-full h-full object-contain" />
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

              <Button type="submit" disabled={loading || (!!paymentQrCode && !paymentSlipUrl) || uploadingSlip} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xl h-14 mt-6 font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none border-none">
                {loading ? "ກຳລັງດຳເນີນການ..." : `ສັ່ງຊື້ເລີຍ`}
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
