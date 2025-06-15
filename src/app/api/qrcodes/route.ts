import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { QRCode, User } from '@/models';
import { generateSimpleQRCode } from '@/lib/qrcode-utils';

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

    const { count } = await request.json();
    
    if (!count || count < 1 || count > 50) {
      return NextResponse.json({ error: 'Count must be between 1 and 50' }, { status: 400 });
    }

    const qrCodes = [];
    
    for (let i = 0; i < count; i++) {
      // Generate unique code
      let code;
      let attempts = 0;
      
      do {
        code = Math.floor(1000 + Math.random() * 9000).toString();
        const existingQR = await QRCode.findOne({ code });
        
        if (!existingQR) {
          break;
        }
        
        attempts++;
      } while (attempts < 20);

      if (attempts >= 20) {
        return NextResponse.json({ error: 'Unable to generate unique codes' }, { status: 500 });
      }

      // Generate simple QR code without any overlay
      const qrCodeBase64 = await generateSimpleQRCode(code);

      // Save to database
      const qrCodeDoc = await QRCode.create({
        code,
        qrCode: qrCodeBase64,
        userId: user._id,
      });

      qrCodes.push(qrCodeDoc);
    }

    return NextResponse.json({ 
      message: `${count} QR codes generated successfully`,
      qrCodes 
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating QR codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
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

    const qrCodes = await QRCode.find({ userId: user._id })
      .populate('lockerId', 'label')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(qrCodes);
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
