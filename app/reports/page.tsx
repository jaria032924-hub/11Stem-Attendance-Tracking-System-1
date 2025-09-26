"use client"

import { useState, useEffect } from "react"
import { AttendanceStatsCards } from "@/components/attendance-stats"
import { AttendanceFilters, type AttendanceFilters as FilterType } from "@/components/attendance-filters"
import { AttendanceTable } from "@/components/attendance-table"
import { BackButton } from "@/components/back-button"
import type { AttendanceStats, AttendanceRecord, Student } from "@/lib/types"
import { BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ReportsPage() {
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0,
    totalScansToday: 0,
  })
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([loadStats(), loadRecords(), loadStudents()])
    } catch (error) {
      console.error("Error loading initial data:", error)
      toast({
        title: "Error",
        description: "Failed to load report data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async (date?: string) => {
    try {
      const url = date ? `/api/reports/stats?date=${date}` : "/api/reports/stats"
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const loadRecords = async (filters?: FilterType) => {
    try {
      const params = new URLSearchParams()
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom)
      if (filters?.dateTo) params.append("dateTo", filters.dateTo)
      if (filters?.grade && filters.grade !== "all") params.append("grade", filters.grade)
      if (filters?.section && filters.section !== "all") params.append("section", filters.section)
      if (filters?.studentName) params.append("studentName", filters.studentName)

      const response = await fetch(`/api/attendance?${params.toString()}`)
      const data = await response.json()

      if (data.error === "attendance_table_missing" || data.message?.includes("Database Setup Required")) {
        console.error("Database setup required:", data.message)
        toast({
          title: "Database Setup Required",
          description: "Please run the attendance table creation script to enable reports.",
          variant: "destructive",
        })
        setRecords([])
        return
      }

      if (!response.ok) throw new Error(data.message || "Failed to fetch records")
      setRecords(data.records || data)
    } catch (error) {
      console.error("Error loading records:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance records. Please check if the database is properly set up.",
        variant: "destructive",
      })
    }
  }

  const handleFilterChange = (filters: FilterType) => {
    loadRecords(filters)
    // Update stats if date filter changed
    if (filters.dateFrom === filters.dateTo) {
      loadStats(filters.dateFrom)
    } else {
      loadStats() // Load today's stats if date range
    }
  }

  const handleExport = async (filters: FilterType) => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom)
      if (filters.dateTo) params.append("dateTo", filters.dateTo)
      if (filters.grade && filters.grade !== "all") params.append("grade", filters.grade)
      if (filters.section && filters.section !== "all") params.append("section", filters.section)

      const response = await fetch(`/api/reports/export?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.error === "attendance_table_missing") {
          throw new Error("Database setup required. Please run the attendance table creation script first.")
        }
        throw new Error(errorData.message || "Failed to export data")
      }

      const csvData = await response.text()

      // Create and download file
      const blob = new Blob([csvData], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `attendance-report-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: "Attendance report has been downloaded.",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export attendance report.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleRefresh = () => {
    loadInitialData()
  }

  const loadStudents = async () => {
    try {
      const response = await fetch("/api/students")
      if (!response.ok) throw new Error("Failed to fetch students")
      const data = await response.json()
      setStudents(data)
    } catch (error) {
      console.error("Error loading students:", error)
    }
  }

  // Get unique grades and sections for filters
  const grades = Array.from(new Set(students.map((s) => s.grade))).sort()
  const sections = Array.from(new Set(students.map((s) => s.section))).sort()

  return (
    <div className="container mx-auto py-8 space-y-6">
      <BackButton />

      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Attendance Reports</h1>
      </div>

      {/* Stats Cards */}
      <AttendanceStatsCards stats={stats} isLoading={isLoading} />

      {/* Filters */}
      <AttendanceFilters
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        onRefresh={handleRefresh}
        grades={grades}
        sections={sections}
        isLoading={isLoading || isExporting}
      />

      {/* Attendance Table */}
      <AttendanceTable records={records} isLoading={isLoading} />
    </div>
  )
}
