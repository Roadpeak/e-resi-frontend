'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { authApi } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';
import { cn } from '../../lib/utils';

/**
 * Send-and-enter OTP panel, shared by signup and the login recovery path.
 *
 * Extracted from RegisterForm so an unverified account signing in gets the
 * same flow rather than a second implementation that can drift.
 */
export function VerificationCodePanel({
  email,
  /** Send a code as soon as the panel appears — used when login reveals an
   *  unverified account, where the person did not ask for this step and
   *  should not have to press an extra button to get moving. */
  autoSend = false,
  onVerified,
  title = 'KYC status:',
}: {
  email: string;
  autoSend?: boolean;
  onVerified?: () => void;
  title?: string;
}) {
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSend() {
    setError(null);
    setNotice(null);
    setSending(true);
    try {
      const res = await authApi.sendVerificationCode(email);
      setSent(true);
      setNotice(res.message ?? 'Verification code sent — check your inbox.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send code. Try again.');
    } finally {
      setSending(false);
    }
  }

  // Fires once per email. Guarded on `sent` so a re-render cannot trigger a
  // second send, which would invalidate the code already in the inbox.
  useEffect(() => {
    if (autoSend && email && !sent) void handleSend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend, email]);

  async function handleVerify() {
    setError(null);
    setNotice(null);
    setVerifying(true);
    try {
      await authApi.verifyCode(email, code.trim());
      setVerified(true);
      onVerified?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid or expired verification code');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left mb-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
            verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
          )}
        >
          {verified && <Check size={12} strokeWidth={3} />}
          {verified ? 'Verified' : 'Pending verification'}
        </span>
      </div>

      {verified ? (
        <p className="text-sm text-gray-600">
          Your email is verified. You can now sign in to your account.
        </p>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            loading={sending}
            onClick={handleSend}
          >
            {sent ? 'Resend verification code' : 'Send verification code'}
          </Button>

          <div className="flex items-end gap-2">
            <Input
              label="Verification code"
              placeholder="6-digit code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              wrapperClassName="flex-1"
            />
            <Button
              type="button"
              loading={verifying}
              disabled={code.length !== 6}
              onClick={handleVerify}
            >
              Verify
            </Button>
          </div>

          {notice && <p className="mt-3 text-xs text-emerald-600">{notice}</p>}
          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}
