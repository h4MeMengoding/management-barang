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
        const { createCanvas, loadImage, registerFont } = await import('canvas');
        
        // Register ONLY custom Roboto-ExtraBold font from public/fonts/
        const fs = await import('fs/promises');
        const path = await import('path');
        
        // Try to load ONLY custom font from public/fonts/ - NO FALLBACKS
        const customFontPaths = [
          path.join(process.cwd(), 'public', 'fonts', 'Roboto-ExtraBold.ttf'),
          // Vercel specific path in serverless function
          path.join('/var/task', 'public', 'fonts', 'Roboto-ExtraBold.ttf'),
          // Alternative Vercel path
          '/var/task/.next/static/fonts/Roboto-ExtraBold.ttf'
        ];
        
        let fontRegistered = false;
        for (const fontPath of customFontPaths) {
          try {
            await fs.access(fontPath);
            registerFont(fontPath, { family: 'RobotoExtraBold' });
            console.log(`✅ Successfully registered Roboto-ExtraBold font from: ${fontPath}`);
            fontRegistered = true;
            break;
          } catch (error) {
            console.log(`❌ Roboto-ExtraBold font not found at: ${fontPath}`, error);
          }
        }
        
        // If font not found, throw error - NO FALLBACKS
        if (!fontRegistered) {
          throw new Error('Roboto-ExtraBold.ttf font file not found in public/fonts/. QR code generation aborted.');
        }
        
        // Generate QR code as buffer first with MAXIMUM error correction
        const qrCodeData = `qrcode:${code}`;
        const qrCodeBuffer = await QRCodeLib.toBuffer(qrCodeData, {
          width: 280,
          margin: 2, // Slightly larger margin for better scanning
          errorCorrectionLevel: 'H', // Maximum error correction (30% data can be damaged)
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
        
        // Add favicon in the center of QR code
        try {
          const fs = await import('fs/promises');
          const path = await import('path');
          
          // Try multiple possible paths for the icon in production and development
          const possiblePaths = [
            path.join(process.cwd(), 'public', 'icons', 'icon-barangku-512.png'),
            path.join(process.cwd(), 'public', 'icons', 'icon-barangku-192.png'),
            path.join(process.cwd(), 'public', 'favicon-32x32.png'),
            // Vercel specific paths
            path.join('/var/task', 'public', 'icons', 'icon-barangku-512.png'),
            path.join('/var/task', 'public', 'icons', 'icon-barangku-192.png'),
            path.join('/var/task', 'public', 'favicon-32x32.png')
          ];
          
          let iconBuffer;
          let iconFound = false;
          
          for (const iconPath of possiblePaths) {
            try {
              iconBuffer = await fs.readFile(iconPath);
              iconFound = true;
              console.log(`Icon loaded from: ${iconPath}`);
              break;
            } catch {
              console.log(`Icon not found at: ${iconPath}`);
              continue;
            }
          }
          
          if (!iconFound || !iconBuffer) {
            throw new Error('No icon file found in any of the expected locations');
          }
          
          const iconImage = await loadImage(iconBuffer);
          
          // Calculate center position for icon - optimal size for QR code readability
          // QR codes can handle up to 30% coverage in center area with error correction
          const iconSize = Math.floor(qrSize * 0.15); // 15% of QR size for better readability
          const iconX = qrX + (qrSize - iconSize) / 2;
          const iconY = qrY + (qrSize - iconSize) / 2;
          
          // Draw white circular background for better contrast and readibility
          const bgRadius = iconSize / 2 + 4;
          const bgCenterX = iconX + iconSize / 2;
          const bgCenterY = iconY + iconSize / 2;
          
          // Create circular white background
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bgCenterX, bgCenterY, bgRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Add subtle border to the circle
          ctx.strokeStyle = '#e5e5e5';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Draw icon with proper scaling to maintain aspect ratio
          ctx.drawImage(iconImage, iconX, iconY, iconSize, iconSize);
          
        } catch (faviconError) {
          console.warn('Could not load favicon, skipping overlay:', faviconError);
        }
        
        // Number below QR code - very close spacing
        const numberY = qrY + qrSize + 15; // Only 15px gap between QR and number
        
        // Draw number text - use ONLY custom Roboto-ExtraBold font
        ctx.fillStyle = '#000000';
        
        // Use ONLY RobotoExtraBold font - NO FALLBACKS
        ctx.font = 'bold 28px RobotoExtraBold';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const numberX = canvasWidth / 2;
        
        // Add text with stroke for better visibility
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeText(code, numberX, numberY);
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
          errorCorrectionLevel: 'H', // High error correction
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
        errorCorrectionLevel: 'H', // High error correction
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
      errorCorrectionLevel: 'H', // High error correction
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