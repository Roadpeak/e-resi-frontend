'use client';

import { useEffect, useState } from 'react';
import { Camera, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '../../../../lib/api/auth';
import { uploadAvatar } from '../../../../lib/api/media';
import { ApiError } from '../../../../lib/api/client';
import { useAuthStore } from '../../../../lib/stores/auth.store';

/**
 * Your own profile in the developer dashboard: photo, name, phone and
 * password. For a team member this is their own account — the company's
 * details live under Company Profile, which only the owner manages.
 */

const field =
  'w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2.5 text-[14.5px] text-[#202124] outline-none transition-colors placeholder:text-[#9aa0a6] focus:border-[#1a73e8]';
const label = 'mb-1.5 block text-[13px] font-medium text-[#5f6368]';

export default function MyProfilePage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [changing, setChanging] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setPhone(user.phone ?? '');
    setPhoto(user.avatarUrl ?? (user.isStaff ? '' : user.profileImageUrl ?? ''));
  }, [user]);

  /** Re-read /auth/me so the header and menus pick up the change (keeps staff flags). */
  async function refreshMe() {
    const me = await authApi.me();
    if (token) setUser(me, token);
  }

  async function onPhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setProfileMsg({ ok: false, text: 'Choose an image file.' });
    if (file.size > 5 * 1024 * 1024) return setProfileMsg({ ok: false, text: 'Photos must be under 5 MB.' });
    setUploading(true);
    setProfileMsg(null);
    try {
      const { url } = await uploadAvatar(file);
      await authApi.updateProfile({ avatarUrl: url });
      setPhoto(url);
      await refreshMe();
      setProfileMsg({ ok: true, text: 'Photo updated.' });
    } catch (e) {
      setProfileMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not upload the photo.' });
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      return setProfileMsg({ ok: false, text: 'First and last name need at least 2 characters.' });
    }
    setSaving(true);
    try {
      await authApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(phone.trim() ? { phone: phone.trim().replace(/\s+/g, '') } : {}),
      });
      await refreshMe();
      setProfileMsg({ ok: true, text: 'Profile saved.' });
    } catch (err) {
      setProfileMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Could not save your profile.' });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (next.length < 8) return setPwMsg({ ok: false, text: 'Your new password needs at least 8 characters.' });
    if (next !== confirm) return setPwMsg({ ok: false, text: 'The new passwords don’t match.' });
    setChanging(true);
    try {
      await authApi.changePassword(current, next);
      setCurrent(''); setNext(''); setConfirm('');
      setPwMsg({ ok: true, text: 'Password changed. Use it next time you sign in.' });
    } catch (err) {
      setPwMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Could not change your password.' });
    } finally {
      setChanging(false);
    }
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const msg = (m: { ok: boolean; text: string } | null) =>
    m && <p className={`rounded-xl px-4 py-2.5 text-[13.5px] ${m.ok ? 'bg-[#e6f4ea] text-[#188038]' : 'bg-[#fce8e6] text-[#c5221f]'}`}>{m.text}</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">My profile</h1>
        <p className="text-[14px] text-[#5f6368]">
          {user?.isStaff
            ? 'Your own details on this team. Your photo shows in the dashboard header for everyone on the team.'
            : 'Your personal details and password. Company details live under Company Profile.'}
        </p>
      </div>

      <section className="rounded-3xl border border-[#dadce0] bg-white p-6">
        <form onSubmit={saveProfile} className="space-y-5">
          <div className="flex flex-wrap items-center gap-5">
            <label className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#e8eaed] ring-2 ring-white shadow-[0_0_0_4px_rgba(26,115,232,0.18)]">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Your profile photo" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[26px] font-medium text-[#5f6368]">{initials || '?'}</span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {uploading ? <Loader2 size={20} className="animate-spin text-white" /> : <Camera size={20} className="text-white" />}
              </span>
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { onPhoto(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            <div>
              <p className="text-[16px] font-medium text-[#202124]">{firstName} {lastName}</p>
              <p className="text-[13.5px] text-[#5f6368]">{user?.email}</p>
              <p className="mt-1 text-[12.5px] text-[#80868b]">Click the photo to change it.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="mp-first">First name</label>
              <input id="mp-first" className={field} value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} />
            </div>
            <div>
              <label className={label} htmlFor="mp-last">Last name</label>
              <input id="mp-last" className={field} value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} />
            </div>
            <div>
              <label className={label} htmlFor="mp-phone">Phone</label>
              <input id="mp-phone" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254712345678" />
            </div>
            <div>
              <label className={label} htmlFor="mp-email">Email</label>
              <input id="mp-email" className={`${field} bg-[#f8f9fa] text-[#5f6368]`} value={user?.email ?? ''} disabled />
            </div>
          </div>

          {msg(profileMsg)}
          <button type="submit" disabled={saving}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-50">
            {saving && <Loader2 size={14} className="animate-spin" />} Save profile
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-[#dadce0] bg-white p-6">
        <h2 className="text-[17px] font-medium text-[#202124]">Password</h2>
        <p className="mt-1 text-[13.5px] text-[#5f6368]">Enter your current password, then choose a new one.</p>
        <form onSubmit={changePassword} className="mt-5 space-y-4">
          <div>
            <label className={label} htmlFor="mp-current">Current password</label>
            <input id="mp-current" type={show ? 'text' : 'password'} className={field} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="mp-new">New password</label>
              <input id="mp-new" type={show ? 'text' : 'password'} className={field} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" />
            </div>
            <div>
              <label className={label} htmlFor="mp-confirm">Confirm new password</label>
              <input id="mp-confirm" type={show ? 'text' : 'password'} className={field} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
          <button type="button" onClick={() => setShow((v) => !v)} className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-[#5f6368] hover:text-[#202124]">
            {show ? <EyeOff size={14} /> : <Eye size={14} />} {show ? 'Hide passwords' : 'Show passwords'}
          </button>
          {msg(pwMsg)}
          <div>
            <button type="submit" disabled={changing || !current || !next || !confirm}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-50">
              {changing && <Loader2 size={14} className="animate-spin" />} Change password
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
