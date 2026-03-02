'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-court-lime border-t-transparent rounded-full animate-spin" />
        <p className="font-display font-bold uppercase tracking-wide text-court-green text-sm">
          Signing you in…
        </p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
