import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { flights, seats, airports } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getStripe } from '@/lib/stripe';
import { redis } from '@/lib/redis';
import { getSeatLockKey } from '@/lib/seat-lock';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      flightId,
      seatId,
      userId,
      passengerName,
      passportNumber,
      extraBaggageKg = 0,
    } = body as {
      flightId?: string;
      seatId?: string;
      userId?: string;
      passengerName?: string;
      passportNumber?: string;
      extraBaggageKg?: number;
    };

    if (!flightId || !seatId || !userId || !passengerName || !passportNumber) {
      return NextResponse.json(
        { error: 'Missing required booking information.' },
        { status: 400 }
      );
    }

    // 1. Verify Redis seat lock is active and owned by this user
    const lockKey = getSeatLockKey(flightId, seatId);
    const lockOwner = (await redis.get(lockKey)) as string | null;

    if (!lockOwner || lockOwner !== userId) {
      return NextResponse.json(
        {
          error:
            'Seat reservation lock has expired or is invalid. Please select your seat again.',
        },
        { status: 409 }
      );
    }

    // 2. Query Flight & Seat data
    const originAirport = alias(airports, 'originAirport');
    const destinationAirport = alias(airports, 'destinationAirport');

    const [flight] = await db
      .select({
        id: flights.id,
        flightNumber: flights.flightNumber,
        basePrice: flights.basePrice,
        originCode: originAirport.code,
        originCity: originAirport.city,
        destinationCode: destinationAirport.code,
        destinationCity: destinationAirport.city,
      })
      .from(flights)
      .innerJoin(originAirport, eq(flights.originId, originAirport.id))
      .innerJoin(destinationAirport, eq(flights.destinationId, destinationAirport.id))
      .where(eq(flights.id, flightId));

    if (!flight) {
      return NextResponse.json({ error: 'Flight not found.' }, { status: 404 });
    }

    const [seat] = await db
      .select({
        id: seats.id,
        seatNumber: seats.seatNumber,
        class: seats.class,
        status: seats.status,
        extraBaggagePricePerKg: seats.extraBaggagePricePerKg,
      })
      .from(seats)
      .where(eq(seats.id, seatId));

    if (!seat || seat.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Seat is not available for booking.' },
        { status: 409 }
      );
    }

    // 3. Calculate Line Items
    const basePriceNum = parseFloat(flight.basePrice);
    const classMultiplier = seat.class === 'Business' ? 1.5 : seat.class === 'First' ? 2.2 : 1.0;
    const ticketPrice = Math.round(basePriceNum * classMultiplier);

    const extraKg = Math.max(0, Number(extraBaggageKg) || 0);
    const baggagePerKgPrice = parseFloat(seat.extraBaggagePricePerKg) || 15.0;
    const baggageTotal = Math.round(extraKg * baggagePerKgPrice);

    const originUrl =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    const lineItems: any[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `AeroFlow Flight ${flight.flightNumber}: ${flight.originCode} → ${flight.destinationCode}`,
            description: `Seat ${seat.seatNumber} (${seat.class} Class) • Passenger: ${passengerName}`,
          },
          unit_amount: ticketPrice * 100, // cents
        },
        quantity: 1,
      },
    ];

    if (baggageTotal > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Extra Baggage (${extraKg} kg @ $${baggagePerKgPrice}/kg)`,
            description: `Additional baggage allowance for flight ${flight.flightNumber}`,
          },
          unit_amount: baggageTotal * 100,
        },
        quantity: 1,
      },);
    }

    // 4. Create Stripe Checkout Session with verified metadata
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      metadata: {
        flightId,
        seatId,
        userId,
        passengerName,
        passportNumber,
      },
      success_url: `${originUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&flightId=${flightId}&seatId=${seatId}`,
      cancel_url: `${originUrl}/?cancelled=true`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('[AeroFlow Checkout API] Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment session.' },
      { status: 500 }
    );
  }
}
