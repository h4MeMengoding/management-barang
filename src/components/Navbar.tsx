'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { LogOut, Package } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Hide navbar on home page if user is not logged in
  if (!session && pathname === '/') {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Simple Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white hidden sm:block">
              Management Barang
            </span>
            <span className="text-lg font-semibold text-white sm:hidden">
              MB
            </span>
          </div>
          
          {/* Simple User Section */}
          <div className="flex items-center space-x-3">
            {session?.user ? (
              <>
                {/* Simple User Info */}
                <div className="flex items-center space-x-3 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <img
                    src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name || 'User'}&size=32&background=3B82F6&color=ffffff&rounded=true`}
                    alt={session.user.name || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-600"
                  />
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-white">
                      {session.user.name?.split(' ')[0] || 'User'}
                    </p>
                  </div>
                </div>
                
                {/* Simple Logout Button */}
                <button
                  onClick={() => signOut()}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors duration-200"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              /* Simple Login Button */
              <button
                onClick={() => signIn('google')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                <span className="hidden sm:inline">Sign In</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
