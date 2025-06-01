'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, QrCode } from 'lucide-react';

function InitializeLockerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const qrCodeId = searchParams.get('qrCodeId');
  const code = searchParams.get('code');

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

  if (!qrCodeId || !code) {
    return (
      <div className="min-h-screen dark-theme flex items-center justify-center pt-16">
        <div className="dark-card p-8 text-center max-w-md mx-auto">
          <QrCode className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-red-400 mb-4">Data Tidak Valid</h1>
          <p className="text-gray-400 mb-6">
            Parameter yang diperlukan untuk inisiasi loker tidak lengkap.
          </p>
          <button
            onClick={() => router.push('/scan')}
            className="px-6 py-3 dark-button-primary text-white font-medium transition-all duration-200"
          >
            Kembali ke Scan
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">
            Inisiasi Loker Baru
          </h1>
          <p className="text-gray-400">
            Buat loker baru menggunakan QR code yang sudah dipindai
          </p>
        </div>

        <div className="dark-card p-8">
          <div className="mb-8 p-6 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
              <QrCode className="mr-2" size={20} />
              QR Code yang Dipindai
            </h2>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-900/30 border-2 border-blue-600/50 rounded-lg flex items-center justify-center">
                <span className="text-blue-300 font-bold text-lg">{code}</span>
              </div>
              <div>
                <p className="text-sm text-blue-200">
                  <span className="font-semibold">Kode:</span> {code}
                </p>
                <p className="text-xs text-blue-300 mt-1">
                  QR Code ini akan digunakan untuk loker baru
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-300 mb-3">
                Nama Loker *
              </label>
              <input
                type="text"
                id="label"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Contoh: Loker Elektronik Kantor"
                className="w-full dark-input text-gray-200 placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-3">
                Deskripsi Loker
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi opsional untuk loker ini..."
                rows={4}
                className="w-full dark-input text-gray-200 placeholder-gray-500 resize-none"
              />
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-yellow-300 mb-3">
                💡 Informasi Penting:
              </h3>
              <ul className="text-sm text-yellow-200 space-y-2">
                <li>• QR Code ini akan dipasangkan dengan loker baru</li>
                <li>• Setelah diinisiasi, QR Code tidak dapat digunakan lagi untuk loker lain</li>
                <li>• Anda dapat menambahkan items ke loker setelah inisiasi</li>
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
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 dark-button text-green-400 hover:text-green-300 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                <span>{loading ? 'Menginisiasi...' : 'Inisiasi Loker'}</span>
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
      <div className="min-h-screen dark-theme pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="dark-card p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400 text-center">Memuat...</p>
          </div>
        </div>
      </div>
    }>
      <InitializeLockerContent />
    </Suspense>
  );
}
