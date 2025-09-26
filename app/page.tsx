"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { AttendanceStats } from "@/lib/types"
import { Users, Scan, QrCode, BarChart3, Settings, UserCheck, TrendingUp, Clock } from "lucide-react"

export default function HomePage() {
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0,
    totalScansToday: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch("/api/reports/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAttendanceStatus = (rate: number) => {
    if (rate >= 90) return { label: "Excellent", color: "bg-green-100 text-green-800" }
    if (rate >= 75) return { label: "Good", color: "bg-yellow-100 text-yellow-800" }
    return { label: "Needs Attention", color: "bg-red-100 text-red-800" }
  }

  const attendanceStatus = getAttendanceStatus(stats.attendanceRate)

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-balance">School Attendance Tracking System</h1>
        <p className="text-xl text-muted-foreground text-balance">
          Simplified attendance monitoring using barcode scanning for LRN (Learner Reference Number)
        </p>
      </div>

      {/* Today's Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading today's statistics...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.presentToday}</div>
                <div className="text-sm text-muted-foreground">Students Present</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.absentToday}</div>
                <div className="text-sm text-muted-foreground">Students Absent</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.attendanceRate}%</div>
                <div className="text-sm text-muted-foreground">Attendance Rate</div>
                <Badge className={attendanceStatus.color}>{attendanceStatus.label}</Badge>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.totalScansToday}</div>
                <div className="text-sm text-muted-foreground">Total Scans</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-blue-600" />
              Scan Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Scan student barcodes or enter LRN manually to mark attendance.
            </p>
            <Link href="/scan">
              <Button className="w-full">Start Scanning</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Manage Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Add, edit, or remove student records and their information.
            </p>
            <Link href="/students">
              <Button variant="outline" className="w-full bg-transparent">
                Manage Students
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-purple-600" />
              Generate Barcodes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Generate and print student ID cards with barcodes.</p>
            <Link href="/barcodes">
              <Button variant="outline" className="w-full bg-transparent">
                Generate Barcodes
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              View Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">View attendance reports, statistics, and export data.</p>
            <Link href="/reports">
              <Button variant="outline" className="w-full bg-transparent">
                View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* System Features */}
      <Card>
        <CardHeader>
          <CardTitle>System Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Attendance Tracking
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Barcode scanning using LRN (Learner Reference Number)</li>
                <li>• Manual LRN entry option</li>
                <li>• Real-time attendance marking</li>
                <li>• Duplicate scan prevention</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Notifications & Reports
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• SMS notifications to parents/students</li>
                <li>• Comprehensive attendance reports</li>
                <li>• Export data to CSV format</li>
                <li>• Filter by date, grade, and section</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Link */}
      <div className="text-center">
        <Link href="/settings">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            System Settings
          </Button>
        </Link>
      </div>
    </div>
  )
}
