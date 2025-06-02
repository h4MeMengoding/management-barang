'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { showSuccess, showError } from '@/lib/alerts';
import CategoryAutocomplete from '@/components/CategoryAutocomplete';

interface Locker {
  _id: string;
  code: string;
  label: string;
}

export default function NewItem() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: 1,
    lockerId: '',
  });

  useEffect(() => {
    if (session) {
      fetchLockers();
    }
  }, [session]);

  const fetchLockers = async () => {
    try {
      const response = await fetch('/api/lockers');
      if (response.ok) {
        const data = await response.json();
        setLockers(data);
      }
    } catch (error) {
      console.error('Error fetching lockers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showSuccess('Barang berhasil ditambahkan!');
        router.push('/');
      } else {
        const error = await response.json();
        showError(error.error || 'Gagal membuat barang');
      }
    } catch (error) {
      console.error('Error creating item:', error);
      showError('Gagal membuat barang');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleCategoryChange = (category: string) => {
    setFormData({
      ...formData,
      category: category,
    });
  };

  if (status === 'loading') {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">Tambah Barang Baru</h1>
          <p className="text-gray-400">Tambahkan barang baru ke dalam loker</p>
        </div>

        {lockers.length === 0 ? (
          <div className="dark-card p-8 text-center">
            <Package className="mx-auto h-16 w-16 text-gray-500 mb-6" />
            <h3 className="text-xl font-medium text-gray-200 mb-2">Belum ada loker</h3>
            <p className="text-gray-400 mb-6">Anda perlu membuat loker terlebih dahulu sebelum menambah barang.</p>
            <Link
              href="/lockers/new"
              className="inline-flex items-center space-x-2 px-6 py-3 dark-button-primary text-white font-medium transition-all duration-200"
            >
              <span>Buat Loker</span>
            </Link>
          </div>
        ) : (
          <div className="dark-card p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-3">
                  Nama Barang *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Buku Harry Potter, Charger Laptop, dst"
                  className="w-full dark-input text-gray-200 placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-3">
                  Kategori *
                </label>
                <CategoryAutocomplete
                  value={formData.category}
                  onChange={handleCategoryChange}
                  placeholder="Ketik atau pilih kategori (contoh: Elektronik, Buku, Pakaian)"
                  required
                  className="dark-input text-gray-200 placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Ketik kategori baru untuk menambahkannya secara otomatis
                </p>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-3">
                  Jumlah *
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full dark-input text-gray-200"
                />
              </div>

              <div>
                <label htmlFor="lockerId" className="block text-sm font-medium text-gray-300 mb-3">
                  Loker *
                </label>
                <select
                  id="lockerId"
                  name="lockerId"
                  required
                  value={formData.lockerId}
                  onChange={handleChange}
                  className="w-full dark-input text-gray-200"
                >
                  <option value="">Pilih Loker</option>
                  {lockers.map((locker) => (
                    <option key={locker._id} value={locker._id}>
                      {locker.code} - {locker.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-3">
                  Deskripsi
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Deskripsi tambahan tentang barang (opsional)"
                  className="w-full dark-input text-gray-200 placeholder-gray-500 resize-none"
                />
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
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-3 dark-button text-green-400 hover:text-green-300 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  <span>{loading ? 'Menyimpan...' : 'Simpan Barang'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
