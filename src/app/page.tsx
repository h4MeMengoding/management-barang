'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, Package, QrCode, Search, Eye, Edit2, Trash2, MoreVertical } from 'lucide-react';
import DatabaseTest from '@/components/DatabaseTest';

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
  lockerId: string;
  createdAt: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    return items.filter(item => item.lockerId === lockerId);
  };

  const deleteLocker = async (lockerId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus loker ini? Pastikan semua barang sudah dipindahkan atau dihapus terlebih dahulu.')) {
      return;
    }

    try {
      const response = await fetch(`/api/lockers/${lockerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the data
        fetchData();
        setDropdownOpen(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Gagal menghapus loker. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error deleting locker:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const filteredLockers = lockers.filter(locker =>
    locker.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locker.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">Selamat datang di Management Barang</h2>
          <p className="mt-1 text-sm text-gray-500">Silakan login untuk mengelola barang Anda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Kelola loker dan barang Anda</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Loker</p>
                <p className="text-2xl font-bold text-gray-900">{lockers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Barang</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <QrCode className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Loker Terisi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lockers.filter(locker => getItemsForLocker(locker._id).length > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Database Connection Test - Show only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6">
            <DatabaseTest />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Link
            href="/lockers/new"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Tambah Loker</span>
          </Link>
          <Link
            href="/items/new"
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Package size={20} />
            <span>Tambah Barang</span>
          </Link>
          <Link
            href="/qrcodes"
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <QrCode size={20} />
            <span>Kelola QR Code</span>
          </Link>
          <Link
            href="/scan"
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <QrCode size={20} />
            <span>Scan QR Code</span>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari loker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lockers Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat data...</p>
          </div>
        ) : filteredLockers.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada loker</h3>
            <p className="mt-1 text-sm text-gray-500">Mulai dengan menambahkan loker pertama Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLockers.map((locker) => {
              const lockerItems = getItemsForLocker(locker._id);
              return (
                <div key={locker._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{locker.label}</h3>
                      <p className="text-sm text-gray-500">Kode: {locker.code}</p>
                    </div>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setDropdownOpen(dropdownOpen === locker._id ? null : locker._id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {dropdownOpen === locker._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <a
                              href={`/lockers/${locker._id}`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Eye size={16} className="mr-2" />
                              Lihat Detail
                            </a>
                            <a
                              href={`/lockers/${locker._id}/edit`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit2 size={16} className="mr-2" />
                              Edit Loker
                            </a>
                            <button
                              onClick={() => deleteLocker(locker._id)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} className="mr-2" />
                              Hapus Loker
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {locker.description && (
                    <p className="text-gray-600 text-sm mb-4">{locker.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {lockerItems.length} barang
                    </span>
                    <div className="flex items-center space-x-2">
                      <img 
                        src={locker.qrCode} 
                        alt="QR Code"
                        className="w-8 h-8"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
