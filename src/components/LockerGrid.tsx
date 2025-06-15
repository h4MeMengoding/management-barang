'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Package, Eye, Edit2, Trash2, MoreVertical, Container } from 'lucide-react';
import { Locker, Item } from '@/types';
import { showSuccess, showError, showCustomConfirm } from '@/lib/alerts';
import { useButtonLoading } from '@/hooks/useButtonLoading';

interface LockerGridProps {
  lockers: Locker[];
  items: Item[];
  loading: boolean;
  getItemsForLocker: (lockerId: string) => Item[];
  onDataRefresh: () => void;
}

export function LockerGrid({ 
  lockers, 
  items, // eslint-disable-line @typescript-eslint/no-unused-vars
  loading, 
  getItemsForLocker, 
  onDataRefresh 
}: LockerGridProps) {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isLoading: isDeletingLocker, withLoading: withDeleteLoading } = useButtonLoading();

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
            onDataRefresh();
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Memuat data...</p>
      </div>
    );
  }

  if (lockers.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lockers.map((locker) => {
        const lockerItems = getItemsForLocker(locker._id);
        return (
          <div key={locker._id} className="dark-card qr-card-stroke p-6 transition-all duration-300 group">
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
  );
}
