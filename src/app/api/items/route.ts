import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, isValidSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Item, User, Locker } from '@/models';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Build query
    const query: { userId: string; category?: string } = { userId: user._id };
    if (category) {
      query.category = category;
    }

    const items = await Item.find(query)
      .populate('lockerId', 'code label')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
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

    const { name, description, category, quantity, lockerId } = await request.json();

    // Verify locker belongs to user
    const locker = await Locker.findOne({ _id: lockerId, userId: user._id });
    if (!locker) {
      return NextResponse.json({ error: 'Loker tidak ditemukan' }, { status: 404 });
    }

    const item = await Item.create({
      name,
      description,
      category,
      quantity,
      lockerId,
      userId: user._id,
    });

    const populatedItem = await Item.findById(item._id).populate('lockerId', 'code label');

    return NextResponse.json(populatedItem, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
