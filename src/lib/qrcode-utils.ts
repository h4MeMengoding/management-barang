import QRCodeLib from 'qrcode';
import { createCanvas, loadImage } from 'canvas';

export async function generateQRCodeWithOverlay(code: string): Promise<string> {
  try {
    // Generate QR code as buffer first
    const qrCodeBuffer = await QRCodeLib.toBuffer(code, {
      width: 600,
      margin: 6,
      errorCorrectionLevel: 'H', // High error correction allows for center overlay
      scale: 10,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Create canvas to add overlay
    const canvas = createCanvas(600, 600);
    const ctx = canvas.getContext('2d');
    
    // Load and draw QR code
    const qrImage = await loadImage(qrCodeBuffer);
    ctx.drawImage(qrImage, 0, 0, 600, 600);
    
    // Add white circle background for text
    const centerX = 300;
    const centerY = 300;
    const circleRadius = 55; // Slightly larger circle for better visibility
    
    // Add subtle shadow for better contrast
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Add border to circle
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Add text (code number) with better typography
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text stroke for better readability
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeText(code, centerX, centerY);
    ctx.fillText(code, centerX, centerY);
    
    // Convert canvas to base64
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating QR code with overlay:', error);
    throw error;
  }
}
