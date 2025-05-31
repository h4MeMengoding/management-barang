'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface Locker {
  _id: string;
  code: string;
  label: string;
  description?: string;
  qrCode: string;
  createdAt: string;
}

function EditLockerContent({ lockerId }: { lockerId: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [locker, setLocker] = useState<Locker | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    description: '',
  });

  const fetchLockerData = useCallback(async () => {
    try {
      const response = await fetch(`/api/lockers/${lockerId}`);
      if (response.ok) {
        const data = await response.json();
        setLocker(data.locker);
        setFormData({
          label: data.locker.label,
          description: data.locker.description || '',
        });
      } else {
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
    if (session) {
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
        router.push(`/lockers/${lockerId}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Gagal mengupdate loker. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error updating locker:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/');
    return null;
  }

  if (!locker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Loker tidak ditemukan</h2>
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Loker</h1>
          <p className="mt-2 text-gray-600">Ubah informasi loker</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Informasi Loker</h3>
            <p className="text-sm text-gray-600">Kode: <span className="font-mono">{locker.code}</span></p>
            <p className="text-xs text-gray-500 mt-1">
              Kode loker tidak dapat diubah setelah dibuat
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-2">
                Label Loker *
              </label>
              <input
                type="text"
                id="label"
                name="label"
                value={formData.label}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan label loker"
              />
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
                placeholder="Masukkan deskripsi loker (opsional)"
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

export default async function EditLocker({ params }: { params: Promise<{ lockerId: string }> }) {
  const { lockerId } = await params;
  
  return <EditLockerContent lockerId={lockerId} />;
}
