'use client';

import { useState } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useEstablishments, useEstablishment } from '@/hooks/useEstablishments';
import {
  useCreateEstablishment,
  useAddCourt,
  useDeactivateCourt,
  useUpdateEstablishment,
} from '@/hooks/useCreateEstablishment';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';
import { ImageUpload } from '@/components/ui/ImageUpload';
import type { Establishment, Court } from '@/types';

// ── Schemas ───────────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i + 1).padStart(2, '0')}:00`);

const estSchema = z.object({
  name: z.string().min(2, 'Name required'),
  location: z.string().min(2, 'Location required'),
  description: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  open_time: z.string().default('06:00'),
  close_time: z.string().default('22:00'),
});

const courtSchema = z.object({
  name: z.string().min(1, 'Name required'),
  price_per_hour: z.coerce.number().positive('Must be positive'),
  surface_type: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

type EstForm = z.infer<typeof estSchema>;
type CourtForm = z.infer<typeof courtSchema>;

const SURFACE_TYPES = ['Indoor', 'Outdoor', 'Hardcourt', 'Grass'];

// ── Inline court edit form ────────────────────────────────────────────────────
function CourtEditForm({ court, estId, onDone }: { court: Court; estId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const update = useMutation({
    mutationFn: (data: CourtForm) =>
      api.patch(`/establishments/${estId}/courts/${court.id}`, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishment', estId] });
      queryClient.invalidateQueries({ queryKey: ['establishments'] });
      onDone();
    },
  });

  const { register, handleSubmit, control, formState: { errors } } = useForm<CourtForm>({
    resolver: zodResolver(courtSchema) as Resolver<CourtForm>,
    defaultValues: {
      name: court.name,
      price_per_hour: court.price_per_hour,
      surface_type: court.surface_type ?? '',
      description: court.description ?? '',
      image_url: court.image_url ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(d => update.mutate(d))} className="grid grid-cols-2 gap-3 py-3">
      <Input label="Court Name" error={errors.name?.message} {...register('name')} />
      <Input label="₱/hr" type="number" step="0.01" error={errors.price_per_hour?.message} {...register('price_per_hour')} />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">Surface</label>
        <select
          {...register('surface_type')}
          className="px-4 py-2.5 border-2 border-gray-200 focus:border-court-green rounded-sm outline-none font-body text-sm bg-white"
        >
          <option value="">Any</option>
          {SURFACE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <Input label="Description" {...register('description')} />
      <div className="col-span-2">
        <Controller
          control={control}
          name="image_url"
          render={({ field }) => (
            <ImageUpload label="Court Photo" type="photo" value={field.value ?? ''} onChange={field.onChange} />
          )}
        />
      </div>
      {update.isError && (
        <p className="col-span-2 text-xs text-red-500">Failed to update court.</p>
      )}
      <div className="col-span-2 flex gap-2">
        <Button type="submit" size="sm" variant="secondary" loading={update.isPending}>Save</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

// ── Court row within an existing establishment ────────────────────────────────
function CourtRow({ court, estId }: { court: Court; estId: string }) {
  const [editing, setEditing] = useState(false);
  const deactivate = useDeactivateCourt(estId);

  if (editing) {
    return (
      <div className="border-b border-gray-100 last:border-0 bg-gray-50 px-2 rounded-sm">
        <CourtEditForm court={court} estId={estId} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <span className="font-display font-bold text-sm text-court-green">{court.name}</span>
        {court.surface_type && (
          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-xs font-body rounded-full">{court.surface_type}</span>
        )}
        <span className="ml-2 text-xs font-body text-court-slate/60">₱{court.price_per_hour}/hr</span>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
        <Button
          variant="danger"
          size="sm"
          loading={deactivate.isPending}
          onClick={() => deactivate.mutate(court.id)}
        >
          Deactivate
        </Button>
      </div>
    </div>
  );
}

// ── Add court inline form ─────────────────────────────────────────────────────
function AddCourtForm({ estId, courtCount }: { estId: string; courtCount: number }) {
  const addCourt = useAddCourt(estId);
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<CourtForm>({
    resolver: zodResolver(courtSchema) as Resolver<CourtForm>,
    defaultValues: { name: `Court ${courtCount + 1}`, image_url: '' },
  });
  const onSubmit = (data: CourtForm) => {
    addCourt.mutate(data, { onSuccess: () => reset({ name: '', image_url: '' }) });
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 mt-3">
      <Input label="Court Name" error={errors.name?.message} {...register('name')} />
      <Input label="₱/hr" type="number" step="0.01" error={errors.price_per_hour?.message} {...register('price_per_hour')} />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">Surface</label>
        <select
          {...register('surface_type')}
          className="px-4 py-2.5 border-2 border-gray-200 focus:border-court-green rounded-sm outline-none font-body text-sm bg-white"
        >
          <option value="">Any</option>
          {SURFACE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <Input label="Description (optional)" {...register('description')} />
      <div className="col-span-2">
        <Controller
          control={control}
          name="image_url"
          render={({ field }) => (
            <ImageUpload label="Court Photo" type="photo" value={field.value ?? ''} onChange={field.onChange} />
          )}
        />
      </div>
      <div className="col-span-2">
        <Button type="submit" variant="secondary" size="sm" loading={addCourt.isPending}>
          + Add Court
        </Button>
      </div>
    </form>
  );
}

// ── Establishment inline edit form ────────────────────────────────────────────
function EstEditForm({ est, onDone }: { est: Establishment; onDone: () => void }) {
  const update = useUpdateEstablishment(est.id);
  const { register, handleSubmit, control, formState: { errors } } = useForm<EstForm>({
    resolver: zodResolver(estSchema) as Resolver<EstForm>,
    defaultValues: {
      name: est.name,
      location: est.location,
      description: est.description ?? '',
      amenities: est.amenities,
      images: est.images,
      open_time: est.open_time ?? '06:00',
      close_time: est.close_time ?? '22:00',
    },
  });

  return (
    <form onSubmit={handleSubmit(d => update.mutate(d, { onSuccess: onDone }))} className="flex flex-col gap-4 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Venue Name" error={errors.name?.message} {...register('name')} />
        <Input label="Location" error={errors.location?.message} {...register('location')} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">Description</label>
        <textarea
          {...register('description')}
          rows={2}
          className="w-full px-4 py-3 border-2 border-gray-200 focus:border-court-green rounded-sm outline-none font-body text-sm bg-white resize-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">Amenities</label>
        <Controller
          control={control}
          name="amenities"
          render={({ field }) => (
            <TagInput value={field.value} onChange={field.onChange} placeholder="e.g. Parking, Showers..." />
          )}
        />
        <p className="text-xs font-body text-court-slate/40">Type an amenity and press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Enter</kbd> to add it. Click the × on a tag to remove it.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">Opens At</label>
          <select
            {...register('open_time')}
            className="px-4 py-2.5 border-2 border-gray-200 focus:border-court-green rounded-sm outline-none font-body text-sm bg-white"
          >
            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">Closes At</label>
          <select
            {...register('close_time')}
            className="px-4 py-2.5 border-2 border-gray-200 focus:border-court-green rounded-sm outline-none font-body text-sm bg-white"
          >
            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>
      <Controller
        control={control}
        name="images"
        render={({ field }) => (
          <ImageUpload
            label="Venue Cover Photo"
            type="photo"
            value={field.value?.[0] ?? ''}
            onChange={url => field.onChange(url ? [url] : [])}
          />
        )}
      />
      {update.isError && (
        <p className="text-xs text-red-500">Failed to update venue.</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="secondary" loading={update.isPending}>Save Changes</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

// ── Establishment management card ─────────────────────────────────────────────
function ManageEstCard({ est }: { est: Establishment }) {
  const [expanded, setExpanded] = useState(false);
  const [editingEst, setEditingEst] = useState(false);
  const { data: full } = useEstablishment(est.id);
  const courts = (full?.courts ?? est.courts ?? []).filter(c => c.is_active);

  return (
    <div className="border-2 border-gray-200 rounded-sm bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="min-w-0">
          <span className="font-display font-bold text-court-green uppercase">{full?.name ?? est.name}</span>
          <span className="ml-2 text-xs text-court-slate/60 font-body">{full?.location ?? est.location}</span>
          <span className="ml-2 px-2 py-0.5 bg-court-lime text-court-green text-xs font-display font-bold rounded-full">
            {courts.length} {courts.length === 1 ? 'court' : 'courts'}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setExpanded(!expanded); setEditingEst(false); }}>
          {expanded ? 'Close' : 'Manage'}
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-5">

          {/* Venue details section */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-display font-semibold uppercase tracking-widest text-court-slate/50">
                Venue Details
              </p>
              {!editingEst && (
                <button
                  className="text-xs font-body text-court-green underline underline-offset-2"
                  onClick={() => setEditingEst(true)}
                >
                  Edit details
                </button>
              )}
            </div>

            {editingEst ? (
              <EstEditForm est={full ?? est} onDone={() => setEditingEst(false)} />
            ) : (
              <div className="text-sm font-body text-court-slate/70 space-y-1">
                {(full?.description ?? est.description) && (
                  <p>{full?.description ?? est.description}</p>
                )}
                {(full?.amenities ?? est.amenities).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(full?.amenities ?? est.amenities).map(a => (
                      <span key={a} className="px-2 py-0.5 bg-gray-100 text-xs font-body rounded-full">{a}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Courts section */}
          <div className="mt-5">
            <p className="text-xs font-display font-semibold uppercase tracking-widest text-court-slate/50 mb-2">
              Courts
            </p>
            {courts.length > 0 ? (
              <div>
                {courts.map(c => <CourtRow key={c.id} court={c} estId={est.id} />)}
              </div>
            ) : (
              <p className="text-xs font-body text-court-slate/40 mb-2">No active courts yet.</p>
            )}
            <div className="mt-3">
              <p className="text-xs font-display font-semibold uppercase tracking-widest text-court-slate/50 mb-2">
                Add Another Court
              </p>
              <AddCourtForm estId={est.id} courtCount={courts.length} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Create establishment form (Part A) ────────────────────────────────────────
function CreateEstForm({ onCreated }: { onCreated: (est: Establishment) => void }) {
  const createEst = useCreateEstablishment();
  const { register, handleSubmit, control, formState: { errors } } = useForm<EstForm>({
    resolver: zodResolver(estSchema) as Resolver<EstForm>,
    defaultValues: { amenities: [], images: [], open_time: '06:00', close_time: '22:00' },
  });

  const onSubmit = (data: EstForm) => {
    createEst.mutate(data, { onSuccess: (est) => onCreated(est) });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Venue Name" error={errors.name?.message} {...register('name')} />
        <Input label="Location" error={errors.location?.message} {...register('location')} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-200 focus:border-court-green rounded-sm outline-none font-body text-sm bg-white resize-none"
          placeholder="Tell players about your venue..."
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">
          Shared Amenities
        </label>
        <Controller
          control={control}
          name="amenities"
          render={({ field }) => (
            <TagInput value={field.value} onChange={field.onChange} placeholder="e.g. Parking, Showers, Lighting..." />
          )}
        />
        <p className="text-xs font-body text-court-slate/40">Type an amenity and press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Enter</kbd> to add it. Click the × on a tag to remove it.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">Opens At</label>
          <select
            {...register('open_time')}
            className="px-4 py-2.5 border-2 border-gray-200 focus:border-court-green rounded-sm outline-none font-body text-sm bg-white"
          >
            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">Closes At</label>
          <select
            {...register('close_time')}
            className="px-4 py-2.5 border-2 border-gray-200 focus:border-court-green rounded-sm outline-none font-body text-sm bg-white"
          >
            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>
      <Controller
        control={control}
        name="images"
        render={({ field }) => (
          <ImageUpload
            label="Venue Cover Photo"
            type="photo"
            value={field.value?.[0] ?? ''}
            onChange={url => field.onChange(url ? [url] : [])}
          />
        )}
      />
      {createEst.isError && (
        <p className="text-sm text-red-500">
          {(createEst.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to create establishment'}
        </p>
      )}
      <Button type="submit" loading={createEst.isPending} size="lg" className="self-start">
        Create Venue →
      </Button>
    </form>
  );
}

// ── Add courts form (Part B) ──────────────────────────────────────────────────
function AddCourtsForm({ establishment, onDone }: { establishment: Establishment; onDone: () => void }) {
  const addCourt = useAddCourt(establishment.id);
  const { data: full } = useEstablishment(establishment.id);
  const courts = (full?.courts ?? []).filter(c => c.is_active);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<CourtForm>({
    resolver: zodResolver(courtSchema) as Resolver<CourtForm>,
    defaultValues: { name: `Court ${courts.length + 1}`, image_url: '' },
  });

  const onSubmit = (data: CourtForm) => {
    addCourt.mutate(data, {
      onSuccess: () => reset({ name: `Court ${courts.length + 2}`, image_url: '' }),
    });
  };

  return (
    <div>
      <div className="bg-court-green/5 border border-court-green/10 rounded-sm p-4 mb-6">
        <h3 className="font-display font-bold text-court-green uppercase tracking-tight">
          ✓ {establishment.name} created!
        </h3>
        <p className="font-body text-sm text-court-slate/60 mt-1">
          Now add your courts. Each court can have its own price and surface type.
        </p>
      </div>

      {courts.length > 0 && (
        <div className="mb-4 border-2 border-gray-100 rounded-sm divide-y divide-gray-100">
          {courts.map(c => (
            <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="font-display font-semibold text-sm text-court-green">{c.name}</span>
              <span className="text-xs font-body text-court-slate/60">{c.surface_type} · ₱{c.price_per_hour}/hr</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
        <Input label="Court Name" error={errors.name?.message} {...register('name')} />
        <Input label="₱/hr" type="number" step="0.01" error={errors.price_per_hour?.message} {...register('price_per_hour')} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">Surface Type</label>
          <select
            {...register('surface_type')}
            className="px-4 py-2.5 border-2 border-gray-200 focus:border-court-green rounded-sm outline-none font-body text-sm bg-white"
          >
            <option value="">Select...</option>
            {SURFACE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Input label="Description (optional)" {...register('description')} />
        <div className="col-span-2">
          <Controller
            control={control}
            name="image_url"
            render={({ field }) => (
              <ImageUpload label="Court Photo" type="photo" value={field.value ?? ''} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="col-span-2 flex gap-3">
          <Button type="submit" variant="secondary" loading={addCourt.isPending}>
            + Add Court
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Done
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function ListCourtPanel() {
  const { isAuthenticated, user } = useAuthStore();
  const { setAuthModalOpen } = useUIStore();
  const [createdEst, setCreatedEst] = useState<Establishment | null>(null);
  const { data: establishments } = useEstablishments();
  const myEstablishments = establishments?.filter(e => e.owner_id === user?.id);

  if (!isAuthenticated()) {
    return (
      <div className="text-center py-16">
        <h2 className="font-display text-3xl font-bold text-court-green uppercase tracking-tight mb-2">
          List Your Courts
        </h2>
        <p className="font-body text-court-slate/60 mb-6">Sign in to manage your venue listings.</p>
        <Button variant="secondary" onClick={() => setAuthModalOpen(true)}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-3xl font-bold text-court-green uppercase tracking-tight mb-2">
        {createdEst ? `Add Courts to ${createdEst.name}` : 'List Your Venue'}
      </h2>
      <p className="font-body text-court-slate/60 mb-8">
        {createdEst
          ? 'Add each court with its own pricing and surface type.'
          : 'Create an establishment, then add individual courts to it.'}
      </p>

      {createdEst ? (
        <AddCourtsForm establishment={createdEst} onDone={() => setCreatedEst(null)} />
      ) : (
        <CreateEstForm onCreated={setCreatedEst} />
      )}

      {/* Your Establishments section */}
      {!createdEst && myEstablishments && myEstablishments.length > 0 && (
        <div className="mt-12">
          <h3 className="font-display font-bold text-lg uppercase tracking-wide text-court-slate mb-4">
            Your Active Establishments
          </h3>
          <div className="flex flex-col gap-4">
            {myEstablishments.map(est => <ManageEstCard key={est.id} est={est} />)}
          </div>
        </div>
      )}
    </div>
  );
}
