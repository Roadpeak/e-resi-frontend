'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  SERVICES, SERVICE_CATEGORIES, type ServiceCategory, fmtUsd, LISTING_CURRENCIES,
} from '../../lib/onboarding/catalog';
import { useDevelopmentStore } from '../../lib/stores/development.store';
import { DEVELOPMENT_TYPES, findDevelopmentType } from '../../lib/onboarding/development-types';
import {
  Checkbox, ChipGroup, Field, FieldGrid, FilePicker, SectionCard, Select, TextArea, TextInput,
} from '../onboarding/ui';
import { ImageUpload } from '../dashboard/ImageUpload';
import { DetectLocationButton } from '../dashboard/DetectLocationButton';

// ── Development creation · Step 1: Development details ───────────────────────

const CATEGORIES = ['Residential', 'Commercial', 'Mixed-use', 'Holiday / short-stay'];
const STATUSES = ['Off-plan', 'Under construction', 'Nearing completion', 'Completed'];
const AMENITIES = ['Swimming pool', 'Gym', 'Clubhouse', 'Playground', 'Rooftop terrace', 'Co-working space', 'Backup generator', 'Borehole', 'Elevator', 'Landscaped gardens'];
const LAND_FEATURES = ['Title deed ready', 'Perimeter wall', 'Graded access road', 'Water connection', 'Power connection', 'Subdivided plots'];
const SECURITY = ['24/7 guards', 'CCTV', 'Electric fence', 'Access control', 'Intercom', 'Gated compound'];
const UTILITIES = ['Mains water', 'Borehole water', 'Solar hot water', 'Fibre internet', 'Underground power', 'Sewer connection'];
const PAYMENT_PLANS = ['Cash', 'Installments during construction', 'Mortgage', 'Rent-to-own', 'Off-plan deposit + completion'];

