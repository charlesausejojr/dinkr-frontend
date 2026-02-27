'use client';

import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const { user, clearAuth, isAuthenticated } = useAuthStore();
  const { setAuthModalOpen } = useUIStore();

  return (
    <nav className="sticky top-0 z-30 bg-court-green text-white px-6 py-3 flex items-center justify-between shadow-md">
      {/* Logo */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <span className="font-display text-2xl font-bold tracking-widest uppercase">
          Dinkr
        </span>
        <span className="w-2 h-2 rounded-full bg-court-lime" />
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
              onClick={clearAuth}
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
