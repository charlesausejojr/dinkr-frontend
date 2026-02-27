'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useMyCoachProfile, useCreateCoach, useUpdateCoach } from '@/hooks/useCoachProfile';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';
import type { Coach } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  bio: z.string().min(10, 'Tell us a bit more about you').optional().or(z.literal('')),
  rate_per_hour: z.coerce.number().positive('Must be positive'),
  specialties: z.array(z.string()).default([]),
  avatar_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

function CoachForm({
  existing,
  onSuccess,
}: {
  existing: Coach | null;
  onSuccess: () => void;
}) {
  const createCoach = useCreateCoach();
  const updateCoach = useUpdateCoach(existing?.id ?? '');
  const mutation = existing ? updateCoach : createCoach;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      name: existing?.name ?? '',
      bio: existing?.bio ?? '',
      rate_per_hour: existing?.rate_per_hour ?? 0,
      specialties: existing?.specialties ?? [],
      avatar_url: existing?.avatar_url ?? '',
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        bio: existing.bio ?? '',
        rate_per_hour: existing.rate_per_hour,
        specialties: existing.specialties,
        avatar_url: existing.avatar_url ?? '',
      });
    }
  }, [existing, reset]);

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      bio: data.bio || undefined,
      avatar_url: data.avatar_url || undefined,
    };
    mutation.mutate(payload, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name" error={errors.name?.message} {...register('name')} />
        <Input label="Rate per Hour (₱)" type="number" step="0.01" error={errors.rate_per_hour?.message} {...register('rate_per_hour')} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">Bio</label>
        <textarea
          {...register('bio')}
          rows={4}
          placeholder="Tell players about your experience, playing style, and coaching approach..."
          className="w-full px-4 py-3 border-2 border-gray-200 focus:border-court-green rounded-sm outline-none font-body text-sm bg-white resize-none"
        />
        {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">Specialties</label>
        <Controller
          control={control}
          name="specialties"
          render={({ field }) => (
            <TagInput
              value={field.value}
              onChange={field.onChange}
              placeholder="e.g. Beginner-friendly, Dinking, Doubles..."
            />
          )}
        />
        <p className="text-xs font-body text-court-slate/40">Type a specialty and press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Enter</kbd> to add it. Click the × on a tag to remove it.</p>
      </div>

      <Controller
        control={control}
        name="avatar_url"
        render={({ field }) => (
          <ImageUpload
            label="Profile Photo (optional)"
            type="avatar"
            value={field.value ?? ''}
            onChange={field.onChange}
          />
        )}
      />

      {mutation.isError && (
        <p className="text-sm text-red-500">
          {(mutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Something went wrong'}
        </p>
      )}

      <Button type="submit" size="lg" loading={mutation.isPending} className="self-start">
        {existing ? 'Save Changes' : 'Create Listing →'}
      </Button>
    </form>
  );
}

function ExistingProfile({ profile, onEdit }: { profile: Coach; onEdit: () => void }) {
  return (
    <div className="max-w-lg border-2 border-court-lime rounded-sm bg-white p-6 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.name} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-court-green flex items-center justify-center">
            <span className="font-display font-bold text-court-lime text-xl uppercase">
              {profile.name[0]}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-display text-2xl font-bold text-court-green uppercase tracking-tight">{profile.name}</h3>
          <p className="font-display font-bold text-court-lime text-lg">₱{profile.rate_per_hour}/hr</p>
        </div>
        <span className="px-2 py-1 bg-court-lime text-court-green text-xs font-display font-bold uppercase rounded-full">
          Active
        </span>
      </div>

      {profile.bio && (
        <p className="font-body text-sm text-court-slate/70">{profile.bio}</p>
      )}

      {profile.specialties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profile.specialties.map(s => (
            <span key={s} className="px-3 py-1 border border-court-lime text-court-green text-xs font-body rounded-full">
              {s}
            </span>
          ))}
        </div>
      )}

      <Button variant="ghost" size="sm" className="self-start" onClick={onEdit}>
        Edit Listing
      </Button>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function BecomeCoachPanel() {
  const { isAuthenticated } = useAuthStore();
  const { setAuthModalOpen } = useUIStore();
  const { myProfile, isLoading } = useMyCoachProfile();
  const [editing, setEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthenticated()) {
    return (
      <div className="text-center py-16">
        <h2 className="font-display text-3xl font-bold text-court-green uppercase tracking-tight mb-2">
          Become a Coach
        </h2>
        <p className="font-body text-court-slate/60 mb-6">Sign in to create your coaching listing.</p>
        <Button variant="secondary" onClick={() => setAuthModalOpen(true)}>Sign In</Button>
      </div>
    );
  }

  const showForm = !myProfile || editing;

  return (
    <div>
      <h2 className="font-display text-3xl font-bold text-court-green uppercase tracking-tight mb-2">
        {myProfile ? 'Your Coaching Profile' : 'Become a Coach'}
      </h2>
      <p className="font-body text-court-slate/60 mb-8">
        {myProfile
          ? 'Players can see and book you from the "Book a Coach" tab.'
          : 'Create your listing and start accepting bookings.'}
      </p>

      {successMsg && (
        <div className="mb-6 p-4 bg-court-lime/20 border border-court-lime rounded-sm">
          <p className="font-display font-bold text-court-green">{successMsg}</p>
        </div>
      )}

      {isLoading ? (
        <div className="h-40 rounded-sm bg-gray-100 animate-pulse max-w-lg" />
      ) : myProfile && !editing ? (
        <ExistingProfile profile={myProfile} onEdit={() => setEditing(true)} />
      ) : (
        <CoachForm
          existing={editing ? myProfile : null}
          onSuccess={() => {
            setEditing(false);
            setSuccessMsg('Your coaching listing is live!');
            setTimeout(() => setSuccessMsg(''), 5000);
          }}
        />
      )}
    </div>
  );
}
