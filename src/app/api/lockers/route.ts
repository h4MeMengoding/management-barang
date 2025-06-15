import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, isValidSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Locker, User, QRCode as QRCodeModel } from '@/models';
import { generateSimpleQRCode } from '@/lib/qrcode-utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const lockers = await Locker.find({ userId: user._id }).sort({ createdAt: -1 });
    
    return NextResponse.json(lockers);
  } catch (error) {
    console.error('Error fetching lockers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { label, description, code: providedCode } = await request.json();
    let code = providedCode || Math.floor(1000 + Math.random() * 9000).toString();

    // Check if code already exists, generate new one if needed
    let attempts = 0;
    while (attempts < 10) { // Maximum 10 attempts to avoid infinite loop
      const existingLocker = await Locker.findOne({ code, userId: user._id });
      if (!existingLocker) {
        break; // Code is unique, proceed
      }
      
      // Generate new code if duplicate found
      code = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json({ error: 'Gagal generate kode unik. Silakan coba lagi.' }, { status: 500 });
    }

    // Generate simple QR code without any overlay
    const qrCodeBase64 = await generateSimpleQRCode(code);

    // First create the locker so we have its ID
    const locker = await Locker.create({
      code,
      label,
      description,
      qrCode: qrCodeBase64,
      userId: user._id,
    });

    // Save the QR code to the QR codes collection for management
    // This makes it visible in the QR code management section (Kelola QR Code)
    // We need to include the lockerId so it shows "Terhubung dengan Loker:" in the QR management screen
    const qrCodeDoc = await QRCodeModel.create({
      code,
      qrCode: qrCodeBase64,
      userId: user._id,
      isUsed: true, // Mark it as used since it's directly associated with a locker
      lockerId: locker._id, // Set the lockerId reference to connect it to the locker
    });

    // Update the locker with the QR code ID reference
    locker.qrCodeId = qrCodeDoc._id;
    await locker.save();

    return NextResponse.json(locker, { status: 201 });
  } catch (error) {
    console.error('Error creating locker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
