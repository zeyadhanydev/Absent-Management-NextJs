'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QrReader } from 'react-qr-reader';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, ScanLine, CheckCircle, XCircle, CameraOff, MapPin, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// --- Interfaces ---
interface LocationCoords { latitude: number; longitude: number; }
interface ScanResult { type: 'success' | 'error' | 'info'; message: string; }

// --- Helper Functions ---
const getLocation = (): Promise<LocationCoords> => {
     return new Promise((resolve, reject) => {
        console.log("Requesting location access...");
        if (!navigator.geolocation) return reject(new Error("Geolocation not supported by this browser."));
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                console.log("Location access granted.");
                resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            },
            (err) => {
                let msg = "Failed to get location.";
                if(err.code === 1) msg = "Location permission denied. Please enable it in browser settings to verify attendance.";
                else if (err.code === 2) msg = "Location information unavailable.";
                else if (err.code === 3) msg = "Location request timed out.";
                console.error("Location Error:", msg, err);
                reject(new Error(msg));
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    });
};

// **WARNING: Basic, insecure fingerprinting. Use a professional library for production.**
const getFingerprint = (): string => {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        let renderer = 'N/A';
        if (gl && gl instanceof WebGLRenderingContext) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            renderer = debugInfo ? gl.getParameter(debugInfo.UNSPECIFIED_RENDERER_WEBGL) : 'N/A';
        }
        // Combine various browser properties - easily spoofable
        const fingerprintData = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency,
            navigator.maxTouchPoints,
            renderer
        ];
        // Simple hash (not cryptographically secure)
        let hash = 0;
        const dataString = fingerprintData.join('|');
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return `basic-${Math.abs(hash).toString(16)}`; // Return as hex string
    } catch (e) {
        console.error("Fingerprint generation error:", e);
        return `Error-${Date.now()}`; // Fallback
    }
};

