'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

function InitializeLockerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const qrCodeId = searchParams.get('qrCodeId');
  const code = searchParams.get('code');
  const qrCodeImage = searchParams.get('qrCodeImage');

  const [formData, setFormData] = useState({
    label: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label.trim()) {
      alert('Nama loker harus diisi');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/lockers/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCodeId,
          label: formData.label.trim(),
          description: formData.description.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Loker berhasil diinisiasi!');
        router.push(`/lockers/${data.locker._id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error initializing locker:', error);
      alert('Terjadi kesalahan saat menginisiasi loker');
    } finally {
      setLoading(false);
    }
  };

  if (!qrCodeId || !code || !qrCodeImage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Data Tidak Valid</h1>
          <p className="text-gray-600 mb-4">
            Parameter yang diperlukan untuk inisiasi loker tidak lengkap.
          </p>
          <button
            onClick={() => router.push('/scan')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Kembali ke Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Inisiasi Loker Baru
          </h1>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              QR Code yang Dipindai
            </h2>
            <div className="flex items-center space-x-4">
              <Image
                src={qrCodeImage}
                alt={`QR Code ${code}`}
                width={80}
                height={80}
                className="border border-gray-300 rounded"
              />
              <div>
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Kode:</span> {code}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  QR Code ini akan digunakan untuk loker baru
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Loker *
              </label>
              <input
                type="text"
                id="label"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Contoh: Loker Elektronik Kantor"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Loker
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi opsional untuk loker ini..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                Informasi Penting:
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• QR Code ini akan dipasangkan dengan loker baru</li>
                <li>• Setelah diinisiasi, QR Code tidak dapat digunakan lagi untuk loker lain</li>
                <li>• Anda dapat menambahkan items ke loker setelah inisiasi</li>
              </ul>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {loading ? 'Menginisiasi...' : 'Inisiasi Loker'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function InitializeLockerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-center mb-6">Loading...</h1>
          </div>
        </div>
      </div>
    }>
      <InitializeLockerContent />
    </Suspense>
  );
}
