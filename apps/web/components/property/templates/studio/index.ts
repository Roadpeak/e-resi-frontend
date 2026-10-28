import type { ComponentType } from 'react';
import type { StudioTemplateProps } from './blocks';
import { FrameTemplate } from './FrameTemplate';
import { PrestigeTemplate } from './PrestigeTemplate';
import { GalleryTemplate } from './GalleryTemplate';
import { AtelierTemplate } from './AtelierTemplate';
import { HorizonTemplate } from './HorizonTemplate';
import { SkylineTemplate } from './SkylineTemplate';
import { NoirTemplate } from './NoirTemplate';

/** Complete-page templates, keyed by template key. */
export const STUDIO_TEMPLATES: Record<string, ComponentType<StudioTemplateProps>> = {
  FRAME: FrameTemplate,
  PRESTIGE: PrestigeTemplate,
  GALLERY: GalleryTemplate,
  ATELIER: AtelierTemplate,
  HORIZON: HorizonTemplate,
  SKYLINE: SkylineTemplate,
  NOIR: NoirTemplate,
};

export type { StudioTemplateProps };
