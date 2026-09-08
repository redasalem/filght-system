import { db } from '@/db';
import {
  destinationGuides,
  flights,
  seats,
  airports,
} from '@/db/schema';
import { generateEmbedding } from '@/lib/embedding';
import { eq, and, gte, lte, sql, inArray } from 'drizzle-orm';
import { cosineDistance } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConciergeRequest {
  prompt: string;
  budget?: number;
  dateFrom?: string;
  dateTo?: string;
}

interface MatchedDestination {
  city: string;
  country: string;
  content: string;
  relevanceScore: number;
}

interface FlightResult {
  flightNumber: string;
  origin: { code: string; city: string; country: string };
  destination: { code: string; city: string; country: string };
  departureTime: Date;
  arrivalTime: Date;
  basePrice: string;
  availableSeats: {
    economy: number;
    business: number;
    first: number;
  };
  baggageInfo: {
    economy: { allowanceKg: number; extraPricePerKg: string };
    business: { allowanceKg: number; extraPricePerKg: string };
  };
}

interface ConciergeResponse {
  destinations: MatchedDestination[];
  flights: FlightResult[];
  suggestedFilters: {
    destinations: string[];
    dateRange: { from: string; to: string } | null;
    maxBudget: number | null;
  };
}

// ---------------------------------------------------------------------------
// Concierge Service (Read-Only)
// ---------------------------------------------------------------------------

/**
 * AI Concierge query engine.
 *
 * 1. Converts a natural language prompt to an embedding via Gemini.
 * 2. Finds the top matching destinations using pgvector cosine distance.
 * 3. Queries flights and available seats for those destinations.
 * 4. Returns structured results with suggested filters.
 *
 * This service is strictly READ-ONLY — it never modifies the database.
 */
