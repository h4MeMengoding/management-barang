'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Package, MapPin, Tag, Calendar, Edit3 } from 'lucide-react';
import Link from 'next/link';

interface ItemData {
  _id: string;
  name: string;
  description?: string;
  category: string;
  lockerId?: {
    _id: string;
    code: string;
    label: string;
    description?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [item, setItem] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemId = params.itemId as string;

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/items/${itemId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Barang tidak ditemukan');
          } else {
            setError('Gagal memuat data barang');
          }
          return;
        }

        const itemData = await response.json();
        setItem(itemData);
      } catch (error) {
        console.error('Error fetching item:', error);
        setError('Terjadi kesalahan saat memuat data');
      } finally {
        setLoading(false);
      }
    };

    if (!session) {
      router.push('/');
      return;
    }

    if (itemId) {
      fetchItem();
    }
  }, [session, itemId, router]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen dark-theme pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/4 mb-6"></div>
            <div className="dark-card qr-card-stroke p-8">
              <div className="h-12 bg-slate-700 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-slate-700 rounded w-1/2 mb-8"></div>
              <div className="space-y-6">
                <div className="h-20 bg-slate-700 rounded"></div>
                <div className="h-20 bg-slate-700 rounded"></div>
                <div className="h-20 bg-slate-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen dark-theme pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-300 hover:text-gray-100 mb-6 dark-button px-4 py-2 transition-all duration-200 transform active:scale-95"
          >
            <ArrowLeft size={20} />
            <span>Kembali</span>
          </button>
          
          <div className="dark-card qr-card-stroke p-8 text-center">
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-100 mb-2">
              {error}
            </h2>
            <p className="text-gray-400 mb-6">
              Silakan periksa kembali atau hubungi administrator.
            </p>
            <button
              onClick={() => router.back()}
              className="dark-button px-6 py-3 transform active:scale-95"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <div className="min-h-screen dark-theme pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-300 hover:text-gray-100 mb-6 dark-button px-4 py-2 transition-all duration-200 transform active:scale-95"
          >
            <ArrowLeft size={20} />
            <span>Kembali</span>
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">
                {item.name}
              </h1>
              <p className="text-gray-400">
                Detail informasi barang
              </p>
            </div>
            
            <Link
              href={`/items/${item._id}/edit`}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 transform active:scale-95"
            >
              <Edit3 size={18} />
              <span className="hidden sm:inline">Edit Barang</span>
            </Link>
          </div>
        </div>

        {/* Item Details */}
        <div className="dark-card qr-card-stroke p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-blue-400" />
                  Informasi Dasar
                </h3>
                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Nama Barang
                    </label>
                    <p className="text-gray-100 text-lg font-medium">
                      {item.name}
                    </p>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Deskripsi
                    </label>
                    <p className="text-gray-100">
                      {item.description || 'Tidak ada deskripsi'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-green-400" />
                  Kategori
                </h3>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center space-x-2">
                    <span className="bg-green-600/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-600/30">
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Locker Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-purple-400" />
                  Lokasi Penyimpanan
                </h3>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  {item.lockerId ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Kode Loker
                        </label>
                        <p className="text-gray-100 font-mono text-lg">
                          {item.lockerId.code}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Label Loker
                        </label>
                        <p className="text-gray-100">
                          {item.lockerId.label}
                        </p>
                      </div>
                      
                      {item.lockerId.description && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Deskripsi Loker
                          </label>
                          <p className="text-gray-400 text-sm">
                            {item.lockerId.description}
                          </p>
                        </div>
                      )}
                      
                      <div className="pt-2">
                        <Link
                          href={`/lockers/${item.lockerId._id}`}
                          className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 text-sm transition-colors duration-200 transform active:scale-95"
                        >
                          <MapPin size={16} />
                          <span>Lihat Detail Loker</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <MapPin className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400">
                        Belum ditentukan lokasi penyimpanan
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-orange-400" />
                  Riwayat
                </h3>
                <div className="space-y-3">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tanggal Dibuat
                    </label>
                    <p className="text-gray-100 text-sm">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                  
                  {item.updatedAt && item.updatedAt !== item.createdAt && (
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Terakhir Diubah
                      </label>
                      <p className="text-gray-100 text-sm">
                        {formatDate(item.updatedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
