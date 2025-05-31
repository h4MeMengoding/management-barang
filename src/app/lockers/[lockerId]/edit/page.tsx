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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="dark-button flex items-center space-x-2 mb-6"
          >
            <ArrowLeft size={20} />
            <span>Kembali</span>
          </button>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Edit Loker</h1>
          <p className="text-slate-400">Ubah informasi loker</p>
        </div>

        <div className="dark-card">
          <div className="mb-6 p-4 bg-slate-700 rounded-lg">
            <h3 className="text-sm font-medium text-slate-200 mb-2">Informasi Loker</h3>
            <p className="text-sm text-slate-300">Kode: <span className="font-mono text-blue-400">{locker.code}</span></p>
            <p className="text-xs text-slate-400 mt-1">
              Kode loker tidak dapat diubah setelah dibuat
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-slate-200 mb-2">
                Label Loker *
              </label>
              <input
                type="text"
                id="label"
                name="label"
                value={formData.label}
                onChange={handleChange}
                required
                className="dark-input"
                placeholder="Masukkan label loker"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-200 mb-2">
                Deskripsi (Opsional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="dark-input resize-none"
                placeholder="Masukkan deskripsi loker (opsional)"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="dark-button"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="dark-button-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
