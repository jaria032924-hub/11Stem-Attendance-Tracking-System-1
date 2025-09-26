import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

let isInitialized = false
let initializationPromise: Promise<boolean> | null = null

export async function initializeDatabase(): Promise<boolean> {
  // If already initialized, return true
  if (isInitialized) return true

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return await initializationPromise
  }

  // Start initialization
  initializationPromise = performInitialization()
  const result = await initializationPromise
  initializationPromise = null
  return result
}

async function performInitialization(): Promise<boolean> {
  try {
    console.log("[v0] Checking if attendance table exists...")

    // Simple approach: try to query the table with a limit of 0 to check existence
    const { error } = await supabase.from("attendance").select("id").limit(0)

    if (error) {
      // Check if it's a "table not found" error
      if (
        error.message.includes("Could not find the table") ||
        (error.message.includes("relation") && error.message.includes("does not exist"))
      ) {
        console.log("[v0] Attendance table does not exist")
        console.log("[v0] Please run the attendance table creation script: scripts/001_create_attendance_table.sql")
        return false
      }

      // Some other error occurred
      console.log("[v0] Error checking attendance table:", error)
      return false
    }

    console.log("[v0] Attendance table exists and is accessible")
    isInitialized = true
    return true
  } catch (error) {
    console.log("[v0] Database initialization error:", error)
    return false
  }
}

export async function checkIfScannedToday(lrn: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split("T")[0]
    const { data, error } = await supabase
      .from("attendance")
      .select("id")
      .eq("student_id", (await supabase.from("students").select("id").eq("lrn", lrn).single()).data?.id)
      .gte("scan_time", `${today}T00:00:00.000Z`)
      .lt("scan_time", `${today}T23:59:59.999Z`)
      .limit(1)

    if (error) {
      console.log("[v0] Error checking today scan:", error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.log("[v0] Error in checkIfScannedToday:", error)
    return false
  }
}

export async function getTodaysAttendance(lrn: string) {
  try {
    const today = new Date().toISOString().split("T")[0]

    // First get the student ID from LRN
    const { data: student, error: studentError } = await supabase.from("students").select("id").eq("lrn", lrn).single()

    if (studentError || !student) {
      console.log("[v0] Error finding student:", studentError)
      return []
    }

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", student.id)
      .gte("scan_time", `${today}T00:00:00.000Z`)
      .lt("scan_time", `${today}T23:59:59.999Z`)
      .order("scan_time", { ascending: false })

    if (error) {
      console.log("[v0] Error getting today attendance:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.log("[v0] Error in getTodaysAttendance:", error)
    return []
  }
}
