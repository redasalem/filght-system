import { db } from '@/db';
import { bookings, passengers, flights, airports, seats, aircraftLayouts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import Link from 'next/link';
import { generateBoardingPassQRCode } from '@/lib/qrcode';

export const dynamic = 'force-dynamic';

function maskPassport(passport?: string | null): string {
  if (!passport) return '••••••••';
  const clean = passport.trim();
  if (clean.length <= 4) return '••••' + clean;
  return '••••••••' + clean.slice(-4);
}

function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return isoString;
  }
}

export default async function VerifyBoardingPassPage({
  params,
}: {
  params: Promise<{ pnr: string }>;
}) {
  const { pnr } = await params;
  const upperPnr = (pnr || '').toUpperCase().trim();

  const originAirport = alias(airports, 'originAirport');
  const destinationAirport = alias(airports, 'destinationAirport');

  const [record] = await db
    .select({
      bookingId: bookings.id,
      pnr: bookings.pnr,
      status: bookings.status,
      createdAt: bookings.createdAt,
      passengerName: passengers.fullName,
      passportNumber: passengers.passportNumber,
      seatNumber: seats.seatNumber,
      seatClass: seats.class,
      baggageAllowanceKg: seats.baggageAllowanceKg,
      flightNumber: flights.flightNumber,
      departureTime: flights.departureTime,
      arrivalTime: flights.arrivalTime,
      originCode: originAirport.code,
      originCity: originAirport.city,
      originName: originAirport.name,
      destinationCode: destinationAirport.code,
      destinationCity: destinationAirport.city,
      destinationName: destinationAirport.name,
      aircraftModel: aircraftLayouts.aircraftModel,
    })
    .from(bookings)
    .leftJoin(passengers, eq(passengers.bookingId, bookings.id))
    .leftJoin(seats, eq(passengers.selectedSeatId, seats.id))
    .innerJoin(flights, eq(bookings.flightId, flights.id))
    .innerJoin(originAirport, eq(flights.originId, originAirport.id))
    .innerJoin(destinationAirport, eq(flights.destinationId, destinationAirport.id))
    .leftJoin(aircraftLayouts, eq(flights.aircraftLayoutId, aircraftLayouts.id))
    .where(eq(bookings.pnr, upperPnr));

  const isValid = record && record.status === 'CONFIRMED';
  const qrCodeDataUrl = isValid ? await generateBoardingPassQRCode(upperPnr) : null;
  const verifiedAt = new Date().toUTCString();

  return (
    <div className="min-h-screen bg-[#f3ecd6] py-12 px-4 sm:px-6 flex flex-col justify-center items-center">
      <div className="max-w-xl w-full">
        {/* Top Wordmark */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="notary-mark" />
            <span className="font-display text-3xl font-normal tracking-tight text-[#1c1a14]">
              AEROFLOW
            </span>
          </Link>
          <span className="ui-caption text-[#6b6759] block mt-1">
            CARRIER DISPATCH // VERIFICATION PORTAL
          </span>
        </div>

        {/* Verification Card */}
        <div className="bg-[#ebe4cf] border border-[rgba(28,26,20,0.18)] rounded-[4px] shadow-sm overflow-hidden">
          {/* Validity Banner */}
          {isValid ? (
            <div className="bg-[#244232] text-[#f3ecd6] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-xs font-bold tracking-wider uppercase">
                  TICKET VALIDATED & CONFIRMED
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#f3ecd6]/80 uppercase">
                GATE READY
              </span>
            </div>
          ) : (
            <div className="bg-red-800 text-white px-6 py-4 flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold tracking-wider uppercase">
                ■ INVALID OR UNCONFIRMED PASSENGER RECORD
              </span>
            </div>
          )}

          {/* Verification Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {isValid ? (
              <>
                {/* Header Row */}
                <div className="flex justify-between items-start pb-6 border-b border-[rgba(28,26,20,0.12)]">
                  <div>
                    <span className="ui-caption text-[#6b6759] block">
                      ELECTRONIC BOARDING PASS
                    </span>
                    <h2 className="font-display text-2xl font-normal text-[#1c1a14] mt-0.5">
                      {record.passengerName}
                    </h2>
                    <span className="font-mono text-xs text-[#6b6759]">
                      TRAVEL DOCUMENT: {maskPassport(record.passportNumber)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="ui-caption text-[#6b6759] block">
                      PNR REFERENCE
                    </span>
                    <span className="font-mono text-2xl font-bold text-[#244232] tracking-widest">
                      {record.pnr}
                    </span>
                  </div>
                </div>

                {/* Route Visualizer */}
                <div className="py-2 flex justify-between items-center text-center">
                  <div className="text-left">
                    <div className="font-mono text-3xl font-bold text-[#1c1a14]">
                      {record.originCode}
                    </div>
                    <div className="text-xs text-[#6b6759]">
                      {record.originCity}
                    </div>
                  </div>

                  <div className="flex flex-col items-center px-4">
                    <span className="ui-caption text-[10px] text-[#244232] font-semibold mb-1">
                      FLIGHT {record.flightNumber}
                    </span>
                    <div className="w-28 sm:w-36 h-[1px] bg-[rgba(28,26,20,0.3)] relative flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-[#244232] rotate-45" />
                    </div>
                    <span className="font-mono text-[10px] text-[#6b6759] mt-1">
                      {record.aircraftModel || 'Boeing 787-9'}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-3xl font-bold text-[#1c1a14]">
                      {record.destinationCode}
                    </div>
                    <div className="text-xs text-[#6b6759]">
                      {record.destinationCity}
                    </div>
                  </div>
                </div>

                {/* Flight & Cabin Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 border border-[rgba(28,26,20,0.12)] bg-[#f3ecd6] rounded-[3px] font-mono text-xs">
                  <div>
                    <span className="text-[#6b6759] block text-[10px]">SEAT NUMBER</span>
                    <span className="font-bold text-base text-[#244232]">
                      {record.seatNumber}
                    </span>
                    <span className="block text-[10px] text-[#6b6759]">
                      {record.seatClass} Class
                    </span>
                  </div>

                  <div>
                    <span className="text-[#6b6759] block text-[10px]">LUGGAGE ALLOWANCE</span>
                    <span className="font-bold text-sm text-[#1c1a14]">
                      {record.baggageAllowanceKg} KG
                    </span>
                    <span className="block text-[10px] text-[#244232]">
                      VERIFIED CHECK-IN
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[#6b6759] block text-[10px]">BOARDING GROUP</span>
                    <span className="font-bold text-sm text-[#1c1a14]">
                      GROUP 1
                    </span>
                    <span className="block text-[10px] text-[#6b6759]">
                      PRIORITY ACCESS
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-[rgba(28,26,20,0.08)]">
                    <span className="text-[#6b6759] block text-[10px]">SCHEDULED DEPARTURE</span>
                    <span className="font-bold text-xs text-[#1c1a14]">
                      {formatDateTime(record.departureTime.toISOString())}
                    </span>
                  </div>
                </div>

                {/* QR Code & Security Stamp */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-[rgba(28,26,20,0.12)]">
                  {qrCodeDataUrl && (
                    <div className="p-2 bg-[#f3ecd6] border border-[rgba(28,26,20,0.16)] rounded-[3px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeDataUrl}
                        alt="Security QR Code"
                        width={96}
                        height={96}
                        className="w-24 h-24 block"
                      />
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left text-xs font-mono text-[#6b6759] space-y-1">
                    <p className="font-bold text-[#1c1a14]">
                      ■ AIRPORT SECURITY & GATE VERIFICATION
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      This electronic record has been verified against the AeroFlow carrier registry. Sensitive passenger credentials and payment data are withheld for privacy.
                    </p>
                    <p className="text-[10px] text-[#6b6759]/80">
                      TIMESTAMP: {verifiedAt}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 space-y-4 font-mono">
                <span className="notary-mark" />
                <h3 className="font-display text-xl text-[#1c1a14] font-normal">
                  No Confirmed Boarding Pass Found for PNR &ldquo;{upperPnr}&rdquo;
                </h3>
                <p className="text-xs text-[#6b6759] max-w-sm mx-auto leading-relaxed">
                  This record could not be validated. If you recently purchased a ticket, please wait a moment for payment settlement or verify with your booking reference.
                </p>
                <div className="pt-4">
                  <Link href="/" className="btn-primary !py-2.5 !px-6 text-xs">
                    RETURN TO HOMEPAGE
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-8 font-mono text-[11px] text-[#6b6759] space-y-1">
          <p>© 2026 AEROFLOW FLIGHT ENGINE. ALL RIGHTS RESERVED.</p>
          <p>DIRECT-CARRIER FLEET // NON-AGGREGATED OPS</p>
        </div>
      </div>
    </div>
  );
}
