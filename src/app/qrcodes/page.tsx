'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, QrCode, Download, Eye, Trash2, RefreshCw } from 'lucide-react';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { showSuccess, showError, showCustomConfirm } from '@/lib/alerts';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadExistingQRCodes = useCallback(async (forceReload = false) => {
    if (!session) return;
    
    // If not forcing reload and data already loaded, skip
    if (!forceReload && dataLoaded) return;

    setLoading(true);
    try {
      const response = await fetch('/api/qrcodes');
      if (response.ok) {
        const data = await response.json();
        setQrCodes(Array.isArray(data) ? data : []);
        setDataLoaded(true);
      } else {
        showError('Gagal memuat QR codes');
      }
    } catch (error) {
      console.error('Error loading QR codes:', error);
      showError('Terjadi kesalahan saat memuat QR codes');
      setQrCodes([]);
    } finally {
      setLoading(false);
    }
  }, [session, dataLoaded]);

  useEffect(() => {
    if (view === 'manage' && !dataLoaded) {
      loadExistingQRCodes();
    }
  }, [view, dataLoaded, loadExistingQRCodes]);

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
        showSuccess(`${data.qrCodes.length} QR codes berhasil dibuat! Lihat di menu "Kelola QR Codes" untuk melihat hasilnya.`);
        // Invalidate cache so data will reload when user switches to manage tab
        setDataLoaded(false);
      } else {
        const error = await response.json();
        showError(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
      showError('Terjadi kesalahan saat membuat QR codes');
    } finally {
      setLoading(false);
    }
  };

  const downloadAllQRCodes = async () => {
    if (qrCodes.length === 0) return;

    try {
      setLoading(true);
      const zip = new JSZip();

      // Convert each QR code image to blob and add to zip
      for (const qr of qrCodes) {
        try {
          // Generate clean QR code for download
          const response = await fetch('/api/qrcodes/download', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: qr.code }),
          });
          
          if (response.ok) {
            const blob = await response.blob();
            zip.file(`QR-${qr.code}.png`, blob);
          } else {
            // Fallback to original QR code
            const fallbackResponse = await fetch(qr.qrCode);
            const blob = await fallbackResponse.blob();
            zip.file(`QR-${qr.code}.png`, blob);
          }
        } catch (error) {
          console.error(`Error processing QR code ${qr.code}:`, error);
          // Try fallback
          try {
            const response = await fetch(qr.qrCode);
            const blob = await response.blob();
            zip.file(`QR-${qr.code}.png`, blob);
          } catch (fallbackError) {
            console.error(`Fallback failed for QR code ${qr.code}:`, fallbackError);
          }
        }
      }

      // Generate and download the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `QR-Codes-${new Date().toISOString().split('T')[0]}.zip`);
      
      showSuccess(`${qrCodes.length} QR codes berhasil didownload dalam file ZIP!`);
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      showError('Terjadi kesalahan saat membuat file ZIP');
    } finally {
      setLoading(false);
    }
  };

  const regenerateAllQRCodes = async () => {
    if (!session) return;
    
    showCustomConfirm(
      'Regenerasi QR Codes',
      'Apakah Anda yakin ingin meregenerasi semua QR codes? Ini akan memperbarui semua QR codes menjadi format yang lebih sederhana.',
      'Regenerasi',
      async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/qrcodes/regenerate', {
            method: 'PUT',
          });

          if (response.ok) {
            const data = await response.json();
            showSuccess(`${data.qrCodes.length} QR codes berhasil diregenerasi!`);
            // Reload the QR codes to show updated versions
            await loadExistingQRCodes(true);
          } else {
            const error = await response.json();
            showError(`Error: ${error.message}`);
          }
        } catch (error) {
          console.error('Error regenerating QR codes:', error);
          showError('Terjadi kesalahan saat meregenerasi QR codes');
        } finally {
          setLoading(false);
        }
      },
      'primary'
    );
  };

  const deleteQRCode = async (qrCodeId: string) => {
    showCustomConfirm(
      'Hapus QR Code',
      'Apakah Anda yakin ingin menghapus QR code ini?',
      'Hapus',
      async () => {
        try {
          const response = await fetch(`/api/qrcodes/${qrCodeId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setQrCodes(prev => prev.filter(qr => qr._id !== qrCodeId));
            showSuccess('QR code berhasil dihapus');
          } else {
            showError('Gagal menghapus QR code');
          }
        } catch (error) {
          console.error('Error deleting QR code:', error);
          showError('Terjadi kesalahan saat menghapus QR code');
        }
      }
    );
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
            className="flex items-center space-x-2 text-gray-300 hover:text-gray-100 mb-6 dark-button px-4 py-2 transition-all duration-200 transform active:scale-95"
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
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 transform active:scale-95 ${
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
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 transform active:scale-95 ${
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
                  <li>Setelah generate, lihat hasilnya di menu &quot;Kelola QR Codes&quot;</li>
                  <li>Download QR codes dalam format ZIP untuk dicetak</li>
                  <li>Print dan tempel QR codes ke loker fisik</li>
                  <li>Gunakan fitur &quot;Scan QR Code&quot; untuk menginisialisasi loker baru</li>
                  <li>Setelah scan, Anda akan diminta untuk mengisi nama dan deskripsi loker</li>
                  <li>QR codes yang dibuat sudah dalam format yang bersih tanpa elemen tambahan</li>
                </ol>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="batchSize" className="block text-sm font-medium text-gray-300 mb-3">
                    Jumlah QR Code yang akan dibuat
                  </label>
                  <select
                    id="batchSize"
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="w-full dark-input text-gray-200"
                  >
                    <option value={2}>2 QR Codes</option>
                    <option value={5}>5 QR Codes</option>
                    <option value={10}>10 QR Codes</option>
                  </select>
                </div>
                
                <button
                  onClick={generateQRCodes}
                  disabled={loading}
                  className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
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
                
                <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-6">
                  <h3 className="text-green-300 font-medium mb-3">INFORMASI</h3>
                  <p className="text-green-200 text-sm mb-3">
                    Setelah berhasil generate QR codes, silakan buka menu &quot;Kelola QR Codes&quot; untuk melihat, mendownload, dan mengelola QR codes yang telah dibuat.
                  </p>
                  <button
                    onClick={() => setView('manage')}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 transform active:scale-95"
                  >
                    <Eye size={16} />
                    <span>Lihat QR Codes</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'manage' && (
            <div className="space-y-6">
              <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-6">
                <h3 className="text-green-300 font-medium mb-3">✨ QR Codes Sederhana</h3>
                <p className="text-green-200 text-sm mb-3">
                  QR codes yang dibuat sudah dalam format yang bersih dan sederhana tanpa elemen tambahan. 
                  Gunakan tombol &quot;Update QR Codes&quot; jika ingin memperbarui QR codes lama.
                </p>
                <div className="text-green-200 text-xs">
                  💡 QR codes akan berisi hanya barcode saja tanpa logo atau angka tambahan
                </div>
              </div>
              
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-lg font-medium text-gray-200">
                  Semua QR Codes ({qrCodes.length})
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={downloadAllQRCodes}
                    disabled={loading || qrCodes.length === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                    title="Download semua QR codes dalam file ZIP"
                  >
                    <Download size={16} />
                    <span>Download QR</span>
                  </button>
                  <button
                    onClick={regenerateAllQRCodes}
                    disabled={loading || qrCodes.length === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                    title="Regenerasi semua QR codes menjadi format sederhana"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    <span>Update QR Codes</span>
                  </button>
                  <button
                    onClick={() => loadExistingQRCodes(true)}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 dark-button text-gray-300 hover:text-gray-100 font-medium transition-all duration-200 disabled:opacity-50 transform active:scale-95"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Eye size={16} />
                    )}
                    <span>Refresh</span>
                  </button>
                </div>
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
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 transform active:scale-95"
                  >
                    <QrCode size={18} />
                    <span>Generate QR Codes</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-4 print:gap-2">
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
                          className="absolute top-2 right-2 p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-all duration-200 print:hidden transform active:scale-95"
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
