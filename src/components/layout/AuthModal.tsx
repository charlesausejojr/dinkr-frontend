'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
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

function LoginTab({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    login.mutate(data, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-4">
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
  );
}

function RegisterTab({ onSuccess }: { onSuccess: () => void }) {
  const register_ = useRegister();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterForm) => {
    register_.mutate(data, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-4">
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
  );
}

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

          <Dialog.Close className="absolute top-4 right-4 text-court-slate/40 hover:text-court-slate transition-colors text-xl leading-none">
            ✕
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
