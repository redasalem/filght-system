import { NextRequest, NextResponse } from 'next/server';
import { queryConcierge } from '@/lib/concierge';

export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// POST /api/concierge
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { prompt, budget, dateFrom, dateTo } = body as {
      prompt?: string;
      budget?: number;
      dateFrom?: string;
      dateTo?: string;
    };

    // Validate required field
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'A non-empty "prompt" field is required.' },
        { status: 400 }
      );
    }

    // Query the AI Concierge (read-only)
    const result = await queryConcierge({
      prompt: prompt.trim(),
      budget: budget ? Number(budget) : undefined,
      dateFrom,
      dateTo,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AeroFlow Concierge] Error:', message);

    // Return user-friendly error for missing API key
    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please set GEMINI_API_KEY.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process concierge query.' },
      { status: 500 }
    );
  }
}
