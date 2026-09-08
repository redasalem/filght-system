import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { flights, airports, aircraftLayouts, seats } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getLockedSeatsForFlight } from '@/lib/seat-lock';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flightId } = await params;

    if (!flightId) {
      return NextResponse.json({ error: 'Flight ID is required' }, { status: 400 });
    }

    const originAirport = alias(airports, 'originAirport');
    const destinationAirport = alias(airports, 'destinationAirport');

    const [flight] = await db
      .select({
        id: flights.id,
        flightNumber: flights.flightNumber,
        departureTime: flights.departureTime,
        arrivalTime: flights.arrivalTime,
        basePrice: flights.basePrice,
        origin: {
          id: originAirport.id,
          code: originAirport.code,
          name: originAirport.name,
          city: originAirport.city,
          country: originAirport.country,
        },
        destination: {
          id: destinationAirport.id,
          code: destinationAirport.code,
          name: destinationAirport.name,
          city: destinationAirport.city,
          country: destinationAirport.country,
        },
        aircraft: {
          id: aircraftLayouts.id,
          model: aircraftLayouts.aircraftModel,
          totalSeats: aircraftLayouts.totalSeats,
          configuration: aircraftLayouts.seatConfiguration,
        },
      })
      .from(flights)
      .innerJoin(originAirport, eq(flights.originId, originAirport.id))
      .innerJoin(destinationAirport, eq(flights.destinationId, destinationAirport.id))
      .leftJoin(aircraftLayouts, eq(flights.aircraftLayoutId, aircraftLayouts.id))
      .where(eq(flights.id, flightId));

    if (!flight) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }

    // Fetch all physical seats for this flight
    const flightSeats = await db
      .select({
        id: seats.id,
        seatNumber: seats.seatNumber,
        class: seats.class,
        baggageAllowanceKg: seats.baggageAllowanceKg,
        extraBaggagePricePerKg: seats.extraBaggagePricePerKg,
        status: seats.status,
      })
      .from(seats)
      .where(eq(seats.flightId, flightId))
      .orderBy(asc(seats.seatNumber));

    // Fetch real-time locked seats from Redis
    let lockedSeatIds: string[] = [];
    try {
      lockedSeatIds = await getLockedSeatsForFlight(flightId);
    } catch (redisErr) {
      console.warn('[AeroFlow API] Failed to fetch Redis seat locks:', redisErr);
    }

    const lockedSet = new Set(lockedSeatIds);

    const enrichedSeats = flightSeats.map((seat) => {
      const isLocked = lockedSet.has(seat.id);
      const isSelectable = seat.status === 'AVAILABLE' && !isLocked;

      return {
        ...seat,
        isLockedInRedis: isLocked,
        isSelectable,
      };
    });

    return NextResponse.json({
      flight,
      seats: enrichedSeats,
      lockedSeatIds,
    });
  } catch (error) {
    console.error('[AeroFlow API] Failed to fetch flight details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flight details.' },
      { status: 500 }
    );
  }
}
