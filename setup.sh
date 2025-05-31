#!/bin/bash

# Item Management System Setup Script

echo "🚀 Setting up Item Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for MongoDB Atlas setup
echo ""
echo "🗄️  Database Setup..."
echo "This application uses MongoDB Atlas (cloud database)."
echo ""
echo "📋 MongoDB Atlas Setup Guide:"
echo "   1. Visit: https://mongodb.com/atlas"
echo "   2. Create free account and M0 cluster"
echo "   3. Setup database user and network access"
echo "   4. Get connection string"
echo "   5. Update MONGODB_URI in .env.local"
echo ""
echo "📖 See MONGODB_SETUP.md for detailed instructions"
echo ""

# Default MongoDB Atlas placeholder
MONGODB_URI="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/management-barang?retryWrites=true&w=majority"

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local file..."
    cat > .env.local << EOF
# MongoDB connection string
MONGODB_URI=$MONGODB_URI

# Google OAuth credentials (replace with your actual credentials)
# Get these from https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth secret (generate a random secret for production)
NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "development-secret-change-in-production")
NEXTAUTH_URL=http://localhost:3000
EOF
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update .env.local with your Google OAuth credentials"
echo "   2. Make sure MongoDB is running"
echo "   3. Run: npm run dev"
echo ""
echo "🔗 Useful links:"
echo "   • MongoDB Atlas Setup: https://mongodb.com/atlas"
echo "   • Google Cloud Console: https://console.cloud.google.com/"
echo "   • Application: http://localhost:3000"
echo "   • Setup Guide: MONGODB_SETUP.md"
echo ""
echo "⚠️  Important: Update MONGODB_URI in .env.local with your actual MongoDB Atlas connection string"
echo ""
