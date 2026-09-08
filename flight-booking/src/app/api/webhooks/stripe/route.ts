import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  processedEvents,
  bookings,
  passengers,
  seats,
} from '@/db/schema';
import { getStripe } from '@/lib/stripe';
import { generatePNR } from '@/lib/pnr';
import { redis } from '@/lib/redis';
import { getSeatLockKey } from '@/lib/seat-lock';

export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// POST /api/webhooks/stripe
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // ------------------------------------------------------------------
  // 1. Read raw body & verify Stripe signature
  // ------------------------------------------------------------------
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[AeroFlow Webhook] STRIPE_WEBHOOK_SECRET is not configured.');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[AeroFlow Webhook] Signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  // ------------------------------------------------------------------
  // 2. Only handle checkout.session.completed
  // ------------------------------------------------------------------
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const metadata = session.metadata;

  if (!metadata) {
    console.error('[AeroFlow Webhook] Session is missing metadata.');
    return NextResponse.json(
      { error: 'Session metadata is missing' },
      { status: 400 }
    );
  }

  const { flightId, seatId, userId, passengerName, passportNumber } = metadata;

  if (!flightId || !seatId || !userId || !passengerName || !passportNumber) {
    console.error('[AeroFlow Webhook] Incomplete session metadata:', metadata);
    return NextResponse.json(
      { error: 'Incomplete session metadata' },
      { status: 400 }
    );
  }

  // ------------------------------------------------------------------
  // 3. Idempotent processing — single Drizzle transaction
  // ------------------------------------------------------------------
  const totalPrice = session.amount_total
    ? (session.amount_total / 100).toFixed(2)
    : '0.00';

  let bookingId: string;

  try {
    bookingId = await db.transaction(async (tx) => {
      // 3a. Insert idempotency record (duplicate → unique constraint error)
      await tx.insert(processedEvents).values({ id: event.id });

      // 3b. Create booking with 6-character PNR, status = CONFIRMED
      const pnr = generatePNR();

      const [newBooking] = await tx
        .insert(bookings)
        .values({
          pnr,
          flightId,
          userId,
          totalPrice,
          status: 'CONFIRMED',
        })
        .returning({ id: bookings.id });

      // 3c. Create passenger record linked to booking & seat
      await tx.insert(passengers).values({
        bookingId: newBooking.id,
        fullName: passengerName,
        passportNumber,
        selectedSeatId: seatId,
      });

      // 3d. Mark seat as BOOKED
      await tx
        .update(seats)
        .set({ status: 'BOOKED' })
        .where(eq(seats.id, seatId));

      return newBooking.id;
    });
  } catch (error: unknown) {
    // Check for unique constraint violation on processed_events (idempotency)
    const isDuplicate =
      error instanceof Error &&
      (error.message.includes('duplicate key') ||
        error.message.includes('unique constraint'));

    if (isDuplicate) {
      console.log(
        `[AeroFlow Webhook] Event ${event.id} already processed — skipping (idempotent).`
      );
      return NextResponse.json({ received: true, duplicate: true });
    }

    console.error('[AeroFlow Webhook] Transaction failed:', error);
    return NextResponse.json(
      { error: 'Internal server error during booking creation' },
      { status: 500 }
    );
  }

  // ------------------------------------------------------------------
  // 4. Release Redis seat lock (best-effort, outside transaction)
  // ------------------------------------------------------------------
  try {
    const lockKey = getSeatLockKey(flightId, seatId);
    await redis.del(lockKey);
  } catch (redisError) {
    // Non-fatal: the lock will auto-expire via TTL (10 minutes)
    console.warn(
      `[AeroFlow Webhook] Failed to release Redis lock for seat ${seatId} on flight ${flightId}. Lock will expire via TTL.`,
      redisError
    );
  }

  // ------------------------------------------------------------------
  // 5. Success
  // ------------------------------------------------------------------
  console.log(
    `[AeroFlow Webhook] ✅ Booking ${bookingId} confirmed for event ${event.id}`
  );

  return NextResponse.json({ received: true, bookingId });
}
