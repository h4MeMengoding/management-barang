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
  try {
    // Check if we're in a server environment that supports canvas
    if (typeof window === 'undefined') {
      try {
        const { createCanvas, loadImage } = await import('canvas');
        
        // Generate QR code as buffer first
        const qrCodeData = `qrcode:${code}`;
        const qrCodeBuffer = await QRCodeLib.toBuffer(qrCodeData, {
          width: 320,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Create canvas with minimal size - just QR code + number
        const canvasWidth = 300;
        const canvasHeight = 350; // Compact design
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');
        
        // Clean white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // QR Code positioning - centered with minimal top margin
        const qrSize = 260;
        const qrX = (canvasWidth - qrSize) / 2;
        const qrY = 20; // Small top margin
        
        // Draw QR code
        const qrImage = await loadImage(qrCodeBuffer);
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
        
        // Add favicon in the center of QR code
        try {
          const fs = await import('fs/promises');
          const path = await import('path');
          
          // Load favicon from public folder
          const faviconPath = path.join(process.cwd(), 'public', 'favicon-32x32.png');
          const faviconBuffer = await fs.readFile(faviconPath);
          const faviconImage = await loadImage(faviconBuffer);
          
          // Calculate center position for favicon
          const faviconSize = 28; // Size of favicon overlay (slightly smaller for this version)
          const faviconX = qrX + (qrSize - faviconSize) / 2;
          const faviconY = qrY + (qrSize - faviconSize) / 2;
          
          // Draw white background circle behind favicon for better contrast
          const bgRadius = faviconSize / 2 + 3;
          const bgCenterX = faviconX + faviconSize / 2;
          const bgCenterY = faviconY + faviconSize / 2;
          
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bgCenterX, bgCenterY, bgRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw border around the white background
          ctx.strokeStyle = '#e5e5e5';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(bgCenterX, bgCenterY, bgRadius, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Draw favicon
          ctx.drawImage(faviconImage, faviconX, faviconY, faviconSize, faviconSize);
          
        } catch (faviconError) {
          console.warn('Could not load favicon, skipping overlay:', faviconError);
        }
        
        // Number below QR code - minimal spacing
        const numberY = qrY + qrSize + 10; // Only 10px gap between QR and number
        
        // Draw locker number - large, bold, clean
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 36px Arial, sans-serif'; // Larger font for better visibility
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const numberX = canvasWidth / 2;
        ctx.fillText(code, numberX, numberY);
        
        // Convert canvas to base64
        return canvas.toDataURL('image/png');
      } catch (canvasError) {
        console.warn('Canvas not available on server, falling back to simple QR:', canvasError);
        return await generateSimpleQRCode(code);
      }
    } else {
      // Client-side fallback
      return await generateSimpleQRCode(code);
    }
  } catch (error) {
    console.error('Error generating QR code with number below:', error);
    return await generateSimpleQRCode(code);
  }
}