export function StepDevelopment() {
  const { development: dev, patchDevelopment: patch } = useDevelopmentStore();
  const devType = findDevelopmentType(dev.type);

  return (
    <div className="grid gap-6">
      {/* Type first: it decides production pricing, which marketplace pages
          this development appears on, and which fields below are relevant. */}
      <SectionCard title="What are you listing?">
        <p className="-mt-1 mb-3 text-[13px] text-[#5f6368]">
          This sets how your development is priced for production and where buyers find it.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DEVELOPMENT_TYPES.map((t) => {
            const active = dev.type === t.label;
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => {
                  // Unit types are per-type lists; keep only ones still offered.
                  const stillValid = dev.unitTypes.filter((u) => t.unitTypes.includes(u));
                  patch({ type: t.label, unitTypes: stillValid });
                }}
                className={`rounded-2xl border p-3.5 text-left transition-colors cursor-pointer ${
                  active
                    ? 'border-[#1a73e8] bg-[#e8f0fe]'
                    : 'border-[#dadce0] bg-white hover:bg-[#f8f9fa]'
                }`}
              >
                <span className={`block text-[15px] font-medium ${active ? 'text-[#1a73e8]' : 'text-[#202124]'}`}>
                  {t.label}
                </span>
                <span className="mt-0.5 block text-[13px] text-[#5f6368]">{t.hint}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="General information">
        <FieldGrid>
          <Field label="Development name" required>
            <TextInput value={dev.name} onChange={(e) => patch({ name: e.target.value })} placeholder="The Pearl Residences" />
          </Field>
          <Field label="Category">
            <Select options={CATEGORIES} value={dev.category} onChange={(e) => patch({ category: e.target.value })} />
          </Field>
          <Field label="Status" required>
            <Select options={STATUSES} value={dev.status} onChange={(e) => patch({ status: e.target.value })} />
          </Field>
          {/* Land has no build to complete. */}
          {devType?.built !== false && (
            <Field label="Expected completion date">
              <TextInput type="month" value={dev.expectedCompletion} onChange={(e) => patch({ expectedCompletion: e.target.value })} />
            </Field>
          )}
        </FieldGrid>
        <ImageUpload
          value={dev.heroImageUrl}
          onChange={(heroImageUrl) => patch({ heroImageUrl })}
          label="Cover photo"
          hint="The face of this development — shown everywhere it appears"
        />
      </SectionCard>

      <SectionCard title="Location">
        <DetectLocationButton
          className="mb-4"
          onDetected={(loc) => {
            // Only overwrite a field when detection actually produced a value.
            patch({
              gpsCoordinates: `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`,
              ...(loc.neighborhood ? { area: loc.neighborhood } : {}),
              ...(loc.city ? { city: loc.city } : {}),
              ...(loc.county ? { county: loc.county } : {}),
              ...(loc.country ? { country: loc.country } : {}),
            });
          }}
        />
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

      <SectionCard title={devType?.built === false ? 'Plot information' : 'Property information'}>
        <FieldGrid cols={3}>
          <Field label={devType?.unitCountLabel ?? 'Number of units'} required>
            <TextInput type="number" min={1} value={dev.numberOfUnits} onChange={(e) => patch({ numberOfUnits: e.target.value })} />
          </Field>
          {/* Bedroom/bathroom counts only mean something for homes. */}
          {devType?.residential !== false && (
            <>
              <Field label="Bedrooms" hint="e.g. 1 – 4">
                <TextInput value={dev.bedrooms} onChange={(e) => patch({ bedrooms: e.target.value })} />
              </Field>
              <Field label="Bathrooms">
                <TextInput value={dev.bathrooms} onChange={(e) => patch({ bathrooms: e.target.value })} />
              </Field>
            </>
          )}
        </FieldGrid>
        <Field label={devType?.built === false ? 'Plot sizes' : 'Unit types'}>
          <ChipGroup
            options={devType?.unitTypes ?? []}
            value={dev.unitTypes}
            onChange={(unitTypes) => patch({ unitTypes })}
          />
        </Field>
        {devType?.built !== false && (
          <Field label="Parking" hint="e.g. 2 slots per unit + visitor parking">
            <TextInput value={dev.parking} onChange={(e) => patch({ parking: e.target.value })} />
          </Field>
        )}
        <Field label={devType?.built === false ? 'Site features' : 'Amenities'}>
          <ChipGroup
            options={devType?.built === false ? LAND_FEATURES : AMENITIES}
            value={dev.amenities}
            onChange={(amenities) => patch({ amenities })}
          />
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
          <Field
            label="Currency"
            required
            hint="What buyers see on your listing. Your own billing is unaffected."
          >
            <Select
              value={dev.currency}
              onChange={(e) => patch({ currency: e.target.value })}
              options={LISTING_CURRENCIES.map((c) => c.code)}
            />
          </Field>
          <Field label="Starting price" required hint="Lowest unit price">
            <TextInput
              value={dev.startingPrice}
              onChange={(e) => patch({ startingPrice: e.target.value })}
              placeholder={dev.currency === 'USD' ? '65,000' : '8,500,000'}
            />
          </Field>
          <Field label="Price range">
            <TextInput
              value={dev.priceRange}
              onChange={(e) => patch({ priceRange: e.target.value })}
              placeholder={dev.currency === 'USD' ? '65K – 190K' : '8.5M – 24M'}
            />
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

// ── Development creation · Step 2: Media & production services ───────────────

const UPLOAD_KINDS = [
  { key: 'images', label: 'Images', hint: 'Up to 40 photos, JPG/PNG, max 15 MB each', accept: 'image/*' },
  { key: 'videos', label: 'Videos', hint: 'Up to 5 videos, MP4/MOV, max 2 GB each', accept: 'video/*' },
  { key: 'floorPlans', label: 'Floor plans', hint: 'Up to 15 files, PDF or image', accept: '.pdf,image/*' },
  { key: 'brochures', label: 'Brochures', hint: 'Up to 5 PDFs, max 50 MB each', accept: '.pdf' },
  { key: 'pdfs', label: 'Other PDFs', hint: 'Price lists, spec sheets — up to 10 files', accept: '.pdf' },
  { key: 'logos', label: 'Logos', hint: 'Development logo & lockups, PNG/SVG', accept: 'image/*' },
];

export function StepServices() {
  const { development: dev, media, patchMedia, toggleService, patchService } = useDevelopmentStore();
  const categories = Object.keys(SERVICE_CATEGORIES) as ServiceCategory[];
  const devType = findDevelopmentType(dev.type);

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
        subtitle={
          devType
            ? `Pick exactly the services you need — priced for ${devType.label.toLowerCase()}, per service, no bundles.`
            : 'Pick exactly the services you need — pricing is calculated per service, no bundles.'
        }
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
