import { createClient } from "@/lib/supabase/server"
import type { AttendanceStats, GradeAttendance, DailyAttendance } from "@/lib/types"

export async function getAttendanceStats(date?: string): Promise<AttendanceStats> {
  const supabase = await createClient()
  const targetDate = date || new Date().toISOString().split("T")[0]

  // Get total students
  const { count: totalStudents } = await supabase.from("students").select("*", { count: "exact", head: true })

  // Get attendance for the target date
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  const { data: attendanceData } = await supabase
    .from("attendance")
    .select("student_id, lrn")
    .gte("scan_timestamp", startOfDay.toISOString())
    .lte("scan_timestamp", endOfDay.toISOString())

  // Get unique students who attended
  const uniqueStudentIds = new Set(attendanceData?.map((a) => a.student_id) || [])
  const presentToday = uniqueStudentIds.size
  const absentToday = (totalStudents || 0) - presentToday
  const attendanceRate = totalStudents ? (presentToday / totalStudents) * 100 : 0
  const totalScansToday = attendanceData?.length || 0

  return {
    totalStudents: totalStudents || 0,
    presentToday,
    absentToday,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
    totalScansToday,
  }
}

export async function getGradeAttendance(date?: string): Promise<GradeAttendance[]> {
  const supabase = await createClient()
  const targetDate = date || new Date().toISOString().split("T")[0]

  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  // Get all students grouped by grade
  const { data: students } = await supabase.from("students").select("id, grade")

  // Get attendance for the date
  const { data: attendance } = await supabase
    .from("attendance")
    .select("student_id")
    .gte("scan_timestamp", startOfDay.toISOString())
    .lte("scan_timestamp", endOfDay.toISOString())

  const attendedStudentIds = new Set(attendance?.map((a) => a.student_id) || [])

  // Group by grade and calculate stats
  const gradeStats = new Map<string, { total: number; present: number }>()

  students?.forEach((student) => {
    const current = gradeStats.get(student.grade) || { total: 0, present: 0 }
    current.total += 1
    if (attendedStudentIds.has(student.id)) {
      current.present += 1
    }
    gradeStats.set(student.grade, current)
  })

  return Array.from(gradeStats.entries())
    .map(([grade, stats]) => ({
      grade,
      totalStudents: stats.total,
      presentStudents: stats.present,
      attendanceRate: Math.round((stats.present / stats.total) * 10000) / 100,
    }))
    .sort((a, b) => a.grade.localeCompare(b.grade))
}

export async function getDailyAttendance(days = 7): Promise<DailyAttendance[]> {
  const supabase = await createClient()
  const results: DailyAttendance[] = []

  // Get total students count
  const { count: totalStudents } = await supabase.from("students").select("*", { count: "exact", head: true })

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    const startOfDay = new Date(dateStr)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(dateStr)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: attendance } = await supabase
      .from("attendance")
      .select("student_id")
      .gte("scan_timestamp", startOfDay.toISOString())
      .lte("scan_timestamp", endOfDay.toISOString())

    const uniqueStudents = new Set(attendance?.map((a) => a.student_id) || []).size
    const attendanceRate = totalStudents ? (uniqueStudents / totalStudents) * 100 : 0

    results.push({
      date: dateStr,
      totalScans: attendance?.length || 0,
      uniqueStudents,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
    })
  }

  return results
}

export async function exportAttendanceCSV(filters: {
  dateFrom?: string
  dateTo?: string
  grade?: string
  section?: string
}): Promise<string> {
  const supabase = await createClient()

  let query = supabase
    .from("attendance")
    .select(`
      *,
      students (
        name,
        grade,
        section,
        parent_phone
      )
    `)
    .order("scan_timestamp", { ascending: false })

  if (filters.dateFrom) {
    const startDate = new Date(filters.dateFrom)
    startDate.setHours(0, 0, 0, 0)
    query = query.gte("scan_timestamp", startDate.toISOString())
  }

  if (filters.dateTo) {
    const endDate = new Date(filters.dateTo)
    endDate.setHours(23, 59, 59, 999)
    query = query.lte("scan_timestamp", endDate.toISOString())
  }

  const { data: records } = await query

  if (!records || records.length === 0) {
    return "No data found for the specified criteria."
  }

  // Filter by grade and section if specified
  const filteredRecords = records.filter((record) => {
    const student = (record as any).students
    if (!student) return false

    if (filters.grade && student.grade !== filters.grade) return false
    if (filters.section && student.section !== filters.section) return false

    return true
  })

  // Generate CSV
  const headers = ["Date", "Time", "Student Name", "LRN", "Grade", "Section", "Location", "Status", "Parent Phone"]

  const csvRows = [headers.join(",")]

  filteredRecords.forEach((record) => {
    const student = (record as any).students
    const timestamp = new Date(record.scan_timestamp)
    const date = timestamp.toLocaleDateString()
    const time = timestamp.toLocaleTimeString()

    const row = [
      date,
      time,
      `"${student.name}"`,
      record.lrn,
      `"${student.grade}"`,
      `"${student.section}"`,
      `"${record.scan_location}"`,
      record.status,
      student.parent_phone || "",
    ]

    csvRows.push(row.join(","))
  })

  return csvRows.join("\n")
}
