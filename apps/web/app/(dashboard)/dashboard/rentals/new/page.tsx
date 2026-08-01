'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Film, Box, Plus, Minus, Upload,
  Home, Check, Info, ImageIcon, Video,
} from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/Button';
import { useMyProperties } from '../../../../../lib/api/queries';
import type { FurnishingType, CinematicSceneCategory } from '../../../../../lib/types';

type Step = 'property' | 'units' | 'media' | 'tours' | 'review';

const STEPS: { id: Step; label: string }[] = [
  { id: 'property', label: 'Property Details' },
  { id: 'units', label: 'Unit Types' },
  { id: 'media', label: 'Photos & Videos' },
  { id: 'tours', label: 'Tour Options' },
  { id: 'review', label: 'Review & Publish' },
];

const FURNISHING_OPTIONS: { value: FurnishingType; label: string; desc: string }[] = [
  { value: 'furnished', label: 'Furnished', desc: 'Full furniture, appliances & fittings included' },
  { value: 'semi_furnished', label: 'Semi-Furnished', desc: 'Basic fixtures & fittings, no loose furniture' },
  { value: 'unfurnished', label: 'Unfurnished', desc: 'Shell & core — tenant furnishes everything' },
];

const SCENE_CATEGORY_LABELS: Record<CinematicSceneCategory, string> = {
  full_tour: 'Full Tour', aerial: 'Aerial', exterior: 'Exterior',
  living_room: 'Living Room', kitchen: 'Kitchen', bedroom: 'Bedroom',
  bathroom: 'Bathroom', amenities: 'Amenities', unit_type: 'Unit Types',
};

interface DraftUnit {
  id: string;
  label: string;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  pricePerMonth: number;
  available: number;
  total: number;
  furnishing: FurnishingType;
}

function newUnit(): DraftUnit {
  return { id: crypto.randomUUID(), label: '', bedrooms: 1, bathrooms: 1, sqm: 60, pricePerMonth: 80_000, available: 1, total: 5, furnishing: 'semi_furnished' };
}

