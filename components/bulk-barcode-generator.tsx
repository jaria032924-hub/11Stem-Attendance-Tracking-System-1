"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Student } from "@/lib/types"
import { printStudentCard, downloadBarcode } from "@/lib/barcode"
import { Download, Printer, Search } from "lucide-react"

interface BulkBarcodeGeneratorProps {
  students: Student[]
}

export function BulkBarcodeGenerator({ students }: BulkBarcodeGeneratorProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [gradeFilter, setGradeFilter] = useState<string>("all")
  const [sectionFilter, setSectionFilter] = useState<string>("all")
  const [isProcessing, setIsProcessing] = useState(false)

  // Get unique grades and sections for filters
  const grades = Array.from(new Set(students.map((s) => s.grade))).sort()
  const sections = Array.from(new Set(students.map((s) => s.section))).sort()

  // Filter students based on search and filters
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.lrn.includes(searchTerm)
    const matchesGrade = gradeFilter === "all" || student.grade === gradeFilter
    const matchesSection = sectionFilter === "all" || student.section === sectionFilter

    return matchesSearch && matchesGrade && matchesSection
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)))
    } else {
      setSelectedStudents(new Set())
    }
  }

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents)
    if (checked) {
      newSelected.add(studentId)
    } else {
      newSelected.delete(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleBulkDownload = async () => {
    setIsProcessing(true)
    const selectedStudentData = students.filter((s) => selectedStudents.has(s.id))

    try {
      // Download each barcode with a small delay to prevent browser blocking
      for (let i = 0; i < selectedStudentData.length; i++) {
        const student = selectedStudentData[i]
        downloadBarcode(student.lrn, student.name)

        // Small delay between downloads
        if (i < selectedStudentData.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }
    } catch (error) {
      console.error("Error downloading barcodes:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkPrint = async () => {
    setIsProcessing(true)
    const selectedStudentData = students.filter((s) => selectedStudents.has(s.id))

    try {
      // Print each card with a delay
      for (let i = 0; i < selectedStudentData.length; i++) {
        const student = selectedStudentData[i]
        printStudentCard(student)

        // Delay between prints to allow previous window to process
        if (i < selectedStudentData.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    } catch (error) {
      console.error("Error printing cards:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Barcode Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Students</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or LRN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Filter by Grade</Label>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
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
            <Label htmlFor="section">Filter by Section</Label>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
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
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all">
              Select All ({selectedStudents.size} of {filteredStudents.length} selected)
            </Label>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleBulkDownload}
              disabled={selectedStudents.size === 0 || isProcessing}
            >
              <Download className="h-4 w-4 mr-2" />
              {isProcessing ? "Downloading..." : "Download Selected"}
            </Button>
            <Button variant="outline" onClick={handleBulkPrint} disabled={selectedStudents.size === 0 || isProcessing}>
              <Printer className="h-4 w-4 mr-2" />
              {isProcessing ? "Printing..." : "Print Selected"}
            </Button>
          </div>
        </div>

        {/* Student List */}
        <div className="border rounded-lg max-h-96 overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No students found matching your criteria.</div>
          ) : (
            <div className="divide-y">
              {filteredStudents.map((student) => (
                <div key={student.id} className="flex items-center space-x-3 p-3">
                  <Checkbox
                    checked={selectedStudents.has(student.id)}
                    onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-muted-foreground">
                      LRN: {student.lrn} • {student.grade} {student.section}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
