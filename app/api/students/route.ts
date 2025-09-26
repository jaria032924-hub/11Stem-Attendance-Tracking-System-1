import { type NextRequest, NextResponse } from "next/server"
import { getStudents, createStudent } from "@/lib/database"
import type { StudentFormData } from "@/lib/types"

export async function GET() {
  try {
    const students = await getStudents()
    return NextResponse.json(students)
  } catch (error) {
    console.error("Error in GET /api/students:", error)
    return NextResponse.json({ message: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: StudentFormData = await request.json()

    // Validate required fields
    if (!body.lrn || !body.name || !body.grade || !body.section) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Validate LRN format
    if (!/^\d{12}$/.test(body.lrn)) {
      return NextResponse.json({ message: "LRN must be exactly 12 digits" }, { status: 400 })
    }

    const student = await createStudent(body)
    return NextResponse.json(student, { status: 201 })
  } catch (error: any) {
    console.error("Error in POST /api/students:", error)

    // Handle unique constraint violation (duplicate LRN)
    if (error.code === "23505") {
      return NextResponse.json({ message: "A student with this LRN already exists" }, { status: 409 })
    }

    return NextResponse.json({ message: "Failed to create student" }, { status: 500 })
  }
}
