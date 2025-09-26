import { type NextRequest, NextResponse } from "next/server"
import { exportAttendanceCSV } from "@/lib/reports"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      grade: searchParams.get("grade") || undefined,
      section: searchParams.get("section") || undefined,
    }

    const csvData = await exportAttendanceCSV(filters)

    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attendance-report-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error in GET /api/reports/export:", error)
    return NextResponse.json({ message: "Failed to export attendance data" }, { status: 500 })
  }
}
