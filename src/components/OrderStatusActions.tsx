"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CreditCard, Package, Truck, CheckCircle, Ban, Lock, ArrowRight, Clock, User, AlertTriangle, Check } from "lucide-react";

export function OrderStatusActions({ 
  orderId, 
  currentStatus, 
  statusDict, 
  isAdmin = false 
}: { 
  orderId: string; 
  currentStatus: string; 
  statusDict?: any;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [step, setStep] = useState<"selection" | "confirmation">("selection");
  
  // Instant UI Update state
  const [optimisticStatus, setOptimisticStatus] = useState(currentStatus);
  
  // Activity Feed state
  const [feed, setFeed] = useState<{status: string, timestamp: Date, user: string}[]>([
    { status: currentStatus, timestamp: new Date(Date.now() - 3600000), user: "System" }
  ]);

  // Determine locked state based on optimistic status
  const isLocked = optimisticStatus === "COMPLETED" || optimisticStatus === "CANCELLED";

  // Timeline sequence
  const timeline = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED"];
  const currentIndex = timeline.indexOf(optimisticStatus);

  // Status visual mapping
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING": return "bg-zinc-800 text-zinc-300 border-zinc-700";
      case "PAID": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "PROCESSING": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "SHIPPED": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "COMPLETED": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "CANCELLED": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  // Available next actions logic
  const getAvailableActions = () => {
    const actions: { id: string, title: string, desc: string, icon: any, color: string }[] = [];
    
    if (isAdmin) {
      if (optimisticStatus !== "PENDING") actions.push({ id: "PENDING", title: "ປ່ຽນເປັນລໍຖ້າຊຳລະ (Set to Pending)", desc: "Admin Override", icon: Clock, color: "text-zinc-500 border-zinc-500/20 hover:border-zinc-500/50 bg-zinc-500/5" });
      if (optimisticStatus !== "PAID") actions.push({ id: "PAID", title: "ໝາຍວ່າຊຳລະແລ້ວ (Mark as Paid)", desc: "Admin Override", icon: CreditCard, color: "text-blue-500 border-blue-500/20 hover:border-blue-500/50 bg-blue-500/5" });
      if (optimisticStatus !== "PROCESSING") actions.push({ id: "PROCESSING", title: "ເລີ່ມດຳເນີນການ (Start Processing)", desc: "Admin Override", icon: Package, color: "text-yellow-500 border-yellow-500/20 hover:border-yellow-500/50 bg-yellow-500/5" });
      if (optimisticStatus !== "SHIPPED") actions.push({ id: "SHIPPED", title: "ໝາຍວ່າຈັດສົ່ງແລ້ວ (Mark as Shipped)", desc: "Admin Override", icon: Truck, color: "text-purple-500 border-purple-500/20 hover:border-purple-500/50 bg-purple-500/5" });
      if (optimisticStatus !== "COMPLETED") actions.push({ id: "COMPLETED", title: "ສຳເລັດອໍເດີ (Complete Order)", desc: "Admin Override", icon: CheckCircle, color: "text-green-500 border-green-500/20 hover:border-green-500/50 bg-green-500/5" });
      if (optimisticStatus !== "CANCELLED") actions.push({ id: "CANCELLED", title: "ຍົກເລີກອໍເດີ (Cancel Order)", desc: "Admin Override", icon: Ban, color: "text-red-500 border-red-500/20 hover:border-red-500/50 bg-red-500/5" });
      return actions;
    }

    if (optimisticStatus === "PENDING") {
      actions.push({ id: "PAID", title: "ໝາຍວ່າຊຳລະແລ້ວ (Mark as Paid)", desc: "ລູກຄ້າໄດ້ສຳເລັດການຊຳລະເງິນ", icon: CreditCard, color: "text-blue-500 border-blue-500/20 hover:border-blue-500/50 bg-blue-500/5" });
      actions.push({ id: "CANCELLED", title: "ຍົກເລີກອໍເດີ (Cancel Order)", desc: "ຍົກເລີກອໍເດີນີ້ຖາວອນ", icon: Ban, color: "text-red-500 border-red-500/20 hover:border-red-500/50 bg-red-500/5" });
    }
    if (optimisticStatus === "PAID") {
      actions.push({ id: "PROCESSING", title: "ເລີ່ມດຳເນີນການ (Start Processing)", desc: "ເລີ່ມຈັດກຽມສິນຄ້າ", icon: Package, color: "text-yellow-500 border-yellow-500/20 hover:border-yellow-500/50 bg-yellow-500/5" });
      actions.push({ id: "CANCELLED", title: "ຍົກເລີກອໍເດີ (Cancel Order)", desc: "ຍົກເລີກອໍເດີນີ້ຖາວອນ", icon: Ban, color: "text-red-500 border-red-500/20 hover:border-red-500/50 bg-red-500/5" });
    }
    if (optimisticStatus === "PROCESSING") {
      actions.push({ id: "SHIPPED", title: "ໝາຍວ່າຈັດສົ່ງແລ້ວ (Mark as Shipped)", desc: "ອໍເດີກຳລັງຖືກຈັດສົ່ງ", icon: Truck, color: "text-purple-500 border-purple-500/20 hover:border-purple-500/50 bg-purple-500/5" });
    }
    if (optimisticStatus === "SHIPPED") {
      actions.push({ id: "COMPLETED", title: "ສຳເລັດອໍເດີ (Complete Order)", desc: "ຈັດສົ່ງສຳເລັດຮຽບຮ້ອຍ", icon: CheckCircle, color: "text-green-500 border-green-500/20 hover:border-green-500/50 bg-green-500/5" });
    }
    
    return actions;
  };

  const availableActions = getAvailableActions();

  const getConfirmWarning = (status: string) => {
    switch(status) {
      case "PAID": return "ນີ້ຈະເປັນການຢືນຢັນວ່າໄດ້ຮັບການຊຳລະເງິນແລ້ວ (Confirm payment received).";
      case "PROCESSING": return "ທ່ານກຳລັງຈະເລີ່ມດຳເນີນການອໍເດີນີ້ (Start processing order).";
      case "SHIPPED": return "ຫຼັງຈາກຈັດສົ່ງແລ້ວ, ຈະບໍ່ສາມາດຍົກເລີກອໍເດີໄດ້ (Cannot cancel after shipping).";
      case "COMPLETED": return "ການດຳເນີນການນີ້ຈະລັອກອໍເດີຖາວອນ (Locks order permanently).";
      case "CANCELLED": return "ການດຳເນີນການນີ້ບໍ່ສາມາດຍົກເລີກໄດ້ (Cannot be undone).";
      default: return "ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການດຳເນີນການຕໍ່? (Are you sure?)";
    }
  };

  const handleActionClick = (targetStatus: string) => {
    setPendingStatus(targetStatus);
    setConfirmText("");
    setStep("confirmation");
  };

  const handleOpenModal = () => {
    if (isLocked && !isAdmin) return;
    setStep("selection");
    setIsModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pendingStatus }),
      });
      
      if (res.ok) {
        toast.success(`Order marked as ${pendingStatus}`);
        
        // Instant UI Update (Optimistic)
        setOptimisticStatus(pendingStatus);
        setFeed(prev => [{ status: pendingStatus, timestamp: new Date(), user: isAdmin ? "Admin" : "Staff" }, ...prev]);
        setStep("selection");
        setPendingStatus(null);
        
        // setIsModalOpen(false); // Stay open to allow consecutive updates
        // We trigger router.refresh() in background to sync DB state without blocking UI
        setTimeout(() => router.refresh(), 500);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to update order status");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isHighRisk = pendingStatus === "COMPLETED" || pendingStatus === "CANCELLED";
  const isConfirmDisabled = loading || (isHighRisk && confirmText !== "CONFIRM");
  const nextHint = availableActions.length > 0 ? `Next: ${availableActions[0].title}` : "Order Locked";

  return (
    <>
      <div className="flex flex-col items-center sm:items-start group relative">
        <button
          onClick={handleOpenModal}
          disabled={loading || (isLocked && !isAdmin)}
          title={`Current Status: ${optimisticStatus}. Click to manage.`}
          className={`px-3 py-1.5 rounded-md border text-xs font-bold transition-all duration-300 flex items-center justify-center min-w-[120px] ${getStatusBadge(optimisticStatus)} hover:opacity-80 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {statusDict?.[optimisticStatus] || optimisticStatus}
        </button>
        {/* Next Step Hint */}
        <span className="text-[9px] text-zinc-500 font-medium mt-1 tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">
          {nextHint}
        </span>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!loading) setIsModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-xl border-zinc-800 bg-zinc-950 text-white shadow-2xl rounded-2xl overflow-hidden p-0 transition-all">
          <div className="p-6">
            <DialogHeader className="pt-2">
              <DialogTitle className="text-xl font-bold tracking-tight text-center text-white">
                {step === "selection" ? "ອັບເດດສະຖານະອໍເດີ (Update Order Status)" : "ຢືນຢັນການປ່ຽນແປງສະຖານະ (Confirm Status Change)"}
              </DialogTitle>
              <DialogDescription className="text-center text-zinc-400 mt-2">
                {step === "selection" 
                  ? "ເລືອກຂັ້ນຕອນຕໍ່ໄປໃນການຈັດການອໍເດີ (Select the next step in the workflow)" 
                  : "ກະລຸນາກວດສອບກ່ອນດຳເນີນການ (Please review before proceeding)"}
              </DialogDescription>
            </DialogHeader>

            {/* TIMELINE VISUALIZATION (Animated) */}
            <div className="mb-14 mt-6">
              <div className="flex items-center justify-between relative px-2">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-800 -z-10 -translate-y-1/2 overflow-hidden">
                   <div 
                     className="h-full bg-blue-500 transition-all duration-700 ease-in-out" 
                     style={{ width: `${(currentIndex / (timeline.length - 1)) * 100}%` }}
                   ></div>
                </div>
                
                {/* Timeline Dots */}
                {timeline.map((status, index) => {
                  const isCompleted = optimisticStatus === "COMPLETED" || index < currentIndex;
                  const isCurrent = index === currentIndex && optimisticStatus !== "CANCELLED";
                  const isCancelled = optimisticStatus === "CANCELLED";
                  
                  // Color calculation
                  let bgColor = "bg-zinc-900 border-zinc-700 text-zinc-600";
                  if (isCompleted) bgColor = "bg-green-500 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-110";
                  else if (isCurrent) bgColor = "bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-110 ring-4 ring-blue-500/20";
                  else if (isCancelled && index === currentIndex) bgColor = "bg-red-500 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-110 ring-4 ring-red-500/20";

                  // Format text to break onto two lines if possible
                  const rawText = statusDict?.[status] || status;
                  const hasParen = rawText.includes(" (");
                  const [mainText, subText] = hasParen ? rawText.split(" (") : [rawText, ""];

                  return (
                    <div key={status} className="flex flex-col items-center group relative">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 transition-all duration-500 ${bgColor}`} title={rawText}>
                        {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : (index + 1)}
                      </div>
                      <div className={`absolute top-full mt-2 w-24 left-1/2 -translate-x-1/2 flex flex-col items-center text-center transition-colors duration-300 ${isCurrent ? 'text-white' : 'text-zinc-500'}`}>
                        <span className="text-[10px] font-bold leading-tight">{mainText}</span>
                        {subText && <span className="text-[9px] font-medium opacity-80 leading-tight">({subText}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP: SELECTION */}
            {step === "selection" && (
              <div className="space-y-6 mt-4">
                {availableActions.length === 0 ? (
                  <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in duration-500">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="text-zinc-200 font-bold">ອໍເດີນີ້ຖືກລັອກ (This order is locked)</h4>
                      <p className="text-sm text-zinc-500 mt-1">ບໍ່ສາມາດດຳເນີນການຕໍ່ໄດ້ສຳລັບອໍເດີສະຖານະ {optimisticStatus.toLowerCase()}.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {availableActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleActionClick(action.id)}
                          className={`flex flex-col items-start p-4 rounded-xl border bg-zinc-900/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-left group ${action.color}`}
                        >
                          <div className="flex items-center gap-3 w-full mb-2">
                            <div className="p-2 rounded-lg bg-zinc-950 shadow-sm group-hover:scale-110 transition-transform duration-300">
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-sm">{action.title}</span>
                          </div>
                          <p className="text-xs opacity-70 leading-relaxed pl-1">{action.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Activity Feed */}
                <div className="pt-4 border-t border-zinc-800/50">
                   <h5 className="text-xs font-bold text-zinc-500 mb-3 flex items-center gap-2"><Clock className="w-3 h-3"/> ປະຫວັດການເຄື່ອນໄຫວ (Activity Feed)</h5>
                   <div className="space-y-3 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                     {feed.map((item, i) => (
                       <div key={i} className="flex items-center justify-between text-xs bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/50 animate-in fade-in duration-500">
                         <div className="flex items-center gap-2 text-zinc-300">
                           <User className="w-3 h-3 text-zinc-500" />
                           <span>{item.user}</span>
                           <span className="text-zinc-600">ອັບເດດສະຖານະເປັນ (marked as)</span>
                           <span className={`font-bold ${getStatusBadge(item.status).split(' ')[1]}`}>{item.status}</span>
                         </div>
                         <span className="text-zinc-600 text-[10px]">{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}

            {/* STEP: CONFIRMATION */}
            {step === "confirmation" && pendingStatus && (
              <div className="flex flex-col items-center justify-center my-2 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-center space-x-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 w-full">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase mb-1">ປັດຈຸບັນ (Current)</span>
                    <span className={`px-3 py-1 rounded-md text-xs font-bold border ${getStatusBadge(optimisticStatus)}`}>
                      {optimisticStatus}
                    </span>
                  </div>
                  <ArrowRight className="text-zinc-600 w-5 h-5 animate-pulse" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase mb-1">ໃໝ່ (New)</span>
                    <span className={`px-3 py-1 rounded-md text-xs font-bold border ${getStatusBadge(pendingStatus)} shadow-lg scale-105`}>
                      {pendingStatus}
                    </span>
                  </div>
                </div>
                
                <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl w-full text-center shadow-inner">
                  <p className="text-sm font-medium text-zinc-200">{getConfirmWarning(pendingStatus)}</p>
                  
                  {isAdmin && (
                    <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" /> ທ່ານກຳລັງຂ້າມຂໍ້ຈຳກັດຂອງລະບົບ (Overriding restrictions)
                    </div>
                  )}

                  <div className="mt-4 text-xs text-zinc-500 space-y-1.5 font-medium flex flex-col items-center">
                    <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span> ບາງການປ່ຽນແປງບໍ່ສາມາດຍົກເລີກໄດ້ (Irreversible)</p>
                    <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span> ລູກຄ້າອາດຈະໄດ້ຮັບແຈ້ງເຕືອນ (Customer notified)</p>
                  </div>
                </div>

                {isHighRisk && (
                  <div className="w-full space-y-2 mt-2">
                    <label className="text-xs text-red-400 font-bold block text-center uppercase tracking-wider">
                      ການດຳເນີນການທີ່ມີຄວາມສ່ຽງ: ພິມ <strong className="text-white">CONFIRM</strong>
                    </label>
                    <input 
                      type="text" 
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="CONFIRM"
                      className="w-full h-11 px-3 bg-zinc-950 border border-red-500/30 rounded-lg text-sm text-center text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-mono shadow-[0_0_15px_rgba(239,68,68,0.1)] focus:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                      autoComplete="off"
                    />
                  </div>
                )}
              </div>
            )}

            <div className={`mt-6 pt-4 border-t border-zinc-800 flex flex-col sm:flex-row gap-3 ${step === 'selection' ? 'sm:justify-end' : 'sm:justify-between'} w-full`}>
              {step === "confirmation" ? (
                <>
                  <button 
                    onClick={() => setStep("selection")}
                    disabled={loading}
                    className="w-full sm:w-1/3 px-4 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white transition-colors disabled:opacity-50"
                  >
                    ກັບຄືນ (Back)
                  </button>
                  <button 
                    onClick={confirmStatusChange}
                    disabled={isConfirmDisabled}
                    className={`w-full sm:w-2/3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center ${
                      pendingStatus === 'CANCELLED' ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 
                      'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ກຳລັງດຳເນີນການ... (Processing...)
                      </span>
                    ) : (
                      "ຢືນຢັນການອັບເດດ (Confirm Update)"
                    )}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                >
                  ປິດ (Close)
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
