import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QRCodeLib from 'qrcode';

// Simple QR code generation for download - just the barcode without any overlay
async function generateCleanQRCode(code: string): Promise<Buffer> {
  try {
    // Generate simple QR code without any overlay, number, or logo
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
  } catch (error) {
    console.error('Error generating clean QR code:', error);
    throw error;
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

    // Generate clean QR code - just barcode without overlay
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