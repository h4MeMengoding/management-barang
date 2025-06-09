'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Package, ChevronDown, Download, Search, X, MapPin, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { showCustomConfirm } from '@/lib/alerts';
import { usePWA } from '@/contexts/PWAContext';

interface SearchResult {
  type: 'locker' | 'item' | 'category';
  id: string;
  name: string;
  description?: string;
  code?: string;
  category?: string;
  lockerInfo?: {
    _id: string;
    code: string;
    label: string;
  };
}

interface LockerData {
  _id: string;
  label: string;
  code: string;
  description?: string;
}

interface ItemData {
  _id: string;
  name: string;
  description?: string;
  category: string;
  lockerId?: string | {
    _id: string;
    code: string;
    label: string;
  };
}

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { canInstall, isInstalled, installPWA } = usePWA();
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        // Add a small delay to allow click handlers to process first
        setTimeout(() => {
          setShowSearchResults(false);
        }, 100);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search function
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const [lockersRes, itemsRes] = await Promise.all([
        fetch('/api/lockers'),
        fetch('/api/items'),
      ]);

      const results: SearchResult[] = [];

      if (lockersRes.ok) {
        const lockers: LockerData[] = await lockersRes.json();
        const matchedLockers = lockers.filter((locker: LockerData) =>
          locker.label.toLowerCase().includes(query.toLowerCase()) ||
          locker.code.toLowerCase().includes(query.toLowerCase()) ||
          locker.description?.toLowerCase().includes(query.toLowerCase())
        );

        results.push(...matchedLockers.map((locker: LockerData) => ({
          type: 'locker' as const,
          id: locker._id,
          name: locker.label,
          description: locker.description,
          code: locker.code,
        })));
      }

      if (itemsRes.ok) {
        const items: ItemData[] = await itemsRes.json();
        const matchedItems = items.filter((item: ItemData) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
        );

        results.push(...matchedItems.map((item: ItemData) => ({
          type: 'item' as const,
          id: item._id,
          name: item.name,
          description: item.description,
          category: item.category,
          lockerInfo: typeof item.lockerId === 'object' ? item.lockerId : undefined,
        })));

        // Get unique categories from items
        const allCategories = items.map((item: ItemData) => item.category).filter(Boolean);
        const categories: string[] = [...new Set(allCategories)] as string[];
        const matchedCategories = categories.filter((category: string) =>
          category.toLowerCase().includes(query.toLowerCase())
        );

        results.push(...matchedCategories.map((category: string) => ({
          type: 'category' as const,
          id: `category-${category}`,
          name: category,
          description: `Kategori barang`,
        })));
      }

      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Handle search result click
  const handleResultClick = (result: SearchResult) => {
    setShowSearchResults(false);
    setSearchTerm('');
    setShowMobileSearch(false);
    
    // Navigate based on result type using Next.js router
    if (result.type === 'locker') {
      router.push(`/lockers/${result.id}`);
    } else if (result.type === 'item') {
      router.push(`/items/${result.id}/view`);
    } else if (result.type === 'category') {
      router.push(`/categories`);
    }
  };

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-slate-900/98 to-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <Link href="/" className="group flex items-center space-x-4 hover:scale-105 transition-all duration-300 ease-out flex-shrink-0">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                <Package className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent hidden sm:block leading-tight">
                Management Barang
              </span>
              <span className="text-xs text-slate-400 hidden sm:block -mt-1">
                Smart Inventory System
              </span>
            </div>
          </Link>
          
          {/* Global Search - Only show when user is logged in */}
          {session?.user && (
            <div className="flex-1 max-w-xl mx-2 sm:mx-4 lg:mx-8 relative hidden sm:block" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Cari loker, barang, atau kategori..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => searchTerm && setShowSearchResults(true)}
                  className="w-full pl-12 pr-10 py-3 bg-slate-800/60 hover:bg-slate-800/80 focus:bg-slate-800/90 border border-slate-600/50 hover:border-slate-500/50 focus:border-blue-500/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 backdrop-blur-xl"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors duration-200 active:scale-95"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full mt-2 w-full bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-600/50 py-2 z-[9999] max-h-96 overflow-y-auto"
                >
                  {isSearching ? (
                    <div className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-3"></div>
                      <p className="text-slate-400 text-sm">Mencari...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <Search className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                      <h3 className="text-slate-300 font-medium mb-1">Tidak ada hasil</h3>
                      <p className="text-slate-500 text-sm">
                        {searchTerm ? `Tidak ditemukan hasil untuk "${searchTerm}"` : 'Mulai ketik untuk mencari'}
                      </p>
                    </div>
                  ) : (
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-slate-700/50">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          {searchResults.length} Hasil Ditemukan
                        </p>
                      </div>
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleResultClick(result);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-all duration-200 group cursor-pointer block transform active:scale-95"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                              result.type === 'locker' 
                                ? 'bg-blue-600/20 text-blue-400' 
                                : result.type === 'item'
                                ? 'bg-green-600/20 text-green-400'
                                : 'bg-orange-600/20 text-orange-400'
                            }`}>
                              {result.type === 'locker' && <Package size={16} />}
                              {result.type === 'item' && <Package size={16} />}
                              {result.type === 'category' && <Tag size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                                  {result.name}
                                </h4>
                                {result.code && (
                                  <span className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded-full font-mono">
                                    {result.code}
                                  </span>
                                )}
                              </div>
                              
                              {result.description && (
                                <p className="text-xs text-slate-400 mb-1 line-clamp-1">
                                  {result.description}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-3 text-xs">
                                <span className={`px-2 py-0.5 rounded-full ${
                                  result.type === 'locker' 
                                    ? 'bg-blue-900/30 text-blue-300' 
                                    : result.type === 'item'
                                    ? 'bg-green-900/30 text-green-300'
                                    : 'bg-orange-900/30 text-orange-300'
                                }`}>
                                  {result.type === 'locker' ? 'Loker' : result.type === 'item' ? 'Barang' : 'Kategori'}
                                </span>
                                
                                {result.category && (
                                  <span className="text-slate-500 flex items-center space-x-1">
                                    <Tag size={10} />
                                    <span>{result.category}</span>
                                  </span>
                                )}
                                
                                {result.lockerInfo && (
                                  <span className="text-slate-500 flex items-center space-x-1">
                                    <MapPin size={10} />
                                    <span>{result.lockerInfo.code}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Mobile Search - Only show when user is logged in */}
          {session?.user && (
            <div className="flex-1 mx-2 relative sm:hidden" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => searchTerm && setShowSearchResults(true)}
                  className="w-full pl-10 pr-8 py-3 bg-slate-800/60 hover:bg-slate-800/80 focus:bg-slate-800/90 border border-slate-600/50 hover:border-slate-500/50 focus:border-blue-500/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 backdrop-blur-xl"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors duration-200 active:scale-95"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Mobile Search Results Dropdown - Full Width */}
              {showSearchResults && (
                <div className="absolute top-full mt-2 left-[-1rem] right-[-1rem] bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-600/50 py-2 z-50 max-h-80 overflow-y-auto">
                  {isSearching ? (
                    <div className="px-4 py-6 text-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-slate-400 text-xs">Mencari...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Search className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                      <h3 className="text-slate-300 font-medium text-sm mb-1">Tidak ada hasil</h3>
                      <p className="text-slate-500 text-xs">
                        {searchTerm ? `Tidak ditemukan hasil untuk "${searchTerm}"` : 'Mulai ketik untuk mencari'}
                      </p>
                    </div>
                  ) : (
                    <div className="py-1">
                      <div className="px-3 py-2 border-b border-slate-700/50">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          {searchResults.length} Hasil
                        </p>
                      </div>
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleResultClick(result);
                          }}
                          className="w-full px-3 py-2.5 text-left hover:bg-slate-700/50 transition-all duration-200 group cursor-pointer transform active:scale-95"
                        >
                          <div className="flex items-start space-x-2">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${
                              result.type === 'locker' 
                                ? 'bg-blue-600/20 text-blue-400' 
                                : result.type === 'item'
                                ? 'bg-green-600/20 text-green-400'
                                : 'bg-orange-600/20 text-orange-400'
                            }`}>
                              {result.type === 'locker' && <Package size={12} />}
                              {result.type === 'item' && <Package size={12} />}
                              {result.type === 'category' && <Tag size={12} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1 mb-0.5">
                                <h4 className="text-xs font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                                  {result.name}
                                </h4>
                                {result.code && (
                                  <span className="text-xs px-1.5 py-0.5 bg-slate-700/50 text-slate-300 rounded font-mono">
                                    {result.code}
                                  </span>
                                )}
                              </div>
                              
                              {result.description && (
                                <p className="text-xs text-slate-400 mb-1 line-clamp-1">
                                  {result.description}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-2 text-xs">
                                <span className={`px-1.5 py-0.5 rounded ${
                                  result.type === 'locker' 
                                    ? 'bg-blue-900/30 text-blue-300' 
                                    : result.type === 'item'
                                    ? 'bg-green-900/30 text-green-300'
                                    : 'bg-orange-900/30 text-orange-300'
                                }`}>
                                  {result.type === 'locker' ? 'Loker' : result.type === 'item' ? 'Barang' : 'Kategori'}
                                </span>
                                
                                {result.category && (
                                  <span className="text-slate-500 flex items-center space-x-1">
                                    <Tag size={8} />
                                    <span>{result.category}</span>
                                  </span>
                                )}
                                
                                {result.lockerInfo && (
                                  <span className="text-slate-500 flex items-center space-x-1">
                                    <MapPin size={8} />
                                    <span>{result.lockerInfo.code}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* User Section with Dropdown */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            
            {session?.user ? (
              <div className="relative" ref={dropdownRef}>
                {/* Profile Button */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="group flex items-center space-x-3 px-4 py-2 bg-slate-800/60 hover:bg-slate-700/80 rounded-xl border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50 transform active:scale-95"
                >
                  <div className="relative">
                    <Image
                      src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name || 'User'}&size=32&background=3B82F6&color=ffffff&rounded=true`}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full border-2 border-slate-500/50 group-hover:border-blue-400/50 transition-colors duration-300"
                    />
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-25 transition-opacity duration-300"></div>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-white leading-tight">
                      {session.user.name?.split(' ')[0] || 'User'}
                    </p>
                    <p className="text-xs text-slate-400 leading-tight">
                      Online
                    </p>
                  </div>
                  <ChevronDown 
                    size={18} 
                    className={`text-slate-400 group-hover:text-slate-300 transition-all duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-600/50 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                    {/* User Info */}
                    <div className="px-5 py-4 border-b border-slate-700/50">
                      <div className="flex items-center space-x-3">
                        <Image
                          src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name || 'User'}&size=40&background=3B82F6&color=ffffff&rounded=true`}
                          alt={session.user.name || 'User'}
                          width={40}
                          height={40}
                          className="rounded-full border-2 border-slate-600/50"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {session.user.name || 'User'}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {session.user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-2">
                      {/* PWA Install Button */}
                      {canInstall && (
                        <button
                          onClick={handleInstallPWA}
                          className="w-full flex items-center space-x-3 px-5 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 group transform active:scale-95"
                        >
                          <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30 transition-colors duration-200">
                            <Download size={16} className="text-blue-400" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">Install Aplikasi</p>
                            <p className="text-xs text-slate-500">Akses lebih cepat</p>
                          </div>
                        </button>
                      )}

                      {/* PWA Status */}
                      {isInstalled && (
                        <div className="w-full flex items-center space-x-3 px-5 py-3 text-sm">
                          <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-green-400">Aplikasi Terinstall</p>
                            <p className="text-xs text-slate-500">Siap digunakan</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-5 py-3 text-sm text-slate-300 hover:text-white hover:bg-red-600/10 transition-all duration-200 group mt-1 transform active:scale-95"
                      >
                        <div className="w-8 h-8 bg-red-600/20 rounded-lg flex items-center justify-center group-hover:bg-red-600/30 transition-colors duration-200">
                          <LogOut size={16} className="text-red-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium">Logout</p>
                          <p className="text-xs text-slate-500">Keluar dari akun</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Login Button */
              <button
                onClick={() => signIn('google')}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 transform active:scale-95"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity duration-300"></div>
                <span className="relative hidden sm:inline">Sign In with Google</span>
                <span className="relative sm:hidden">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Search Modal */}
      {showMobileSearch && session?.user && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 sm:hidden">
          <div className="bg-slate-900/95 backdrop-blur-xl min-h-screen">
            {/* Mobile Search Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white">Pencarian Global</h2>
              <button
                onClick={() => {
                  setShowMobileSearch(false);
                  clearSearch();
                }}
                className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 rounded-xl transition-all duration-200 transform active:scale-95"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Mobile Search Input */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Cari loker, barang, atau kategori..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  autoFocus
                  className="w-full pl-12 pr-10 py-4 bg-slate-800/60 border border-slate-600/50 focus:border-blue-500/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors duration-200 active:scale-95"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Mobile Search Results */}
            <div className="px-4 pb-4 max-h-[calc(100vh-140px)] overflow-y-auto">
              {isSearching ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-slate-400">Mencari...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 text-center">
                  <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-slate-300 font-medium mb-2">
                    {searchTerm ? 'Tidak ada hasil' : 'Mulai Pencarian'}
                  </h3>
                  <p className="text-slate-500 text-sm">
                    {searchTerm ? `Tidak ditemukan hasil untuk "${searchTerm}"` : 'Ketik untuk mencari loker, barang, atau kategori'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="py-2 border-b border-slate-700/50">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {searchResults.length} Hasil Ditemukan
                    </p>
                  </div>
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full p-4 bg-slate-800/30 hover:bg-slate-800/60 rounded-xl transition-all duration-200 text-left transform active:scale-95"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                          result.type === 'locker' 
                            ? 'bg-blue-600/20 text-blue-400' 
                            : result.type === 'item'
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-orange-600/20 text-orange-400'
                        }`}>
                          {result.type === 'locker' && <Package size={18} />}
                          {result.type === 'item' && <Package size={18} />}
                          {result.type === 'category' && <Tag size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-white truncate">
                              {result.name}
                            </h4>
                            {result.code && (
                              <span className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded-full font-mono">
                                {result.code}
                              </span>
                            )}
                          </div>
                          
                          {result.description && (
                            <p className="text-sm text-slate-400 mb-2 line-clamp-2">
                              {result.description}
                            </p>
                          )}
                          
                          <div className="flex items-center flex-wrap gap-2 text-xs">
                            <span className={`px-2 py-1 rounded-full ${
                              result.type === 'locker' 
                                ? 'bg-blue-900/30 text-blue-300' 
                                : result.type === 'item'
                                ? 'bg-green-900/30 text-green-300'
                                : 'bg-orange-900/30 text-orange-300'
                            }`}>
                              {result.type === 'locker' ? 'Loker' : result.type === 'item' ? 'Barang' : 'Kategori'}
                            </span>
                            
                            {result.category && (
                              <span className="text-slate-500 flex items-center space-x-1">
                                <Tag size={12} />
                                <span>{result.category}</span>
                              </span>
                            )}
                            
                            {result.lockerInfo && (
                              <span className="text-slate-500 flex items-center space-x-1">
                                <MapPin size={12} />
                                <span>{result.lockerInfo.code}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