// --- Component ---
export default function ScanPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationCoords | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  // Function to request camera permission explicitly
  const requestCameraPermission = async () => {
    try {
      console.log("Explicitly requesting camera permission...");
      setScanResult({ type: 'info', message: 'Requesting camera access...' });
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("Camera permission granted", stream);
      
      // Stop the stream since QrReader will request it again
      stream.getTracks().forEach(track => track.stop());
      
      setCameraPermission('granted');
      setScannerActive(true);
      setScanResult(null);
      return true;
    } catch (error) {
      console.error("Camera permission error:", error);
      setCameraPermission('denied');
      setScannerError("Camera access denied. Please allow camera access in your browser settings.");
      setScanResult({ type: 'error', message: 'Camera permission denied.' });
      return false;
    }
  };

  // Function to request location permission explicitly
  const requestLocationPermission = async () => {
    try {
      console.log("Explicitly requesting location permission...");
      setScanResult({ type: 'info', message: 'Requesting location access...' });
      setIsGettingLocation(true);
      
      const location = await getLocation();
      
      setLocationData(location);
      setLocationPermission('granted');
      setIsGettingLocation(false);
      return location;
    } catch (error) {
      console.error("Location permission error:", error);
      setLocationPermission('denied');
      setIsGettingLocation(false);
      if (error instanceof Error) {
        setScanResult({ type: 'error', message: error.message });
      } else {
        setScanResult({ type: 'error', message: 'Location access failed.' });
      }
      return null;
    }
  };

  const handleScanResult = useCallback(async (result: any, error: any) => {
    if (isProcessing || !scannerActive) return; // Prevent processing if already processing or scanner not active

    if (result) {
        const scannedText = result?.getText();
        if (!scannedText) {
            setScanResult({ type: 'error', message: 'Could not read QR code data.' });
            setIsProcessing(false);
            setScannerActive(false);
            return;
        }

        // Log and display scanned data
        console.log("Scanned Data:", scannedText);
        setScannedData(scannedText);

        setScannerActive(false); // Hide scanner after successful scan
        setIsProcessing(true);
        setScanResult({ type: 'info', message: 'QR Code scanned. Processing...' });

        let verificationCode = '';
        try {
            // Try parsing as URL first
            const url = new URL(scannedText);
            const pathParts = url.pathname.split('/');
            const potentialCode = pathParts[pathParts.length - 1];
            // Basic UUID check
            if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(potentialCode)) {
                 verificationCode = potentialCode;
            }
        } catch (_) {
            // If not a valid URL, check if the text itself is a UUID
            if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(scannedText)) {
                 verificationCode = scannedText;
            }
        }

        if (!verificationCode) {
             setScanResult({ type: 'error', message: 'Invalid QR code format. Scan again.' });
             setIsProcessing(false);
             return;
        }

        // Get location after scanning
        if (locationData === null) {
            const location = await requestLocationPermission();
            if (!location) {
                setScanResult({ type: 'error', message: 'Location permission required for verification.' });
                setIsProcessing(false);
                return;
            }
        }

        // Proceed with verification only if we have location
        if (locationData) {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Authentication token not found. Please log in.');

                setScanResult({ type: 'info', message: 'Verifying device...' });
                const fingerprint = getFingerprint();

                const payload = {
                    location: { latitude: locationData.latitude, longitude: locationData.longitude },
                    fingerprint: fingerprint,
                };

                setScanResult({ type: 'info', message: 'Submitting attendance...' });
                const apiUrl = `${process.env.NEXT_PUBLIC_PROTOCOL}://${process.env.NEXT_PUBLIC_HOST ||process.env.NEXT_PUBLIC_NETWORK_HOST}:${process.env.NEXT_PUBLIC_PORT || process.env.NEXT_PUBLIC_NETWORK_PORT}/api/attendance/verify/${verificationCode}`;
                const response = await axios.post(apiUrl, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setScanResult({ type: 'success', message: response.data?.message || 'Attendance verified!' });
                toast.success(response.data?.message || 'Attendance verified!');

            } catch (error) {
                console.error("Verification failed:", error);
                let message = 'Attendance verification failed.';
                if (error instanceof AxiosError && error.response?.data?.message) {
                    message = `Verification failed: ${error.response.data.message}`;
                } else if (error instanceof Error) {
                    message = `Verification failed: ${error.message}`;
                }
                setScanResult({ type: 'error', message: message });
                toast.error(message);
            } finally {
                setIsProcessing(false);
            }
        }
    }

    if (error) {
        console.error("QR Scan Error:", error);
        // Handle specific camera permission errors
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
            setScannerError("Camera permission denied. Please grant access in your browser settings and try again.");
            setCameraPermission('denied');
            setScannerActive(false);
        } else if (error instanceof DOMException && error.name === 'NotFoundError') {
            setScannerError("No camera found. Please ensure a camera is connected and enabled.");
            setScannerActive(false);
        } else if (error?.message && !scannerError) {
             console.warn("Non-critical scanner error:", error.message);
        }
    }
  }, [isProcessing, scannerActive, locationData]); // Dependencies

  // Function to reset state and start scanning
  const resetAndStartScan = async () => {
      setScanResult(null);
      setScannedData(null);
      setIsProcessing(false);
      setScannerError(null);
      
      // Request camera permission before activating scanner
      const permissionGranted = await requestCameraPermission();
      if (permissionGranted) {
          setScannerActive(true);
      }
  };

  // Function to get location manually
  const getLocationManually = async () => {
    await requestLocationPermission();
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col items-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Scan Attendance</CardTitle>
          <CardDescription className="text-center">
            {!scannerActive && !scanResult && !isProcessing && "Click Start to request camera access."}
            {scannerActive && "Point your camera at the QR code."}
            {scanResult && !scannerActive && "Scan complete. See results below."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">

          {/* Permission Status Indicators */}
          <div className="flex justify-center gap-4 w-full">
            <div className={`flex items-center gap-1 text-xs p-1 rounded ${
              cameraPermission === 'granted' ? 'bg-green-100 text-green-800' : 
              cameraPermission === 'denied' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}>
              <Camera className="h-3 w-3" /> 
              {cameraPermission === 'granted' ? 'Camera: Allowed' : 
               cameraPermission === 'denied' ? 'Camera: Denied' : 'Camera: Not requested'}
            </div>
            
            <div className={`flex items-center gap-1 text-xs p-1 rounded ${
              locationPermission === 'granted' ? 'bg-green-100 text-green-800' : 
              locationPermission === 'denied' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}>
              <MapPin className="h-3 w-3" />
              {locationPermission === 'granted' ? 'Location: Allowed' : 
               locationPermission === 'denied' ? 'Location: Denied' : 'Location: Not requested'}
            </div>
          </div>

          {/* Initial State: Buttons to Start */}
          {!scannerActive && !scannerError && !isProcessing && !scanResult && (
            <div className="flex flex-col gap-3 w-full">
              <Button onClick={resetAndStartScan} size="lg" className="w-full">
                  <Camera className="mr-2 h-5 w-5" /> Request Camera Access
              </Button>
              <Button onClick={getLocationManually} size="sm" variant="outline" className="w-full">
                  <MapPin className="mr-2 h-4 w-4" /> Request Location Access
              </Button>
            </div>
          )}

          {/* Scanner View */}
          {scannerActive && !scannerError && (
            <div className="w-full aspect-square border rounded-lg overflow-hidden bg-slate-900 relative">
              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-1 rounded z-10">Camera Active</div>
              <QrReader
                onResult={handleScanResult}
                constraints={{ facingMode: 'environment' }}
                scanDelay={500}
                containerStyle={{ width: '100%', height: '100%' }}
                videoContainerStyle={{ width: '100%', height: '100%', paddingTop: '0' }}
                videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
               <div className="absolute inset-0 border-[20px] border-black/30 box-border pointer-events-none"></div>
               <div className="absolute top-1/2 left-1/2 w-3/4 h-px bg-red-500 animate-scan-line pointer-events-none"></div>
               <style jsx>{`
                  @keyframes scanLine {
                    0% { transform: translate(-50%, -150px); }
                    50% { transform: translate(-50%, 150px); }
                    100% { transform: translate(-50%, -150px); }
                  }
                  .animate-scan-line {
                    animation: scanLine 3s infinite ease-in-out;
                  }
               `}</style>
            </div>
          )}

           {/* Scanner Error Display */}
          {scannerError && !scannerActive && (
            <div className="mt-4 p-4 rounded-md w-full text-center bg-yellow-100 text-yellow-800 flex flex-col items-center gap-2">
                <CameraOff className="w-8 h-8" />
                <p>{scannerError}</p>
                <Button onClick={resetAndStartScan} variant="link" size="sm">Try Again?</Button>
            </div>
          )}

          {/* Scanned Data Display */}
          {scannedData && (
            <div className="mt-2 p-3 rounded-md w-full text-center bg-gray-100 text-gray-700 text-sm break-all">
                <strong>Scanned QR Code:</strong> {scannedData}
            </div>
          )}

          {/* Location Data Display */}
          {locationData && (
            <div className="mt-2 p-3 rounded-md w-full text-center bg-blue-50 text-blue-700 text-sm">
                <div className="font-bold flex items-center justify-center gap-1">
                    <MapPin className="h-4 w-4" /> Location Coordinates:
                </div>
                <div className="mt-1">
                    <span className="font-mono">Lat: {locationData.latitude.toFixed(6)}</span>
                    <span className="mx-2">|</span>
                    <span className="font-mono">Long: {locationData.longitude.toFixed(6)}</span>
                </div>
            </div>
          )}

          {/* Status Display */}
          {scanResult && (
            <div className={`mt-2 p-4 rounded-md w-full text-center flex items-center justify-center gap-2 ${
                scanResult.type === 'success' ? 'bg-green-100 text-green-800' :
                scanResult.type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
            }`}>
              {scanResult.type === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0"/>}
              {scanResult.type === 'error' && <XCircle className="h-5 w-5 flex-shrink-0"/>}
              {(isProcessing || isGettingLocation) && <Loader2 className="h-5 w-5 animate-spin flex-shrink-0"/>}
              <span>{scanResult.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-center mt-2 w-full">
            {/* Rescan Button */}
            {!scannerActive && !isProcessing && (
                <Button onClick={resetAndStartScan} variant="outline">
                    <ScanLine className="mr-2 h-4 w-4" /> Scan Again
                </Button>
            )}
            
            {/* Get Location Button (if not already requested) */}
            {!locationData && !isGettingLocation && (
                <Button onClick={getLocationManually} variant="outline">
                    <MapPin className="mr-2 h-4 w-4" /> Get Location
                </Button>
            )}
          </div>

        </CardContent>
      </Card>
       <p className="text-xs text-muted-foreground mt-4 text-center max-w-md">
          This app requires <span className="font-medium">camera permission</span> to scan QR codes and <span className="font-medium">location permission</span> to verify your attendance. Your location coordinates are displayed for transparency and only sent to the server for verification.
      </p>
    </div>
  );
} 