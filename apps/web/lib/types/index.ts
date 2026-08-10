// ─────────────────────────────────────────────
// Core domain types for e-resi
// ─────────────────────────────────────────────

export type PropertyStatus = 'off_plan' | 'under_construction' | 'ready' | 'sold_out';
/**
 * Mirrors the backend PropertyCategory enum exactly — the API validates against
 * these values and 400s on anything else. (The previous vocabulary here —
 * residential/mixed_use — matched nothing on the backend, so every Type filter
 * selection silently 400'd and the accent maps keyed off it never hit.)
 */
export type PropertyCategory =
  | 'APARTMENT'
  | 'VILLA'
  | 'TOWNHOUSE'
  | 'PENTHOUSE'
  | 'OFFICE'
  | 'COMMERCIAL'
  | 'LAND';
export type UnitStatus = 'available' | 'reserved' | 'sold';
export type UserRole = 'BUYER' | 'INVESTOR' | 'TENANT' | 'DEVELOPER' | 'AGENT' | 'ADMIN';
export type MediaType = 'photo' | 'video' | 'drone' | 'three_d' | 'vr' | 'floor_plan';

// ── Production & Billing Tiers ─────────────────

/** What the developer chose when listing. Each tier is additive. */
export type ProductionTier =
  | 'listing_only'        // text + basic photos only
  | 'photography'         // professional photos + drone stills
  | 'photography_video'   // above + cinematic video
  | 'tour_cinematic'      // above + scroll-scrubbed cinematic flythrough
  | 'tour_3d'             // above + interactive 3D model/tour
  | 'tour_vr'             // above + full VR experience
  | 'full_production';    // all of the above + digital twin

// ── Cinematic Tour ─────────────────────────────

export type CinematicSceneCategory =
  | 'full_tour'
  | 'exterior'
  | 'living_room'
  | 'kitchen'
  | 'bedroom'
  | 'bathroom'
  | 'amenities'
  | 'aerial'
  | 'unit_type';

export interface CinematicScene {
  id: string;
  label: string;
  /** e.g. "Italian Finishes", "Floor 24", "2-Bedroom" */
  sublabel?: string;
  category: CinematicSceneCategory;
  /** The video file for this individual scene */
  videoUrl: string;
  /** Thumbnail shown in the scene picker */
  thumbnailUrl?: string;
}

// ── Tour / Immersive Experience ────────────────

export type TourViewType = 'aerial' | 'ground' | 'rooftop';
export type TourSectionType = 'property_views' | 'amenities' | 'units';

export interface TourScene {
  id: string;
  label: string;
  /** Short description shown in the scene selector */
  description?: string;
  /** 360° equirectangular image URL (VR) or regular image (3D placeholder) */
  imageUrl: string;
  /** If this is a video scene, the video URL */
  videoUrl?: string;
  thumbnailUrl: string;
  /** Camera starting position hint for 3D mode */
  cameraPreset?: 'aerial' | 'street' | 'rooftop' | 'interior';
}

export interface TourSection {
  id: string;
  type: TourSectionType;
  label: string;
  icon: string;
  scenes: TourScene[];
}

export interface PropertyTour {
  propertyId: string;
  /** Available in 3D interactive mode */
  has3D: boolean;
  /** Available in VR / 360° immersive mode */
  hasVR: boolean;
  sections: TourSection[];
}

// ── Property ──────────────────────────────────

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  street?: string;
  neighborhood: string;
  city: string;
  county: string;
  country: string;
  coordinates: Coordinates;
}

/**
 * A landmark near the development — what the property page lists under
 * "Nearby". `type` mirrors the backend AmenityType enum exactly; it is not
 * lowercased on the read path, so anything keyed off it must use these values.
 */
export type AmenityType =
  | 'SCHOOL'
  | 'HOSPITAL'
  | 'MALL'
  | 'TRANSPORT'
  | 'RESTAURANT'
  | 'PARK'
  | 'BANK'
  | 'AIRPORT'
  | 'GYM'
  | 'SUPERMARKET'
  | 'HOTEL';

export interface Amenity {
  id: string;
  name: string;
  icon?: string;
  distance?: string;
  type: AmenityType;
}

export interface MediaAsset {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  title?: string;
  order: number;
  isFeatured?: boolean;
}

export interface FloorPlan {
  id: string;
  name: string;
  imageUrl: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  sqm: number;
}

