"use client";

import { askConfirm } from "@/components/ConfirmModal";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmModalProvider";

export function DeleteStaffButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { confirm } = useConfirm();

  const handleDelete = async () => {
    if (!(await askConfirm("Are you sure you want to delete this staff account?", { variant: "destructive" }))) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/staff?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete staff");
      }

      toast.success("Staff deleted successfully");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 size={16} />
    </Button>
  );
}
