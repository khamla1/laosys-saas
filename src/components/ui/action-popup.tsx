"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X, Trash2, Sparkles, ArrowRight } from "lucide-react";

export interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: "success" | "warning" | "danger" | "info" | "delete";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  isLoading?: boolean;
  children?: React.ReactNode;
  variant?: "default" | "danger" | "success" | "info";
}

export function ActionModal({
  isOpen,
  onClose,
  title,
  description,
  icon = "info",
  confirmText = "ຢືນຢັນ (Confirm)",
  cancelText = "ຍົກເລີກ (Cancel)",
  onConfirm,
  isLoading = false,
  children,
  variant = "default",
}: ActionModalProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!onConfirm) {
      onClose();
      return;
    }
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    switch (icon) {
      case "success":
        return (
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <CheckCircle className="w-7 h-7 text-emerald-400" />
          </div>
        );
      case "warning":
        return (
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <AlertTriangle className="w-7 h-7 text-amber-400" />
          </div>
        );
      case "danger":
      case "delete":
        return (
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/20 animate-pulse">
            <Trash2 className="w-7 h-7 text-rose-400" />
          </div>
        );
      default:
        return (
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Info className="w-7 h-7 text-blue-400" />
          </div>
        );
    }
  };

  const getConfirmButtonStyle = () => {
    if (variant === "danger" || icon === "delete" || icon === "danger") {
      return "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/30 border border-rose-500/50";
    }
    if (variant === "success" || icon === "success") {
      return "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 border border-emerald-500/50";
    }
    return "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 border border-blue-500/50";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-zinc-700/80 rounded-3xl p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            variant === "danger" || icon === "delete" || icon === "danger"
              ? "bg-gradient-to-r from-rose-500 via-red-400 to-rose-500"
              : variant === "success" || icon === "success"
              ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"
              : "bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"
          }`}
        />

        <button
          onClick={onClose}
          disabled={loading || isLoading}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {getIcon()}

        <div className="text-center space-y-2 mb-6">
          <h3 className="text-xl font-extrabold text-white tracking-tight">{title}</h3>
          {description && (
            <p className="text-sm text-zinc-300 leading-relaxed max-w-sm mx-auto">{description}</p>
          )}
        </div>

        {children && <div className="mb-6">{children}</div>}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading || isLoading}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-all hover:text-white cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || isLoading}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${getConfirmButtonStyle()} disabled:opacity-50 cursor-pointer`}
          >
            {loading || isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{confirmText}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface StatusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "info";
  autoCloseMs?: number;
}

export function StatusPopup({
  isOpen,
  onClose,
  title,
  message,
  type = "success",
  autoCloseMs = 3000,
}: StatusPopupProps) {
  useEffect(() => {
    if (isOpen && autoCloseMs > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseMs, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-sm bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 rounded-3xl p-6 shadow-2xl text-center overflow-hidden animate-in zoom-in-95 duration-200 ${
          type === "success"
            ? "border-emerald-500/40 shadow-emerald-500/20"
            : type === "error"
            ? "border-rose-500/40 shadow-rose-500/20"
            : "border-blue-500/40 shadow-blue-500/20"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            type === "success"
              ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"
              : type === "error"
              ? "bg-gradient-to-r from-rose-500 via-red-400 to-rose-500"
              : "bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"
          }`}
        />
        <div className="mb-4 pt-1">
          {type === "success" && (
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle className="w-9 h-9 text-emerald-400 animate-bounce" />
            </div>
          )}
          {type === "error" && (
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto shadow-xl shadow-rose-500/20">
              <XCircle className="w-9 h-9 text-rose-400 animate-pulse" />
            </div>
          )}
          {type === "info" && (
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20">
              <Sparkles className="w-9 h-9 text-blue-400 animate-spin" style={{ animationDuration: "3s" }} />
            </div>
          )}
        </div>

        <h4 className="text-xl font-extrabold text-white tracking-tight mb-2">{title}</h4>
        <p className="text-sm text-zinc-300 leading-relaxed mb-6">{message}</p>

        <button
          type="button"
          onClick={onClose}
          className={`w-full py-3 px-4 rounded-xl font-extrabold text-sm text-white transition-all shadow-lg cursor-pointer ${
            type === "success"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25"
              : type === "error"
              ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/25"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/25"
          }`}
        >
          ຮັບຊາບ / ຕົກລົງ (OK)
        </button>
      </div>
    </div>
  );
}
