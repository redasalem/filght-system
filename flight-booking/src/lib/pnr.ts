/**
 * PNR (Passenger Name Record) Generator
 *
 * Generates a 6-character alphanumeric code (e.g., 'AF7X9Q').
 * Excludes ambiguous characters: 0, O, 1, I, L to improve readability.
 */

const PNR_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const PNR_LENGTH = 6;

export function generatePNR(): string {
  let pnr = '';
  for (let i = 0; i < PNR_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * PNR_CHARSET.length);
    pnr += PNR_CHARSET[randomIndex];
  }
  return pnr;
}
