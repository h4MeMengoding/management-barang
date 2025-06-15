import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { QRCode, User } from '@/models';
import { generateQRCodeWithNumberBelow } from '@/lib/qrcode-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { qrCodeIds } = await request.json();
    
    if (!qrCodeIds || !Array.isArray(qrCodeIds)) {
      return NextResponse.json({ error: 'QR Code IDs must be provided as an array' }, { status: 400 });
    }

    const updatedQRCodes = [];
    
    for (const qrCodeId of qrCodeIds) {
      const existingQR = await QRCode.findOne({ _id: qrCodeId, userId: user._id });
      
      if (!existingQR) {
        // QR Code not found or not owned by user - skip
        continue;
      }

      // Generate new QR code image with logo and number below - same as download version
      const qrCodeBase64 = await generateQRCodeWithNumberBelow(existingQR.code);

      // Update the QR code in database
      existingQR.qrCode = qrCodeBase64;
      await existingQR.save();

      updatedQRCodes.push(existingQR);
    }

    return NextResponse.json({ 
      message: `${updatedQRCodes.length} QR codes regenerated successfully`,
      qrCodes: updatedQRCodes 
    }, { status: 200 });
  } catch (error) {
    console.error('Error regenerating QR codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Regenerate all QR codes for a user
export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allQRCodes = await QRCode.find({ userId: user._id });
    
    const updatedQRCodes = [];
    
    for (const qrCode of allQRCodes) {
      // Generate new QR code image with logo and number below - same as download version
      const qrCodeBase64 = await generateQRCodeWithNumberBelow(qrCode.code);

      // Update the QR code in database
      qrCode.qrCode = qrCodeBase64;
      await qrCode.save();

      updatedQRCodes.push(qrCode);
    }

    return NextResponse.json({ 
      message: `${updatedQRCodes.length} QR codes regenerated successfully`,
      qrCodes: updatedQRCodes 
    }, { status: 200 });
  } catch (error) {
    console.error('Error regenerating all QR codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
