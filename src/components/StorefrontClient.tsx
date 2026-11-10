"use client";

import {
  useState } from "react";
import { Store,
  ShoppingCart,
  Calendar
} from "lucide-react";
import { CheckoutModal } from "@/components/CheckoutModal";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { StorefrontBookingUI } from "@/components/StorefrontBookingUI";

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

interface StoreData {
  id: string;
  name: string | null;
  image: string | null;
  paymentQrCode?: string | null;
  paymentAccountInfo?: string | null;
}

export function StorefrontClient({
  store,
  products
}: {
  store: StoreData;
  products: Product[];
}) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'booking'>('products');

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-2 sm:px-6 py-4 sm:py-12 md:p-20 font-sans text-white relative overflow-hidden">
      {/* Background Ambient Spotlights */}
      <div className="absolute top-0 left-1/4 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-blue-500/5 blur-[80px] sm:blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-purple-500/5 blur-[80px] sm:blur-[150px] rounded-full pointer-events-none" />

      <main className="max-w-5xl mx-auto space-y-6 sm:space-y-8 relative z-10">
        
        {/* Store Header Banner */}
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-6 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-zinc-900/20 border border-zinc-800/80 backdrop-blur-xl relative overflow-hidden shadow-lg shadow-black/30">
          <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 blur-xl rounded-full pointer-events-none" />
          
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden shrink-0 border border-zinc-700/60">
            {store.image ? (
              <img src={store.image} alt={store.name || "Store"} className="w-full h-full object-cover" />
            ) : (
              <Store className="text-white w-6 h-6 sm:w-10 sm:h-10" />
            )}
          </div>
          
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
              {store.name}
            </h1>
            <p className="text-[10px] sm:text-sm text-zinc-450 leading-relaxed max-w-xl">
              ຍິນດີຕ້ອນຮັບສູ່ຮ້ານຂອງພວກເຮົາ! ເລືອກຊື້ສິນຄ້າ ຫຼື ຈອງບໍລິການດ້ານລຸ່ມນີ້ໄດ້ເລີຍ.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-zinc-800/60 pb-px">
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2.5 font-bold text-sm transition-colors border-b-2 ${activeTab === 'products' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            ສັ່ງຊື້ສິນຄ້າ
          </button>
          <button 
            onClick={() => setActiveTab('booking')}
            className={`px-6 py-2.5 font-bold text-sm transition-colors border-b-2 ${activeTab === 'booking' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            ຈອງຄອດ / ບໍລິການ
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'booking' ? (
          <StorefrontBookingUI storeId={store.id} />
        ) : (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
          {products.length === 0 ? (
            <div className="col-span-full text-center text-zinc-500 py-16 border border-dashed border-zinc-800 rounded-xl sm:rounded-2xl bg-zinc-900/10">
              ฮ້ານນີ້ຍັງບໍ່ມີສິນຄ້າເທື່ອ.
            </div>
          ) : (
            products.map((product) => (
              <div 
                key={product.id} 
                className="group relative flex flex-col justify-between overflow-hidden bg-zinc-900/30 border border-zinc-800/80 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.02)]"
              >
                {/* Micro reflection glow */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Clickable Card Body (Opens product detail) */}
                <div 
                  className="cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  {/* Square thumbnail - looks like a premium application icon */}
                  <div className="aspect-square bg-zinc-950/40 rounded-t-xl sm:rounded-t-2xl flex items-center justify-center text-zinc-650 overflow-hidden relative border-b border-zinc-800/40">
                    {product.images && product.images.length > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" 
                      />
                    ) : (
                      <span className="text-[9px] sm:text-xs text-zinc-650 font-medium">ບໍ່ມີຮູບ</span>
                    )}

                    {/* Stock badge */}
                    <div className="absolute top-1 right-1 z-10">
                      {product.stock > 0 ? (
                        <span className="text-[7px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-zinc-350 shadow-sm">
                          {product.stock}
                        </span>
                      ) : (
                        <span className="text-[7px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-950/80 border border-red-900/50 text-red-400 shadow-sm">
                          ໝົດ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Information block */}
                  <div className="p-1.5 sm:p-3">
                    <h3 className="text-[10px] sm:text-sm font-bold text-zinc-200 truncate group-hover:text-blue-400 transition-colors duration-300">
                      {product.name}
                    </h3>
                    <p className="hidden sm:block text-[10px] text-zinc-450 line-clamp-1 mt-0.5">
                      {product.description || "ບໍ່ມີລາຍລະອຽດ."}
                    </p>
                    <div className="text-[11px] sm:text-base font-black text-emerald-400 mt-1 sm:mt-2">
                      ₭{product.price.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div 
                  className="p-1.5 pt-0 relative z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CheckoutModal 
                    product={product as any} 
                    storeId={store.id} 
                    paymentQrCode={store.paymentQrCode || undefined}
                    paymentAccountInfo={store.paymentAccountInfo || undefined}
                    storeName={store.name || undefined}
                  />
                </div>
              </div>
            ))
          )}
        </div>
        )}
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        storeId={store.id}
        paymentQrCode={store.paymentQrCode || undefined}
        paymentAccountInfo={store.paymentAccountInfo || undefined}
        storeName={store.name || undefined}
      />
    </div>
  );
}
