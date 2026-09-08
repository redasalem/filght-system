'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 6;

    // Poll briefly for webhook transaction to complete in Postgres
    const checkBooking = async () => {
      try {
        const res = await fetch(`/api/bookings?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json();

        if (res.ok && data.bookings && data.bookings.length > 0) {
          setBooking(data.bookings[0]);
          setLoading(false);
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkBooking, 1500);
          } else {
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.error(err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkBooking, 1500);
        } else {
          setError('Booking confirmation pending. Please check with your PNR shortly.');
          setLoading(false);
        }
      }
    };

    checkBooking();
  }, [sessionId]);

  return (
    <div className="max-w-3xl mx-auto py-16 px-6">
      {/* Confirmation Banner */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ebe4cf] border border-[rgba(28,26,20,0.12)] rounded-[2px] mb-4">
          <span className="notary-mark" />
          <span className="ui-caption text-[#244232] font-semibold">
            PAYMENT CONFIRMED • IDEMPOTENT SETTLEMENT
          </span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-normal text-[#1c1a14] mb-4">
          Your Transcontinental Ticket is Confirmed.
        </h1>
        <p className="text-[#6b6759] text-base max-w-lg mx-auto leading-relaxed">
          Your seat lock in Redis has been converted into a confirmed PostgreSQL reservation. Your ticket and Passenger Name Record (PNR) are ready.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center border border-[rgba(28,26,20,0.12)] bg-[#ebe4cf] rounded-[4px] font-mono text-sm text-[#6b6759] animate-pulse">
          Finalizing ticket generation & PNR assignment...
        </div>
      ) : booking ? (
        <div className="border border-[rgba(28,26,20,0.18)] bg-[#ebe4cf] rounded-[4px] p-8 shadow-sm relative overflow-hidden">
          {/* Boarding Pass Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-[rgba(28,26,20,0.12)] gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="notary-mark" />
                <span className="font-display text-2xl font-normal text-[#1c1a14]">
                  AEROFLOW // BOARDING PASS
                </span>
              </div>
              <span className="text-xs font-mono text-[#6b6759]">
                DIRECT-CARRIER SCHEDULED FLIGHT
              </span>
            </div>

            <div className="text-left sm:text-right">
              <span className="ui-caption text-[#6b6759] block">
                BOOKING REFERENCE (PNR)
              </span>
              <span className="font-mono text-2xl font-bold text-[#244232] tracking-widest">
                {booking.pnr}
              </span>
            </div>
          </div>

          {/* Ticket Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-b border-[rgba(28,26,20,0.12)] font-mono text-xs">
            <div>
              <span className="text-[#6b6759] block mb-1">PASSENGER:</span>
              <span className="font-bold text-sm text-[#1c1a14] block">
                {booking.passenger?.fullName || 'VERIFIED PASSENGER'}
              </span>
              <span className="text-[10px] text-[#6b6759]">
                DOC: {booking.passenger?.passportNumber}
              </span>
            </div>
            <div>
              <span className="text-[#6b6759] block mb-1">FLIGHT:</span>
              <span className="font-bold text-sm text-[#1c1a14]">
                {booking.flight?.flightNumber}
              </span>
              <span className="text-[10px] text-[#6b6759] block">
                {booking.flight?.aircraftModel || 'Boeing 787-9'}
              </span>
            </div>
            <div>
              <span className="text-[#6b6759] block mb-1">SEAT:</span>
              <span className="font-bold text-sm text-[#244232]">
                {booking.seat?.seatNumber} ({booking.seat?.class || 'Economy'})
              </span>
              <span className="text-[10px] text-[#6b6759] block">
                BOARDING GROUP 1
              </span>
            </div>
            <div>
              <span className="text-[#6b6759] block mb-1">SETTLEMENT:</span>
              <span className="font-bold text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-[2px] inline-block">
                {booking.status}
              </span>
              <span className="text-[10px] text-[#6b6759] block mt-1">
                ${parseFloat(booking.totalPrice).toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Route & Timings */}
          <div className="py-6 flex justify-between items-center text-center">
            <div className="text-left">
              <div className="font-mono text-3xl font-bold text-[#1c1a14]">
                {booking.flight?.originCode}
              </div>
              <div className="text-xs text-[#6b6759]">
                {booking.flight?.originCity}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="ui-caption text-[10px] text-[#244232] mb-1">
                NON-STOP DIRECT
              </span>
              <div className="w-32 h-[1px] bg-[rgba(28,26,20,0.3)] relative flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-[#244232] rotate-45" />
              </div>
              <span className="text-[11px] font-mono text-[#6b6759] mt-1">
                AEROFLOW CARRIER
              </span>
            </div>

            <div className="text-right">
              <div className="font-mono text-3xl font-bold text-[#1c1a14]">
                {booking.flight?.destinationCode}
              </div>
              <div className="text-xs text-[#6b6759]">
                {booking.flight?.destinationCity}
              </div>
            </div>
          </div>

          {/* Barcode Footer */}
          <div className="pt-6 border-t-2 border-dashed border-[rgba(28,26,20,0.18)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono text-[#6b6759]">
            <div>
              <span>ISSUED BY AEROFLOW FLIGHT OPERATIONS</span>
              <span className="block text-[10px]">VERIFICATION CODE: {booking.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="tracking-widest font-mono text-lg text-[#1c1a14] opacity-80">
              ||||| ||| ||||||| || |||||| ||||
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 border border-[rgba(28,26,20,0.12)] bg-[#ebe4cf] rounded-[4px] text-center space-y-3 font-mono text-xs text-[#6b6759]">
          <p>Your payment session was received.</p>
          <p>If your ticket is processing, retrieve it using your PNR or Email from the top navigation bar.</p>
        </div>
      )}

      {/* Return Actions */}
      <div className="mt-10 flex justify-center gap-4">
        <Link href="/" className="btn-primary">
          RETURN TO HOME
        </Link>
        <button
          onClick={() => window.print()}
          className="btn-secondary cursor-pointer"
        >
          PRINT BOARDING PASS
        </button>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-mono">Loading ticket status...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
