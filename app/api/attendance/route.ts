import { type NextRequest, NextResponse } from "next/server"
import { getAttendanceRecords } from "@/lib/database"
import { initializeDatabase } from "@/lib/database-init"

export async function GET(request: NextRequest) {
  try {
    const dbInitialized = await initializeDatabase()
    if (!dbInitialized) {
      console.log("[v0] Database initialization failed - attendance table does not exist")
      return NextResponse.json(
        {
          message:
            "Database Setup Required - Unable to load recent scans. Please check if the database is properly set up.",
          error: "attendance_table_missing",
          instructions: "Please run the attendance table creation script to enable this feature.",
          records: [],
        },
        { status: 503 },
      )
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const grade = searchParams.get("grade")
    const section = searchParams.get("section")
    const studentName = searchParams.get("studentName")
    const limit = searchParams.get("limit")

    const filters: any = {}
    if (date) filters.date = date
    if (grade) filters.grade = grade
    if (section) filters.section = section
    if (studentName) filters.studentName = studentName

    let records = await getAttendanceRecords(filters)

    // Apply limit if specified
    if (limit) {
      const limitNum = Number.parseInt(limit, 10)
      if (!isNaN(limitNum) && limitNum > 0) {
        records = records.slice(0, limitNum)
      }
    }

    return NextResponse.json(records)
  } catch (error: any) {
    console.error("Error in GET /api/attendance:", error)

    if (error.message?.includes("Could not find the table")) {
      return NextResponse.json(
        {
          message: "Database Setup Required - The attendance table does not exist.",
          error: "attendance_table_missing",
          instructions: "Please run the attendance table creation script to enable this feature.",
          records: [],
        },
        { status: 503 },
      )
    }

    if (error.message?.includes("Database setup incomplete")) {
      return NextResponse.json(
        {
          message: "Database setup incomplete. Please run the database setup scripts first.",
          records: [],
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        message: "Failed to fetch attendance records",
        error: error.message || "Unknown error",
        records: [],
      },
      { status: 500 },
    )
  }
}
