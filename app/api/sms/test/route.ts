import { type NextRequest, NextResponse } from "next/server"
import { SMSService, getSMSConfig } from "@/lib/sms"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 })
    }

    const config = getSMSConfig()
    const smsService = new SMSService(config)

    const result = await smsService.sendAttendanceNotification(
      phoneNumber,
      "Test Student",
      "123456789012",
      new Date(),
      "Test Location",
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error sending test SMS:", error)
    return NextResponse.json({ success: false, error: "Failed to send test SMS" }, { status: 500 })
  }
}
