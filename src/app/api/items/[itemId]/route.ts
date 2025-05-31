import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, isValidSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Item, User, Locker } from '@/models';

interface Params {
  itemId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { itemId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const item = await Item.findOne({ _id: itemId, userId: user._id })
      .populate('lockerId', 'code label');
    
    if (!item) {
      return NextResponse.json({ error: 'Item tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { itemId } = await params;
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

    // Verify the item exists and belongs to the user
    const existingItem = await Item.findOne({ _id: itemId, userId: user._id });
    if (!existingItem) {
      return NextResponse.json({ error: 'Item tidak ditemukan' }, { status: 404 });
    }

    // If lockerId is being changed, verify the new locker belongs to user
    if (lockerId && lockerId !== existingItem.lockerId.toString()) {
      const locker = await Locker.findOne({ _id: lockerId, userId: user._id });
      if (!locker) {
        return NextResponse.json({ error: 'Loker tidak ditemukan' }, { status: 404 });
      }
    }

    const updatedItem = await Item.findByIdAndUpdate(
      itemId,
      {
        name,
        description,
        category,
        quantity,
        lockerId,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate('lockerId', 'code label');

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { itemId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const item = await Item.findOneAndDelete({ _id: itemId, userId: user._id });
    
    if (!item) {
      return NextResponse.json({ error: 'Item tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
