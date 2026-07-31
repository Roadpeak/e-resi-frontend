'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  SERVICES, SERVICE_CATEGORIES, type ServiceCategory, fmtUsd,
} from '../../lib/onboarding/catalog';
import { useOnboardingStore } from '../../lib/stores/onboarding.store';
import {
  Checkbox, ChipGroup, Field, FieldGrid, FilePicker, SectionCard, Select, TextArea, TextInput,
} from './ui';

// ── Step 4: Development Information ──────────────────────────────────────────

const DEV_TYPES = ['Apartments', 'Townhouses', 'Villas', 'Mixed-use', 'Gated community', 'Commercial', 'Land'];
const CATEGORIES = ['Residential', 'Commercial', 'Mixed-use', 'Holiday / short-stay'];
const STATUSES = ['Off-plan', 'Under construction', 'Nearing completion', 'Completed'];
const UNIT_TYPES = ['Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', '4+ Bedroom', 'Penthouse', 'Duplex', 'Commercial unit'];
const AMENITIES = ['Swimming pool', 'Gym', 'Clubhouse', 'Playground', 'Rooftop terrace', 'Co-working space', 'Backup generator', 'Borehole', 'Elevator', 'Landscaped gardens'];
const SECURITY = ['24/7 guards', 'CCTV', 'Electric fence', 'Access control', 'Intercom', 'Gated compound'];
const UTILITIES = ['Mains water', 'Borehole water', 'Solar hot water', 'Fibre internet', 'Underground power', 'Sewer connection'];
const PAYMENT_PLANS = ['Cash', 'Installments during construction', 'Mortgage', 'Rent-to-own', 'Off-plan deposit + completion'];

export function StepDevelopment() {
  const { development: dev, patchDevelopment: patch } = useOnboardingStore();
  return (
    <div className="grid gap-6">
      <SectionCard title="General information">
        <FieldGrid>
          <Field label="Development name" required>
            <TextInput value={dev.name} onChange={(e) => patch({ name: e.target.value })} placeholder="The Pearl Residences" />
          </Field>
          <Field label="Development type" required>
            <Select options={DEV_TYPES} value={dev.type} onChange={(e) => patch({ type: e.target.value })} />
          </Field>
          <Field label="Category">
            <Select options={CATEGORIES} value={dev.category} onChange={(e) => patch({ category: e.target.value })} />
          </Field>
          <Field label="Status" required>
            <Select options={STATUSES} value={dev.status} onChange={(e) => patch({ status: e.target.value })} />
          </Field>
          <Field label="Expected completion date">
            <TextInput type="month" value={dev.expectedCompletion} onChange={(e) => patch({ expectedCompletion: e.target.value })} />
          </Field>
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Location">
        <FieldGrid>
          <Field label="Country" required>
            <TextInput value={dev.country} onChange={(e) => patch({ country: e.target.value })} />
          </Field>
          <Field label="County / state" required>
            <TextInput value={dev.county} onChange={(e) => patch({ county: e.target.value })} placeholder="Nairobi County" />
          </Field>
          <Field label="City" required>
            <TextInput value={dev.city} onChange={(e) => patch({ city: e.target.value })} />
          </Field>
          <Field label="Area / neighbourhood" required>
            <TextInput value={dev.area} onChange={(e) => patch({ area: e.target.value })} placeholder="Westlands" />
          </Field>
          <Field label="Google Maps pin" hint="Paste a share link">
            <TextInput type="url" value={dev.mapsPin} onChange={(e) => patch({ mapsPin: e.target.value })} placeholder="https://maps.app.goo.gl/…" />
          </Field>
          <Field label="GPS coordinates" hint="lat, lng — optional">
            <TextInput value={dev.gpsCoordinates} onChange={(e) => patch({ gpsCoordinates: e.target.value })} placeholder="-1.2673, 36.8065" />
          </Field>
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Property information">
        <FieldGrid cols={3}>
          <Field label="Number of units" required>
            <TextInput type="number" min={1} value={dev.numberOfUnits} onChange={(e) => patch({ numberOfUnits: e.target.value })} />
          </Field>
          <Field label="Bedrooms" hint="e.g. 1 – 4">
            <TextInput value={dev.bedrooms} onChange={(e) => patch({ bedrooms: e.target.value })} />
          </Field>
          <Field label="Bathrooms">
            <TextInput value={dev.bathrooms} onChange={(e) => patch({ bathrooms: e.target.value })} />
          </Field>
        </FieldGrid>
        <Field label="Unit types">
          <ChipGroup options={UNIT_TYPES} value={dev.unitTypes} onChange={(unitTypes) => patch({ unitTypes })} />
        </Field>
        <Field label="Parking" hint="e.g. 2 slots per unit + visitor parking">
          <TextInput value={dev.parking} onChange={(e) => patch({ parking: e.target.value })} />
        </Field>
        <Field label="Amenities">
          <ChipGroup options={AMENITIES} value={dev.amenities} onChange={(amenities) => patch({ amenities })} />
        </Field>
        <Field label="Security features">
          <ChipGroup options={SECURITY} value={dev.securityFeatures} onChange={(securityFeatures) => patch({ securityFeatures })} />
        </Field>
        <Field label="Utilities">
          <ChipGroup options={UTILITIES} value={dev.utilities} onChange={(utilities) => patch({ utilities })} />
        </Field>
      </SectionCard>

      <SectionCard title="Pricing">
        <FieldGrid>
          <Field label="Starting price" required hint="Lowest unit price">
            <TextInput value={dev.startingPrice} onChange={(e) => patch({ startingPrice: e.target.value })} placeholder="KES 8,500,000" />
          </Field>
          <Field label="Price range">
            <TextInput value={dev.priceRange} onChange={(e) => patch({ priceRange: e.target.value })} placeholder="KES 8.5M – 24M" />
          </Field>
        </FieldGrid>
        <Field label="Payment plans">
          <ChipGroup options={PAYMENT_PLANS} value={dev.paymentPlans} onChange={(paymentPlans) => patch({ paymentPlans })} />
        </Field>
        <Field label="Mortgage options" hint="Partner banks, financing notes">
          <TextInput value={dev.mortgageOptions} onChange={(e) => patch({ mortgageOptions: e.target.value })} />
        </Field>
      </SectionCard>

      <SectionCard title="Description">
        <Field label="Short description" hint="Shown in search results — max 160 characters">
          <TextInput maxLength={160} value={dev.shortDescription} onChange={(e) => patch({ shortDescription: e.target.value })} />
        </Field>
        <Field label="Full marketing description">
          <TextArea rows={6} value={dev.fullDescription} onChange={(e) => patch({ fullDescription: e.target.value })} placeholder="Tell the full story of the development — location advantages, finishes, lifestyle…" />
        </Field>
      </SectionCard>
    </div>
  );
}

