import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, isValidSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Locker, User, Item } from '@/models';

interface Params {
  lockerId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { lockerId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the locker exists and belongs to the user
    const locker = await Locker.findOne({ _id: lockerId, userId: user._id });
    if (!locker) {
      return NextResponse.json({ error: 'Loker tidak ditemukan' }, { status: 404 });
    }

    // Get items for this locker that belong to the user
    const items = await Item.find({ lockerId, userId: user._id }).sort({ createdAt: -1 });
    
    return NextResponse.json({ locker, items });
  } catch (error) {
    console.error('Error fetching locker items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { lockerId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { label, description } = await request.json();

    // Verify the locker exists and belongs to the user
    const existingLocker = await Locker.findOne({ _id: lockerId, userId: user._id });
    if (!existingLocker) {
      return NextResponse.json({ error: 'Loker tidak ditemukan' }, { status: 404 });
    }

    const updatedLocker = await Locker.findByIdAndUpdate(
      lockerId,
      {
        label,
        description,
        updatedAt: new Date(),
      },
      { new: true }
    );

    return NextResponse.json(updatedLocker);
  } catch (error) {
    console.error('Error updating locker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { lockerId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the locker exists and belongs to the user
    const locker = await Locker.findOne({ _id: lockerId, userId: user._id });
    if (!locker) {
      return NextResponse.json({ error: 'Loker tidak ditemukan' }, { status: 404 });
    }

    // Check if there are items in the locker
    const itemCount = await Item.countDocuments({ lockerId });
    if (itemCount > 0) {
      return NextResponse.json({ 
        error: 'Tidak dapat menghapus loker yang masih berisi barang. Hapus semua barang terlebih dahulu.' 
      }, { status: 400 });
    }

    await Locker.findByIdAndDelete(lockerId);

    return NextResponse.json({ message: 'Loker berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting locker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
