"use client";

import React from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
  pageSizeOptions?: number[];
  t?: {
    previous?: string;
    next?: string;
    page?: string;
    of?: string;
    showing?: string;
    to?: string;
    entries?: string;
    perPage?: string;
  };
}

export function PaginationControls({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 20, 50, 100],
  t
}: PaginationControlsProps) {
  const safeTotalPages = Math.max(1, totalPages);
  if (totalItems === 0 && totalPages <= 1) return null;
  if (totalPages <= 1 && !onItemsPerPageChange) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = (): (number | "...")[] => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) {
      pages.push("...");
    }
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(safeTotalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (currentPage < safeTotalPages - 2) {
      pages.push("...");
    }
    pages.push(safeTotalPages);
    return pages;
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg mt-4 gap-4">
      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
        <div>
          {t?.showing || "Showing"}{" "}
          <span className="font-semibold text-zinc-200">{startItem}</span>{" "}
          {t?.to || "to"}{" "}
          <span className="font-semibold text-zinc-200">{endItem}</span>{" "}
          {t?.of || "of"}{" "}
          <span className="font-semibold text-zinc-200">{totalItems}</span>{" "}
          {t?.entries || "entries"}
        </div>

        <span className="text-zinc-600 hidden sm:inline">|</span>

        <div className="text-zinc-300">
          {t?.page || "Page"}{" "}
          <span className="font-semibold text-white">{currentPage}</span>{" "}
          {t?.of || "of"}{" "}
          <span className="font-semibold text-white">{safeTotalPages}</span>
        </div>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <label className="text-xs text-zinc-400 whitespace-nowrap">
              {t?.perPage || "ແຖວຕໍ່ໜ້າ (Rows):"}
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm text-white outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size} className="bg-zinc-900 text-white">
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
        >
          {t?.previous || "Previous"}
        </button>

        {getPageNumbers().map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-sm text-zinc-500 select-none">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] px-2.5 py-1 rounded text-sm font-medium border transition-colors ${
                currentPage === p
                  ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                  : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button 
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          disabled={currentPage >= safeTotalPages}
          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
        >
          {t?.next || "Next"}
        </button>
      </div>
    </div>
  );
}

