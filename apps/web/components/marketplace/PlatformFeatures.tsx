'use client';

import { motion } from 'framer-motion';
import { Headset, Box, Video, Camera, MapPin, BarChart3, Building2, FileText } from 'lucide-react';

const features = [
  {
    icon: Headset,
    title: 'Virtual Reality Tours',
    description: 'Step inside any property with full 360° immersion. Compatible with all major VR headsets.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10 border-brand-500/20',
  },
  {
    icon: Box,
    title: 'Interactive 3D Models',
    description: 'Navigate every room in real-time 3D. Explore layouts, finishes, and spaces at your own pace.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Video,
    title: 'Cinematic Videos',
    description: 'Hollywood-quality property films that tell the story of each development with breathtaking footage.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
  },
  {
    icon: Camera,
    title: 'Drone Photography',
    description: 'Stunning aerial perspectives revealing the full scale, setting, and surroundings of every project.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
  },
  {
    icon: Building2,
    title: 'Digital Twins',
    description: 'A living digital record of each property — construction history, documents, and ownership trail.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: MapPin,
    title: 'Interactive Maps',
    description: 'Explore neighborhoods, nearby amenities, transport links, and investment hotspots in one view.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
  {
    icon: BarChart3,
    title: 'Developer Analytics',
    description: 'Deep insights into buyer behavior, engagement, lead quality, and campaign performance.',
    color: 'text-gold-400',
    bg: 'bg-gold-500/10 border-gold-500/20',
  },
  {
    icon: FileText,
    title: 'Document Hub',
    description: 'Brochures, title deeds, floor plans, and legal documents — all in one organized, secure place.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
  },
];

export function PlatformFeatures() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-brand-400">
            Everything in one place
          </p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
            The complete property experience
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/50">
            We combine immersive technology, media production, and property management tools into a single platform built for the future of real estate.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-2xl bg-surface-800 border border-white/5 p-6 hover:border-white/10 transition-all duration-300 hover:bg-surface-700/50"
              >
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${feature.bg}`}>
                  <Icon size={18} className={feature.color} />
                </div>
                <h3 className="mb-2 font-medium text-white">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
