'use client';

import { useState } from 'react';
import { FlightItem } from './FlightList';
import { SeatData } from './SeatMapModal';

interface PassengerModalProps {
  flight: FlightItem;
  seat: SeatData;
  userId: string;
  lockExpiresAt: number;
  onBack: () => void;
  onClose: () => void;
}

export default function PassengerModal({
  flight,
  seat,
  userId,
  lockExpiresAt,
  onBack,
  onClose,
}: PassengerModalProps) {
  const [fullName, setFullName] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [extraBaggageKg, setExtraBaggageKg] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Financial calculations
  const basePriceNum = parseFloat(flight.basePrice);
  const classMultiplier = seat.class === 'Business' ? 1.5 : seat.class === 'First' ? 2.2 : 1.0;
  const ticketFare = Math.round(basePriceNum * classMultiplier);
  const extraKgPrice = parseFloat(seat.extraBaggagePricePerKg) || 15.0;
  const extraBaggageCost = Math.round(extraBaggageKg * extraKgPrice);
  const grandTotal = ticketFare + extraBaggageCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !passportNumber.trim()) {
      setErrorMessage('Please fill in passenger full name and passport number.');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightId: flight.id,
          seatId: seat.id,
          userId,
          passengerName: fullName.trim(),
          passportNumber: passportNumber.trim().toUpperCase(),
          extraBaggageKg,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to generate Stripe payment session.');
      }

      // Redirect user to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Checkout initialization failed:', err);
      setErrorMessage(err.message || 'Payment initiation failed.');
      setSubmitting(false);
    }
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
                Passenger Identification & Ticket Issue
              </h3>
            </div>
            <p className="text-xs font-mono text-[#6b6759] mt-1">
              FLIGHT {flight.flightNumber} • SEAT {seat.seatNumber} ({seat.class})
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-outline !py-1.5 !px-3 text-xs cursor-pointer"
          >
            CANCEL
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-[#f3ecd6]">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-900 p-4 text-xs font-mono rounded-[3px]">
              ■ CHECKOUT ERROR: {errorMessage}
            </div>
          )}

          {/* Passenger Identity Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="ui-caption text-[#6b6759] block mb-2 font-mono">
                PASSENGER FULL NAME (AS ON PASSPORT) *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. ELEANOR VANCE"
                className="w-full bg-[#ebe4cf] border border-[rgba(28,26,20,0.18)] text-[#1c1a14] px-4 py-3 rounded-[3px] text-sm focus:outline-none focus:border-[#1c1a14] transition-colors"
              />
            </div>

            <div>
              <label className="ui-caption text-[#6b6759] block mb-2 font-mono">
                PASSPORT / TRAVEL DOCUMENT NO. *
              </label>
              <input
                type="text"
                required
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                placeholder="e.g. A12345678"
                className="w-full bg-[#ebe4cf] border border-[rgba(28,26,20,0.18)] text-[#1c1a14] px-4 py-3 rounded-[3px] text-sm focus:outline-none focus:border-[#1c1a14] transition-colors font-mono uppercase"
              />
            </div>
          </div>

          {/* Baggage Selection */}
          <div className="p-4 border border-[rgba(28,26,20,0.12)] bg-[#ebe4cf] rounded-[3px]">
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="ui-caption text-[#1c1a14] font-semibold block">
                  BAGGAGE ALLOWANCE
                </span>
                <span className="text-xs text-[#6b6759]">
                  Standard {seat.baggageAllowanceKg} kg checked bag included with ticket.
                </span>
              </div>
              <span className="ui-caption text-[#244232] font-semibold">
                INCLUDED
              </span>
            </div>

            <div className="pt-3 border-t border-[rgba(28,26,20,0.08)] flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="ui-caption text-[#6b6759] block">
                  ADDITIONAL BAGGAGE (+${extraKgPrice}/KG)
                </span>
                <span className="text-xs text-[#6b6759] font-mono">
                  Additional allowance for long-haul luggage
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setExtraBaggageKg((prev) => Math.max(0, prev - 5))}
                  className="w-8 h-8 rounded-[2px] border border-[rgba(28,26,20,0.2)] bg-[#f3ecd6] flex items-center justify-center font-mono hover:bg-[#fff] cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono text-sm w-12 text-center font-semibold">
                  {extraBaggageKg} kg
                </span>
                <button
                  type="button"
                  onClick={() => setExtraBaggageKg((prev) => prev + 5)}
                  className="w-8 h-8 rounded-[2px] border border-[rgba(28,26,20,0.2)] bg-[#f3ecd6] flex items-center justify-center font-mono hover:bg-[#fff] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Fare Summary Exhibit Table */}
          <div className="border border-[rgba(28,26,20,0.12)] bg-[#ebe4cf] p-5 rounded-[3px] space-y-2.5 font-mono text-xs">
            <div className="flex justify-between text-[#6b6759]">
              <span>Base Airfare ({flight.origin.code} → {flight.destination.code}):</span>
              <span>${basePriceNum.toFixed(2)} USD</span>
            </div>
            {seat.class !== 'Economy' && (
              <div className="flex justify-between text-[#6b6759]">
                <span>Class Upgrade Supplement ({seat.class}):</span>
                <span>+${(ticketFare - basePriceNum).toFixed(2)} USD</span>
              </div>
            )}
            {extraBaggageCost > 0 && (
              <div className="flex justify-between text-[#6b6759]">
                <span>Additional Baggage ({extraBaggageKg} kg):</span>
                <span>+${extraBaggageCost.toFixed(2)} USD</span>
              </div>
            )}
            <div className="pt-3 border-t border-[rgba(28,26,20,0.12)] flex justify-between items-center text-sm font-bold text-[#1c1a14]">
              <span>TOTAL PAYABLE:</span>
              <span className="font-display text-2xl font-normal">
                ${grandTotal.toFixed(2)}{' '}
                <span className="text-xs font-mono font-normal text-[#6b6759]">
                  USD
                </span>
              </span>
            </div>
          </div>

          {/* Concurrency Rule Notice */}
          <p className="text-[11px] font-mono text-[#6b6759] leading-relaxed">
            ■ DIRECT-CARRIER PROTOCOL: Seat {seat.seatNumber} is temporarily secured via Redis NX lock. Postgres registration will execute idempotently upon payment confirmation.
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-[rgba(28,26,20,0.12)]">
            <button
              type="button"
              onClick={onBack}
              disabled={submitting}
              className="btn-outline !py-3 !px-5 cursor-pointer"
            >
              ← CHANGE SEAT
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary !py-3 !px-8 cursor-pointer flex items-center gap-2"
            >
              {submitting ? (
                <span>INITIALIZING STRIPE...</span>
              ) : (
                <span>CONFIRM & PAY WITH STRIPE (${grandTotal.toFixed(0)})</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