export async function queryConcierge(
  request: ConciergeRequest
): Promise<ConciergeResponse> {
  // ------------------------------------------------------------------
  // Step 1: Generate embedding from user prompt
  // ------------------------------------------------------------------
  const queryEmbedding = await generateEmbedding(request.prompt);

  // ------------------------------------------------------------------
  // Step 2: pgvector cosine similarity search on destination_guides
  // ------------------------------------------------------------------
  const similarity = sql<number>`1 - (${cosineDistance(destinationGuides.embedding, queryEmbedding)})`;

  const matchedDestinations = await db
    .select({
      city: destinationGuides.city,
      country: destinationGuides.country,
      content: destinationGuides.content,
      relevanceScore: similarity,
    })
    .from(destinationGuides)
    .orderBy(sql`${cosineDistance(destinationGuides.embedding, queryEmbedding)} ASC`)
    .limit(3);

  if (matchedDestinations.length === 0) {
    return {
      destinations: [],
      flights: [],
      suggestedFilters: {
        destinations: [],
        dateRange: null,
        maxBudget: null,
      },
    };
  }

  // ------------------------------------------------------------------
  // Step 3: Match destination cities → airport codes
  // ------------------------------------------------------------------
  const destinationCities = matchedDestinations.map((d) => d.city);

  const matchedAirports = await db
    .select({
      id: airports.id,
      code: airports.code,
      city: airports.city,
      country: airports.country,
    })
    .from(airports)
    .where(inArray(airports.city, destinationCities));

  if (matchedAirports.length === 0) {
    return {
      destinations: matchedDestinations.map((d) => ({
        ...d,
        relevanceScore: Number(d.relevanceScore),
      })),
      flights: [],
      suggestedFilters: {
        destinations: destinationCities,
        dateRange: null,
        maxBudget: null,
      },
    };
  }

  const airportIds = matchedAirports.map((a) => a.id);
  const airportMap = new Map(matchedAirports.map((a) => [a.id, a]));

  // ------------------------------------------------------------------
  // Step 4: Query flights to those destinations
  // ------------------------------------------------------------------
  const originAirport = airports;
  // We need a second reference to airports for destination join
  // Using raw SQL for the destination airport join

  const flightConditions = [
    inArray(flights.destinationId, airportIds),
    gte(flights.departureTime, new Date()),
  ];

  if (request.budget) {
    flightConditions.push(
      lte(flights.basePrice, String(request.budget))
    );
  }

  if (request.dateFrom) {
    flightConditions.push(
      gte(flights.departureTime, new Date(request.dateFrom))
    );
  }

  if (request.dateTo) {
    flightConditions.push(
      lte(flights.departureTime, new Date(request.dateTo))
    );
  }

  const matchedFlights = await db
    .select({
      id: flights.id,
      flightNumber: flights.flightNumber,
      originId: flights.originId,
      destinationId: flights.destinationId,
      departureTime: flights.departureTime,
      arrivalTime: flights.arrivalTime,
      basePrice: flights.basePrice,
    })
    .from(flights)
    .where(and(...flightConditions))
    .orderBy(flights.departureTime)
    .limit(10);

  if (matchedFlights.length === 0) {
    return {
      destinations: matchedDestinations.map((d) => ({
        ...d,
        relevanceScore: Number(d.relevanceScore),
      })),
      flights: [],
      suggestedFilters: {
        destinations: destinationCities,
        dateRange: null,
        maxBudget: request.budget ?? null,
      },
    };
  }

  // Fetch origin airports for display
  const originIds = [...new Set(matchedFlights.map((f) => f.originId))];
  const originAirports = await db
    .select({
      id: airports.id,
      code: airports.code,
      city: airports.city,
      country: airports.country,
    })
    .from(airports)
    .where(inArray(airports.id, originIds));

  const allAirportMap = new Map([
    ...airportMap.entries(),
    ...originAirports.map((a) => [a.id, a] as const),
  ]);

  // ------------------------------------------------------------------
  // Step 5: Query available seats for each matched flight
  // ------------------------------------------------------------------
  const flightIds = matchedFlights.map((f) => f.id);

  const availableSeats = await db
    .select({
      flightId: seats.flightId,
      class: seats.class,
      baggageAllowanceKg: seats.baggageAllowanceKg,
      extraBaggagePricePerKg: seats.extraBaggagePricePerKg,
    })
    .from(seats)
    .where(
      and(
        inArray(seats.flightId, flightIds),
        eq(seats.status, 'AVAILABLE')
      )
    );

  // Group seats by flight
  const seatsByFlight = new Map<
    string,
    {
      economy: number;
      business: number;
      first: number;
      baggageInfo: {
        economy: { allowanceKg: number; extraPricePerKg: string };
        business: { allowanceKg: number; extraPricePerKg: string };
      };
    }
  >();

  for (const seat of availableSeats) {
    if (!seatsByFlight.has(seat.flightId)) {
      seatsByFlight.set(seat.flightId, {
        economy: 0,
        business: 0,
        first: 0,
        baggageInfo: {
          economy: { allowanceKg: 23, extraPricePerKg: '15.00' },
          business: { allowanceKg: 40, extraPricePerKg: '25.00' },
        },
      });
    }

    const flightSeats = seatsByFlight.get(seat.flightId)!;

    if (seat.class === 'Economy') {
      flightSeats.economy++;
      flightSeats.baggageInfo.economy = {
        allowanceKg: seat.baggageAllowanceKg,
        extraPricePerKg: seat.extraBaggagePricePerKg,
      };
    } else if (seat.class === 'Business') {
      flightSeats.business++;
      flightSeats.baggageInfo.business = {
        allowanceKg: seat.baggageAllowanceKg,
        extraPricePerKg: seat.extraBaggagePricePerKg,
      };
    } else if (seat.class === 'First') {
      flightSeats.first++;
    }
  }

  // ------------------------------------------------------------------
  // Step 6: Format the response
  // ------------------------------------------------------------------
  const flightResults: FlightResult[] = matchedFlights.map((f) => {
    const origin = allAirportMap.get(f.originId);
    const destination = allAirportMap.get(f.destinationId);
    const seatInfo = seatsByFlight.get(f.id) ?? {
      economy: 0,
      business: 0,
      first: 0,
      baggageInfo: {
        economy: { allowanceKg: 23, extraPricePerKg: '15.00' },
        business: { allowanceKg: 40, extraPricePerKg: '25.00' },
      },
    };

    return {
      flightNumber: f.flightNumber,
      origin: {
        code: origin?.code ?? 'N/A',
        city: origin?.city ?? 'Unknown',
        country: origin?.country ?? 'Unknown',
      },
      destination: {
        code: destination?.code ?? 'N/A',
        city: destination?.city ?? 'Unknown',
        country: destination?.country ?? 'Unknown',
      },
      departureTime: f.departureTime,
      arrivalTime: f.arrivalTime,
      basePrice: f.basePrice,
      availableSeats: {
        economy: seatInfo.economy,
        business: seatInfo.business,
        first: seatInfo.first,
      },
      baggageInfo: seatInfo.baggageInfo,
    };
  });

  // Compute suggested date range from matched flights
  const departureDates = matchedFlights.map((f) => f.departureTime);
  const earliestDate = new Date(Math.min(...departureDates.map((d) => d.getTime())));
  const latestDate = new Date(Math.max(...departureDates.map((d) => d.getTime())));

  // Compute max budget from matched flights
  const prices = matchedFlights.map((f) => parseFloat(f.basePrice));
  const maxPrice = Math.max(...prices);

  return {
    destinations: matchedDestinations.map((d) => ({
      ...d,
      relevanceScore: Number(d.relevanceScore),
    })),
    flights: flightResults,
    suggestedFilters: {
      destinations: destinationCities,
      dateRange: {
        from: earliestDate.toISOString().split('T')[0],
        to: latestDate.toISOString().split('T')[0],
      },
      maxBudget: Math.ceil(maxPrice),
    },
  };
}
