'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { LogOut, Package, ChevronDown, Download } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { showCustomConfirm } from '@/lib/alerts';
import { usePWA } from '@/contexts/PWAContext';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { canInstall, isInstalled, installPWA } = usePWA();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    showCustomConfirm(
      'Konfirmasi Logout',
      'Apakah Anda yakin ingin keluar dari aplikasi?',
      'Logout',
      () => {
        signOut();
      },
      'danger'
    );
  };

  const handleInstallPWA = async () => {
    setDropdownOpen(false);
    await installPWA();
  };

  // Hide navbar on home page if user is not logged in
  if (!session && pathname === '/') {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Brand */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white hidden sm:block">
              Management Barang
            </span>
            <span className="text-lg font-semibold text-white sm:hidden">
              MB
            </span>
          </Link>
          
          {/* User Section with Dropdown */}
          <div className="flex items-center space-x-3">
            {session?.user ? (
              <div className="relative" ref={dropdownRef}>
                {/* Profile Button */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-3 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 transition-colors duration-200"
                >
                  <Image
                    src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name || 'User'}&size=32&background=3B82F6&color=ffffff&rounded=true`}
                    alt={session.user.name || 'User'}
                    width={28}
                    height={28}
                    className="rounded-full border border-slate-600"
                  />
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-white">
                      {session.user.name?.split(' ')[0] || 'User'}
                    </p>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-1 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="text-sm font-medium text-white">
                        {session.user.name || 'User'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {session.user.email}
                      </p>
                    </div>
                    
                    {/* PWA Install Button */}
                    {canInstall && (
                      <button
                        onClick={handleInstallPWA}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors duration-200"
                      >
                        <Download size={16} />
                        <span>Install Aplikasi</span>
                      </button>
                    )}

                    {/* PWA Status */}
                    {isInstalled && (
                      <div className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-green-400">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span>Aplikasi Terinstall</span>
                      </div>
                    )}
                    
                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors duration-200"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Login Button */
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
