import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QRCodeLib from 'qrcode';

// Simple QR code generation for download - clean design with just QR and number below
async function generateCleanQRCode(code: string): Promise<Buffer> {
  try {
    // Check if we're in a server environment that supports canvas
    if (typeof window === 'undefined') {
      try {
        const { createCanvas, loadImage } = await import('canvas');
        
        // Generate QR code as buffer first
        const qrCodeData = `qrcode:${code}`;
        const qrCodeBuffer = await QRCodeLib.toBuffer(qrCodeData, {
          width: 280,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Create canvas with minimal size - just QR code + number
        const canvasWidth = 320;
        const canvasHeight = 360; // More compact
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // QR Code positioning - centered
        const qrSize = 280;
        const qrX = (canvasWidth - qrSize) / 2;
        const qrY = 15; // Minimal top margin
        
        // Draw QR code
        const qrImage = await loadImage(qrCodeBuffer);
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
        
        // Number below QR code - very close spacing
        const numberY = qrY + qrSize + 15; // Only 15px gap between QR and number
        
        // Draw number text - bold and appropriately sized
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 28px Arial, sans-serif'; // Slightly smaller for better proportion
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const numberX = canvasWidth / 2;
        ctx.fillText(code, numberX, numberY);
        
        // Convert canvas to buffer
        return canvas.toBuffer('image/png');
        
      } catch (canvasError) {
        console.error('Canvas error:', canvasError);
        // Fallback to simple QR code
        const qrCodeData = `qrcode:${code}`;
        return await QRCodeLib.toBuffer(qrCodeData, {
          width: 320,
          margin: 4,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      }
    } else {
      // This shouldn't happen on server, but fallback
      const qrCodeData = `qrcode:${code}`;
      return await QRCodeLib.toBuffer(qrCodeData, {
        width: 320,
        margin: 4,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  } catch (error) {
    console.error('Error generating clean QR code:', error);
    // Final fallback
    const qrCodeData = `qrcode:${code}`;
    return await QRCodeLib.toBuffer(qrCodeData, {
      width: 320,
      margin: 4,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Generate clean QR code with number below
    const qrCodeBuffer = await generateCleanQRCode(code);

    // Return the image as response
    return new NextResponse(qrCodeBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="qr-code-${code}.png"`,
      },
    });

  } catch (error) {
    console.error('Error in download QR code route:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}