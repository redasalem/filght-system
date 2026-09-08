import { NextResponse } from 'next/server';
import { db } from '@/db';
import { airports } from '@/db/schema';
import { asc } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const list = await db
      .select({
        id: airports.id,
        code: airports.code,
        name: airports.name,
        city: airports.city,
        country: airports.country,
      })
      .from(airports)
      .orderBy(asc(airports.city));

    return NextResponse.json({ airports: list });
  } catch (error) {
    console.error('[AeroFlow API] Failed to fetch airports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch airports.' },
      { status: 500 }
    );
  }
}
