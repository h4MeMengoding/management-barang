'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { LogOut, User } from 'lucide-react';

// Function to generate a consistent avatar URL from email
function getEmailBasedAvatar(email: string, size: number = 32): string {
  // Simple hash function for consistent avatar generation
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Generate a seed based on the hash
  const seed = Math.abs(hash).toString();
  
  // Use DiceBear API for consistent avatar generation
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&size=${size}&backgroundColor=3B82F6`;
}

// Function to get initials from email
function getInitialsFromEmail(email: string): string {
  const username = email.split('@')[0];
  return username.substring(0, 2).toUpperCase();
}

export default function Navbar() {
  const { data: session } = useSession();

  // Get user avatar URL with multiple fallbacks
  const getUserAvatar = () => {
    if (!session?.user?.email) return null;
    
    // Priority 1: Use Google profile image if available and valid
    if (session.user.image && session.user.image.startsWith('http')) {
      return session.user.image;
    }
    
    // Priority 2: Generate consistent avatar based on email
    return getEmailBasedAvatar(session.user.email, 32);
  };

  // Get fallback avatar for onError handler
  const getFallbackAvatar = () => {
    if (!session?.user?.email) return '/default-avatar.png';
    
    const initials = getInitialsFromEmail(session.user.email);
    return `https://ui-avatars.com/api/?name=${initials}&size=32&background=3B82F6&color=ffffff&rounded=true`;
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Management Barang
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {session?.user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <img
                    src={getUserAvatar() || getFallbackAvatar()}
                    alt={session.user.name || session.user.email || 'User'}
                    className="w-8 h-8 rounded-full border-2 border-gray-200 object-cover bg-gray-100"
                    onError={(e) => {
                      // Final fallback to initials avatar if all else fails
                      const target = e.target as HTMLImageElement;
                      target.src = getFallbackAvatar();
                    }}
                  />
                  <span className="text-gray-700">{session.user.name || session.user.email}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <User size={16} />
                <span>Login dengan Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
