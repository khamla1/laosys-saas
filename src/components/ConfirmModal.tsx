"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle, ShieldAlert, X, Info, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConfirmOptions {
  title?: string;
  message: string;
  subMessage?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onResolve?: (result: boolean) => void;
}

type ConfirmModalEvent = {
  options: ConfirmOptions;
};

type ConfirmListener = (options: ConfirmOptions) => void;
const listeners = new Set<ConfirmListener>();

function emitConfirmModal(options: ConfirmOptions) {
  listeners.forEach((listener) => listener(options));
}

/**
 * Global promise-based helper to display a beautiful confirmation modal popup.
 * Example usage:
 *   const confirmed = await askConfirm("ທ່ານຕ້ອງການລຶບໝວດໝູ່ນີ້ແທ້ບໍ່?");
 *   if (!confirmed) return;
 */
export function askConfirm(
  messageOrOptions: string | ConfirmOptions,
  titleOrOptions?:
    | string
    | {
        title?: string;
        variant?: "danger" | "warning" | "info" | "destructive" | "default";
        subMessage?: string;
        confirmText?: string;
        cancelText?: string;
      },
  subMessageInput = "ຄຳເຕືອນກິດຈະກຳ: ຂໍ້ມູນນີ້ຈະຖືກລຶບອອກຈາກລະບົບ ແລະ ບໍ່ສາມາດກູ້ຄືນໄດ້ (This action cannot be undone)"
): Promise<boolean> {
  return new Promise((resolve) => {
    let options: ConfirmOptions;
    if (typeof messageOrOptions === "string") {
      let title = "ຢືນຢັນການດຳເນີນການ (Confirm Action)";
      let subMessage = subMessageInput;
      let variant: "danger" | "warning" | "info" = "danger";
      let confirmText = "ຢືນຢັນການລຶບ (Confirm Delete)";
      let cancelText = "ຍົກເລີກ (Cancel)";

      if (typeof titleOrOptions === "string") {
        title = titleOrOptions;
      } else if (typeof titleOrOptions === "object" && titleOrOptions !== null) {
        if (titleOrOptions.title) title = titleOrOptions.title;
        if (titleOrOptions.subMessage) subMessage = titleOrOptions.subMessage;
        if (titleOrOptions.confirmText) confirmText = titleOrOptions.confirmText;
        if (titleOrOptions.cancelText) cancelText = titleOrOptions.cancelText;
        if (
          titleOrOptions.variant === "destructive" ||
          titleOrOptions.variant === "danger"
        ) {
          variant = "danger";
        } else if (titleOrOptions.variant === "warning") {
          variant = "warning";
        } else if (
          titleOrOptions.variant === "info" ||
          titleOrOptions.variant === "default"
        ) {
          variant = "info";
        }
      }

      options = {
        title,
        message: messageOrOptions,
        subMessage,
        variant,
        confirmText,
        cancelText,
        onResolve: resolve,
      };
    } else {
      options = {
        title: messageOrOptions.title || "ຢືນຢັນການດຳເນີນການ (Confirm Action)",
        message: messageOrOptions.message,
        subMessage:
          messageOrOptions.subMessage ||
          "ຄຳເຕືອນກິດຈະກຳ: ຂໍ້ມູນນີ້ຈະຖືກລຶບອອກຈາກລະບົບ ແລະ ບໍ່ສາມາດກູ້ຄືນໄດ້ (This action cannot be undone)",
        variant: messageOrOptions.variant || "danger",
        confirmText: messageOrOptions.confirmText || "ຢືນຢັນການລຶບ (Confirm Delete)",
        cancelText: messageOrOptions.cancelText || "ຍົກເລີກ (Cancel)",
        onResolve: resolve,
      };
    }
    emitConfirmModal(options);
  });
}

export function ConfirmModalProvider() {
  const [activeModal, setActiveModal] = useState<ConfirmOptions | null>(null);

  useEffect(() => {
    const handler: ConfirmListener = (options) => {
      setActiveModal(options);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const handleResolve = useCallback(
    (result: boolean) => {
      if (activeModal?.onResolve) {
        activeModal.onResolve(result);
      }
      setActiveModal(null);
    },
    [activeModal]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeModal) return;
      if (e.key === "Escape") {
        handleResolve(false);
      } else if (e.key === "Enter") {
        handleResolve(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal, handleResolve]);

  if (!activeModal) return null;

  const {
    title = "ຢືນຢັນການດຳເນີນການ (Confirm Action)",
    message,
    subMessage,
    confirmText = "ຢືນຢັນການລຶບ (Confirm Delete)",
    cancelText = "ຍົກເລີກ (Cancel)",
    variant = "danger",
  } = activeModal;

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md rounded-2xl bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border ${
          isDanger
            ? "border-red-500/40 shadow-2xl shadow-red-500/20"
            : isWarning
            ? "border-amber-500/40 shadow-2xl shadow-amber-500/20"
            : "border-blue-500/40 shadow-2xl shadow-blue-500/20"
        } p-6 overflow-hidden animate-in zoom-in-95 duration-200`}
      >
        {/* Glow accent */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isDanger
              ? "bg-red-500/20"
              : isWarning
              ? "bg-amber-500/20"
              : "bg-blue-500/20"
          }`}
        />

        {/* Close Button */}
        <button
          onClick={() => handleResolve(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-lg ${
            isDanger
              ? "bg-gradient-to-br from-red-500/20 to-rose-500/20 border-red-500/30 shadow-red-500/20 text-red-500"
              : isWarning
              ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30 shadow-amber-500/20 text-amber-500"
              : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 shadow-blue-500/20 text-blue-400"
          }`}
        >
          {isDanger && <AlertTriangle className="w-8 h-8 animate-pulse" />}
          {isWarning && <ShieldAlert className="w-8 h-8 animate-pulse" />}
          {!isDanger && !isWarning && <Info className="w-8 h-8" />}
        </div>

        {/* Title & Message */}
        <h3 className="text-xl font-bold text-white text-center mb-2 tracking-wide">
          {title}
        </h3>
        <p className="text-base text-zinc-300 text-center leading-relaxed mb-5">
          {message}
        </p>

        {/* Activity Warning Box */}
        {subMessage && (
          <div
            className={`rounded-xl p-3.5 mb-6 flex items-start gap-3 border ${
              isDanger
                ? "bg-red-500/10 border-red-500/25 text-red-300"
                : isWarning
                ? "bg-amber-500/10 border-amber-500/25 text-amber-300"
                : "bg-blue-500/10 border-blue-500/25 text-blue-300"
            }`}
          >
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="text-xs sm:text-sm font-medium leading-normal">
              {subMessage}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            onClick={() => handleResolve(false)}
            variant="outline"
            className="w-full sm:flex-1 py-3 h-auto rounded-xl border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium transition-all"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={() => handleResolve(true)}
            className={`w-full sm:flex-1 py-3 h-auto rounded-xl font-semibold shadow-lg transition-all ${
              isDanger
                ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/25"
                : isWarning
                ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-500/25"
                : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-500/25"
            }`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
