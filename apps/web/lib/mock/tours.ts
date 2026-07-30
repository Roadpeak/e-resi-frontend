import type { PropertyTour } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Mock tour data for The Pearl Residences (full_production — has both 3D + VR)
// In production these scenes reference actual 360° equirectangular images/videos
// captured and processed by the e-resi production team.
// ─────────────────────────────────────────────────────────────────────────────

export const mockTours: Record<string, PropertyTour> = {
  'the-pearl-residences': {
    propertyId: '1',
    has3D: true,
    hasVR: true,
    sections: [
      {
        id: 'property-views',
        type: 'property_views',
        label: 'Property Views',
        icon: 'Building2',
        scenes: [
          {
            id: 'aerial',
            label: 'Aerial View',
            description: 'Bird\'s-eye perspective of the tower and its surroundings',
            imageUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80',
            cameraPreset: 'aerial',
          },
          {
            id: 'ground',
            label: 'Ground Level',
            description: 'Street-level arrival experience and entrance lobby',
            imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80',
            cameraPreset: 'street',
          },
          {
            id: 'rooftop',
            label: 'Rooftop',
            description: 'Panoramic views from the 32nd floor rooftop lounge',
            imageUrl: 'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=400&q=80',
            cameraPreset: 'rooftop',
          },
        ],
      },
      {
        id: 'amenities',
        type: 'amenities',
        label: 'Amenities',
        icon: 'Sparkles',
        scenes: [
          {
            id: 'infinity-pool',
            label: 'Infinity Pool',
            description: 'Heated rooftop infinity pool with Nairobi skyline views',
            imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80',
            cameraPreset: 'rooftop',
          },
          {
            id: 'gym-spa',
            label: 'Gym & Spa',
            description: 'State-of-the-art fitness centre and luxury spa on level 3',
            imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&q=80',
            cameraPreset: 'interior',
          },
          {
            id: 'lobby',
            label: 'Grand Lobby',
            description: 'Double-height arrival lobby with concierge service',
            imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80',
            cameraPreset: 'interior',
          },
          {
            id: 'rooftop-lounge',
            label: 'Rooftop Lounge',
            description: 'Private residents\' lounge with curated F&B and city views',
            imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
            cameraPreset: 'rooftop',
          },
        ],
      },
      {
        id: 'units',
        type: 'units',
        label: 'Unit Tours',
        icon: 'DoorOpen',
        scenes: [
          {
            id: 'studio',
            label: '1 Bedroom',
            description: '60 sqm · From KES 12.5M · Smart home ready',
            imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
            cameraPreset: 'interior',
          },
          {
            id: '2bed',
            label: '2 Bedroom',
            description: '102 sqm · From KES 22M · Panoramic views',
            imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80',
            cameraPreset: 'interior',
          },
          {
            id: 'penthouse',
            label: 'Penthouse',
            description: '204 sqm · KES 85M · 360° views · Private terrace',
            imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80',
            cameraPreset: 'rooftop',
          },
        ],
      },
    ],
  },

  // Riverside Villas — has 3D only (no VR)
  'riverside-villas': {
    propertyId: '2',
    has3D: true,
    hasVR: false,
    sections: [
      {
        id: 'property-views',
        type: 'property_views',
        label: 'Property Views',
        icon: 'Building2',
        scenes: [
          {
            id: 'aerial',
            label: 'Aerial View',
            description: 'Drone footage over the 12-villa estate',
            imageUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&q=80',
            cameraPreset: 'aerial',
          },
          {
            id: 'ground',
            label: 'Ground Level',
            description: 'Estate entrance and landscaped approach',
            imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80',
            cameraPreset: 'street',
          },
        ],
      },
      {
        id: 'amenities',
        type: 'amenities',
        label: 'Amenities',
        icon: 'Sparkles',
        scenes: [
          {
            id: 'pool',
            label: 'Private Pool',
            description: 'Each villa features a private heated pool',
            imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80',
            cameraPreset: 'interior',
          },
          {
            id: 'garden',
            label: 'Mature Gardens',
            description: 'Half-acre plots with river frontage',
            imageUrl: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&q=80',
            cameraPreset: 'street',
          },
        ],
      },
      {
        id: 'units',
        type: 'units',
        label: 'Villa Tours',
        icon: 'DoorOpen',
        scenes: [
          {
            id: '4bed-villa',
            label: '4 Bedroom Villa',
            description: '446 sqm · KES 180M · River frontage',
            imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80',
            cameraPreset: 'interior',
          },
          {
            id: '5bed-villa',
            label: '5 Bedroom Villa',
            description: '576 sqm · KES 245M · Home theatre · Wine cellar',
            imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=2400&q=90',
            thumbnailUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&q=80',
            cameraPreset: 'interior',
          },
        ],
      },
    ],
  },
};
