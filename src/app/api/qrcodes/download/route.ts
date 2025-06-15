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
        
        // Generate QR code as buffer first - same parameters as display version
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

        // Create canvas with minimal size - same as display version
        const canvasWidth = 300;
        const canvasHeight = 350; // Same dimensions as display version
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // QR Code positioning - same as display version
        const qrSize = 260;
        const qrX = (canvasWidth - qrSize) / 2;
        const qrY = 20; // Same top margin as display version
        
        // Draw QR code
        const qrImage = await loadImage(qrCodeBuffer);
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
        
        // Add favicon in the center of QR code
        try {
          const fs = await import('fs/promises');
          const path = await import('path');
          
          // Load favicon from public folder - same as display version
          const iconPath = path.join(process.cwd(), 'public', 'favicon-32x32.png');
          const iconBuffer = await fs.readFile(iconPath);
          const iconImage = await loadImage(iconBuffer);
          
          // Calculate center position for favicon - same as display version
          const iconSize = 28; // Same size as display version
          const iconX = qrX + (qrSize - iconSize) / 2;
          const iconY = qrY + (qrSize - iconSize) / 2;
          
          // Draw white background circle behind favicon for better contrast - same as display version
          const bgRadius = iconSize / 2 + 3;
          const bgCenterX = iconX + iconSize / 2;
          const bgCenterY = iconY + iconSize / 2;
          
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bgCenterX, bgCenterY, bgRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw border around the white background - same as display version
          ctx.strokeStyle = '#e5e5e5';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(bgCenterX, bgCenterY, bgRadius, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Draw favicon - same as display version
          ctx.drawImage(iconImage, iconX, iconY, iconSize, iconSize);
          
        } catch (faviconError) {
          console.warn('Could not load favicon, skipping overlay:', faviconError);
        }
        
        // Number below QR code - same spacing as display version
        const numberY = qrY + qrSize + 10; // Same 10px gap as display version
        
        // Draw number text - using web-safe fonts that work on Vercel
        ctx.fillStyle = '#000000';
        
        // Use the same font configuration as the display version for consistency
        ctx.font = 'bold 36px Arial, sans-serif';
        
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