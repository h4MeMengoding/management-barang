'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
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
        setQrCodes(data.qrCodes);
      } else {
        alert('Gagal memuat QR codes');
      }
    } catch (error) {
      console.error('Error loading QR codes:', error);
      alert('Terjadi kesalahan saat memuat QR codes');
    } finally {
      setLoading(false);
    }
  };

  const printQRCodes = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manajemen QR Code Loker
          </h1>
          <p className="text-gray-600 mb-6">
            Generate QR codes dalam batch, cetak dan tempel ke loker fisik, lalu scan untuk menginisialisasi loker baru.
          </p>

          {/* Navigation Tabs */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setView('generate')}
              className={`px-4 py-2 rounded-md font-medium ${
                view === 'generate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Generate QR Codes
            </button>
            <button
              onClick={() => {
                setView('manage');
                loadExistingQRCodes();
              }}
              className={`px-4 py-2 rounded-md font-medium ${
                view === 'manage'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Kelola QR Codes
            </button>
          </div>

          {view === 'generate' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                  Workflow QR Code Baru:
                </h2>
                <ol className="list-decimal list-inside text-blue-800 space-y-1">
                  <li>Generate QR codes dalam batch</li>
                  <li>Print QR codes dan tempel ke loker fisik</li>
                  <li>Scan QR code untuk inisiasi loker (nama, deskripsi)</li>
                  <li>Kelola items setelah loker terinisiasi</li>
                </ol>
              </div>

              <div className="flex items-center space-x-4">
                <div>
                  <label htmlFor="batchSize" className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah QR Code:
                  </label>
                  <input
                    type="number"
                    id="batchSize"
                    min="1"
                    max="50"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-2 w-24"
                  />
                </div>
                <button
                  onClick={generateQRCodes}
                  disabled={loading || !session}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate QR Codes'}
                </button>
              </div>

              {qrCodes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      QR Codes yang Dibuat ({qrCodes.length})
                    </h3>
                    <button
                      onClick={printQRCodes}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Print QR Codes
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3">
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
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Semua QR Codes
                </h3>
                <div className="text-sm text-gray-600">
                  Total: {qrCodes.length} | 
                  Digunakan: {qrCodes.filter(qr => qr.isUsed).length} |
                  Belum Digunakan: {qrCodes.filter(qr => !qr.isUsed).length}
                </div>
              </div>

              {loading && (
                <div className="text-center py-8">
                  <div className="text-gray-600">Memuat QR codes...</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="text-center py-8 text-gray-500">
                  Belum ada QR codes yang dibuat
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
