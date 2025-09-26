"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Student, StudentFormData } from "@/lib/types"

interface StudentFormProps {
  student?: Student
  onSubmit: (data: StudentFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function StudentForm({ student, onSubmit, onCancel, isLoading }: StudentFormProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    lrn: student?.lrn || "",
    name: student?.name || "",
    grade: student?.grade || "",
    section: student?.section || "",
    parent_phone: student?.parent_phone || "",
    student_phone: student?.student_phone || "",
  })

  const [errors, setErrors] = useState<Partial<StudentFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<StudentFormData> = {}

    if (!formData.lrn.trim()) {
      newErrors.lrn = "LRN is required"
    } else if (!/^\d{12}$/.test(formData.lrn)) {
      newErrors.lrn = "LRN must be exactly 12 digits"
    }

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.grade.trim()) {
      newErrors.grade = "Grade is required"
    }

    if (!formData.section.trim()) {
      newErrors.section = "Section is required"
    }

    if (formData.parent_phone && !/^\+?[\d\s\-$$$$]+$/.test(formData.parent_phone)) {
      newErrors.parent_phone = "Invalid phone number format"
    }

    if (formData.student_phone && !/^\+?[\d\s\-$$$$]+$/.test(formData.student_phone)) {
      newErrors.student_phone = "Invalid phone number format"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  const handleInputChange = (field: keyof StudentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{student ? "Edit Student" : "Add New Student"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lrn">LRN (Learner Reference Number) *</Label>
              <Input
                id="lrn"
                type="text"
                placeholder="123456789012"
                value={formData.lrn}
                onChange={(e) => handleInputChange("lrn", e.target.value)}
                maxLength={12}
                disabled={!!student} // Don't allow editing LRN for existing students
              />
              {errors.lrn && <p className="text-sm text-destructive">{errors.lrn}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Dela Cruz"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade *</Label>
              <Input
                id="grade"
                type="text"
                placeholder="Grade 7"
                value={formData.grade}
                onChange={(e) => handleInputChange("grade", e.target.value)}
              />
              {errors.grade && <p className="text-sm text-destructive">{errors.grade}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section *</Label>
              <Input
                id="section"
                type="text"
                placeholder="Section A"
                value={formData.section}
                onChange={(e) => handleInputChange("section", e.target.value)}
              />
              {errors.section && <p className="text-sm text-destructive">{errors.section}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_phone">Parent Phone Number</Label>
              <Input
                id="parent_phone"
                type="tel"
                placeholder="+63 912 345 6789"
                value={formData.parent_phone}
                onChange={(e) => handleInputChange("parent_phone", e.target.value)}
              />
              {errors.parent_phone && <p className="text-sm text-destructive">{errors.parent_phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="student_phone">Student Phone Number</Label>
              <Input
                id="student_phone"
                type="tel"
                placeholder="+63 912 345 6789"
                value={formData.student_phone}
                onChange={(e) => handleInputChange("student_phone", e.target.value)}
              />
              {errors.student_phone && <p className="text-sm text-destructive">{errors.student_phone}</p>}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : student ? "Update Student" : "Add Student"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
