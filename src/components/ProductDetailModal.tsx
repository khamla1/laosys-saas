"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckoutModal } from "@/components/CheckoutModal";
import { X, ZoomIn, ShoppingBag, Truck, ArrowLeft } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
  images: string[];
  reviewImages?: string[];
  category?: string | null;
}

export function ProductDetailModal({
  product,
  isOpen,
  onOpenChange,
  storeId,
  paymentQrCode,
  paymentAccountInfo,
  storeName
}: {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  paymentQrCode?: string;
  paymentAccountInfo?: string;
  storeName?: string;
}) {
  const [activeImage, setActiveImage] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!product) return null;

  // Initialize active image if not set
  const currentActiveImage = activeImage || product.images?.[0] || "";

  // Fallback real-product/customer review photos if none exist in the database yet
  const customerPhotos = product.reviewImages && product.reviewImages.length > 0
    ? product.reviewImages
    : [
        product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=600&auto=format&fit=crop"
      ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent 
          className="bg-zinc-950/95 text-white w-full p-0 overflow-hidden flex flex-col shadow-2xl custom-dialog-position max-h-[92vh] rounded-t-2xl rounded-b-none sm:rounded-2xl border-zinc-900/80 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
        >
          {/* Prevent auto-scroll on open by capturing focus at the top */}
          <div tabIndex={-1} autoFocus className="sr-only focus:outline-none" />
          
          <style dangerouslySetInnerHTML={{__html: `
            div[data-slot="dialog-content"].custom-dialog-position {
              position: fixed !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              top: auto !important;
              transform: none !important;
              translate: none !important;
              margin: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
              border-top: 1px solid rgba(39, 39, 42, 0.8) !important;
              border-bottom: none !important;
              border-left: none !important;
              border-right: none !important;
            }
            
            @media (min-width: 640px) {
              div[data-slot="dialog-content"].custom-dialog-position {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                bottom: auto !important;
                right: auto !important;
                transform: translate(-50%, -50%) !important;
                translate: none !important;
                max-width: 48rem !important; /* sm:max-w-3xl = 768px */
                width: calc(100% - 2rem) !important;
                border: 1px solid rgba(39, 39, 42, 0.8) !important;
                border-radius: 1rem !important;
                max-height: 90vh !important;
              }
            }
            
            @media (min-width: 768px) {
              div[data-slot="dialog-content"].custom-dialog-position {
                max-width: 56rem !important; /* md:max-w-4xl = 896px */
              }
            }
          `}} />
          
          {/* Blurred Background Hero Layer */}
          {product.images?.[0] && (
            <div 
              className="absolute inset-0 bg-cover bg-center filter blur-3xl scale-110 opacity-[0.14] pointer-events-none select-none"
              style={{ backgroundImage: `url(${product.images[0]})` }}
            />
          )}

          {/* Mobile Header Bar - Fixed at the top! */}
          <div className="flex items-center justify-between md:hidden border-b border-zinc-900 p-4 shrink-0 bg-zinc-950/90 z-20 relative">
            <button 
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2 text-xs font-bold text-zinc-350 hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-zinc-900/50 border border-zinc-805/60"
            >
              <ArrowLeft size={14} /> ຍ້ອນກັບ
            </button>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">ລາຍລະອຽດສິນຄ້າ</span>
            <div className="w-16" /> {/* Spacer */}
          </div>
          
          {/* Scrollable Main Content Layout */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-8 relative z-10 flex flex-col gap-6 sm:gap-8">
            
            {/* Top section: Split layout (Flex col on mobile, Grid on desktop) */}
            <div className="flex flex-col md:grid md:grid-cols-12 gap-6 sm:gap-8">
              
              {/* Left Column: Media & Gallery */}
              <div className="w-full md:col-span-6 space-y-4">
                {/* Main Image Display */}
                <div 
                  onClick={() => setPreviewImage(currentActiveImage)}
                  className="aspect-square w-full rounded-2xl bg-zinc-900/60 overflow-hidden relative border border-zinc-800/80 shadow-inner group/mainimg cursor-zoom-in"
                >
                  {currentActiveImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={currentActiveImage} 
                      alt={product.name} 
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/mainimg:scale-105" 
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center text-zinc-650 text-xs">
                      ບໍ່ມີຮູບ
                    </div>
                  )}

                  {/* Zoom Badge Indicator */}
                  <div className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white p-2 rounded-xl border border-zinc-800/80 transition-all opacity-0 group-hover/mainimg:opacity-100 flex items-center gap-1.5 text-xs font-semibold">
                    <ZoomIn size={14} /> ເບິ່ງຮູບໃຫຍ່
                  </div>
                </div>

                {/* Gallery Slider Thumbnails (Only show if multiple images exist) */}
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto py-1 custom-scrollbar">
                    {product.images.map((imgUrl, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImage(imgUrl)}
                        className={`w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 border transition-all shrink-0 ${
                          currentActiveImage === imgUrl 
                            ? "border-blue-500 ring-2 ring-blue-500/20" 
                            : "border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Detailed Product Info */}
              <div className="w-full md:col-span-6 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  {/* Category & Shop tag */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      {product.category || "General"}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-850 border border-zinc-850 text-zinc-400">
                      ຮ້ານຄ້າທາງການ
                    </span>
                  </div>

                  {/* Name */}
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
                    {product.name}
                  </h2>

                  {/* Price Tag Box */}
                  <div className="bg-zinc-900/60 border border-zinc-855 p-4 rounded-2xl flex flex-col gap-1 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none" />
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">ລາຄາພິເສດ</span>
                    <span className="text-3xl font-black text-emerald-400">
                      ₭{product.price.toLocaleString()}
                    </span>
                  </div>

                  {/* Stock & Delivery Row */}
                  <div className="grid grid-cols-2 gap-3 bg-zinc-950/40 p-3.5 border border-zinc-900/80 rounded-2xl text-xs text-zinc-400">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                        <span className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                      </span>
                      <div>
                        <p className="font-bold text-zinc-300">ສະຖານະສິນຄ້າ</p>
                        <p>{product.stock > 0 ? `ພ້ອມສົ່ງ (ເຫຼືອ ${product.stock} ຊິ້ນ)` : "ສິນຄ້າໝົດ"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                        <Truck size={14} />
                      </span>
                      <div>
                        <p className="font-bold text-zinc-300">ຂໍ້ມູນການຈັດສົ່ງ</p>
                        <p>ຈັດສົ່ງດ່ວນທົ່ວປະເທດ</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-zinc-900" />

                  {/* Description Box */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-3 rounded-full bg-blue-500" />
                      ລາຍລະອຽດສິນຄ້າ
                    </h4>
                    <div className="bg-zinc-950/40 border border-zinc-900/60 p-3.5 rounded-xl text-sm text-zinc-300 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap">
                      {product.description || "ບໍ່ມີລາຍລະອຽດສິນຄ້າສຳລັບລາຍການນີ້."}
                    </div>
                  </div>
                </div>

                {/* Checkout Integration */}
                <div className="pt-4 border-t border-zinc-900 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs text-zinc-400 font-medium px-1">
                    <span>ຂົນສົ່ງໂດຍ</span>
                    <span className="text-white">ຂົນສົ່ງດ່ວນທົ່ວປະເທດ</span>
                  </div>
                  <CheckoutModal 
                    product={product as any} 
                    storeId={storeId} 
                    paymentQrCode={paymentQrCode}
                    paymentAccountInfo={paymentAccountInfo}
                    storeName={storeName}
                  />
                </div>
              </div>

            </div>

            {/* Bottom section: Real Customer Photos */}
            <div className="space-y-3 pt-4 border-t border-zinc-900">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 rounded-full bg-emerald-500" />
                  ຮູບສິນຄ້າຈິງ
                </h3>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase">ຮູບພາບຈາກລູກຄ້າ</span>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                {customerPhotos.map((photoUrl, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setPreviewImage(photoUrl)}
                    className="aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 cursor-zoom-in hover:border-blue-500/50 transition-all duration-300 relative group/thumb shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={photoUrl} 
                      alt={`Review photo ${idx + 1}`} 
                      loading="lazy" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-[1.04]" 
                    />
                    
                    {/* Hover Glow Layer overlay */}
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* Full-Screen Image Zoom Modal overlay */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 text-white bg-white/10 hover:bg-white/20 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <X size={24} />
          </button>
          
          {/* Full Screen Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={previewImage} 
            alt="Fullscreen preview" 
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-zinc-800/40 animate-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
          />
        </div>
      )}
    </>
  );
}
