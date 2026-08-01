'use client';

import {
  Checkbox, ChipGroup, Field, FieldGrid, SectionCard, Select, TextInput,
} from './ui';
import { useOnboardingStore } from '../../lib/stores/onboarding.store';

// ── Listing preferences (developer signup step) ──────────────────────────────


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
