'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useSignIn, useAuth as useClerkAuth, useClerk } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUIStore } from '@/store/uiStore';
import { useLogin, useRegister } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

// ── Google OAuth button ───────────────────────────────────────────────────────
function GoogleSignInButton({ onSuccess }: { onSuccess: () => void }) {
  const { signIn, isLoaded } = useSignIn();
  const { isSignedIn } = useClerkAuth();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError(null);
    try {
      // If there's a stale Clerk session, clear it first so Google always
      // shows the account picker instead of silently reusing the last account.
      if (isSignedIn) {
        await signOut();
      }

      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: window.location.origin,
      });
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string; longMessage?: string }[] };
      const msg =
        clerkErr.errors?.[0]?.longMessage ??
        clerkErr.errors?.[0]?.message ??
        'Google sign-in failed. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  const busy = loading;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={busy || !isLoaded}
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border-2 border-gray-200 rounded-sm font-display font-bold text-sm uppercase tracking-wide text-court-slate hover:border-court-green hover:text-court-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {/* Google 'G' logo */}
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {busy ? 'Signing in…' : 'Continue with Google'}
      </button>
      {error && (
        <p className="text-xs text-red-500 text-center font-body">{error}</p>
      )}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs font-body text-court-slate/40 uppercase tracking-widest">or</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ── Login tab ─────────────────────────────────────────────────────────────────
function LoginTab({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    login.mutate(data, { onSuccess });
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      <GoogleSignInButton onSuccess={onSuccess} />
      <OrDivider />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
        {login.isError && (
          <p className="text-sm text-red-500">
            {(login.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Login failed'}
          </p>
        )}
        <Button type="submit" loading={login.isPending} className="w-full mt-2">
          Sign In
        </Button>
      </form>
    </div>
  );
}

// ── Register tab ──────────────────────────────────────────────────────────────
function RegisterTab({ onSuccess }: { onSuccess: () => void }) {
  const register_ = useRegister();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterForm) => {
    register_.mutate(data, { onSuccess });
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      <GoogleSignInButton onSuccess={onSuccess} />
      <OrDivider />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Full Name" error={errors.full_name?.message} {...register('full_name')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
        {register_.isError && (
          <p className="text-sm text-red-500">
            {(register_.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Registration failed'}
          </p>
        )}
        <Button type="submit" loading={register_.isPending} className="w-full mt-2">
          Create Account
        </Button>
      </form>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function AuthModal() {
  const { authModalOpen, setAuthModalOpen } = useUIStore();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const handleSuccess = () => setAuthModalOpen(false);

  return (
    <Dialog.Root open={authModalOpen} onOpenChange={setAuthModalOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-lg shadow-2xl p-8 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="font-display text-2xl font-bold text-court-green tracking-tight">
            {tab === 'login' ? 'Welcome Back' : 'Join Dinkr'}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-court-slate/70 mt-1">
            {tab === 'login'
              ? 'Sign in to book courts and coaches.'
              : 'Create an account to get started.'}
          </Dialog.Description>

          {/* Tabs */}
          <div className="flex mt-6 border-b border-gray-200">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-4 py-2 text-sm font-display font-semibold uppercase tracking-wide transition-colors',
                  tab === t
                    ? 'border-b-2 border-court-lime text-court-green'
                    : 'text-court-slate/50 hover:text-court-slate'
                )}
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {tab === 'login'
            ? <LoginTab onSuccess={handleSuccess} />
            : <RegisterTab onSuccess={handleSuccess} />}

          {/* Required by Clerk's Smart CAPTCHA for custom auth flows */}
          <div id="clerk-captcha" />

          <Dialog.Close className="absolute top-4 right-4 text-court-slate/40 hover:text-court-slate transition-colors text-xl leading-none">
            ✕
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
