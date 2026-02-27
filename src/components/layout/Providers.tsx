"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/Toaster";
import { Navbar } from "@/components/layout/Navbar";
import { AuthModal } from "@/components/layout/AuthModal";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

function SessionWatcher() {
  const clearAuth = useAuthStore(s => s.clearAuth);
  const setAuthModalOpen = useUIStore(s => s.setAuthModalOpen);

  useEffect(() => {
    const handler = () => {
      clearAuth();
      setAuthModalOpen(true);
    };
    window.addEventListener("dinkr:session-expired", handler);
    return () => window.removeEventListener("dinkr:session-expired", handler);
  }, [clearAuth, setAuthModalOpen]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionWatcher />
      <Navbar />
      <AuthModal />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
