'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Video, Box, Headset, Layers, FileText,
  Check, ChevronRight, Info, Sparkles, AlertCircle,
} from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/Button';
import type { ProductionTier } from '../../../../../lib/types';

// ── Production tier definitions ───────────────────────────────────────────────

interface TierFeature {
  label: string;
  included: boolean;
}

interface TierDefinition {
  id: ProductionTier;
  name: string;
  tagline: string;
  icon: React.FC<{ size?: number; className?: string }>;
  price: number; // USD one-time production fee
  monthlyFee: number; // USD per month listing
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  popular?: boolean;
  features: TierFeature[];
}

const tiers: TierDefinition[] = [
  {
    id: 'listing_only',
    name: 'Basic Listing',
    tagline: 'List your property with essential details',
    icon: FileText,
    price: 0,
    monthlyFee: 49,
    color: 'white/40',
    borderColor: 'border-white/10',
    bgColor: 'bg-white/3',
    textColor: 'text-white/60',
    features: [
      { label: 'Property details & description', included: true },
      { label: 'Up to 10 photos (self-upload)', included: true },
      { label: 'Floor plan upload', included: true },
      { label: 'Unit listing & availability', included: true },
      { label: 'Booking & inquiry forms', included: true },
      { label: 'Professional photography', included: false },
      { label: 'Drone / aerial footage', included: false },
      { label: 'Cinematic video tour', included: false },
      { label: 'Interactive 3D model', included: false },
      { label: 'Immersive VR experience', included: false },
      { label: 'Digital twin', included: false },
    ],
  },
  {
    id: 'photography',
    name: 'Photography',
    tagline: 'Professional stills & drone coverage',
    icon: Camera,
    price: 850,
    monthlyFee: 79,
    color: 'amber',
    borderColor: 'border-amber-500/20',
    bgColor: 'bg-amber-500/5',
    textColor: 'text-amber-300',
    features: [
      { label: 'Property details & description', included: true },
      { label: 'Professional photography (unlimited)', included: true },
      { label: 'Drone / aerial stills', included: true },
      { label: 'Floor plan upload', included: true },
      { label: 'Unit listing & availability', included: true },
      { label: 'Booking & inquiry forms', included: true },
      { label: 'Cinematic video tour', included: false },
      { label: 'Interactive 3D model', included: false },
      { label: 'Immersive VR experience', included: false },
      { label: 'Digital twin', included: false },
    ],
  },
  {
    id: 'photography_video',
    name: 'Photo + Video',
    tagline: 'Add cinematic video to your listing',
    icon: Video,
    price: 1_800,
    monthlyFee: 99,
    color: 'emerald',
    borderColor: 'border-emerald-500/20',
    bgColor: 'bg-emerald-500/5',
    textColor: 'text-emerald-300',
    features: [
      { label: 'Everything in Photography', included: true },
      { label: 'Cinematic property video (3–5 min)', included: true },
      { label: 'Drone video walkthrough', included: true },
      { label: 'Social media cut-downs', included: true },
      { label: 'Interactive 3D model', included: false },
      { label: 'Immersive VR experience', included: false },
      { label: 'Digital twin', included: false },
    ],
  },
  {
    id: 'tour_3d',
    name: '3D Tour',
    tagline: 'Interactive 3D model buyers can explore',
    icon: Box,
    price: 3_500,
    monthlyFee: 149,
    color: 'brand',
    borderColor: 'border-brand-500/25',
    bgColor: 'bg-brand-500/8',
    textColor: 'text-brand-300',
    popular: true,
    features: [
      { label: 'Everything in Photo + Video', included: true },
      { label: 'Interactive 3D property model', included: true },
      { label: 'Aerial · Ground · Rooftop views', included: true },
      { label: 'Amenities 3D walkthrough', included: true },
      { label: 'Unit type 3D tours', included: true },
      { label: 'Embed on your own website', included: true },
      { label: 'Immersive VR experience', included: false },
      { label: 'Digital twin', included: false },
    ],
  },
  {
    id: 'tour_vr',
    name: 'VR Tour',
    tagline: '360° immersive virtual reality experience',
    icon: Headset,
    price: 6_500,
    monthlyFee: 199,
    color: 'violet',
    borderColor: 'border-violet-500/25',
    bgColor: 'bg-violet-500/8',
    textColor: 'text-violet-300',
    features: [
      { label: 'Everything in 3D Tour', included: true },
      { label: '360° VR panorama capture', included: true },
      { label: 'Headset-compatible experience', included: true },
      { label: 'All sections: views, amenities, units', included: true },
      { label: 'Auto-play walkthrough mode', included: true },
      { label: 'Digital twin', included: false },
    ],
  },
  {
    id: 'full_production',
    name: 'Full Production',
    tagline: 'The complete e-resi digital property experience',
    icon: Layers,
    price: 12_000,
    monthlyFee: 299,
    color: 'gold',
    borderColor: 'border-gold-500/30',
    bgColor: 'bg-gold-500/8',
    textColor: 'text-gold-300',
    features: [
      { label: 'Everything in VR Tour', included: true },
      { label: 'Live digital twin', included: true },
      { label: 'Real-time construction updates', included: true },
      { label: 'Priority listing placement', included: true },
      { label: 'Dedicated e-resi account manager', included: true },
      { label: 'Analytics dashboard (advanced)', included: true },
      { label: 'API access for CRM integration', included: true },
    ],
  },
];

