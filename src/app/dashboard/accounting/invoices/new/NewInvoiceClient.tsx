"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function NewInvoiceClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: "",
    amount: "",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    status: "PENDING"
  });

  const handleSubmit = async () => {
    if (!formData.customerName) return toast.error("ກະລຸນາປ້ອນຊື່ລູກຄ້າ (Customer Name required)");
    if (!formData.amount || Number(formData.amount) <= 0) return toast.error("ກະລຸນາປ້ອນມູນຄ່າທີ່ຖືກຕ້ອງ (Valid amount required)");

    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error("Failed to create Invoice");
      
      toast.success("ສ້າງໃບແຈ້ງໜີ້ສຳເລັດແລ້ວ!");
      router.push("/dashboard/accounting/invoices");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "ເກີດຂໍ້ຜິດພາດ (Error)");
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 max-w-2xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">ຊື່ລູກຄ້າ (Customer Name) <span className="text-red-500">*</span></label>
          <Input 
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            placeholder="Ex: ບໍລິສັດ ABC ຈຳກັດ"
            className="bg-zinc-950 border-zinc-800 focus:border-blue-500 h-12"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">ມູນຄ່າລວມ (Total Amount) <span className="text-red-500">*</span></label>
          <Input 
            type="number"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            placeholder="Ex: 1500000"
            className="bg-zinc-950 border-zinc-800 focus:border-blue-500 h-12 font-mono text-emerald-400 text-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">ກຳນົດຊຳລະ (Due Date)</label>
            <Input 
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              className="bg-zinc-950 border-zinc-800 focus:border-blue-500 h-12"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">ສະຖານະ (Status)</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full h-12 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
            >
              <option value="PENDING">ລໍຖ້າຊຳລະ (PENDING)</option>
              <option value="PAID">ຈ່າຍແລ້ວ (PAID)</option>
            </select>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800">
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold"
          >
            {loading ? "ກຳລັງບັນທຶກ..." : "ສ້າງໃບແຈ້ງໜີ້ (Create Invoice)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
