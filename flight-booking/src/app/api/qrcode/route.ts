import { NextRequest, NextResponse } from 'next/server';
import { generateBoardingPassQRCode, getVerificationUrl } from '@/lib/qrcode';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pnr = searchParams.get('pnr');

    if (!pnr || pnr.trim().length === 0) {
      return NextResponse.json({ error: 'PNR is required.' }, { status: 400 });
    }

    const upperPnr = pnr.trim().toUpperCase();
    const qrCodeDataUrl = await generateBoardingPassQRCode(upperPnr);
    const verificationUrl = getVerificationUrl(upperPnr);

    return NextResponse.json({
      pnr: upperPnr,
      qrCodeDataUrl,
      verificationUrl,
    });
  } catch (error) {
    console.error('[AeroFlow QRCode API] Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate verification QR code.' },
      { status: 500 }
    );
  }
}