// ── Step 5: Media & Marketing Services ───────────────────────────────────────

const UPLOAD_KINDS = [
  { key: 'images', label: 'Images', hint: 'Up to 40 photos, JPG/PNG, max 15 MB each', accept: 'image/*' },
  { key: 'videos', label: 'Videos', hint: 'Up to 5 videos, MP4/MOV, max 2 GB each', accept: 'video/*' },
  { key: 'floorPlans', label: 'Floor plans', hint: 'Up to 15 files, PDF or image', accept: '.pdf,image/*' },
  { key: 'brochures', label: 'Brochures', hint: 'Up to 5 PDFs, max 50 MB each', accept: '.pdf' },
  { key: 'pdfs', label: 'Other PDFs', hint: 'Price lists, spec sheets — up to 10 files', accept: '.pdf' },
  { key: 'logos', label: 'Logos', hint: 'Development logo & lockups, PNG/SVG', accept: 'image/*' },
];

export function StepServices() {
  const { media, patchMedia, toggleService, patchService } = useOnboardingStore();
  const categories = Object.keys(SERVICE_CATEGORIES) as ServiceCategory[];

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Your media"
        subtitle="Already have professional media for this development? Upload it here."
      >
        <Checkbox
          checked={media.hasOwnMedia}
          onChange={(hasOwnMedia) => patchMedia({ hasOwnMedia })}
          label="I already have professional media"
          sublabel="Tick to upload your own images, videos, floor plans, brochures and logos"
        />
        <AnimatePresence initial={false}>
          {media.hasOwnMedia && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="grid gap-5 sm:grid-cols-2 pt-2">
                {UPLOAD_KINDS.map((kind) => (
                  <Field key={kind.key} label={kind.label} hint={kind.hint}>
                    <FilePicker
                      multiple
                      accept={kind.accept}
                      value={(media.uploads[kind.key] ?? []).join(', ')}
                      onChange={(names) =>
                        patchMedia({
                          uploads: { ...media.uploads, [kind.key]: names ? names.split(', ') : [] },
                        })
                      }
                    />
                  </Field>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      <SectionCard
        title="Production services"
        subtitle="Pick exactly the services you need — pricing is calculated per service, no bundles."
      >
        <div className="grid gap-8">
          {categories.map((cat) => (
            <div key={cat}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                {SERVICE_CATEGORIES[cat]}
              </h4>
              <div className="grid gap-3">
                {SERVICES.filter((s) => s.category === cat).map((service) => {
                  const selection = media.services[service.id];
                  const selected = Boolean(selection);
                  return (
                    <div
                      key={service.id}
                      className={
                        selected
                          ? 'rounded-xl border border-[#4A80F5]/50 bg-[#F6F9FF] p-4 transition-colors'
                          : 'rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300'
                      }
                    >
                      <div className="flex items-start justify-between gap-4">
                        <Checkbox
                          checked={selected}
                          onChange={() => toggleService(service.id)}
                          label={service.label}
                          sublabel={service.description}
                        />
                        <span className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums">
                          {fmtUsd(service.price)}
                        </span>
                      </div>
                      <AnimatePresence initial={false}>
                        {selected && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 grid gap-4 border-t border-[#4A80F5]/15 pt-4 sm:grid-cols-3">
                              <Field label="Preferred date">
                                <TextInput
                                  type="date"
                                  value={selection?.preferredDate ?? ''}
                                  onChange={(e) => patchService(service.id, { preferredDate: e.target.value })}
                                />
                              </Field>
                              <Field label="Special instructions">
                                <TextInput
                                  value={selection?.instructions ?? ''}
                                  onChange={(e) => patchService(service.id, { instructions: e.target.value })}
                                  placeholder="Anything the crew should know"
                                />
                              </Field>
                              <Field label="Property access info">
                                <TextInput
                                  value={selection?.accessInfo ?? ''}
                                  onChange={(e) => patchService(service.id, { accessInfo: e.target.value })}
                                  placeholder="Gate contact, key location…"
                                />
                              </Field>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ── Step 6: Listing Preferences ──────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LEAD_CHANNELS = [
  { id: 'email', label: 'Email', sublabel: 'Leads sent to your primary contact email' },
  { id: 'whatsapp', label: 'WhatsApp', sublabel: 'Instant lead alerts on WhatsApp' },
  { id: 'platform', label: 'Platform messaging', sublabel: 'Manage conversations inside your e-resi dashboard' },
];

export function StepPreferences() {
  const { preferences: prefs, patchPreferences: patch } = useOnboardingStore();
  const toggleChannel = (id: string) =>
    patch({
      leadChannels: prefs.leadChannels.includes(id)
        ? prefs.leadChannels.filter((c) => c !== id)
        : [...prefs.leadChannels, id],
    });

  return (
    <div className="grid gap-6">
      <SectionCard title="Visibility" subtitle="Who can see this development on e-resi?">
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            { id: 'public', label: 'Public', body: 'Visible to everyone, indexed in search' },
            { id: 'private', label: 'Private', body: 'Only people with the direct link' },
            { id: 'invite_only', label: 'Invite only', body: 'You approve each viewer' },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => patch({ visibility: opt.id })}
              className={
                prefs.visibility === opt.id
                  ? 'rounded-xl border border-[#4A80F5] bg-[#F6F9FF] p-4 text-left'
                  : 'rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-gray-300'
              }
            >
              <span className="block text-sm font-semibold text-gray-900">{opt.label}</span>
              <span className="mt-1 block text-xs text-gray-500">{opt.body}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Lead preferences" subtitle="Where should buyer inquiries go?">
        <div className="grid gap-4">
          {LEAD_CHANNELS.map((ch) => (
            <Checkbox
              key={ch.id}
              checked={prefs.leadChannels.includes(ch.id)}
              onChange={() => toggleChannel(ch.id)}
              label={ch.label}
              sublabel={ch.sublabel}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Appointments & viewings">
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { id: 'platform_managed', label: 'Platform managed', body: 'Buyers book slots; e-resi confirms and reminds both sides' },
            { id: 'self_managed', label: 'Self-managed', body: 'You arrange viewings directly with each lead' },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => patch({ appointments: opt.id })}
              className={
                prefs.appointments === opt.id
                  ? 'rounded-xl border border-[#4A80F5] bg-[#F6F9FF] p-4 text-left'
                  : 'rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-gray-300'
              }
            >
              <span className="block text-sm font-semibold text-gray-900">{opt.label}</span>
              <span className="mt-1 block text-xs text-gray-500">{opt.body}</span>
            </button>
          ))}
        </div>

        <Field label="Working days">
          <ChipGroup options={DAYS} value={prefs.workingDays} onChange={(workingDays) => patch({ workingDays })} />
        </Field>
        <FieldGrid cols={3}>
          <Field label="Working hours — from">
            <TextInput type="time" value={prefs.workingHoursStart} onChange={(e) => patch({ workingHoursStart: e.target.value })} />
          </Field>
          <Field label="Working hours — to">
            <TextInput type="time" value={prefs.workingHoursEnd} onChange={(e) => patch({ workingHoursEnd: e.target.value })} />
          </Field>
          <Field label="Booking buffer" hint="Minutes between viewings">
            <Select
              options={['0', '15', '30', '45', '60']}
              value={prefs.bookingBufferMinutes}
              onChange={(e) => patch({ bookingBufferMinutes: e.target.value })}
            />
          </Field>
        </FieldGrid>
        <Checkbox
          checked={prefs.openHouse}
          onChange={(openHouse) => patch({ openHouse })}
          label="Host open house events"
          sublabel="Allow e-resi to schedule group viewing days for this development"
        />
      </SectionCard>
    </div>
  );
}
