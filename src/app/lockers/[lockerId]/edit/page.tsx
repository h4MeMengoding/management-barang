'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save } from 'lucide-react';
import { showSuccess, showError } from '@/lib/alerts';

interface Locker {
  _id: string;
  code: string;
  label: string;
  description?: string;
  qrCode: string;
  createdAt: string;
}

function EditLockerContent({ params }: { params: Promise<{ lockerId: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [locker, setLocker] = useState<Locker | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lockerId, setLockerId] = useState<string>('');

  useEffect(() => {
    params.then(({ lockerId }) => setLockerId(lockerId));
  }, [params]);
  const [formData, setFormData] = useState({
    label: '',
    description: '',
  });

  const fetchLockerData = useCallback(async () => {
    if (!lockerId) return;
    
    try {
      const response = await fetch(`/api/lockers/${lockerId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.locker) {
          setLocker(data.locker);
          setFormData({
            label: data.locker.label || '',
            description: data.locker.description || '',
          });
        } else {
          console.error('Locker data not found in response');
          router.push('/');
        }
      } else {
        console.error('Failed to fetch locker:', response.status);
        const errorData = await response.json();
        console.error('Error data:', errorData);
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching locker:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/lockers/${lockerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showSuccess('Loker berhasil diperbarui!');
        router.push(`/lockers/${lockerId}`);
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Gagal mengupdate loker. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error updating locker:', error);
      showError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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
            className="mt-4 dark-button-primary transform active:scale-95"
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
            className="flex items-center space-x-2 text-gray-300 hover:text-gray-100 mb-6 dark-button px-4 py-2 transition-all duration-200 transform active:scale-95"
          >
            <ArrowLeft size={20} />
            <span>Kembali</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">Edit Loker</h1>
          <p className="text-gray-400">Ubah informasi loker yang sudah ada</p>
        </div>

        <div className="dark-card p-8">
          <div className="mb-8 p-6 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <h3 className="text-blue-300 font-medium mb-3">📋 Informasi Loker</h3>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-900/30 border-2 border-blue-600/50 rounded-lg flex items-center justify-center">
                <span className="text-blue-300 font-bold text-lg">{locker.code}</span>
              </div>
              <div>
                <p className="text-sm text-blue-200">
                  <span className="font-semibold">Kode:</span> {locker.code}
                </p>
                <p className="text-xs text-blue-300 mt-1">
                  Kode loker tidak dapat diubah setelah dibuat
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-300 mb-3">
                Label Loker *
              </label>
              <input
                type="text"
                id="label"
                name="label"
                value={formData.label}
                onChange={handleChange}
                required
                className="w-full dark-input text-gray-200 placeholder-gray-500"
                placeholder="Contoh: Loker Elektronik Kantor"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-3">
                Deskripsi Loker
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full dark-input text-gray-200 placeholder-gray-500 resize-none"
                placeholder="Deskripsi tambahan tentang loker (opsional)"
              />
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-yellow-300 mb-3">
                💡 Informasi Penting:
              </h3>
              <ul className="text-sm text-yellow-200 space-y-2">
                <li>• Kode loker tidak dapat diubah setelah dibuat</li>
                <li>• Perubahan akan diterapkan ke semua barang dalam loker ini</li>
                <li>• QR code akan tetap sama setelah edit</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 dark-button text-gray-300 hover:text-gray-100 transition-all duration-200 font-medium transform active:scale-95"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 px-6 py-3 dark-button text-blue-400 hover:text-blue-300 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 disabled:active:scale-100"
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

export default function EditLocker({ params }: { params: Promise<{ lockerId: string }> }) {
  return <EditLockerContent params={params} />;
}
