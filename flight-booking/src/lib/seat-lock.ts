import { redis } from './redis';

/**
 * Seat Lock Configuration Constants
 */
export const SEAT_LOCK_TTL_SECONDS = 600; // 10 minutes TTL
export const SEAT_LOCK_KEY_PREFIX = 'seat_lock';

/**
 * Atomic Lua script to safely release a seat lock ONLY if it belongs to the specified user.
 * Prevents race conditions where a lock could expire and get re-acquired by another user
 * right before an unauthorized or delayed delete is invoked.
 */
const RELEASE_LOCK_LUA_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

/**
 * Generates the standardized Redis key for a seat lock.
 * Format: `seat_lock:{flightId}:{seatId}`
 */
export function getSeatLockKey(flightId: string, seatId: string): string {
  return `${SEAT_LOCK_KEY_PREFIX}:${flightId}:${seatId}`;
}

/**
 * 1. holdSeat
 *
 * Atomically locks a seat for 10 minutes (600 seconds) using Redis NX flag.
 *
 * @param flightId - The unique identifier of the flight.
 * @param seatId   - The unique identifier of the seat (e.g., seat UUID or seat number).
 * @param userId   - The identifier of the user attempting to lock the seat.
 * @returns Promise<boolean> - `true` if locked successfully, `false` if already taken/locked.
 */
export async function holdSeat(
  flightId: string,
  seatId: string,
  userId: string
): Promise<boolean> {
  if (!flightId || !seatId || !userId) {
    throw new Error('holdSeat: flightId, seatId, and userId are all required.');
  }

  const key = getSeatLockKey(flightId, seatId);

  try {
    // Equivalent to: SET seat_lock:{flightId}:{seatId} {userId} NX EX 600
    const result = await redis.set(key, userId, {
      nx: true,
      ex: SEAT_LOCK_TTL_SECONDS,
    });

    return result === 'OK';
  } catch (error) {
    console.error(`[AeroFlow SeatLock] Failed to hold seat ${seatId} on flight ${flightId}:`, error);
    throw error;
  }
}

/**
 * 2. releaseSeat
 *
 * Atomically unlocks the seat ONLY if it currently belongs to this user.
 * Employs a Lua script to ensure atomic check-and-delete.
 *
 * @param flightId - The unique identifier of the flight.
 * @param seatId   - The unique identifier of the seat.
 * @param userId   - The identifier of the user attempting to release the seat.
 * @returns Promise<boolean> - `true` if unlocked successfully, `false` if lock does not belong to user or does not exist.
 */
export async function releaseSeat(
  flightId: string,
  seatId: string,
  userId: string
): Promise<boolean> {
  if (!flightId || !seatId || !userId) {
    throw new Error('releaseSeat: flightId, seatId, and userId are all required.');
  }

  const key = getSeatLockKey(flightId, seatId);

  try {
    // Execute atomic check-and-delete Lua script
    const result = await redis.eval<number>(
      RELEASE_LOCK_LUA_SCRIPT,
      [key],
      [userId]
    );

    return result === 1;
  } catch (error) {
    console.error(`[AeroFlow SeatLock] Failed to release seat ${seatId} on flight ${flightId}:`, error);
    throw error;
  }
}

/**
 * 3. getLockedSeatsForFlight
 *
 * Retrieves all currently locked seat IDs for a given flight to render on the seat selection UI map.
 *
 * @param flightId - The unique identifier of the flight.
 * @returns Promise<string[]> - List of seat IDs currently locked in Redis.
 */
export async function getLockedSeatsForFlight(flightId: string): Promise<string[]> {
  if (!flightId) {
    throw new Error('getLockedSeatsForFlight: flightId is required.');
  }

  const pattern = `${SEAT_LOCK_KEY_PREFIX}:${flightId}:*`;
  const prefix = `${SEAT_LOCK_KEY_PREFIX}:${flightId}:`;

  try {
    const keys = await redis.keys(pattern);

    if (!keys || keys.length === 0) {
      return [];
    }

    // Extract seatId from the matched keys
    const lockedSeatIds = keys.map((key) => {
      if (key.startsWith(prefix)) {
        return key.slice(prefix.length);
      }
      // Fallback split in case of non-prefixed key matching
      const segments = key.split(':');
      return segments[2] || key;
    });

    return lockedSeatIds;
  } catch (error) {
    console.error(`[AeroFlow SeatLock] Failed to fetch locked seats for flight ${flightId}:`, error);
    throw error;
  }
}
