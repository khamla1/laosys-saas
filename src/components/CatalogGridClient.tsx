"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, Package, Check, X, LayoutGrid, Store, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GenerateShareLink } from "@/components/GenerateShareLink";
import { PaginationControls } from "@/components/PaginationControls";
import { CameraScannerModal } from "@/components/CameraScannerModal";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  images: string[];
  organization?: { id: string; name: string | null };
  user?: { id: string; name: string | null; email: string | null };
};

export function CatalogGridClient({ products, initialTotal, t, isAdmin, sellers }: { products: Product[], initialTotal?: number, t: any, isAdmin?: boolean, sellers?: { id: string; name: string | null }[] }) {
  const [search, setSearch] = useState("");
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [sellerFilter, setSellerFilter] = useState("ALL");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [mobileCols, setMobileCols] = useState<"AUTO"|2|4|6|8>("AUTO");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [totalItems, setTotalItems] = useState<number>(initialTotal ?? products.length);
  const [hasInteracted, setHasInteracted] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (currentPage === 1 && itemsPerPage === 20 && search === "" && sellerFilter === "ALL") {
      setFilteredProducts(products);
      setTotalItems(initialTotal ?? products.length);
    }
  }, [products, initialTotal, currentPage, itemsPerPage, search, sellerFilter]);

  useEffect(() => {
    if (!hasInteracted && currentPage === 1 && itemsPerPage === 20 && search === "" && sellerFilter === "ALL") {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(itemsPerPage),
          search,
          sellerId: sellerFilter,
          includeRelations: "true",
        });
        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          if (json && Array.isArray(json.data)) {
            setFilteredProducts(json.data);
            setTotalItems(json.total ?? json.data.length);
          }
        }
      } catch (err) {
        console.error("Failed to fetch catalog products:", err);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentPage, itemsPerPage, search, sellerFilter, hasInteracted]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const showCheckmarks = totalItems > 1;

  return (
    <div className="space-y-4">
    <div className="flex flex-col h-[calc(100vh-220px)] border border-zinc-800 rounded-xl bg-zinc-900/30 overflow-hidden mt-6 relative">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 flex flex-col sm:flex-row gap-4 justify-between items-center min-h-[73px]">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full max-w-3xl">
          <div className="flex items-center gap-2 flex-1 group w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-400 transition-colors" size={18} />
              <Input 
                placeholder={t?.searchPlaceholder || "ຄົ້ນຫາສິນຄ້າ..."} 
                value={search}
                onChange={(e) => {
                  setHasInteracted(true);
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-zinc-950/50 border-zinc-700/50 text-white w-full rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-purple-500 transition-all shadow-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="px-3 sm:px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/20 active:scale-95 h-10"
              title="ເປີດກ້ອງສະແກນບາໂຄດສິນຄ້າ"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">ກ້ອງສະແກນ</span>
              <span className="sm:hidden">ສະແກນ</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:w-[150px] sm:flex-none">
              <Select value={mobileCols.toString()} onValueChange={(val) => setMobileCols(val === "AUTO" ? "AUTO" : parseInt(val || "6") as 2|4|6|8)}>
                <SelectTrigger className="bg-zinc-950/50 border-zinc-700/50 text-white rounded-xl h-10 shadow-sm hover:bg-zinc-800/80 transition-colors">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <LayoutGrid size={16} className="text-zinc-500 shrink-0" />
                    <SelectValue placeholder="Layout" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl shadow-xl">
                  <SelectItem value="AUTO" className="cursor-pointer focus:bg-purple-500/20 focus:text-purple-400">ຈັດລຽງອັດຕະໂນມັດ (Auto)</SelectItem>
                  <SelectItem value="2" className="cursor-pointer focus:bg-purple-500/20 focus:text-purple-400">2 ຄໍລຳ</SelectItem>
                  <SelectItem value="4" className="cursor-pointer focus:bg-purple-500/20 focus:text-purple-400">4 ຄໍລຳ</SelectItem>
                  <SelectItem value="6" className="cursor-pointer focus:bg-purple-500/20 focus:text-purple-400">6 ຄໍລຳ</SelectItem>
                  <SelectItem value="8" className="cursor-pointer focus:bg-purple-500/20 focus:text-purple-400">8 ຄໍລຳ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isAdmin && sellers && sellers.length > 0 && (
              <div className="flex-1 sm:w-[200px] sm:flex-none">
                <Select value={sellerFilter} onValueChange={(val) => {
                  setHasInteracted(true);
                  setSellerFilter(val || "ALL");
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="bg-zinc-950/50 border-zinc-700/50 text-white rounded-xl h-10 shadow-sm hover:bg-zinc-800/80 transition-colors">
                    <div className="flex items-center gap-2 text-zinc-300 truncate">
                      <Store size={16} className="text-zinc-500 shrink-0" />
                      <SelectValue placeholder="ຜູ້ຂາຍທັງໝົດ">
                        {sellerFilter === "ALL" 
                          ? "ຜູ້ຂາຍທັງໝົດ" 
                          : (() => {
                              const s = sellers.find(x => x.id === sellerFilter);
                              if (!s) return `Seller (${sellerFilter.slice(-6)})`;
                              let dName = s.name || `Unnamed (${s.id.slice(-6)})`;
                              if (dName.length === 24 && /^[a-f0-9]{24}$/i.test(dName)) return `Seller (${dName.slice(-6)})`;
                              return dName;
                            })()
                        }
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px] rounded-xl shadow-xl">
                    <SelectItem value="ALL" className="cursor-pointer focus:bg-blue-500/20 focus:text-blue-400">All Sellers</SelectItem>
                    {sellers.map((s) => {
                      let displayName = s.name || `Unnamed (${s.id.slice(-6)})`;
                      if (displayName.length === 24 && /^[a-f0-9]{24}$/i.test(displayName)) {
                        displayName = `Seller (${displayName.slice(-6)})`;
                      }
                      return (
                        <SelectItem key={s.id} value={s.id} className="cursor-pointer focus:bg-blue-500/20 focus:text-blue-400">
                          {displayName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {selectedProductIds.length > 0 && (
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 animate-in slide-in-from-right-4 duration-300 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-zinc-800/50">
            <span className="text-[11px] sm:text-sm text-blue-400 font-medium whitespace-nowrap bg-blue-500/10 px-2 sm:px-3 py-1.5 rounded-full border border-blue-500/20 shadow-sm flex items-center gap-1 sm:gap-1.5">
              <Check size={14} className="sm:w-4 sm:h-4" />
              <span className="truncate max-w-[120px] sm:max-w-none">{selectedProductIds.length} {t?.selectedProducts || "selected"}</span>
            </span>
            <div className="flex-1 sm:flex-none flex justify-end">
              <GenerateShareLink productIds={selectedProductIds} />
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedProductIds([])} className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full">
              <X size={16} />
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar bg-zinc-950/20">
        <div className={`grid gap-2.5 sm:gap-6 ${
          mobileCols === "AUTO" ? 'grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]' :
          mobileCols === 2 ? 'grid-cols-2' :
          mobileCols === 4 ? 'grid-cols-2 sm:grid-cols-4' :
          mobileCols === 6 ? 'grid-cols-3 sm:grid-cols-6' :
          'grid-cols-4 sm:grid-cols-8'
        }`}>
          {filteredProducts.map((product, idx) => {
            const isOutOfStock = product.stock <= 0;
            const isNotApproved = product.status !== 'ACTIVE';
            const isSelected = selectedProductIds.includes(product.id);

            // Dynamic text sizes if forced columns on small screens
            let titleCls = "text-xs sm:text-sm";
            let priceCls = "text-xs sm:text-base";
            let stockCls = "text-[11px] sm:text-sm";
            let padCls = "p-2.5 sm:p-4";
            
            if (mobileCols === 4) {
              titleCls = "text-[10px] sm:text-sm";
              priceCls = "text-[11px] sm:text-base";
              stockCls = "text-[10px] sm:text-sm";
              padCls = "p-2 sm:p-4";
            } else if (mobileCols === 6 || mobileCols === 8) {
              titleCls = "text-[8px] sm:text-sm leading-tight";
              priceCls = "text-[9px] sm:text-base";
              stockCls = "text-[8px] sm:text-sm";
              padCls = "p-1.5 sm:p-4";
            }

            return (
              <div 
                key={product.id} 
                onClick={() => {
                  if (showCheckmarks) toggleSelection(product.id);
                }}
                className={`relative group rounded-2xl border overflow-hidden flex flex-col bg-zinc-900/40 backdrop-blur-sm transition-all duration-500 animate-in fade-in zoom-in-95 fill-mode-both hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]
                  ${showCheckmarks ? "cursor-pointer hover:-translate-y-2" : ""} 
                  ${isSelected && showCheckmarks
                    ? "border-purple-500 ring-1 ring-purple-500 ring-offset-2 ring-offset-zinc-950 bg-purple-950/20" 
                    : "border-zinc-800"
                  } 
                  ${isOutOfStock || isNotApproved ? "opacity-75" : ""}
                `}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Glow Layer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-purple-500/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0" />

                {/* Image Container */}
                <div className="aspect-[4/3] bg-zinc-800/30 relative shrink-0 overflow-hidden">
                  {product.images?.[0] ? (
                    <Image 
                      src={product.images[0]} 
                      alt={product.name} 
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-zinc-800/20 relative z-10">
                      <Package size={24} className="mb-2 opacity-50" />
                      <span className="text-xs">{t?.noImg || "ບໍ່ມີຮູບ"}</span>
                    </div>
                  )}

                  {/* Gradient Overlay for Text Readability if needed */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Status Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
                    {isOutOfStock && (
                      <span className={`bg-red-500/90 backdrop-blur-md text-white px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm border border-red-400/30`}>
                        {t?.outOfStock || "ສິນຄ້າໝົດ"}
                      </span>
                    )}
                    {product.status === "ACTIVE" && (
                      <span className={`bg-emerald-500/90 backdrop-blur-md text-white px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm border border-emerald-400/30`}>
                        ACTIVE
                      </span>
                    )}
                    {product.status === "PENDING_DELETE" && (
                      <span className={`bg-amber-500/90 backdrop-blur-md text-white px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm border border-yellow-400/30`}>
                        Pending Delete
                      </span>
                    )}
                  </div>

                  {/* Selection Checkmark */}
                  {isSelected && showCheckmarks && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white p-0.5 sm:p-1 rounded-full shadow-lg border-2 border-white/20 animate-in zoom-in-50 duration-200">
                      <Check size={12} className="sm:w-[14px] sm:h-[14px]" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className={`${padCls} flex-1 flex flex-col justify-between gap-1 sm:gap-3`}>
                  <div>
                    <h3 className={`font-semibold text-zinc-100 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors ${titleCls}`} title={product.name}>
                      {product.name}
                    </h3>
                    {isAdmin && (product.organization || product.user) && (
                      <div className="mt-1.5 flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg max-w-full">
                        <Store size={13} className="text-blue-400 shrink-0" />
                        <span className="text-blue-300 text-[11px] font-semibold truncate break-words">
                          {product.organization?.name || product.user?.name || `Store (${(product.organization?.id || product.user?.id || "").slice(-6)})`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-end justify-between pt-1.5 sm:pt-2 border-t border-zinc-800/50">
                    <div>
                      <p className="text-zinc-500 text-[8px] sm:text-[11px] uppercase tracking-wider font-medium mb-0.5">{t?.price || "Price"}</p>
                      <p className={`text-emerald-400 font-bold leading-none ${priceCls}`}>₭{product.price.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-500 text-[8px] sm:text-[11px] uppercase tracking-wider font-medium mb-0.5">{t?.stockRemaining || "Stock"}</p>
                      <p className={`text-zinc-300 font-medium leading-none ${stockCls}`}>{product.stock}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filteredProducts.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-3 py-12">
            <Package size={48} className="opacity-20" />
            <p>{t?.noProductsFound || "No products found"}</p>
          </div>
        )}
      </div>
    </div>

    <PaginationControls
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={(page) => {
        setHasInteracted(true);
        setCurrentPage(page);
      }}
      onItemsPerPageChange={(size) => {
        setHasInteracted(true);
        setItemsPerPage(size);
        setCurrentPage(1);
      }}
      t={t}
    />

    {/* Camera Barcode / QR Scanner Modal */}
    <CameraScannerModal
      isOpen={isCameraScannerOpen}
      onClose={() => setIsCameraScannerOpen(false)}
      onScanSuccess={(code) => {
        setHasInteracted(true);
        setSearch(code);
        setCurrentPage(1);
      }}
      title="ສະແກນບາໂຄດສິນຄ້າ (Scan Product Barcode)"
      subtitle="ສ່ອງກ້ອງໃສ່ບາໂຄດສິນຄ້າເພື່ອຄົ້ນຫາດ່ວນ"
      placeholder="ຍິງເຄື່ອງສະແກນ ຫຼື ພິມລະຫັດບາໂຄດ..."
    />
    </div>
  );
}