// ── Tier card ─────────────────────────────────────────────────────────────────

function TierCard({
  tier, selected, onSelect,
}: { tier: TierDefinition; selected: boolean; onSelect: () => void }) {
  const Icon = tier.icon;

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'relative w-full rounded-2xl border p-5 text-left transition-all duration-200 cursor-pointer',
        selected
          ? `${tier.borderColor} ${tier.bgColor} ring-1 ring-inset ring-white/10`
          : 'border-white/5 bg-surface-800 hover:border-white/10',
      )}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-[10px] font-semibold text-white uppercase tracking-wide">
          <Sparkles size={9} /> Most Popular
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', selected ? tier.bgColor : 'bg-white/5')}>
          <Icon size={18} className={selected ? tier.textColor : 'text-white/30'} />
        </div>
        {selected && (
          <div className={cn('flex h-6 w-6 items-center justify-center rounded-full', tier.bgColor)}>
            <Check size={13} className={tier.textColor} />
          </div>
        )}
      </div>

      <h3 className={cn('font-semibold text-sm mb-0.5', selected ? 'text-white' : 'text-white/70')}>{tier.name}</h3>
      <p className="text-xs text-white/35 mb-4 leading-relaxed">{tier.tagline}</p>

      {/* Pricing */}
      <div className="space-y-1">
        {tier.price > 0 ? (
          <p className={cn('text-base font-bold', selected ? tier.textColor : 'text-white/50')}>
            ${tier.price.toLocaleString()}
            <span className="text-xs font-normal text-white/30 ml-1">production</span>
          </p>
        ) : (
          <p className={cn('text-base font-bold', selected ? tier.textColor : 'text-white/50')}>Free setup</p>
        )}
        <p className="text-xs text-white/30">
          + ${tier.monthlyFee}/mo listing fee
        </p>
      </div>
    </motion.button>
  );
}

// ── Feature comparison table ───────────────────────────────────────────────────

