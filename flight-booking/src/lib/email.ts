import { Resend } from 'resend';
import { getVerificationUrl } from './qrcode';

let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!_resend && process.env.RESEND_API_KEY) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export interface BoardingPassEmailParams {
  recipientEmail: string;
  passengerName: string;
  pnr: string;
  flightNumber: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  departureTime: string;
  seatNumber: string;
  seatClass: string;
  baggageAllowanceKg: number;
  qrCodeDataUrl: string;
}

/**
 * Sends a confirmation email containing the official Electronic Boarding Pass and embedded QR Code.
 */
export async function sendBoardingPassEmail(params: BoardingPassEmailParams) {
  const {
    recipientEmail,
    passengerName,
    pnr,
    flightNumber,
    originCode,
    originCity,
    destinationCode,
    destinationCity,
    departureTime,
    seatNumber,
    seatClass,
    baggageAllowanceKg,
    qrCodeDataUrl,
  } = params;

  const verificationUrl = getVerificationUrl(pnr);
  const client = getResendClient();

  if (!client) {
    console.log(
      `[AeroFlow Email] RESEND_API_KEY is not configured. Simulating email dispatch to: ${recipientEmail} for PNR ${pnr}`
    );
    return { success: true, simulated: true };
  }

  const formattedDate = (() => {
    try {
      return new Date(departureTime).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return departureTime;
    }
  })();

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AeroFlow Boarding Pass — Flight ${flightNumber} (${pnr})</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f3ecd6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1a14;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ebe4cf; border: 1px solid rgba(28,26,20,0.16); border-radius: 4px; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 24px 32px; border-bottom: 1px solid rgba(28,26,20,0.12); background-color: #ebe4cf;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="display: inline-block; width: 8px; height: 8px; background-color: #244232; margin-right: 8px; vertical-align: middle;"></span>
              <span style="font-family: Georgia, serif; font-size: 24px; font-weight: normal; letter-spacing: -0.02em; color: #1c1a14;">AEROFLOW</span>
              <span style="display: block; font-family: monospace; font-size: 11px; color: #6b6759; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.1em;">
                OFFICIAL ELECTRONIC BOARDING PASS
              </span>
            </td>
            <td align="right">
              <span style="font-family: monospace; font-size: 11px; color: #6b6759; display: block; text-transform: uppercase;">RECORD LOCATOR (PNR)</span>
              <span style="font-family: monospace; font-size: 20px; font-weight: bold; color: #244232; letter-spacing: 0.15em;">${pnr}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Route Banner -->
    <tr>
      <td style="padding: 28px 32px; background-color: #f3ecd6; border-bottom: 1px solid rgba(28,26,20,0.12);">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td width="40%">
              <div style="font-family: monospace; font-size: 28px; font-weight: bold; color: #1c1a14;">${originCode}</div>
              <div style="font-size: 13px; color: #6b6759;">${originCity}</div>
            </td>
            <td width="20%" align="center" style="font-family: monospace; font-size: 11px; color: #244232; font-weight: bold;">
              DIRECT
              <div style="width: 50px; height: 1px; background-color: rgba(28,26,20,0.3); margin: 6px auto;"></div>
              NON-STOP
            </td>
            <td width="40%" align="right">
              <div style="font-family: monospace; font-size: 28px; font-weight: bold; color: #1c1a14;">${destinationCode}</div>
              <div style="font-size: 13px; color: #6b6759;">${destinationCity}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Passenger & Flight Details Grid -->
    <tr>
      <td style="padding: 24px 32px; border-bottom: 1px solid rgba(28,26,20,0.12);">
        <table width="100%" border="0" cellpadding="6" cellspacing="0" style="font-family: monospace; font-size: 12px;">
          <tr>
            <td style="color: #6b6759;">PASSENGER:</td>
            <td style="font-weight: bold; color: #1c1a14;">${passengerName}</td>
            <td style="color: #6b6759;">FLIGHT:</td>
            <td style="font-weight: bold; color: #1c1a14;">${flightNumber}</td>
          </tr>
          <tr>
            <td style="color: #6b6759;">SEAT ASSIGNMENT:</td>
            <td style="font-weight: bold; color: #244232;">${seatNumber} (${seatClass})</td>
            <td style="color: #6b6759;">DEPARTURE:</td>
            <td style="font-weight: bold; color: #1c1a14;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="color: #6b6759;">BAGGAGE ALLOWANCE:</td>
            <td style="font-weight: bold; color: #1c1a14;" colspan="3">${baggageAllowanceKg} KG INCLUDED</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Verification QR Code Section -->
    <tr>
      <td align="center" style="padding: 32px; background-color: #ebe4cf;">
        <span style="font-family: monospace; font-size: 11px; letter-spacing: 0.12em; color: #6b6759; display: block; margin-bottom: 16px; text-transform: uppercase;">
          ■ SCAN TO VERIFY BOARDING PASS
        </span>
        
        <!-- Embedded Base64 QR Code -->
        <a href="${verificationUrl}" target="_blank" style="display: inline-block; border: 1px solid rgba(28,26,20,0.2); padding: 8px; background-color: #f3ecd6; border-radius: 4px;">
          <img src="${qrCodeDataUrl}" alt="Boarding Pass Verification QR Code" width="180" height="180" style="display: block; width: 180px; height: 180px;" />
        </a>

        <div style="margin-top: 20px;">
          <a href="${verificationUrl}" target="_blank" style="background-color: #244232; color: #f3ecd6; padding: 12px 28px; text-decoration: none; font-size: 12px; font-family: monospace; font-weight: bold; letter-spacing: 0.14em; text-transform: uppercase; display: inline-block; border-radius: 3px;">
            VERIFY BOARDING PASS
          </a>
        </div>

        <p style="font-size: 11px; font-family: monospace; color: #6b6759; margin-top: 16px; max-width: 420px; line-height: 1.5;">
          Present this QR code at security checkpoints and boarding gates. It links directly to your secure, responsive verification manifest.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 16px 32px; background-color: #f3ecd6; border-top: 1px dashed rgba(28,26,20,0.18); font-family: monospace; font-size: 10px; color: #6b6759; text-align: center;">
        AEROFLOW CARRIER OPERATIONS • BOEING 787-9 FLEET • STRICT CONCURRENCY SETTLEMENT
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const fromAddress =
      process.env.RESEND_FROM_EMAIL || 'AeroFlow Flights <bookings@aeroflow.com>';

    const response = await client.emails.send({
      from: fromAddress,
      to: [recipientEmail],
      subject: `AeroFlow Boarding Pass — Flight ${flightNumber} [PNR: ${pnr}]`,
      html: htmlContent,
    });

    console.log(`[AeroFlow Email] Boarding pass email dispatched to ${recipientEmail} (ID: ${response.data?.id})`);
    return { success: true, id: response.data?.id };
  } catch (err) {
    console.error(`[AeroFlow Email] Failed to send boarding pass email to ${recipientEmail}:`, err);
    return { success: false, error: err };
  }
}
