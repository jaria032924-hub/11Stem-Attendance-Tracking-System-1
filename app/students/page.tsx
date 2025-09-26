"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StudentForm } from "@/components/student-form"
import { StudentsTable } from "@/components/students-table"
import { BackButton } from "@/components/back-button"
import type { Student, StudentFormData } from "@/lib/types"
import { Plus, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFormLoading, setIsFormLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    setIsLoading(true)
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

  const handleSubmit = async (formData: StudentFormData) => {
    setIsFormLoading(true)
    try {
      const url = editingStudent ? `/api/students/${editingStudent.id}` : "/api/students"
      const method = editingStudent ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to save student")
      }

      const savedStudent = await response.json()

      if (editingStudent) {
        setStudents((prev) => prev.map((s) => (s.id === savedStudent.id ? savedStudent : s)))
        toast({
          title: "Success",
          description: "Student updated successfully.",
        })
      } else {
        setStudents((prev) => [...prev, savedStudent])
        toast({
          title: "Success",
          description: "Student added successfully.",
        })
      }

      setShowForm(false)
      setEditingStudent(null)
    } catch (error) {
      console.error("Error saving student:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save student.",
        variant: "destructive",
      })
    } finally {
      setIsFormLoading(false)
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete student")
      }

      setStudents((prev) => prev.filter((s) => s.id !== id))
      toast({
        title: "Success",
        description: "Student deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting student:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete student.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingStudent(null)
  }

  if (showForm) {
    return (
      <div className="container mx-auto py-8">
        <BackButton href="/students" label="Back to Students" />
        <StudentForm
          student={editingStudent || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isFormLoading}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <BackButton />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Student Management</h1>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Students ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading students...</div>
          ) : (
            <StudentsTable students={students} onEdit={handleEdit} onDelete={handleDelete} isLoading={isFormLoading} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
