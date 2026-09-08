'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import HeroSection from '@/components/HeroSection';
import FlightSearch, { AirportOption } from '@/components/FlightSearch';
import FlightList, { FlightItem } from '@/components/FlightList';
import SeatMapModal, { SeatData } from '@/components/SeatMapModal';
import PassengerModal from '@/components/PassengerModal';
import ConciergeDrawer from '@/components/ConciergeDrawer';
import MyBookingsModal from '@/components/MyBookingsModal';

export default function Home() {
  const { user } = useUser();
  const [guestId, setGuestId] = useState<string>('');

  // Persistent anonymous or clerk user identifier for Redis seat locking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let gid = localStorage.getItem('aeroflow_guest_id');
      if (!gid) {
        gid = 'guest_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('aeroflow_guest_id', gid);
      }
      setGuestId(gid);
    }
  }, []);

  const activeUserId = user?.id || guestId || 'guest_default';

  // State
  const [airports, setAirports] = useState<AirportOption[]>([]);
  const [flights, setFlights] = useState<FlightItem[]>([]);
  const [loadingFlights, setLoadingFlights] = useState<boolean>(true);

  // Modals & Drawers
  const [selectedFlightForSeat, setSelectedFlightForSeat] = useState<FlightItem | null>(null);
  const [selectedSeatForCheckout, setSelectedSeatForCheckout] = useState<{
    seat: SeatData;
    lockExpiresAt: number;
  } | null>(null);
  const [isConciergeOpen, setIsConciergeOpen] = useState<boolean>(false);
  const [isBookingsOpen, setIsBookingsOpen] = useState<boolean>(false);

  // 1. Fetch Airports on Mount
  useEffect(() => {
    async function loadAirports() {
      try {
        const res = await fetch('/api/airports');
        const data = await res.json();
        if (data.airports) {
          setAirports(data.airports);
        }
      } catch (err) {
        console.error('Failed to load airports:', err);
      }
    }
    loadAirports();
  }, []);

  // 2. Fetch Flights with Filters
  const fetchFlights = async (filters?: {
    origin?: string;
    destination?: string;
    date?: string;
  }) => {
    setLoadingFlights(true);
    try {
      const params = new URLSearchParams();
      if (filters?.origin) params.append('origin', filters.origin);
      if (filters?.destination) params.append('destination', filters.destination);
      if (filters?.date) params.append('date', filters.date);

      const res = await fetch(`/api/flights?${params.toString()}`);
      const data = await res.json();
      setFlights(data.flights || []);
    } catch (err) {
      console.error('Failed to load flights:', err);
      setFlights([]);
    } finally {
      setLoadingFlights(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []);

  // Handlers
  const handleSelectFlight = (flight: FlightItem) => {
    setSelectedFlightForSeat(flight);
  };

  const handleProceedToPassenger = (seat: SeatData, lockExpiresAt: number) => {
    setSelectedSeatForCheckout({ seat, lockExpiresAt });
  };

  const handleBackToSeatMap = () => {
    setSelectedSeatForCheckout(null);
  };

  const handleCloseBookingFlow = () => {
    setSelectedSeatForCheckout(null);
    setSelectedFlightForSeat(null);
    fetchFlights(); // Refresh seat counts
  };

  return (
    <div className="bg-[#f3ecd6] min-h-screen text-[#1c1a14]">
      {/* Hidden Buttons for Header triggers */}
      <button
        id="concierge-trigger"
        className="hidden"
        onClick={() => setIsConciergeOpen(true)}
      />
      <button
        id="bookings-trigger"
        className="hidden"
        onClick={() => setIsBookingsOpen(true)}
      />

      {/* Hero Section */}
      <HeroSection
        onOpenConcierge={() => setIsConciergeOpen(true)}
        onExploreSchedule={() => {
          const el = document.getElementById('schedule');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Booking Workspace */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Search Bar */}
        <FlightSearch
          airports={airports}
          onSearch={(filters) => fetchFlights(filters)}
          isLoading={loadingFlights}
        />

        {/* Flight Cards List */}
        <FlightList
          flights={flights}
          isLoading={loadingFlights}
          onSelectFlight={handleSelectFlight}
        />

        {/* Editorial Architecture & Fleet Presentation */}
        <section className="mt-24 pt-16 border-t border-[rgba(28,26,20,0.12)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div>
              <span className="ui-caption text-[#244232] font-semibold block mb-2">
                ■ CONCURRENCY PHILOSOPHY
              </span>
              <h3 className="font-display text-3xl font-normal text-[#1c1a14] mb-4">
                Two-Phase Seat Reservation
              </h3>
              <p className="text-[#6b6759] text-sm leading-[1.72]">
                We reject speculative overbooking. Every seat selected in AeroFlow is atomically secured via Upstash Redis with a 10-minute TTL. No database records are written until payment confirmation is idempotently verified by Stripe webhooks.
              </p>
            </div>

            <div>
              <span className="ui-caption text-[#244232] font-semibold block mb-2">
                ■ FLEET ENGINEERING
              </span>
              <h3 className="font-display text-3xl font-normal text-[#1c1a14] mb-4">
                Boeing 787-9 & Airbus A350
              </h3>
              <p className="text-[#6b6759] text-sm leading-[1.72]">
                Our non-aggregated, direct-carrier model ensures passengers fly only on cutting-edge twin-aisle widebodies with 6,000-foot cabin pressurization and true lie-flat suites in Business Class.
              </p>
            </div>

            <div>
              <span className="ui-caption text-[#244232] font-semibold block mb-2">
                ■ BESPOKE CONCIERGE
              </span>
              <h3 className="font-display text-3xl font-normal text-[#1c1a14] mb-4">
                Semantic Vector Advisory
              </h3>
              <p className="text-[#6b6759] text-sm leading-[1.72]">
                Destination guides are indexed in PostgreSQL using 768-dimensional Gemini vector embeddings and HNSW cosine distance. Inquiries receive advisory intelligence paired directly with flight dispatches.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Seat Map Modal (Phase 1: Redis Lock) */}
      {selectedFlightForSeat && !selectedSeatForCheckout && (
        <SeatMapModal
          flight={selectedFlightForSeat}
          userId={activeUserId}
          onClose={handleCloseBookingFlow}
          onProceedToPassenger={handleProceedToPassenger}
        />
      )}

      {/* Passenger Details & Stripe Checkout Modal (Phase 2: Payment) */}
      {selectedFlightForSeat && selectedSeatForCheckout && (
        <PassengerModal
          flight={selectedFlightForSeat}
          seat={selectedSeatForCheckout.seat}
          userId={activeUserId}
          lockExpiresAt={selectedSeatForCheckout.lockExpiresAt}
          onBack={handleBackToSeatMap}
          onClose={handleCloseBookingFlow}
        />
      )}

      {/* AI Concierge Drawer */}
      <ConciergeDrawer
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
        onSelectFlight={(flight) => {
          setSelectedFlightForSeat(flight);
        }}
      />

      {/* My Bookings / PNR Lookup Modal */}
      <MyBookingsModal
        isOpen={isBookingsOpen}
        onClose={() => setIsBookingsOpen(false)}
        currentUserId={user?.id}
      />
    </div>
  );
}
