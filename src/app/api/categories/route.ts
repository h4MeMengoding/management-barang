import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, isValidSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Item, User, Category } from '@/models';

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

    // Get user's categories from Category collection
    const categories = await Category.find({ userId: user._id }).sort({ name: 1 });
    let categoryNames = categories.map(cat => cat.name);
    
    // If no categories in database, get unique categories from user's items as fallback
    if (categoryNames.length === 0) {
      const itemCategories = await Item.distinct('category', { userId: user._id });
      
      // Save existing item categories to Category collection
      const categoryDocs = itemCategories.map(cat => ({
        name: cat,
        userId: user._id
      }));
      
      if (categoryDocs.length > 0) {
        await Category.insertMany(categoryDocs, { ordered: false }).catch(err => {
          // Ignore duplicate key errors
          if (err.code !== 11000) {
            console.error('Error inserting categories:', err);
          }
        });
      }
      
      categoryNames = itemCategories.sort((a, b) => a.localeCompare(b));
    }
    
    return NextResponse.json(categoryNames);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if category already exists for this user
    const existingCategory = await Category.findOne({ 
      userId: user._id, 
      name: name.trim() 
    });
    
    if (existingCategory) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }

    // Create new category
    const category = new Category({
      name: name.trim(),
      userId: user._id
    });
    
    await category.save();
    
    return NextResponse.json({ message: 'Category created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { oldName, newName } = await request.json();
    
    if (!oldName || !newName || !newName.trim()) {
      return NextResponse.json({ error: 'Old name and new name are required' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if new category name already exists for this user
    const existingCategory = await Category.findOne({ 
      userId: user._id, 
      name: newName.trim() 
    });
    
    if (existingCategory && existingCategory.name !== oldName) {
      return NextResponse.json({ error: 'Category with new name already exists' }, { status: 409 });
    }

    // Update category
    const updatedCategory = await Category.findOneAndUpdate(
      { userId: user._id, name: oldName },
      { name: newName.trim() },
      { new: true }
    );
    
    if (!updatedCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Update all items that have this category
    await Item.updateMany(
      { userId: user._id, category: oldName },
      { category: newName.trim() }
    );
    
    return NextResponse.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if category has items
    const itemsWithCategory = await Item.countDocuments({ 
      userId: user._id, 
      category: name 
    });
    
    if (itemsWithCategory > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category that has items' 
      }, { status: 400 });
    }

    // Delete category
    const deletedCategory = await Category.findOneAndDelete({ 
      userId: user._id, 
      name: name 
    });
    
    if (!deletedCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
