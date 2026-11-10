"use client";

import { askConfirm } from "@/components/ConfirmModal";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useConfirm } from "@/components/ConfirmModalProvider";

export default function VariantsClient({ productId }: { productId: string }) {
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    stock: "0",
    barcode: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const fetchVariants = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/variants`);
      if (res.ok) {
        const data = await res.json();
        setVariants(data);
      }
    } catch (error) {
      toast.error("Failed to load variants");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (variant: any = null) => {
    if (variant) {
      setEditingVariant(variant);
      setFormData({
        name: variant.name,
        sku: variant.sku || "",
        price: variant.price?.toString() || "",
        stock: variant.stock?.toString() || "0",
        barcode: variant.barcode || "",
      });
    } else {
      setEditingVariant(null);
      setFormData({
        name: "",
        sku: "",
        price: "",
        stock: "0",
        barcode: "",
      });
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingVariant 
        ? `/api/products/${productId}/variants/${editingVariant.id}`
        : `/api/products/${productId}/variants`;
      
      const res = await fetch(url, {
        method: editingVariant ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku || null,
          price: formData.price ? parseFloat(formData.price) : null,
          stock: parseInt(formData.stock) || 0,
          barcode: formData.barcode || null,
        }),
      });

      if (res.ok) {
        toast.success(editingVariant ? "Variant updated" : "Variant created");
        setIsOpen(false);
        fetchVariants();
      } else {
        toast.error("Failed to save variant");
      }
    } catch (error) {
      toast.error("Error saving variant");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm("Are you sure you want to delete this variant?", { variant: "destructive" }))) return;
    
    try {
      const res = await fetch(`/api/products/${productId}/variants/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Variant deleted");
        fetchVariants();
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      toast.error("Error deleting variant");
    }
  };

  if (loading) return <div className="py-4 text-center text-zinc-500">Loading variants...</div>;

  return (
    <Card className="bg-zinc-900 border-zinc-800 mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">ຕົວເລືອກສິນຄ້າ (Product Variants)</CardTitle>
        <Button onClick={() => handleOpenDialog()} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> ເພີ່ມ (Add Variant)
        </Button>
      </CardHeader>
      <CardContent>
        {variants.length === 0 ? (
          <p className="text-zinc-400 text-sm italic">ບໍ່ມີຕົວເລືອກ (No variants yet)</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-300">
              <thead className="text-xs uppercase bg-zinc-800 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">ຊື່ (Name)</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">ລາຄາພິເສດ (Price)</th>
                  <th className="px-4 py-3">ຈຳນວນ (Stock)</th>
                  <th className="px-4 py-3 rounded-tr-lg text-right">ຈັດການ (Actions)</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={v.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="px-4 py-3 font-medium">{v.name}</td>
                    <td className="px-4 py-3">{v.sku || '-'}</td>
                    <td className="px-4 py-3">{v.price !== null ? `₭${v.price.toLocaleString()}` : '-'}</td>
                    <td className="px-4 py-3">{v.stock}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(v)} className="h-8 w-8 p-0 text-zinc-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)} className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400 ml-2">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingVariant ? 'ແກ້ໄຂຕົວເລືອກ (Edit Variant)' : 'ເພີ່ມຕົວເລືອກ (Add Variant)'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>ຊື່ (Name) * e.g., Size: L, Color: Red</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="bg-zinc-950 border-zinc-800 text-white" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input 
                    value={formData.sku} 
                    onChange={e => setFormData({...formData, sku: e.target.value})} 
                    className="bg-zinc-950 border-zinc-800 text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input 
                    value={formData.barcode} 
                    onChange={e => setFormData({...formData, barcode: e.target.value})} 
                    className="bg-zinc-950 border-zinc-800 text-white" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ລາຄາ (Price - Leave empty for base price)</Label>
                  <Input 
                    type="number"
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    className="bg-zinc-950 border-zinc-800 text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>ຈຳນວນ (Stock)</Label>
                  <Input 
                    type="number"
                    value={formData.stock} 
                    onChange={e => setFormData({...formData, stock: e.target.value})} 
                    className="bg-zinc-950 border-zinc-800 text-white" 
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                ບັນທຶກ (Save)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
