import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Locker, User } from '@/models';

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

    // Generate unique code
    let code;
    let attempts = 0;
    
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      const existingLocker = await Locker.findOne({ code, userId: user._id });
      
      if (!existingLocker) {
        break;
      }
      
      attempts++;
    } while (attempts < 20);

    if (attempts >= 20) {
      return NextResponse.json({ error: 'Unable to generate unique code' }, { status: 500 });
    }

    return NextResponse.json({ code });
  } catch (error) {
    console.error('Error generating code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
