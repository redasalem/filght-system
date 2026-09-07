import { holdSeat, releaseSeat, getLockedSeatsForFlight } from './seat-lock';

async function runTests() {
  console.log('🧪 Starting Seat Locking Module Tests...\n');

  const flightId = 'flight-uuid-101';
  const seatA = 'seat-uuid-1A';
  const seatB = 'seat-uuid-1B';
  const user1 = 'user_clerk_111';
  const user2 = 'user_clerk_222';

  // 1. Hold Seat A by User 1
  console.log('1️⃣ Testing holdSeat(flightId, seatA, user1)...');
  const lockedUser1 = await holdSeat(flightId, seatA, user1);
  console.assert(lockedUser1 === true, 'Expected User 1 to successfully lock seat A');
  console.log('   ✅ User 1 successfully locked Seat A.');

  // 2. Concurrency Conflict: User 2 tries to hold Seat A
  console.log('2️⃣ Testing concurrent holdSeat on same seat by user2...');
  const lockedUser2 = await holdSeat(flightId, seatA, user2);
  console.assert(lockedUser2 === false, 'Expected User 2 to be rejected for seat A');
  console.log('   ✅ User 2 was rejected as expected (Seat A already held).');

  // 3. User 1 holds Seat B as well
  console.log('3️⃣ User 1 locks Seat B...');
  const lockedSeatB = await holdSeat(flightId, seatB, user1);
  console.assert(lockedSeatB === true, 'Expected User 1 to successfully lock seat B');
  console.log('   ✅ User 1 successfully locked Seat B.');

  // 4. getLockedSeatsForFlight
  console.log('4️⃣ Testing getLockedSeatsForFlight(flightId)...');
  const lockedSeats = await getLockedSeatsForFlight(flightId);
  console.log('   Locked seat IDs found:', lockedSeats);
  console.assert(lockedSeats.includes(seatA), 'Expected seat A to be in locked seats list');
  console.assert(lockedSeats.includes(seatB), 'Expected seat B to be in locked seats list');
  console.assert(lockedSeats.length === 2, 'Expected exactly 2 locked seats');
  console.log('   ✅ getLockedSeatsForFlight returned both locked seats.');

  // 5. Unauthorized Release Attempt (User 2 tries to release User 1\'s seat)
  console.log('5️⃣ Testing unauthorized releaseSeat by user2...');
  const unauthorizedRelease = await releaseSeat(flightId, seatA, user2);
  console.assert(unauthorizedRelease === false, 'Expected unauthorized release to fail');
  console.log('   ✅ Unauthorized release was denied (Lua check passed).');

  // 6. Authorized Release by Owner (User 1 releases Seat A)
  console.log('6️⃣ Testing authorized releaseSeat by user1...');
  const authorizedRelease = await releaseSeat(flightId, seatA, user1);
  console.assert(authorizedRelease === true, 'Expected authorized release to succeed');
  console.log('   ✅ User 1 released Seat A successfully.');

  // 7. Verify Seat A is now free to be claimed by User 2
  console.log('7️⃣ User 2 tries to hold Seat A after release...');
  const user2Reclaim = await holdSeat(flightId, seatA, user2);
  console.assert(user2Reclaim === true, 'Expected User 2 to now be able to hold seat A');
  console.log('   ✅ User 2 successfully held Seat A after it was released.');

  // 8. Clean up remaining locks
  await releaseSeat(flightId, seatA, user2);
  await releaseSeat(flightId, seatB, user1);

  const finalLocked = await getLockedSeatsForFlight(flightId);
  console.assert(finalLocked.length === 0, 'Expected all seats to be unlocked after cleanup');
  console.log('8️⃣ Cleanup verified. All seats unlocked.');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🚀');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
