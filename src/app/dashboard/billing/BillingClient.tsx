"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Check, CreditCard, UploadCloud, X, ArrowRight, Building2 } from "lucide-react";
import { BrandStripe } from "@/components/icons/BrandIcons";
import Image from "next/image";

export default function BillingClient({ 
  plan, 
  status, 
  expiresAt, 
  productCount,
  orderCount,
  staffCount,
  packages,
  adminBankInfo,
  t
}: { 
  plan: string, 
  status: string | null, 
  expiresAt: Date | null, 
  productCount: number,
  orderCount: number,
  staffCount: number,
  packages: any[],
  adminBankInfo: any,
  t: any
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  
  // Checkout Modal State
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "MANUAL">("MANUAL");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (searchParams.get("success")) {
      toast.success("Subscription updated successfully!");
      router.replace("/dashboard/billing");
    }
    if (searchParams.get("canceled")) {
      toast.error("Checkout was canceled.");
      router.replace("/dashboard/billing");
    }
  }, [searchParams, router]);

  const handleUpgradeClick = (pkg: any) => {
    setSelectedPackage(pkg);
    setPaymentMethod("MANUAL");
    setSlipFile(null);
    setSlipPreview(null);
  };

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validation: Ensure it's an image
      if (!file.type.startsWith("image/")) {
        toast.error(" (PNG, JPG) ");
        e.target.value = ""; // Reset input
        return;
      }
      
      // Validation: Ensure file size is under 100MB
      if (file.size > 100 * 1024 * 1024) {
        toast.error(" 100MB");
        e.target.value = ""; // Reset input
        return;
      }

      setSlipFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitManualPayment = async () => {
    if (!slipFile) {
      toast.error("Please upload a payment slip.");
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Upload Slip
      const formData = new FormData();
      formData.append("file", slipFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Failed to upload slip");
      const { url } = await uploadRes.json();

      // 2. Submit Request
      const res = await fetch("/api/billing/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selectedPackage.id, paymentSlipUrl: url })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit request");
      }

      // toast.success("Upgrade request submitted! Waiting for Admin approval.");
      setSelectedPackage(null);
      setShowSuccessModal(true);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitStripePayment = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selectedPackage.id })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to process upgrade");
        setIsSubmitting(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  // Find the current active package limits to show usage bars correctly
  const currentPkg = packages?.find(p => p.name === plan) || { productLimit: 10, orderLimit: 30, staffLimit: 1 };
  
  const productLimit = currentPkg.productLimit === -1 ? Infinity : currentPkg.productLimit;
  const orderLimit = currentPkg.orderLimit === -1 ? Infinity : currentPkg.orderLimit;
  const staffLimit = currentPkg.staffLimit === -1 ? Infinity : currentPkg.staffLimit;

  const isUnlimited = (l: number) => l === Infinity || l === -1;
  const getPercent = (count: number, limit: number) => isUnlimited(limit) ? 0 : Math.min((count / limit) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex-1">
          <h2 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-2">{t.currentPlan}</h2>
          <div className="flex items-end gap-4">
            <span className="text-3xl font-black text-white uppercase">{plan}</span>
            {status === "ACTIVE" && (
              <span className="px-2.5 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md text-xs font-bold mb-1">{t.active}</span>
            )}
            {status === "PAST_DUE" && (
              <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md text-xs font-bold mb-1">PAST DUE</span>
            )}
            {status === "PENDING" && (
              <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-md text-xs font-bold mb-1">PENDING APPROVAL</span>
            )}
          </div>
          {expiresAt && (
             <p className="text-xs text-zinc-500 mt-2">
               {t.renewsOn}: {new Date(expiresAt).toLocaleDateString()}
             </p>
          )}
        </div>

        {/* Usage Bars */}
        <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* Products */}
           <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
             <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
               <span>{t.products}</span>
               <span>{productCount} / {isUnlimited(productLimit) ? '8' : productLimit}</span>
             </div>
             {!isUnlimited(productLimit) ? (
               <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                 <div className={`h-full rounded-full transition-all duration-1000 ${getPercent(productCount, productLimit) >= 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${getPercent(productCount, productLimit)}%` }}></div>
               </div>
             ) : (
               <div className="w-full h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
             )}
           </div>

           {/* Orders */}
           <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
             <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
               <span>{t.ordersThisMonth}</span>
               <span>{orderCount} / {isUnlimited(orderLimit) ? '8' : orderLimit}</span>
             </div>
             {!isUnlimited(orderLimit) ? (
               <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                 <div className={`h-full rounded-full transition-all duration-1000 ${getPercent(orderCount, orderLimit) >= 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${getPercent(orderCount, orderLimit)}%` }}></div>
               </div>
             ) : (
               <div className="w-full h-1.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"></div>
             )}
           </div>

           {/* Staff */}
           <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
             <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
               <span>{t.staff}</span>
               <span>{staffCount} / {isUnlimited(staffLimit) ? '8' : staffLimit}</span>
             </div>
             {!isUnlimited(staffLimit) ? (
               <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                 <div className={`h-full rounded-full transition-all duration-1000 ${getPercent(staffCount, staffLimit) >= 90 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${getPercent(staffCount, staffLimit)}%` }}></div>
               </div>
             ) : (
               <div className="w-full h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
             )}
           </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="mt-12">
        <h3 className="text-xl font-bold text-white mb-6">{t.availablePlans}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {packages?.map((pkg) => (
            <div key={pkg.id} className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl flex flex-col relative overflow-hidden group hover:border-blue-500/50 transition-colors">
              <div className="mb-6">
                <h4 className="text-blue-400 font-bold text-lg mb-2">{pkg.name}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">?{pkg.price.toLocaleString()}</span>
                  <span className="text-zinc-500 text-sm">/{pkg.durationDays} </span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check size={18} className="text-blue-400 shrink-0" />
                  <span>{pkg.productLimit === -1 ? t.unlimitedProducts || "" : ` ${pkg.productLimit}`}</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check size={18} className="text-blue-400 shrink-0" />
                  <span>{pkg.orderLimit === -1 ? "" : `${pkg.orderLimit}  / `}</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check size={18} className="text-blue-400 shrink-0" />
                  <span>{pkg.staffLimit === -1 ? "" : `${pkg.staffLimit} `}</span>
                </li>
              </ul>
              
              {plan === pkg.name && status === "ACTIVE" ? (
                <button disabled className="w-full py-2.5 rounded-xl text-sm font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 cursor-not-allowed"></button>
              ) : (
                <button 
                  onClick={() => handleUpgradeClick(pkg)}
                  className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-zinc-800 hover:bg-blue-600 text-white transition-all border border-zinc-700"
                >
                   {pkg.name}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Dev Mode Banner */}
      <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-zinc-300 mb-1">{t.paymentGatewayInfo}</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {t.mockPaymentInfo}
            </p>
          </div>
        </div>
      </div>

      {/* Hybrid Checkout Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg my-8 relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setSelectedPackage(null)}
              className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-6 border-b border-zinc-800 shrink-0">
              <h2 className="text-xl font-bold text-white"> {selectedPackage.name}</h2>
              <p className="text-sm text-zinc-400 mt-1">: ?{selectedPackage.price.toLocaleString()}  {selectedPackage.durationDays} </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Temporarily removed Payment Method Tabs 
              <div className="flex gap-2 mb-6 p-1 bg-zinc-900 rounded-xl">
                ... 
              </div> */}

              {paymentMethod === 'MANUAL' ? (
                <div className="space-y-6">
                  {adminBankInfo ? (
                    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                      {adminBankInfo.paymentQrCode && (
                        <div className="mb-4 text-center">
                          <img src={adminBankInfo.paymentQrCode} alt="PromptPay QR" className="w-48 h-48 mx-auto rounded-xl object-cover bg-white" />
                        </div>
                      )}
                      <div className="space-y-2 text-sm text-center">
                        {adminBankInfo.promptPayId && (
                          <div className="flex items-center justify-center gap-2 text-zinc-300">
                            <span className="font-bold text-white">PromptPay:</span> {adminBankInfo.promptPayId}
                          </div>
                        )}
                        {adminBankInfo.paymentAccountInfo && (
                          <div className="text-zinc-400 whitespace-pre-wrap">{adminBankInfo.paymentAccountInfo}</div>
                        )}
                        {!adminBankInfo.promptPayId && !adminBankInfo.paymentAccountInfo && !adminBankInfo.paymentQrCode && (
                          <div className="text-yellow-500 text-center">. .</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-yellow-500 text-center p-4 bg-yellow-500/10 rounded-xl">. .</div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-white"></label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-3 text-zinc-500" />
                        <p className="mb-1 text-sm text-zinc-400 font-bold"></p>
                        <p className="text-xs text-zinc-500">PNG, JPG  100MB</p>
                      </div>
                      <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleSlipChange} />
                    </label>
                    
                    {slipPreview && (
                      <div className="relative mt-4 rounded-xl overflow-hidden border border-zinc-800">
                        <img src={slipPreview} alt="Slip Preview" className="w-full object-contain max-h-64 bg-zinc-950" />
                        <button onClick={() => { setSlipFile(null); setSlipPreview(null); }} className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black text-white rounded-lg backdrop-blur-sm transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#635BFF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard size={32} className="text-[#635BFF]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2"> Stripe</h3>
                  <p className="text-sm text-zinc-400"> Stripe. .</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-800 shrink-0 mt-auto">
              <button 
                onClick={paymentMethod === 'MANUAL' ? submitManualPayment : submitStripePayment}
                disabled={isSubmitting || (paymentMethod === 'MANUAL' && !slipFile)}
                className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]"
              >
                {isSubmitting ? "..." : paymentMethod === 'MANUAL' ? "" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">!</h3>
            <p className="text-zinc-400 mb-6">
               <br/><br/>
               (Super Admin)   24  
            </p>
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 rounded-xl font-bold text-zinc-950 bg-white hover:bg-zinc-200 transition-colors"
            >OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
