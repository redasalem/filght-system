'use client';

import { useState, useEffect } from 'react';

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string | null;
}

export default function MyBookingsModal({
  isOpen,
  onClose,
  currentUserId,
}: MyBookingsModalProps) {
  const [pnrInput, setPnrInput] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async (queryParam: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings?${queryParam}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch bookings');
      setBookings(data.bookings || []);
      if ((data.bookings || []).length === 0) {
        setError('No confirmed bookings found for the provided record.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchBookings(`userId=${encodeURIComponent(currentUserId)}`);
    }
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  const handlePnrSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnrInput.trim()) return;
    fetchBookings(`pnr=${encodeURIComponent(pnrInput.trim().toUpperCase())}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1a14]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#f3ecd6] border border-[rgba(28,26,20,0.18)] max-w-2xl w-full rounded-[4px] shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[rgba(28,26,20,0.12)] bg-[#ebe4cf] flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="notary-mark" />
              <h3 className="font-display text-2xl font-normal text-[#1c1a14]">
                Passenger Name Record (PNR) Lookup
              </h3>
            </div>
            <p className="text-xs font-mono text-[#6b6759] mt-0.5">
              RETRIEVE CONFIRMED TICKET & BOARDING PASS
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-outline !py-1.5 !px-3 text-xs cursor-pointer"
          >
            CLOSE [ESC]
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* PNR Search Form */}
          <form onSubmit={handlePnrSearch} className="flex gap-2">
            <input
              type="text"
              maxLength={10}
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value.toUpperCase())}
              placeholder="ENTER 6-CHAR PNR (E.G. AF7X9Q)"
              className="flex-1 bg-[#ebe4cf] border border-[rgba(28,26,20,0.18)] text-[#1c1a14] px-4 py-2.5 rounded-[3px] font-mono text-sm uppercase focus:outline-none focus:border-[#1c1a14]"
            />
            <button
              type="submit"
              disabled={loading || !pnrInput.trim()}
              className="btn-primary !py-2.5 !px-6 text-xs cursor-pointer"
            >
              {loading ? 'RETRIEVING...' : 'RETRIEVE'}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-[3px] text-xs font-mono">
              ■ {error}
            </div>
          )}

          {/* Bookings Display */}
          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="border border-[rgba(28,26,20,0.18)] bg-[#ebe4cf] rounded-[4px] p-6 relative overflow-hidden"
              >
                {/* Boarding Pass Header */}
                <div className="flex justify-between items-start pb-4 border-b border-[rgba(28,26,20,0.12)]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="notary-mark" />
                      <span className="font-display text-xl font-normal text-[#1c1a14]">
                        AEROFLOW // BOARDING PASS
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#6b6759]">
                      DIRECT-CARRIER SCHEDULED FLIGHT
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="ui-caption text-[#6b6759] block">
                      BOOKING REFERENCE (PNR)
                    </span>
                    <span className="font-mono text-lg font-bold text-[#244232] tracking-widest">
                      {b.pnr}
                    </span>
                  </div>
                </div>

                {/* Ticket Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-[rgba(28,26,20,0.12)] font-mono text-xs">
                  <div>
                    <span className="text-[#6b6759] block">PASSENGER:</span>
                    <span className="font-bold text-sm text-[#1c1a14] truncate block">
                      {b.passenger?.fullName || 'VERIFIED PASSENGER'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6b6759] block">FLIGHT:</span>
                    <span className="font-bold text-sm text-[#1c1a14]">
                      {b.flight?.flightNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6b6759] block">SEAT:</span>
                    <span className="font-bold text-sm text-[#244232]">
                      {b.seat?.seatNumber} ({b.seat?.class || 'Economy'})
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6b6759] block">STATUS:</span>
                    <span className="font-bold text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-[2px] inline-block">
                      {b.status}
                    </span>
                  </div>
                </div>

                {/* Route & Timings */}
                <div className="py-4 flex justify-between items-center text-center">
                  <div className="text-left">
                    <div className="font-mono text-2xl font-bold text-[#1c1a14]">
                      {b.flight?.originCode}
                    </div>
                    <div className="text-xs text-[#6b6759]">
                      {b.flight?.originCity}
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="ui-caption text-[10px] text-[#244232] mb-1">
                      NON-STOP
                    </span>
                    <div className="w-24 h-[1px] bg-[rgba(28,26,20,0.3)] relative flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#244232] rotate-45" />
                    </div>
                    <span className="text-[10px] font-mono text-[#6b6759] mt-1">
                      {b.flight?.aircraftModel || 'Boeing 787-9'}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-2xl font-bold text-[#1c1a14]">
                      {b.flight?.destinationCode}
                    </div>
                    <div className="text-xs text-[#6b6759]">
                      {b.flight?.destinationCity}
                    </div>
                  </div>
                </div>

                {/* Perforation / Barcode Footer */}
                <div className="pt-4 border-t-2 border-dashed border-[rgba(28,26,20,0.18)] flex justify-between items-center text-xs font-mono text-[#6b6759]">
                  <div>
                    <span>DOCUMENT NO: {b.passenger?.passportNumber || 'PASSENGER TICKET'}</span>
                    <span className="block text-[10px]">TOTAL SETTLED: ${parseFloat(b.totalPrice).toFixed(2)} USD</span>
                  </div>
                  <div className="tracking-widest font-mono text-base text-[#1c1a14] opacity-75">
                    ||||| | |||| || ||||| | |||
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