export default function NewRentalPage() {
  const { data: propertiesData } = useMyProperties({ limit: 50 });
  const liveProperties = propertiesData?.items ?? [];

  const [step, setStep] = useState<Step>('property');
  const [linkedPropertyId, setLinkedPropertyId] = useState<string>('');
  const [furnishing, setFurnishing] = useState<FurnishingType>('semi_furnished');
  const [units, setUnits] = useState<DraftUnit[]>([newUnit()]);
  const [show3DTour, setShow3DTour] = useState(false);
  const [showCinematicTour, setShowCinematicTour] = useState(false);
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);
  const [minLease, setMinLease] = useState(12);
  const [submitted, setSubmitted] = useState(false);

  const linkedProperty = liveProperties.find((p) => p.id === linkedPropertyId);
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const addUnit = () => setUnits((u) => [...u, newUnit()]);
  const removeUnit = (id: string) => setUnits((u) => u.filter((x) => x.id !== id));
  const updateUnit = (id: string, key: keyof DraftUnit, value: unknown) =>
    setUnits((u) => u.map((x) => x.id === id ? { ...x, [key]: value } : x));

  const toggleScene = (id: string) =>
    setSelectedSceneIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const goTo = (s: Step) => setStep(s);

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 border border-green-200 mx-auto mb-6">
          <Check size={28} className="text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Rental listing submitted</h2>
        <p className="text-gray-500 text-sm mb-8">Your listing is under review and will go live within 24 hours.</p>
        <div className="flex items-center justify-center gap-3">
          <Button href="/dashboard/rentals">View My Rentals</Button>
          <button onClick={() => { setSubmitted(false); setStep('property'); }} className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
            Create another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Create a Rental Listing</h1>
        <p className="text-sm text-gray-500 mt-1">List individual unit types available for rent within your development.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => i < stepIndex && goTo(s.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all',
                step === s.id
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : i < stepIndex
                    ? 'text-gray-600 hover:text-gray-900 cursor-pointer'
                    : 'text-gray-400 cursor-default',
              )}
            >
              <span className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0',
                step === s.id ? 'bg-brand-500 text-white' : i < stepIndex ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-400',
              )}>
                {i < stepIndex ? <Check size={10} /> : i + 1}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && <ChevronRight size={12} className="text-gray-300 shrink-0" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Property Details ── */}
        {step === 'property' && (
          <motion.div key="property" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-6">

            {/* Link to existing property */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Link to a Development</h3>
              <p className="text-xs text-gray-500">If this rental is part of a e-resi-listed development, link it to inherit the property's tour assets.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* No link option */}
                <button
                  onClick={() => setLinkedPropertyId('')}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all cursor-pointer',
                    linkedPropertyId === '' ? 'border-brand-300 bg-brand-50' : 'border-gray-200 bg-white hover:border-gray-300',
                  )}
                >
                  <p className={cn('text-sm font-medium', linkedPropertyId === '' ? 'text-brand-700' : 'text-gray-600')}>Standalone listing</p>
                  <p className="text-xs text-gray-400 mt-0.5">Upload your own media</p>
                </button>
                {liveProperties.filter((p) => p.has3DTour || p.hasCinematicTour).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setLinkedPropertyId(p.id);
                      setShow3DTour(p.has3DTour);
                      setShowCinematicTour(p.hasCinematicTour);
                    }}
                    className={cn(
                      'rounded-xl border p-4 text-left transition-all cursor-pointer',
                      linkedPropertyId === p.id ? 'border-brand-300 bg-brand-50' : 'border-gray-200 bg-white hover:border-gray-300',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn('text-sm font-medium truncate', linkedPropertyId === p.id ? 'text-brand-700' : 'text-gray-600')}>{p.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.has3DTour && <span className="text-[9px] bg-brand-50 text-brand-700 border border-brand-200 px-1.5 py-0.5 rounded-full">3D</span>}
                      {p.hasCinematicTour && <span className="text-[9px] bg-warm-50 text-warm-700 border border-warm-200 px-1.5 py-0.5 rounded-full">Cinematic</span>}
                      <span className="text-[9px] text-gray-400">{p.address.neighborhood}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic details */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Listing Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Listing Title', placeholder: 'e.g. The Pearl Residences — Rentals' },
                  { label: 'Developer / Landlord', placeholder: 'Your company name' },
                  { label: 'Neighbourhood', placeholder: 'e.g. Westlands' },
                  { label: 'City', placeholder: 'e.g. Nairobi' },
                ].map(({ label, placeholder }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</label>
                    <input type="text" placeholder={placeholder} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none transition-colors" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</label>
                <textarea rows={3} placeholder="Describe the development, location, building amenities..." className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none transition-colors resize-none" />
              </div>

              {/* Furnishing default */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">Default Furnishing</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {FURNISHING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFurnishing(opt.value)}
                      className={cn(
                        'rounded-xl border p-3 text-left transition-all cursor-pointer',
                        furnishing === opt.value ? 'border-brand-300 bg-brand-50' : 'border-gray-200 bg-white hover:border-gray-300',
                      )}
                    >
                      <p className={cn('text-sm font-medium', furnishing === opt.value ? 'text-brand-700' : 'text-gray-600')}>{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lease terms */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Available From</label>
                  <input type="date" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Min Lease (months)</label>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-2.5">
                    <button onClick={() => setMinLease(Math.max(1, minLease - 1))} className="text-gray-500 hover:text-gray-900 cursor-pointer"><Minus size={13} /></button>
                    <span className="flex-1 text-center text-sm font-semibold text-gray-900">{minLease}</span>
                    <button onClick={() => setMinLease(minLease + 1)} className="text-gray-500 hover:text-gray-900 cursor-pointer"><Plus size={13} /></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="lg" onClick={() => goTo('units')}>
                Next: Unit Types <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Unit Types ── */}
        {step === 'units' && (
          <motion.div key="units" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Unit Types</h3>
                <p className="text-xs text-gray-500 mt-0.5">Add each type of unit available — e.g. 1 Bedroom, 2 Bedroom, Studio.</p>
              </div>
              <button onClick={addUnit} className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer">
                <Plus size={13} /> Add Unit Type
              </button>
            </div>

            {units.map((unit, idx) => (
              <div key={unit.id} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Unit Type {idx + 1}</p>
                  {units.length > 1 && (
                    <button onClick={() => removeUnit(unit.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors cursor-pointer">Remove</button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Label</label>
                    <input
                      type="text"
                      value={unit.label}
                      onChange={(e) => updateUnit(unit.id, 'label', e.target.value)}
                      placeholder="e.g. 2 Bedroom"
                      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  {([
                    { key: 'bedrooms', label: 'Beds' },
                    { key: 'bathrooms', label: 'Baths' },
                    { key: 'sqm', label: 'sqm' },
                    { key: 'available', label: 'Available' },
                    { key: 'total', label: 'Total Units' },
                  ] as const).map(({ key, label }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-500 uppercase tracking-wider">{label}</label>
                      <input
                        type="number"
                        value={unit[key]}
                        onChange={(e) => updateUnit(unit.id, key, Number(e.target.value))}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  ))}
                  <div className="col-span-2 sm:col-span-3 flex flex-col gap-1.5">
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Monthly Rent (KES)</label>
                    <input
                      type="number"
                      value={unit.pricePerMonth}
                      onChange={(e) => updateUnit(unit.id, 'pricePerMonth', Number(e.target.value))}
                      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Per-unit furnishing override */}
                <div className="flex items-center gap-2">
                  {FURNISHING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateUnit(unit.id, 'furnishing', opt.value)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs transition-all cursor-pointer',
                        unit.furnishing === opt.value
                          ? 'border-brand-300 bg-brand-50 text-brand-700'
                          : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => goTo('property')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">← Back</button>
              <Button size="lg" onClick={() => goTo('media')}>
                Next: Photos & Videos <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Media ── */}
        {step === 'media' && (
          <motion.div key="media" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-6">

            {/* Photos */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon size={15} className="text-gray-500" />
                <h3 className="font-semibold text-gray-900">Photos</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <ImageIcon size={20} className="text-gray-300" />
                  </div>
                ))}
                <button className="aspect-square rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer">
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-[10px] text-gray-500">Add photos</span>
                </button>
              </div>
              <p className="text-xs text-gray-400">Upload high-resolution photos. First photo will be the hero image.</p>
            </div>

            {/* Videos */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Video size={15} className="text-gray-500" />
                <h3 className="font-semibold text-gray-900">Videos</h3>
              </div>
              <button className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 flex flex-col items-center justify-center gap-2 py-8 transition-all cursor-pointer">
                <Upload size={20} className="text-gray-400" />
                <span className="text-sm text-gray-500">Upload walkthrough video</span>
                <span className="text-xs text-gray-400">MP4, MOV · Max 500MB</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => goTo('units')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">← Back</button>
              <Button size="lg" onClick={() => goTo('tours')}>
                Next: Tour Options <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 4: Tour Options ── */}
        {step === 'tours' && (
          <motion.div key="tours" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-6">

            {!linkedProperty ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 flex items-start gap-3">
                <Info size={15} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-500">Tour options are only available when your rental is linked to a e-resi-listed development with an active 3D or Cinematic Tour subscription. Go back to Step 1 and link your development.</p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
                  <h3 className="font-semibold text-gray-900">Enable Tour Types</h3>
                  <p className="text-xs text-gray-500">These options are available because <span className="text-gray-700">{linkedProperty.name}</span> has an active tour subscription.</p>

                  {/* 3D Tour toggle */}
                  {linkedProperty.has3DTour && (
                    <div className={cn('flex items-start gap-4 rounded-xl border p-4 transition-all', show3DTour ? 'border-brand-300 bg-brand-50' : 'border-gray-200 bg-white')}>
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', show3DTour ? 'bg-brand-100' : 'bg-gray-100')}>
                        <Box size={18} className={show3DTour ? 'text-brand-600' : 'text-gray-400'} />
                      </div>
                      <div className="flex-1">
                        <p className={cn('font-medium text-sm', show3DTour ? 'text-gray-900' : 'text-gray-600')}>3D Interactive Tour</p>
                        <p className="text-xs text-gray-400 mt-0.5">Buyers can rotate, zoom and walk through the interactive 3D model of the property.</p>
                      </div>
                      <button
                        onClick={() => setShow3DTour((v) => !v)}
                        className={cn('relative h-6 w-11 rounded-full transition-colors duration-300 shrink-0 cursor-pointer', show3DTour ? 'bg-brand-500' : 'bg-gray-200')}
                      >
                        <span className={cn('absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300', show3DTour ? 'left-6' : 'left-1')} />
                      </button>
                    </div>
                  )}

                  {/* Cinematic Tour toggle */}
                  {linkedProperty.hasCinematicTour && (
                    <div className={cn('flex items-start gap-4 rounded-xl border p-4 transition-all', showCinematicTour ? 'border-warm-300 bg-warm-50' : 'border-gray-200 bg-white')}>
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', showCinematicTour ? 'bg-warm-100' : 'bg-gray-100')}>
                        <Film size={18} className={showCinematicTour ? 'text-warm-600' : 'text-gray-400'} />
                      </div>
                      <div className="flex-1">
                        <p className={cn('font-medium text-sm', showCinematicTour ? 'text-gray-900' : 'text-gray-600')}>Cinematic Tour</p>
                        <p className="text-xs text-gray-400 mt-0.5">Scroll-driven video tour. Select which scenes to display for this rental listing.</p>
                      </div>
                      <button
                        onClick={() => setShowCinematicTour((v) => !v)}
                        className={cn('relative h-6 w-11 rounded-full transition-colors duration-300 shrink-0 cursor-pointer', showCinematicTour ? 'bg-warm-500' : 'bg-gray-200')}
                      >
                        <span className={cn('absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300', showCinematicTour ? 'left-6' : 'left-1')} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Scene selector */}
                {showCinematicTour && linkedProperty.cinematicScenes && linkedProperty.cinematicScenes.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Select Scenes to Display</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Choose which cinematic scenes are shown to prospective tenants for this rental listing.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {linkedProperty.cinematicScenes.map((scene) => {
                        const active = selectedSceneIds.includes(scene.id);
                        return (
                          <button
                            key={scene.id}
                            onClick={() => toggleScene(scene.id)}
                            className={cn(
                              'flex items-center gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer',
                              active ? 'border-warm-300 bg-warm-50' : 'border-gray-200 bg-white hover:border-gray-300',
                            )}
                          >
                            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', active ? 'bg-warm-100' : 'bg-gray-100')}>
                              <Film size={13} className={active ? 'text-warm-600' : 'text-gray-400'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-xs font-medium truncate', active ? 'text-gray-900' : 'text-gray-600')}>{scene.label}</p>
                              {scene.sublabel && <p className="text-[10px] text-gray-400 truncate">{scene.sublabel}</p>}
                              <p className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">{SCENE_CATEGORY_LABELS[scene.category]}</p>
                            </div>
                            {active && <Check size={13} className="text-warm-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400">{selectedSceneIds.length} of {linkedProperty.cinematicScenes.length} scenes selected</p>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => goTo('media')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">← Back</button>
              <Button size="lg" onClick={() => goTo('review')}>
                Review Listing <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 5: Review ── */}
        {step === 'review' && (
          <motion.div key="review" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
              <h3 className="font-semibold text-gray-900">Listing Summary</h3>

              <div className="space-y-3">
                <Row label="Linked Development" value={linkedProperty?.name ?? 'Standalone'} />
                <Row label="Unit Types" value={`${units.length} type${units.length !== 1 ? 's' : ''}`} />
                <Row label="Furnishing" value={{ furnished: 'Furnished', semi_furnished: 'Semi-Furnished', unfurnished: 'Unfurnished' }[furnishing]} />
                <Row label="Min Lease" value={`${minLease} months`} />
                <Row label="3D Tour" value={show3DTour ? 'Enabled' : 'Off'} />
                <Row label="Cinematic Tour" value={showCinematicTour ? `${selectedSceneIds.length} scenes` : 'Off'} />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Unit Types</h3>
              <div className="space-y-2">
                {units.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                    <div>
                      <p className="text-sm text-gray-900">{u.label || `Unit Type`}</p>
                      <p className="text-xs text-gray-400">{u.bedrooms}bed · {u.sqm}m² · {u.available} available</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">KES {u.pricePerMonth.toLocaleString()}/mo</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => goTo('tours')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">← Back</button>
              <Button size="lg" onClick={() => setSubmitted(true)}>
                <Home size={15} className="mr-2" /> Publish Rental Listing
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-900">{value}</span>
    </div>
  );
}
