'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, Package, QrCode, Search, Eye, Edit2, Trash2, MoreVertical, X, MapPin, Tag, Container } from 'lucide-react';
import Image from 'next/image';
import { showSuccess, showError, showCustomConfirm } from '@/lib/alerts';
import { useButtonLoading } from '@/hooks/useButtonLoading';

interface Locker {
  _id: string;
  code: string;
  label: string;
  description?: string;
  qrCode: string;
  createdAt: string;
}

interface Item {
  _id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  lockerId: string | { _id: string; code: string; label: string };
  createdAt: string;
}

// Counter Animation Component
interface CounterAnimationProps {
  end: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  delay?: number;
}

function CounterAnimation({ 
  end, 
  duration = 2000, 
  className = "text-3xl font-bold text-gray-100",
  prefix = "",
  suffix = "",
  delay = 0
}: CounterAnimationProps) {
  const [count, setCount] = useState(0);
  const countRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Reset counter when end value changes
    countRef.current = 0;
    setCount(0);
    
    // Skip animation for zero values
    if (end === 0) {
      setCount(0);
      return;
    }

    let timeoutId: NodeJS.Timeout | null = null;
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Enhanced easing: combine easeOutExpo with a slight bounce at the end
      let easedProgress;
      if (progress < 0.9) {
        // Use easeOutExpo for most of the animation
        easedProgress = 1 - Math.pow(2, -10 * progress);
      } else {
        // Add a small bounce at the end (subtle spring effect)
        const t = (progress - 0.9) / 0.1;
        easedProgress = 0.95 + Math.sin((t * Math.PI) / 2) * 0.05;
      }
      
      const nextCount = Math.floor(easedProgress * end);
      
      if (nextCount !== countRef.current) {
        countRef.current = nextCount;
        setCount(nextCount);
      }
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we end exactly at the target number
        setCount(end);
      }
    };
    
    if (delay > 0) {
      timeoutId = setTimeout(() => {
        startTimeRef.current = null;
        frameRef.current = requestAnimationFrame(animate);
      }, delay);
    } else {
      startTimeRef.current = null;
      frameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration, delay]);
  
  return (
    <div className="relative">
      <span className={`${className} inline-block transition-all`}>
        {prefix}{count.toLocaleString()}{suffix}
      </span>
    </div>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Item search states
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [itemSearchResults, setItemSearchResults] = useState<Item[]>([]);
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [isSearchingItems, setIsSearchingItems] = useState(false);

  // Loading states for buttons
  const { isLoading: isSigningIn, withLoading: withSignInLoading } = useButtonLoading();
  const { isLoading: isDeletingLocker, withLoading: withDeleteLoading } = useButtonLoading();

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [lockersRes, itemsRes] = await Promise.all([
        fetch('/api/lockers'),
        fetch('/api/items'),
      ]);
      
      if (lockersRes.ok) {
        const lockersData = await lockersRes.json();
        setLockers(lockersData);
      }
      
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemsForLocker = (lockerId: string) => {
    return items.filter(item => {
      const itemLockerId = typeof item.lockerId === 'string' 
        ? item.lockerId 
        : item.lockerId._id;
      return itemLockerId === lockerId;
    });
  };

  const searchItems = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setItemSearchResults([]);
      return;
    }

    setIsSearchingItems(true);
    try {
      const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setItemSearchResults(filteredItems);
    } catch (error) {
      console.error('Error searching items:', error);
      showError('Terjadi kesalahan saat mencari barang');
    } finally {
      setIsSearchingItems(false);
    }
  };

  const handleItemSearch = (query: string) => {
    setItemSearchTerm(query);
    searchItems(query);
  };

  const getLockerInfo = (lockerId: string | { _id: string; code: string; label: string }) => {
    if (typeof lockerId === 'object') {
      return lockerId;
    }
    return lockers.find(locker => locker._id === lockerId);
  };

  const deleteLocker = async (lockerId: string) => {
    showCustomConfirm(
      'Hapus Loker',
      'Apakah Anda yakin ingin menghapus loker ini? Pastikan semua barang sudah dipindahkan atau dihapus terlebih dahulu.',
      'Hapus',
      async () => {
        try {
          const response = await fetch(`/api/lockers/${lockerId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            // Refresh the data
            fetchData();
            setDropdownOpen(null);
            showSuccess('Loker berhasil dihapus');
          } else {
            const errorData = await response.json();
            showError(errorData.error || 'Gagal menghapus loker. Silakan coba lagi.');
          }
        } catch (error) {
          console.error('Error deleting locker:', error);
          showError('Terjadi kesalahan. Silakan coba lagi.');
        }
      },
      'danger'
    );
  };

  const filteredLockers = lockers.filter(locker =>
    locker.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locker.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center dark-theme">
        <div className="dark-card p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-400 text-center">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center dark-theme overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full dark-card opacity-10"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full dark-card opacity-5"></div>
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full dark-card opacity-15"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full dark-card opacity-20"></div>
        </div>

        <div className="relative z-10 text-center dark-card p-12 max-w-md mx-4">
          {/* Logo/Icon */}
          <div className="dark-icon inline-flex mb-8 p-6">
            <Package className="h-16 w-16 text-blue-500" />
          </div>
          
          {/* Welcome Text */}
          <h1 className="text-4xl font-bold text-gray-100 mb-3">
            Management Barang
          </h1>
          <p className="text-lg text-gray-300 mb-2">
            Sistem Manajemen Barang Modern
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Kelola barang dengan mudah menggunakan teknologi QR Code
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="flex items-center space-x-3 text-left p-3 dark-card">
              <div className="dark-icon p-2">
                <QrCode className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-gray-200">QR Code Integration</p>
                <p className="text-sm text-gray-400">Scan untuk akses cepat</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-left p-3 dark-card">
              <div className="dark-icon p-2">
                <Package className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-gray-200">Smart Organization</p>
                <p className="text-sm text-gray-400">Atur barang dengan loker</p>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={() => withSignInLoading(async () => {
              await signIn('google');
            })}
            disabled={isSigningIn}
            className="group relative w-full dark-button-primary p-4 text-white font-semibold text-lg overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transform transition-transform duration-150 active:scale-95"
          >
            <div className="relative flex items-center justify-center space-x-3">
              {isSigningIn ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Masuk dengan Google</span>
                </>
              )}
            </div>
          </button>

          {/* Footer */}
          <p className="mt-6 text-xs text-gray-500">
            Secure • Fast • Modern
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-theme pt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">Dashboard</h1>
          <p className="text-gray-400">Kelola loker dan barang Anda dengan mudah</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8">
          <div className="dark-stat hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="dark-icon animate-pulse mb-2 sm:mb-0 sm:mr-3">
                <Container className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 animate-spin-slow" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Total Loker</p>
                <CounterAnimation 
                  end={lockers.length} 
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-100"
                />
              </div>
            </div>
          </div>
          <div className="dark-stat hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-green-900/20">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="dark-icon animate-pulse mb-2 sm:mb-0 sm:mr-3">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 animate-spin-slow" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Total Barang</p>
                <CounterAnimation 
                  end={items.reduce((total, item) => total + item.quantity, 0)} 
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-100"
                />
              </div>
            </div>
          </div>
          <div className="dark-stat hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-orange-900/20">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="dark-icon animate-pulse mb-2 sm:mb-0 sm:mr-3">
                <Tag className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 animate-ping-slow" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Jenis Barang</p>
                <CounterAnimation 
                  end={items.length} 
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-100"
                />
              </div>
            </div>
          </div>
          <div className="dark-stat hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/20">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="dark-icon animate-pulse mb-2 sm:mb-0 sm:mr-3">
                <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 animate-float" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Loker Terisi</p>
                <CounterAnimation 
                  end={lockers.filter(locker => getItemsForLocker(locker._id).length > 0).length} 
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/lockers/new"
            className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 dark-button text-blue-400 font-medium hover:text-blue-300 transition-all duration-200 text-sm sm:text-base"
          >
            <Container size={18} className="sm:w-5 sm:h-5" />
            <span>Tambah Loker</span>
          </Link>
          <Link
            href="/items/new"
            className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 dark-button text-green-400 font-medium hover:text-green-300 transition-all duration-200 text-sm sm:text-base"
          >
            <Package size={18} className="sm:w-5 sm:h-5" />
            <span>Tambah Barang</span>
          </Link>
          <Link
            href="/categories"
            className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 dark-button text-yellow-400 font-medium hover:text-yellow-300 transition-all duration-200 text-sm sm:text-base"
          >
            <Tag size={18} className="sm:w-5 sm:h-5" />
            <span>Kelola Kategori</span>
          </Link>
          <Link
            href="/qrcodes"
            className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 dark-button text-indigo-400 font-medium hover:text-indigo-300 transition-all duration-200 text-sm sm:text-base"
          >
            <QrCode size={18} className="sm:w-5 sm:h-5" />
            <span>Kelola QR Code</span>
          </Link>
          <Link
            href="/scan"
            className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 dark-button text-purple-400 font-medium hover:text-purple-300 transition-all duration-200 text-sm sm:text-base"
          >
            <QrCode size={18} className="sm:w-5 sm:h-5" />
            <span>Scan QR Code</span>
          </Link>
          <button
            onClick={() => setShowItemSearch(true)}
            className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 dark-button text-orange-400 font-medium hover:text-orange-300 transition-all duration-200 text-sm sm:text-base transform active:scale-95"
          >
            <Search size={18} className="sm:w-5 sm:h-5" />
            <span>Cari Barang</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari loker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 dark-input text-gray-200 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Lockers Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Memuat data...</p>
          </div>
        ) : filteredLockers.length === 0 ? (
          <div className="text-center py-16">
            <div className="dark-icon inline-flex mb-6 p-6">
              <Container className="h-16 w-16 text-gray-500" />
            </div>
            <h3 className="mt-2 text-xl font-medium text-gray-200">Belum ada loker</h3>
            <p className="mt-2 text-sm text-gray-400">Mulai dengan menambahkan loker pertama Anda.</p>
            <Link
              href="/lockers/new"
              className="inline-flex items-center space-x-2 mt-6 px-6 py-3 dark-button-primary text-white font-medium transition-all duration-200"
            >
              <Plus size={18} />
              <span>Tambah Loker Pertama</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLockers.map((locker) => {
              const lockerItems = getItemsForLocker(locker._id);
              return (
                <div key={locker._id} className="dark-card p-6 hover:scale-105 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-4">
                    <Link href={`/lockers/${locker._id}`} className="flex-1 cursor-pointer">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-100 group-hover:text-blue-400 transition-colors hover:text-blue-400">
                          {locker.label}
                        </h3>
                        <p className="text-sm text-gray-400">Kode: {locker.code}</p>
                      </div>
                    </Link>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setDropdownOpen(dropdownOpen === locker._id ? null : locker._id)}
                        className="p-2 text-gray-400 hover:text-gray-200 dark-button transition-all duration-200 transform active:scale-95"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {dropdownOpen === locker._id && (
                        <div className="absolute right-0 mt-2 w-48 dark-card py-2 z-10 border border-slate-600/50">
                          <div className="py-1">
                            <a
                              href={`/lockers/${locker._id}`}
                              className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-blue-400 rounded-lg mx-2 transition-all duration-200"
                            >
                              <Eye size={16} className="mr-2" />
                              Lihat Detail
                            </a>
                            <a
                              href={`/lockers/${locker._id}/edit`}
                              className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-green-400 rounded-lg mx-2 transition-all duration-200"
                            >
                              <Edit2 size={16} className="mr-2" />
                              Edit Loker
                            </a>
                            <button
                              onClick={() => withDeleteLoading(async () => {
                                await deleteLocker(locker._id);
                              })}
                              disabled={isDeletingLocker}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg mx-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                            >
                              {isDeletingLocker ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400 mr-2"></div>
                                  Menghapus...
                                </>
                              ) : (
                                <>
                                  <Trash2 size={16} className="mr-2" />
                                  Hapus Loker
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {locker.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{locker.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 font-medium flex items-center space-x-2">
                      <Package size={16} />
                      <span>{lockerItems.reduce((total, item) => total + item.quantity, 0)} barang</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="dark-icon p-2 group-hover:scale-110 transition-transform duration-200">
                        <Image 
                          src={locker.qrCode} 
                          alt="QR Code"
                          width={24}
                          height={24}
                          className="rounded"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress indicator for items */}
                  <div className="mt-4 pt-4 border-t border-slate-600/30">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lockerItems.length > 0 
                          ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
                          : 'bg-gray-800/50 text-gray-500 border border-gray-600/30'
                      }`}>
                        {lockerItems.length > 0 ? 'Terisi' : 'Kosong'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Item Search Modal */}
        {showItemSearch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="dark-card max-w-4xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-600/50">
                <h2 className="text-lg sm:text-xl font-bold text-gray-100">Pencarian Barang</h2>
                <button
                  onClick={() => {
                    setShowItemSearch(false);
                    setItemSearchTerm('');
                    setItemSearchResults([]);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-200 dark-button transition-all duration-200 transform active:scale-95"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="relative mb-4 sm:mb-6">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Cari nama barang, deskripsi, atau kategori..."
                    value={itemSearchTerm}
                    onChange={(e) => handleItemSearch(e.target.value)}
                    className="w-full pl-12 pr-4 dark-input text-gray-200 placeholder-gray-500"
                    autoFocus
                  />
                </div>

                <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                  {isSearchingItems ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-4 text-gray-400">Mencari barang...</p>
                    </div>
                  ) : itemSearchTerm && itemSearchResults.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-200 mb-2">Barang tidak ditemukan</h3>
                      <p className="text-gray-400">Tidak ada barang yang sesuai dengan pencarian &ldquo;{itemSearchTerm}&rdquo;</p>
                    </div>
                  ) : itemSearchResults.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-400 mb-4">
                        Ditemukan {itemSearchResults.reduce((total, item) => total + item.quantity, 0)} barang ({itemSearchResults.length} jenis)
                      </p>
                      {itemSearchResults.map((item) => {
                        const lockerInfo = getLockerInfo(item.lockerId);
                        return (
                          <div key={item._id} className="dark-card p-3 sm:p-4 hover:bg-slate-700/50 transition-all duration-200">
                            <div className="flex flex-col gap-3">
                              {/* Item Header - Name with Quantity */}
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base sm:text-lg font-semibold text-gray-100 break-words">
                                    {item.name} ({item.quantity})
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded-full border border-blue-500/30">
                                      {item.category}
                                    </span>
                                  </div>
                                  {item.description && (
                                    <p className="text-gray-400 text-sm mt-2 break-words line-clamp-2">{item.description}</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Locker Information */}
                              {lockerInfo && (
                                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
                                  <div className="flex flex-col gap-3">
                                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                                      <div className="dark-icon p-1.5 flex-shrink-0">
                                        <MapPin className="h-3 w-3 text-green-500" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-200 truncate">
                                          {lockerInfo.label} • {lockerInfo.code}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Link
                                        href={`/items/${item._id}/edit`}
                                        className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-all duration-200"
                                      >
                                        <Edit2 size={12} />
                                        <span>Edit Barang</span>
                                      </Link>
                                      <Link
                                        href={`/lockers/${lockerInfo._id}`}
                                        className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-all duration-200"
                                      >
                                        <Eye size={12} />
                                        <span>Lihat Loker</span>
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-200 mb-2">Mulai Pencarian</h3>
                      <p className="text-gray-400">Ketik nama barang, deskripsi, atau kategori untuk mencari</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
