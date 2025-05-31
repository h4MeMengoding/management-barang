'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Camera, Upload, Package } from 'lucide-react';
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
  const [manualCode, setManualCode] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkCameraPermissions = async () => {
    try {
      // Check if camera permissions API is supported
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return permission.state;
      }
      return 'unknown';
    } catch (error) {
      console.log('Permission API not supported', error);
      return 'unknown';
    }
  };

  const checkSecureContext = () => {
    // Check if we're in a secure context (HTTPS or localhost)
    return window.isSecureContext || 
           window.location.protocol === 'https:' || 
           window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.endsWith('.local');
  };

  const startCamera = async () => {
    try {
      setError('');
      setScanning(true);
      
      // Check secure context first
      if (!checkSecureContext()) {
        throw new Error('Akses kamera memerlukan HTTPS atau localhost. Saat ini menggunakan HTTP yang tidak aman.');
      }
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera. Pastikan menggunakan browser modern dan HTTPS.');
      }

      // Check camera permissions first
      const permissionState = await checkCameraPermissions();
      console.log('Camera permission state:', permissionState);

      if (permissionState === 'denied') {
        throw new Error('Akses kamera ditolak. Silakan enable permission kamera di browser settings dan refresh halaman.');
      }

      // Try to get camera access with fallback strategy
      let stream: MediaStream;
      
      try {
        // First try with environment camera (back camera on mobile)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
        });
      } catch (envError) {
        console.log('Environment camera failed, trying default camera:', envError);
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          scanFromCamera();
        };
      }
    } catch (error: any) {
      setScanning(false);
      console.error('Camera error:', error);
      
      if (error.name === 'NotAllowedError') {
        setError('Akses kamera ditolak. Silakan:\n1. Klik ikon kamera di address bar browser\n2. Pilih "Allow" untuk mengizinkan akses kamera\n3. Refresh halaman dan coba lagi');
      } else if (error.name === 'NotFoundError') {
        setError('Kamera tidak ditemukan. Pastikan perangkat memiliki kamera yang terhubung.');
      } else if (error.name === 'NotReadableError') {
        setError('Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain yang menggunakan kamera dan coba lagi.');
      } else if (error.name === 'OverconstrainedError') {
        setError('Pengaturan kamera tidak didukung oleh perangkat.');
      } else if (error.name === 'SecurityError') {
        setError('Akses kamera diblokir karena alasan keamanan. Pastikan halaman diakses melalui HTTPS atau localhost.');
      } else {
        setError(error.message || 'Tidak dapat mengakses kamera. Pastikan memberikan izin akses kamera dan coba lagi.');
      }
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
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // Try to detect QR code with improved settings
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth", // Try both normal and inverted image for better detection
          });
        
          if (code) {
            console.log("QR Code detected!", code.data);
            // Draw a green box around the QR code to give visual feedback
            if (context && code.location) {
              context.strokeStyle = '#00FF00';
              context.lineWidth = 5;
              context.beginPath();
              context.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
              context.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
              context.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
              context.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
              context.lineTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
              context.stroke();
            }
          
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
      // Show loading message
      setError('Memproses gambar, mohon tunggu...');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            const context = canvas.getContext('2d');
            if (context) {
              // Set canvas size to match image
              canvas.width = img.width;
              canvas.height = img.height;
              context.drawImage(img, 0, 0);
              
              try {
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                
                // Try with enhanced options to improve detection success rate
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "attemptBoth" // Try both normal and inverted image
                });
                
                if (code) {
                  setError(''); // Clear error message
                  handleQRCodeDetected(code.data);
                } else {
                  setError('QR Code tidak ditemukan dalam gambar. Pastikan gambar jelas dan QR code terlihat.');
                }
              } catch (err) {
                console.error("Error processing image:", err);
                setError('Terjadi kesalahan saat memproses gambar. Coba gambar lain dengan kualitas lebih baik.');
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
    try {
      console.log("QR code detected - data:", qrData);
      
      setError('');
      
      // Show processing message without stopping camera immediately
      // This gives visual feedback that the QR was detected
      setError('QR Code terdeteksi. Memproses...');
      
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData }),
      });

      // Now that we have a response, stop the camera
      stopCamera();
      
      // Show processing indicator
      setScanResult(null);
      setScanning(false);
      
      const result = await response.json();
      console.log("Scan API response:", result);
      
      if (response.ok) {
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
        console.error("QR code scanning error response:", result);
        
        // Provide detailed error feedback
        if (result.error) {
          setError(`${result.error}`);
        } else if (qrData.includes('qrcode:') || qrData.includes('locker:')) {
          setError(`QR Code tidak valid (Format: ${qrData.split(':')[0]})`);
        } else if (qrData.length > 20) {
          setError(`QR Code tidak valid. Format tidak sesuai: "${qrData.substring(0, 20)}..."`);
        } else {
          setError(`QR Code tidak valid. Format tidak sesuai: "${qrData}"`);
        }
        
        // Add a retry button through re-enabling the scanning
        setTimeout(() => {
          setError(prevError => prevError + "\n\nSilakan coba scan lagi atau gunakan QR code yang berbeda.");
        }, 2000);
      }
    } catch (err) {
      stopCamera();
      console.error("Error in QR code processing:", err);
      setError('Terjadi kesalahan saat memproses QR Code. Silakan coba lagi.');
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center dark-theme">
        <div className="dark-card p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 text-center">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/');
    return null;
  }

  if (scanResult) {
    return (
      <div className="min-h-screen dark-theme pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => {
                setScanResult(null);
                setError('');
              }}
              className="flex items-center space-x-2 text-gray-300 hover:text-gray-100 mb-6 dark-button px-4 py-2 transition-all duration-200"
            >
              <ArrowLeft size={20} />
              <span>Scan Lagi</span>
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">Hasil Scan QR Code</h1>
            <p className="text-gray-400">Informasi loker dan daftar barang</p>
          </div>

          <div className="dark-card p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{scanResult.locker.label}</h2>
                <p className="text-gray-400">Kode: {scanResult.locker.code}</p>
                {scanResult.locker.description && (
                  <p className="text-gray-400 mt-2">{scanResult.locker.description}</p>
                )}
              </div>
              <img 
                src={scanResult.locker.qrCode} 
                alt="QR Code"
                className="w-16 h-16 rounded-lg border border-gray-600"
              />
            </div>
          </div>

          <div className="dark-card p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Package className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                Daftar Barang ({scanResult.items.length})
              </h3>
            </div>
            
            {scanResult.items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Belum ada barang di loker ini</p>
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
                  <div key={item._id} className="border border-gray-600 rounded-lg p-4 bg-gray-700/30">
                    <h4 className="font-medium text-white">{item.name}</h4>
                    <p className="text-sm text-gray-400">Kategori: {item.category}</p>
                    <p className="text-sm text-gray-400">Jumlah: {item.quantity}</p>
                    {item.description && (
                      <p className="text-sm text-gray-400 mt-2">{item.description}</p>
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">Scan QR Code</h1>
          <p className="text-gray-400">Scan QR code loker untuk melihat daftar barang</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-200 whitespace-pre-line">{error}</p>
            {error.includes('ditolak') && (
              <div className="mt-4">
                <p className="text-red-200 text-sm mb-3">Langkah-langkah untuk mengizinkan akses kamera:</p>
                <ol className="text-red-200 text-sm space-y-1 list-decimal list-inside">
                  <li>Klik ikon kunci/kamera di address bar browser</li>
                  <li>Pilih "Allow" atau "Izinkan" untuk kamera</li>
                  <li>Refresh halaman dan coba lagi</li>
                </ol>
                <button
                  onClick={() => {
                    setError('');
                    window.location.reload();
                  }}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  Refresh Halaman
                </button>
              </div>
            )}
          </div>
        )}

        <div className="dark-card p-8">
          {!scanning ? (
            <div className="space-y-6">
              {/* Camera info */}
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
                <h3 className="text-blue-200 font-medium mb-2">📷 Persyaratan Kamera</h3>
                <ul className="text-blue-200 text-sm space-y-1 list-disc list-inside">
                  <li>Browser harus mengizinkan akses kamera</li>
                  <li className="font-bold">Halaman harus diakses melalui HTTPS atau localhost</li>
                  <li>Kamera tidak boleh digunakan aplikasi lain</li>
                </ul>

                {/* HTTPS warning for mobile */}
                {!checkSecureContext() && (
                  <div className="mt-3 p-2 bg-red-900/50 border border-red-700 rounded-md text-red-200 text-xs">
                    <p className="font-bold">⚠️ PENTING: Halaman ini tidak menggunakan HTTPS!</p>
                    <p>Untuk mengakses kamera di perangkat mobile, gunakan HTTPS.</p>
                    <p className="mt-1">Lihat <a href="/CAMERA_HTTPS_SOLUTIONS.md" className="underline" target="_blank">panduan HTTPS setup</a>.</p>
                  </div>
                )}
              </div>
              
              <button
                onClick={startCamera}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 dark-button-primary text-white font-medium transition-all duration-200"
              >
                <Camera size={20} />
                <span>Mulai Scan dengan Kamera</span>
              </button>
              
              <div className="text-center text-gray-400 font-medium">atau</div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 dark-button text-gray-300 hover:text-gray-100 font-medium transition-all duration-200"
              >
                <Upload size={20} />
                <span>Upload Gambar QR Code</span>
              </button>
              
              <div className="text-center text-gray-400 font-medium">atau</div>
              
              <div className="space-y-3 bg-slate-800/40 border border-slate-700/30 rounded-lg p-4">
                <label htmlFor="manualCode" className="block font-medium text-gray-100 flex items-center gap-2">
                  <span className="text-blue-400 text-lg">📝</span> Input Kode QR Secara Manual
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Jika kamera tidak bisa digunakan atau scan gagal, masukkan kode 4 digit di sini
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="manualCode"
                    value={manualCode}
                    onChange={(e) => {
                      // Only allow digits and limit to 4 digits for manual code
                      const onlyDigits = e.target.value.replace(/[^0-9]/g, '');
                      setManualCode(onlyDigits.slice(0, 4));
                    }}
                    placeholder="Masukkan kode 4 digit"
                    className="dark-input flex-1 text-gray-200 text-center tracking-wider text-lg"
                    maxLength={4}
                    autoComplete="off"
                    pattern="[0-9]*" 
                    inputMode="numeric"
                    onKeyPress={(e) => {
                      // Submit on Enter key
                      if (e.key === 'Enter' && manualCode.length === 4) {
                        handleQRCodeDetected(manualCode);
                      }
                    }}
                  />
                  <button
                    onClick={() => manualCode && handleQRCodeDetected(manualCode)}
                    disabled={manualCode.length !== 4}
                    className="px-4 py-2 dark-button-primary text-white font-medium 
                      transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Masukkan kode 4 digit yang tertera pada QR code (tanpa awalan)
                </p>
              </div>
              
              {/* Debug info */}
              <div className="text-xs text-gray-500 text-center">
                <p>Debug: {checkSecureContext() ? '✅ Secure Context' : '❌ Insecure Context'}</p>
                <p>Protocol: {window.location.protocol} | Host: {window.location.hostname}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-[60vh] max-h-[500px] bg-gray-900 rounded-lg border border-slate-600 object-cover"
                />
                {/* Scanning animation overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 sm:w-72 sm:h-72 border-2 border-blue-500 rounded-lg relative qr-scan-guide">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 opacity-70 animate-scan"></div>
                    {/* Corner markers for better visual guidance */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br"></div>
                  </div>
                  <p className="mt-4 text-blue-300 text-sm font-medium bg-slate-900/80 px-4 py-2 rounded-full">
                    Scanning... Arahkan ke QR Code
                  </p>
                </div>
              </div>
              <button
                onClick={stopCamera}
                className="w-full px-6 py-3 dark-button text-red-400 hover:text-red-300 font-medium transition-all duration-200"
              >
                Stop Scanning
              </button>
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4 mt-4">
                <h4 className="text-blue-400 font-medium mb-2">Tips untuk Scan QR Code:</h4>
                <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                  <li>Pastikan QR code berada dalam kotak panduan</li>
                  <li>Jaga kamera tetap stabil dan fokus</li>
                  <li>Pastikan QR code mendapat pencahayaan yang cukup</li>
                  <li>Jika gagal, coba masukkan kode 4 digit secara manual</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
