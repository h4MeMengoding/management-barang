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
        
        // Try to register a system font for better Vercel compatibility
        try {
          // Register DejaVu Sans if available (common on Linux/Vercel)
          const fs = await import('fs/promises');
          
          // Common font paths on Vercel/Linux systems
          const fontPaths = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
            '/System/Library/Fonts/Helvetica.ttc', // macOS fallback
            '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
          ];
          
          for (const fontPath of fontPaths) {
            try {
              await fs.access(fontPath);
              registerFont(fontPath, { family: 'MyCustomFont' });
              console.log(`Registered font from: ${fontPath}`);
              break;
            } catch {
              // Font not found, try next
            }
          }
        } catch (fontError) {
          console.warn('Could not register custom font:', fontError);
        }
        
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
          
          // Calculate center position for icon - larger size but safe for QR scanning
          const iconSize = 60; // Larger for better visibility
          const iconX = qrX + (qrSize - iconSize) / 2;
          const iconY = qrY + (qrSize - iconSize) / 2;
          
          // Draw white background with shadow for icon (simple rectangle)
          const padding = 6;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          // Draw background rectangle
          ctx.fillRect(iconX - padding, iconY - padding, iconSize + padding * 2, iconSize + padding * 2);
          
          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Draw icon directly (no clipping)
          ctx.drawImage(iconImage, iconX, iconY, iconSize, iconSize);
          
        } catch (faviconError) {
          console.warn('Could not load favicon, skipping overlay:', faviconError);
        }
        
        // Number below QR code - very close spacing
        const numberY = qrY + qrSize + 15; // Only 15px gap between QR and number
        
        // Draw number text - use simple approach that works on Vercel
        ctx.fillStyle = '#000000';
        
        // Use basic font without trying to detect - let canvas handle fallback
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const numberX = canvasWidth / 2;
        
        // Add text with stroke for better visibility if font doesn't render properly  
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