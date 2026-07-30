'use client';

import { motion } from 'framer-motion';
import { Building2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-surface-800 to-surface-900 p-12 text-center"
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-brand-600/15 blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10">
              <Building2 size={24} className="text-brand-400" />
            </div>
            <h2 className="mb-4 text-3xl font-semibold text-white sm:text-4xl">
              Are you a developer or agency?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-white/50">
              Digitize your developments and give buyers a world-class experience. From photography and VR production to analytics and lead management — e-resi is your complete digital partner.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button href="/dashboard" size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
                Get Started Free
              </Button>
              <Button href="/services" variant="outline" size="lg">
                View Services
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
