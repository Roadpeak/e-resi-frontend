'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { staffApi } from '../../../lib/api/staff';
import { authApi } from '../../../lib/api/auth';
import { useAuthStore } from '../../../lib/stores/auth.store';
import { Logo } from '../../../components/brand/Logo';

/**
 * Where a staff invitation lands: the invite email links here with a token.
 * The person sees who invited them and to what, sets a password, and is
 * signed straight into the dashboard — no separate login step.
 */
function StaffInvite() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const setUser = useAuthStore((s) => s.setUser);

  const { data: invite, isLoading, isError, error } = useQuery({
    queryKey: ['staff-invite', token],
    queryFn: () => staffApi.inviteDetails(token),
    enabled: !!token,
    retry: false,
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const accept = useMutation({
    mutationFn: async () => {
      await staffApi.acceptInvite(token, {
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      // Straight into the dashboard: the password they just set is the login.
      return authApi.login({ email: invite!.email, password });
    },
    onSuccess: (res) => {
      setUser(res.user, res.accessToken);
      router.replace('/dashboard');
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const disabled =
    accept.isPending || !firstName.trim() || !lastName.trim() || password.length < 8;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] px-4 py-10 font-google">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <Logo markSize={30} textClassName="text-[#202124] text-[1.35rem]" />

        {!token || isError ? (
          <div className="mt-8 text-center">
            <p className="text-[17px] font-medium text-[#202124]">
              This invitation isn&apos;t valid
            </p>
            <p className="mt-2 text-[14px] text-[#5f6368]">
              {(error as Error | undefined)?.message
                ?? 'The link may have expired or been revoked — ask your employer to send a new one.'}
            </p>
          </div>
        ) : isLoading || !invite ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#1a73e8]" />
          </div>
        ) : (
          <>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#f8f9fa] px-4 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#5f6368]">
                <Building2 size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[14.5px] font-medium text-[#202124]">{invite.company}</p>
                <p className="text-[13px] text-[#5f6368]">
                  invited you to their dashboard · {invite.pages.length} page{invite.pages.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <h1 className="mt-6 text-[22px] font-normal text-[#202124]">Set up your account</h1>
            <p className="mt-1 text-[13.5px] text-[#5f6368]">
              Signing in as <span className="font-medium text-[#202124]">{invite.email}</span>
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="rounded-xl border border-[#dadce0] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#1a73e8]"
              />
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="rounded-xl border border-[#dadce0] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#1a73e8]"
              />
            </div>
            <div className="relative mt-3">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="Choose a password (min 8 characters)"
                className="w-full rounded-xl border border-[#dadce0] px-3.5 py-2.5 pr-11 text-[14px] outline-none focus:border-[#1a73e8]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#80868b]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {formError && <p className="mt-3 text-[13px] text-[#d93025]">{formError}</p>}

            <button
              onClick={() => accept.mutate()}
              disabled={disabled}
              className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1a73e8] py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-60"
            >
              {accept.isPending && <Loader2 size={15} className="animate-spin" />}
              Join {invite.company}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function StaffInvitePage() {
  return (
    <Suspense>
      <StaffInvite />
    </Suspense>
  );
}
