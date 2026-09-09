import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getVerificationUrl } from '@/lib/qrcode';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pnr = searchParams.get('pnr');

    if (!pnr || pnr.trim().length === 0) {
      return new NextResponse('PNR parameter is required', { status: 400 });
    }

    const upperPnr = pnr.trim().toUpperCase();
    const verificationUrl = getVerificationUrl(upperPnr);

    const buffer = await QRCode.toBuffer(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 280,
      color: {
        dark: '#1c1a14', // Ink
        light: '#f3ecd6', // Cream Paper
      },
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (error) {
    console.error('[AeroFlow QRCode Image API] Error:', error);
    return new NextResponse('Failed to generate QR code image', { status: 500 });
  }
}
