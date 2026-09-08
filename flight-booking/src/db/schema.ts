import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  vector,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ==========================================
// 1. ENUMS
// ==========================================

export const seatClassEnum = pgEnum('seat_class', ['Economy', 'Business', 'First']);

export const seatStatusEnum = pgEnum('seat_status', ['AVAILABLE', 'BOOKED']);

export const bookingStatusEnum = pgEnum('booking_status', [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
]);

// ==========================================
// 2. TABLES
// ==========================================

/**
 * Airports Table
 * Stores airport IATA codes, names, and geographic locations.
 */
export const airports = pgTable('airports', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 3 }).notNull().unique(), // IATA Code (e.g., 'CAI', 'DXB', 'JFK')
  name: text('name').notNull(),
  city: text('city').notNull(),
  country: text('country').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Aircraft Layouts Table
 * Defines the aircraft model, capacity, and seat layout matrix (JSON).
 */
export const aircraftLayouts = pgTable('aircraft_layouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  aircraftModel: text('aircraft_model').notNull(), // e.g., 'Boeing 787-9', 'Airbus A350'
  totalSeats: integer('total_seats').notNull(),
  seatConfiguration: jsonb('seat_configuration').notNull(), // Layout rows, columns, exits matrix
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Flights Table
 * Schedules flights between origin and destination airports.
 */
export const flights = pgTable(
  'flights',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flightNumber: varchar('flight_number', { length: 32 }).notNull(), // e.g., 'AF-101'
    originId: uuid('origin_id')
      .notNull()
      .references(() => airports.id, { onDelete: 'restrict' }),
    destinationId: uuid('destination_id')
      .notNull()
      .references(() => airports.id, { onDelete: 'restrict' }),
    aircraftLayoutId: uuid('aircraft_layout_id').references(() => aircraftLayouts.id, {
      onDelete: 'set null',
    }),
    departureTime: timestamp('departure_time', { withTimezone: true }).notNull(),
    arrivalTime: timestamp('arrival_time', { withTimezone: true }).notNull(),
    basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('flights_origin_idx').on(table.originId),
    index('flights_destination_idx').on(table.destinationId),
    index('flights_departure_time_idx').on(table.departureTime),
  ]
);

/**
 * Seats Table
 * Specific physical seats mapped per flight.
 * Concurrency locks are managed via Redis with 10-minute TTL,
 * and status transitions to 'BOOKED' in Postgres upon payment confirmation.
 */
export const seats = pgTable(
  'seats',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    flightId: uuid('flight_id')
      .notNull()
      .references(() => flights.id, { onDelete: 'cascade' }),
    seatNumber: varchar('seat_number', { length: 10 }).notNull(), // e.g., '12A'
    class: seatClassEnum('class').notNull().default('Economy'),
    baggageAllowanceKg: integer('baggage_allowance_kg').notNull().default(23),
    extraBaggagePricePerKg: numeric('extra_baggage_price_per_kg', {
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default('15.00'),
    status: seatStatusEnum('status').notNull().default('AVAILABLE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('flight_seat_unique_idx').on(table.flightId, table.seatNumber),
    index('seats_flight_status_idx').on(table.flightId, table.status),
  ]
);

/**
 * Bookings Table
 * Represents an airline booking linked to a Clerk user and Stripe payment intent.
 */
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    pnr: varchar('pnr', { length: 10 }).notNull().unique(), // Passenger Name Record (e.g. 'AF7X9Q')
    flightId: uuid('flight_id')
      .notNull()
      .references(() => flights.id, { onDelete: 'restrict' }),
    userId: text('user_id').notNull(), // Clerk User ID (e.g., 'user_2...')
    totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
    status: bookingStatusEnum('status').notNull().default('PENDING'),
    stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('bookings_user_id_idx').on(table.userId),
    index('bookings_flight_id_idx').on(table.flightId),
  ]
);

/**
 * Passengers Table
 * Individual passengers associated with a booking and an assigned seat.
 */
export const passengers = pgTable('passengers', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(),
  passportNumber: text('passport_number').notNull(),
  selectedSeatId: uuid('selected_seat_id').references(() => seats.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Destination Guides Table (pgvector)
 * Vector embeddings (1536 dimensions, e.g., OpenAI text-embedding-3-small)
 * with an HNSW cosine index for AI semantic travel concierge queries.
 */
export const destinationGuides = pgTable(
  'destination_guides',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    city: text('city').notNull(),
    country: text('country').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 768 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('destination_guides_embedding_hnsw_idx').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops')
    ),
    index('destination_guides_city_country_idx').on(table.city, table.country),
  ]
);

/**
 * Processed Events Table (Webhook Idempotency)
 * Stores Stripe event IDs to ensure idempotent webhook handling and prevent duplicate ticket creation.
 */
export const processedEvents = pgTable('processed_events', {
  id: text('id').primaryKey(), // stripe_event_id (e.g., 'evt_1Oq...')
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 3. RELATIONS
// ==========================================

export const airportsRelations = relations(airports, ({ many }) => ({
  departingFlights: many(flights, { relationName: 'originAirport' }),
  arrivingFlights: many(flights, { relationName: 'destinationAirport' }),
}));

export const aircraftLayoutsRelations = relations(aircraftLayouts, ({ many }) => ({
  flights: many(flights),
}));

export const flightsRelations = relations(flights, ({ one, many }) => ({
  origin: one(airports, {
    fields: [flights.originId],
    references: [airports.id],
    relationName: 'originAirport',
  }),
  destination: one(airports, {
    fields: [flights.destinationId],
    references: [airports.id],
    relationName: 'destinationAirport',
  }),
  aircraftLayout: one(aircraftLayouts, {
    fields: [flights.aircraftLayoutId],
    references: [aircraftLayouts.id],
  }),
  seats: many(seats),
  bookings: many(bookings),
}));

export const seatsRelations = relations(seats, ({ one }) => ({
  flight: one(flights, {
    fields: [seats.flightId],
    references: [flights.id],
  }),
  passenger: one(passengers, {
    fields: [seats.id],
    references: [passengers.selectedSeatId],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  flight: one(flights, {
    fields: [bookings.flightId],
    references: [flights.id],
  }),
  passengers: many(passengers),
}));

export const passengersRelations = relations(passengers, ({ one }) => ({
  booking: one(bookings, {
    fields: [passengers.bookingId],
    references: [bookings.id],
  }),
  seat: one(seats, {
    fields: [passengers.selectedSeatId],
    references: [seats.id],
  }),
}));

// ==========================================
// 4. INFERRED TYPES
// ==========================================

export type Airport = typeof airports.$inferSelect;
export type NewAirport = typeof airports.$inferInsert;

export type AircraftLayout = typeof aircraftLayouts.$inferSelect;
export type NewAircraftLayout = typeof aircraftLayouts.$inferInsert;

export type Flight = typeof flights.$inferSelect;
export type NewFlight = typeof flights.$inferInsert;

export type Seat = typeof seats.$inferSelect;
export type NewSeat = typeof seats.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export type Passenger = typeof passengers.$inferSelect;
export type NewPassenger = typeof passengers.$inferInsert;

export type DestinationGuide = typeof destinationGuides.$inferSelect;
export type NewDestinationGuide = typeof destinationGuides.$inferInsert;

export type ProcessedEvent = typeof processedEvents.$inferSelect;
export type NewProcessedEvent = typeof processedEvents.$inferInsert;
