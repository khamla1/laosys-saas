"use client";

import { askConfirm } from "@/components/ConfirmModal";

import { useState, useEffect } from "react";
import { Plus, Map, Box, MapPin, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type ServiceResource = {
  id: string;
  name: string;
  type: string;
};

export function FacilitiesClient({ typeFilter, title, subtitle }: { typeFilter: "COURT" | "LOCKER", title: string, subtitle: string }) {
  const [resources, setResources] = useState<ServiceResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/resources");
      if (res.ok) {
        const data: ServiceResource[] = await res.json();
        setResources(data.filter(r => r.type === typeFilter));
      }
    } catch (error) {
      toast.error("Failed to load facilities");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, type: typeFilter }),
      });
      
      if (res.ok) {
        const newResource = await res.json();
        setResources([...resources, newResource]);
        setNewName("");
        setIsDialogOpen(false);
        toast.success(typeFilter === "COURT" ? "Court added!" : "Locker added!");
      } else {
        toast.error("Failed to create");
      }
    } catch (error) {
      toast.error("Error creating resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm("Are you sure you want to delete this?"))) return;
    
    try {
      // Optimistic update
      setResources(resources.filter(r => r.id !== id));
      await fetch(`/api/resources/${id}`, { method: "DELETE" });
      toast.success("Deleted successfully");
    } catch (error) {
      toast.error("Error deleting");
      fetchResources(); // Revert
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            {typeFilter === "COURT" ? <Map className="text-blue-500" /> : <Box className="text-green-500" />}
            {title}
          </h1>
          <p className="text-zinc-400 mt-1">{subtitle}</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl h-11">
          <Plus size={18} />
          ເພີ່ມໃໝ່ (Add New)
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-zinc-500" size={32} />
        </div>
      ) : resources.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/50 border-zinc-800 border-dashed border-2 rounded-2xl">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            {typeFilter === "COURT" ? <MapPin size={24} className="text-zinc-400" /> : <Box size={24} className="text-zinc-400" />}
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">ຍັງບໍ່ມີຂໍ້ມູນ (No Data)</h3>
          <p className="text-zinc-400 mb-6 max-w-sm">
            ຄລິກປຸ່ມ "ເພີ່ມໃໝ່" ດ້ານເທິງເພື່ອເລີ່ມສ້າງ{typeFilter === "COURT" ? "ສະໜາມ/ຄອດ" : "ລັອກເກີ"}ຂອງທ່ານ
          </p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="rounded-xl border-zinc-700 text-white hover:bg-zinc-800 hover:text-white">
            <Plus size={16} className="mr-2" /> ເພີ່ມຂໍ້ມູນທັນທີ
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resources.map((resource) => (
            <Card key={resource.id} className="p-5 bg-zinc-900 border-zinc-800 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl ${typeFilter === "COURT" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"}`}>
                    {typeFilter === "COURT" ? <MapPin size={24} /> : <Box size={24} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg line-clamp-1" title={resource.name}>{resource.name}</h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                      {resource.type}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10 -mt-2 -mr-2 shrink-0">
                  <Trash2 size={16} />
                </Button>
              </div>
              <div className="text-sm text-zinc-500 mt-2 flex items-center justify-between border-t border-zinc-800/50 pt-3">
                <span>Status</span>
                <span className="text-emerald-400 flex items-center gap-1.5 before:content-[''] before:block before:w-1.5 before:h-1.5 before:bg-emerald-400 before:rounded-full">Ready</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              ເພີ່ມ{typeFilter === "COURT" ? "ສະໜາມ/ຄອດໃໝ່" : "ລັອກເກີໃໝ່"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">ຊື່ (Name)</label>
              <Input 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={typeFilter === "COURT" ? "e.g. VIP Badminton Court 1" : "e.g. Zone A - Locker 01"}
                className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl text-zinc-400 hover:text-white">
              ຍົກເລີກ (Cancel)
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !newName.trim()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
              {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              ບັນທຶກ (Save)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
