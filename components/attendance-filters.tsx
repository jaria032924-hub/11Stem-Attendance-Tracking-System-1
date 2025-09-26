"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Filter, Download, RefreshCw } from "lucide-react"

interface AttendanceFiltersProps {
  onFilterChange: (filters: AttendanceFilters) => void
  onExport: (filters: AttendanceFilters) => void
  onRefresh: () => void
  grades: string[]
  sections: string[]
  isLoading?: boolean
}

export interface AttendanceFilters {
  dateFrom: string
  dateTo: string
  grade: string
  section: string
  studentName: string
}

export function AttendanceFilters({
  onFilterChange,
  onExport,
  onRefresh,
  grades,
  sections,
  isLoading,
}: AttendanceFiltersProps) {
  const [filters, setFilters] = useState<AttendanceFilters>({
    dateFrom: new Date().toISOString().split("T")[0],
    dateTo: new Date().toISOString().split("T")[0],
    grade: "all",
    section: "all",
    studentName: "",
  })

  const handleFilterChange = (key: keyof AttendanceFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleExport = () => {
    onExport(filters)
  }

  const resetFilters = () => {
    const resetFilters: AttendanceFilters = {
      dateFrom: new Date().toISOString().split("T")[0],
      dateTo: new Date().toISOString().split("T")[0],
      grade: "all",
      section: "all",
      studentName: "",
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters & Export
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="date-from">From Date</Label>
            <Input
              id="date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-to">To Date</Label>
            <Input
              id="date-to"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Grade</Label>
            <Select value={filters.grade} onValueChange={(value) => handleFilterChange("grade", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <Select value={filters.section} onValueChange={(value) => handleFilterChange("section", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((section) => (
                  <SelectItem key={section} value={section}>
                    {section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-name">Student Name</Label>
            <Input
              id="student-name"
              type="text"
              placeholder="Search by name..."
              value={filters.studentName}
              onChange={(e) => handleFilterChange("studentName", e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={onRefresh} variant="outline" disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={resetFilters} variant="outline" disabled={isLoading}>
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
