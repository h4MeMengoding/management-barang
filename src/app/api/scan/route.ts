import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Locker, Item, User, QRCode } from '@/models';

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

    const { qrData } = await request.json();

    // Cleanup the data by trimming whitespace
    const cleanQrData = qrData.trim();
    let qrCodeValue = cleanQrData;

    // Handle different formats: qrcode:CODE, just the CODE itself, etc.
    if (cleanQrData.startsWith('qrcode:')) {
      qrCodeValue = cleanQrData.replace('qrcode:', '').trim();
    } else if (/^\d{4}$/.test(cleanQrData)) {
      // Already just the 4 digit code
      qrCodeValue = cleanQrData;
    } else {
      // Try to extract 4-digit code if embedded in other content
      const digitMatch = cleanQrData.match(/\b\d{4}\b/);
      if (digitMatch) {
        qrCodeValue = digitMatch[0];
      } else {
        qrCodeValue = cleanQrData;
      }
    }
    
    // Find the QR code in database
    const qrCode = await QRCode.findOne({ code: qrCodeValue, userId: user._id });
    
    if (qrCode) {
      // If QR code is already used, redirect to existing locker
      if (qrCode.isUsed && qrCode.lockerId) {
        const locker = await Locker.findById(qrCode.lockerId);
        if (locker) {
          const items = await Item.find({ lockerId: locker._id }).sort({ createdAt: -1 });
          return NextResponse.json({
            type: 'existing_locker',
            locker,
            items,
          });
        } else {
          return NextResponse.json({ 
            error: 'QR code terkait dengan loker yang sudah tidak ada', 
            details: 'Loker tidak ditemukan di database'
          }, { status: 404 });
        }
      }

      // If QR code is not used, return for initialization
      return NextResponse.json({
        type: 'initialize_locker',
        qrCode: {
          _id: qrCode._id,
          code: qrCode.code,
        },
      });
    }

    // Legacy workflow: Check for existing locker code (format: "locker:CODE")
    if (qrData.startsWith('locker:')) {
      const lockerCode = qrData.replace('locker:', '');
      
      const locker = await Locker.findOne({ code: lockerCode, userId: user._id });
      if (locker) {
        const items = await Item.find({ lockerId: locker._id }).sort({ createdAt: -1 });
        return NextResponse.json({
          type: 'existing_locker',
          locker,
          items,
        });
      }
    }
    
    // If we got here, no QR code or locker was found
    return NextResponse.json({ 
      error: 'QR Code tidak ditemukan atau format tidak valid', 
      receivedFormat: qrData 
    }, { status: 404 });

  } catch (error) {
    console.error('Error scanning QR code:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
