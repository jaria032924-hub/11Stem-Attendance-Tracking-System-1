"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarcodeDisplay } from "@/components/barcode-display"
import { BulkBarcodeGenerator } from "@/components/bulk-barcode-generator"
import { BackButton } from "@/components/back-button"
import type { Student } from "@/lib/types"
import { QrCode } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function BarcodesPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const response = await fetch("/api/students")
      if (!response.ok) throw new Error("Failed to fetch students")
      const data = await response.json()
      setStudents(data)
    } catch (error) {
      console.error("Error loading students:", error)
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading students...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <BackButton />

      <div className="flex items-center gap-2">
        <QrCode className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Barcode Management</h1>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No students registered yet. Please add students first to generate barcodes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <BulkBarcodeGenerator students={students} />

          <Card>
            <CardHeader>
              <CardTitle>Individual Student Barcodes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <BarcodeDisplay key={student.id} student={student} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
