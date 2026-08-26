'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Video, MapPin, CheckCircle2, Phone, Mail, User, MessageSquare } from 'lucide-react';
import type { Property } from '../../lib/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { bookingsApi } from '../../lib/api/bookings';
import { ApiError } from '../../lib/api/client';
import { track } from '../../lib/analytics/track';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  preferredDate: z.string().min(1, 'Please select a date'),
  preferredTime: z.string().min(1, 'Please select a time'),
  type: z.enum(['physical', 'virtual']),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props { property: Property }

export function PropertyBooking({ property }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [viewType, setViewType] = useState<'physical' | 'virtual'>('virtual');
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'virtual', preferredTime: '10:00' },
  });

  const onSubmit = async (data: FormData) => {
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
      // Mirrors the shared useBooking hook: a filed booking must show up in
      // the developer's dashboard whichever template took it.
      track({
        type: 'BOOKING_SUBMITTED',
        propertyId: property.id,
        metadata: { viewingType: data.type === 'virtual' ? 'VIRTUAL' : 'PHYSICAL' },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('Failed to submit booking. Please try again.');
      }
    }
  };

  return (
    <section id="booking" className="scroll-mt-24">
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* Left panel */}
          {/*
            A near-black ground with the developer's colour as the accent.

            It used to be a gradient of brand-900 → brand-950, which are the
            *platform's* indigo-violet steps — so a development branded blue
            got a violet slab here, and one branded maroon would get the same
            violet. Neutral ink lets any brand colour sit on it, and reads more
            expensive than a saturated panel besides: the luxury convention is
            restraint in the ground and colour only where it means something.
          */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#15171c] to-[#0b0d11] p-8 lg:col-span-2">
            {/* A wash of the developer's own colour, not the platform's. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-20 blur-3xl"
              style={{ background: 'var(--brand)' }}
            />

            <div className="relative">
              <p
                className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: 'var(--brand)' }}
              >
                Get in touch
              </p>
              <h2
                className="text-[28px] font-medium leading-[1.1] tracking-[-0.025em] text-white"
                style={{ fontFamily: 'var(--brand-font-heading)' }}
              >
                Book a Viewing
              </h2>
              <p className="mt-3 text-sm text-white/50 leading-relaxed">
                Schedule a physical or virtual tour of {property.name}. Our team will confirm your booking within 24 hours.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={17} strokeWidth={1.6} className="mt-0.5 shrink-0 text-white" />
                  <div>
                    <p className="text-sm font-medium text-white">Confirmed in 24hrs</p>
                    <p className="text-xs text-white/40">Quick response from the developer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Video size={17} strokeWidth={1.6} className="mt-0.5 shrink-0 text-white" />
                  <div>
                    <p className="text-sm font-medium text-white">Virtual or Physical</p>
                    <p className="text-xs text-white/40">Your choice of tour format</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={17} strokeWidth={1.6} className="mt-0.5 shrink-0 text-white" />
                  <div>
                    <p className="text-sm font-medium text-white">{property.address.neighborhood}, {property.address.city}</p>
                    <p className="text-xs text-white/40">On-site or online</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="p-8 lg:col-span-3">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 size={28} className="text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Booking Request Sent!</h3>
                <p className="max-w-xs text-sm text-gray-500">
                  Thank you! The team at {property.developer.name} will confirm your viewing within 24 hours.
                </p>
                <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                  Book Another
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Tour type toggle */}
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-600">Tour type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'virtual', label: 'Virtual Tour', icon: Video },
                      { value: 'physical', label: 'Physical Visit', icon: MapPin },
                    ] as const).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setViewType(value); setValue('type', value); }}
                        className={cn(
                          'flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all cursor-pointer',
                          viewType === value
                            ? 'border-brand-500/40 bg-brand-500/10 text-brand-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
                        )}
                      >
                        <Icon size={15} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name + email */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Full Name"
                    placeholder="Jane Doe"
                    leftIcon={<User size={14} />}
                    error={errors.name?.message}
                    {...register('name')}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="jane@example.com"
                    leftIcon={<Mail size={14} />}
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>

                {/* Phone + date */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+254 700 000 000"
                    leftIcon={<Phone size={14} />}
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                  <Input
                    label="Preferred Date"
                    type="date"
                    leftIcon={<Calendar size={14} />}
                    error={errors.preferredDate?.message}
                    {...register('preferredDate')}
                  />
                </div>

                {/* Time */}
                <Input
                  label="Preferred Time"
                  type="time"
                  error={errors.preferredTime?.message}
                  {...register('preferredTime')}
                />

                {serverError && (
                  <p className="text-xs text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                    {serverError}
                  </p>
                )}

                {/* Message */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600">Message (optional)</label>
                  <div className="relative">
                    <MessageSquare size={14} className="absolute left-3.5 top-3 text-gray-400" />
                    <textarea
                      rows={3}
                      placeholder="Any specific units or questions..."
                      className="w-full resize-none rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                      {...register('message')}
                    />
                  </div>
                </div>

                {/*
                  The developer's colour, overriding the shared Button's
                  platform indigo. This is the mini-site's primary conversion
                  control, so it has to be the same blue as the navbar CTA
                  above it — two different blues on one screen is the single
                  loudest way a page reads as unfinished. The shared Button is
                  left alone because it is used across the dashboard too.
                */}
                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full !shadow-none"
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-on)' }}
                >
                  {isSubmitting ? 'Sending...' : 'Request a Viewing'}
                </Button>

                <p className="text-center text-xs text-gray-400">
                  By submitting, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
