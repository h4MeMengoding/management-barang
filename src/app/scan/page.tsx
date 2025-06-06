'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Camera, Upload, Package, FileImage } from 'lucide-react';
import Image from 'next/image';
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
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>(''); // Add debug info state
  const [successFeedback, setSuccessFeedback] = useState<boolean>(false); // Add success feedback
  const [scanAttempts, setScanAttempts] = useState<number>(0); // Track scan attempts
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false); // Track video ready state
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false); // Track video loading state
  const [initStartTime, setInitStartTime] = useState<number>(0); // Track initialization timing
  const [scanStats, setScanStats] = useState({ successful: 0, failed: 0, totalTime: 0 }); // Track scanning statistics
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const scanIntervalRef = useRef<number | null>(null); // Add interval ref for better control
  const lastDetectionRef = useRef<string>(''); // Track last detection to avoid duplicates
  const videoReadyTimeoutRef = useRef<number | null>(null); // Track video ready timeout
  const streamRef = useRef<MediaStream | null>(null); // Track the stream separately
  const scanningStateRef = useRef<boolean>(false); // Track scanning state reliably
  const videoInitializedRef = useRef<boolean>(false); // Track if video was properly initialized
  const frameStabilityRef = useRef<number>(0); // Track consecutive stable frames
  const lastFrameDataRef = useRef<string>(''); // Track last frame data for stability check

  // Enhanced video frame validation function
  const validateVideoFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement): boolean => {
    try {
      // Basic video state validation
      if (!video.videoWidth || !video.videoHeight) return false;
      if (video.readyState < video.HAVE_CURRENT_DATA) return false;
      if (video.paused || video.ended) return false;
      
      const context = canvas.getContext('2d');
      if (!context) return false;
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data to validate frame content
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Check if we have actual image data (not all black/empty)
      let nonBlackPixels = 0;
      let totalLuminance = 0;
      const sampleRate = 100; // Sample every 100th pixel for performance
      
      for (let i = 0; i < data.length; i += 4 * sampleRate) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate luminance
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += luminance;
        
        // Count non-black pixels
        if (r > 10 || g > 10 || b > 10) {
          nonBlackPixels++;
        }
      }
      
      const sampledPixels = Math.floor(data.length / (4 * sampleRate));
      const averageLuminance = totalLuminance / sampledPixels;
      const nonBlackRatio = nonBlackPixels / sampledPixels;
      
      // Frame is valid if:
      // 1. We have sufficient non-black pixels (> 20%)
      // 2. Average luminance is reasonable (not too dark or too bright)
      // 3. There's some variation in the image
      const hasContent = nonBlackRatio > 0.2;
      const hasReasonableLuminance = averageLuminance > 10 && averageLuminance < 240;
      const hasVariation = nonBlackPixels > 10;
      
      // Check frame stability by comparing with last frame
      const currentFrameHash = `${averageLuminance.toFixed(1)}-${nonBlackRatio.toFixed(3)}`;
      const isChanging = currentFrameHash !== lastFrameDataRef.current;
      
      if (isChanging) {
        frameStabilityRef.current = 0;
        lastFrameDataRef.current = currentFrameHash;
      } else {
        frameStabilityRef.current++;
      }
      
      // Consider frame frozen if it hasn't changed for too many checks
      const isNotFrozen = frameStabilityRef.current < 10;
      
      console.log('Frame validation:', {
        hasContent,
        hasReasonableLuminance,
        hasVariation,
        isNotFrozen,
        averageLuminance: averageLuminance.toFixed(1),
        nonBlackRatio: nonBlackRatio.toFixed(3),
        frameStability: frameStabilityRef.current
      });
      
      return hasContent && hasReasonableLuminance && hasVariation && isNotFrozen;
      
    } catch (error) {
      console.error('Error validating video frame:', error);
      return false;
    }
  };

  const checkCameraPermissions = async () => {
    try {
      // Check if camera permissions API is supported
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return permission.state;
      }
      return 'unknown';
    } catch {
      // Permission API not supported
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
      setIsVideoReady(false);
      setIsVideoLoading(true); // Set loading state
      setScanAttempts(0);
      lastDetectionRef.current = '';
      scanningStateRef.current = true;
      videoInitializedRef.current = false;
      setInitStartTime(Date.now()); // Start time for initialization
      
      // Clear any existing timeouts and intervals
      if (videoReadyTimeoutRef.current) {
        clearTimeout(videoReadyTimeoutRef.current);
        videoReadyTimeoutRef.current = null;
      }
      
      if (scanIntervalRef.current) {
        clearTimeout(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
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

      if (permissionState === 'denied') {
        throw new Error('Akses kamera ditolak. Silakan enable permission kamera di browser settings dan refresh halaman.');
      }

      // Try to get camera access with fallback strategy and enhanced settings
      let stream: MediaStream;
      
      try {
        // First try with environment camera (back camera on mobile) with optimized resolution for QR scanning
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            aspectRatio: { ideal: 16/9 },
            frameRate: { ideal: 30, min: 15 }
          },
        });
      } catch {
        try {
          // Fallback to user camera with optimized settings
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user',
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
              aspectRatio: { ideal: 16/9 },
              frameRate: { ideal: 30, min: 15 }
            },
          });
        } catch {
          // Final fallback - basic camera access with good resolution
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 }
            }
          });
        }
      }
      
      // Store stream reference
      streamRef.current = stream;
      
      if (videoRef.current && scanningStateRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        
        // Enhanced video initialization with proper event handling
        const initializeVideo = () => {
          return new Promise<void>((resolve, reject) => {
            let resolved = false;
            let timeoutId: number | null = null;
            let retryCount = 0;
            const maxRetries = 3;
            
            const validateVideoStream = () => {
              // More thorough validation to ensure video is truly ready
              if (!video.videoWidth || !video.videoHeight) return false;
              if (video.readyState < video.HAVE_CURRENT_DATA) return false;
              if (video.paused) return false;
              
              // Use the enhanced frame validation
              const canvas = canvasRef.current;
              if (!canvas) return false;
              
              return validateVideoFrame(video, canvas);
            };
            
            const handleVideoReady = async () => {
              if (resolved || !scanningStateRef.current) return;
              
              console.log('Video ready check:', {
                readyState: video.readyState,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                currentTime: video.currentTime,
                paused: video.paused
              });
              
              // Wait a bit more for the video to stabilize
              await new Promise(resolve => setTimeout(resolve, 300));
              
              if (!scanningStateRef.current) return;
              
              // Validate video stream is actually working
              if (validateVideoStream()) {
                resolved = true;
                videoInitializedRef.current = true;
                setIsVideoLoading(false);
                setIsVideoReady(true);
                
                // Track initialization performance
                const initTime = Date.now() - initStartTime;
                console.log(`Video fully initialized in ${initTime}ms, starting QR scanning...`);
                setScanStats(prev => ({ ...prev, totalTime: initTime }));
                
                // Multiple delayed attempts to start scanning for better reliability
                const startScanningWithRetry = (attempt = 0) => {
                  setTimeout(() => {
                    if (scanningStateRef.current && videoInitializedRef.current) {
                      if (validateVideoStream()) {
                        console.log(`Starting QR scanning attempt ${attempt + 1}...`);
                        startQRScanning();
                      } else if (attempt < 2) {
                        console.log(`Video validation failed on attempt ${attempt + 1}, retrying...`);
                        startScanningWithRetry(attempt + 1);
                      } else {
                        console.log('Video validation failed after multiple attempts');
                      }
                    }
                  }, 200 * (attempt + 1)); // Increasing delay
                };
                
                startScanningWithRetry();
                resolve();
              } else {
                console.log('Video validation failed, video not ready yet');
                if (retryCount < maxRetries) {
                  retryCount++;
                  console.log(`Retrying video initialization (${retryCount}/${maxRetries})...`);
                  setTimeout(handleVideoReady, 500);
                } else {
                  reject(new Error('Video gagal divalidasi setelah beberapa percobaan'));
                }
              }
            };
            
            const handlePlay = async () => {
              console.log('Video play event triggered');
              // Wait for video to actually start playing and provide frames
              await new Promise(resolve => setTimeout(resolve, 500));
              handleVideoReady();
            };
            
            const handleLoadedData = () => {
              console.log('Video loaded data event');
              setTimeout(handleVideoReady, 200);
            };
            
            const handleCanPlay = () => {
              console.log('Video can play event');
              if (!video.paused) {
                handleVideoReady();
              }
            };
            
            // Set up event listeners with better error handling
            const eventHandlers = {
              loadedmetadata: async () => {
                console.log('Video metadata loaded');
                try {
                  await video.play();
                  console.log('Video play() succeeded');
                  setTimeout(handleVideoReady, 300);
                } catch (error) {
                  console.error('Video play() failed:', error);
                  reject(error);
                }
              },
              playing: handlePlay,
              loadeddata: handleLoadedData,
              canplay: handleCanPlay
            };
            
            // Clean up function
            const cleanup = () => {
              if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
              }
              Object.entries(eventHandlers).forEach(([event, handler]) => {
                video.removeEventListener(event, handler);
              });
            };
            
            // Add event listeners
            Object.entries(eventHandlers).forEach(([event, handler]) => {
              video.addEventListener(event, handler, { once: true });
            });
            
            // Enhanced fallback timeout with validation
            timeoutId = window.setTimeout(async () => {
              if (!resolved && scanningStateRef.current) {
                console.log('Video initialization timeout, attempting force validation...');
                
                // Try to force video play if it's paused
                if (video.paused) {
                  try {
                    await video.play();
                    await new Promise(resolve => setTimeout(resolve, 500));
                  } catch (error) {
                    console.error('Failed to force play video:', error);
                  }
                }
                
                if (validateVideoStream()) {
                  resolved = true;
                  videoInitializedRef.current = true;
                  setIsVideoLoading(false);
                  setIsVideoReady(true);
                  console.log('Force validation succeeded, starting scanning...');
                  startQRScanning();
                  resolve();
                } else {
                  cleanup();
                  reject(new Error('Video tidak dapat diinisialisasi dalam waktu yang ditentukan'));
                }
              }
            }, 8000); // Extended timeout
            
            // Ensure cleanup on resolve/reject
            const originalResolve = resolve;
            const originalReject = reject;
            
            resolve = (...args) => {
              cleanup();
              originalResolve(...args);
            };
            
            reject = (...args) => {
              cleanup();
              originalReject(...args);
            };
            
            // Start the process
            console.log('Starting video load...');
            video.load();
          });
        };
        
        // Initialize video with error handling
        await initializeVideo();
        
      } else {
        throw new Error('Video element tidak tersedia atau scanning dihentikan');
      }
      
    } catch (error: unknown) {
      // Clean up on error
      scanningStateRef.current = false;
      setScanning(false);
      setIsVideoReady(false);
      setIsVideoLoading(false); // Clear loading state
      videoInitializedRef.current = false;
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      console.error('Camera error:', error);
      
      const errorMessage = error instanceof Error ? error : new Error('Unknown camera error');
      
      if (errorMessage.name === 'NotAllowedError') {
        setError('Akses kamera ditolak. Silakan:\n1. Klik ikon kamera di address bar browser\n2. Pilih "Allow" untuk mengizinkan akses kamera\n3. Refresh halaman dan coba lagi');
      } else if (errorMessage.name === 'NotFoundError') {
        setError('Kamera tidak ditemukan. Pastikan perangkat memiliki kamera yang terhubung.');
      } else if (errorMessage.name === 'NotReadableError') {
        setError('Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain yang menggunakan kamera dan coba lagi.');
      } else if (errorMessage.name === 'OverconstrainedError') {
        setError('Pengaturan kamera tidak didukung oleh perangkat.');
      } else if (errorMessage.name === 'SecurityError') {
        setError('Akses kamera diblokir karena alasan keamanan. Pastikan halaman diakses melalui HTTPS atau localhost.');
      } else {
        setError(errorMessage.message || 'Tidak dapat mengakses kamera. Pastikan memberikan izin akses kamera dan coba lagi.');
      }
    }
  };

  const stopCamera = () => {
    // Stop scanning state
    scanningStateRef.current = false;
    videoInitializedRef.current = false;
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // Stop stream ref as well
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear scanning interval and reset states
    if (scanIntervalRef.current) {
      clearTimeout(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    // Clear video ready timeout
    if (videoReadyTimeoutRef.current) {
      clearTimeout(videoReadyTimeoutRef.current);
      videoReadyTimeoutRef.current = null;
    }
    
    setScanning(false);
    setIsVideoReady(false);
    setDebugInfo('');
    setScanAttempts(0);
    setSuccessFeedback(false);
    lastDetectionRef.current = '';
  };

  const startQRScanning = () => {
    // Only start if we're still in scanning state and video is ready
    if (!scanningStateRef.current || !videoInitializedRef.current) {
      console.log('Scanning cancelled or video not ready');
      return;
    }
    
    console.log('QR scanning started');
    
    // Add a small delay before starting to ensure video is truly stable
    setTimeout(() => {
      if (scanningStateRef.current && videoInitializedRef.current) {
        scanFromCamera();
      }
    }, 300);
  };

  const scanFromCamera = () => {
    // Double check scanning state
    if (!scanningStateRef.current || !videoInitializedRef.current) {
      console.log('Scanning stopped or video not initialized');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Enhanced video readiness check
    if (video && canvas && 
        video.readyState >= video.HAVE_CURRENT_DATA && 
        video.videoWidth > 0 && video.videoHeight > 0 &&
        !video.paused && !video.ended) {
      
      const context = canvas.getContext('2d');
      if (context) {
        try {
          // Set canvas size to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Update debug info
          setScanAttempts(prev => prev + 1);
          setDebugInfo(`Video: ${video.videoWidth}x${video.videoHeight}, Ready: ${video.readyState}, Attempts: ${scanAttempts + 1}`);
          
          // Draw video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Verify we got actual image data
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // Quick check if we have actual video data (not a black frame)
          const hasVideoData = imageData.data.some((value, index) => 
            index % 4 !== 3 && value > 10 // Skip alpha channel, check if RGB values are meaningful
          );
          
          if (!hasVideoData) {
            setDebugInfo(`Video frame is empty or black, skipping scan attempt ${scanAttempts + 1}`);
            scheduleNextScan();
            return;
          }
          
          // Enhanced QR code detection with multiple attempts
          let code = null;
          
          // First attempt: Normal detection with high settings
          code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });
          
          // Second attempt: Try with lower resolution for better performance on smaller QR codes
          if (!code && canvas.width > 640) {
            const scaleFactor = 640 / canvas.width;
            const scaledWidth = Math.floor(canvas.width * scaleFactor);
            const scaledHeight = Math.floor(canvas.height * scaleFactor);
            
            // Create a temporary canvas for scaled down image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = scaledWidth;
            tempCanvas.height = scaledHeight;
            const tempContext = tempCanvas.getContext('2d');
            
            if (tempContext) {
              tempContext.drawImage(video, 0, 0, scaledWidth, scaledHeight);
              const scaledImageData = tempContext.getImageData(0, 0, scaledWidth, scaledHeight);
              
              code = jsQR(scaledImageData.data, scaledImageData.width, scaledImageData.height, {
                inversionAttempts: "attemptBoth",
              });
            }
          }
          
          // Third attempt: Try cropping center region for better focus
          if (!code) {
            const cropSize = Math.min(canvas.width, canvas.height) * 0.7;
            const cropX = (canvas.width - cropSize) / 2;
            const cropY = (canvas.height - cropSize) / 2;
            
            const croppedImageData = context.getImageData(cropX, cropY, cropSize, cropSize);
            
            code = jsQR(croppedImageData.data, croppedImageData.width, croppedImageData.height, {
              inversionAttempts: "attemptBoth",
            });
          }

          // Fourth attempt: Try with enhanced contrast for difficult lighting conditions
          if (!code) {
            const enhancedImageData = context.createImageData(imageData.width, imageData.height);
            const originalData = imageData.data;
            const enhancedData = enhancedImageData.data;
            
            // Apply adaptive contrast enhancement
            for (let i = 0; i < originalData.length; i += 4) {
              const gray = (originalData[i] + originalData[i + 1] + originalData[i + 2]) / 3;
              
              // Enhanced contrast with better threshold
              let enhanced;
              if (gray < 64) {
                enhanced = 0;   // Very dark pixels become black
              } else if (gray > 192) {
                enhanced = 255; // Very light pixels become white
              } else {
                // Apply more aggressive contrast to middle range
                enhanced = gray < 128 ? 0 : 255;
              }
              
              enhancedData[i] = enhanced;     // Red
              enhancedData[i + 1] = enhanced; // Green
              enhancedData[i + 2] = enhanced; // Blue
              enhancedData[i + 3] = 255;      // Alpha
            }
            
            code = jsQR(enhancedData, enhancedImageData.width, enhancedImageData.height, {
              inversionAttempts: "attemptBoth",
            });
          }
        
          if (code && code.data) {
            console.log('QR Code detected:', code.data); // Debug log
            
            // Validate that we have a proper QR code data
            const trimmedData = code.data.trim();
            
            // Prevent duplicate detections
            if (trimmedData === lastDetectionRef.current) {
              setDebugInfo(`Duplicate QR detected, skipping: "${trimmedData}"`);
              scheduleNextScan();
              return;
            }
            
            // Accept any QR code data that looks valid (not empty and reasonable length)
            if (trimmedData && trimmedData.length >= 4 && trimmedData.length <= 50) {
              // Store last detection to prevent duplicates
              lastDetectionRef.current = trimmedData;
              
              // Show success feedback
              setSuccessFeedback(true);
              setTimeout(() => setSuccessFeedback(false), 2000);
              
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
                
                // Add a success indicator text
                context.fillStyle = '#00FF00';
                context.font = 'bold 24px sans-serif';
                context.fillText('✓ QR Detected!', code.location.topLeftCorner.x, code.location.topLeftCorner.y - 10);
              }
            
              // Process the detected QR code data
              setScanStats(prev => ({ ...prev, successful: prev.successful + 1 }));
              handleQRCodeDetected(trimmedData);
              return;
            } else {
              // Update debug info for invalid QR codes
              setScanStats(prev => ({ ...prev, failed: prev.failed + 1 }));
              setDebugInfo(`QR detected but invalid format: "${trimmedData}" (length: ${trimmedData.length})`);
            }
          } else {
            // Update scan status for debugging
            setDebugInfo(`Scanning... Frame ${scanAttempts + 1}, Video: ${video.videoWidth}x${video.videoHeight}`);
          }
        } catch (error) {
          console.error('Error during QR detection:', error);
          setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } else {
      // Update debug info when video isn't ready
      if (video) {
        setDebugInfo(`Video not ready. State: ${video.readyState}, Size: ${video.videoWidth}x${video.videoHeight}`);
      } else {
        setDebugInfo('Video ref not available');
      }
    }
    
    scheduleNextScan();
  };

  // Helper function to schedule next scan
  const scheduleNextScan = () => {
    if (scanningStateRef.current && videoInitializedRef.current) {
      // Use a reasonable interval to balance performance and responsiveness
      scanIntervalRef.current = window.setTimeout(scanFromCamera, 150);
    }
  };

  const processDroppedFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      // Show loading message
      setError('Memproses gambar, mohon tunggu...');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const htmlImg = new window.Image();
        htmlImg.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            const context = canvas.getContext('2d');
            if (context) {
              // Set canvas size to match image
              canvas.width = htmlImg.width;
              canvas.height = htmlImg.height;
              context.drawImage(htmlImg, 0, 0);
              
              try {
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                
                // Enhanced QR detection for uploaded images with multiple attempts
                let code = null;
                
                // First attempt: Normal detection
                code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "attemptBoth"
                });
                
                // Second attempt: Try with different scaling if original fails
                if (!code) {
                  // Try scaling the image for better detection
                  const scaledCanvas = document.createElement('canvas');
                  const scaledContext = scaledCanvas.getContext('2d');
                  
                  if (scaledContext) {
                    // Scale to a standardized size for better QR detection
                    const targetSize = 800;
                    scaledCanvas.width = targetSize;
                    scaledCanvas.height = targetSize;
                    
                    scaledContext.drawImage(htmlImg, 0, 0, targetSize, targetSize);
                    const scaledImageData = scaledContext.getImageData(0, 0, targetSize, targetSize);
                    
                    code = jsQR(scaledImageData.data, scaledImageData.width, scaledImageData.height, {
                      inversionAttempts: "attemptBoth"
                    });
                  }
                }
                
                // Third attempt: Try with edge enhancement
                if (!code) {
                  // Apply simple contrast enhancement
                  const enhancedImageData = context.createImageData(imageData.width, imageData.height);
                  const originalData = imageData.data;
                  const enhancedData = enhancedImageData.data;
                  
                  for (let i = 0; i < originalData.length; i += 4) {
                    // Convert to grayscale and enhance contrast
                    const gray = (originalData[i] + originalData[i + 1] + originalData[i + 2]) / 3;
                    const enhanced = gray > 128 ? 255 : 0; // High contrast black and white
                    
                    enhancedData[i] = enhanced;     // Red
                    enhancedData[i + 1] = enhanced; // Green
                    enhancedData[i + 2] = enhanced; // Blue
                    enhancedData[i + 3] = 255;      // Alpha
                  }
                  
                  code = jsQR(enhancedData, enhancedImageData.width, enhancedImageData.height, {
                    inversionAttempts: "attemptBoth"
                  });
                }
                
                if (code && code.data) {
                  console.log('QR Code detected from dropped image:', code.data);
                  
                  // Validate the detected data - accept any reasonable QR code
                  const trimmedData = code.data.trim();
                  
                  if (trimmedData && trimmedData.length >= 4 && trimmedData.length <= 50) {
                    setError(''); // Clear error message
                    handleQRCodeDetected(trimmedData);
                  } else {
                    setError(`QR Code terdeteksi tapi format tidak valid: "${trimmedData}". Pastikan QR code berisi data yang valid.`);
                  }
                } else {
                  setError('QR Code tidak ditemukan dalam gambar. Pastikan:\n• Gambar jelas dan QR code terlihat dengan baik\n• QR code tidak terpotong\n• Pencahayaan gambar cukup\n• QR code berukuran cukup besar dalam gambar');
                }
              } catch (err) {
                console.error("Error processing dropped image:", err);
                setError('Terjadi kesalahan saat memproses gambar. Coba gambar lain dengan kualitas lebih baik.');
              }
            }
          }
        };
        
        htmlImg.onerror = () => {
          setError('Gagal memuat gambar. Pastikan file yang dipilih adalah gambar yang valid.');
        };
        
        htmlImg.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        setError('Gagal membaca file. Coba pilih file gambar lain.');
      };
      
      reader.readAsDataURL(file);
    } else {
      setError('Tipe file tidak didukung. Harap upload gambar (JPG, PNG, dll).');
    }
  };
  
  // Handle drag events for the drop zone
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const dt = e.dataTransfer;
    if (dt.files && dt.files.length > 0) {
      const file = dt.files[0]; // Take only the first file
      processDroppedFile(file);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Show loading message
      setError('Memproses gambar, mohon tunggu...');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const htmlImg = new window.Image();
        htmlImg.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            const context = canvas.getContext('2d');
            if (context) {
              // Set canvas size to match image
              canvas.width = htmlImg.width;
              canvas.height = htmlImg.height;
              context.drawImage(htmlImg, 0, 0);
              
              try {
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                
                // Enhanced QR detection for uploaded images with multiple attempts
                let code = null;
                
                // First attempt: Normal detection
                code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "attemptBoth"
                });
                
                // Second attempt: Try with different scaling if original fails
                if (!code) {
                  // Try scaling the image for better detection
                  const scaledCanvas = document.createElement('canvas');
                  const scaledContext = scaledCanvas.getContext('2d');
                  
                  if (scaledContext) {
                    // Scale to a standardized size for better QR detection
                    const targetSize = 800;
                    scaledCanvas.width = targetSize;
                    scaledCanvas.height = targetSize;
                    
                    scaledContext.drawImage(htmlImg, 0, 0, targetSize, targetSize);
                    const scaledImageData = scaledContext.getImageData(0, 0, targetSize, targetSize);
                    
                    code = jsQR(scaledImageData.data, scaledImageData.width, scaledImageData.height, {
                      inversionAttempts: "attemptBoth"
                    });
                  }
                }
                
                // Third attempt: Try with edge enhancement
                if (!code) {
                  // Apply simple contrast enhancement
                  const enhancedImageData = context.createImageData(imageData.width, imageData.height);
                  const originalData = imageData.data;
                  const enhancedData = enhancedImageData.data;
                  
                  for (let i = 0; i < originalData.length; i += 4) {
                    // Convert to grayscale and enhance contrast
                    const gray = (originalData[i] + originalData[i + 1] + originalData[i + 2]) / 3;
                    const enhanced = gray > 128 ? 255 : 0; // High contrast black and white
                    
                    enhancedData[i] = enhanced;     // Red
                    enhancedData[i + 1] = enhanced; // Green
                    enhancedData[i + 2] = enhanced; // Blue
                    enhancedData[i + 3] = 255;      // Alpha
                  }
                  
                  code = jsQR(enhancedData, enhancedImageData.width, enhancedImageData.height, {
                    inversionAttempts: "attemptBoth"
                  });
                }
                
                if (code && code.data) {
                  console.log('QR Code detected from image:', code.data); // Debug log
                  
                  // Validate the detected data - accept any reasonable QR code
                  const trimmedData = code.data.trim();
                  
                  if (trimmedData && trimmedData.length >= 4 && trimmedData.length <= 50) {
                    setError(''); // Clear error message
                    handleQRCodeDetected(trimmedData);
                  } else {
                    setError(`QR Code terdeteksi tapi format tidak valid: "${trimmedData}". Pastikan QR code berisi data yang valid.`);
                  }
                } else {
                  setError('QR Code tidak ditemukan dalam gambar. Pastikan:\n• Gambar jelas dan QR code terlihat dengan baik\n• QR code tidak terpotong\n• Pencahayaan gambar cukup\n• QR code berukuran cukup besar dalam gambar');
                }
              } catch (err) {
                console.error("Error processing image:", err);
                setError('Terjadi kesalahan saat memproses gambar. Coba gambar lain dengan kualitas lebih baik.');
              }
            }
          }
        };
        
        htmlImg.onerror = () => {
          setError('Gagal memuat gambar. Pastikan file yang dipilih adalah gambar yang valid.');
        };
        
        htmlImg.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        setError('Gagal membaca file. Coba pilih file gambar lain.');
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleQRCodeDetected = async (qrData: string) => {
    try {
      setError('');
      
      // Clean and validate the QR data
      const cleanedData = qrData.trim();
      console.log('Processing QR data:', cleanedData); // Debug log
      
      // Show processing message without stopping camera immediately
      setError('QR Code terdeteksi. Memproses...');
      
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData: cleanedData }),
      });

      const result = await response.json();
      
      if (response.ok) {
        // Now that we have a successful response, stop the camera
        stopCamera();
        
        if (result.type === 'initialize_locker') {
          // Redirect to initialization page for unused QR code
          const params = new URLSearchParams({
            qrCodeId: result.qrCode._id,
            code: result.qrCode.code,
          });
          router.push(`/lockers/initialize?${params.toString()}`);
        } else if (result.type === 'existing_locker') {
          // Show existing locker details
          setScanResult(result);
          setError('');
        }
      } else {
        // Stop camera on error as well
        stopCamera();
        
        // Provide detailed error feedback
        if (result.error) {
          setError(`${result.error}\n\nData QR yang terdeteksi: "${cleanedData}"`);
        } else {
          setError(`QR Code tidak valid. Data yang terdeteksi: "${cleanedData}"`);
        }
        
        // Add a retry instruction with specific debugging info
        setTimeout(() => {
          setError(prevError => prevError + `\n\nSilakan coba scan lagi atau gunakan input manual dengan kode 4 digit.`);
        }, 2000);
      }
    } catch (err) {
      stopCamera();
      console.error("Error in QR code processing:", err);
      setError(`Terjadi kesalahan saat memproses QR Code: ${err instanceof Error ? err.message : 'Unknown error'}\n\nData QR: "${qrData}"`);
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
              <Image 
                src={scanResult.locker.qrCode} 
                alt="QR Code"
                width={64}
                height={64}
                className="rounded-lg border border-gray-600"
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
                  <div key={item._id} className="border border-gray-600 rounded-lg p-4 bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200">
                    <div className="flex flex-col gap-2">
                      <h4 className="font-medium text-white">
                        {item.name} ({item.quantity})
                      </h4>
                      <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded-full border border-blue-500/30 w-fit">
                        {item.category}
                      </span>
                      {item.description && (
                        <p className="text-sm text-gray-400 mt-1 break-words line-clamp-2">{item.description}</p>
                      )}
                    </div>
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
                  <li>Pilih &quot;Allow&quot; atau &quot;Izinkan&quot; untuk kamera</li>
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
              
              <div 
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-300 ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-900/20' 
                    : 'border-slate-600 hover:border-slate-400'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-3">
                  <FileImage size={40} className={`${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-gray-300 font-medium mb-1">
                      {isDragging ? 'Lepas untuk Memproses' : 'Tarik & Lepas Gambar QR Code di Sini'}
                    </p>
                    <p className="text-xs text-gray-400">atau</p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 dark-button text-gray-300 hover:text-gray-100 font-medium transition-all duration-200"
                  >
                    <Upload size={16} className="inline mr-2" />
                    <span>Pilih File</span>
                  </button>
                </div>
              </div>
              
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
                  {/* Loading overlay when video is initializing */}
                  {isVideoLoading && (
                    <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center z-10">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
                      <p className="text-blue-300 text-lg font-medium">Menginisialisasi kamera...</p>
                      <p className="text-gray-400 text-sm mt-2">Mohon tunggu sebentar</p>
                    </div>
                  )}
                  
                  <div className={`w-64 h-64 sm:w-72 sm:h-72 border-2 rounded-lg relative qr-scan-guide transition-all duration-300 ${
                    successFeedback ? 'border-green-500 scale-110' : 'border-blue-500'
                  }`}>
                    {!successFeedback && !isVideoLoading && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 opacity-70 animate-scan"></div>
                    )}
                    
                    {/* Success checkmark */}
                    {successFeedback && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                          <span className="text-white text-2xl font-bold">✓</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Corner markers for better visual guidance */}
                    <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl transition-colors duration-300 ${
                      successFeedback ? 'border-green-500' : 'border-blue-500'
                    }`}></div>
                    <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr transition-colors duration-300 ${
                      successFeedback ? 'border-green-500' : 'border-blue-500'
                    }`}></div>
                    <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl transition-colors duration-300 ${
                      successFeedback ? 'border-green-500' : 'border-blue-500'
                    }`}></div>
                    <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br transition-colors duration-300 ${
                      successFeedback ? 'border-green-500' : 'border-blue-500'
                    }`}></div>
                  </div>
                  
                  {!isVideoLoading && (
                    <p className={`mt-4 text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 ${
                      successFeedback 
                        ? 'text-green-300 bg-green-900/80' 
                        : isVideoReady 
                          ? 'text-blue-300 bg-slate-900/80'
                          : 'text-yellow-300 bg-yellow-900/80'
                    }`}>
                      {successFeedback 
                        ? '✓ QR Code Terdeteksi!' 
                        : isVideoReady 
                          ? 'Scanning... Arahkan ke QR Code'
                          : 'Menunggu kamera siap...'
                      }
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={stopCamera}
                className="w-full px-6 py-3 dark-button text-red-400 hover:text-red-300 font-medium transition-all duration-200"
              >
                Stop Scanning
              </button>
              
              {/* Performance feedback */}
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-blue-400 font-medium">Status Scanning:</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    scanAttempts > 0 ? 'bg-green-900/50 text-green-300' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {scanAttempts > 0 ? `${scanAttempts} attempts` : 'Waiting...'}
                  </span>
                </div>
                
                {/* Performance stats */}
                {(scanStats.successful > 0 || scanStats.failed > 0 || scanStats.totalTime > 0) && (
                  <div className="mb-3 p-2 bg-slate-900/40 rounded text-xs">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-green-400 font-medium">{scanStats.successful}</div>
                        <div className="text-gray-400">Success</div>
                      </div>
                      <div>
                        <div className="text-red-400 font-medium">{scanStats.failed}</div>
                        <div className="text-gray-400">Failed</div>
                      </div>
                      <div>
                        <div className="text-blue-400 font-medium">{scanStats.totalTime}ms</div>
                        <div className="text-gray-400">Init Time</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mb-3">
                  <h4 className="text-blue-400 font-medium mb-2">Tips untuk Scan QR Code:</h4>
                  <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                    <li>Pastikan QR code berada dalam kotak panduan</li>
                    <li>Jaga kamera tetap stabil dan fokus</li>
                    <li>Pastikan QR code mendapat pencahayaan yang cukup</li>
                    <li>Jarak ideal: 15-30 cm dari QR code</li>
                    {scanAttempts > 30 && (
                      <li className="text-yellow-400 font-medium">
                        ⚠️ Coba ubah sudut atau pencahayaan, atau gunakan input manual
                      </li>
                    )}
                  </ul>
                </div>
                
                {/* Debug info panel */}
                {debugInfo && (
                  <div className="mt-3 p-2 bg-gray-900/50 border border-gray-600 rounded text-xs text-gray-400">
                    <strong>Debug:</strong> {debugInfo}
                  </div>
                )}
                
                {/* Show manual input option after many failed attempts */}
                {scanAttempts > 50 && (
                  <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                    <h5 className="text-yellow-400 font-medium mb-2">🔄 Scan Berulang Kali?</h5>
                    <p className="text-yellow-200 text-sm mb-3">
                      Sepertinya QR code sulit dideteksi. Coba input manual untuk hasil lebih cepat.
                    </p>
                    <button
                      onClick={() => {
                        stopCamera();
                        // Focus on manual input after stopping camera
                        setTimeout(() => {
                          const manualInput = document.getElementById('manualCode') as HTMLInputElement;
                          if (manualInput) {
                            manualInput.focus();
                          }
                        }, 500);
                      }}
                      className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Beralih ke Input Manual
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
