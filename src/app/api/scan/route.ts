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

    // Check if this is a pre-generated QR code (format: "qrcode:CODE")
    if (qrData.startsWith('qrcode:')) {
      const qrCodeValue = qrData.replace('qrcode:', '');
      
      // Find the QR code in database
      const qrCode = await QRCode.findOne({ code: qrCodeValue, userId: user._id });
      
      if (!qrCode) {
        return NextResponse.json({ error: 'QR Code tidak ditemukan atau bukan milik Anda' }, { status: 404 });
      }

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
        }
      }

      // If QR code is not used, return for initialization
      return NextResponse.json({
        type: 'initialize_locker',
        qrCode: {
          _id: qrCode._id,
          code: qrCode.code,
          qrCodeImage: qrCode.qrCode,
        },
      });
    }

    // Legacy workflow: Check for existing locker code (format: "locker:CODE")
    if (qrData.startsWith('locker:')) {
      const lockerCode = qrData.replace('locker:', '');
      
      const locker = await Locker.findOne({ code: lockerCode, userId: user._id });
      if (!locker) {
        return NextResponse.json({ error: 'Loker tidak ditemukan' }, { status: 404 });
      }

      const items = await Item.find({ lockerId: locker._id }).sort({ createdAt: -1 });

      return NextResponse.json({
        type: 'existing_locker',
        locker,
        items,
      });
    }

    return NextResponse.json({ error: 'Format QR Code tidak valid' }, { status: 400 });

  } catch (error) {
    console.error('Error scanning QR code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
