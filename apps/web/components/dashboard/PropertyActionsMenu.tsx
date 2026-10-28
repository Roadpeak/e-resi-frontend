'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Archive, ChevronDown, ExternalLink, Loader2, MoreHorizontal, Receipt, RotateCcw, Trash2,
} from 'lucide-react';
import { apiClient, ApiError } from '../../lib/api/client';
import { PROPERTY_SECTIONS, isPublicStatus, sectionHref } from './propertySections';

interface MenuProperty {
  slug: string;
  name: string;
  status: string;
}

const MENU_WIDTH = 248;

/**
 * Every action for one development.
 *
 * Rendered in a portal with fixed positioning: inside the properties table
 * (overflow-x-auto) an absolutely-positioned menu was clipped by the scroll
 * container and opened invisibly behind the page.
 */
export function PropertyActionsMenu({
  property,
  variant = 'icon',
  onError,
}: {
  property: MenuProperty;
  variant?: 'icon' | 'button';
  onError?: (message: string) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const place = () => {
    const t = triggerRef.current?.getBoundingClientRect();
    if (!t) return;
    const height = menuRef.current?.offsetHeight ?? 460;
    const below = window.innerHeight - t.bottom;
    const top = below < height + 12 && t.top > below ? Math.max(8, t.top - height - 6) : t.bottom + 6;
    const left = Math.min(Math.max(8, t.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onMove = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dash-property', property.slug] }),
      queryClient.invalidateQueries({ queryKey: ['dash-property-archived', property.slug] }),
      queryClient.invalidateQueries({ queryKey: ['my-properties'] }),
    ]);
  };

  async function setStatus(status: 'ARCHIVED' | 'DRAFT') {
    if (status === 'ARCHIVED' && !window.confirm(
      `Archive "${property.name}"?\n\nIt is hidden from buyers and stops its listing fee. You can restore it later.`,
    )) return;
    setOpen(false);
    setBusy(true);
    try {
      await apiClient.patch(`/properties/${property.slug}/status`, { status });
      await refresh();
      if (status === 'ARCHIVED') router.push('/dashboard/properties');
    } catch (e) {
      onError?.(e instanceof ApiError ? e.message : 'Could not change the status.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(
      `Permanently delete "${property.name}"?\n\nThis removes the listing, its media, units and floor plans for good. It cannot be undone.`,
    )) return;
    setOpen(false);
    setBusy(true);
    try {
      await apiClient.delete(`/properties/${property.slug}/permanent`);
      await queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      router.push('/dashboard/properties');
    } catch (e) {
      onError?.(e instanceof ApiError ? e.message : 'Could not delete this development.');
    } finally {
      setBusy(false);
    }
  }

  const itemCls = 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] text-[#3c4043] transition-colors hover:bg-[#f1f3f4] hover:text-[#202124] cursor-pointer';
  const archived = property.status === 'ARCHIVED';
  const canDelete = property.status === 'DRAFT' || archived;

  return (
    <>
      {variant === 'icon' ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Actions for ${property.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4] hover:text-[#202124] cursor-pointer"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <MoreHorizontal size={16} />}
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-[15px] font-medium text-[#3c4043] transition-colors hover:bg-[#f1f3f4] cursor-pointer"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <MoreHorizontal size={15} />}
          Manage <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
      )}

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: MENU_WIDTH }}
          className="fixed z-[1000] max-h-[calc(100vh-16px)] overflow-y-auto rounded-2xl border border-[#dadce0] bg-white py-1.5 shadow-[0_8px_28px_rgba(32,33,36,0.18)]"
        >
          <p className="truncate px-4 pb-1.5 pt-1 text-[12px] font-medium text-[#80868b]">{property.name}</p>
          {PROPERTY_SECTIONS.map((s) => (
            <Link key={s.key} href={sectionHref(property.slug, s)} onClick={() => setOpen(false)} className={itemCls} role="menuitem">
              <s.icon size={16} className="shrink-0 text-[#5f6368]" /> {s.label}
            </Link>
          ))}
          {isPublicStatus(property.status) && (
            <a href={`/${property.slug}`} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className={itemCls} role="menuitem">
              <ExternalLink size={16} className="shrink-0 text-[#5f6368]" /> View live page
            </a>
          )}
          <Link href="/dashboard/billing" onClick={() => setOpen(false)} className={itemCls} role="menuitem">
            <Receipt size={16} className="shrink-0 text-[#5f6368]" /> Billing
          </Link>
          <div className="my-1.5 border-t border-[#e8eaed]" />
          {archived ? (
            <button type="button" onClick={() => setStatus('DRAFT')} className={itemCls} role="menuitem">
              <RotateCcw size={16} className="shrink-0 text-[#5f6368]" /> Restore to review
            </button>
          ) : (
            <button type="button" onClick={() => setStatus('ARCHIVED')} className={`${itemCls} !text-[#c5221f] hover:!bg-[#fef7f6]`} role="menuitem">
              <Archive size={16} className="shrink-0" /> Archive
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={remove} className={`${itemCls} !text-[#c5221f] hover:!bg-[#fef7f6]`} role="menuitem">
              <Trash2 size={16} className="shrink-0" /> Delete permanently
            </button>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
