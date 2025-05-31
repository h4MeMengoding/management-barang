import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, isValidSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Locker, User } from '@/models';
import QRCode from 'qrcode';

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

    // Generate QR code
    const qrCodeData = `locker:${code}`;
    const qrCodeBase64 = await QRCode.toDataURL(qrCodeData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const locker = await Locker.create({
      code,
      label,
      description,
      qrCode: qrCodeBase64,
      userId: user._id,
    });

    return NextResponse.json(locker, { status: 201 });
  } catch (error) {
    console.error('Error creating locker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
