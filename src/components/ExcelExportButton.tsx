"use client";

import React from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExcelExportButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function ExcelExportButton({
  onClick,
  label = "ດາວໂຫຼດ Excel ສວຍໆ",
  className = "",
}: ExcelExportButtonProps) {
  const handleClick = () => {
    toast.success("ກຳລັງສ້າງໄຟລ໌ Excel ຮູບແບບງາມ...");
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-95 whitespace-nowrap cursor-pointer border border-emerald-400/20 ${className}`}
    >
      <Download className="w-4 h-4 animate-bounce" />
      <span>{label}</span>
    </button>
  );
}
