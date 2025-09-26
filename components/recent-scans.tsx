"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { AttendanceRecord } from "@/lib/types"
import { Clock, Users, AlertTriangle } from "lucide-react"

interface RecentScansProps {
  refreshTrigger?: number
}

export function RecentScans({ refreshTrigger }: RecentScansProps) {
  const [recentScans, setRecentScans] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecentScans()
  }, [refreshTrigger])

  const loadRecentScans = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const response = await fetch(`/api/attendance?date=${today}&limit=10`)
      const data = await response.json()

      if (data.error === "attendance_table_missing" || data.message?.includes("Database Setup Required")) {
        setError(data.message || "Database setup required. Please run the attendance table creation script.")
        setRecentScans([])
      } else if (data.message?.includes("Database setup incomplete")) {
        setError("Database setup incomplete. Please run the database setup scripts first.")
        setRecentScans([])
      } else if (!response.ok) {
        throw new Error(data.message || "Failed to fetch recent scans")
      } else {
        setRecentScans(data.records || data)
        setError(null)
      }
    } catch (error: any) {
      console.error("Error loading recent scans:", error)
      if (error.message?.includes("Failed to fetch")) {
        setError("Failed to fetch attendance records")
      } else {
        setError("Unable to load recent scans. Please check if the database is properly set up.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Scans Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading recent scans...</div>
        ) : error ? (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-2">
                <p className="font-medium">Database Setup Required</p>
                <p className="text-sm">{error}</p>
                <p className="text-sm">Please run the attendance table creation script to enable this feature.</p>
              </div>
            </AlertDescription>
          </Alert>
        ) : recentScans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No scans recorded today yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentScans.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{(scan as any).students?.name || "Unknown Student"}</div>
                  <div className="text-sm text-muted-foreground">
                    LRN: {scan.lrn} • {(scan as any).students?.grade} {(scan as any).students?.section}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-mono">{formatTime(scan.scan_timestamp)}</div>
                  <div className="flex gap-1">
                    <Badge variant={scan.status === "Present" ? "default" : "secondary"}>{scan.status}</Badge>
                    <Badge variant="outline" className="text-xs">
                      {scan.scan_location}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
