import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Locker, QRCode, User } from '@/models';

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

    const { qrCodeId, label, description } = await request.json();

    // Validate required fields
    if (!qrCodeId || !label) {
      return NextResponse.json({ 
        error: 'QR Code ID dan label loker harus diisi' 
      }, { status: 400 });
    }

    // Find the QR code
    const qrCode = await QRCode.findById(qrCodeId);
    
    if (!qrCode) {
      return NextResponse.json({ error: 'QR Code tidak ditemukan' }, { status: 404 });
    }

    if (qrCode.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'QR Code bukan milik Anda' }, { status: 403 });
    }

    if (qrCode.isUsed) {
      return NextResponse.json({ error: 'QR Code sudah digunakan' }, { status: 400 });
    }

    // Create new locker
    const locker = new Locker({
      code: qrCode.code, // Use the same code from QR code
      label,
      description: description || '',
      qrCode: qrCode.qrCode, // Use the QR code image
      userId: user._id,
    });

    await locker.save();

    // Update QR code to mark as used and link to locker
    qrCode.isUsed = true;
    qrCode.lockerId = locker._id;
    await qrCode.save();

    return NextResponse.json({
      message: 'Loker berhasil diinisiasi',
      locker: {
        _id: locker._id,
        code: locker.code,
        label: locker.label,
        description: locker.description,
        qrCode: locker.qrCode,
      },
    });

  } catch (error) {
    console.error('Error initializing locker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
