"use client"

import { useState } from "react"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { RecentScans } from "@/components/recent-scans"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BackButton } from "@/components/back-button"
import type { ScanResult } from "@/lib/types"
import { Scan, TrendingUp, Users, Clock, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ScanPage() {
  const [scanCount, setScanCount] = useState(0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [databaseError, setDatabaseError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleScan = async (lrn: string): Promise<ScanResult> => {
    try {
      const response = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lrn, location: "School Gate" }),
      })

      const result = await response.json()

      if (result.message?.includes("Database setup incomplete")) {
        setDatabaseError("Database setup incomplete. Please run the database setup scripts first.")
        toast({
          title: "Database Setup Required",
          description: "Please run the attendance table creation script first.",
          variant: "destructive",
        })
        return {
          success: false,
          message: "Database setup incomplete. Please run the database setup scripts first.",
        }
      }

      if (result.success) {
        setScanCount((prev) => prev + 1)
        setRefreshTrigger((prev) => prev + 1)
        setDatabaseError(null) // Clear any previous database errors

        // Show success toast
        toast({
          title: "Attendance Recorded",
          description: `${result.student?.name} marked as present`,
        })
      } else {
        // Show error toast
        toast({
          title: "Scan Failed",
          description: result.message,
          variant: "destructive",
        })
      }

      return result
    } catch (error) {
      console.error("Error processing scan:", error)
      const errorResult: ScanResult = {
        success: false,
        message: "Network error. Please check your connection and try again.",
      }

      toast({
        title: "Network Error",
        description: errorResult.message,
        variant: "destructive",
      })

      return errorResult
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <BackButton />

      <div className="flex items-center gap-2">
        <Scan className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Attendance Scanning</h1>
      </div>

      {databaseError && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-2">
              <p className="font-medium">Database Setup Required</p>
              <p className="text-sm">{databaseError}</p>
              <p className="text-sm">
                Please run the attendance table creation script to enable scanning functionality.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scans Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scanCount}</div>
            <p className="text-xs text-muted-foreground">Students marked present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={databaseError ? "destructive" : "default"}>
                {databaseError ? "Setup Required" : "Active"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {databaseError ? "Database setup needed" : "Ready to scan"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <div>
          <BarcodeScanner onScan={handleScan} scanLocation="School Gate" />
        </div>

        {/* Recent Scans */}
        <div>
          <RecentScans refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  )
}