export interface Unit {
  id: string;
  name: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  price: number;
  currency: string;
  status: UnitStatus;
  floorPlanId?: string;
  features: string[];
}

export interface ConstructionUpdate {
  id: string;
  date: string;
  title: string;
  description: string;
  images: string[];
  percentComplete: number;
}

export interface Developer {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  establishedYear: number;
  completedProjects: number;
  website?: string;
}

export interface Property {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: PropertyCategory;
  status: PropertyStatus;
  developer: Developer;
  address: Address;
  heroVideoUrl?: string;
  heroImageUrl: string;
  /** Developer-uploaded property logo, if any. */
  logoUrl?: string;
  galleryImages: string[];
  media: MediaAsset[];
  floorPlans: FloorPlan[];
  units: Unit[];
  amenities: Amenity[];
  constructionUpdates: ConstructionUpdate[];
  totalUnits: number;
  availableUnits: number;
  priceFrom: number;
  priceTo: number;
  currency: string;
  completionDate?: string;
  features: string[];
  tags: string[];
  isFeatured: boolean;
  has3DTour: boolean;
  hasVRTour: boolean;
  hasCinematicTour: boolean;
  cinematicScenes?: CinematicScene[];
  hasDigitalTwin: boolean;
  productionTier: ProductionTier;
  createdAt: string;
  updatedAt: string;
}

// ── Filters ───────────────────────────────────

export interface PropertyFilters {
  query?: string;
  category?: PropertyCategory;
  status?: PropertyStatus;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  city?: string;
  neighborhood?: string;
  has3DTour?: boolean;
  hasVRTour?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'featured';
}

// ── Rent Listings ─────────────────────────────

export type RentListingStatus = 'available' | 'partially_available' | 'fully_let';
export type FurnishingType = 'furnished' | 'semi_furnished' | 'unfurnished';

export interface RentUnit {
  id: string;
  label: string;           // e.g. "1 Bedroom", "2 Bedroom", "Studio", "Penthouse"
  /** Floor this unit sits on — shown to tenants as "A12, 10th floor". */
  floor?: number;
  /** Layout being let — selects which unit-type videos to show. */
  unitType?: string;
  showCinematicTour?: boolean;
  show3DTour?: boolean;
  showVRTour?: boolean;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  pricePerMonth: number;
  currency: string;
  available: number;       // how many of this type are available
  total: number;
  furnishing: FurnishingType;
  features: string[];
  /** Cinematic scene IDs from the parent property to show for this unit type */
  cinematicSceneIds?: string[];
}

export interface RentListing {
  id: string;
  slug: string;
  /** Links back to the parent Property (for 3D/cinematic tour access) */
  propertyId: string;
  propertySlug: string;
  name: string;
  tagline: string;
  description: string;
  address: Address;
  heroImageUrl: string;
  galleryImages: string[];
  units: RentUnit[];
  amenities: Amenity[];
  status: RentListingStatus;
  furnishing: FurnishingType;
  priceFrom: number;        // lowest monthly rent across unit types
  priceTo: number;
  currency: string;
  availableFrom: string;    // ISO date
  minLeaseTerm: number;     // months
  /** Whether to show the 3D tour option (only if parent property has it) */
  show3DTour: boolean;
  /** Whether to show cinematic tour (only if parent property has it) */
  showCinematicTour: boolean;
  /** Specific cinematic scene IDs the developer chose to display */
  featuredCinematicSceneIds: string[];
  developer: Developer;
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Rent Filters ──────────────────────────────

export interface RentFilters {
  query?: string;
  city?: string;
  neighborhood?: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  furnishing?: FurnishingType;
  show3DTour?: boolean;
  showCinematicTour?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'newest';
}

// ── Booking / Inquiry ─────────────────────────

export interface BookingPayload {
  propertyId: string;
  unitId?: string;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  type: 'physical' | 'virtual';
  message?: string;
}

export interface InquiryPayload {
  propertyId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  interestedInUnit?: string;
}

// ── User / Auth ───────────────────────────────

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  emailVerified?: boolean;
  isActive?: boolean;
  createdAt: string;
}

// ── Dashboard ─────────────────────────────────

export interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  availableUnits: number;
  totalInquiries: number;
  newInquiries: number;
  totalBookings: number;
  pageViews: number;
  leads: number;
}

// ── API Response ──────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
