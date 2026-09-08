import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { seats } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { holdSeat, SEAT_LOCK_TTL_SECONDS } from '@/lib/seat-lock';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flightId, seatId, userId } = body as {
      flightId?: string;
      seatId?: string;
      userId?: string;
    };

    if (!flightId || !seatId || !userId) {
      return NextResponse.json(
        { error: 'flightId, seatId, and userId are required.' },
        { status: 400 }
      );
    }

    // 1. Verify seat is AVAILABLE in Postgres database
    const [dbSeat] = await db
      .select({ id: seats.id, status: seats.status })
      .from(seats)
      .where(eq(seats.id, seatId));

    if (!dbSeat) {
      return NextResponse.json({ error: 'Seat not found.' }, { status: 404 });
    }

    if (dbSeat.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Seat is already booked and unavailable.' },
        { status: 409 }
      );
    }

    // 2. Atomically acquire lock in Redis with NX flag and 10m TTL
    const locked = await holdSeat(flightId, seatId, userId);

    if (!locked) {
      return NextResponse.json(
        {
          success: false,
          error: 'This seat is currently held by another passenger. Please select another seat.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      flightId,
      seatId,
      userId,
      ttlSeconds: SEAT_LOCK_TTL_SECONDS,
      expiresAt: Date.now() + SEAT_LOCK_TTL_SECONDS * 1000,
    });
  } catch (error) {
    console.error('[AeroFlow API] Failed to hold seat:', error);
    return NextResponse.json(
      { error: 'Failed to hold seat in Redis.' },
      { status: 500 }
    );
  }
}
