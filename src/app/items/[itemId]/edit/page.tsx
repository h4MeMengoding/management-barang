'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save } from 'lucide-react';
import { showSuccess, showError } from '@/lib/alerts';

interface Item {
  _id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  lockerId: {
    _id: string;
    code: string;
    label: string;
  };
}

interface Locker {
  _id: string;
  code: string;
  label: string;
}

interface EditItemPageProps {
  params: Promise<{ itemId: string }>;
}

export default function EditItemPage({ params }: EditItemPageProps) {
  return <EditItemContent params={params} />;
}

function EditItemContent({ params }: { params: Promise<{ itemId: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [item, setItem] = useState<Item | null>(null);
  const [itemId, setItemId] = useState<string>('');
  
  useEffect(() => {
    async function getItemId() {
      const resolvedParams = await params;
      setItemId(resolvedParams.itemId);
    }
    getItemId();
  }, [params]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: 1,
    lockerId: '',
  });

  const fetchItemData = useCallback(async () => {
    if (!itemId) return;
    try {
      const response = await fetch(`/api/items/${itemId}`);
      if (response.ok) {
        const itemData = await response.json();
        setItem(itemData);
        setFormData({
          name: itemData.name,
          description: itemData.description || '',
          category: itemData.category,
          quantity: itemData.quantity,
          lockerId: itemData.lockerId._id,
        });
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [itemId, router]);

  const fetchLockers = useCallback(async () => {
    try {
      const response = await fetch('/api/lockers');
      if (response.ok) {
        const lockersData = await response.json();
        setLockers(lockersData);
      }
    } catch (error) {
      console.error('Error fetching lockers:', error);
    }
  }, []);

  useEffect(() => {
    if (session && itemId) {
      fetchItemData();
      fetchLockers();
    }
  }, [session, itemId, fetchItemData, fetchLockers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showSuccess('Barang berhasil diperbarui!');
        router.push(`/lockers/${formData.lockerId}`);
      } else {
        showError('Gagal mengupdate barang. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      showError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value,
    }));
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

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center dark-theme">
        <div className="dark-card p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-200 mb-4">Barang tidak ditemukan</h2>
          <p className="text-gray-400 mb-6">Barang yang Anda cari tidak ditemukan atau telah dihapus.</p>
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-300 hover:text-gray-100 mb-6 dark-button px-4 py-2 transition-all duration-200"
          >
            <ArrowLeft size={20} />
            <span>Kembali</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">Edit Barang</h1>
          <p className="text-gray-400">Ubah informasi barang yang sudah ada</p>
        </div>

        <div className="dark-card p-8">
          <div className="mb-8 p-6 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <h3 className="text-blue-300 font-medium mb-3">📦 Informasi Barang</h3>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-900/30 border-2 border-blue-600/50 rounded-lg flex items-center justify-center">
                <span className="text-blue-300 font-bold text-sm">{item.lockerId.code}</span>
              </div>
              <div>
                <p className="text-sm text-blue-200">
                  <span className="font-semibold">Loker:</span> {item.lockerId.label} ({item.lockerId.code})
                </p>
                <p className="text-xs text-blue-300 mt-1">
                  Barang saat ini berada di loker ini
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-3">
                Nama Barang *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full dark-input text-gray-200 placeholder-gray-500"
                placeholder="Masukkan nama barang"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-3">
                Kategori *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full dark-input text-gray-200"
              >
                <option value="">Pilih kategori</option>
                <option value="Elektronik">Elektronik</option>
                <option value="Alat Rumah Tangga">Alat Rumah Tangga</option>
                <option value="Pakaian">Pakaian</option>
                <option value="Makanan">Makanan</option>
                <option value="Alat Tulis">Alat Tulis</option>
                <option value="Obat-obatan">Obat-obatan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-3">
                Jumlah *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                required
                className="w-full dark-input text-gray-200 placeholder-gray-500"
                placeholder="Masukkan jumlah barang"
              />
            </div>

            <div>
              <label htmlFor="lockerId" className="block text-sm font-medium text-gray-300 mb-3">
                Loker *
              </label>
              <select
                id="lockerId"
                name="lockerId"
                value={formData.lockerId}
                onChange={handleChange}
                required
                className="w-full dark-input text-gray-200"
              >
                <option value="">Pilih loker</option>
                {lockers.map((locker) => (
                  <option key={locker._id} value={locker._id}>
                    {locker.code} - {locker.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-3">
                Deskripsi (Opsional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full dark-input text-gray-200 placeholder-gray-500 resize-none"
                placeholder="Deskripsi tambahan tentang barang (opsional)"
              />
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-yellow-300 mb-3">
                💡 Informasi Penting:
              </h3>
              <ul className="text-sm text-yellow-200 space-y-2">
                <li>• Mengubah loker akan memindahkan barang ke loker yang dipilih</li>
                <li>• Pastikan informasi barang sudah benar sebelum menyimpan</li>
                <li>• Perubahan akan langsung diterapkan setelah disimpan</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 dark-button text-gray-300 hover:text-gray-100 transition-all duration-200 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 px-6 py-3 dark-button text-blue-400 hover:text-blue-300 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                <span>{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
