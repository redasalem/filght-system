import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { flights, airports, aircraftLayouts, seats } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin'); // airport code or id
    const destination = searchParams.get('destination'); // airport code or id
    const date = searchParams.get('date'); // YYYY-MM-DD

    const originAirport = alias(airports, 'originAirport');
    const destinationAirport = alias(airports, 'destinationAirport');

    let conditions = [];

    if (origin) {
      conditions.push(
        sql`(${originAirport.code} = ${origin.toUpperCase()} OR ${originAirport.id}::text = ${origin})`
      );
    }

    if (destination) {
      conditions.push(
        sql`(${destinationAirport.code} = ${destination.toUpperCase()} OR ${destinationAirport.id}::text = ${destination})`
      );
    }

    if (date) {
      const startDate = new Date(`${date}T00:00:00.000Z`);
      const endDate = new Date(`${date}T23:59:59.999Z`);
      conditions.push(gte(flights.departureTime, startDate));
      conditions.push(lte(flights.departureTime, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Query flights with airports, aircraft layout, and seat counts
    const results = await db
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
        },
      })
      .from(flights)
      .innerJoin(originAirport, eq(flights.originId, originAirport.id))
      .innerJoin(destinationAirport, eq(flights.destinationId, destinationAirport.id))
      .leftJoin(aircraftLayouts, eq(flights.aircraftLayoutId, aircraftLayouts.id))
      .where(whereClause)
      .orderBy(flights.departureTime);

    // Fetch seat counts per flight
    const flightIds = results.map((f) => f.id);
    const seatCounts =
      flightIds.length > 0
        ? await db
            .select({
              flightId: seats.flightId,
              availableCount: sql<number>`count(*) filter (where ${seats.status} = 'AVAILABLE')::int`,
              totalCount: sql<number>`count(*)::int`,
            })
            .from(seats)
            .where(sql`${seats.flightId} IN (${sql.join(flightIds.map((id) => sql`${id}`), sql`, `)})`)
            .groupBy(seats.flightId)
        : [];

    const seatCountMap = new Map(
      seatCounts.map((s) => [s.flightId, { available: s.availableCount, total: s.totalCount }])
    );

    const enrichedFlights = results.map((flight) => {
      const counts = seatCountMap.get(flight.id) || { available: 0, total: 0 };
      return {
        ...flight,
        seatsAvailable: counts.available,
        totalSeats: counts.total || flight.aircraft?.totalSeats || 0,
      };
    });

    return NextResponse.json({ flights: enrichedFlights });
  } catch (error) {
    console.error('[AeroFlow API] Failed to query flights:', error);
    return NextResponse.json(
      { error: 'Failed to query flights.' },
      { status: 500 }
    );
  }
}
