"use client";

import Image from "next/image";
import { useClerk } from "@clerk/nextjs";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, clearAuth, isAuthenticated } = useAuthStore();
  const { setAuthModalOpen } = useUIStore();
  const { signOut: clerkSignOut } = useClerk();

  const handleSignOut = () => {
    clearAuth();
    // Also end the Clerk session so ClerkAuthSync doesn't immediately
    // re-authenticate the user with the previous Google account.
    clerkSignOut();
  };

  return (
    <nav className="sticky top-0 z-30 bg-court-green text-white px-6 py-3 flex items-center justify-between shadow-md">
      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <Image
          src="/DINKR_LOGO.png"
          alt="Dinkr"
          width={32}
          height={32}
          className="rounded-full"
        />
        <span className="font-display text-2xl font-bold tracking-widest uppercase">
          Dinkr
        </span>
      </div>

      {/* Auth controls */}
      <div className="flex items-center gap-3">
        {isAuthenticated() && user ? (
          <>
            <span className="text-sm font-body text-white/80 hidden sm:block">
              {user.full_name || user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="border-white/40 text-white hover:bg-white/10 hover:text-white"
            >
              Sign Out
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAuthModalOpen(true)}
          >
            Sign In
          </Button>
        )}
      </div>
    </nav>
  );
}
