import * as QRCode from 'qrcode';

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

export interface QRGenerateResult {
  qrDataUrl: string;          // base64 PNG data URL for inline rendering
  verifyUrl: string;          // the URL the QR encodes
  referenceId: string;
}

/**
 * Generate a QR code that links to the public verification page for a PurchaseOrder.
 * The QR encodes a URL like: https://app.autostock.ai/verify/<poId>?type=po_created
 */
export async function generateForPurchaseOrder(
  poId: string,
  eventType = 'po_created'
): Promise<QRGenerateResult> {
  const verifyUrl = `${PUBLIC_BASE_URL}/verify/${poId}?type=${eventType}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
  return { qrDataUrl, verifyUrl, referenceId: poId };
}

/**
 * Generate a raw PNG buffer (for printing on shipping labels).
 */
export async function generatePngBuffer(
  poId: string,
  eventType = 'po_created'
): Promise<Buffer> {
  const verifyUrl = `${PUBLIC_BASE_URL}/verify/${poId}?type=${eventType}`;
  return QRCode.toBuffer(verifyUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 512,
  });
}
