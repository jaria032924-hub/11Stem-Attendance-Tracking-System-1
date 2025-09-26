import { type NextRequest, NextResponse } from "next/server"
import { getAttendanceStats } from "@/lib/reports"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    const stats = await getAttendanceStats(date || undefined)
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error in GET /api/reports/stats:", error)
    return NextResponse.json({ message: "Failed to fetch attendance statistics" }, { status: 500 })
  }
}
