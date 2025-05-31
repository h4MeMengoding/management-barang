'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Camera, Upload } from 'lucide-react';
import jsQR from 'jsqr';

interface ScanResult {
  locker: {
    _id: string;
    code: string;
    label: string;
    description?: string;
    qrCode: string;
  };
  items: Array<{
    _id: string;
    name: string;
    description?: string;
    category: string;
    quantity: number;
  }>;
}

export default function QRScanner() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
        setError('');
        scanFromCamera();
      }
    } catch {
      setError('Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const scanFromCamera = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          handleQRCodeDetected(code.data);
          return;
        }
      }
    }
    
    if (scanning) {
      requestAnimationFrame(scanFromCamera);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            const context = canvas.getContext('2d');
            if (context) {
              canvas.width = img.width;
              canvas.height = img.height;
              context.drawImage(img, 0, 0);
              
              const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              
              if (code) {
                handleQRCodeDetected(code.data);
              } else {
                setError('QR Code tidak ditemukan dalam gambar');
              }
            }
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQRCodeDetected = async (qrData: string) => {
    stopCamera();
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.type === 'initialize_locker') {
          // Redirect to initialization page for unused QR code
          const params = new URLSearchParams({
            qrCodeId: result.qrCode._id,
            code: result.qrCode.code,
            qrCodeImage: result.qrCode.qrCodeImage,
          });
          router.push(`/lockers/initialize?${params.toString()}`);
        } else if (result.type === 'existing_locker') {
          // Show existing locker details
          setScanResult(result);
          setError('');
        }
      } else {
        const error = await response.json();
        setError(error.error || 'QR Code tidak valid');
      }
    } catch {
      setError('Gagal memproses QR Code');
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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

  if (scanResult) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => {
                setScanResult(null);
                setError('');
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} />
              <span>Scan Lagi</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Hasil Scan QR Code</h1>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{scanResult.locker.label}</h2>
                <p className="text-gray-600">Kode: {scanResult.locker.code}</p>
                {scanResult.locker.description && (
                  <p className="text-gray-600 mt-2">{scanResult.locker.description}</p>
                )}
              </div>
              <img 
                src={scanResult.locker.qrCode} 
                alt="QR Code"
                className="w-16 h-16"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Daftar Barang ({scanResult.items.length})
            </h3>
            
            {scanResult.items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Belum ada barang di loker ini</p>
                <a
                  href="/items/new"
                  className="inline-flex items-center space-x-2 mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span>Tambah Barang</span>
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scanResult.items.map((item) => (
                  <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">Kategori: {item.category}</p>
                    <p className="text-sm text-gray-600">Jumlah: {item.quantity}</p>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Scan QR Code</h1>
          <p className="mt-2 text-gray-600">Scan QR code loker untuk melihat daftar barang</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          {!scanning ? (
            <div className="space-y-4">
              <button
                onClick={startCamera}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Camera size={20} />
                <span>Mulai Scan dengan Kamera</span>
              </button>
              
              <div className="text-center text-gray-500">atau</div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Upload size={20} />
                <span>Upload Gambar QR Code</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-black rounded-lg"
              />
              <button
                onClick={stopCamera}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Stop Scanning
              </button>
              <p className="text-center text-gray-600 text-sm">
                Arahkan kamera ke QR code loker
              </p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
