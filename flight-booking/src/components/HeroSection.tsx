'use client';

interface HeroSectionProps {
  onOpenConcierge: () => void;
  onExploreSchedule: () => void;
}

export default function HeroSection({
  onOpenConcierge,
  onExploreSchedule,
}: HeroSectionProps) {
  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 px-6 border-b border-[rgba(28,26,20,0.12)] bg-[#f3ecd6]">
      <div className="max-w-7xl mx-auto">
        {/* Eyebrow / Notary badge */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ebe4cf] border border-[rgba(28,26,20,0.12)] rounded-[2px]">
            <span className="notary-mark" />
            <span className="ui-caption text-[#244232] font-semibold tracking-wider">
              FLEET VERIFIED
            </span>
            <span className="text-[#6b6759] text-xs">/</span>
            <span className="ui-caption text-[#6b6759]">
              DIRECT-CARRIER OPERATIONS
            </span>
          </div>
          <span className="hidden sm:inline-block text-xs font-mono text-[#6b6759]">
            IATA: AF // FLEET 787-9 & A350
          </span>
        </div>

        {/* Display Headline */}
        <div className="max-w-5xl">
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-normal tracking-[-0.03em] leading-[1.02] text-[#1c1a14] mb-8">
            Quiet authority in transcontinental flight.
          </h1>

          <p className="font-body text-lg md:text-xl text-[#6b6759] max-w-2xl leading-[1.72] mb-10">
            AeroFlow operates direct-carrier service between global capitals. Single-airline fleet management with deterministic Redis seat locks, verified ticket generation, and intelligent concierge.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onExploreSchedule}
              className="btn-primary cursor-pointer"
            >
              Explore Schedule
            </button>
            <button
              onClick={onOpenConcierge}
              className="btn-secondary cursor-pointer flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-[#244232]" />
              Consult AI Concierge
            </button>
          </div>
        </div>

        {/* Fleet Performance Exhibit Grid */}
        <div className="mt-16 pt-8 border-t border-[rgba(28,26,20,0.12)] grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <span className="ui-caption text-[#6b6759] block mb-1">
              FLEET SPECIFICATION
            </span>
            <span className="font-display text-2xl font-normal text-[#1c1a14] block">
              Boeing 787-9
            </span>
            <span className="text-xs text-[#6b6759] font-mono">
              Composite Fuselage • GEnx-1B
            </span>
          </div>
          <div>
            <span className="ui-caption text-[#6b6759] block mb-1">
              CABIN PRESSURE
            </span>
            <span className="font-display text-2xl font-normal text-[#1c1a14] block">
              6,000 ft
            </span>
            <span className="text-xs text-[#6b6759] font-mono">
              Higher Humidity • Restorative
            </span>
          </div>
          <div>
            <span className="ui-caption text-[#6b6759] block mb-1">
              CONCURRENCY LOCK
            </span>
            <span className="font-display text-2xl font-normal text-[#1c1a14] block">
              10 Min TTL
            </span>
            <span className="text-xs text-[#6b6759] font-mono">
              Deterministic Redis NX Hold
            </span>
          </div>
          <div>
            <span className="ui-caption text-[#6b6759] block mb-1">
              SETTLEMENT PROTOCOL
            </span>
            <span className="font-display text-2xl font-normal text-[#1c1a14] block">
              Idempotent
            </span>
            <span className="text-xs text-[#6b6759] font-mono">
              Zero Double-Booking Guarantee
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
