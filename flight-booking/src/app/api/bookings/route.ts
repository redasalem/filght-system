import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings, passengers, flights, airports, seats, aircraftLayouts } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pnr = searchParams.get('pnr');
    const sessionId = searchParams.get('session_id');
    const userId = searchParams.get('userId');

    const originAirport = alias(airports, 'originAirport');
    const destinationAirport = alias(airports, 'destinationAirport');

    let conditions = [];

    if (pnr) {
      conditions.push(eq(bookings.pnr, pnr.toUpperCase()));
    }

    if (userId) {
      conditions.push(eq(bookings.userId, userId));
    }

    // If session_id is provided and no direct PNR, we can also check Stripe metadata or flightId/userId
    if (sessionId && !pnr && !userId) {
      try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.metadata?.userId) {
          conditions.push(eq(bookings.userId, session.metadata.userId));
        }
      } catch (stripeErr) {
        console.warn('[AeroFlow Bookings API] Stripe session lookup warning:', stripeErr);
      }
    }

    if (conditions.length === 0) {
      return NextResponse.json(
        { error: 'Please provide pnr, userId, or session_id.' },
        { status: 400 }
      );
    }

    const results = await db
      .select({
        id: bookings.id,
        pnr: bookings.pnr,
        status: bookings.status,
        totalPrice: bookings.totalPrice,
        createdAt: bookings.createdAt,
        passenger: {
          id: passengers.id,
          fullName: passengers.fullName,
          passportNumber: passengers.passportNumber,
        },
        seat: {
          id: seats.id,
          seatNumber: seats.seatNumber,
          class: seats.class,
        },
        flight: {
          id: flights.id,
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
        },
      })
      .from(bookings)
      .leftJoin(passengers, eq(passengers.bookingId, bookings.id))
      .leftJoin(seats, eq(passengers.selectedSeatId, seats.id))
      .innerJoin(flights, eq(bookings.flightId, flights.id))
      .innerJoin(originAirport, eq(flights.originId, originAirport.id))
      .innerJoin(destinationAirport, eq(flights.destinationId, destinationAirport.id))
      .leftJoin(aircraftLayouts, eq(flights.aircraftLayoutId, aircraftLayouts.id))
      .where(or(...conditions))
      .orderBy(desc(bookings.createdAt));

    return NextResponse.json({ bookings: results });
  } catch (error) {
    console.error('[AeroFlow Bookings API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve bookings.' },
      { status: 500 }
    );
  }
}
