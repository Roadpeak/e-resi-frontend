'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  SUPPORT_CATEGORIES, rememberVisitorToken, supportApi,
  type SupportCategory, type SupportThread,
} from '../../lib/api/support';
import { useAuthStore } from '../../lib/stores/auth.store';
import { cn } from '../../lib/utils';

const input =
  'w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2.5 text-[14px] text-[#202124] outline-none placeholder:text-[#80868b] focus:border-[#1a73e8]';

/**
 * Start a conversation with the e-resi team. Signed-in people only write the
 * message; visitors also leave a name and an email or phone number so the
 * team can answer them.
 */
export function SupportForm({
  onCreated,
  initialCategory,
  compact = false,
}: {
  onCreated: (thread: SupportThread) => void;
  initialCategory?: SupportCategory;
  compact?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const signedIn = !!user;
  const [category, setCategory] = useState<SupportCategory>(initialCategory ?? 'ENQUIRY');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!message.trim()) return setError('Write your message first.');
    if (!signedIn) {
      if (!name.trim()) return setError('Please tell us your name.');
      if (!email.trim() && !phone.trim()) return setError('Leave an email or phone number so we can reply.');
    }
    setBusy(true);
    try {
      const thread = await supportApi.create({
        category,
        subject: subject.trim() || undefined,
        message: message.trim(),
        ...(signedIn ? {} : { name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined }),
        pageUrl: typeof window !== 'undefined' ? window.location.href.slice(0, 500) : undefined,
      });
      if (thread.accessToken) rememberVisitorToken(thread.id, thread.accessToken);
      onCreated(thread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={cn('space-y-3', compact ? 'p-4' : '')}>
      <div>
        <p className="mb-2 text-[12.5px] font-medium text-[#5f6368]">What is it about?</p>
        <div className="flex flex-wrap gap-1.5">
          {SUPPORT_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cn(
                'cursor-pointer rounded-full border px-3 py-1 text-[12.5px] transition-colors',
                category === c.value
                  ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1967d2]'
                  : 'border-[#dadce0] text-[#3c4043] hover:bg-[#f8f9fa]',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {!signedIn && (
        <div className="grid gap-2">
          <input className={input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <input className={input} type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </div>
          <p className="text-[11.5px] text-[#80868b]">Leave at least one so we can get back to you.</p>
        </div>
      )}

      {!compact && (
        <input className={input} placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={140} />
      )}
      <textarea
        className={cn(input, 'min-h-[110px] resize-y')}
        placeholder="How can we help?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={5000}
      />

      {error && <p className="text-[12.5px] text-[#c5221f]">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1a73e8] px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-60"
      >
        {busy && <Loader2 size={15} className="animate-spin" />}
        Send message
      </button>
    </form>
  );
}
