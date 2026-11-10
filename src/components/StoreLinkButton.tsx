"use client";

import { useState } from "react";
import { Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

import { copyToClipboard } from "@/lib/utils";

export function StoreLinkButton({ storeId }: { storeId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/stores/${storeId}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button 
      onClick={handleCopy} 
      className="bg-zinc-800 hover:bg-zinc-700 text-white gap-2 border border-zinc-700"
    >
      {copied ? <Check size={16} className="text-emerald-400" /> : <LinkIcon size={16} />}
      {copied ? "Copied!" : "Copy Store Link"}
    </Button>
  );
}
