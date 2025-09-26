import { createClient } from "@/lib/supabase/server"
import type { Student, StudentFormData, AttendanceRecord, SMSLog } from "@/lib/types"
import { checkIfScannedToday as fallbackCheckScanned } from "@/lib/database-init"

// Student database operations
export async function getStudents(): Promise<Student[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("students").select("*").order("name")

  if (error) {
    console.error("Error fetching students:", error)
    throw error
  }

  return data || []
}

export async function getStudentByLRN(lrn: string): Promise<Student | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("students").select("*").eq("lrn", lrn).single()

  if (error) {
    if (error.code === "PGRST116") {
      return null // No student found
    }
    console.error("Error fetching student by LRN:", error)
    throw error
  }

  return data
}

export async function createStudent(studentData: StudentFormData): Promise<Student> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("students").insert([studentData]).select().single()

  if (error) {
    console.error("Error creating student:", error)
    throw error
  }

  return data
}

export async function updateStudent(id: string, studentData: Partial<StudentFormData>): Promise<Student> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("students").update(studentData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating student:", error)
    throw error
  }

  return data
}

export async function deleteStudent(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from("students").delete().eq("id", id)

  if (error) {
    console.error("Error deleting student:", error)
    throw error
  }
}

// Attendance database operations
export async function recordAttendance(lrn: string, location = "School Gate"): Promise<AttendanceRecord> {
  const supabase = await createClient()

  // First get the student
  const student = await getStudentByLRN(lrn)
  if (!student) {
    throw new Error("Student not found")
  }

  try {
    const { data, error } = await supabase
      .from("attendance")
      .insert([
        {
          student_id: student.id,
          scan_type: location, // Using scan_type instead of scan_location to match schema
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error recording attendance:", error)
      throw error
    }

    return data
  } catch (error: any) {
    if (error.message?.includes('relation "public.attendance" does not exist')) {
      throw new Error("Database setup incomplete. Please run the attendance table creation script first.")
    }
    throw error
  }
}

export async function checkTodaysAttendance(lrn: string): Promise<boolean> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.rpc("has_scanned_today", { student_lrn: lrn })

    if (error) {
      console.error("Error checking today's attendance:", error)
      if (
        error.message?.includes('relation "public.attendance" does not exist') ||
        error.message?.includes("function public.has_scanned_today") ||
        error.code === "42P01"
      ) {
        console.log("[v0] Using fallback function for today's attendance check")
        return await fallbackCheckScanned(lrn)
      }
      throw error
    }

    return data || false
  } catch (error: any) {
    if (
      error.message?.includes('relation "public.attendance" does not exist') ||
      error.message?.includes("function public.has_scanned_today") ||
      error.code === "42P01"
    ) {
      console.log("[v0] Attendance table or function not found, using fallback function")
      return await fallbackCheckScanned(lrn)
    }
    throw error
  }
}

export async function getAttendanceRecords(filters?: {
  date?: string
  grade?: string
  section?: string
  studentName?: string
}): Promise<AttendanceRecord[]> {
  const supabase = await createClient()

  try {
    let query = supabase
      .from("attendance")
      .select(`
        *,
        students (
          name,
          grade,
          section,
          lrn
        )
      `)
      .order("scan_time", { ascending: false })

    if (filters?.date) {
      const startOfDay = new Date(filters.date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(filters.date)
      endOfDay.setHours(23, 59, 59, 999)

      query = query.gte("scan_time", startOfDay.toISOString()).lte("scan_time", endOfDay.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching attendance records:", error)
      throw error
    }

    return data || []
  } catch (error: any) {
    if (error.message?.includes('relation "public.attendance" does not exist') || error.code === "42P01") {
      // Table doesn't exist, return empty array
      console.log("[v0] Attendance table not found, returning empty records")
      return []
    }
    throw error
  }
}

// SMS notification logging
export async function logSMSNotification(
  studentId: string,
  phoneNumber: string,
  message: string,
  status: "sent" | "failed" | "pending",
  provider: string,
  messageId?: string,
  errorMessage?: string,
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from("sms_logs").insert([
    {
      student_id: studentId,
      phone_number: phoneNumber,
      message,
      status,
      provider,
      message_id: messageId,
      error_message: errorMessage,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    },
  ])

  if (error) {
    console.error("Error logging SMS notification:", error)
  }
}

export async function getSMSLogs(filters?: {
  studentId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}): Promise<SMSLog[]> {
  const supabase = await createClient()

  let query = supabase
    .from("sms_logs")
    .select(`
      *,
      students (
        name,
        lrn,
        grade,
        section
      )
    `)
    .order("created_at", { ascending: false })

  if (filters?.studentId) {
    query = query.eq("student_id", filters.studentId)
  }

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching SMS logs:", error)
    throw error
  }

  return data || []
}
