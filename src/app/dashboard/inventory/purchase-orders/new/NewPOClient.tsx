"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Supplier = { id: string; name: string };
type Product = { id: string; name: string; price: number; stock: number };
type POItem = { productId: string; name: string; quantity: number; unitPrice: number };

export function NewPOClient({ suppliers, products }: { suppliers: Supplier[], products: Product[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<POItem[]>([]);
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5);

  const handleAddProduct = (product: Product) => {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      setItems(items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { productId: product.id, name: product.name, quantity: 1, unitPrice: product.price * 0.7 }]); // Default cost to 70% of price
    }
    setSearch("");
  };

  const updateItem = (productId: string, field: "quantity" | "unitPrice", value: number) => {
    setItems(items.map(i => i.productId === productId ? { ...i, [field]: value } : i));
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleSubmit = async (status: "DRAFT" | "ORDERED") => {
    if (!supplierId) return toast.error("Select supplier");
    if (items.length === 0) return toast.error("Add items");

    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, items, status }),
      });
      
      if (!res.ok) throw new Error("Failed to create PO");
      
      toast.success("!");
      router.push("/dashboard/inventory/purchase-orders");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Error");
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Supplier Selection */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">1.  (Supplier Info)</h2>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full h-12 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">--  (Select Supplier) --</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {suppliers.length === 0 && (
            <p className="text-red-400 text-sm mt-2"> .</p>
          )}
        </div>

        {/* Product Selection */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">2.  (Order Items)</h2>
          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="..."
              className="pl-9 bg-zinc-950 border-zinc-800 focus:border-purple-500 h-12 rounded-xl"
            />
            
            {search && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden z-10 shadow-2xl">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-zinc-400 text-sm text-center"></div>
                ) : (
                  filteredProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleAddProduct(p)}
                      className="w-full flex items-center justify-between p-3 hover:bg-zinc-800 transition-colors text-left border-b border-zinc-800/50 last:border-0"
                    >
                      <div>
                        <div className="text-white font-medium">{p.name}</div>
                        <div className="text-xs text-zinc-500">: {p.stock} (: ?{p.price})</div>
                      </div>
                      <Plus className="w-4 h-4 text-zinc-400" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />No items added</div>
            ) : (
              items.map(item => (
                <div key={item.productId} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                  <div className="flex-1">
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-xs text-zinc-500 mt-1">: ?{(item.quantity * item.unitPrice).toLocaleString()}</div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex flex-col gap-1 w-24">
                      <label className="text-[10px] text-zinc-500 uppercase">Qty</label>
                      <Input 
                        type="number" 
                        min="1"
                        value={item.quantity} 
                        onChange={(e) => updateItem(item.productId, "quantity", Number(e.target.value) || 1)}
                        className="h-9 bg-zinc-900 border-zinc-700"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1 w-32">
                      <label className="text-[10px] text-zinc-500 uppercase">/ (Cost)</label>
                      <Input 
                        type="number" 
                        min="0"
                        value={item.unitPrice} 
                        onChange={(e) => updateItem(item.productId, "unitPrice", Number(e.target.value) || 0)}
                        className="h-9 bg-zinc-900 border-zinc-700"
                      />
                    </div>

                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.productId)} className="h-9 w-9 text-zinc-500 hover:text-red-400 mt-5">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sticky top-6">
          <h2 className="text-lg font-bold text-white mb-6">3.  (Summary)</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-zinc-400 text-sm">
              <span>:</span>
              <span className="text-white">{items.length} </span>
            </div>
            <div className="flex justify-between text-zinc-400 text-sm">
              <span>:</span>
              <span className="text-white">{items.reduce((s, i) => s + i.quantity, 0)} </span>
            </div>
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex justify-between items-end">
                <span className="text-zinc-400"> (Total):</span>
                <span className="text-2xl font-black text-purple-400">?{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => handleSubmit("DRAFT")} 
              disabled={loading || items.length === 0 || !supplierId}
              variant="outline"
              className="w-full h-12 border-zinc-700 hover:bg-zinc-800 text-white"
            >Save as Draft</Button>
            <Button 
              onClick={() => handleSubmit("ORDERED")} 
              disabled={loading || items.length === 0 || !supplierId}
              className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white"
            >
              {loading ? "..." : "Place Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
