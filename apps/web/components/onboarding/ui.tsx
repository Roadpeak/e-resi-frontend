'use client';

/**
 * Light-mode form primitives for the developer onboarding flow.
 * The onboarding is deliberately pure light mode — do not add dark: variants.
 */

import { useRef } from 'react';
import { Check, Upload, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

export function FieldGrid({ cols = 2, children }: { cols?: 2 | 3; children: React.ReactNode }) {
  return (
    <div className={cn('grid gap-5', cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3')}>
      {children}
    </div>
  );
}

const inputBase =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A80F5] focus:border-transparent transition-shadow';

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-[#F0594C] ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={cn(inputBase, 'resize-y', props.className)} />;
}

export function Select({
  options,
  placeholder,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[]; placeholder?: string }) {
  return (
    <select {...props} className={cn(inputBase, 'appearance-none', !props.value && 'text-gray-400', props.className)}>
      <option value="" disabled>
        {placeholder ?? 'Select…'}
      </option>
      {options.map((o) => (
        <option key={o} value={o} className="text-gray-900">
          {o}
        </option>
      ))}
    </select>
  );
}

/** Multi-select rendered as toggleable chips. */
export function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(active ? value.filter((v) => v !== o) : [...value, o])}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
              active
                ? 'border-[#4A80F5] bg-[#EAF1FE] text-[#2E5BD7]'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400',
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  sublabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
  sublabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 text-left group"
    >
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
          checked ? 'border-[#4A80F5] bg-[#4A80F5]' : 'border-gray-300 bg-white group-hover:border-gray-400',
        )}
      >
        {checked && <Check size={13} strokeWidth={3} className="text-white" />}
      </span>
      <span>
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        {sublabel && <span className="block text-xs text-gray-500 mt-0.5">{sublabel}</span>}
      </span>
    </button>
  );
}

/** File input that records the chosen file name (binary upload happens on submit). */
export function FilePicker({
  value,
  onChange,
  accept,
  multiple,
}: {
  value: string;
  onChange: (fileName: string) => void;
  accept?: string;
  multiple?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onChange(files.map((f) => f.name).join(', '));
        }}
      />
      {value ? (
        <div className="flex items-center justify-between rounded-xl border border-[#4A80F5]/40 bg-[#EAF1FE] px-3.5 py-2.5">
          <span className="text-sm text-[#2E5BD7] truncate">{value}</span>
          <button type="button" onClick={() => onChange('')} className="text-[#2E5BD7]/60 hover:text-[#2E5BD7] ml-2">
            <X size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3.5 py-3 text-sm text-gray-500 hover:border-[#4A80F5] hover:text-[#4A80F5] transition-colors"
        >
          <Upload size={15} />
          Choose file{multiple ? 's' : ''}
        </button>
      )}
    </div>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full bg-[#4A80F5] px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#3457E0] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none',
        props.className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all',
        props.className,
      )}
    >
      {children}
    </button>
  );
}
