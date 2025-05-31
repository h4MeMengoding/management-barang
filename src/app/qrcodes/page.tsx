'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import QRCodeDisplay from '@/components/QRCodeDisplay';

interface QRCode {
  _id: string;
  code: string;
  qrCode: string;
  isUsed: boolean;
  lockerId?: string;
  createdAt: string;
}

export default function QRCodesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [batchSize, setBatchSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'generate' | 'manage'>('generate');

  const generateQRCodes = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch('/api/qrcodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: batchSize }),
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodes(prev => [...prev, ...data.qrCodes]);
        alert(`${data.qrCodes.length} QR codes berhasil dibuat!`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
      alert('Terjadi kesalahan saat membuat QR codes');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingQRCodes = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch('/api/qrcodes');
      if (response.ok) {
        const data = await response.json();
        // API mengembalikan array langsung, bukan object dengan property qrCodes
        setQrCodes(Array.isArray(data) ? data : []);
      } else {
        alert('Gagal memuat QR codes');
      }
    } catch (error) {
      console.error('Error loading QR codes:', error);
      alert('Terjadi kesalahan saat memuat QR codes');
      setQrCodes([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const printQRCodes = () => {
    window.print();
  };

  return (
    <div className="min-h-screen dark-theme pt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-gray-300 hover:text-gray-100 mb-6 dark-button px-4 py-2 transition-all duration-200"
          >
            <ArrowLeft size={20} />
            <span>Kembali</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">
            Manajemen QR Code Loker
          </h1>
          <p className="text-gray-400">
            Generate QR codes dalam batch, cetak dan tempel ke loker fisik, lalu scan untuk menginisialisasi loker baru.
          </p>
        </div>

        <div className="dark-card p-8">
          {/* Navigation Tabs */}
          <div className="flex space-x-2 mb-8 p-1 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <button
              onClick={() => setView('generate')}
              className={`flex-1 px-6 py-3 font-medium transition-all duration-200 rounded-md ${
                view === 'generate'
                  ? 'bg-blue-600/80 text-white border border-blue-500/50 shadow-lg'
                  : 'text-gray-300 hover:text-gray-100 hover:bg-slate-700/50'
              }`}
            >
              Generate QR Codes
            </button>
            <button
              onClick={() => {
                setView('manage');
                loadExistingQRCodes();
              }}
              className={`flex-1 px-6 py-3 font-medium transition-all duration-200 rounded-md ${
                view === 'manage'
                  ? 'bg-blue-600/80 text-white border border-blue-500/50 shadow-lg'
                  : 'text-gray-300 hover:text-gray-100 hover:bg-slate-700/50'
              }`}
            >
              Kelola QR Codes
            </button>
          </div>

          {view === 'generate' && (
            <div className="space-y-8">
              <div className="dark-card border border-blue-500/20 p-6">
                <h2 className="text-lg font-semibold text-blue-400 mb-4">
                  Workflow QR Code Baru:
                </h2>
                <ol className="list-decimal list-inside text-gray-300 space-y-2">
                  <li>Generate QR codes dalam batch</li>
                  <li>Print QR codes dan tempel ke loker fisik</li>
                  <li>Scan QR code untuk inisiasi loker (nama, deskripsi)</li>
                  <li>Kelola items setelah loker terinisiasi</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <label htmlFor="batchSize" className="block text-sm font-medium text-gray-300 mb-3">
                    Jumlah QR Code:
                  </label>
                  <input
                    type="number"
                    id="batchSize"
                    min="1"
                    max="50"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value))}
                    className="w-full dark-input text-gray-200"
                  />
                </div>
                <button
                  onClick={generateQRCodes}
                  disabled={loading || !session}
                  className="px-6 py-3 dark-button-primary text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : 'Generate QR Codes'}
                </button>
              </div>

              {qrCodes.length > 0 && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                    <h3 className="text-lg font-semibold text-gray-100">
                      QR Codes yang Dibuat ({qrCodes.length})
                    </h3>
                    <button
                      onClick={printQRCodes}
                      className="px-6 py-3 dark-button text-green-400 hover:text-green-300 font-medium transition-all duration-200"
                    >
                      Print QR Codes
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3">
                    {qrCodes.map((qr) => (
                      <QRCodeDisplay
                        key={qr._id}
                        qrCode={qr}
                        showDetails={false}
                        printMode={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'manage' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <h3 className="text-lg font-semibold text-gray-100">
                  Semua QR Codes
                </h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="px-3 py-1 bg-gray-800/50 text-gray-300 rounded-lg border border-gray-600/30">
                    Total: {qrCodes?.length || 0}
                  </span>
                  <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-lg border border-green-500/30">
                    Digunakan: {qrCodes?.filter(qr => qr.isUsed).length || 0}
                  </span>
                  <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-lg border border-blue-500/30">
                    Belum Digunakan: {qrCodes?.filter(qr => !qr.isUsed).length || 0}
                  </span>
                </div>
              </div>

              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-400">Memuat QR codes...</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {qrCodes.map((qr) => (
                  <QRCodeDisplay
                    key={qr._id}
                    qrCode={qr}
                    showDetails={true}
                    printMode={false}
                  />
                ))}
              </div>

              {qrCodes.length === 0 && !loading && (
                <div className="text-center py-16">
                  <div className="dark-icon inline-flex mb-6 p-6">
                    <svg className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-xl font-medium text-gray-200">Belum ada QR codes</h3>
                  <p className="mt-2 text-sm text-gray-400">Mulai dengan generate QR codes pertama Anda.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
