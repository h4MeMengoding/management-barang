'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewLocker() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    label: '',
    description: '',
  });

  // Generate random 4-digit code
  const generateCode = async () => {
    try {
      const response = await fetch('/api/lockers/generate-code');
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, code: data.code }));
      } else {
        // Fallback to local generation
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setFormData(prev => ({ ...prev, code }));
      }
    } catch (error) {
      console.error('Error generating code:', error);
      // Fallback to local generation
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setFormData(prev => ({ ...prev, code }));
    }
  };

  // Generate code on component mount
  useEffect(() => {
    if (session) {
      generateCode();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/lockers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Loker berhasil dibuat!');
        router.push('/');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal membuat loker');
      }
    } catch (error) {
      console.error('Error creating locker:', error);
      toast.error('Gagal membuat loker');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">Tambah Loker Baru</h1>
          <p className="text-gray-400">Buat loker baru dengan QR code untuk mengelola barang</p>
        </div>

        <div className="dark-card p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-300 mb-3">
                Label Loker *
              </label>
              <input
                type="text"
                id="label"
                name="label"
                required
                value={formData.label}
                onChange={handleChange}
                placeholder="Contoh: Loker Kamar Tidur, Rak Buku, dst"
                className="w-full dark-input text-gray-200 placeholder-gray-500"
              />
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-3">
                Kode Loker
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  readOnly
                  className="flex-1 dark-input text-gray-200 cursor-not-allowed opacity-75"
                />
                <button
                  type="button"
                  onClick={generateCode}
                  className="flex items-center space-x-2 px-4 py-3 dark-button text-blue-400 hover:text-blue-300 transition-all duration-200"
                  title="Generate kode baru"
                >
                  <RefreshCw size={16} />
                  <span>Baru</span>
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Kode 4 digit yang digenerate otomatis untuk mengidentifikasi loker
              </p>
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
                placeholder="Deskripsi tambahan tentang loker (opsional)"
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
                className="flex items-center space-x-2 px-6 py-3 dark-button text-blue-400 hover:text-blue-300 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                <span>{loading ? 'Menyimpan...' : 'Simpan Loker'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
