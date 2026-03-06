"use client";

import { useEffect } from "react";
import { useAuth as useClerkAuth, useClerk } from "@clerk/nextjs";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/Toaster";
import { Navbar } from "@/components/layout/Navbar";
import { AuthModal } from "@/components/layout/AuthModal";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { useClerkTokenExchange } from "@/hooks/useAuth";

// Clears stale auth when the backend returns 401
function SessionWatcher() {
  const clearAuth = useAuthStore(s => s.clearAuth);
  const setAuthModalOpen = useUIStore(s => s.setAuthModalOpen);
  const { signOut: clerkSignOut } = useClerk();

  useEffect(() => {
    const handler = () => {
      clearAuth();
      // End the Clerk session too, so the user isn't silently re-logged in.
      clerkSignOut();
      setAuthModalOpen(true);
    };
    window.addEventListener("dinkr:session-expired", handler);
    return () => window.removeEventListener("dinkr:session-expired", handler);
  }, [clearAuth, setAuthModalOpen, clerkSignOut]);

  return null;
}

// Watches for an active Clerk session and exchanges it for a Dinkr backend JWT
function ClerkAuthSync() {
  const { isSignedIn, getToken } = useClerkAuth();
  const dinkrToken = useAuthStore(s => s.token);
  const setAuthModalOpen = useUIStore(s => s.setAuthModalOpen);
  const exchange = useClerkTokenExchange();

  useEffect(() => {
    if (isSignedIn && !dinkrToken && !exchange.isPending && !exchange.isSuccess) {
      getToken().then(clerkToken => {
        if (clerkToken) {
          exchange.mutate(clerkToken, {
            onSuccess: () => setAuthModalOpen(false),
          });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, dinkrToken]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionWatcher />
      <ClerkAuthSync />
      <Navbar />
      <AuthModal />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
