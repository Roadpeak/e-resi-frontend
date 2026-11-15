import {
  Box, Building2, Camera, Clapperboard, Drone, Film, Glasses, Megaphone, PenTool, Rotate3d, ScanLine, Sparkles, Sunset, Video,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

/** One icon per catalogue service; anything new falls back to its category's icon. */
const BY_KEY: Record<string, LucideIcon> = {
  videography: Video,
  drone_photo: Drone,
  drone_video: Film,
  twilight: Sunset,
  scan_3d: ScanLine,
  vr_tour: Glasses,
  tour_360: Rotate3d,
  walkthrough: Clapperboard,
  cgi: Building2,
};

const BY_CATEGORY: Record<string, LucideIcon> = {
  CAPTURE: Camera,
  IMMERSIVE: Box,
  MARKETING: Megaphone,
  DESIGN: PenTool,
};

/** Tinted circle per category, in the Google palette the rest of the page uses. */
const TINT: Record<string, string> = {
  CAPTURE: 'bg-[#e8f0fe] text-[#1a73e8]',
  IMMERSIVE: 'bg-[#f3e8fd] text-[#8430ce]',
  MARKETING: 'bg-[#fef7e0] text-[#b06000]',
  DESIGN: 'bg-[#e6f4ea] text-[#188038]',
};

export function ServiceIcon({ serviceKey, category, size = 'md', className }: {
  serviceKey: string;
  category: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const Icon = BY_KEY[serviceKey] ?? BY_CATEGORY[category] ?? Sparkles;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        size === 'sm' ? 'h-9 w-9' : 'h-12 w-12',
        TINT[category] ?? 'bg-[#f1f3f4] text-[#3c4043]',
        className,
      )}
    >
      <Icon size={size === 'sm' ? 17 : 22} strokeWidth={1.9} />
    </span>
  );
}
