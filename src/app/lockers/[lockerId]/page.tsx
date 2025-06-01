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
      <div className="dark-theme min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/');
    return null;
  }

  if (!locker) {
    return (
      <div className="dark-theme min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-100">Loker tidak ditemukan</h2>
          <button
            onClick={() => router.push('/')}
            className="mt-4 dark-button-primary"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dark-theme min-h-screen pt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="dark-button flex items-center space-x-2 mb-6"
          >
            <ArrowLeft size={20} />
            <span>Kembali</span>
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">{locker.label}</h1>
              <p className="mt-2 text-slate-300">Kode: <span className="font-mono text-blue-400">{locker.code}</span></p>
              {locker.description && (
                <p className="mt-1 text-slate-400">{locker.description}</p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/lockers/${lockerId}/edit`)}
                className="dark-button flex items-center space-x-2"
                title="Edit loker"
              >
                <Settings size={16} />
                <span>Edit</span>
              </button>
              <button
                onClick={deleteLocker}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                title="Hapus loker"
              >
                <Trash2 size={16} />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* QR Code Section */}
          <div className="dark-card">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">QR Code</h2>
            <div className="text-center">
              <Image 
                src={locker.qrCode} 
                alt="QR Code"
                width={192}
                height={192}
                className="mx-auto mb-4 border border-slate-600 rounded"
              />
              <div className="space-y-2">
                <button
                  onClick={downloadQRCode}
                  className="dark-button-primary w-full flex items-center justify-center space-x-2"
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
                <button
                  onClick={printQRCode}
                  className="dark-button w-full flex items-center justify-center space-x-2"
                >
                  <QrCode size={16} />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="lg:col-span-2">
            <div className="dark-card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-slate-100">
                  Daftar Barang ({items.length})
                </h2>
                <a
                  href="/items/new"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Tambah Barang</span>
                </a>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-100 mb-2">Belum ada barang</h3>
                  <p className="text-slate-400 mb-4">Loker ini belum memiliki barang. Mulai tambahkan barang pertama.</p>
                  <a
                    href="/items/new"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>Tambah Barang</span>
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <div key={item._id} className="border border-slate-600 bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-slate-100">{item.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-300">×{item.quantity}</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => router.push(`/items/${item._id}/edit`)}
                              className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                              title="Edit barang"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteItem(item._id)}
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                              title="Hapus barang"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mb-1">Kategori: {item.category}</p>
                      {item.description && (
                        <p className="text-sm text-slate-400">{item.description}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
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
