'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

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
        router.push(`/lockers/${formData.lockerId}`);
      } else {
        alert('Gagal mengupdate barang. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/');
    return null;
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Barang tidak ditemukan</h2>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Kembali</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Barang</h1>
          <p className="mt-2 text-gray-600">Ubah informasi barang</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Barang *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan nama barang"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Kategori *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan jumlah barang"
              />
            </div>

            <div>
              <label htmlFor="lockerId" className="block text-sm font-medium text-gray-700 mb-2">
                Loker *
              </label>
              <select
                id="lockerId"
                name="lockerId"
                value={formData.lockerId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih loker</option>
                {lockers.map((locker) => (
                  <option key={locker._id} value={locker._id}>
                    {locker.label} ({locker.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi (Opsional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan deskripsi barang (opsional)"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                <span>{submitting ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