function FeatureList({ tier }: { tier: TierDefinition }) {
  return (
    <div className="space-y-2">
      {tier.features.map((f) => (
        <div key={f.label} className="flex items-center gap-2.5">
          <div className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
            f.included ? `${tier.bgColor}` : 'bg-white/3',
          )}>
            {f.included
              ? <Check size={9} className={tier.textColor} />
              : <span className="text-white/15 text-[9px]">–</span>}
          </div>
          <span className={cn('text-xs', f.included ? 'text-white/60' : 'text-white/20')}>{f.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function NewPropertyPage() {
  const [selectedTier, setSelectedTier] = useState<ProductionTier>('tour_3d');
  const [step, setStep] = useState<'tier' | 'details'>('tier');

  const tier = tiers.find((t) => t.id === selectedTier)!;
  const TierIcon = tier.icon;

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Create a New Listing</h1>
        <p className="text-sm text-white/40 mt-1">Choose how you want e-resi to present your development to buyers.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {(['tier', 'details'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
              step === s
                ? 'bg-brand-500 text-white'
                : i < (['tier', 'details'].indexOf(step))
                  ? 'bg-brand-900/50 text-brand-400 border border-brand-500/30'
                  : 'bg-white/5 text-white/30 border border-white/10',
            )}>
              {i + 1}
            </div>
            <span className={cn('text-sm', step === s ? 'text-white font-medium' : 'text-white/30')}>
              {s === 'tier' ? 'Production Package' : 'Property Details'}
            </span>
            {i < 1 && <ChevronRight size={14} className="text-white/20" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'tier' && (
          <motion.div
            key="tier"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Tier grid */}
            <div>
              <h2 className="text-base font-medium text-white mb-1">Select a production package</h2>
              <p className="text-sm text-white/40 mb-5">
                e-resi's production team will handle the entire media capture — photography, video, 3D modelling, and VR filming.
                Choose the experience level that matches your development.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tiers.map((t) => (
                  <TierCard
                    key={t.id}
                    tier={t}
                    selected={selectedTier === t.id}
                    onSelect={() => setSelectedTier(t.id)}
                  />
                ))}
              </div>
            </div>

            {/* Selected tier detail */}
            <div className={cn('rounded-2xl border p-6', tier.borderColor, tier.bgColor)}>
              <div className="flex items-start gap-4 mb-5">
                <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', tier.bgColor, 'border', tier.borderColor)}>
                  <TierIcon size={20} className={tier.textColor} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{tier.name}</h3>
                    {tier.popular && (
                      <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-2 py-0.5 text-[10px] font-medium text-brand-300">Popular</span>
                    )}
                  </div>
                  <p className="text-sm text-white/40 mt-0.5">{tier.tagline}</p>
                </div>
                <div className="ml-auto text-right shrink-0">
                  <p className={cn('text-xl font-bold', tier.textColor)}>
                    {tier.price > 0 ? `$${tier.price.toLocaleString()}` : 'Free'}
                  </p>
                  <p className="text-xs text-white/30">+ ${tier.monthlyFee}/mo</p>
                </div>
              </div>

              <FeatureList tier={tier} />

              {/* Info note */}
              {tier.id !== 'listing_only' && (
                <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/3 p-3">
                  <Info size={13} className="text-white/30 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/40 leading-relaxed">
                    Production is scheduled within 5–10 business days of listing approval.
                    Our team will contact you to coordinate access and capture.
                  </p>
                </div>
              )}
            </div>

            {/* Pricing comparison note */}
            <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-surface-800 p-4">
              <AlertCircle size={15} className="text-white/25 shrink-0 mt-0.5" />
              <p className="text-xs text-white/35 leading-relaxed">
                Production fees are a one-time charge per property for content capture and processing.
                Monthly listing fees keep your property active on the e-resi platform and include analytics, inquiry management, and support.
                All prices are in USD and exclude local taxes.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button size="lg" onClick={() => setStep('details')}>
                Continue with {tier.name}
                <ChevronRight size={16} className="ml-1" />
              </Button>
              <p className="text-sm text-white/30">You can upgrade your package later</p>
            </div>
          </motion.div>
        )}

        {step === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Selected package summary */}
            <div className={cn('flex items-center gap-3 rounded-2xl border p-4', tier.borderColor, tier.bgColor)}>
              <TierIcon size={16} className={tier.textColor} />
              <div>
                <p className="text-sm font-medium text-white">{tier.name} package selected</p>
                <p className="text-xs text-white/40">
                  {tier.price > 0 ? `$${tier.price.toLocaleString()} production + ` : ''}${tier.monthlyFee}/mo
                </p>
              </div>
              <button
                onClick={() => setStep('tier')}
                className="ml-auto text-xs text-white/30 hover:text-white transition-colors cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Property form */}
            <div className="rounded-2xl border border-white/5 bg-surface-800 p-6 space-y-5">
              <h3 className="font-semibold text-white">Property Details</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { label: 'Development Name', placeholder: 'e.g. The Pearl Residences' },
                  { label: 'Developer / Company', placeholder: 'Your company name' },
                  { label: 'Location / Neighbourhood', placeholder: 'e.g. Westlands, Nairobi' },
                  { label: 'Number of Units', placeholder: 'Total units' },
                ].map(({ label, placeholder }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</label>
                    <input
                      type="text"
                      placeholder={placeholder}
                      className="rounded-xl border border-white/5 bg-surface-900 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 focus:outline-none transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Property Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe your development — architecture, vision, target buyers..."
                  className="rounded-xl border border-white/5 bg-surface-900 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Category</label>
                <div className="flex flex-wrap gap-2">
                  {['Residential', 'Commercial', 'Mixed Use', 'Land'].map((cat) => (
                    <button
                      key={cat}
                      className="rounded-xl border border-white/5 bg-surface-900 px-4 py-2 text-sm text-white/50 hover:text-white hover:border-white/15 transition-colors cursor-pointer first-of-type:border-brand-500/40 first-of-type:bg-brand-500/8 first-of-type:text-brand-300"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="rounded-2xl border border-white/5 bg-surface-800 p-6">
              <h3 className="font-semibold text-white mb-4">What happens next</h3>
              <div className="space-y-4">
                {[
                  { step: '1', title: 'Listing review', body: 'Our team reviews your submission within 24 hours.' },
                  { step: '2', title: 'Production scheduling', body: tier.id !== 'listing_only' ? 'We contact you within 48 hours to schedule our production team.' : 'Upload your own photos via the dashboard.' },
                  { step: '3', title: 'Go live', body: 'Your property goes live on e-resi once production is complete and approved.' },
                ].map(({ step: s, title, body }) => (
                  <div key={s} className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white/40">{s}</div>
                    <div>
                      <p className="text-sm font-medium text-white">{title}</p>
                      <p className="text-xs text-white/40 mt-0.5">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setStep('tier')}
                className="text-sm text-white/30 hover:text-white transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <Button size="lg">
                Submit Listing
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
