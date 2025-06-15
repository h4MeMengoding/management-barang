import QRCodeLib from 'qrcode';

// Simple QR code generation without canvas overlay for better Vercel compatibility
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

// Alias for backward compatibility - same as generateQRCodeWithNumberBelow
export async function generateQRCodeWithOverlay(code: string): Promise<string> {
  return await generateQRCodeWithNumberBelow(code);
}

// Server-side canvas generation for QR code with number below (for download)
export async function generateQRCodeWithNumberBelow(code: string): Promise<string> {
  // Always fall back to simple QR code during build to avoid canvas issues
  return await generateSimpleQRCode(code);
}
