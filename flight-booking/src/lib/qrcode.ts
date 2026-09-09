import QRCode from 'qrcode';

/**
 * Returns the public application base URL for generating verification URLs.
 */
export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  );
}

/**
 * Generates the full public verification URL for a given PNR.
 */
export function getVerificationUrl(pnr: string): string {
  const baseUrl = getAppBaseUrl().replace(/\/+$/, '');
  return `${baseUrl}/verify/${encodeURIComponent(pnr.toUpperCase())}`;
}

/**
 * Generates a high-contrast, scannable Base64 Data URL for an electronic boarding pass.
 * Configured with Hemlock Paper palette (Ink #1c1a14 on Cream Paper #f3ecd6).
 *
 * @param pnr - The 6-character Passenger Name Record.
 * @returns Promise<string> - Base64 PNG data URL (data:image/png;base64,...)
 */
export async function generateBoardingPassQRCode(pnr: string): Promise<string> {
  const verificationUrl = getVerificationUrl(pnr);

  try {
    const dataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H', // High error tolerance for camera scans
      margin: 2,
      width: 320,
      color: {
        dark: '#1c1a14', // Ink
        light: '#f3ecd6', // Cream Paper
      },
    });

    return dataUrl;
  } catch (error) {
    console.error(`[AeroFlow QRCode] Failed to generate QR code for PNR ${pnr}:`, error);
    throw error;
  }
}
