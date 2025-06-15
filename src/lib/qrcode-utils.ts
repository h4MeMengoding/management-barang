import QRCodeLib from 'qrcode';

// Simple QR code generation - just the barcode without any overlay, number, or logo
export async function generateSimpleQRCode(code: string): Promise<string> {
  try {
    // Generate QR code as data URL - encode with qrcode: prefix for better detection
    const qrCodeData = `qrcode:${code}`;
    const dataUrl = await QRCodeLib.toDataURL(qrCodeData, {
      width: 400,
      margin: 4,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

// All QR code generation functions now just return simple QR codes without any overlay
export async function generateQRCodeWithOverlay(code: string): Promise<string> {
  return await generateSimpleQRCode(code);
}

// All QR code generation functions now just return simple QR codes without any overlay
export async function generateQRCodeWithNumberBelow(code: string): Promise<string> {
  return await generateSimpleQRCode(code);
}
