'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, QrCode, Printer, Eye, Trash2 } from 'lucide-react';
import QRCodeDisplay from '@/components/QRCodeDisplay';

interface QRCode {
  _id: string;
  code: string;
  qrCode: string;
  isUsed: boolean;
  lockerId?: string | { _id: string; label: string };
  createdAt: string;
}

export default function QRCodesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [batchSize, setBatchSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'generate' | 'manage'>('generate');

  const loadExistingQRCodes = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch('/api/qrcodes');
      if (response.ok) {
        const data = await response.json();
        setQrCodes(Array.isArray(data) ? data : []);
      } else {
        alert('Gagal memuat QR codes');
      }
    } catch (error) {
      console.error('Error loading QR codes:', error);
      alert('Terjadi kesalahan saat memuat QR codes');
      setQrCodes([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (view === 'manage') {
      loadExistingQRCodes();
    }
  }, [view, loadExistingQRCodes]);

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

  const printQRCodes = () => {
    window.print();
  };

  const deleteQRCode = async (qrCodeId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus QR code ini?')) return;

    try {
      const response = await fetch(`/api/qrcodes/${qrCodeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setQrCodes(prev => prev.filter(qr => qr._id !== qrCodeId));
        alert('QR code berhasil dihapus');
      } else {
        alert('Gagal menghapus QR code');
      }
    } catch (error) {
      console.error('Error deleting QR code:', error);
      alert('Terjadi kesalahan saat menghapus QR code');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center dark-theme">
        <div className="dark-card p-8">
          <p className="text-gray-400 text-center">Silakan login terlebih dahulu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-theme pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                view === 'generate'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-slate-700/30'
              }`}
            >
              <QrCode className="inline-block w-4 h-4 mr-2" />
              Generate QR Codes
            </button>
            <button
              onClick={() => setView('manage')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                view === 'manage'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-slate-700/30'
              }`}
            >
              <Eye className="inline-block w-4 h-4 mr-2" />
              Kelola QR Codes
            </button>
          </div>

          {view === 'generate' && (
            <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-6">
                <h3 className="text-blue-300 font-medium mb-3">📋 Cara Penggunaan</h3>
                <ol className="text-blue-200 text-sm space-y-2 list-decimal list-inside">
                  <li>Generate QR codes dalam batch (misalnya 10-50 QR codes sekaligus)</li>
                  <li>Print dan tempel QR codes ke loker fisik</li>
                  <li>Gunakan fitur &quot;Scan QR Code&quot; untuk menginisialisasi loker baru</li>
                  <li>Setelah scan, Anda akan diminta untuk mengisi nama dan deskripsi loker</li>
                </ol>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="batchSize" className="block text-sm font-medium text-gray-200 mb-2">
                    Jumlah QR Code yang akan dibuat
                  </label>
                  <select
                    id="batchSize"
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="dark-input w-full text-gray-200"
                  >
                    <option value={5}>5 QR Codes</option>
                    <option value={10}>10 QR Codes</option>
                    <option value={20}>20 QR Codes</option>
                    <option value={50}>50 QR Codes</option>
                    <option value={100}>100 QR Codes</option>
                  </select>
                </div>
                
                <button
                  onClick={generateQRCodes}
                  disabled={loading}
                  className="w-full dark-button-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <QrCode size={20} />
                      <span>Generate {batchSize} QR Codes</span>
                    </>
                  )}
                </button>
              </div>

              {qrCodes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-200">
                      QR Codes Generated ({qrCodes.length})
                    </h3>
                    <button
                      onClick={printQRCodes}
                      className="flex items-center space-x-2 px-4 py-2 dark-button text-gray-300 hover:text-gray-100"
                    >
                      <Printer size={16} />
                      <span>Print All</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-4">
                    {qrCodes.map((qr) => (
                      <QRCodeDisplay
                        key={qr._id}
                        qrCode={qr}
                        showDetails={false}
                        printMode={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'manage' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-200">
                  Semua QR Codes ({qrCodes.length})
                </h3>
                <button
                  onClick={loadExistingQRCodes}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 dark-button text-gray-300 hover:text-gray-100 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Eye size={16} />
                  )}
                  <span>Refresh</span>
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-400">Memuat QR codes...</p>
                </div>
              ) : qrCodes.length === 0 ? (
                <div className="text-center py-12">
                  <QrCode className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-200 mb-2">Belum ada QR codes</h3>
                  <p className="text-gray-400 mb-6">Generate QR codes terlebih dahulu untuk memulai.</p>
                  <button
                    onClick={() => setView('generate')}
                    className="inline-flex items-center space-x-2 px-6 py-3 dark-button-primary text-white"
                  >
                    <QrCode size={18} />
                    <span>Generate QR Codes</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {qrCodes.map((qr) => (
                    <div key={qr._id} className="relative">
                      <QRCodeDisplay
                        qrCode={qr}
                        showDetails={true}
                        printMode={false}
                      />
                      {!qr.isUsed && (
                        <button
                          onClick={() => deleteQRCode(qr._id)}
                          className="absolute top-2 right-2 p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                          title="Hapus QR Code"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
