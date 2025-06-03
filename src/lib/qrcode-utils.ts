import QRCodeLib from 'qrcode';
import { createCanvas, loadImage } from 'canvas';

export async function generateQRCodeWithOverlay(code: string): Promise<string> {
  try {
    // Generate QR code as buffer first - encode with qrcode: prefix for better detection
    const qrCodeData = `qrcode:${code}`;
    const qrCodeBuffer = await QRCodeLib.toBuffer(qrCodeData, {
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
    const circleRadius = 60; // Larger radius for better text fit
    
    // Draw white circle background
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add thick black border to circle
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Add text - using standard fonts available in most systems
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    
    // Set font - use system default sans-serif which should always work
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw the text multiple times for bold effect
    ctx.fillText(code, centerX, centerY);
    ctx.strokeText(code, centerX, centerY);
    
    // Convert canvas to base64
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating QR code with overlay:', error);
    throw error;
  }
}
