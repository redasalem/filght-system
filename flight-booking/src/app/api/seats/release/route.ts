import { NextRequest, NextResponse } from 'next/server';
import { releaseSeat } from '@/lib/seat-lock';

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

    const released = await releaseSeat(flightId, seatId, userId);

    return NextResponse.json({ success: released });
  } catch (error) {
    console.error('[AeroFlow API] Failed to release seat:', error);
    return NextResponse.json(
      { error: 'Failed to release seat in Redis.' },
      { status: 500 }
    );
  }
}
