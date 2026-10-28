'use client';

import { useState } from 'react';
import { cn } from '../../lib/utils';

/**
 * The account's picture: their photo, or their company logo for developers
 * and agencies, falling back to initials only when there is none (or it
 * fails to load). Logos are fitted inside a white disc so a wide wordmark is
 * not cropped; photos fill the circle.
 */
export function UserAvatar({
  user,
  size = 40,
  className,
}: {
  user: { firstName?: string; lastName?: string; role?: string; profileImageUrl?: string | null; avatarUrl?: string | null };
  size?: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const src = user.profileImageUrl ?? user.avatarUrl ?? null;
  const initials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase() || '?';
  // A developer's picture is a company logo unless they set a personal photo.
  const isLogo = !user.avatarUrl && user.role === 'DEVELOPER';

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold',
        src && !broken ? 'border border-gray-200 bg-white' : 'bg-gray-900 text-white',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onError={() => setBroken(true)}
          className={isLogo ? 'h-full w-full object-contain p-1' : 'h-full w-full object-cover'}
        />
      ) : (
        initials
      )}
    </span>
  );
}
