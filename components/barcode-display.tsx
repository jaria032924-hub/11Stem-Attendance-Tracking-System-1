"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { generateBarcodeDataURL, downloadBarcode, printStudentCard } from "@/lib/barcode"
import type { Student } from "@/lib/types"
import { Download, Printer, QrCode } from "lucide-react"

interface BarcodeDisplayProps {
  student: Student
  showActions?: boolean
}

export function BarcodeDisplay({ student, showActions = true }: BarcodeDisplayProps) {
  const [barcodeDataURL, setBarcodeDataURL] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    try {
      const dataURL = generateBarcodeDataURL(student.lrn, {
        width: 2,
        height: 80,
        displayValue: true,
      })
      setBarcodeDataURL(dataURL)
    } catch (error) {
      console.error("Error generating barcode:", error)
    }
  }, [student.lrn])

  const handleDownload = () => {
    downloadBarcode(student.lrn, student.name)
  }

  const handlePrint = () => {
    printStudentCard(student)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Student Barcode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">
            <strong>{student.name}</strong> - {student.grade} {student.section}
          </div>
          <div className="bg-white p-4 rounded border inline-block">
            {barcodeDataURL ? (
              <img
                src={barcodeDataURL || "/placeholder.svg"}
                alt={`Barcode for ${student.lrn}`}
                className="max-w-full h-auto"
              />
            ) : (
              <div className="w-48 h-20 bg-gray-100 flex items-center justify-center">
                <span className="text-sm text-gray-500">Generating barcode...</span>
              </div>
            )}
          </div>
          <div className="text-xs font-mono text-muted-foreground">LRN: {student.lrn}</div>
        </div>

        {showActions && barcodeDataURL && (
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print ID Card
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
