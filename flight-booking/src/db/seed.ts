import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { db } from './index';
import {
  airports,
  aircraftLayouts,
  flights,
  seats,
  destinationGuides,
} from './schema';
import { sql } from 'drizzle-orm';

function createDummyEmbedding(seed: number): number[] {
  // Generates normalized 768-dimension float vector for pgvector (Gemini text-embedding-004)
  const vec = new Array(768).fill(0).map((_, i) => Math.sin(seed + i * 0.1));
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return vec.map((val) => val / norm);
}

async function seed() {
  console.log('🌱 Starting AeroFlow database seed...');

  // 1. Airports
  console.log('Inserting airports...');
  const insertedAirports = await db
    .insert(airports)
    .values([
      { code: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt' },
      { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates' },
      { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom' },
      { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States' },
      { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
    ])
    .onConflictDoNothing()
    .returning();

  // If already existed, fetch them
  const allAirports = await db.select().from(airports);
  const airportMap = new Map(allAirports.map((a) => [a.code, a.id]));

  // 2. Aircraft Layouts
  console.log('Inserting aircraft layouts...');
  const [b787] = await db
    .insert(aircraftLayouts)
    .values([
      {
        aircraftModel: 'Boeing 787-9 Dreamliner',
        totalSeats: 24,
        seatConfiguration: {
          classes: {
            Business: { rows: ['1', '2'], seatsPerRow: ['A', 'B', 'E', 'F'] },
            Economy: { rows: ['10', '11', '12', '13'], seatsPerRow: ['A', 'B', 'C', 'D'] },
          },
        },
      },
    ])
    .onConflictDoNothing()
    .returning();

  const layoutId = b787?.id || (await db.select().from(aircraftLayouts).limit(1))[0].id;

  // 3. Flights
  console.log('Scheduling flights...');
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const inTwoDays = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const inThreeDays = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const sampleFlights = [
    {
      flightNumber: 'AF-101',
      originId: airportMap.get('CAI')!,
      destinationId: airportMap.get('DXB')!,
      aircraftLayoutId: layoutId,
      departureTime: new Date(tomorrow.setHours(9, 30, 0, 0)),
      arrivalTime: new Date(tomorrow.getTime() + 3.5 * 3600 * 1000),
      basePrice: '380.00',
    },
    {
      flightNumber: 'AF-201',
      originId: airportMap.get('CAI')!,
      destinationId: airportMap.get('LHR')!,
      aircraftLayoutId: layoutId,
      departureTime: new Date(inTwoDays.setHours(14, 0, 0, 0)),
      arrivalTime: new Date(inTwoDays.getTime() + 5.5 * 3600 * 1000),
      basePrice: '520.00',
    },
    {
      flightNumber: 'AF-301',
      originId: airportMap.get('LHR')!,
      destinationId: airportMap.get('JFK')!,
      aircraftLayoutId: layoutId,
      departureTime: new Date(inThreeDays.setHours(11, 15, 0, 0)),
      arrivalTime: new Date(inThreeDays.getTime() + 8 * 3600 * 1000),
      basePrice: '690.00',
    },
    {
      flightNumber: 'AF-401',
      originId: airportMap.get('CAI')!,
      destinationId: airportMap.get('CDG')!,
      aircraftLayoutId: layoutId,
      departureTime: new Date(inTwoDays.setHours(7, 45, 0, 0)),
      arrivalTime: new Date(inTwoDays.getTime() + 4.5 * 3600 * 1000),
      basePrice: '460.00',
    },
  ];

  for (const f of sampleFlights) {
    const [insertedFlight] = await db
      .insert(flights)
      .values(f)
      .returning();

    if (insertedFlight) {
      console.log(`Generating seats for flight ${insertedFlight.flightNumber}...`);
      const seatEntries = [
        // Business Seats
        { flightId: insertedFlight.id, seatNumber: '1A', class: 'Business' as const, baggageAllowanceKg: 40, extraBaggagePricePerKg: '25.00' },
        { flightId: insertedFlight.id, seatNumber: '1B', class: 'Business' as const, baggageAllowanceKg: 40, extraBaggagePricePerKg: '25.00' },
        { flightId: insertedFlight.id, seatNumber: '2A', class: 'Business' as const, baggageAllowanceKg: 40, extraBaggagePricePerKg: '25.00' },
        { flightId: insertedFlight.id, seatNumber: '2B', class: 'Business' as const, baggageAllowanceKg: 40, extraBaggagePricePerKg: '25.00' },
        // Economy Seats
        { flightId: insertedFlight.id, seatNumber: '10A', class: 'Economy' as const, baggageAllowanceKg: 23, extraBaggagePricePerKg: '15.00' },
        { flightId: insertedFlight.id, seatNumber: '10B', class: 'Economy' as const, baggageAllowanceKg: 23, extraBaggagePricePerKg: '15.00' },
        { flightId: insertedFlight.id, seatNumber: '10C', class: 'Economy' as const, baggageAllowanceKg: 23, extraBaggagePricePerKg: '15.00' },
        { flightId: insertedFlight.id, seatNumber: '10D', class: 'Economy' as const, baggageAllowanceKg: 23, extraBaggagePricePerKg: '15.00' },
        { flightId: insertedFlight.id, seatNumber: '11A', class: 'Economy' as const, baggageAllowanceKg: 23, extraBaggagePricePerKg: '15.00' },
        { flightId: insertedFlight.id, seatNumber: '11B', class: 'Economy' as const, baggageAllowanceKg: 23, extraBaggagePricePerKg: '15.00' },
        { flightId: insertedFlight.id, seatNumber: '11C', class: 'Economy' as const, baggageAllowanceKg: 23, extraBaggagePricePerKg: '15.00' },
        { flightId: insertedFlight.id, seatNumber: '11D', class: 'Economy' as const, baggageAllowanceKg: 23, extraBaggagePricePerKg: '15.00' },
      ];

      await db.insert(seats).values(seatEntries).onConflictDoNothing();
    }
  }

  // 4. Destination Guides (AI Semantic Search with pgvector)
  console.log('Inserting destination guides with pgvector embeddings...');
  await db
    .insert(destinationGuides)
    .values([
      {
        city: 'Dubai',
        country: 'United Arab Emirates',
        content: 'Experience futuristic skyscrapers, luxury desert safaris, world-class shopping, and the iconic Burj Khalifa.',
        embedding: createDummyEmbedding(42),
      },
      {
        city: 'London',
        country: 'United Kingdom',
        content: 'Historic landmarks, West End theatre, royal palaces, world-class museums, and vibrant cultural neighborhoods.',
        embedding: createDummyEmbedding(84),
      },
      {
        city: 'Paris',
        country: 'France',
        content: 'The city of light and art, renowned for haute cuisine, the Eiffel Tower, the Louvre museum, and romantic Seine riverwalks.',
        embedding: createDummyEmbedding(126),
      },
      {
        city: 'New York',
        country: 'United States',
        content: 'The vibrant metropolis of Broadway, Central Park, diverse culinary culture, world finance, and modern architecture.',
        embedding: createDummyEmbedding(168),
      },
      {
        city: 'Cairo',
        country: 'Egypt',
        content: 'Cradle of ancient civilization, home to the Great Pyramids of Giza, the Nile river, and rich historic bazaars.',
        embedding: createDummyEmbedding(210),
      },
    ])
    .onConflictDoNothing();

  console.log('✅ Database successfully seeded!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});
