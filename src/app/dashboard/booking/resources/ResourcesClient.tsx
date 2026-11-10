"use client";

import { askConfirm } from "@/components/ConfirmModal";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2, Server, Users, DoorOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfirm } from "@/components/ConfirmModalProvider";

export default function ResourcesClient() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: "", type: "ROOM" });
  const [isSaving, setIsSaving] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/resources");
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      }
    } catch (error) {
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (resource: any = null) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({ name: resource.name, type: resource.type });
    } else {
      setEditingResource(null);
      setFormData({ name: "", type: "ROOM" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return toast.error("Name is required");
    setIsSaving(true);
    try {
      const url = editingResource ? `/api/resources/${editingResource.id}` : "/api/resources";
      const res = await fetch(url, {
        method: editingResource ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success(editingResource ? "Resource updated" : "Resource created");
        setIsDialogOpen(false);
        fetchResources();
      }
    } catch (error) {
      toast.error("Error saving resource");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm("Are you sure? This will delete the resource and its appointments.", { variant: "destructive" }))) return;
    try {
      const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Resource deleted");
        fetchResources();
      }
    } catch (error) {
      toast.error("Error deleting resource");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> ເພີ່ມຊັບພະຍາກອນ (Add Resource)
        </Button>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 border border-zinc-800 border-dashed rounded-lg">
          <Server className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>ຍັງບໍ່ມີຂໍ້ມູນ (No resources yet)</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {resources.map((resource) => (
            <Card key={resource.id} className="bg-zinc-900 border-zinc-800 group relative">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => handleOpenDialog(resource)} className="p-1 text-zinc-400 hover:text-white"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(resource.id)} className="p-1 text-zinc-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
                
                <div className={`p-4 rounded-full mb-4 ${resource.type === 'ROOM' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {resource.type === 'ROOM' ? <DoorOpen className="w-8 h-8" /> : <Users className="w-8 h-8" />}
                </div>
                <h3 className="font-bold text-lg text-white mb-1">{resource.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${resource.type === 'ROOM' ? 'bg-blue-500/20 text-blue-300' : 'bg-orange-500/20 text-orange-300'}`}>
                  {resource.type === 'ROOM' ? 'ຫ້ອງ (Room)' : 'ພະນັກງານ (Staff)'}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingResource ? 'ແກ້ໄຂຊັບພະຍາກອນ (Edit Resource)' : 'ເພີ່ມຊັບພະຍາກອນ (Add Resource)'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ຊື່ (Name) * e.g., Massage Room 1, Dr. Smith</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="bg-zinc-950 border-zinc-800 text-white" 
              />
            </div>
            <div className="space-y-2">
              <Label>ປະເພດ (Type)</Label>
              <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val || "ROOM"})}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectItem value="ROOM">ຫ້ອງ (Room)</SelectItem>
                  <SelectItem value="STAFF">ພະນັກງານ (Staff)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              ບັນທຶກ (Save)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
