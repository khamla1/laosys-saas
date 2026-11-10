"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Loader2, TicketPercent, ScanLine, ChefHat, Sparkles, Utensils, CircleCheck, Clock, CirclePause, CirclePlay, X, Camera } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createPOSOrder, payTableOrder } from "@/app/actions/pos";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreateProductDialog } from "@/components/CreateProductDialog";
import { CameraScannerModal } from "@/components/CameraScannerModal";


type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  status?: string;
};

type CartItem = Product & {
  cartQuantity: number;
};

export function POSClient({ 
  products, 
  t, 
  sellerId,
  paymentQrCode,
  promptPayId,
  paymentAccountInfo,
  activeTable,
  allZones
}: { 
  products: Product[], 
  t: any, 
  sellerId: string,
  paymentQrCode?: string,
  promptPayId?: string,
  paymentAccountInfo?: string,
  activeTable?: any,
  allZones?: any[]
}) {
  const router = useRouter();
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastCart, setLastCart] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  const [mobileCols, setMobileCols] = useState<2|4|6|8>(2);

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; couponId: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Service Charge / Service Fee ("แอ๊ดบริการ")
  const [serviceFee, setServiceFee] = useState<{ label: string; amount: number } | null>(null);
  const [showServiceFeeModal, setShowServiceFeeModal] = useState(false);
  const [customFeeInput, setCustomFeeInput] = useState<number>(20000);

  // Customer Form State
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    note: ""
  });

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  
  // Hold Orders State
  const [heldOrders, setHeldOrders] = useState<{ id: string, cart: CartItem[], customer: any, time: Date }[]>([]);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  
  // Barcode State
  const [barcode, setBarcode] = useState("");
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  const handleCameraScanSuccess = (code: string) => {
    const clean = code.trim();
    if (!clean) return;
    const matched = products.find(p => 
      p.id.toLowerCase() === clean.toLowerCase() ||
      (p as any).barcode?.toLowerCase() === clean.toLowerCase() ||
      (p as any).sku?.toLowerCase() === clean.toLowerCase() ||
      p.name.toLowerCase().includes(clean.toLowerCase())
    );
    if (matched) {
      addToCart(matched);
      toast.success(`ເພີ່ມ "${matched.name}" ລົງໃນກະຕ່າແລ້ວ!`);
    } else {
      setSearch(clean);
      toast.info(`ບໍ່ພົບສິນຄ້າລະຫັດ "${clean}" ລະບົບກຳລັງຄົ້ນຫາໃຫ້...`);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (!p.status || p.status === "ACTIVE")
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    if (product.status && product.status !== "ACTIVE") return;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.stock) return prev;
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.cartQuantity + delta;
          if (newQty > 0 && newQty <= item.stock) {
            return { ...item, cartQuantity: newQty };
          }
        }
        return item;
      }).filter(item => item.cartQuantity > 0); // Failsafe, though decrement handles 0 via remove
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const newItemsTotal = cart.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
  const existingOrder = activeTable?.orders?.[0];
  const existingTotal = existingOrder?.totalAmount || 0;
  const grandTotal = newItemsTotal + existingTotal;

  // We only send the NEW items total to checkout for appending.
  const totalAmount = newItemsTotal;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    const items = cart.map(item => ({
      productId: item.id,
      quantity: item.cartQuantity,
      price: item.price
    }));

    try {
      const result = await createPOSOrder({
        customerName: customer.name || "Walk-in Customer",
        customerEmail: customer.email || "walkin@store.com",
        customerPhone: customer.phone,
        customerNote: customer.note,
        paymentMethod,
        items,
        totalAmount: totalAmount + (serviceFee?.amount || 0) - (appliedCoupon?.discountAmount || 0),
        couponCode: appliedCoupon?.code || undefined,
        discountAmount: appliedCoupon?.discountAmount || 0,
        couponId: appliedCoupon?.couponId || undefined,
        tableId: activeTable?.id,
        serviceFeeAmount: serviceFee?.amount || 0,
        serviceFeeLabel: serviceFee?.label || undefined,
      });

      if (result.success) {
        setLastCart([...cart]);
        setSuccess(true);
        const earned = Math.floor((totalAmount + (serviceFee?.amount || 0) - (appliedCoupon?.discountAmount || 0)) / 10000);
        if (customer.name?.trim() && earned > 0) {
          toast.success(`ສັ່ງຊື້ສຳເລັດ! ພ້ອມສະສົມແຕ້ມ +${earned} ແຕ້ມ ໃຫ້ "${customer.name}"`);
        } else {
          toast.success("ສັ່ງຊື້ ແລະ ຊຳລະເງິນສຳເລັດແລ້ວ!");
        }
        setCart([]);
        setAppliedCoupon(null);
        setServiceFee(null);
        setCouponCode("");
        setCashReceived("");
        setCustomer({ name: "", email: "", phone: "", note: "" });
        router.refresh();
        setTimeout(() => setSuccess(false), 5000);
      } else {
        toast.error("Error: " + (result.error || "ບໍ່ສາມາດສ້າງ Order ໄດ້"));
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ ກະລຸນາລອງໃໝ່");
    } finally {
      setLoading(false);
    }
  };

  const handlePayBill = async () => {
    if (!existingOrder || !activeTable) return;
    setLoading(true);

    try {
      const result = await payTableOrder({
        orderId: existingOrder.id,
        tableId: activeTable.id,
        paymentMethod,
        cashReceived: Number(cashReceived) || 0,
        changeAmount
      });

      if (result.success) {
        setSuccess(true);
        setAppliedCoupon(null);
        setCouponCode("");
        setCashReceived("");
        setCustomer({ name: "", email: "", phone: "", note: "" });
        router.refresh();
        setTimeout(() => {
          setSuccess(false);
          router.push('/dashboard/restaurant/zones');
        }, 3000);
      } else {
        toast.error("Payment Error: " + (result.error || "ຊຳລະເງິນບໍ່ສຳເລັດ"));
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການຊຳລະເງິນ ກະລຸນາລອງໃໝ່");
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    // Simulate finding by barcode (metadata.barcode or ID or Name for testing)
    const product = products.find(p => 
      p.id === barcode || 
      (p as any).metadata?.barcode === barcode ||
      (p as any).metadata?.sku === barcode ||
      p.name.toLowerCase() === barcode.toLowerCase()
    );

    if (product) {
      addToCart(product);
      toast.success(`ເພີ່ມ ${product.name} ຈາກບາໂຄດແລ້ວ`);
    } else {
      toast.error(`ບໍ່ພົບສິນຄ້າສຳລັບບາໂຄດ: ${barcode}`);
    }
    
    setBarcode("");
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: Math.random().toString(36).substr(2, 9),
      cart: [...cart],
      customer: { ...customer },
      time: new Date()
    };
    setHeldOrders(prev => [...prev, newHold]);
    setCart([]);
    setCustomer({ name: "", email: "", phone: "", note: "" });
    setAppliedCoupon(null);
    setCouponCode("");
    setCashReceived("");
    toast.success("ພັກບິນສຳເລັດແລ້ວ (Order Held)");
  };

  const handleResumeOrder = (holdId: string) => {
    const orderToResume = heldOrders.find(o => o.id === holdId);
    if (orderToResume) {
      setCart(orderToResume.cart);
      setCustomer(orderToResume.customer);
      setHeldOrders(prev => prev.filter(o => o.id !== holdId));
      setShowHeldOrders(false);
      toast.success("ດຶງບິນກັບມາແລ້ວ (Order Resumed)");
    }
  };

  const finalTotalAmount = Math.max(0, totalAmount + (serviceFee?.amount || 0) - (appliedCoupon?.discountAmount || 0));
  const changeAmount = paymentMethod === "CASH" && Number(cashReceived) > 0 ? Number(cashReceived) - finalTotalAmount : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-[calc(100dvh-110px)] lg:h-[calc(100vh-120px)] min-h-[500px]">
      {/* Left: Product Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border border-zinc-800 rounded-xl bg-zinc-900/30 shadow-lg">
        <div className="p-3 sm:p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <Input 
                placeholder="ຄົ້ນຫາສິນຄ້າ..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-zinc-800/50 border-zinc-700 text-white focus-visible:ring-1 focus-visible:ring-orange-500 transition-all shadow-sm"
              />
            </div>
            <form onSubmit={handleBarcodeSubmit} className="hidden sm:block relative w-32 sm:w-44 shrink-0">
              <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
              <Input 
                placeholder="ຍິງບາໂຄດ..." 
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="pl-10 bg-zinc-950 border-zinc-700 text-emerald-400 font-mono focus-visible:ring-1 focus-visible:ring-orange-500 transition-all shadow-sm"
              />
            </form>
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="px-3 sm:px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/20 active:scale-95"
              title="ເປີດກ້ອງສະແກນບາໂຄດສິນຄ້າເພື່ອເພີ່ມລົງກະຕ່າ"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">ເປີດກ້ອງສະແກນ (Camera Scan)</span>
              <span className="sm:hidden">ກ້ອງສະແກນ</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-1.5 sm:gap-2">
            <span className="text-xs text-zinc-400 font-medium hidden sm:inline">ຮູບແບບ:</span>
            <div className="flex items-center gap-0.5 sm:gap-1 bg-zinc-800/50 p-1 rounded-lg border border-zinc-700 shrink-0">
              {[2, 4, 6, 8].map(cols => (
                <button
                  key={cols}
                  onClick={() => setMobileCols(cols as 2|4|6|8)}
                  className={`px-2 sm:px-3 py-1 text-xs font-bold rounded-md transition-colors ${mobileCols === cols ? 'bg-orange-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'}`}
                >
                  {cols}
                </button>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowHeldOrders(!showHeldOrders)}
              className={`h-8 px-2.5 sm:px-3 text-xs font-bold border-zinc-700 hover:bg-zinc-800 shrink-0 ${heldOrders.length > 0 ? 'text-orange-400 border-orange-500/50' : 'text-zinc-400'}`}
            >
              <CirclePause className="mr-1 w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ພັກບິນ ({heldOrders.length})
            </Button>
            <CreateProductDialog />

            {/* Table Indicator & Selector */}
            {activeTable ? (
              <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/40 px-2.5 sm:px-3 py-1 rounded-xl h-8 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-300 truncate max-w-[110px] sm:max-w-none">
                  {activeTable.zone?.name ? `${activeTable.zone.name} - ${activeTable.name}` : activeTable.name}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(true)}
                  className="ml-1 text-[11px] font-bold text-emerald-400 hover:underline"
                  title="ປ່ຽນໂຕ໊ະ"
                >
                  ປ່ຽນ
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/pos')}
                  className="p-0.5 text-zinc-500 hover:text-zinc-300 ml-0.5"
                  title="ຍົກເລີກເລືອກໂຕ໊ະ (Walk-in)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTableModalOpen(true)}
                className="h-8 px-2.5 sm:px-3 text-xs font-bold border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 shrink-0"
              >
                <Utensils className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                <span>ເລືອກໂຕ໊ະສັ່ງຊື້</span>
              </Button>
            )}

            <a
              href="/dashboard/restaurant/cashier"
              className="h-8 px-2.5 sm:px-3 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md transition-all shrink-0"
              title="ຈັດການບິນໂຕ໊ະອາຫານ (Cashier Dashboard)"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>ຈັດການບິນໂຕ໊ະ</span>
            </a>
          </div>
        </div>

        {showHeldOrders && (
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md relative z-20 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                ບິນທີ່ພັກໄວ້ (Held Orders)
              </h3>
              <button onClick={() => setShowHeldOrders(false)} className="text-zinc-400 hover:text-white text-xs">ປິດ</button>
            </div>
            {heldOrders.length === 0 ? (
              <p className="text-zinc-500 text-xs text-center py-4">ບໍ່ມີບິນທີ່ພັກໄວ້</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                {heldOrders.map(h => (
                  <div key={h.id} className="min-w-[200px] bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-zinc-300">{h.customer.name || "Walk-in"}</span>
                      <span className="text-[10px] text-zinc-500">{h.time.toLocaleTimeString()}</span>
                    </div>
                    <div className="text-xs text-emerald-400 font-bold mb-3">
                      {h.cart.length} ຢ່າງ
                    </div>
                    <Button onClick={() => handleResumeOrder(h.id)} className="w-full h-7 text-xs bg-orange-600 hover:bg-orange-500 text-white">
                      <CirclePlay className="w-3 h-3 mr-1" /> ເອີ້ນຄືນ
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-24 lg:pb-4 custom-scrollbar">
          <div className={`grid gap-1 sm:gap-2 ${
            mobileCols === 2 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' :
            mobileCols === 4 ? 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8' :
            mobileCols === 6 ? 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12' :
            'grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-12' // 8 cols
          }`}>
            {filteredProducts.map(product => {
              const inCart = cart.find(i => i.id === product.id)?.cartQuantity || 0;
              const isOutOfStock = product.stock <= 0;

              // Dynamic text sizes based on columns
              let titleSize = "text-[9px] sm:text-[10px]";
              let priceSize = "text-[8px] sm:text-[9px]";
              let stockSize = "text-[7px] sm:text-[8px]";
              let padSize = "p-1 sm:p-2";
              let imgTextSize = "text-[8px]";

              if (mobileCols === 2) {
                titleSize = "text-xs sm:text-sm"; priceSize = "text-xs sm:text-sm"; stockSize = "text-[10px] sm:text-xs"; padSize = "p-2 sm:p-3"; imgTextSize = "text-xs";
              } else if (mobileCols === 4) {
                titleSize = "text-[10px] sm:text-xs"; priceSize = "text-[10px] sm:text-xs"; stockSize = "text-[8px] sm:text-[10px]"; padSize = "p-1.5 sm:p-2"; imgTextSize = "text-[10px]";
              } else if (mobileCols === 8) {
                titleSize = "text-[7px] sm:text-[8px]"; priceSize = "text-[7px] sm:text-[8px]"; stockSize = "text-[6px] sm:text-[7px]"; padSize = "p-0.5 sm:p-1"; imgTextSize = "text-[6px]";
              }

              return (
                <div 
                  key={product.id} 
                  onClick={() => addToCart(product)}
                  className={`relative group rounded-xl border overflow-hidden transition-all flex flex-col animate-in fade-in zoom-in-95 duration-300 fill-mode-both ${
                    isOutOfStock ? "bg-zinc-900 border-zinc-800 opacity-50 cursor-not-allowed" : "bg-zinc-900/40 backdrop-blur-sm border-zinc-800 cursor-pointer hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] active:scale-[0.98]"
                  }`}
                >
                  {!isOutOfStock && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-orange-500/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0" />}
                  <div className="aspect-[4/3] bg-zinc-800/50 relative shrink-0">
                    {product.images?.[0] ? (
                      <Image 
                        src={product.images[0]} 
                        alt={product.name} 
                        fill
                        sizes="(max-width: 768px) 33vw, 20vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105 relative z-10" 
                      />
                    ) : (
                      <div className={`w-full h-full flex flex-col items-center justify-center ${imgTextSize} text-zinc-600 relative z-10`}>
                        <span className="text-[10px] sm:text-xs">ບໍ່ມີຮູບ</span>
                      </div>
                    )}
                    {inCart > 0 && (
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-orange-500 text-white text-[8px] sm:text-[10px] font-bold px-1.5 min-w-[1.25rem] h-5 rounded-full flex items-center justify-center shadow-lg border border-orange-400 z-20 animate-in zoom-in duration-200">
                        {inCart}
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                        <span className={`bg-red-500 text-white px-1 py-0.5 ${mobileCols >= 6 ? 'text-[7px]' : 'text-[9px]'} font-bold rounded-sm`}>
                          {t.outOfStock}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`${padSize} flex-1 flex flex-col justify-between`}>
                    <h3 className={`font-semibold text-zinc-200 ${titleSize} truncate leading-snug relative z-10 group-hover:text-orange-400 transition-colors`} title={product.name}>{product.name}</h3>
                    <div className="mt-1 relative z-10">
                      <p className={`text-emerald-400 font-bold ${priceSize}`}>₭{product.price.toLocaleString()}</p>
                      <p className={`${stockSize} text-zinc-500 mt-0.5 truncate`}>ເຫຼືອ {product.stock} ຊິ້ນ</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-3 shadow-inner">
                <ShoppingCart className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-base font-bold text-zinc-300">ບໍ່ພົບສິນຄ້າ</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                {search ? `ບໍ່ມີສິນຄ້າທີ່ກົງກັບ "${search}"` : "ຍັງບໍ່ມີລາຍການສິນຄ້າໃນຮ້ານ ຫຼື ຍັງບໍ່ໄດ້ເປີດໃຊ້ງານສິນຄ້າ"}
              </p>
              {!search && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <a
                    href="/dashboard/products/manage"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-md transition-colors"
                  >
                    + ເພີ່ມສິນຄ້າໃໝ່
                  </a>
                  <button
                    onClick={async () => {
                      toast.loading("ກຳລັງສ້າງຂໍ້ມູນຕົວຢ່າງ...", { id: "seed" });
                      try {
                        const res = await fetch("/api/seed-demo", { method: "POST" });
                        if (res.ok) {
                          toast.success("ສ້າງຂໍ້ມູນຕົວຢ່າງສຳເລັດແລ້ວ!", { id: "seed" });
                          window.location.reload();
                        } else {
                          toast.error("ບໍ່ສາມາດສ້າງຂໍ້ມູນຕົວຢ່າງໄດ້", { id: "seed" });
                        }
                      } catch (e) {
                        toast.error("ເກີດຂໍ້ຜິດພາດ", { id: "seed" });
                      }
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-lg border border-zinc-700 transition-colors"
                  >
                    ສ້າງຂໍ້ມູນຕົວຢ່າງ (Demo Data)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart & Checkout (Drawer on Mobile) */}
      <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end lg:static lg:bg-transparent lg:backdrop-blur-none transition-all duration-300 ${showMobileCart ? 'opacity-100 visible' : 'opacity-0 invisible lg:opacity-100 lg:visible'} lg:w-[400px] lg:h-full shrink-0`}>
        {/* Click outside to close on mobile */}
        <div className="flex-1 lg:hidden" onClick={() => setShowMobileCart(false)} />
        
        <Card className={`w-full h-[90dvh] lg:h-full flex flex-col bg-zinc-900 border-zinc-800 rounded-t-3xl lg:rounded-xl overflow-hidden shrink-0 transition-transform duration-300 ${showMobileCart ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}`}>
          <div className="p-4 border-b border-zinc-800 bg-zinc-800/30 flex items-center justify-between gap-2 shrink-0">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 shrink-0">
              <ShoppingCart size={18} className="text-blue-400" />
              {t.cart}
            </h2>
            {activeTable && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/50 truncate">
                Table: {activeTable.name}
              </span>
            )}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="bg-zinc-800 px-2 py-1 rounded-md text-xs font-medium text-zinc-300">
                {cart.reduce((a, b) => a + b.cartQuantity, 0)} Items
              </div>
              <Button 
                onClick={handleHoldOrder}
                disabled={cart.length === 0}
                variant="outline" 
                size="sm"
                className="flex h-7 px-2 text-[10px] font-bold border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-orange-400 hover:border-orange-500/50"
              >
                <CirclePause className="mr-1 w-3 h-3" />
                ພັກບິນ
              </Button>
              <button 
                onClick={() => setShowMobileCart(false)}
                className="lg:hidden p-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors"
              >
                <Minus size={16} />
              </button>
            </div>
          </div>

        {/* Scrollable Body: Cart Items + Customer Form */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="p-4 flex-1">
            {success ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300 min-h-[150px]">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                  <ShoppingCart size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{t.successTitle}</h3>
                  <p className="text-zinc-400 text-sm mt-1">{t.successDesc}</p>
                </div>
                <div className="flex gap-2 w-full mt-4 justify-center">
                  <Button onClick={() => setSuccess(false)} variant="outline" className="border-zinc-700 hover:bg-zinc-800 flex-1">
                    {t.newOrder}
                  </Button>
                  {lastCart.length > 0 && activeTable && (
                    <Button onClick={() => {
                      const style = document.createElement('style');
                      style.innerHTML = '@media print { .print-kitchen { display: block !important; } .print-receipt { display: none !important; } }';
                      document.head.appendChild(style);
                      setTimeout(() => { window.print(); style.remove(); }, 100);
                    }} className="bg-orange-600 hover:bg-orange-700 flex-1">
                      <ChefHat className="w-4 h-4 mr-2" />
                      ພິມใบส่งครัว
                    </Button>
                  )}
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-3 min-h-[150px]">
                <ShoppingCart size={48} className="opacity-20" />
                <p className="text-sm">{t.emptyCart}</p>
                {existingOrder && (
                  <p className="text-xs text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
                    ມີລາຍການອາຫານທີ່ສັ່ງແລ້ວ (Has existing orders)
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Existing Items (Read-only) */}
                {existingOrder?.items?.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <div className="w-4 h-px bg-zinc-700"></div>
                      ທີ່ສັ່ງແລ້ວ (Ordered)
                      <div className="flex-1 h-px bg-zinc-700"></div>
                    </div>
                    {existingOrder.items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/30 opacity-70">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-zinc-300 truncate">{item.product?.name || 'Unknown'}</h4>
                          <p className="text-zinc-500 font-semibold text-xs">₭{item.price.toLocaleString()} x {item.quantity}</p>
                        </div>
                        <div className="font-semibold text-zinc-300 text-sm">
                          ₭{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-xs font-bold text-emerald-500/80 uppercase tracking-wider mt-4 mb-2 flex items-center gap-2">
                      <div className="w-4 h-px bg-emerald-900"></div>
                      ສັ່ງເພີ່ມ (New Items)
                      <div className="flex-1 h-px bg-emerald-900"></div>
                    </div>
                  </div>
                )}
                
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-zinc-800/30 p-3 rounded-lg border border-zinc-800/50">
                    {item.images?.[0] ? (
                      <div className="relative w-16 h-16 sm:w-12 sm:h-12 shrink-0">
                        <Image 
                          src={item.images[0]} 
                          alt={item.name} 
                          fill
                          sizes="64px"
                          className="rounded bg-zinc-800 object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-12 sm:h-12 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-600 shrink-0">No Img</div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-zinc-200 truncate">{item.name}</h4>
                      <p className="text-emerald-400 font-semibold text-sm">₭{item.price.toLocaleString()}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      
                      <div className="flex items-center gap-2 bg-zinc-900 rounded-md border border-zinc-700 p-0.5">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-sm transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-medium w-4 text-center">{item.cartQuantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={item.cartQuantity >= item.stock}
                          className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-sm transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Form & Payment Info (Inside Scrollable Area) */}
          {!success && cart.length > 0 && (
            <div className="border-t border-zinc-800 bg-zinc-900/50 p-4 space-y-4 shrink-0">
              <div className="space-y-2">
                <Input 
                  placeholder={t.customerNameOptional} 
                  value={customer.name}
                  onChange={e => setCustomer({...customer, name: e.target.value})}
                  className="bg-zinc-950 border-zinc-800 text-sm h-9"
                />
                <div className="flex gap-2">
                  <Input 
                    placeholder={t.customerPhoneOptional} 
                    value={customer.phone}
                    onChange={e => setCustomer({...customer, phone: e.target.value})}
                    className="bg-zinc-950 border-zinc-800 text-sm h-9"
                  />
                </div>
              </div>

              {/* Promo & Member Card Fields */}
              <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TicketPercent size={18} className="text-emerald-400" />
                    <span className="text-zinc-300 font-medium text-sm sm:text-base">ສ່ວນຫຼຸດ / ຄູປອງ / ໂປຣໂມຊັ່ນ (Coupon / Promotion)</span>
                  </div>
                  <a
                    href="/dashboard/marketing/promotions"
                    target="_blank"
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>ເບິ່ງໂປຣໂມຊັ່ນ</span>
                  </a>
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="ປ້ອນລະຫັດຄູປອງ ຫຼື ລະຫັດແຄມເປນໂປຣໂມຊັ່ນ..." 
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    disabled={appliedCoupon !== null}
                    className="bg-zinc-900 border-zinc-700 text-white uppercase focus-visible:ring-emerald-500 h-9 text-xs"
                  />
                  {appliedCoupon ? (
                    <Button 
                      type="button"
                      onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                      variant="destructive"
                      className="h-9 text-xs font-bold"
                    >
                      ຍົກເລີກ
                    </Button>
                  ) : (
                    <Button 
                      type="button"
                      onClick={async () => {
                        if (!couponCode) return;
                        setValidatingCoupon(true);
                        setCouponError("");
                        try {
                          // 1. First check standard coupons / cards
                          const res = await fetch("/api/checkout/validate-coupon", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ 
                              code: couponCode, 
                              sellerId, 
                              orderAmount: totalAmount,
                              productIds: cart.map(i => i.id)
                            })
                          });
                          const data = await res.json();
                          if (res.ok && (data.success || data.valid)) {
                            setAppliedCoupon(data);
                            toast.success(`ນຳໃຊ້ຄູປອງ "${data.code}" ສຳເລັດ! (ສ່ວນຫຼຸດ ₭${data.discountAmount?.toLocaleString() || 0})`);
                            setValidatingCoupon(false);
                            return;
                          }

                          // 2. Fallback: Check Active Promotion Campaign (/api/dashboard/promotions/check)
                          const promoRes = await fetch(`/api/dashboard/promotions/check?code=${encodeURIComponent(couponCode)}`);
                          if (promoRes.ok) {
                            const promoData = await promoRes.json();
                            if (promoData.found && promoData.valid) {
                              const discount = promoData.type === "PERCENTAGE" 
                                ? Math.floor(totalAmount * (promoData.discountValue / 100))
                                : Number(promoData.discountValue || 0);
                              setAppliedCoupon({
                                code: promoData.code || promoData.name,
                                discountAmount: discount,
                                couponId: promoData.id
                              });
                              toast.success(`ນຳໃຊ້ໂປຣໂມຊັ່ນ "${promoData.code || promoData.name}" ສຳເລັດ! (ສ່ວນຫຼຸດ ₭${discount.toLocaleString()})`);
                              setValidatingCoupon(false);
                              return;
                            } else if (promoData.found && !promoData.valid) {
                              setCouponError(promoData.reason || "ແຄມເປນນີ້ບໍ່ສາມາດໃຊ້ງານໄດ້");
                              setValidatingCoupon(false);
                              return;
                            }
                          }

                          setCouponError(data.error || "ລະຫັດຄູປອງ ຫຼື ໂປຣໂມຊັ່ນບໍ່ຖືກຕ້ອງ");
                        } catch (err) {
                          setCouponError("ເກີດຂໍ້ຜິດພາດໃນການກວດສອບລະຫັດ");
                        }
                        setValidatingCoupon(false);
                      }}
                      disabled={validatingCoupon || !couponCode}
                      className="bg-amber-600 hover:bg-amber-500 text-white h-9 shrink-0 text-xs font-bold"
                    >
                      {validatingCoupon ? "ກວດສອບ..." : "ນຳໃຊ້ສ່ວນຫຼຸດ"}
                    </Button>
                  )}
                </div>
                {couponError && <p className="text-red-400 text-xs mt-0.5">{couponError}</p>}
                {appliedCoupon && (
                  <p className="text-emerald-400 text-xs mt-0.5 font-bold flex items-center gap-1">
                    <CircleCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ນຳໃຊ້ສຳເລັດ: {appliedCoupon.code} (ສ່ວນຫຼຸດ -₭{appliedCoupon.discountAmount?.toLocaleString()})</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5 py-2 border-t border-zinc-800">
                <div className="flex items-center justify-between pb-1">
                  <button
                    type="button"
                    onClick={() => setShowServiceFeeModal(true)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600/20 to-orange-600/20 hover:from-amber-600/30 hover:to-orange-600/30 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ ຄ່າບໍລິການເສີມ (Service Charge / Fee)</span>
                  </button>
                </div>
                {serviceFee && (
                  <div className="flex items-center justify-between text-xs text-amber-300 font-medium bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      {serviceFee.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>+₭{serviceFee.amount.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => setServiceFee(null)}
                        className="text-zinc-400 hover:text-white font-bold"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                {existingTotal > 0 && (
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span>ຍອດສັ່ງແລ້ວ (Existing Bill)</span>
                    <span>₭{existingTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-zinc-300">
                  <span>ຍອດສັ່ງເພີ່ມ (New Items)</span>
                  <span>₭{newItemsTotal.toLocaleString()}</span>
                </div>
                {appliedCoupon && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">ຍອດລວມກ່ອນຫຼຸດ (Subtotal)</span>
                      <span className="text-zinc-400 line-through">₭{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
                      <span>ສ່ວນຫຼຸດ ({appliedCoupon.code})</span>
                      <span>-₭{appliedCoupon.discountAmount.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="flex items-end justify-between pt-1">
                  <span className="text-zinc-400 font-medium">{t.total}</span>
                  <div className="flex flex-col items-end">
                    {appliedCoupon && (
                      <span className="text-zinc-500 font-medium text-xs sm:text-sm line-through mb-0.5">
                        ₭{totalAmount.toLocaleString()}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-emerald-400">
                      ₭{finalTotalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <span className="text-zinc-300 font-medium text-sm sm:text-base">ຊ່ອງທາງການຊຳລະເງິນ (Payment Method)</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={paymentMethod === "CASH" ? "default" : "outline"}
                    className={`flex-1 ${paymentMethod === "CASH" ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white"}`}
                    onClick={() => { setPaymentMethod("CASH"); setCashReceived(""); }}
                  >
                    ເງິນສົດ (Cash)
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "TRANSFER" ? "default" : "outline"}
                    className={`flex-1 ${paymentMethod === "TRANSFER" ? "bg-purple-600 hover:bg-purple-700" : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white"}`}
                    onClick={() => { setPaymentMethod("TRANSFER"); setCashReceived(""); }}
                  >
                    ໂອນເງິນ (Transfer)
                  </Button>
                </div>
              </div>

              {/* Cash Change Calculator */}
              {paymentMethod === "CASH" && (
                <div className="pt-2 border-t border-zinc-800 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-medium text-sm">ຮັບເງິນມາ (Cash Received)</span>
                  </div>
                  <Input 
                    type="number"
                    placeholder="ປ້ອນຈຳນວນເງິນ..."
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-lg font-bold h-12 text-emerald-400 focus-visible:ring-emerald-500"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {[50000, 100000, 500000, finalTotalAmount].map((amt, idx) => (
                      <Button
                        key={idx}
                        type="button"
                        variant="outline"
                        onClick={() => setCashReceived(amt.toString())}
                        className="h-8 px-0 text-xs bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white font-medium"
                      >
                        {idx === 3 ? "ພໍດີ" : `₭${(amt/1000).toFixed(0)}k`}
                      </Button>
                    ))}
                  </div>
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-800">
                  <span className="text-lg font-bold text-white">ຍອດລວມທັງໝົດ (Grand Total)</span>
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                    ₭{Math.max(0, grandTotal + (serviceFee?.amount || 0) - (appliedCoupon?.discountAmount || 0)).toLocaleString()}
                  </span>
                </div>
              {Number(cashReceived) > 0 && (
                <div className="flex items-center justify-between bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                      <span className="text-zinc-400 font-medium text-sm">ເງິນທອນ (Change)</span>
                      <span className={`text-xl font-black ${changeAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ₭{changeAmount >= 0 ? changeAmount.toLocaleString() : "ຍອດບໍ່ພໍ"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic QR / Payment QR Code */}
              {paymentMethod === "TRANSFER" && (paymentQrCode || promptPayId) && (
                <div className="py-3 border-y border-zinc-800 bg-zinc-950/50 rounded-xl px-4 text-center">
                  <p className="text-zinc-300 text-xs font-semibold mb-2">QR ຊຳລະເງິນ (Payment QR)</p>
                  <div className="w-32 h-32 bg-white p-1.5 rounded-lg mx-auto mb-2 border border-zinc-700">
                    {promptPayId && finalTotalAmount > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={`/api/promptpay?id=${encodeURIComponent(promptPayId)}&amount=${finalTotalAmount}`} alt="Dynamic PromptPay QR Code" className="w-full h-full object-contain" />
                    ) : paymentQrCode ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={paymentQrCode} alt="Static Payment QR Code" className="w-full h-full object-contain" />
                    ) : null}
                  </div>
                  {paymentAccountInfo && (
                    <div className="text-[10px] text-zinc-400 whitespace-pre-wrap max-h-16 overflow-y-auto custom-scrollbar">
                      {paymentAccountInfo}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Checkout Button */}
        {!success && (cart.length > 0 || existingOrder) && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900 shrink-0 flex gap-2">
            {cart.length > 0 ? (
              <Button 
                onClick={handleCheckout}
                disabled={loading || (paymentMethod === "CASH" && Number(cashReceived) > 0 && changeAmount < 0)}
                className={`w-full text-white font-medium text-lg h-12 shadow-[0_0_20px_rgba(37,99,235,0.2)] ${
                  paymentMethod === "CASH" && Number(cashReceived) > 0 && changeAmount < 0 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    ກຳລັງສັ່ງ...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2" size={20} />
                    {activeTable ? 'ສັ່ງອາຫານ (Place Order)' : t.checkout}
                  </>
                )}
              </Button>
            ) : (
              // Only existing items - user wants to pay or print pre-bill
              <>
                <Button 
                  onClick={() => {
                    setTimeout(() => window.print(), 100);
                  }}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 h-12 border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                >
                  ພິມແຈ້ງບິນ
                </Button>
                <Button 
                  onClick={handlePayBill}
                  disabled={loading || (paymentMethod === "CASH" && Number(cashReceived) > 0 && changeAmount < 0)}
                  className={`flex-1 text-white font-medium h-12 shadow-[0_0_20px_rgba(16,185,129,0.2)] ${
                    paymentMethod === "CASH" && Number(cashReceived) > 0 && changeAmount < 0 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <CreditCard className="mr-2" size={20} />}
                  ຮັບຊຳລະເງິນ
                </Button>
              </>
            )}
          </div>
        )}
      </Card>
      </div>

      {/* Printable Receipt (Hidden on screen, visible on print) */}
      <div className="hidden print:block print-receipt fixed inset-0 bg-white z-50 p-4 text-black text-sm w-[80mm] mx-auto font-mono">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">LAOSYS</h2>
          <p className="text-xs">ສາຂາຫຼັກ (Main Branch)</p>
          <p className="text-xs mt-1">ໃບບິນ / ໃບແຈ້ງຍອດ (Pre-Bill)</p>
          {activeTable && <p className="font-bold mt-2">ໂຕະ (Table): {activeTable.name}</p>}
        </div>
        
        <div className="border-t border-b border-black border-dashed py-2 mb-2">
          <div className="flex justify-between font-bold text-xs mb-1">
            <span>ລາຍການ</span>
            <span>ລວມ</span>
          </div>
          {existingOrder?.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between text-xs mb-1">
              <span>{item.product?.name} x{item.quantity}</span>
              <span>{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          {cart.map((item: any) => (
            <div key={item.id} className="flex justify-between text-xs mb-1">
              <span>{item.name} x{item.cartQuantity}</span>
              <span>{(item.price * item.cartQuantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between font-bold text-sm">
          <span>ຍອດລວມທັງໝົດ:</span>
          <span>₭{(grandTotal).toLocaleString()}</span>
        </div>
        
        <div className="text-center mt-6 text-xs">
          <p>ຂໍຂອບໃຈທີ່ມາອຸດໜູນ</p>
          <p>Thank You</p>
        </div>
      </div>

      {/* Printable Kitchen Ticket */}
      {lastCart.length > 0 && activeTable && (
        <div className="hidden print-kitchen fixed inset-0 bg-white z-[60] p-4 text-black text-sm w-[80mm] mx-auto font-mono">
          <div className="text-center mb-4 border-b-2 border-black pb-2">
            <h2 className="text-2xl font-black uppercase">KITCHEN TICKET</h2>
            <p className="font-bold text-lg mt-2">ໂຕະ (Table): {activeTable.name}</p>
            <p className="text-xs">{new Date().toLocaleString()}</p>
          </div>
          
          <div className="space-y-3 mb-4">
            {lastCart.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start border-b border-black/20 pb-2">
                <span className="font-bold text-lg">{item.name}</span>
                <span className="font-black text-xl">x{item.cartQuantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating View Cart Button (Mobile Only - Ultra Premium) */}
      {!showMobileCart && (cart.length > 0 || existingOrder) && !success && (
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-transparent lg:hidden z-40 pb-safe pointer-events-none">
          <div className="relative max-w-md mx-auto pointer-events-auto">
            <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full animate-pulse pointer-events-none" />
            <Button 
              onClick={() => setShowMobileCart(true)}
              className="relative w-full h-16 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-2xl shadow-[0_8px_30px_rgba(59,130,246,0.4)] flex items-center justify-between px-4 sm:px-6 border border-white/20 transition-all duration-300 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-[position:200%_0,0_0] bg-no-repeat transition-[background-position_0s_ease] group-hover:bg-[position:-200%_0,0_0] group-hover:duration-[1500ms]" />
              
              <div className="flex items-center gap-3 sm:gap-4 relative z-10 min-w-0">
                <div className="relative flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] shrink-0">
                  <ShoppingCart size={20} className="drop-shadow-md" />
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(244,63,94,0.6)] border-2 border-blue-500 animate-bounce">
                    {cart.reduce((a, b) => a + b.cartQuantity, 0) + (existingOrder?.items?.reduce((a: number, b: any) => a + b.quantity, 0) || 0)}
                  </span>
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-black text-xs sm:text-sm uppercase tracking-wider drop-shadow-md truncate">
                    {cart.length > 0 ? (t.viewCart || 'ເບິ່ງກະຕ່າ (View Cart)') : 'ເບິ່ງບິນໂຕະ (Table Bill)'}
                  </span>
                  <span className="text-[10px] text-blue-100 font-medium uppercase tracking-widest opacity-80">Tap to checkout</span>
                </div>
              </div>
              <div className="relative z-10 flex flex-col items-end shrink-0">
                <span className="font-black text-lg sm:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                  ₭{Math.max(0, grandTotal + (serviceFee?.amount || 0) - (appliedCoupon?.discountAmount || 0)).toLocaleString()}
                </span>
                {appliedCoupon && (
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded text-white font-bold backdrop-blur-sm border border-white/20 mt-0.5">
                    DISCOUNTED
                  </span>
                )}
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* SERVICE FEE MODAL ("แอ๊ดบริการ") IN POS */}
      {showServiceFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                ເພີ່ມຄ່າບໍລິການເສີມ (Service Charge)
              </h3>
              <button
                type="button"
                onClick={() => setShowServiceFeeModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-6">
              ເລືອກອັດຕາຄ່າບໍລິການເສີມ ຫຼື ລະບຸຈຳນວນເງິນທີ່ຕ້ອງການເພີ່ມໃນບິນຂາຍໜ້າຮ້ານນີ້
            </p>

            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setServiceFee({
                    label: "ຄ່າບໍລິການ 10% (10% Service Charge)",
                    amount: Math.round(totalAmount * 0.1),
                  });
                  setShowServiceFeeModal(false);
                }}
                className="w-full p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-between text-left transition-all group"
              >
                <div>
                  <p className="font-bold text-white group-hover:text-amber-300">ຄ່າບໍລິການ 10% (10% Service Charge)</p>
                  <p className="text-xs text-zinc-400">ຄິດໄລ່ຈາກຍອດອາຫານ ₭{totalAmount.toLocaleString()}</p>
                </div>
                <span className="font-black text-amber-400 text-lg">
                  +₭{Math.round(totalAmount * 0.1).toLocaleString()}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setServiceFee({
                    label: "ຄ່າບໍລິການ 5% (5% Service Charge)",
                    amount: Math.round(totalAmount * 0.05),
                  });
                  setShowServiceFeeModal(false);
                }}
                className="w-full p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-between text-left transition-all group"
              >
                <div>
                  <p className="font-bold text-white group-hover:text-amber-300">ຄ່າບໍລິການ 5% (5% Service Charge)</p>
                  <p className="text-xs text-zinc-400">ຄິດໄລ່ຈາກຍອດອາຫານ ₭{totalAmount.toLocaleString()}</p>
                </div>
                <span className="font-black text-amber-400 text-lg">
                  +₭{Math.round(totalAmount * 0.05).toLocaleString()}
                </span>
              </button>

              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-700 space-y-2">
                <p className="text-xs font-bold text-zinc-300">ກຳນົດຄ່າບໍລິການພິເສດ / ຄ່າຫ້ອງ / ຄ່າສົ່ງ (Custom Amount ₭)</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={customFeeInput}
                    onChange={(e) => setCustomFeeInput(Number(e.target.value))}
                    className="bg-zinc-950 border-zinc-800 text-white font-bold text-sm rounded-xl h-11"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      setServiceFee({
                        label: "ຄ່າບໍລິການພິເສດ / ບໍລິການເສີມ",
                        amount: Number(customFeeInput) || 0,
                      });
                      setShowServiceFeeModal(false);
                    }}
                    className="h-11 px-5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl"
                  >
                    ໃຊ້ລາຄານີ້
                  </Button>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setShowServiceFeeModal(false)}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl"
            >
              ຍົກເລີກ
            </Button>
          </div>
        </div>
      )}

      {/* ── TABLE SELECTOR MODAL ── */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-emerald-400" />
                  ເລືອກໂຕ໊ະສຳລັບສັ່ງອາຫານ / ສິນຄ້າ
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">ເລືອກໂຕ໊ະທີ່ຕ້ອງການເປີດບິນ ຫຼື ສັ່ງເພີ່ມໃຫ້ລູກຄ້າ</p>
              </div>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-1">
              {(!allZones || allZones.length === 0) ? (
                <div className="text-center py-12 text-zinc-500 space-y-3">
                  <p className="text-sm">ຍັງບໍ່ມີໂຊນ ແລະ ໂຕ໊ະໃນລະບົບ</p>
                  <Link
                    href="/dashboard/restaurant/zones"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline"
                  >
                    ໄປໜ້າຈັດການໂຊນ ແລະ ເພີ່ມໂຕ໊ະ
                  </Link>
                </div>
              ) : (
                allZones.map((zone: any) => (
                  <div key={zone.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{zone.name}</span>
                      <span className="text-[11px] text-zinc-500">{zone.tables?.length || 0} ໂຕ໊ະ</span>
                    </div>
                    {(!zone.tables || zone.tables.length === 0) ? (
                      <p className="text-xs text-zinc-500 italic p-3 bg-zinc-950/40 rounded-xl border border-zinc-800/60">
                        ບໍ່ມີໂຕ໊ະໃນໂຊນນີ້
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {zone.tables.map((table: any) => {
                          const isCurrent = activeTable?.id === table.id;
                          const isOccupied = table.status === "OCCUPIED";
                          return (
                            <button
                              key={table.id}
                              type="button"
                              onClick={() => {
                                setIsTableModalOpen(false);
                                router.push(`/dashboard/pos?tableId=${table.id}`);
                              }}
                              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                                isCurrent
                                  ? "bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-950/40"
                                  : isOccupied
                                  ? "bg-blue-950/30 border-blue-500/40 text-blue-200 hover:border-blue-400"
                                  : "bg-zinc-800/40 border-zinc-700/60 text-zinc-200 hover:border-emerald-500/50 hover:bg-zinc-800"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-sm">{table.name}</span>
                                <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-emerald-400' : isOccupied ? 'bg-blue-400' : 'bg-emerald-500/50'}`} />
                              </div>
                              <span className="text-[10px] text-zinc-400 mt-1">
                                {isCurrent ? "ໂຕ໊ະນີ້ (ເລືອກຢູ່)" : isOccupied ? "ກຳລັງໃຊ້" : "ວ່າງ"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
              <Link
                href="/dashboard/restaurant/zones"
                className="text-xs text-zinc-400 hover:text-emerald-400 underline"
              >
                ຈັດການໂຊນ ແລະ ໂຕ໊ະທັງໝົດ
              </Link>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsTableModalOpen(false);
                  if (activeTable) router.push('/dashboard/pos');
                }}
                className="text-xs border-zinc-700 hover:bg-zinc-800"
              >
                {activeTable ? "ປ່ຽນເປັນ Walk-in (ບໍ່ລະບຸໂຕ໊ະ)" : "ປິດ"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
        title="ສະແກນບາໂຄດສິນຄ້າ (Scan Product Barcode)"
        subtitle="ສ່ອງກ້ອງໃສ່ບາໂຄດສິນຄ້າເພື່ອເພີ່ມລົງໃນກະຕ່າຂາຍທັນທີ"
        placeholder="ຍິງເຄື່ອງສະແກນ ຫຼື ພິມລະຫັດບາໂຄດ..."
      />
    </div>
  );
}
