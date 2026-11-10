"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function AddStaffModal({ t }: { t: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    orgRole: "CASHIER"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create staff");
      }

      toast.success("Staff account created successfully!");
      setOpen(false);
      setFormData({ name: "", email: "", password: "", orgRole: "CASHIER" });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700" />}>
        <Plus className="w-4 h-4 mr-2" />
        {t?.addStaff || "Add Staff"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-50">
        <DialogHeader>
          <DialogTitle>{t?.addNewStaff || "Add New Staff"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t?.name || "Name"}</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-zinc-900 border-zinc-800 focus:ring-blue-500"
              placeholder="e.g. John Cashier"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t?.email || "Email"}</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-zinc-900 border-zinc-800 focus:ring-blue-500"
              placeholder="john@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t?.password || "Password"}</Label>
            <Input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="bg-zinc-900 border-zinc-800 focus:ring-blue-500"
              placeholder="Min 6 characters"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgRole">{t?.role || "Role / หน้าที่"}</Label>
            <select
              id="orgRole"
              required
              value={formData.orgRole}
              onChange={(e) => setFormData({ ...formData, orgRole: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="MANAGER">ผู้จัดการ (Manager)</option>
              <option value="ACCOUNTANT">พนักงานบัญชี (Accountant)</option>
              <option value="CASHIER">แคชเชียร์ (Cashier)</option>
              <option value="KITCHEN">พนักงานครัว (Kitchen Staff)</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-zinc-800 hover:bg-zinc-800"
            >
              {t?.cancel || "Cancel"}
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (t?.creating || "Creating...") : (t?.create || "Create Staff")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
