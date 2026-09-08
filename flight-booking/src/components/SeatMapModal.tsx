'use client';

import { useState, useEffect, useRef } from 'react';
import { FlightItem } from './FlightList';

export interface SeatData {
  id: string;
  seatNumber: string;
  class: 'Economy' | 'Business' | 'First';
  baggageAllowanceKg: number;
  extraBaggagePricePerKg: string;
  status: 'AVAILABLE' | 'BOOKED';
  isLockedInRedis: boolean;
  isSelectable: boolean;
}

interface SeatMapModalProps {
  flight: FlightItem;
  userId: string;
  onClose: () => void;
  onProceedToPassenger: (selectedSeat: SeatData, lockExpiresAt: number) => void;
}

export default function SeatMapModal({
  flight,
  userId,
  onClose,
  onProceedToPassenger,
}: SeatMapModalProps) {
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<SeatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600);

  // Keep ref of current held seat so we can release it on unmount if needed
  const heldSeatRef = useRef<SeatData | null>(null);

  // 1. Fetch flight seats & current Redis lock state
  const fetchFlightSeats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/flights/${flight.id}`);
      if (!res.ok) throw new Error('Failed to load seats');
      const data = await res.json();
      setSeats(data.seats || []);
    } catch (err) {
      console.error(err);
      setLockError('Could not load aircraft seat configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlightSeats();
  }, [flight.id]);

  // 2. Countdown timer for Redis seat hold (10 minutes)
  useEffect(() => {
    if (!lockExpiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((lockExpiresAt - Date.now()) / 1000));
      setSecondsRemaining(diff);

      if (diff === 0) {
        clearInterval(interval);
        setSelectedSeat(null);
        heldSeatRef.current = null;
        setLockExpiresAt(null);
        setLockError('Seat reservation hold expired. Please select a seat again.');
        fetchFlightSeats();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockExpiresAt]);

  // 3. Clean up Redis seat hold on unmount if not proceeding
  useEffect(() => {
    return () => {
      if (heldSeatRef.current) {
        fetch('/api/seats/release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flightId: flight.id,
            seatId: heldSeatRef.current.id,
            userId,
          }),
        }).catch((err) => console.warn('Release seat error:', err));
      }
    };
  }, [flight.id, userId]);

  // 4. Handle Seat Click & Redis Two-Phase Lock
  const handleSeatClick = async (seat: SeatData) => {
    if (!seat.isSelectable || locking) return;
    setLockError(null);

    // If clicking the already selected seat, deselect and release
    if (selectedSeat?.id === seat.id) {
      try {
        setLocking(true);
        await fetch('/api/seats/release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flightId: flight.id,
            seatId: seat.id,
            userId,
          }),
        });
        setSelectedSeat(null);
        heldSeatRef.current = null;
        setLockExpiresAt(null);
      } catch (err) {
        console.error('Failed to release seat:', err);
      } finally {
        setLocking(false);
      }
      return;
    }

    // If another seat was previously held, release it first
    if (selectedSeat) {
      try {
        await fetch('/api/seats/release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flightId: flight.id,
            seatId: selectedSeat.id,
            userId,
          }),
        });
      } catch (err) {
        console.warn('Failed to release previous seat:', err);
      }
    }

    // Now hold the new seat in Redis (NX EX 600)
    try {
      setLocking(true);
      const res = await fetch('/api/seats/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightId: flight.id,
          seatId: seat.id,
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLockError(data.error || 'Seat is currently held by another passenger.');
        fetchFlightSeats();
        return;
      }

      // Successfully locked in Redis!
      setSelectedSeat(seat);
      heldSeatRef.current = seat;
      setLockExpiresAt(data.expiresAt);
      setSecondsRemaining(600);
    } catch (err) {
      console.error('Seat lock request failed:', err);
      setLockError('Network error while securing seat hold.');
    } finally {
      setLocking(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Group seats by Class
  const businessSeats = seats.filter((s) => s.class === 'Business');
  const economySeats = seats.filter((s) => s.class === 'Economy');

  // Handle Proceeding: transfer custody of held seat so unmount won't release it
  const handleProceed = () => {
    if (!selectedSeat || !lockExpiresAt) return;
    heldSeatRef.current = null; // Detach from unmount cleanup
    onProceedToPassenger(selectedSeat, lockExpiresAt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1a14]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#f3ecd6] border border-[rgba(28,26,20,0.18)] max-w-4xl w-full rounded-[4px] shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[rgba(28,26,20,0.12)] bg-[#ebe4cf] flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="notary-mark" />
              <h3 className="font-display text-2xl font-normal text-[#1c1a14]">
                Aircraft Seat Manifest & Reservation
              </h3>
            </div>
            <p className="text-xs font-mono text-[#6b6759] mt-1">
              {flight.flightNumber} • {flight.origin.code} → {flight.destination.code} • {flight.aircraft?.model || 'Boeing 787-9'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-outline !py-1.5 !px-3 text-xs cursor-pointer"
          >
            CLOSE [ESC]
          </button>
        </div>

        {/* Live Concurrency Banner */}
        {selectedSeat && lockExpiresAt && (
          <div className="bg-[#244232] text-[#f3ecd6] px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                SEAT {selectedSeat.seatNumber} ({selectedSeat.class}) RESERVED IN REDIS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#ebe4cf]/80">HOLD EXPIRES IN:</span>
              <span className="font-bold text-sm tracking-wider">
                {formatTimer(secondsRemaining)}
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {lockError && (
          <div className="bg-red-50 border-b border-red-200 text-red-900 px-6 py-3 text-xs font-mono flex items-center justify-between">
            <span>■ CONCURRENCY NOTICE: {lockError}</span>
            <button
              onClick={() => setLockError(null)}
              className="text-red-700 underline cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Seat Legend */}
        <div className="px-6 py-3 border-b border-[rgba(28,26,20,0.08)] bg-[#f3ecd6] flex flex-wrap items-center gap-6 text-xs font-mono text-[#6b6759]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[2px] border border-[rgba(28,26,20,0.25)] bg-[#ebe4cf]" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[2px] bg-[#244232]" />
            <span className="text-[#244232] font-semibold">Your Selection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[2px] bg-red-100 border border-red-300 opacity-70" />
            <span>Redis Hold</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[2px] bg-neutral-300 opacity-50" />
            <span className="line-through">Booked</span>
          </div>
        </div>

        {/* Cabin Container */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f3ecd6]">
          {loading ? (
            <div className="text-center py-16 font-mono text-sm text-[#6b6759]">
              Loading aircraft cabin layout...
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-10">
              {/* Aircraft Nose */}
              <div className="text-center">
                <div className="w-24 h-12 mx-auto border-t-2 border-x-2 border-[rgba(28,26,20,0.2)] rounded-t-full flex items-center justify-center">
                  <span className="ui-caption text-[9px] text-[#6b6759]">
                    COCKPIT
                  </span>
                </div>
                <div className="h-6 border-l border-r border-[rgba(28,26,20,0.1)] w-24 mx-auto" />
              </div>

              {/* Business Class Section */}
              {businessSeats.length > 0 && (
                <div className="border border-[rgba(28,26,20,0.12)] bg-[#ebe4cf] p-6 rounded-[3px]">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-[rgba(28,26,20,0.12)]">
                    <span className="ui-caption text-[#1c1a14] font-semibold">
                      BUSINESS CLASS (2 - 2 SUITES)
                    </span>
                    <span className="ui-caption text-[#6b6759]">
                      +50% BASE FARE • 40KG BAGGAGE
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto">
                    {businessSeats.map((seat) => {
                      const isSelected = selectedSeat?.id === seat.id;
                      const isBooked = seat.status === 'BOOKED';
                      const isLockedOther = seat.isLockedInRedis && !isSelected;

                      let seatClasses =
                        'h-12 rounded-[3px] font-mono text-xs flex flex-col items-center justify-center transition-all cursor-pointer select-none border ';

                      if (isSelected) {
                        seatClasses +=
                          'bg-[#244232] text-[#f3ecd6] border-[#244232] shadow-sm font-bold scale-105';
                      } else if (isBooked) {
                        seatClasses +=
                          'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed opacity-50 line-through';
                      } else if (isLockedOther) {
                        seatClasses +=
                          'bg-red-50 text-red-700 border-red-200 cursor-not-allowed opacity-60';
                      } else {
                        seatClasses +=
                          'bg-[#f3ecd6] text-[#1c1a14] border-[rgba(28,26,20,0.25)] hover:border-[#1c1a14] hover:bg-[#fff]';
                      }

                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked || isLockedOther || locking}
                          onClick={() => handleSeatClick(seat)}
                          className={seatClasses}
                          title={
                            isBooked
                              ? 'Booked'
                              : isLockedOther
                              ? 'Locked in Redis by another passenger'
                              : `${seat.seatNumber} Business`
                          }
                        >
                          <span>{seat.seatNumber}</span>
                          <span className="text-[9px] opacity-75">
                            {isBooked ? 'BKD' : isLockedOther ? 'LOCK' : 'BIZ'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Galley Divider */}
              <div className="flex items-center gap-4 text-center">
                <div className="flex-1 h-[1px] bg-[rgba(28,26,20,0.12)]" />
                <span className="ui-caption text-[10px] text-[#6b6759]">
                  GALLEY // LAVATORIES // EXIT DOORS
                </span>
                <div className="flex-1 h-[1px] bg-[rgba(28,26,20,0.12)]" />
              </div>

              {/* Economy Class Section */}
              {economySeats.length > 0 && (
                <div className="border border-[rgba(28,26,20,0.12)] bg-[#ebe4cf] p-6 rounded-[3px]">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-[rgba(28,26,20,0.12)]">
                    <span className="ui-caption text-[#1c1a14] font-semibold">
                      ECONOMY CLASS (2 - 2 CONFIGURATION)
                    </span>
                    <span className="ui-caption text-[#6b6759]">
                      STANDARD BASE FARE • 23KG BAGGAGE
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
                    {economySeats.map((seat) => {
                      const isSelected = selectedSeat?.id === seat.id;
                      const isBooked = seat.status === 'BOOKED';
                      const isLockedOther = seat.isLockedInRedis && !isSelected;

                      let seatClasses =
                        'h-11 rounded-[3px] font-mono text-xs flex flex-col items-center justify-center transition-all cursor-pointer select-none border ';

                      if (isSelected) {
                        seatClasses +=
                          'bg-[#244232] text-[#f3ecd6] border-[#244232] shadow-sm font-bold scale-105';
                      } else if (isBooked) {
                        seatClasses +=
                          'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed opacity-50 line-through';
                      } else if (isLockedOther) {
                        seatClasses +=
                          'bg-red-50 text-red-700 border-red-200 cursor-not-allowed opacity-60';
                      } else {
                        seatClasses +=
                          'bg-[#f3ecd6] text-[#1c1a14] border-[rgba(28,26,20,0.25)] hover:border-[#1c1a14] hover:bg-[#fff]';
                      }

                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked || isLockedOther || locking}
                          onClick={() => handleSeatClick(seat)}
                          className={seatClasses}
                          title={
                            isBooked
                              ? 'Booked'
                              : isLockedOther
                              ? 'Locked in Redis by another passenger'
                              : `${seat.seatNumber} Economy`
                          }
                        >
                          <span>{seat.seatNumber}</span>
                          <span className="text-[9px] opacity-75">
                            {isBooked ? 'BKD' : isLockedOther ? 'LOCK' : 'ECO'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[rgba(28,26,20,0.12)] bg-[#ebe4cf] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            {selectedSeat ? (
              <div className="text-sm">
                <span className="font-semibold text-[#1c1a14]">
                  Selected: Seat {selectedSeat.seatNumber} ({selectedSeat.class})
                </span>
                <span className="text-[#6b6759] text-xs block font-mono">
                  Baggage: {selectedSeat.baggageAllowanceKg}kg included • Extra $
                  {selectedSeat.extraBaggagePricePerKg}/kg
                </span>
              </div>
            ) : (
              <span className="text-xs font-mono text-[#6b6759]">
                Click an available seat to establish a 10-minute Redis lock.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="btn-outline !py-3 !px-5 flex-1 sm:flex-none cursor-pointer"
            >
              CANCEL
            </button>
            <button
              onClick={handleProceed}
              disabled={!selectedSeat || locking}
              className="btn-primary !py-3 !px-6 flex-1 sm:flex-none cursor-pointer"
            >
              {locking ? 'LOCKING SEAT...' : 'PROCEED TO PASSENGER'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
