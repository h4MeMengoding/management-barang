'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Package, Plus, QrCode, Download, Edit2, Trash2, Settings } from 'lucide-react';
import Image from 'next/image';

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
  createdAt: string;
}

interface LockerDetailPageProps {
  params: Promise<{ lockerId: string }>;
}

export default function LockerDetailPage({ params }: LockerDetailPageProps) {
  return <LockerDetailContent params={params} />;
}

function LockerDetailContent({ params }: { params: Promise<{ lockerId: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [locker, setLocker] = useState<Locker | null>(null);
  const [lockerId, setLockerId] = useState<string>('');
  
  useEffect(() => {
    async function getLockerId() {
      const resolvedParams = await params;
      setLockerId(resolvedParams.lockerId);
    }
    getLockerId();
  }, [params]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLockerData = useCallback(async () => {
    if (!lockerId) return;
    
    try {
      const response = await fetch(`/api/lockers/${lockerId}`);
      if (response.ok) {
        const data = await response.json();
        setLocker(data.locker);
        setItems(data.items);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching locker data:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [lockerId, router]);

  useEffect(() => {
    if (session && lockerId) {
      fetchLockerData();
    }
  }, [session, lockerId, fetchLockerData]);

  const deleteItem = async (itemId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the locker data to update the items list
        fetchLockerData();
      } else {
        alert('Gagal menghapus barang. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const deleteLocker = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus loker ini? Pastikan semua barang sudah dipindahkan atau dihapus terlebih dahulu.')) {
      return;
    }

    try {
      const response = await fetch(`/api/lockers/${lockerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Gagal menghapus loker. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error deleting locker:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const downloadQRCode = () => {
    if (locker) {
      const link = document.createElement('a');
      link.download = `qr-code-${locker.code}.png`;
      link.href = locker.qrCode;
      link.click();
    }
  };

  const printQRCode = () => {
    if (locker) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${locker.label}</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                .qr-container { margin: 20px 0; }
                .qr-code { width: 200px; height: 200px; }
                .info { margin: 10px 0; }
              </style>
            </head>
            <body>
              <div class="info">
                <h2>${locker.label}</h2>
                <p>Kode: ${locker.code}</p>
                ${locker.description ? `<p>${locker.description}</p>` : ''}
              </div>
              <div class="qr-container">
                <img src="${locker.qrCode}" alt="QR Code" class="qr-code" />
              </div>
              <script>window.print();</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark-theme">
        <div className="dark-card p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 text-center">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/');
    return null;
  }

  if (!locker) {
    return (
      <div className="min-h-screen flex items-center justify-center dark-theme">
        <div className="dark-card p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-200 mb-4">Loker tidak ditemukan</h2>
          <p className="text-gray-400 mb-6">Loker yang Anda cari tidak ditemukan atau telah dihapus.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 dark-button text-gray-300 hover:text-gray-100 font-medium transition-all duration-200"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-theme pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-300 hover:text-gray-100 mb-6 dark-button px-4 py-2 transition-all duration-200"
          >
            <ArrowLeft size={20} />
            <span>Kembali</span>
          </button>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">{locker.label}</h1>
              <p className="text-gray-400">Kode: <span className="font-mono text-blue-400">{locker.code}</span></p>
              {locker.description && (
                <p className="mt-1 text-gray-400">{locker.description}</p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/lockers/${lockerId}/edit`)}
                className="flex items-center space-x-2 px-4 py-2 dark-button text-gray-300 hover:text-gray-100 transition-all duration-200"
                title="Edit loker"
              >
                <Settings size={16} />
                <span>Edit</span>
              </button>
              <button
                onClick={deleteLocker}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200"
                title="Hapus loker"
              >
                <Trash2 size={16} />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Code Section */}
          <div className="dark-card p-6">
            <h2 className="text-lg font-semibold text-gray-200 mb-6">QR Code</h2>
            <div className="text-center">
              <Image 
                src={locker.qrCode} 
                alt="QR Code"
                width={192}
                height={192}
                className="mx-auto mb-6 border border-gray-600 rounded-lg"
              />
              <div className="space-y-3">
                <button
                  onClick={downloadQRCode}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 dark-button text-blue-400 hover:text-blue-300 font-medium transition-all duration-200"
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
                <button
                  onClick={printQRCode}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 dark-button text-gray-300 hover:text-gray-100 font-medium transition-all duration-200"
                >
                  <QrCode size={16} />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="lg:col-span-2">
            <div className="dark-card p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <h2 className="text-lg font-semibold text-gray-200">
                  Daftar Barang ({items.length})
                </h2>
                <button
                  onClick={() => router.push('/items/new')}
                  className="flex items-center space-x-2 px-4 py-3 dark-button text-green-400 hover:text-green-300 font-medium transition-all duration-200"
                >
                  <Plus size={20} />
                  <span>Tambah Barang</span>
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-16 w-16 text-gray-500 mb-6" />
                  <h3 className="text-xl font-medium text-gray-200 mb-2">Belum ada barang</h3>
                  <p className="text-gray-400 mb-6">Loker ini belum memiliki barang. Mulai tambahkan barang pertama.</p>
                  <button
                    onClick={() => router.push('/items/new')}
                    className="inline-flex items-center space-x-2 px-6 py-3 dark-button text-green-400 hover:text-green-300 font-medium transition-all duration-200"
                  >
                    <Plus size={20} />
                    <span>Tambah Barang</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <div key={item._id} className="border border-gray-600 bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700/70 transition-all duration-200">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-medium text-gray-200">{item.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-300 bg-gray-600/50 px-2 py-1 rounded">×{item.quantity}</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => router.push(`/items/${item._id}/edit`)}
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-600/50 rounded-lg transition-all duration-200"
                              title="Edit barang"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteItem(item._id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600/50 rounded-lg transition-all duration-200"
                              title="Hapus barang"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        <span className="text-gray-400">Kategori:</span> {item.category}
                      </p>
                      {item.description && (
                        <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Ditambahkan: {new Date(item.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
