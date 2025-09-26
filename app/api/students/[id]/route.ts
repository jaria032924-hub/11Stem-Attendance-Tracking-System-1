import { type NextRequest, NextResponse } from "next/server"
import { updateStudent, deleteStudent } from "@/lib/database"
import type { StudentFormData } from "@/lib/types"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body: Partial<StudentFormData> = await request.json()

    const student = await updateStudent(id, body)
    return NextResponse.json(student)
  } catch (error: any) {
    console.error("Error in PUT /api/students/[id]:", error)

    if (error.code === "23505") {
      return NextResponse.json({ message: "A student with this LRN already exists" }, { status: 409 })
    }

    return NextResponse.json({ message: "Failed to update student" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteStudent(id)
    return NextResponse.json({ message: "Student deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/students/[id]:", error)
    return NextResponse.json({ message: "Failed to delete student" }, { status: 500 })
  }
}
