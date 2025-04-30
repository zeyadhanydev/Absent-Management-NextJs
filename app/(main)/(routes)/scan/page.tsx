"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {  X, QrCode, VideoIcon, VideoOff } from "lucide-react";
// Dynamically import to avoid SSR issues

export default function QRScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
 const videoRef = useRef<HTMLVideoElement>(null);

  const handleScan = (data: string | null) => {
    if (data) {
      setScanResult(data);
      setScanning(false);
      console.log("Scanned QR Code:", data);
    }
  };

  function handleVideo() {
    navigator.mediaDevices
      .getUserMedia({ video: { width: "100%", height: "100%" } })
      .then((stream) => {
        let video = videoRef.current;
        video!.srcObject = stream;
        video!.play();
      })
      .catch((error) => console.log(error));
  }
  useEffect(() => handleVideo, [videoRef])
  const handleError = (err: any) => {
    setError("Camera access denied or not available. Please allow camera permission and try again.");
    setScanning(false);
    console.error("QR Reader Error:", err);
  };

  const reset = () => {
    setScanning(false);
    setScanResult(null);
    setError(null);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-md">
      <Button onClick={handleVideo}>hi</Button>
      <video ref={videoRef}></video>
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
          <CardDescription>
            Scan a QR code using your device camera.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {scanning && (
            <div className="border rounded-md overflow-hidden">
              <QrReader
                onError={handleError}
                onScan={handleScan}
                style={{ width: "100%" }}
                facingMode="environment"
                showViewFinder={true}
              />
            </div>
          )}
          {!scanning && !scanResult && (
            <div className="p-12 flex flex-col items-center justify-center text-center text-gray-500">
              <div className="mb-4 rounded-full bg-muted p-3">
                <QrCode className="h-6 w-6" />
              </div>
              <p className="text-sm">Camera will activate when you start scanning</p>
            </div>
          )}
          {scanResult && (
            <div className="border rounded-md p-4 bg-muted/30">
              <h3 className="text-sm font-medium mb-1">QR Code Content:</h3>
              <p className="text-xs bg-muted p-2 rounded-md break-all">{scanResult}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col space-y-3 pt-2">
          {!scanning && !scanResult && (
            <Button onClick={() => setScanning(true)} className="w-full">
              Start Scanning
            </Button>
          )}
          {scanning && (
            <Button onClick={() => setScanning(false)} variant="outline" className="w-full">
              Cancel Scan
            </Button>
          )}
          {(scanResult || error) && (
            <Button variant="outline" onClick={reset} className="w-full">
              Reset
            </Button>
          )}
        </CardFooter>
      </Card>
      <p className="text-xs text-center mt-4 text-gray-500">
        Ensure your camera permission is enabled for this site.
      </p>
    </div>
  );
}