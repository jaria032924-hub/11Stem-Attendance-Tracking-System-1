"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Camera, CameraOff, Keyboard, Scan, CheckCircle, AlertCircle } from "lucide-react"

interface ScanResult {
  success: boolean
  message: string
  student?: {
    name: string
    grade: string
    section: string
    lrn: string
  }
  alreadyScanned?: boolean
}

interface BarcodeScannerProps {
  onScan: (lrn: string) => Promise<ScanResult>
  scanLocation?: string
}

export function BarcodeScanner({ onScan, scanLocation = "School Gate" }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualLRN, setManualLRN] = useState("")
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanMode, setScanMode] = useState<"camera" | "manual">("manual")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera if available
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please use manual entry or check camera permissions.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const handleManualScan = async () => {
    if (!manualLRN.trim()) return

    if (!/^\d{12}$/.test(manualLRN)) {
      setLastScanResult({
        success: false,
        message: "LRN must be exactly 12 digits",
      })
      return
    }

    await processScan(manualLRN)
    setManualLRN("")
  }

  const processScan = async (lrn: string) => {
    setIsProcessing(true)
    try {
      const result = await onScan(lrn)
      setLastScanResult(result)

      // Auto-clear success messages after 3 seconds
      if (result.success) {
        setTimeout(() => {
          setLastScanResult(null)
        }, 3000)
      }
    } catch (error) {
      setLastScanResult({
        success: false,
        message: "Failed to process scan. Please try again.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleManualScan()
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Attendance Scanner - {scanLocation}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scan Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={scanMode === "manual" ? "default" : "outline"}
              onClick={() => {
                setScanMode("manual")
                if (isScanning) stopCamera()
              }}
              className="flex-1"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
            <Button
              variant={scanMode === "camera" ? "default" : "outline"}
              onClick={() => setScanMode("camera")}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Camera Scan
            </Button>
          </div>

          {/* Manual Entry Mode */}
          {scanMode === "manual" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-lrn">Enter LRN (12 digits)</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-lrn"
                    type="text"
                    placeholder="123456789012"
                    value={manualLRN}
                    onChange={(e) => setManualLRN(e.target.value)}
                    onKeyPress={handleKeyPress}
                    maxLength={12}
                    className="font-mono"
                    disabled={isProcessing}
                  />
                  <Button onClick={handleManualScan} disabled={!manualLRN.trim() || isProcessing}>
                    {isProcessing ? "Processing..." : "Scan"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Camera Mode */}
          {scanMode === "camera" && (
            <div className="space-y-4">
              <div className="text-center">
                {!isScanning ? (
                  <div className="space-y-4">
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Camera not active</p>
                      </div>
                    </div>
                    <Button onClick={startCamera}>
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-48 bg-black rounded-lg object-cover"
                      />
                      <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
                        <div className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                          Position barcode in frame
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={stopCamera} variant="outline">
                        <CameraOff className="h-4 w-4 mr-2" />
                        Stop Camera
                      </Button>
                      <div className="text-sm text-muted-foreground flex items-center">
                        Note: Automatic barcode detection requires additional libraries. Use manual entry for now.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Result */}
      {lastScanResult && (
        <Alert className={lastScanResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <div className="flex items-center gap-2">
            {lastScanResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={lastScanResult.success ? "text-green-800" : "text-red-800"}>
              <div className="space-y-2">
                <p>{lastScanResult.message}</p>
                {lastScanResult.student && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{lastScanResult.student.name}</Badge>
                    <Badge variant="outline">{lastScanResult.student.grade}</Badge>
                    <Badge variant="outline">{lastScanResult.student.section}</Badge>
                    <Badge variant="outline" className="font-mono">
                      {lastScanResult.student.lrn}
                    </Badge>
                    {lastScanResult.alreadyScanned && <Badge variant="destructive">Already Scanned Today</Badge>}
                  </div>
                )}
              </div>
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  )
}
