"use client";

import { SessionProvider } from "next-auth/react";
import { ConfirmModalProvider } from "@/components/ConfirmModal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ConfirmModalProvider />
    </SessionProvider>
  );
}
