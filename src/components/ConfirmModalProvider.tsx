"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./ui/button";

interface ConfirmContextType {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmModalProvider");
  }
  return context;
}

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [resolveFn, setResolveFn] = useState<(value: boolean) => void>(() => () => {});

  const confirm = useCallback((message: string, opts?: ConfirmOptions) => {
    setMessage(message);
    setOptions(opts || {});
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveFn(() => resolve);
    });
  }, []);

  const handleClose = (value: boolean) => {
    setIsOpen(false);
    // Add a slight delay to allow closing animation before resolving
    setTimeout(() => resolveFn(value), 150);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => handleClose(false)} 
          />
          
          {/* Modal Content */}
          <div 
            className={`relative w-full sm:max-w-md bg-zinc-950 sm:rounded-2xl border-t sm:border border-zinc-800 shadow-2xl overflow-hidden
              animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 rounded-t-2xl pb-safe`}
          >
            {/* Mobile drag handle */}
            <div className="w-full flex justify-center py-3 sm:hidden">
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full"></div>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full shrink-0 ${options.variant === 'default' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                
                <div className="flex-1 mt-1">
                  <h2 className="text-xl font-bold text-white mb-2">
                    {options.title || "ຍືນຍັນການດຳເນີນການ"}
                  </h2>
                  <p className="text-sm text-zinc-400 whitespace-pre-line leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full sm:w-auto flex-1 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white h-12 sm:h-10 text-base sm:text-sm font-medium"
                  onClick={() => handleClose(false)}
                >
                  {options.cancelText || "ຍົກເລີກ (Cancel)"}
                </Button>
                <Button 
                  type="button" 
                  className={`w-full sm:w-auto flex-1 h-12 sm:h-10 text-base sm:text-sm font-bold shadow-lg shadow-black/20 ${
                    options.variant === 'default' 
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                      : "bg-red-600 hover:bg-red-500 text-white"
                  }`}
                  onClick={() => handleClose(true)}
                >
                  {options.confirmText || "ຍືນຍັນ (Confirm)"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
