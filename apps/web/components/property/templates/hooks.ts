'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookingsApi } from '../../../lib/api/bookings';
import { ApiError } from '../../../lib/api/client';
import type { Property, Unit } from '../../../lib/types';

/**
 * Behaviour shared by every template's sections.
 *
 * Templates render genuinely different markup — their own cards, their own
 * arrangements — but the logic underneath is defined once here. A booking
 * submits the same way and a unit filters the same way whichever template a
 * developer picked, so a fix lands everywhere instead of in one of eight
 * copies.
 */

// ─── Units ──────────────────────────────────────────────────────────────────

export type UnitFilter = 'all' | 'available';

export interface UnitStatusMeta {
  key: 'available' | 'reserved' | 'sold';
  label: string;
  /** True when the unit can still be reserved — drives the CTA. */
  actionable: boolean;
}

export function unitStatus(unit: Unit): UnitStatusMeta {
  const key = String(unit.status ?? '').toLowerCase();
  if (key === 'reserved') return { key: 'reserved', label: 'Reserved', actionable: false };
  if (key === 'sold') return { key: 'sold', label: 'Sold', actionable: false };
  return { key: 'available', label: 'Available', actionable: true };
}

export function useUnits(units: Unit[]) {
  const [filter, setFilter] = useState<UnitFilter>('all');

  const availableCount = useMemo(
    () => units.filter((u) => unitStatus(u).key === 'available').length,
    [units],
  );

  const displayed = useMemo(
    () => (filter === 'available' ? units.filter((u) => unitStatus(u).key === 'available') : units),
    [units, filter],
  );

  return { filter, setFilter, displayed, availableCount, total: units.length };
}

// ─── Booking ────────────────────────────────────────────────────────────────

/**
 * Kept identical to the original PropertyBooking schema. The wording of these
 * messages reaches buyers, so they are part of the behaviour a template must
 * not quietly change.
 */
const bookingSchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  preferredDate: z.string().min(1, 'Choose a date'),
  preferredTime: z.string().min(1, 'Choose a time'),
  type: z.enum(['physical', 'virtual']),
  message: z.string().optional(),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

export function useBooking(property: Property) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { type: 'virtual', preferredTime: '10:00' },
  });

  const viewType = form.watch('type');

  const setViewType = (type: 'physical' | 'virtual') => {
    form.setValue('type', type);
  };

  const onSubmit = form.handleSubmit(async (data) => {
    setServerError('');
    try {
      await bookingsApi.create({
        propertySlug: property.slug,
        name: data.name,
        email: data.email,
        phone: data.phone,
        date: data.preferredDate,
        time: data.preferredTime,
        type: data.type === 'virtual' ? 'VIRTUAL' : 'PHYSICAL',
        message: data.message,
      });
      setSubmitted(true);
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : 'Failed to submit booking. Please try again.',
      );
    }
  });

  return {
    form,
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    submitted,
    serverError,
    viewType,
    setViewType,
    onSubmit,
  };
}

// ─── Gallery ────────────────────────────────────────────────────────────────

/**
 * Lightbox state. Templates lay their thumbnails out however they like; the
 * open/close/step behaviour is the same everywhere.
 */
export function useLightbox(images: string[]) {
  const [index, setIndex] = useState<number | null>(null);

  const open = (i: number) => setIndex(i);
  const close = () => setIndex(null);
  const next = () => setIndex((i) => (i === null ? null : (i + 1) % images.length));
  const prev = () => setIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));

  return { index, isOpen: index !== null, open, close, next, prev };
}
