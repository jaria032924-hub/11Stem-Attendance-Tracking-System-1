import { type NextRequest, NextResponse } from "next/server"
import { getStudentByLRN, recordAttendance, logSMSNotification } from "@/lib/database"
import { initializeDatabase, checkIfScannedToday } from "@/lib/database-init"
import { SMSService, getSMSConfig } from "@/lib/sms"

export async function POST(request: NextRequest) {
  try {
    const dbInitialized = await initializeDatabase()
    if (!dbInitialized) {
      console.log("[v0] Database initialization failed")
      return NextResponse.json(
        {
          success: false,
          message: "Database setup in progress. Please try again in a moment.",
        },
        { status: 503 },
      )
    }

    const { lrn, location = "School Gate" } = await request.json()

    if (!lrn) {
      return NextResponse.json({ success: false, message: "LRN is required" }, { status: 400 })
    }

    // Validate LRN format
    if (!/^\d{12}$/.test(lrn)) {
      return NextResponse.json({ success: false, message: "Invalid LRN format. Must be 12 digits." }, { status: 400 })
    }

    // Check if student exists
    const student = await getStudentByLRN(lrn)
    if (!student) {
      return NextResponse.json({ success: false, message: "Student not found. Please check the LRN." }, { status: 404 })
    }

    const alreadyScanned = await checkIfScannedToday(lrn)
    if (alreadyScanned) {
      return NextResponse.json({
        success: false,
        message: `${student.name} has already been marked present today.`,
        student: {
          name: student.name,
          grade: student.grade,
          section: student.section,
          lrn: student.lrn,
        },
        alreadyScanned: true,
      })
    }

    // Record attendance
    const attendance = await recordAttendance(lrn, location)

    try {
      const config = getSMSConfig()
      const smsService = new SMSService(config)

      // Send to parent phone if available
      if (student.parent_phone) {
        const smsResult = await smsService.sendAttendanceNotification(
          student.parent_phone,
          student.name,
          student.lrn,
          new Date(attendance.scan_timestamp),
          location,
        )

        // Log SMS attempt
        await logSMSNotification(
          student.id,
          student.parent_phone,
          `ATTENDANCE ALERT: ${student.name} (LRN: ${student.lrn}) has arrived at ${location}`,
          smsResult.success ? "sent" : "failed",
          config.provider,
          smsResult.messageId,
          smsResult.error,
        )
      }

      // Send to student phone if available and different from parent phone
      if (student.student_phone && student.student_phone !== student.parent_phone) {
        const smsResult = await smsService.sendAttendanceNotification(
          student.student_phone,
          student.name,
          student.lrn,
          new Date(attendance.scan_timestamp),
          location,
        )

        // Log SMS attempt
        await logSMSNotification(
          student.id,
          student.student_phone,
          `ATTENDANCE ALERT: You (${student.name}, LRN: ${student.lrn}) have arrived at ${location}`,
          smsResult.success ? "sent" : "failed",
          config.provider,
          smsResult.messageId,
          smsResult.error,
        )
      }
    } catch (smsError) {
      console.error("Error sending SMS notification:", smsError)
      // Don't fail the attendance recording if SMS fails
    }

    return NextResponse.json({
      success: true,
      message: `${student.name} marked as present successfully!`,
      student: {
        name: student.name,
        grade: student.grade,
        section: student.section,
        lrn: student.lrn,
      },
      attendance: {
        id: attendance.id,
        scan_timestamp: attendance.scan_timestamp,
        scan_location: attendance.scan_location,
        status: attendance.status,
      },
    })
  } catch (error: any) {
    console.error("Error in POST /api/attendance/scan:", error)
    if (error.message?.includes("Database setup incomplete")) {
      return NextResponse.json(
        {
          success: false,
          message: "Database setup incomplete. Please run the database setup scripts first.",
        },
        { status: 503 },
      )
    }
    return NextResponse.json({ success: false, message: "Internal server error. Please try again." }, { status: 500 })
  }
}
