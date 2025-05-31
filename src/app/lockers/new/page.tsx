'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';

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
        router.push('/');
      } else {
        const error = await response.json();
        alert(error.error || 'Gagal membuat loker');
      }
    } catch (error) {
      console.error('Error creating locker:', error);
      alert('Gagal membuat loker');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/');
    return null;
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
          <h1 className="text-3xl font-bold text-gray-900">Tambah Loker Baru</h1>
          <p className="mt-2 text-gray-600">Buat loker baru dengan QR code untuk mengelola barang</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Kode Loker
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={generateCode}
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="Generate kode baru"
                >
                  <RefreshCw size={16} />
                  <span>Baru</span>
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Kode 4 digit yang digenerate otomatis untuk mengidentifikasi loker
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Deskripsi tambahan tentang loker (opsional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
