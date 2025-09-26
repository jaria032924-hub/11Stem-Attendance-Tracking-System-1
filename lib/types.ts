// Database types for the attendance system
export interface Student {
  id: string
  lrn: string
  name: string
  grade: string
  section: string
  parent_phone?: string
  student_phone?: string
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  id: string
  student_id: string
  lrn: string
  scan_timestamp: string
  scan_location: string
  status: string
  created_at: string
}

export interface AttendanceWithStudent extends AttendanceRecord {
  students: Student
}

export interface SMSLog {
  id: string
  student_id: string
  phone_number: string
  message: string
  status: "sent" | "failed" | "pending"
  provider: string
  message_id?: string
  error_message?: string
  sent_at?: string
  created_at: string
  students?: Student
}

// Form types
export interface StudentFormData {
  lrn: string
  name: string
  grade: string
  section: string
  parent_phone?: string
  student_phone?: string
}

// API response types
export interface ScanResult {
  success: boolean
  message: string
  student?: Student
  attendance?: AttendanceRecord
  alreadyScanned?: boolean
}

// Report types
export interface AttendanceStats {
  totalStudents: number
  presentToday: number
  absentToday: number
  attendanceRate: number
  totalScansToday: number
}

export interface GradeAttendance {
  grade: string
  totalStudents: number
  presentStudents: number
  attendanceRate: number
}

export interface DailyAttendance {
  date: string
  totalScans: number
  uniqueStudents: number
  attendanceRate: number
}
