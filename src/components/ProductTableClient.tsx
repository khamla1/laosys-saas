"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProductStatusActions } from "@/components/ProductStatusActions";
import { GenerateShareLink } from "@/components/GenerateShareLink";
import { EditProductDialog } from "@/components/EditProductDialog";
import { ManageStockDialog } from "@/components/ManageStockDialog";
import { PaginationControls } from "@/components/PaginationControls";
import { useEffect } from "react";
import Image from "next/image";
import { BoxSelect, History, Store, AlertTriangle } from "lucide-react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  images: string[];
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  organization?: {
    id: string;
    name: string | null;
  };
};

type Seller = {
  id: string;
  name: string | null;
};

export function ProductTableClient({ products, initialTotal, isAdmin, userRole, t, editDict, sellers }: { products: Product[], initialTotal?: number, isAdmin: boolean, userRole?: string, t: any, editDict: any, sellers?: Seller[] }) {
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 whitespace-nowrap">
            ເປີດໃຊ້ງານ (Active)
          </Badge>
        );
      case "PENDING_DELETE":
        return (
          <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/50 whitespace-nowrap">
            ລໍຖ້າການລົບ (Pending Delete)
          </Badge>
        );
      case "DELETED":
        return (
          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50 whitespace-nowrap">
            ລົບແລ້ວ (Deleted)
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700 whitespace-nowrap">
            {status}
          </Badge>
        );
    }
  };
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [sellerFilter, setSellerFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>(products);
  const [totalItems, setTotalItems] = useState<number>(initialTotal ?? products.length);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Sync with server-rendered props when router refreshes on page 1 with default filters
  useEffect(() => {
    if (currentPage === 1 && itemsPerPage === 10 && sellerFilter === "ALL" && statusFilter === "ALL") {
      setPaginatedProducts(products);
      setTotalItems(initialTotal ?? products.length);
    }
  }, [products, initialTotal, currentPage, itemsPerPage, sellerFilter, statusFilter]);

  useEffect(() => {
    if (!hasInteracted && currentPage === 1 && itemsPerPage === 10 && sellerFilter === "ALL" && statusFilter === "ALL") {
      return;
    }
    let cancelled = false;
    const fetchPage = async () => {
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(itemsPerPage),
          status: statusFilter,
          sellerId: sellerFilter,
          includeAllStatuses: "true",
          includeRelations: "true",
        });
        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          if (json && Array.isArray(json.data)) {
            setPaginatedProducts(json.data);
            setTotalItems(json.total ?? json.data.length);
          }
        }
      } catch (err) {
        console.error("Failed to fetch paginated products:", err);
      }
    };
    fetchPage();
    return () => {
      cancelled = true;
    };
  }, [currentPage, itemsPerPage, sellerFilter, statusFilter, hasInteracted, products]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = paginatedProducts.map(p => p.id);
      setSelectedProductIds(allIds);
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds([...selectedProductIds, id]);
    } else {
      setSelectedProductIds(selectedProductIds.filter(pid => pid !== id));
    }
  };

  return (
    <>
      {/* Toolbar / Bulk Action Header */}
      {selectedProductIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl shadow-inner animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <BoxSelect size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-400">
                {selectedProductIds.length} {t.selectedProducts}
              </p>
              <p className="text-xs text-blue-500/70">Ready for bulk actions</p>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <GenerateShareLink productIds={selectedProductIds} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-start gap-4 mb-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">{t.seller || "Seller"}:</span>
            <select 
              value={sellerFilter} 
              onChange={(e) => {
                setHasInteracted(true);
                setSellerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-zinc-800 border border-zinc-700 rounded-md text-sm px-3 py-2 text-zinc-200 outline-none focus:border-blue-500 min-w-[200px]"
            >
              <option value="ALL">{t.allSellers || "All Sellers"}</option>
              {sellers?.map(seller => {
                let dName = seller.name || `Unnamed (${seller.id.slice(-8)})`;
                if (dName.length === 24 && /^[a-f0-9]{24}$/i.test(dName)) {
                  dName = `Seller (${dName.slice(-8)})`;
                }
                return (
                  <option key={seller.id} value={seller.id}>
                    {dName}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">ສະຖານະ (Status):</span>
          <select 
            value={statusFilter} 
            onChange={(e) => {
              setHasInteracted(true);
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-zinc-800 border border-zinc-700 rounded-md text-sm px-3 py-2 text-zinc-200 outline-none focus:border-blue-500 min-w-[200px]"
          >
            <option value="ALL">ທັງໝົດ (All)</option>
            <option value="ACTIVE">ເປີດໃຊ້ງານ (Active)</option>
            <option value="PENDING_DELETE">ລໍຖ້າການລົບ (Pending Delete)</option>
          </select>
        </div>
      </div>

      <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-zinc-900/80 border-b border-zinc-800">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 px-4 py-3">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedProductIds.length > 0 && selectedProductIds.length === paginatedProducts.length}
                    className="rounded-sm border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-zinc-900 w-4 h-4 cursor-pointer transition-all"
                  />
                </TableHead>

                <TableHead className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">{t.name}</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">{t.price}</TableHead>
                <TableHead className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">{t.stock}</TableHead>
                <TableHead className="hidden md:table-cell text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">{t.status}</TableHead>
                {isAdmin && <TableHead className="hidden lg:table-cell text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">{t.seller || "Seller"}</TableHead>}
                <TableHead className="hidden lg:table-cell text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">{t.dateAdded}</TableHead>
                <TableHead className="text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-zinc-500 py-8">
                  {t.noProducts} {isAdmin ? "" : t.startByAdding}
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => {
                return (
                <TableRow key={product.id} className={`border-zinc-800/50 hover:border-purple-500/30 hover:bg-purple-500/5 cursor-pointer transition-all duration-300 group relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-8 before:bg-purple-500 before:rounded-r-full before:opacity-0 hover:before:opacity-100 before:transition-opacity before:shadow-[0_0_10px_rgba(168,85,247,0.8)] ${product.status === 'PENDING_DELETE' ? 'border-red-500 border-2 opacity-50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''} ${product.status === 'PENDING_DELETE' && !isAdmin ? 'pointer-events-none select-none cursor-not-allowed' : ''}`}>
                  <TableCell className="px-4 py-3">
                    <input 
                      type="checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      disabled={product.status === 'PENDING_DELETE'}
                      onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                      className="rounded-sm border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-zinc-900 w-4 h-4 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-start sm:items-center gap-3">
                      {product.images?.[0] ? (
                        <div className="relative w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] mt-0.5 sm:mt-0">
                          <Image 
                            src={product.images[0]} 
                            alt={product.name} 
                            fill
                            sizes="40px"
                            className="object-cover rounded-lg border border-zinc-700/50 shadow-sm group-hover:border-zinc-600 transition-colors" 
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center text-zinc-600 text-[9px] text-center leading-tight shadow-sm mt-0.5 sm:mt-0">
                          {t.noImg || "No Img"}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-200 whitespace-normal line-clamp-2 min-w-[120px]">{product.name}</span>
                        {isAdmin && (product.organization || product.user) && (
                          <div className="mt-1 flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-md w-fit max-w-full">
                            <span className="text-[11px] font-bold text-blue-300 truncate">
                              <Store className="w-3.5 h-3.5 text-blue-400 shrink-0 inline mr-1" />
                              {product.organization?.name || product.user?.name || "Store / Owner"}
                            </span>
                          </div>
                        )}
                        {product.status === 'PENDING_DELETE' && (
                          <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold mt-1 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 max-w-fit">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span>Waiting for admin approval</span>
                          </span>
                        )}
                        {/* Mobile extra info */}
                        <div className="flex md:hidden items-center gap-2 mt-1">
                          <span className="text-[10px] text-zinc-500">Stock: {product.stock}</span>
                          {renderStatusBadge(product.status)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-emerald-400 font-medium whitespace-nowrap px-4 py-3">₭{product.price.toLocaleString()}</TableCell>
                  <TableCell className="text-zinc-300 px-4 py-3 font-semibold">{product.stock ?? 0}</TableCell>
                  <TableCell className="hidden md:table-cell px-4 py-3">
                    {renderStatusBadge(product.status)}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="hidden lg:table-cell text-zinc-300 px-4 py-3">
                      <div className="font-medium text-sm whitespace-nowrap">{product.organization?.name || product.user?.name || "No Store"}</div>
                    </TableCell>
                  )}
                  <TableCell className="hidden lg:table-cell text-zinc-500 text-sm whitespace-nowrap px-4 py-3">{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right px-4 py-3">
                    <div className="flex justify-end items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {product.status !== 'PENDING_DELETE' && (
                        <ManageStockDialog product={product} />
                      )}
                      <Link href={`/dashboard/products/${product.id}?tab=stock`}>
                        <button 
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 shrink-0" 
                          title="ລາຍລະອຽດ & ປະຫວັດສິນຄ້າ (Product Details & History)"
                        >
                          <History size={14} />
                          <span>ປະຫວັດ</span>
                        </button>
                      </Link>
                      {product.status !== 'PENDING_DELETE' && (
                        <EditProductDialog product={product} isAdmin={isAdmin} t={editDict} />
                      )}
                      <ProductStatusActions productId={product.id} currentStatus={product.status} isAdmin={isAdmin} />
                    </div>
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
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
    </>
  );
}
