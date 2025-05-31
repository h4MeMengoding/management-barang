import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await dbConnect();
    
    // Test a simple query
    const userCount = await User.countDocuments();
    const usersWithoutGoogleId = await User.find({ googleId: { $exists: false } });
    const users = await User.find({}).select('email name googleId');
    
    return NextResponse.json({
      success: true,
      message: `Database connected successfully! Found ${userCount} users.`,
      userCount,
      usersWithoutGoogleId: usersWithoutGoogleId.length,
      allUsers: users,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
